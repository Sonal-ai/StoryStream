const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        followers: { select: { id: true, username: true } },
        following: { select: { id: true, username: true } },
      },
    });

    if (user) {
      delete user.password;
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user) {
      const dataToUpdate = {
        username: req.body.username || user.username,
        bio: req.body.bio !== undefined ? req.body.bio : user.bio
      };

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        dataToUpdate.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: dataToUpdate
      });

      res.json({
        id: updatedUser.id,
        _id: updatedUser.id, // For backwards compatibility
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      res.status(400);
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if currently following
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { following: { select: { id: true } } }
    });

    const isFollowing = currentUser.following.some(f => f.id === targetUserId);

    if (isFollowing) {
      // Unfollow
      await prisma.user.update({
        where: { id: currentUserId },
        data: {
          following: {
            disconnect: { id: targetUserId }
          }
        }
      });
    } else {
      // Follow
      await prisma.user.update({
        where: { id: currentUserId },
        data: {
          following: {
            connect: { id: targetUserId }
          }
        }
      });
    }

    res.json({ message: isFollowing ? 'User unfollowed' : 'User followed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateUserProfile, toggleFollowUser };
