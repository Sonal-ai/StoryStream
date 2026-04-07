const Comment = require('../models/Comment');
const Post = require('../models/Post');

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

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const comment = await Comment.create({
      user: req.user._id,
      post: postId,
      text,
    });

    const createdComment = await Comment.findById(comment._id).populate('user', 'username');
    res.status(201).json(createdComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    // Check if the user owns the comment OR owns the post the comment is on
    const post = await Post.findById(comment.post);
    
    if (!post) {
       res.status(404);
       throw new Error('Associated post not found');
    }

    if (
      comment.user.toString() !== req.user._id.toString() &&
      post.user.toString() !== req.user._id.toString()
    ) {
      res.status(401);
      throw new Error('User not authorized to delete this comment');
    }

    await Comment.deleteOne({ _id: comment._id });
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
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, deleteComment, getComments };
