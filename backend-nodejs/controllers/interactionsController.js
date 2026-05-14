const Content = require('../models/Content');
const User = require('../models/User');

// Toggle Like
exports.toggleLike = async (req, res) => {
  try {
    const { contentId, type } = req.body;
    const userId = req.user.id;

    if (!contentId || !['post', 'short'].includes(type)) {
      return res.status(400).json({ detail: "Invalid contentId or type" });
    }

    const arrayField = type === 'post' ? 'posts' : 'shorts';
    const query = { [`${arrayField}._id`]: contentId };

    const contentDoc = await Content.findOne(query);
    if (!contentDoc) {
      return res.status(404).json({ detail: "Content not found" });
    }

    const item = contentDoc[arrayField].id(contentId);
    if (!item) {
      return res.status(404).json({ detail: "Item not found" });
    }

    // Initialize array if it doesn't exist (safety check)
    if (!item.likes) item.likes = [];

    const index = item.likes.indexOf(userId);
    let liked = false;
    
    if (index === -1) {
      // Add like
      item.likes.push(userId);
      liked = true;
    } else {
      // Remove like
      item.likes.splice(index, 1);
    }

    await contentDoc.save();
    res.json({ message: "Like toggled", liked, likesCount: item.likes.length });

  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ detail: "Server error" });
  }
};

// Toggle Save
exports.toggleSave = async (req, res) => {
  try {
    const { contentId, type } = req.body;
    const userId = req.user.id;

    if (!contentId || !['post', 'short'].includes(type)) {
      return res.status(400).json({ detail: "Invalid contentId or type" });
    }

    const arrayField = type === 'post' ? 'posts' : 'shorts';
    const query = { [`${arrayField}._id`]: contentId };

    const contentDoc = await Content.findOne(query);
    if (!contentDoc) {
      return res.status(404).json({ detail: "Content not found" });
    }

    const item = contentDoc[arrayField].id(contentId);
    if (!item) {
      return res.status(404).json({ detail: "Item not found" });
    }

    // Initialize arrays if they don't exist
    if (!item.saves) item.saves = [];

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }
    if (!user.savedContent) user.savedContent = [];

    const itemIndex = item.saves.indexOf(userId);
    const userIndex = user.savedContent.findIndex(
      (s) => s.contentId.toString() === contentId.toString() && s.contentType === type
    );

    let saved = false;

    if (itemIndex === -1) {
      // Save
      item.saves.push(userId);
      user.savedContent.push({ contentId, contentType: type });
      saved = true;
    } else {
      // Unsave
      item.saves.splice(itemIndex, 1);
      if (userIndex !== -1) {
        user.savedContent.splice(userIndex, 1);
      }
    }

    await contentDoc.save();
    await user.save();

    res.json({ message: "Save toggled", saved, savesCount: item.saves.length });

  } catch (error) {
    console.error("Error toggling save:", error);
    res.status(500).json({ detail: "Server error" });
  }
};

// Add Comment
exports.addComment = async (req, res) => {
  try {
    const { contentId, type, text } = req.body;
    const userId = req.user.id;

    if (!contentId || !['post', 'short'].includes(type) || !text) {
      return res.status(400).json({ detail: "Invalid input data" });
    }

    const arrayField = type === 'post' ? 'posts' : 'shorts';
    const query = { [`${arrayField}._id`]: contentId };

    const contentDoc = await Content.findOne(query);
    if (!contentDoc) {
      return res.status(404).json({ detail: "Content not found" });
    }

    const item = contentDoc[arrayField].id(contentId);
    if (!item) {
      return res.status(404).json({ detail: "Item not found" });
    }

    if (!item.comments) item.comments = [];

    item.comments.push({
      user: userId,
      text: text
    });

    await contentDoc.save();

    // Populate the newly added comment so frontend has user details
    const newlyAddedComment = item.comments[item.comments.length - 1];
    
    // Manual population since we saved the doc already
    const populatedUser = await User.findById(userId).select('username name profilePic');
    
    res.json({ 
      message: "Comment added", 
      comment: {
        ...newlyAddedComment.toObject(),
        user: populatedUser
      } 
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ detail: "Server error" });
  }
};

// Delete Comment
exports.deleteComment = async (req, res) => {
  try {
    const { contentId, type, commentId } = req.body;
    const userId = req.user.id;

    if (!contentId || !['post', 'short'].includes(type) || !commentId) {
      return res.status(400).json({ detail: "Invalid input data" });
    }

    const arrayField = type === 'post' ? 'posts' : 'shorts';
    const query = { [`${arrayField}._id`]: contentId };

    const contentDoc = await Content.findOne(query);
    if (!contentDoc) {
      return res.status(404).json({ detail: "Content not found" });
    }

    const item = contentDoc[arrayField].id(contentId);
    if (!item) {
      return res.status(404).json({ detail: "Item not found" });
    }

    if (!item.comments) {
      return res.status(404).json({ detail: "Comment not found" });
    }

    const comment = item.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ detail: "Comment not found" });
    }

    // Check if user is the comment owner or the post owner
    if (comment.user.toString() !== userId && contentDoc.userId.toString() !== userId) {
      return res.status(403).json({ detail: "Not authorized to delete this comment" });
    }

    // Instead of remove(), use pull
    item.comments.pull(commentId);

    await contentDoc.save();
    res.json({ message: "Comment deleted" });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ detail: "Server error" });
  }
};

// Get Saved Items
exports.getSavedItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.savedContent || user.savedContent.length === 0) {
      return res.json({ savedItems: [] });
    }

    const savedItems = [];

    // This could be optimized, but works for the embedded schema setup
    for (const saved of user.savedContent) {
      const arrayField = saved.contentType === 'post' ? 'posts' : 'shorts';
      const contentDoc = await Content.findOne({ [`${arrayField}._id`]: saved.contentId });
      
      if (contentDoc) {
        const item = contentDoc[arrayField].id(saved.contentId);
        if (item) {
          // Attach owner details to the item so UI can show it
          const owner = await User.findById(contentDoc.userId).select('username name profilePic');
          savedItems.push({
            ...item.toObject(),
            contentType: saved.contentType, // either 'post' or 'short'
            owner
          });
        }
      }
    }

    res.json({ savedItems });

  } catch (error) {
    console.error("Error fetching saved items:", error);
    res.status(500).json({ detail: "Server error" });
  }
};
