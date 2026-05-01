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
app.use(cors());
app.use(express.json()); // Essential for parsing JSON in 2026

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send({ status: 'active', message: 'Node.js server is live' });
});

const otpRoutes = require('./services/send_otp');
app.use('/', otpRoutes);

const editRoutes = require('./routes/edit');
const loginRoutes = require('./user/login');
const registerRoutes = require('./user/register');
const profileRoutes = require('./routes/profile');

app.use('/', editRoutes);
app.use('/', loginRoutes);
app.use('/', registerRoutes);
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));