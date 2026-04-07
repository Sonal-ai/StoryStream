const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

module.exports = router;
