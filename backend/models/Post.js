const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    hashtags: [
      {
        type: String, // String representation of the hashtag, e.g., "coding"
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
