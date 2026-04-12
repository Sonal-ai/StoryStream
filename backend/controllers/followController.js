const { pool } = require('../config/db');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * @route  POST /api/users/:username/follow
 * @desc   Follow a user. Prevents self-follow.
 *         Uses INSERT IGNORE for idempotency (safe to call multiple times).
 * @access Private
 */
const followUser = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { username } = req.params;
    const followerId = req.user.id;

    // Resolve target username → user_id
    const [targetRows] = await connection.execute(
      'SELECT id FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (targetRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const followingId = targetRows[0].id;

    if (followerId === followingId) {
      connection.release();
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    // Check if already following
    const [existing] = await connection.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: 'Already following this user.' });
    }

    await connection.beginTransaction();

    await connection.execute(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );

    // Notify the user being followed
    await connection.execute(
      'INSERT INTO notifications (user_id, actor_id, type, reference_id) VALUES (?, ?, ?, ?)',
      [followingId, followerId, 'follow', followerId]
    );

    await connection.commit();

    // Return updated counts
    const [[counts]] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id  = ?) AS following_count`,
      [followingId, followingId]
    );

    return res.status(200).json({
      success: true,
      message: `You are now following @${username}.`,
      data: { following: true, ...counts },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * @route  DELETE /api/users/:username/follow
 * @desc   Unfollow a user
 * @access Private
 */
const unfollowUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const followerId = req.user.id;

    const [targetRows] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const followingId = targetRows[0].id;

    const [existing] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'You are not following this user.' });
    }

    await pool.execute(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    const [[counts]] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id  = ?) AS following_count`,
      [followingId, followingId]
    );

    return res.status(200).json({
      success: true,
      message: `Unfollowed @${username}.`,
      data: { following: false, ...counts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/users/:username/followers
 * @desc   Get paginated list of a user's followers
 * @access Public
 */
const getFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { limit, offset, page } = getPagination(req.query);

    const [userRows] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userId = userRows[0].id;

    const [followers] = await pool.execute(
      `SELECT u.id, u.username, u.bio, u.profile_picture, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM follows WHERE following_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { followers },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/users/:username/following
 * @desc   Get paginated list of users a user is following
 * @access Public
 */
const getFollowing = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { limit, offset, page } = getPagination(req.query);

    const [userRows] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userId = userRows[0].id;

    const [following] = await pool.execute(
      `SELECT u.id, u.username, u.bio, u.profile_picture, f.created_at AS followed_at
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM follows WHERE follower_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { following },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing };
