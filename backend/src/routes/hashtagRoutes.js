const express = require('express');
const {
  getPostsByHashtag,
  getTrendingHashtags,
} = require('../controllers/hashtagController');

const router = express.Router();

router.get('/trending', getTrendingHashtags);
router.get('/:tag', getPostsByHashtag);

module.exports = router;
