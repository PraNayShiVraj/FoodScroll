const express = require('express');
const router = express.Router();
const UserFollow = require('../models/Follow');
const auth = require('../middleware/auth');

/**
 * POST /api/follow/:id
 * Follow a user
 */
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const follower_id = req.user.id;   // Me
    const following_id = req.params.id; // Target

    if (follower_id === following_id) {
      return res.status(400).json({ detail: "You cannot follow yourself" });
    }

    // 1. Add Target to My 'following' list
    await UserFollow.findByIdAndUpdate(
      follower_id,
      { $addToSet: { following: following_id } },
      { upsert: true, returnDocument: 'after' }
    );

    // 2. Add Me to Target's 'followers' list
    await UserFollow.findByIdAndUpdate(
      following_id,
      { $addToSet: { followers: follower_id } },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ detail: "Server error" });
  }
});

/**
 * DELETE /api/unfollow/:id
 * Unfollow a user
 */
router.delete('/unfollow/:id', auth, async (req, res) => {
  try {
    const follower_id = req.user.id;   // Me
    const following_id = req.params.id; // Target

    // 1. Remove Target from My 'following' list
    await UserFollow.findByIdAndUpdate(
      follower_id,
      { $pull: { following: following_id } }
    );

    // 2. Remove Me from Target's 'followers' list
    await UserFollow.findByIdAndUpdate(
      following_id,
      { $pull: { followers: follower_id } }
    );

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ detail: "Server error" });
  }
});

/**
 * GET /api/is-following/:id
 * Check if the current user is following the target user
 */
router.get('/is-following/:id', auth, async (req, res) => {
  try {
    const my_id = req.user.id;
    const target_id = req.params.id;

    const myData = await UserFollow.findById(my_id);
    const isFollowing = myData ? myData.following.includes(target_id) : false;

    res.json({ isFollowing });
  } catch (error) {
    console.error("Check following error:", error);
    res.status(500).json({ detail: "Server error" });
  }
});

module.exports = router;
