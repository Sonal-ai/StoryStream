const { verifyToken } = require('../utils/generateToken');
const { pool } = require('../config/db');

/**
 * Middleware to protect routes that require authentication.
 * Extracts the Bearer token from Authorization header, verifies it,
 * and attaches the user record to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify the user still exists in the database
    const [rows] = await pool.execute(
      'SELECT id, username, email, bio, profile_picture, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    next(error);
  }
};

/**
 * Optional auth middleware — attaches req.user if a valid token is present,
 * but does NOT block the request if no token is provided.
 * Useful for endpoints that return extra data for logged-in users.
 */
const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const [rows] = await pool.execute(
      'SELECT id, username, email, bio, profile_picture FROM users WHERE id = ?',
      [decoded.id]
    );
    if (rows.length > 0) req.user = rows[0];
    next();
  } catch {
    // Invalid/expired token — just continue as unauthenticated
    next();
  }
};

module.exports = { protect, optionalProtect };
