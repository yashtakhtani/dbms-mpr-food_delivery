const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payment ORDER BY payment_id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  let { payment_id, payment_status, amount, payment_date, payment_method } = req.body;
  try {
    if (!payment_id) {
      const [[next]] = await db.query('SELECT COALESCE(MAX(payment_id), 0) + 1 AS next_id FROM payment');
      payment_id = next.next_id;
    }
    await db.query('INSERT INTO payment VALUES (?, ?, ?, ?, ?)',
      [payment_id, payment_status, amount, payment_date || new Date(), payment_method]);
    res.status(201).json({ message: 'Payment added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { payment_status, amount, payment_date, payment_method } = req.body;
  try {
    await db.query('UPDATE payment SET payment_status=?, amount=?, payment_date=?, payment_method=? WHERE payment_id=?',
      [payment_status, amount, payment_date || new Date(), payment_method, req.params.id]);
    res.json({ message: 'Payment updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM payment WHERE payment_id = ?', [req.params.id]);
    res.json({ message: 'Payment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
