const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateOTP, verifyOTP } = require('./otp_service');

// Send OTP Endpoint
router.post('/send-otp', async (req, res) => {
  const { email, username } = req.body;
  if (!email) {
    return res.status(400).json({ detail: "Email is required" });
  }

  try {
    // Check if email or username is already taken first
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ detail: "User with this email already exists" });
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ detail: "Username is already taken" });
      }
    }

    generateOTP(email);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ detail: "Failed to send OTP" });
  }
});

// Verify OTP Endpoint
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ detail: "Email and OTP are required" });
  }

  const isValid = verifyOTP(email, otp);
  if (!isValid) {
    return res.status(400).json({ detail: "Invalid or expired OTP" });
  }

  res.json({ message: "OTP verified successfully" });
});

// Authenticated Send OTP Endpoint
router.post('/send-otp-auth', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }
    generateOTP(user.email);
    res.json({ message: "OTP sent successfully to your registered email" });
  } catch (error) {
    console.error("Auth OTP Error:", error);
    res.status(500).json({ detail: "Failed to send OTP" });
  }
});

// Update Credentials Endpoint
router.put('/update-credentials', auth, async (req, res) => {
  const { otp, newPassword } = req.body;
  if (!otp || !newPassword) {
    return res.status(400).json({ detail: "OTP and new password are required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    const isValid = verifyOTP(user.email, otp);
    if (!isValid) {
      return res.status(400).json({ detail: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update Credentials Error:", error);
    res.status(500).json({ detail: "Failed to update credentials" });
  }
});

module.exports = router;
