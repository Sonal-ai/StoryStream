const { prisma } = require('../config/db');

// @desc    Get posts by hashtag
// @route   GET /api/hashtags/:tag
// @access  Public
const getPostsByHashtag = async (req, res, next) => {
  try {
    const tag = req.params.tag.toLowerCase();

    const hashtagWithPosts = await prisma.hashtag.findUnique({
      where: { name: tag },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, username: true } },
            likes: { select: { id: true } },
            hashtags: true
          }
        }
      }
    });

    if (!hashtagWithPosts) {
      return res.json([]);
    }

    res.json(hashtagWithPosts.posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending hashtags
// @route   GET /api/hashtags/trending
// @access  Public
const getTrendingHashtags = async (req, res, next) => {
  try {
    const trending = await prisma.hashtag.findMany({
      orderBy: { count: 'desc' },
      take: 10
    });
    res.json(trending);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPostsByHashtag, getTrendingHashtags };
