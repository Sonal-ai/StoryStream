const { pool } = require('../config/db');

/**
 * @route  POST /api/posts/:postId/like
 * @desc   Like a post (idempotent — skip if already liked)
 *         Uses a transaction to ensure like and notification are atomic.
 * @access Private
 */
const likePost = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;

    await connection.beginTransaction();

    // Verify post exists — FOR UPDATE locks the row to prevent concurrent modifications
    const [postRows] = await connection.execute(
      'SELECT id, user_id FROM posts WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
      [postId]
    );

    if (postRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    // Check if already liked — FOR UPDATE prevents duplicate-like race condition
    const [existingLike] = await connection.execute(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ? FOR UPDATE',
      [userId, postId]
    );

    if (existingLike.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: 'You already liked this post.' });
    }

    // Insert like — UNIQUE constraint (user_id, post_id) prevents duplicates at DB level
    await connection.execute(
      'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
      [userId, postId]
    );

    // Notify post owner (skip self-likes)
    const postOwnerId = postRows[0].user_id;
    if (postOwnerId !== userId) {
      await connection.execute(
        'INSERT INTO notifications (user_id, actor_id, type, reference_id) VALUES (?, ?, ?, ?)',
        [postOwnerId, userId, 'like', postId]
      );
    }

    await connection.commit();

    // Return updated like count
    const [[{ like_count }]] = await pool.execute(
      'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = ?',
      [postId]
    );

    return res.status(200).json({
      success: true,
      message: 'Post liked.',
      data: { liked: true, like_count },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * @route  DELETE /api/posts/:postId/like
 * @desc   Unlike a post
 * @access Private
 */
const unlikePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;

    const [existing] = await pool.execute(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'You have not liked this post.' });
    }

    await pool.execute(
      'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    const [[{ like_count }]] = await pool.execute(
      'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = ?',
      [postId]
    );

    return res.status(200).json({
      success: true,
      message: 'Post unliked.',
      data: { liked: false, like_count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/posts/:postId/likes
 * @desc   Get users who liked a post
 * @access Public
 */
const getPostLikes = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId);

    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.profile_picture, l.created_at AS liked_at
       FROM likes l
       JOIN users u ON u.id = l.user_id
       WHERE l.post_id = ?
       ORDER BY l.created_at DESC`,
      [postId]
    );

    return res.status(200).json({
      success: true,
      data: { users, count: users.length },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { likePost, unlikePost, getPostLikes };
