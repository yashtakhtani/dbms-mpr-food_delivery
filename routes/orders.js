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
      SELECT of.food_name, fi.price FROM order_food of
      LEFT JOIN food_item fi ON of.food_name = fi.food_name
      WHERE of.order_id = ?
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
    if (foods && foods.length) {
      for (const food of foods) {
        await conn.query('INSERT INTO order_food VALUES (?, ?)', [order_id, food]);
      }
    }
    await conn.commit();
    res.status(201).json({ message: 'Order placed' });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE order_id = ?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
