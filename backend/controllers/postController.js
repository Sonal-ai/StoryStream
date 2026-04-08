const { prisma } = require('../config/db');

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
    const hashtagsArray = text.match(/#[a-z0-9_]+/gi) || [];
    const uniqueHashtags = [...new Set(hashtagsArray.map((tag) => tag.toLowerCase().replace('#', '')))];

    const tagsToConnect = [];
    
    // Update Hashtag collection counts and prepare connections
    for (const tag of uniqueHashtags) {
      const existing = await prisma.hashtag.findUnique({ where: { name: tag } });
      if (existing) {
        const updated = await prisma.hashtag.update({
          where: { id: existing.id },
          data: { count: existing.count + 1 }
        });
        tagsToConnect.push({ id: updated.id });
      } else {
        const created = await prisma.hashtag.create({
          data: { name: tag, count: 1 }
        });
        tagsToConnect.push({ id: created.id });
      }
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        text,
        imageUrl: imageUrl || null,
        hashtags: {
          connect: tagsToConnect
        }
      },
      include: {
        user: {
          select: { username: true, bio: true }
        },
        hashtags: true
      }
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: { hashtags: true }
    });

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check user owns the post
    if (post.userId !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized to delete this post');
    }

    // Decrease hashtag counts
    for (const hashtag of post.hashtags) {
      const tag = await prisma.hashtag.findUnique({ where: { id: hashtag.id } });
      if (tag) {
        if (tag.count <= 1) {
          await prisma.hashtag.delete({ where: { id: tag.id } });
        } else {
          await prisma.hashtag.update({
            where: { id: tag.id },
            data: { count: tag.count - 1 }
          });
        }
      }
    }

    await prisma.post.delete({ where: { id: post.id } });
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

    const count = await prisma.post.count();
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: pageSize * (page - 1),
      include: {
        user: { select: { id: true, username: true } },
        likes: { select: { id: true } },
        hashtags: true
      }
    });

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
    const posts = await prisma.post.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        likes: { select: { id: true } },
        hashtags: true
      }
    });

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
    const postId = req.params.id;
    const currentUserId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { likes: { select: { id: true } } }
    });

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const isLiked = post.likes.some(u => u.id === currentUserId);

    let updatedPost;
    if (isLiked) {
      // Unlike
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          likes: { disconnect: { id: currentUserId } }
        },
        include: { likes: { select: { id: true } } }
      });
    } else {
      // Like
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          likes: { connect: { id: currentUserId } }
        },
        include: { likes: { select: { id: true } } }
      });
    }

    res.json({ message: isLiked ? 'Post unliked' : 'Post liked', likesCount: updatedPost.likes.length });
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
