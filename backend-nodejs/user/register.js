const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Endpoint
router.post('/register', async (req, res) => {
  const { name, username, email, phonenumber, password } = req.body;
  try {
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ detail: "User with this email already exists" });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ detail: "Username is already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = new User({ name, username, email, phonenumber, password: hashedPassword });
    await user.save();

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
        res.json({ token, message: "User registered successfully", user: { name: user.name, username: user.username, email: user.email, profilePic: user.profilePic, bio: user.bio, lastUsernameChange: user.lastUsernameChange, phonenumber: user.phonenumber, createdAt: user.createdAt } });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Server error" });
  }
});

module.exports = router;
