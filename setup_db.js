const db = require('./config/db');

async function setup() {
  try {
    console.log('Setting up database...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role ENUM('admin', 'staff') DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table ready.');
    process.exit(0);
  } catch (err) {
    console.error('Database setup failed:', err);
    process.exit(1);
  }
}

setup();
