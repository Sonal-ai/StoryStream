const mongoose = require('mongoose');

const hashtagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    count: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Hashtag = mongoose.model('Hashtag', hashtagSchema);
module.exports = Hashtag;
