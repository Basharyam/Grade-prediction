// server.js
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const User = require('./models/user');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

/* ---------- Proxy to Flask (Python service) ---------- */
app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://127.0.0.1:5002',
    changeOrigin: true,
    logLevel: 'debug',
  })
);

/* ---------- Core middleware ---------- */
app.use(express.json());

// Serve static assets
app.use('/css', express.static(path.join(__dirname, '../../static/css')));
app.use('/js', express.static(path.join(__dirname, '../../static/js')));
app.use('/images', express.static(path.join(__dirname, '../../static/images')));

/* ---------- Database ---------- */
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

/* ---------- Auth middleware ---------- */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

/* ---------- Auth routes (API) ---------- */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.online = true;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, lastLogin: user.lastLogin },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { online: false });
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

  try {
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) return res.status(409).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email: email.trim().toLowerCase(), password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('❌ Error in register:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- User management (API) ---------- */
app.get('/api/users', async (_req, res) => {
  try {
    const users = await User.find({}, 'name email lastLogin');
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email: email.trim().toLowerCase() },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------- Page routes (no .html in URL) ---------- */
const HTML_DIR = path.join(__dirname, '../../static/html');
app.get('/', (_req, res) => res.sendFile(path.join(HTML_DIR, 'index.html')));
app.get('/index', (_req, res) => res.sendFile(path.join(HTML_DIR, 'index.html')));
app.get('/about', (_req, res) => res.sendFile(path.join(HTML_DIR, 'about.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(HTML_DIR, 'admin.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(HTML_DIR, 'login.html')));
app.get('/predict', (_req, res) => res.sendFile(path.join(HTML_DIR, 'predict.html')));
app.get('/register', (_req, res) => res.sendFile(path.join(HTML_DIR, 'register.html')));

// Optional: alias /index to the home page if you need it
// app.get('/index', (_req, res) => res.redirect('/')); // This line is removed as per the new_code

/* ---------- 404 fallback ---------- */
app.use((req, res) => {
  res.status(404).send('Not found');
});

/* ---------- Start server ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});