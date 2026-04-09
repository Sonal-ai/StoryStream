const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const [users] = await pool.execute(
      'SELECT id, username, email, bio FROM Users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = users[0];

    const [followers] = await pool.execute(
      `SELECT u.id, u.username FROM Users u 
       JOIN Follows f ON u.id = f.followerId 
       WHERE f.followingId = ?`,
      [userId]
    );

    const [following] = await pool.execute(
      `SELECT u.id, u.username FROM Users u 
       JOIN Follows f ON u.id = f.followingId 
       WHERE f.followerId = ?`,
      [userId]
    );

    user.followers = followers;
    user.following = following;

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.execute(
      'SELECT * FROM Users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = users[0];
    const username = req.body.username || user.username;
    const bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    let password = user.password;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(req.body.password, salt);
    }

    await pool.execute(
      'UPDATE Users SET username = ?, bio = ?, password = ? WHERE id = ?',
      [username, bio, password, userId]
    );

    res.json({
      id: userId,
      _id: userId,
      username,
      email: user.email,
      bio,
    });
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

    const [targetUsers] = await pool.execute(
      'SELECT id FROM Users WHERE id = ?',
      [targetUserId]
    );

    if (targetUsers.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if currently following
    const [follows] = await pool.execute(
      'SELECT * FROM Follows WHERE followerId = ? AND followingId = ?',
      [currentUserId, targetUserId]
    );

    const isFollowing = follows.length > 0;

    if (isFollowing) {
      // Unfollow
      await pool.execute(
        'DELETE FROM Follows WHERE followerId = ? AND followingId = ?',
        [currentUserId, targetUserId]
      );
    } else {
      // Follow
      await pool.execute(
        'INSERT INTO Follows (followerId, followingId) VALUES (?, ?)',
        [currentUserId, targetUserId]
      );
    }

    res.json({ message: isFollowing ? 'User unfollowed' : 'User followed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateUserProfile, toggleFollowUser };
