/**
 * server.js — Entry point del backend Mediantem.
 * Crea la app Express, aplica middlewares globales,
 * monta routers bajo /api, inicia el servidor.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { env } = require('./src/config/env');
const { initDatabase } = require('./src/config/database');
const errorHandler = require('./src/middlewares/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const reviewRoutes = require('./src/routes/reviews');
const forumRoutes = require('./src/routes/forum');
const wishlistRoutes = require('./src/routes/wishlist');
const statsRoutes = require('./src/routes/stats');

const app = express();

// ─── Middlewares globales ──────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// ─── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Mediantem API is running', timestamp: new Date().toISOString() });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/stats', statsRoutes);

// ─── Error handler (must be last) ─────────────────────────
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────
const PORT = env.PORT || 3001;

// Initialize database before starting server
initDatabase();

app.listen(PORT, () => {
    console.log(`✅ Mediantem API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Environment: ${env.NODE_ENV}`);
});

module.exports = app;
