const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /api/search?q=<query>
 *
 * Searches users by username or name (case-insensitive, partial match).
 * Returns up to 20 results with public profile fields only.
 * Does not require authentication — public search.
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const trimmed = q.trim();

    // Case-insensitive partial match on username OR name
    const users = await User.find({
      $or: [
        { username: { $regex: trimmed, $options: 'i' } },
        { name:     { $regex: trimmed, $options: 'i' } },
      ],
    })
      .select('_id name username profilePic bio')
      .limit(20)
      .lean();

    res.json({ users });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ detail: 'Server error during search' });
  }
});

module.exports = router;
