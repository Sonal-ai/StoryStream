const { prisma } = require('../config/db');

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

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user.id,
        postId: postId,
        text,
      },
      include: {
        user: { select: { id: true, username: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      include: {
        post: { select: { userId: true } }
      }
    });

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    // Check if the user owns the comment OR owns the post the comment is on
    if (
      comment.userId !== req.user.id &&
      comment.post.userId !== req.user.id
    ) {
      res.status(401);
      throw new Error('User not authorized to delete this comment');
    }

    await prisma.comment.delete({ where: { id: comment.id } });
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
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.postId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } }
      }
    });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, deleteComment, getComments };
