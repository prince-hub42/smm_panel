const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const shortid = require('shortid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_FILE = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(DB_FILE);

// Initialize DB
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT,
    price_per_unit REAL,
    min_qty INTEGER,
    max_qty INTEGER,
    active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    service_id TEXT,
    quantity INTEGER,
    total_price REAL,
    link TEXT,
    status TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS wallet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL DEFAULT 0
  )`);

  db.get(`SELECT COUNT(*) as c FROM wallet`, (err, row) => {
    if (row.c === 0) db.run(`INSERT INTO wallet(balance) VALUES(125.5)`);
  });

  db.get(`SELECT COUNT(*) as c FROM services`, (err, row) => {
    if (row.c === 0) {
      const insert = db.prepare(`INSERT INTO services(id,name,price_per_unit,min_qty,max_qty,active) VALUES(?,?,?,?,?,?)`);
      insert.run(shortid.generate(), 'Instagram Likes', 0.007, 10, 10000, 1);
      insert.run(shortid.generate(), 'YouTube Views', 0.004, 100, 1000000, 1);
      insert.finalize();
    }
  });
});

// Routes
app.get('/api/services', (req, res) => {
  db.all(`SELECT * FROM services WHERE active = 1`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/services', (req, res) => {
  const { name, price_per_unit, min_qty, max_qty } = req.body;
  const id = shortid.generate();
  db.run(`INSERT INTO services(id,name,price_per_unit,min_qty,max_qty,active) VALUES(?,?,?,?,?,1)`,
    [id, name, price_per_unit, min_qty, max_qty], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, price_per_unit, min_qty, max_qty });
    });
});

app.get('/api/orders', (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 50`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/orders', (req, res) => {
  const { service_id, quantity, link } = req.body;
  if (!service_id || !quantity) return res.status(400).json({ error: 'service_id and quantity required' });

  db.get(`SELECT * FROM services WHERE id = ?`, [service_id], (err, service) => {
    if (!service) return res.status(404).json({ error: 'service not found' });
    if (quantity < service.min_qty || quantity > service.max_qty) {
      return res.status(400).json({ error: `quantity must be between ${service.min_qty} and ${service.max_qty}` });
    }
    const total = +(quantity * service.price_per_unit).toFixed(4);
    const id = shortid.generate();
    const created_at = new Date().toISOString();
    db.run(`INSERT INTO orders(id,service_id,quantity,total_price,link,status,created_at) VALUES(?,?,?,?,?,?,?)`,
      [id, service_id, quantity, total, link || '', 'Processing', created_at], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        setTimeout(() => {
          db.run(`UPDATE orders SET status = 'Completed' WHERE id = ?`, [id]);
        }, 3000);
        res.json({ id, service_id, quantity, total_price: total, status: 'Processing', created_at });
      });
  });
});

app.post('/api/wallet/topup', (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'invalid amount' });
  db.run(`UPDATE wallet SET balance = balance + ? WHERE id = 1`, [amount], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT balance FROM wallet WHERE id = 1`, (err, row) => {
      res.json({ balance: row.balance });
    });
  });
});

app.get('/api/wallet', (req, res) => {
  db.get(`SELECT balance FROM wallet WHERE id = 1`, (err, row) => {
    res.json({ balance: row.balance });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
