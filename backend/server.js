const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const http = require('http');
const { Server } = require('socket.io');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');
const passport = require('passport');
const session = require('express-session');

// Load env vars
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// Process-level safety guards to prevent unhandled errors from terminating the process
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

// Register Passport Google strategy
require('./src/controllers/googleAuthController');

// Connect to database
connectDB();

const app = express();
// Enable trust proxy for cloud hosting behind reverse proxies (Render, Vercel, Heroku)
app.set('trust proxy', 1);

const server = http.createServer(app);
// Allow requests from Vercel production URL, Render, and localhost dev server
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://farm-bazar.vercel.app',
  'https://farmbazar-backend-lpu4.onrender.com',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Always allow localhost during development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    
    // Allow ANY vercel deployment domain so Vercel frontend always works
    if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // Allow ANY onrender domain
    if (origin.endsWith('.onrender.com') || origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }

    // Fallback: allow all in production to avoid unexpected blocking
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

const io = new Server(server, {
  cors: corsOptions,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Session middleware (only used during OAuth redirect flow)
app.use(
  session({
    secret: process.env.JWT_SECRET || 'farmdirect-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 }, // 10 min — just for OAuth
  })
);

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint for Render / monitoring services
app.get(['/', '/health', '/api/health'], (req, res) => {
  const mongoose = require('mongoose');
  res.status(200).json({
    status: 'ok',
    message: 'FarmBazar API is running...',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected',
  });
});

// Define Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/uploads', require('./src/routes/uploadRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/contact', require('./src/routes/contactRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io connection
app.set('io', io);

io.on('connection', (socket) => {
  // Clients will emit 'join' with their user ID so we can send targeted notifications
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {});
});

// Keep-Alive Service to prevent Render free instance from spinning down (sleeping)
const setupKeepAlive = () => {
  const serviceUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://farmbazar-backend-lpu4.onrender.com' : null);

  if (serviceUrl && !process.env.VERCEL) {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (Render spins down after 15 min)
    setInterval(() => {
      try {
        const pingUrl = `${serviceUrl.replace(/\/$/, '')}/health`;
        const protocol = pingUrl.startsWith('https') ? require('https') : require('http');
        protocol.get(pingUrl, (res) => {
          console.log(`[Keep-Alive] Self-ping status: ${res.statusCode} at ${new Date().toLocaleTimeString('en-IN')}`);
        }).on('error', (err) => {
          console.warn(`[Keep-Alive] Ping failed:`, err.message);
        });
      } catch (err) {
        console.warn(`[Keep-Alive] Error:`, err.message);
      }
    }, PING_INTERVAL);
    console.log(`[Keep-Alive] Auto-ping active for ${serviceUrl} (every 14m)`);
  }
};

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    setupKeepAlive();
  });
}

// Export for Vercel
module.exports = app;
