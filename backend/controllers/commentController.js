const { pool } = require('../config/db');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * @route  POST /api/posts/:postId/comments
 * @desc   Add a comment to a post
 * @access Private
 */
const addComment = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    if (content.length > 500) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters.' });
    }

    // Verify the post exists and is not deleted
    const [postRows] = await connection.execute(
      'SELECT id, user_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );

    if (postRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    await connection.beginTransaction();

    // Insert comment
    const [result] = await connection.execute(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content.trim()]
    );

    const commentId = result.insertId;
    const postOwnerId = postRows[0].user_id;

    // Create notification for post owner (skip if commenting on own post)
    if (postOwnerId !== userId) {
      await connection.execute(
        'INSERT INTO notifications (user_id, actor_id, type, reference_id) VALUES (?, ?, ?, ?)',
        [postOwnerId, userId, 'comment', postId]
      );
    }

    await connection.execute(
      'INSERT INTO audit_logs (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
      [userId, 'ADD_COMMENT', 'comments', commentId]
    );

    await connection.commit();

    // Return the full comment with author info
    const [comments] = await pool.execute(
      `SELECT c.id, c.content, c.created_at,
              u.id AS author_id, u.username, u.profile_picture
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [commentId]
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added.',
      data: { comment: comments[0] },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * @route  DELETE /api/comments/:id
 * @desc   Soft-delete a comment (owner only)
 * @access Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT id, user_id FROM comments WHERE id = ? AND deleted_at IS NULL',
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    await pool.execute(
      'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [commentId]
    );

    await pool.execute(
      'INSERT INTO audit_logs (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
      [userId, 'SOFT_DELETE_COMMENT', 'comments', commentId]
    );

    return res.status(200).json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/posts/:postId/comments
 * @desc   Get paginated comments for a post
 * @access Public
 */
const getComments = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId);
    const { limit, offset, page } = getPagination(req.query);

    // Verify post exists
    const [postRows] = await pool.execute(
      'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );

    if (postRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const [comments] = await pool.execute(
      `SELECT c.id, c.content, c.created_at,
              u.id AS author_id, u.username, u.profile_picture
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC
       LIMIT ? OFFSET ?`,
      [postId, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM comments WHERE post_id = ? AND deleted_at IS NULL',
      [postId]
    );

    return res.status(200).json({
      success: true,
      data: { comments },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, deleteComment, getComments };
