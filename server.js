const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/food-items', require('./routes/foodItems'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/stats', require('./routes/stats'));

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/:page', (req, res) => {
  const file = path.join(__dirname, 'public', 'pages', `${req.params.page}.html`);
  res.sendFile(file, err => { if (err) res.sendFile(path.join(__dirname, 'public', 'index.html')); });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
