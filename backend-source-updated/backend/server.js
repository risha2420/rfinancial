require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const formsRouter = require('./routes/forms');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env — copy .env.example to .env and fill it in.');
  process.exit(1);
}

// --- Middleware ---
app.use(express.json({ limit: '200kb' }));
app.use(
  cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*',
    methods: ['GET', 'POST'],
  })
);

// Basic abuse protection on the public form endpoints
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many submissions from this device. Please try again later.' }
});
app.use('/api', formLimiter);

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'r-financial-services-backend' }));
app.use('/api', formsRouter);

// --- 404 + error handling ---
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// --- Start ---
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`R Financial Services API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
