const { pool } = require('../config/db');
const crypto = require('crypto');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { text, imageUrl } = req.body;

    if (!text) {
      res.status(400);
      throw new Error('Post text is required');
    }

    const postId = crypto.randomUUID();

    // Insert Post
    await pool.execute(
      'INSERT INTO Posts (id, userId, text, imageUrl) VALUES (?, ?, ?, ?)',
      [postId, req.user.id, text, imageUrl || null]
    );

    // Extract hashtags from text (words starting with #)
    const hashtagsArray = text.match(/#[a-z0-9_]+/gi) || [];
    const uniqueHashtags = [...new Set(hashtagsArray.map((tag) => tag.toLowerCase().replace('#', '')))];

    // Insert Hashtags and PostHashtags
    for (const tag of uniqueHashtags) {
      const tagId = crypto.randomUUID();
      // Insert or update count if duplicate key (we need to make sure 'name' is unique in schema)
      await pool.execute(
        \`INSERT INTO Hashtags (id, name, count) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE count = count + 1\`,
        [tagId, tag]
      );

      // Get the tag id (whether just created or existing)
      const [rows] = await pool.execute('SELECT id FROM Hashtags WHERE name = ?', [tag]);
      const actualTagId = rows[0].id;

      await pool.execute(
        'INSERT INTO PostHashtags (postId, hashtagId) VALUES (?, ?)',
        [postId, actualTagId]
      );
    }

    const [createdPost] = await pool.execute(
      \`SELECT p.*, u.username, u.bio 
       FROM Posts p 
       JOIN Users u ON p.userId = u.id 
       WHERE p.id = ?\`,
      [postId]
    );

    res.status(201).json(createdPost[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const [posts] = await pool.execute(
      'SELECT userId FROM Posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (posts[0].userId !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized to delete this post');
    }

    // Handle Hashtag counts reduction BEFORE deleting the post
    const [hashtags] = await pool.execute(
      \`SELECT h.id, h.count FROM Hashtags h
       JOIN PostHashtags ph ON h.id = ph.hashtagId
       WHERE ph.postId = ?\`,
      [postId]
    );

    for (const tag of hashtags) {
      if (tag.count <= 1) {
        await pool.execute('DELETE FROM Hashtags WHERE id = ?', [tag.id]);
      } else {
        await pool.execute('UPDATE Hashtags SET count = count - 1 WHERE id = ?', [tag.id]);
      }
    }

    // CASCADE delete will remove rows in PostHashtags, Comments, Likes automatically
    await pool.execute('DELETE FROM Posts WHERE id = ?', [postId]);

    res.json({ message: 'Post removed' });
  } catch (error) {
    next(error);
  }
};

// Helper function to append likes and hashtags to retrieved posts lists
const appendPostDetails = async (posts) => {
  const finalPosts = [];
  for (const post of posts) {
    const [likes] = await pool.execute('SELECT userId as id FROM Likes WHERE postId = ?', [post.id]);
    const [hashtags] = await pool.execute(
      \`SELECT h.name FROM Hashtags h
       JOIN PostHashtags ph ON h.id = ph.hashtagId
       WHERE ph.postId = ?\`,
      [post.id]
    );
    post.likes = likes;
    post.hashtags = hashtags.map(h => h.name);
    finalPosts.push(post);
  }
  return finalPosts;
};

// @desc    Get all posts (global feed)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const offset = pageSize * (page - 1);

    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM Posts');
    const totalCount = countRows[0].total;

    const [posts] = await pool.execute(
      \`SELECT p.*, u.username 
       FROM Posts p 
       JOIN Users u ON p.userId = u.id 
       ORDER BY p.createdAt DESC
       LIMIT ? OFFSET ?\`,
      [String(pageSize), String(offset)] // passing as strings to avoid mysql2 implicit typing issues with LIMIT dynamically
    );

    const detailedPosts = await appendPostDetails(posts);

    res.json({ posts: detailedPosts, page, pages: Math.ceil(totalCount / pageSize) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by specific user
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res, next) => {
  try {
    const [posts] = await pool.execute(
      \`SELECT p.*, u.username 
       FROM Posts p 
       JOIN Users u ON p.userId = u.id 
       WHERE p.userId = ?
       ORDER BY p.createdAt DESC\`,
      [req.params.userId]
    );

    const detailedPosts = await appendPostDetails(posts);
    res.json(detailedPosts);
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLikePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user.id;

    const [posts] = await pool.execute('SELECT id FROM Posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      res.status(404);
      throw new Error('Post not found');
    }

    const [likes] = await pool.execute(
      'SELECT * FROM Likes WHERE userId = ? AND postId = ?',
      [currentUserId, postId]
    );

    const isLiked = likes.length > 0;

    if (isLiked) {
      await pool.execute(
        'DELETE FROM Likes WHERE userId = ? AND postId = ?',
        [currentUserId, postId]
      );
    } else {
      await pool.execute(
        'INSERT INTO Likes (userId, postId) VALUES (?, ?)',
        [currentUserId, postId]
      );
    }

    const [totalLikes] = await pool.execute('SELECT COUNT(*) as count FROM Likes WHERE postId = ?', [postId]);

    res.json({ message: isLiked ? 'Post unliked' : 'Post liked', likesCount: totalLikes[0].count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  deletePost,
  getPosts,
  getUserPosts,
  toggleLikePost,
};
