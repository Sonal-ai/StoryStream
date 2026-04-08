const { pool } = require('../config/db');
const crypto = require('crypto');

// @desc    Add comment to post
// @route   POST /api/comments/:postId
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;

    if (!text) {
      res.status(400);
      throw new Error('Comment text is required');
    }

    const [posts] = await pool.execute('SELECT id FROM Posts WHERE id = ?', [postId]);

    if (posts.length === 0) {
      res.status(404);
      throw new Error('Post not found');
    }

    const commentId = crypto.randomUUID();

    await pool.execute(
      'INSERT INTO Comments (id, userId, postId, text) VALUES (?, ?, ?, ?)',
      [commentId, req.user.id, postId, text]
    );

    const [comments] = await pool.execute(
      `SELECT c.*, u.username 
       FROM Comments c 
       JOIN Users u ON c.userId = u.id 
       WHERE c.id = ?`,
      [commentId]
    );

    res.status(201).json(comments[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    const [comments] = await pool.execute(
      `SELECT c.userId as commentUserId, p.userId as postUserId 
       FROM Comments c 
       JOIN Posts p ON c.postId = p.id 
       WHERE c.id = ?`,
      [commentId]
    );

    if (comments.length === 0) {
      res.status(404);
      throw new Error('Comment not found');
    }

    const comment = comments[0];

    // Check if the user owns the comment OR owns the post the comment is on
    if (
      comment.commentUserId !== req.user.id &&
      comment.postUserId !== req.user.id
    ) {
      res.status(401);
      throw new Error('User not authorized to delete this comment');
    }

    await pool.execute('DELETE FROM Comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public
const getComments = async (req, res, next) => {
  try {
    const [comments] = await pool.execute(
      `SELECT c.*, u.username 
       FROM Comments c 
       JOIN Users u ON c.userId = u.id 
       WHERE c.postId = ? 
       ORDER BY c.createdAt DESC`,
      [req.params.postId]
    );

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, deleteComment, getComments };
