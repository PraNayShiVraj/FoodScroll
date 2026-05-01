const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🚀 MongoDB Connected...');
  } catch (err) {
    console.error('❌ Connection Error:', err.message);
    process.exit(1); // Stop the app if it can't connect
  }
};

module.exports = connectDB;