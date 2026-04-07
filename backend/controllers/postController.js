const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');

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

    // Extract hashtags from text (words starting with #)
    const hashtags = text.match(/#[a-z0-9_]+/gi) || [];
    const uniqueHashtags = [...new Set(hashtags.map((tag) => tag.toLowerCase().replace('#', '')))];

    const post = await Post.create({
      user: req.user._id,
      text,
      imageUrl,
      hashtags: uniqueHashtags,
    });

    // Update Hashtag collection
    for (const tag of uniqueHashtags) {
      await Hashtag.findOneAndUpdate(
        { name: tag },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    }

    const createdPost = await Post.findById(post._id).populate('user', 'username bio');
    res.status(201).json(createdPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized to delete this post');
    }

    // Decrease hashtag counts
    for (const tag of post.hashtags) {
      const hashtag = await Hashtag.findOne({ name: tag });
      if (hashtag) {
        hashtag.count -= 1;
        if (hashtag.count <= 0) {
          await Hashtag.deleteOne({ _id: hashtag._id });
        } else {
          await hashtag.save();
        }
      }
    }

    await Post.deleteOne({ _id: post._id });
    res.json({ message: 'Post removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (global feed)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Post.countDocuments({});
    const posts = await Post.find({})
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ posts, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by specific user
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      post.likes.pull(req.user._id);
    } else {
      // Like
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ message: isLiked ? 'Post unliked' : 'Post liked', likesCount: post.likes.length });
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
