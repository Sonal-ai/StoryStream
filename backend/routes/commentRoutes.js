const express = require('express');
const router = express.Router();
const { addComment, deleteComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Standalone comment deletion (comment ID only, no post context needed)
router.delete('/:id', protect, deleteComment);

module.exports = router;
