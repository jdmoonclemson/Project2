const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET = 'super-secret-key'; // move to env in real apps

app.use(express.json());
app.use(cors());

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // your MySQL password
  database: 'pokedex_app',
});

// Middleware to authenticate user via JWT\async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });


// Register
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    await pool.execute('UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?', [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get favorites
app.get('/favorites', authenticateToken, async (req, res) => {
  const [favorites] = await pool.execute('SELECT pokemon_id FROM favorites WHERE user_id = ?', [req.user.id]);
  res.json(favorites);
});

// Add favorite
app.post('/favorites', authenticateToken, async (req, res) => {
  const { pokemon_id } = req.body;
  try {
    await pool.execute(
      'INSERT INTO favorites (user_id, pokemon_id) VALUES (?, ?)',
      [req.user.id, pokemon_id]
    );
    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove favorite
app.delete('/favorites/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(
      'DELETE FROM favorites WHERE user_id = ? AND pokemon_id = ?',
      [req.user.id, id]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: get users
app.get('/admin/users', async (req, res) => {
  const [users] = await pool.execute(
    'SELECT id, name, email, created_at, last_login, login_count FROM users'
  );
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
