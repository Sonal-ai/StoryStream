const { pool } = require('../config/db');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Extracts hashtags from post content.
 * @param {string} content - Post text
 * @returns {string[]} Array of lowercase hashtag names (without #)
 */
const extractHashtags = (content) => {
  const matches = content.match(/#([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
};

/**
 * Upserts hashtags and links them to the given post.
 * Uses INSERT IGNORE + SELECT to avoid race conditions.
 * Wrapped in the caller's transaction.
 * @param {Object} connection - MySQL connection (with transaction)
 * @param {number} postId
 * @param {string[]} tags
 */
const linkHashtags = async (connection, postId, tags) => {
  for (const tag of tags) {
    await connection.execute(
      'INSERT IGNORE INTO hashtags (name) VALUES (?)',
      [tag]
    );
    const [[hashtagRow]] = await connection.execute(
      'SELECT id FROM hashtags WHERE name = ?',
      [tag]
    );
    await connection.execute(
      'INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)',
      [postId, hashtagRow.id]
    );
  }
};

/**
 * @route  POST /api/posts
 * @desc   Create a new post, extract & link hashtags (transactional)
 * @access Private
 */
const createPost = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { content, image_url } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Post content cannot be empty.' });
    }

    if (content.length > 280) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Post content cannot exceed 280 characters.' });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [userId, content.trim(), image_url || null]
    );

    const postId = result.insertId;

    // Extract and link hashtags within the same transaction
    const tags = extractHashtags(content);
    if (tags.length > 0) {
      await linkHashtags(connection, postId, tags);
    }

    await connection.execute(
      'INSERT INTO audit_logs (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
      [userId, 'CREATE_POST', 'posts', postId]
    );

    await connection.commit();

    // Fetch complete post for response
    const [posts] = await pool.execute(
      `SELECT p.id, p.content, p.image_url, p.created_at,
              u.id AS author_id, u.username, u.profile_picture
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [postId]
    );

    return res.status(201).json({
      success: true,
      message: 'Post created.',
      data: { post: { ...posts[0], hashtags: tags, like_count: 0, comment_count: 0 } },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * @route  DELETE /api/posts/:id
 * @desc   Soft-delete a post (only the owner can delete)
 * @access Private
 */
const deletePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT id, user_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }

    // Soft delete: set deleted_at timestamp instead of removing the row
    await pool.execute(
      'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [postId]
    );

    await pool.execute(
      'INSERT INTO audit_logs (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
      [userId, 'SOFT_DELETE_POST', 'posts', postId]
    );

    return res.status(200).json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/posts
 * @desc   Global feed — all posts sorted by newest, paginated
 * @access Public
 */
const getAllPosts = async (req, res, next) => {
  try {
    const { limit, offset, page } = getPagination(req.query);

    const [posts] = await pool.execute(
      `SELECT 
         p.id, p.content, p.image_url, p.created_at,
         u.id AS author_id, u.username, u.profile_picture,
         (SELECT COUNT(*) FROM likes    WHERE post_id = p.id)                         AS like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL)  AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM posts WHERE deleted_at IS NULL'
    );

    // Attach hashtags per post
    const postIds = posts.map((p) => p.id);
    let postsWithTags = posts;

    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',');
      const [tags] = await pool.execute(
        `SELECT ph.post_id, h.name FROM post_hashtags ph
         JOIN hashtags h ON h.id = ph.hashtag_id
         WHERE ph.post_id IN (${placeholders})`,
        postIds
      );

      const tagMap = {};
      tags.forEach(({ post_id, name }) => {
        if (!tagMap[post_id]) tagMap[post_id] = [];
        tagMap[post_id].push(name);
      });

      postsWithTags = posts.map((p) => ({ ...p, hashtags: tagMap[p.id] || [] }));
    }

    return res.status(200).json({
      success: true,
      data: { posts: postsWithTags },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/posts/feed
 * @desc   Personalized feed — posts from followed users, paginated
 * @access Private
 *
 * Core JOIN query:
 *   posts JOIN users ON author — to get author detail
 *   posts JOIN follows ON user_id = following_id WHERE follower_id = me
 *   Subqueries for like/comment counts
 */
const getFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit, offset, page } = getPagination(req.query);

    const [posts] = await pool.execute(
      `SELECT 
         p.id, p.content, p.image_url, p.created_at,
         u.id AS author_id, u.username, u.profile_picture,
         (SELECT COUNT(*) FROM likes    WHERE post_id = p.id)                        AS like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) AS comment_count,
         EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id)           AS liked_by_me
       FROM posts p
       JOIN users   u ON u.id = p.user_id
       JOIN follows f ON f.following_id = p.user_id
       WHERE f.follower_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM posts p
       JOIN follows f ON f.following_id = p.user_id
       WHERE f.follower_id = ? AND p.deleted_at IS NULL`,
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
 * @route  GET /api/posts/:id
 * @desc   Get a single post with hashtags, like count, comment count
 * @access Public
 */
const getPostById = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);

    const [rows] = await pool.execute(
      `SELECT 
         p.id, p.content, p.image_url, p.created_at,
         u.id AS author_id, u.username, u.profile_picture,
         (SELECT COUNT(*) FROM likes    WHERE post_id = p.id)                        AS like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const [tags] = await pool.execute(
      `SELECT h.name FROM post_hashtags ph
       JOIN hashtags h ON h.id = ph.hashtag_id
       WHERE ph.post_id = ?`,
      [postId]
    );

    return res.status(200).json({
      success: true,
      data: { post: { ...rows[0], hashtags: tags.map((t) => t.name) } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/posts/hashtag/:tag
 * @desc   Get posts by hashtag name
 * @access Public
 */
const getPostsByHashtag = async (req, res, next) => {
  try {
    const tag = req.params.tag.toLowerCase();
    const { limit, offset, page } = getPagination(req.query);

    const [posts] = await pool.execute(
      `SELECT 
         p.id, p.content, p.image_url, p.created_at,
         u.id AS author_id, u.username, u.profile_picture,
         (SELECT COUNT(*) FROM likes    WHERE post_id = p.id)                        AS like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) AS comment_count
       FROM posts p
       JOIN users        u  ON u.id  = p.user_id
       JOIN post_hashtags ph ON ph.post_id = p.id
       JOIN hashtags      h  ON h.id  = ph.hashtag_id
       WHERE h.name = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [tag, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM posts p
       JOIN post_hashtags ph ON ph.post_id = p.id
       JOIN hashtags h ON h.id = ph.hashtag_id
       WHERE h.name = ? AND p.deleted_at IS NULL`,
      [tag]
    );

    return res.status(200).json({
      success: true,
      data: { hashtag: tag, posts },
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, deletePost, getAllPosts, getFeed, getPostById, getPostsByHashtag };
