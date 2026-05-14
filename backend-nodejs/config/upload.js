const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('./cloudinary');
const auth = require('../middleware/auth');
const Content = require('../models/Content');

// Debug middleware to log request path
router.use((req, res, next) => {
  console.log(`[Upload Route] ${req.method} ${req.path}`);
  next();
});

// @route   POST /api/upload/post
// @desc    Upload a new post image to Cloudinary and store the link
router.post('/post', auth, upload.single('post'), async (req, res) => {
  try {
    console.log('--- Post Upload Debug ---');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ detail: 'No post file uploaded' });
    }

    // Find user's content document or create a new one
    let content = await Content.findOne({ userId: req.user.id });
    if (!content) {
      content = new Content({ userId: req.user.id, posts: [], shorts: [] });
    }

    // Extract metadata from body
    const { caption, ingredients, tags, isVeg } = req.body;
    
    // Parse arrays if they come as strings
    const parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : (ingredients || []);
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);

    // Add the new post link and metadata
    content.posts.push({
      url: req.file.path,
      public_id: req.file.filename,
      caption: caption || '',
      ingredients: parsedIngredients,
      tags: parsedTags,
      isVeg: isVeg === 'true' || isVeg === true,
      createdAt: new Date()
    });

    await content.save();

    res.json({
      message: 'Post uploaded successfully',
      post: content.posts[content.posts.length - 1]
    });
  } catch (err) {
    console.error('Post Upload Error:', err);
    res.status(500).json({ detail: 'Server error during post upload' });
  }
});

// @route   POST /api/upload/shorts
// @desc    Upload a new short video to Cloudinary and store the link
router.post('/shorts', auth, (req, res, next) => {
  upload.single('shorts')(req, res, (err) => {
    if (err) {
      console.error('=== Multer/Cloudinary Upload Error ===');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      return res.status(500).json({ detail: 'Upload failed', error: err.message || 'Unknown upload error' });
    }

    (async () => {
      try {
        console.log('--- Shorts Upload Debug ---');
        console.log('File:', req.file);
        console.log('Body:', req.body);

        if (!req.file) {
          return res.status(400).json({ detail: 'No shorts file uploaded' });
        }

        // Find user's content document or create a new one
        let content = await Content.findOne({ userId: req.user.id });
        if (!content) {
          content = new Content({ userId: req.user.id, posts: [], shorts: [] });
        }

        // Extract metadata from body
        const { caption, ingredients, tags, isVeg } = req.body;
        
        // Parse arrays if they come as strings
        const parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : (ingredients || []);
        const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);

        // Add the new shorts link and metadata
        content.shorts.push({
          url: req.file.path,
          public_id: req.file.filename,
          caption: caption || '',
          ingredients: parsedIngredients,
          tags: parsedTags,
          isVeg: isVeg === 'true' || isVeg === true,
          createdAt: new Date()
        });

        await content.save();

        res.json({
          message: 'Short uploaded successfully',
          short: content.shorts[content.shorts.length - 1]
        });
      } catch (err) {
        console.error('Shorts Upload Error:', err);
        res.status(500).json({ detail: 'Server error during shorts upload' });
      }
    })();
  });
});

// @route   DELETE /api/delete-content/:type/:id
// @desc    Delete a post or short from DB and Cloudinary
router.delete('/delete-content/:type/:contentId', auth, async (req, res) => {
  try {
    const { type, contentId } = req.params;
    if (type !== 'posts' && type !== 'shorts') {
      return res.status(400).json({ detail: 'Invalid content type' });
    }

    const content = await Content.findOne({ userId: req.user.id });
    if (!content) {
      return res.status(404).json({ detail: 'Content not found' });
    }

    // Find the item to get public_id
    const item = content[type].id(contentId);
    if (!item) {
      return res.status(404).json({ detail: 'Item not found' });
    }

    // Delete from Cloudinary if public_id exists
    if (item.public_id) {
      try {
        await cloudinary.uploader.destroy(item.public_id, { resource_type: type === 'shorts' ? 'video' : 'image' });
      } catch (cloudErr) {
        console.error('Cloudinary deletion failed:', cloudErr);
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Remove from array and save
    content[type].pull({ _id: contentId });
    await content.save();

    res.json({ message: 'Content deleted successfully' });
  } catch (err) {
    console.error('Delete Content Error:', err);
    res.status(500).json({ detail: 'Server error during deletion' });
  }
});

// @route   PUT /api/upload/edit-content/:type/:contentId
// @desc    Edit metadata of a post or short
router.put('/edit-content/:type/:contentId', auth, async (req, res) => {
  try {
    const { type, contentId } = req.params;
    const { caption, ingredients, tags, isVeg } = req.body;

    if (type !== 'posts' && type !== 'shorts') {
      return res.status(400).json({ detail: 'Invalid content type' });
    }

    const content = await Content.findOne({ userId: req.user.id });
    if (!content) {
      return res.status(404).json({ detail: 'Content not found' });
    }

    const item = content[type].id(contentId);
    if (!item) {
      return res.status(404).json({ detail: 'Item not found' });
    }

    // Update fields
    if (caption !== undefined) item.caption = caption;
    if (ingredients !== undefined) {
      item.ingredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
    }
    if (tags !== undefined) {
      item.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    if (isVeg !== undefined) {
      item.isVeg = isVeg === 'true' || isVeg === true;
    }

    await content.save();

    res.json({ message: 'Content updated successfully', item });
  } catch (err) {
    console.error('Edit Content Error:', err);
    res.status(500).json({ detail: 'Server error during update' });
  }
});


module.exports = router;
