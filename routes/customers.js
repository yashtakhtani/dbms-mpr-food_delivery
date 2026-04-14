const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, GROUP_CONCAT(cp.phone) as phones
      FROM customer c LEFT JOIN customer_phone cp ON c.customer_id = cp.customer_id
      GROUP BY c.customer_id ORDER BY c.customer_id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customer WHERE customer_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const [phones] = await db.query('SELECT phone FROM customer_phone WHERE customer_id = ?', [req.params.id]);
    res.json({ ...rows[0], phones: phones.map(p => p.phone) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { customer_id, customer_name, email, address, phones } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('INSERT INTO customer VALUES (?, ?, ?, ?)', [customer_id, customer_name, email, address]);
    if (phones && phones.length) {
      for (const phone of phones) {
        await conn.query('INSERT INTO customer_phone VALUES (?, ?)', [customer_id, phone]);
      }
    }
    await conn.commit();
    res.status(201).json({ message: 'Customer added' });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

router.put('/:id', async (req, res) => {
  const { customer_name, email, address, phones } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE customer SET customer_name=?, email=?, address=? WHERE customer_id=?',
      [customer_name, email, address, req.params.id]);
    await conn.query('DELETE FROM customer_phone WHERE customer_id=?', [req.params.id]);
    if (phones && phones.length) {
      for (const phone of phones) {
        await conn.query('INSERT INTO customer_phone VALUES (?, ?)', [req.params.id, phone]);
      }
    }
    await conn.commit();
    res.json({ message: 'Customer updated' });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM customer WHERE customer_id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
