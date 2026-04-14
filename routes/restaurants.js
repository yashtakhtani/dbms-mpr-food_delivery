const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM restaurant ORDER BY restaurant_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { restaurant_id, restaurant_name, rating, phone, location } = req.body;
  try {
    await db.query('INSERT INTO restaurant VALUES (?, ?, ?, ?, ?)',
      [restaurant_id, restaurant_name, rating, phone, location]);
    res.status(201).json({ message: 'Restaurant added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { restaurant_name, rating, phone, location } = req.body;
  try {
    await db.query('UPDATE restaurant SET restaurant_name=?, rating=?, phone=?, location=? WHERE restaurant_id=?',
      [restaurant_name, rating, phone, location, req.params.id]);
    res.json({ message: 'Restaurant updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM restaurant WHERE restaurant_id = ?', [req.params.id]);
    res.json({ message: 'Restaurant deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
