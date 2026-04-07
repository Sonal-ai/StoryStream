const express = require('express');
const {
  createPost,
  deletePost,
  getPosts,
  getUserPosts,
  toggleLikePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { checkSafety } = require('../middleware/safetyMiddleware');

const router = express.Router();

router.route('/').get(getPosts).post(protect, checkSafety, createPost);
router.route('/:id').delete(protect, deletePost);
router.get('/user/:userId', getUserPosts);
router.post('/:id/like', protect, toggleLikePost);

module.exports = router;
