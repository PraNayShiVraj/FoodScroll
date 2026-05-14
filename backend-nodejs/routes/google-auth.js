const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyGoogleToken = require('../middleware/googleAuth');

/**
 * POST /auth/google
 * 
 * Handles Google OAuth login/signup using the Authorization Code flow.
 * The verifyGoogleToken middleware exchanges the authorization code
 * for tokens using GOOGLE_CLIENT_SECRET and attaches the verified
 * profile to req.googleUser.
 * 
 * Returns the same { token, message, user } shape as /login and /register.
 */
router.post('/auth/google', verifyGoogleToken, async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.googleUser;

    // Check if user already exists by email
    let user = await User.findOne({ email });

    if (user) {
      // Existing user — update googleId if not set (linking local account to Google)
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
        await user.save();
      }
    } else {
      // New user — auto-create account
      const username = await generateUniqueUsername(email);

      user = new User({
        name: name || 'Google User',
        username,
        email,
        phonenumber: '',
        password: undefined,
        profilePic: picture || '',
        authProvider: 'google',
        googleId,
      });

      await user.save();
    }

    // Issue JWT (same format as /login and /register)
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_123',
      { expiresIn: '5h' },
      (err, jwtToken) => {
        if (err) throw err;
        res.json({
          token: jwtToken,
          message: 'Google login successful',
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            bio: user.bio,
            lastUsernameChange: user.lastUsernameChange,
            phonenumber: user.phonenumber,
            createdAt: user.createdAt,
            authProvider: user.authProvider,
          },
        });
      }
    );
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ detail: 'Server error during Google authentication' });
  }
});

/**
 * Generates a unique username from an email address.
 * Takes the part before '@', sanitizes it, and appends a random suffix.
 * Retries up to 5 times if there's a collision.
 * 
 * Example: "john.doe@gmail.com" → "johndoe_a7x2"
 */
async function generateUniqueUsername(email) {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const maxAttempts = 5;

  for (let i = 0; i < maxAttempts; i++) {
    const suffix = Math.random().toString(36).substring(2, 6); // 4-char random
    const candidate = `${base}_${suffix}`;

    const exists = await User.findOne({ username: candidate });
    if (!exists) {
      return candidate;
    }
  }

  // Fallback: use timestamp to guarantee uniqueness
  return `${base}_${Date.now().toString(36)}`;
}

module.exports = router;
