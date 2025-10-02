const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema({
  // References
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Instagram Reel Data
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

  // Reel Content (Post-Level Data - Important)
  caption: {
    type: String,
    default: ''
  },
  display_url: String, // Reel thumbnail (current Instagram URL)
  display_url_cached: String, // Last processed Instagram URL (for change detection)
  display_url_cloudinary: String, // Cloudinary URL for reel thumbnail
  video_url: String, // Reel video URL

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
  views: {
    type: Number,
    default: 0,
    index: true
  },

  // Content Analysis (for reels)
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    username: String,
    user_id: String
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Media Properties (for reels)
  duration: Number, // Duration in seconds
  dimensions: {
    width: Number,
    height: Number
  },

  // Instagram Metadata (minimal required)
  posted_at: Date,

  // System fields
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'reels'
});

// Indexes for performance
ReelSchema.index({ user_id: 1, posted_at: -1 });
ReelSchema.index({ user_id: 1, likes: -1 });
ReelSchema.index({ user_id: 1, views: -1 });
ReelSchema.index({ hashtags: 1 });
ReelSchema.index({ tags: 1 });
ReelSchema.index({ created_at: -1 });

// Virtual for reel URL
ReelSchema.virtual('url').get(function() {
  return `https://www.instagram.com/reel/${this.shortcode}/`;
});

// Virtual for engagement total
ReelSchema.virtual('total_engagement').get(function() {
  return (this.likes || 0) + (this.comments || 0);
});

// Static methods
ReelSchema.statics.findByUser = function(userId, limit = 20, skip = 0) {
  return this.find({ user_id: userId })
    .sort({ posted_at: -1 })
    .limit(limit)
    .skip(skip)
    .select('shortcode caption display_url display_url_cloudinary video_url likes comments views hashtags tags posted_at duration');
};

ReelSchema.statics.getEngagementStats = function(userId) {
  return this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total_reels: { $sum: 1 },
        total_likes: { $sum: '$likes' },
        total_comments: { $sum: '$comments' },
        total_views: { $sum: '$views' },
        avg_likes: { $avg: '$likes' },
        avg_comments: { $avg: '$comments' },
        avg_views: { $avg: '$views' }
      }
    }
  ]);
};

ReelSchema.statics.getTopHashtags = function(userId, limit = 10) {
  return this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    { $unwind: '$hashtags' },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
        total_views: { $sum: '$views' },
        avg_views: { $avg: '$views' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

ReelSchema.statics.getTopTags = function(userId, limit = 10) {
  return this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        total_views: { $sum: '$views' },
        avg_views: { $avg: '$views' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Reel', ReelSchema);