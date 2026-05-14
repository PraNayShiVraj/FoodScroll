const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Follow = require('../models/Follow');
const Content = require('../models/Content');

// Get public profile by MongoDB _id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Fetch actual counts from the UserFollow document
    const followData = await Follow.findById(id).lean();
    const followersCount = followData?.followers?.length || 0;
    const followingCount = followData?.following?.length || 0;

    // Fetch user's content (posts and shorts)
    const content = await Content.findOne({ userId: id }).lean();
    const posts = content?.posts || [];
    const shorts = content?.shorts || [];

    // Return public profile information
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      followersCount: followersCount,
      followingCount: followingCount,
      postsCount: posts.length, // Only counting standard posts for this stat
      posts: posts,
      shorts: shorts
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ detail: 'Server error' });
  }
});

module.exports = router;
