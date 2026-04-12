const express = require('express');
const router = express.Router();
const { likePost, unlikePost, getPostLikes } = require('../controllers/likeController');
const { protect } = require('../middleware/authMiddleware');

// All like routes are scoped via postRoutes.js (/:postId/like)
// This file is a placeholder for any future standalone like endpoints.

module.exports = router;
