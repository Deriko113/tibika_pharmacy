require('dotenv/config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/getEnv');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medications', require('./routes/medicationRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date()
    });
});

// IMPORTANT: DO NOT use initDatabase on Vercel
if (process.env.NODE_ENV !== 'production') {
    const { initDatabase } = require('./config/database');

    initDatabase()
        .then(() => console.log('✅ DB initialized (dev only)'))
        .catch(err => console.error('DB init error:', err));
}

// LOCAL DEVELOPMENT ONLY
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// VERCEL EXPORT
module.exports = app;