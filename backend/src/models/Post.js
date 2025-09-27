const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  // References
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Instagram Post Data
  instagram_post_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shortcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Post Content (Post-Level Data - Important) - Images/Carousel only
  media_type: {
    type: String,
    enum: ['image', 'carousel'],
    required: true,
    index: true
  },
  caption: {
    type: String,
    default: ''
  },
  display_url: String, // Post image/thumbnail

  // Engagement Metrics (Post-Level Data - Important)
  likes: {
    type: Number,
    default: 0,
    index: true
  },
  comments: {
    type: Number,
    default: 0,
    index: true
  },

  // Instagram Metadata (minimal required)
  posted_at: Date,

  // System fields
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'posts'
});

// Indexes for performance
PostSchema.index({ user_id: 1, posted_at: -1 });
PostSchema.index({ user_id: 1, likes: -1 });
PostSchema.index({ created_at: -1 });

// Virtual for post URL
PostSchema.virtual('url').get(function() {
  return `https://www.instagram.com/p/${this.shortcode}/`;
});

// Virtual for engagement total
PostSchema.virtual('total_engagement').get(function() {
  return (this.likes || 0) + (this.comments || 0);
});

// Static methods
PostSchema.statics.findByUser = function(userId, limit = 20, skip = 0) {
  return this.find({ user_id: userId })
    .sort({ posted_at: -1 })
    .limit(limit)
    .skip(skip)
    .select('shortcode media_type caption display_url likes comments posted_at');
};

PostSchema.statics.getEngagementStats = function(userId) {
  return this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total_posts: { $sum: 1 },
        total_likes: { $sum: '$likes' },
        total_comments: { $sum: '$comments' },
        avg_likes: { $avg: '$likes' },
        avg_comments: { $avg: '$comments' }
      }
    }
  ]);
};

module.exports = mongoose.model('Post', PostSchema);