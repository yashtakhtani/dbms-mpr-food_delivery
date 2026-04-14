# FoodFlow — Online Food Ordering System

**DBMS Mini Project (Experiment 12)** — GUI with Backend Connectivity

By: Yash Takhtani (2403172) & Piyush Singh (2403165) — SE C32

---

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (separate files)
- **Backend:** Node.js + Express.js
- **Database:** MySQL

## Setup Instructions

### 1. Prerequisites
- **Node.js** (v16+) — [Download](https://nodejs.org)
- **MySQL** (v8+) — [Download](https://dev.mysql.com/downloads/)

### 2. Setup Database
Run your SQL file in MySQL to create the `online_order` database with all tables and data:
```bash
mysql -u root -p < DBMS_MPR.sql
```

### 3. Configure Environment
Edit the `.env` file in the project root:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=online_order
PORT=3000
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### 6. Open in Browser
Visit `http://localhost:3000`

---

## Project Structure
```
├── server.js              # Express server entry point
├── config/db.js           # MySQL connection pool
├── routes/                # API routes
│   ├── customers.js
│   ├── restaurants.js
│   ├── drivers.js
│   ├── foodItems.js
│   ├── orders.js
│   ├── payments.js
│   └── stats.js
├── public/                # Frontend files
│   ├── index.html         # Dashboard
│   ├── css/style.css      # Stylesheet
│   ├── js/
│   │   ├── utils.js       # Shared utilities
│   │   └── customers.js   # Customer page logic
│   └── pages/             # Individual pages
│       ├── customers.html
│       ├── restaurants.html
│       ├── menu.html
│       ├── orders.html
│       ├── drivers.html
│       └── payments.html
├── .env                   # Environment config
└── package.json
```

## Features
- Full CRUD for Customers, Restaurants, Drivers, Food Items, Payments
- Place & delete Orders with food item associations
- Dashboard with live stats from the database
- Search & filter on every table
- All operations reflect directly in the MySQL database
