const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');
const User = require('../models/User');

// Update Profile Endpoint
router.put('/update-profile', auth, upload.single('profilePic'), async (req, res) => {
  try {
    const { username, bio } = req.body;
    const userId = req.user.id;
    
    // Find the user first
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    // 1. Handle Username Update
    if (username && username !== user.username) {
      // Check for uniqueness
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ detail: "Username is already taken" });
      }

      // Check 30-day restriction
      if (user.lastUsernameChange) {
        const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const lastChange = new Date(user.lastUsernameChange).getTime();
        
        if (now - lastChange < thirtyDaysInMillis) {
          const daysLeft = Math.ceil((thirtyDaysInMillis - (now - lastChange)) / (1000 * 60 * 60 * 24));
          return res.status(400).json({ detail: `You can change your username again in ${daysLeft} days.` });
        }
      }

      user.username = username;
      user.lastUsernameChange = new Date();
    }

    // 2. Handle Bio Update
    if (bio !== undefined) {
      user.bio = bio;
    }

    // 3. Handle Profile Picture Update
    if (req.file) {
      const newImageUrl = req.file.path;
      
      // Delete old image from Cloudinary if it exists
      if (user.profilePic && user.profilePic.includes('cloudinary.com')) {
        try {
          // Extract public_id from URL
          const urlParts = user.profilePic.split('/');
          const filename = urlParts[urlParts.length - 1];
          const folder = urlParts[urlParts.length - 2];
          const publicId = `${folder}/${filename.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Failed to delete old image from Cloudinary:", err);
        }
      }

      user.profilePic = newImageUrl;
    }

    await user.save();

    res.json({ 
      message: "Profile updated successfully", 
      user: { 
        name: user.name, 
        username: user.username, 
        email: user.email, 
        profilePic: user.profilePic,
        bio: user.bio,
        lastUsernameChange: user.lastUsernameChange,
        phonenumber: user.phonenumber,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ detail: "Server error during profile update" });
  }
});

module.exports = router;
