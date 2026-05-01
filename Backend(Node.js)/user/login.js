const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ detail: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ detail: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_123',
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, message: "Login successful", user: { name: user.name, username: user.username, email: user.email, profilePic: user.profilePic, bio: user.bio, lastUsernameChange: user.lastUsernameChange, phonenumber: user.phonenumber, createdAt: user.createdAt } });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Server error" });
  }
});

module.exports = router;
