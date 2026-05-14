const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const interactionsController = require('../controllers/interactionsController');

// All interaction routes require authentication
router.post('/like', auth, interactionsController.toggleLike);
router.post('/save', auth, interactionsController.toggleSave);
router.post('/comment', auth, interactionsController.addComment);
router.delete('/comment', auth, interactionsController.deleteComment);
router.get('/saved', auth, interactionsController.getSavedItems);

module.exports = router;
