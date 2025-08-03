// server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('./models/user');
const bcrypt = require('bcrypt');
const { createProxyMiddleware } = require('http-proxy-middleware');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret123'; // ideally from .env



// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON in requests (important for login/register POST requests)
app.use(express.json());
app.use(express.static(__dirname, { index: 'index.html' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Test route
// app.get('/', (req, res) => {
//   res.send('Server is running!');
// });

// ✳️ Placeholder routes for login and register
// These will be implemented later

// Login
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    user.online = true;
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- 🔐 Logout
app.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { online: false });
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(auth, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}



// Registration
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });

  } catch (err) {
    console.error('❌ Error in register:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// העברת בקשות אל Flask
// העברת בקשות אל Flask
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',  // Flask
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));



// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
