const express = require('express');
const {
  addComment,
  deleteComment,
  getComments,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { checkSafety } = require('../middleware/safetyMiddleware');

const router = express.Router();

router.route('/:postId').get(getComments).post(protect, checkSafety, addComment);
router.route('/:id').delete(protect, deleteComment);

module.exports = router;
