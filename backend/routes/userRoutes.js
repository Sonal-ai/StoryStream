const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  toggleFollowUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkSafety } = require('../middleware/safetyMiddleware');

const router = express.Router();

router.get('/:id', getUserProfile);
router.put('/profile', protect, checkSafety, updateUserProfile);
router.post('/:id/follow', protect, toggleFollowUser);

module.exports = router;
