const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [[cust]] = await db.query('SELECT COUNT(*) as count FROM customer');
    const [[rest]] = await db.query('SELECT COUNT(*) as count FROM restaurant');
    const [[ord]] = await db.query('SELECT COUNT(*) as count FROM orders');
    const [[rev]] = await db.query('SELECT COALESCE(SUM(amount),0) as total FROM orders');
    const [[food]] = await db.query('SELECT COUNT(*) as count FROM food_item');
    const [[drivers]] = await db.query('SELECT COUNT(*) as count FROM delivery_driver');
    res.json({
      customers: cust.count,
      restaurants: rest.count,
      orders: ord.count,
      revenue: rev.total,
      foodItems: food.count,
      drivers: drivers.count
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
