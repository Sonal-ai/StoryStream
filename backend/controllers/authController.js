const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/generateToken');

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, bio } = req.body;

    // --- Input Validation ---
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required.' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ success: false, message: 'Username must be 3–50 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // --- Check for existing user ---
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or username already in use.' });
    }

    // --- Hash password (bcrypt cost factor 10 is industry standard) ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Insert user ---
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hashedPassword, bio || null]
    );

    const userId = result.insertId;

    // --- Audit log ---
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
      [userId, 'REGISTER', 'users', userId]
    );

    const token = generateToken({ id: userId, username, email });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: { id: userId, username, email, bio: bio || null, profile_picture: null },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/auth/login
 * @desc   Login with email & password, returns JWT
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // --- Fetch user ---
    const [rows] = await pool.execute(
      'SELECT id, username, email, password, bio, profile_picture, is_active FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    // --- Compare password ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // --- Audit log ---
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGIN', 'users', user.id]
    );

    const token = generateToken({ id: user.id, username: user.username, email: user.email });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          bio: user.bio,
          profile_picture: user.profile_picture,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/auth/me
 * @desc   Get currently authenticated user
 * @access Private
 */
const getMe = async (req, res) => {
  // req.user is populated by the protect middleware
  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = { register, login, getMe };
