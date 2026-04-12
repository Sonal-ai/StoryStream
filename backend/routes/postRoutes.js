const express = require('express');
const router = express.Router();
const {
  createPost, deletePost, getAllPosts, getFeed, getPostById, getPostsByHashtag,
} = require('../controllers/postController');
const { addComment, deleteComment, getComments } = require('../controllers/commentController');
const { likePost, unlikePost, getPostLikes }     = require('../controllers/likeController');
const { protect } = require('../middleware/authMiddleware');

// Feed routes
router.get('/feed',    protect, getFeed);       // Personalized feed (JWT required)
router.get('/',                 getAllPosts);    // Global feed (public)

// Hashtag route (before /:id to avoid conflict)
router.get('/hashtag/:tag', getPostsByHashtag);

// CRUD
router.post('/',     protect, createPost);
router.get('/:id',           getPostById);
router.delete('/:id', protect, deletePost);

// Comments on a post
router.get('/:postId/comments',   getComments);
router.post('/:postId/comments',  protect, addComment);

// Likes on a post
router.get('/:postId/likes',      getPostLikes);
router.post('/:postId/like',      protect, likePost);
router.delete('/:postId/like',    protect, unlikePost);

module.exports = router;
