const { pool } = require('../config/db');

// Helper function to append likes and hashtags to retrieved posts lists
const appendPostDetails = async (posts) => {
  const finalPosts = [];
  for (const post of posts) {
    const [likes] = await pool.execute('SELECT userId as id FROM Likes WHERE postId = ?', [post.id]);
    const [hashtags] = await pool.execute(
      `SELECT h.name FROM Hashtags h
       JOIN PostHashtags ph ON h.id = ph.hashtagId
       WHERE ph.postId = ?`,
      [post.id]
    );
    post.likes = likes;
    post.hashtags = hashtags.map(h => h.name);
    finalPosts.push(post);
  }
  return finalPosts;
};

// @desc    Get posts by hashtag
// @route   GET /api/hashtags/:tag
// @access  Public
const getPostsByHashtag = async (req, res, next) => {
  try {
    const tag = req.params.tag.toLowerCase();

    const [posts] = await pool.execute(
      `SELECT p.*, u.username 
       FROM Posts p 
       JOIN Users u ON p.userId = u.id 
       JOIN PostHashtags ph ON p.id = ph.postId
       JOIN Hashtags h ON ph.hashtagId = h.id
       WHERE h.name = ?
       ORDER BY p.createdAt DESC`,
      [tag]
    );

    if (posts.length === 0) {
      return res.json([]);
    }

    const detailedPosts = await appendPostDetails(posts);
    res.json(detailedPosts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending hashtags
// @route   GET /api/hashtags/trending
// @access  Public
const getTrendingHashtags = async (req, res, next) => {
  try {
    const [trending] = await pool.execute(
      'SELECT id, name, count FROM Hashtags ORDER BY count DESC LIMIT 10'
    );
    res.json(trending);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPostsByHashtag, getTrendingHashtags };
