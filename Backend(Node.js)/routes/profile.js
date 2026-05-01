const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get public profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).lean();

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Return public profile information
    res.json({
      name: user.name,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      followersCount: 0, // Placeholder
      followingCount: 0, // Placeholder
      postsCount: 0 // Placeholder
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ detail: 'Server error' });
  }
});

module.exports = router;
