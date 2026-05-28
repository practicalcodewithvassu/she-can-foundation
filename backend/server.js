const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'She Can Foundation backend is running.',
    routes: [
      { method: 'GET', path: '/api/health' },
      { method: 'POST', path: '/api/form' },
      { method: 'POST', path: '/api/admin/login' },
      { method: 'GET', path: '/api/admin/submissions' }
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const formRouter = require('./routes/form');
const adminRouter = require('./routes/admin');
app.use('/api/form', formRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('MongoDB connected');
    } catch (err) {
      console.warn('MongoDB connection failed:', err.message);
    }
  } else {
    console.log('MONGO_URI not set; running without DB persistence');
  }

  const tryListen = (port, attemptsLeft = 5) => {
    const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is in use.`);
        if (attemptsLeft > 0) {
          const next = port + 1;
          console.log(`Trying port ${next}...`);
          setTimeout(() => tryListen(next, attemptsLeft - 1), 200);
        } else {
          console.error(`No available ports found (tried ${port - attemptsLeft}-${port}). Set PORT or free a port.`);
          process.exit(1);
        }
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  };

  tryListen(Number(PORT), 5);
};

start();
