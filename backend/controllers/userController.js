const { pool } = require('../config/db');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * @route  GET /api/users/:username
 * @desc   Get public user profile with follower/following counts
 * @access Public
 */
const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const [rows] = await pool.execute(
      `SELECT 
        u.id, u.username, u.email, u.bio, u.profile_picture,
        u.full_name, u.date_of_birth, u.location, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id) AS following_count,
        (SELECT COUNT(*) FROM posts    WHERE user_id = u.id AND deleted_at IS NULL) AS posts_count
       FROM users u
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];

    // If request is authenticated, check if the current user follows this profile
    let isFollowing = false;
    if (req.user) {
      const [followCheck] = await pool.execute(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, user.id]
      );
      isFollowing = followCheck.length > 0;
    }

    return res.status(200).json({
      success: true,
      data: { user: { ...user, isFollowing } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/users/profile
 * @desc   Update authenticated user's profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { bio, profile_picture, date_of_birth, location, full_name, username } = req.body;
    const userId = req.user.id;

    // ── Username change: validate uniqueness ──────────────────
    if (username) {
      const clean = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
        return res.status(400).json({ success: false, message: 'Username must be 3–30 chars: letters, numbers, underscores.' });
      }
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [clean, userId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: `Username "${clean}" is already taken.` });
      }
      await pool.execute('UPDATE users SET username = ? WHERE id = ?', [clean, userId]);
    }

    // ── Update remaining profile fields ───────────────────────
    await pool.execute(
      'UPDATE users SET bio = ?, profile_picture = ?, date_of_birth = ?, location = ?, full_name = ? WHERE id = ?',
      [bio || null, profile_picture || null, date_of_birth || null, location || null, full_name || null, userId]
    );

    const [updated] = await pool.execute(
      'SELECT id, username, email, bio, profile_picture, full_name, date_of_birth, location, created_at FROM users WHERE id = ?',
      [userId]
    );

    await pool.execute(
      'INSERT INTO audit_logs (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
      [userId, 'UPDATE_PROFILE', 'users', userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated.',
      data: { user: updated[0] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/users/:username/posts
 * @desc   Get paginated posts by a specific user
 * @access Public
 */
const getUserPosts = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { limit, offset, page } = getPagination(req.query);

    // Resolve username → user_id
    const [userRows] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userId = userRows[0].id;

    // pool.query() used (not execute) — mysql2 prepared statements reject LIMIT/OFFSET
    const [posts] = await pool.query(
      `SELECT 
         p.id, p.content, p.image_url, p.created_at,
         u.id AS author_id, u.username, u.profile_picture,
         (SELECT COUNT(*) FROM likes    WHERE post_id = p.id) AS like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM posts WHERE user_id = ? AND deleted_at IS NULL',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { posts },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/users/search?q=term
 * @desc   Search users by username or bio
 * @access Public
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const { limit, offset, page } = getPagination(req.query);

    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const searchTerm = `%${q.trim()}%`;

    // pool.query() used (not execute) — mysql2 prepared statements reject LIMIT/OFFSET
    const [users] = await pool.query(
      `SELECT id, username, bio, profile_picture,
         (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count
       FROM users u
       WHERE (username LIKE ? OR bio LIKE ?) AND is_active = 1
       ORDER BY followers_count DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM users WHERE (username LIKE ? OR bio LIKE ?) AND is_active = 1',
      [searchTerm, searchTerm]
    );

    return res.status(200).json({
      success: true,
      data: { users },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateProfile, getUserPosts, searchUsers };
