const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');

// @desc    Get posts by hashtag
// @route   GET /api/hashtags/:tag
// @access  Public
const getPostsByHashtag = async (req, res, next) => {
  try {
    const tag = req.params.tag.toLowerCase();

    const posts = await Post.find({ hashtags: tag })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending hashtags
// @route   GET /api/hashtags/trending
// @access  Public
const getTrendingHashtags = async (req, res, next) => {
  try {
    const trending = await Hashtag.find({}).sort({ count: -1 }).limit(10);
    res.json(trending);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPostsByHashtag, getTrendingHashtags };
