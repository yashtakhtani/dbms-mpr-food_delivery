const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, c.customer_name, r.restaurant_name, d.driver_name,
        p.payment_status, p.payment_method
      FROM orders o
      LEFT JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN restaurant r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN delivery_driver d ON o.driver_id = d.driver_id
      LEFT JOIN payment p ON o.payment_id = p.payment_id
      ORDER BY o.order_id DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/foods', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ofr.food_name, fi.price FROM order_food AS ofr
      LEFT JOIN food_item fi ON ofr.food_name = fi.food_name
      WHERE ofr.order_id = ?
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { order_id, order_date, amount, customer_id, restaurant_id, driver_id, payment_id, foods } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)',
      [order_id, order_date, amount, customer_id, restaurant_id, driver_id, payment_id]);

    const normalizedFoods = Array.isArray(foods)
      ? foods.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (normalizedFoods.length) {
      // Validate food names exist to avoid FK errors and give a clearer response.
      const lowerFoods = normalizedFoods.map((f) => f.toLowerCase());
      const [existing] = await conn.query(
        'SELECT food_name, LOWER(food_name) AS k FROM food_item WHERE LOWER(food_name) IN (?)',
        [lowerFoods]
      );

      const map = new Map(existing.map((r) => [r.k, r.food_name]));
      const missing = lowerFoods.filter((k) => !map.has(k));
      if (missing.length) {
        await conn.rollback();
        return res.status(400).json({
          error: `Unknown food item(s): ${missing.join(', ')}. Add them in Menu first (names must match).`
        });
      }

      for (const k of lowerFoods) {
        await conn.query('INSERT INTO order_food VALUES (?, ?)', [order_id, map.get(k)]);
      }
    }
    await conn.commit();
    res.status(201).json({ message: 'Order placed' });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

router.delete('/:id', async (req, res) => {
  const orderId = req.params.id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM order_food WHERE order_id = ?', [orderId]);
    const [result] = await conn.query('DELETE FROM orders WHERE order_id = ?', [orderId]);
    await conn.commit();

    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
