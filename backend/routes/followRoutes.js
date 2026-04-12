const express = require('express');
const router = express.Router();
const { followUser, unfollowUser, getFollowers, getFollowing } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

// All follow routes are scoped under /api/users/:username in userRoutes.js
// This file is kept for structural completeness.

module.exports = router;
