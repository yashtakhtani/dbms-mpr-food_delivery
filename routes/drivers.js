const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM delivery_driver ORDER BY driver_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { driver_id, driver_name, driver_phone, driver_address } = req.body;
  try {
    await db.query('INSERT INTO delivery_driver VALUES (?, ?, ?, ?)',
      [driver_id, driver_name, driver_phone, driver_address]);
    res.status(201).json({ message: 'Driver added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { driver_name, driver_phone, driver_address } = req.body;
  try {
    await db.query('UPDATE delivery_driver SET driver_name=?, driver_phone=?, driver_address=? WHERE driver_id=?',
      [driver_name, driver_phone, driver_address, req.params.id]);
    res.json({ message: 'Driver updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM delivery_driver WHERE driver_id = ?', [req.params.id]);
    res.json({ message: 'Driver deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
