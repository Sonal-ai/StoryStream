const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, getUserPosts, searchUsers } = require('../controllers/userController');
const { followUser, unfollowUser, getFollowers, getFollowing } = require('../controllers/followController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Search users (must be before /:username to prevent conflict)
router.get('/search', searchUsers);

// Profile routes
router.get('/:username', optionalProtect, getUserProfile);
router.put('/profile', protect, updateProfile);

// User posts
router.get('/:username/posts', getUserPosts);

// Follow / Unfollow
router.post('/:username/follow',   protect, followUser);
router.delete('/:username/follow', protect, unfollowUser);

// Followers / Following lists
router.get('/:username/followers', optionalProtect, getFollowers);
router.get('/:username/following', getFollowing);

module.exports = router;
