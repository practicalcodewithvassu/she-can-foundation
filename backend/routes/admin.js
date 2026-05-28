const express = require('express');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const router = express.Router();

const getAdminUser = () => process.env.ADMIN_USER || 'admin';
const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'password';
const getJwtSecret = () => process.env.JWT_SECRET || 'change-this-secret';

const authenticate = (req, res, next) => {
  const authHeader = req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.get('/', (req, res) => {
  res.json({
    message: 'Admin API is available',
    routes: [
      { method: 'POST', path: '/api/admin/login' },
      { method: 'GET', path: '/api/admin/submissions', auth: 'Bearer token' }
    ]
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username !== getAdminUser() || password !== getAdminPassword()) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { sub: username, type: 'admin' },
    getJwtSecret(),
    { expiresIn: '4h' }
  );

  res.json({ token, expiresIn: 4 * 60 * 60 });
});

router.get('/submissions', authenticate, async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  try {
    const submissions = await Message.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');

    res.json({ submissions });
  } catch (err) {
    console.error('Admin submissions error:', err);
    res.status(500).json({ error: 'Unable to fetch submissions' });
  }
});

module.exports = router;
