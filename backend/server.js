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

// Register Passport Google strategy
require('./src/controllers/googleAuthController');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
// Allow requests from Vercel production URL and localhost dev server
const allowedOrigins = [
  process.env.CLIENT_URL,          
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Always allow localhost during development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Allow ANY vercel deployment domain so Vercel frontend always works
    if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io connection
app.set('io', io);

io.on('connection', (socket) => {
  // console.log(`Socket connected: ${socket.id}`);
  
  // Clients will emit 'join' with their user ID so we can send targeted notifications
  socket.on('join', (userId) => {
    socket.join(userId);
    // console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    // console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
