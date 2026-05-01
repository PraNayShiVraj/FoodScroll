require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('../models/User.js');
    const users = await User.find({}).lean();
    console.log(JSON.stringify(users.map(u => ({ email: u.email, phonenumber: u.phonenumber, createdAt: u.createdAt })), null, 2));
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
