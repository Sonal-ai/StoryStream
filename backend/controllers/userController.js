const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username')
      .populate('following', 'username');

    if (user) {
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
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
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
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      res.status(400);
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ message: isFollowing ? 'User unfollowed' : 'User followed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateUserProfile, toggleFollowUser };
