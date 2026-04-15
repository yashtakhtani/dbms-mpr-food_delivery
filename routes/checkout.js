const express = require('express');
const router = express.Router();
const db = require('../config/db');

const PAYMENT_METHODS = new Set(['UPI', 'CARD', 'COD']);

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

router.post('/', async (req, res) => {
  const { restaurant_id, items, customer, payment_method } = req.body || {};

  if (!restaurant_id) return res.status(400).json({ error: 'restaurant_id is required.' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty.' });
  if (!customer || typeof customer !== 'object') return res.status(400).json({ error: 'customer details are required.' });
  if (!PAYMENT_METHODS.has(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment_method. Use UPI, CARD, or COD.' });
  }

  const customerName = String(customer.customer_name || '').trim();
  const customerAddress = String(customer.address || '').trim();
  const customerEmail = String(customer.email || '').trim();
  const customerPhone = normalizePhone(customer.phone);

  if (!customerName) return res.status(400).json({ error: 'Customer name is required.' });
  if (!customerAddress) return res.status(400).json({ error: 'Delivery address is required.' });
  if (!/^\d{10,15}$/.test(customerPhone)) return res.status(400).json({ error: 'Phone must be 10 to 15 digits.' });

  const normalizedItems = items
    .map((i) => ({
      food_name: String(i.food_name || '').trim(),
      qty: Number(i.qty)
    }))
    .filter((i) => i.food_name && Number.isFinite(i.qty) && i.qty > 0);

  if (!normalizedItems.length) return res.status(400).json({ error: 'No valid items in cart.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [restaurants] = await conn.query(
      'SELECT restaurant_id, restaurant_name FROM restaurant WHERE restaurant_id = ?',
      [restaurant_id]
    );
    if (!restaurants.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Selected restaurant does not exist.' });
    }

    const lowerNames = normalizedItems.map((i) => i.food_name.toLowerCase());
    const [menuRows] = await conn.query(
      `
        SELECT food_name, price, restaurant_id, LOWER(food_name) AS key_name
        FROM food_item
        WHERE LOWER(food_name) IN (?)
      `,
      [lowerNames]
    );

    const menuMap = new Map(menuRows.map((r) => [r.key_name, r]));
    const invalid = [];
    const restaurantMismatch = [];
    for (const item of normalizedItems) {
      const row = menuMap.get(item.food_name.toLowerCase());
      if (!row) {
        invalid.push(item.food_name);
      } else if (Number(row.restaurant_id) !== Number(restaurant_id)) {
        restaurantMismatch.push(item.food_name);
      }
    }

    if (invalid.length) {
      await conn.rollback();
      return res.status(400).json({
        error: `Unknown food item(s): ${invalid.join(', ')}. Add them in Menu first (names must match).`
      });
    }

    if (restaurantMismatch.length) {
      await conn.rollback();
      return res.status(400).json({
        error: `These items do not belong to selected restaurant: ${restaurantMismatch.join(', ')}.`
      });
    }

    let subtotal = 0;
    const persistedItems = normalizedItems.map((i) => {
      const menu = menuMap.get(i.food_name.toLowerCase());
      const unitPrice = Number(menu.price);
      const lineTotal = unitPrice * i.qty;
      subtotal += lineTotal;
      return {
        food_name: menu.food_name,
        qty: i.qty,
        unit_price: unitPrice,
        line_total: lineTotal
      };
    });

    const deliveryFee = 40;
    const grandTotal = subtotal + deliveryFee;

    const customerId = `CUST${Date.now().toString().slice(-8)}`;
    const [[paymentSeq]] = await conn.query('SELECT COALESCE(MAX(payment_id), 0) + 1 AS next_id FROM payment');
    const [[orderSeq]] = await conn.query('SELECT COALESCE(MAX(order_id), 0) + 1 AS next_id FROM orders');
    const paymentId = Number(paymentSeq.next_id);
    const orderId = Number(orderSeq.next_id);

    await conn.query(
      'INSERT INTO customer (customer_id, customer_name, email, address) VALUES (?, ?, ?, ?)',
      [customerId, customerName, customerEmail, customerAddress]
    );
    await conn.query(
      'INSERT INTO customer_phone (customer_id, phone) VALUES (?, ?)',
      [customerId, customerPhone]
    );

    const [drivers] = await conn.query('SELECT driver_id FROM delivery_driver ORDER BY RAND() LIMIT 1');
    const driverId = drivers.length ? drivers[0].driver_id : null;

    await conn.query(
      'INSERT INTO payment (payment_id, payment_status, amount, payment_date, payment_method) VALUES (?, ?, ?, ?, ?)',
      [paymentId, 'SUCCESS', grandTotal, new Date(), payment_method]
    );

    await conn.query(
      `
        INSERT INTO orders (
          order_id, order_date, amount, customer_id, restaurant_id, driver_id, payment_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [orderId, new Date(), grandTotal, customerId, restaurant_id, driverId, paymentId]
    );

    for (const item of persistedItems) {
      await conn.query('INSERT INTO order_food (order_id, food_name) VALUES (?, ?)', [orderId, item.food_name]);
    }

    await conn.commit();

    res.status(201).json({
      message: 'Order placed successfully.',
      order: {
        order_id: orderId,
        payment_id: paymentId,
        customer_id: customerId,
        restaurant_id: Number(restaurant_id),
        payment_status: 'SUCCESS',
        payment_method,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: grandTotal,
        items: persistedItems
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
