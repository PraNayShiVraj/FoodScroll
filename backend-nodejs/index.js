const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const { upload, cloudinary } = require('./config/cloudinary');



const app = express();
app.use(cors({
  origin: '*', // For debugging, let's allow all origins
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send({ status: 'active', message: 'Node.js server is live' });
});

const otpRoutes = require('./services/send_otp');
const uploadRoutes = require('./config/upload');
app.use('/', otpRoutes);
app.use('/api/upload', uploadRoutes);

const editRoutes = require('./routes/edit');
const loginRoutes = require('./user/login');
const registerRoutes = require('./user/register');
const profileRoutes = require('./routes/profile');
const googleAuthRoutes = require('./routes/google-auth');
const searchRoutes = require('./routes/search');
const followRoutes = require('./config/follower_following_db');

app.use('/', editRoutes);
app.use('/', loginRoutes);
app.use('/', registerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/', googleAuthRoutes);
app.use('/api', searchRoutes);
app.use('/api', followRoutes);

const interactionsRoutes = require('./routes/interactions');
app.use('/api/interactions', interactionsRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  console.log(`[404] ${req.method} ${req.url}`);
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ detail: `Route ${req.method} ${req.url} not found` });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ detail: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));