const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, r.restaurant_name, r.rating AS restaurant_rating FROM food_item f
      LEFT JOIN restaurant r ON f.restaurant_id = r.restaurant_id
      ORDER BY f.food_name
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { food_name, price, restaurant_id } = req.body;
  try {
    await db.query('INSERT INTO food_item VALUES (?, ?, ?)', [food_name, price, restaurant_id]);
    res.status(201).json({ message: 'Food item added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:name', async (req, res) => {
  const { price, restaurant_id } = req.body;
  try {
    await db.query('UPDATE food_item SET price=?, restaurant_id=? WHERE food_name=?',
      [price, restaurant_id, req.params.name]);
    res.json({ message: 'Food item updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:name', async (req, res) => {
  try {
    await db.query('DELETE FROM food_item WHERE food_name = ?', [req.params.name]);
    res.json({ message: 'Food item deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
