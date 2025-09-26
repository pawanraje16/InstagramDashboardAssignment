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

  // Post Content
  media_type: {
    type: String,
    enum: ['image', 'video', 'carousel', 'reel'],
    required: true,
    index: true
  },
  caption: {
    type: String,
    default: ''
  },
  display_url: String,
  video_url: String,
  thumbnail_url: String,

  // Engagement Metrics
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
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },

  // Content Analysis
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    username: String,
    user_id: String
  }],

  // Media Properties
  dimensions: {
    width: Number,
    height: Number
  },
  duration: Number, // For videos/reels in seconds

  // Location Data
  location: {
    id: String,
    name: String,
    slug: String,
    lat: Number,
    lng: Number
  },

  // AI-Generated Content Analysis
  analysis: {
    // Auto-generated tags
    tags: [{
      name: String,
      confidence: Number,
      category: {
        type: String,
        enum: ['food', 'travel', 'fashion', 'lifestyle', 'business', 'fitness', 'beauty', 'technology', 'art', 'other']
      }
    }],

    // Vibe/Ambience Classification
    vibe: {
      primary: {
        type: String,
        enum: ['casual', 'aesthetic', 'luxury', 'professional', 'artistic', 'vintage', 'minimal', 'vibrant']
      },
      secondary: [String],
      confidence: Number
    },

    // Quality Indicators
    quality: {
      overall_score: { type: Number, min: 0, max: 100 },
      lighting_score: { type: Number, min: 0, max: 100 },
      composition_score: { type: Number, min: 0, max: 100 },
      visual_appeal_score: { type: Number, min: 0, max: 100 },
      consistency_score: { type: Number, min: 0, max: 100 }
    },

    // Content Description
    description: String,
    keywords: [String],

    // Colors
    dominant_colors: [{
      color: String, // hex code
      percentage: Number
    }],

    // Objects detected
    objects: [{
      name: String,
      confidence: Number,
      bounding_box: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      }
    }],

    // Faces detected
    faces: {
      count: Number,
      emotions: [String],
      age_range: String,
      gender: String
    }
  },

  // Performance Metrics
  performance: {
    engagement_rate: { type: Number, default: 0 },
    like_to_comment_ratio: { type: Number, default: 0 },
    performance_score: { type: Number, default: 0 }, // Relative to account average
    viral_potential: { type: Number, default: 0 },

    // Time-based metrics
    peak_engagement_time: Date,
    engagement_velocity: Number, // Likes/comments per hour in first 24hrs
  },

  // Instagram Metadata
  instagram_data: {
    taken_at: Date,
    posted_at: Date,
    accessibility_caption: String,
    is_paid_partnership: Boolean,
    tagged_users: [{
      username: String,
      full_name: String,
      user_id: String
    }]
  },

  // Scraping Metadata
  scraped_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  scrape_version: { type: String, default: '1.0' },

  // System fields
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'posts'
});

// Compound indexes for performance
PostSchema.index({ user_id: 1, 'instagram_data.posted_at': -1 });
PostSchema.index({ user_id: 1, likes: -1 });
PostSchema.index({ user_id: 1, media_type: 1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ 'analysis.tags.category': 1 });
PostSchema.index({ 'performance.engagement_rate': -1 });
PostSchema.index({ created_at: -1 });

// Virtual for post URL
PostSchema.virtual('url').get(function() {
  const baseUrl = this.media_type === 'reel' ? 'https://www.instagram.com/reel/' : 'https://www.instagram.com/p/';
  return `${baseUrl}${this.shortcode}/`;
});

// Virtual for engagement total
PostSchema.virtual('total_engagement').get(function() {
  return (this.likes || 0) + (this.comments || 0);
});

// Methods
PostSchema.methods.calculateEngagementRate = function(followerCount) {
  if (!followerCount || followerCount === 0) return 0;
  const totalEngagement = this.total_engagement;
  this.performance.engagement_rate = (totalEngagement / followerCount) * 100;
  return this.performance.engagement_rate;
};

PostSchema.methods.updatePerformanceMetrics = function(accountAverages) {
  // Calculate performance score relative to account average
  const avgLikes = accountAverages.likes || 1;
  const avgComments = accountAverages.comments || 1;

  const likePerformance = this.likes / avgLikes;
  const commentPerformance = this.comments / avgComments;

  this.performance.performance_score = Math.round(((likePerformance + commentPerformance) / 2) * 100);
  this.performance.like_to_comment_ratio = this.comments > 0 ? this.likes / this.comments : this.likes;

  return this.save();
};

PostSchema.methods.addAnalysis = function(analysisData) {
  this.analysis = { ...this.analysis, ...analysisData };
  this.last_updated = new Date();
  return this.save();
};

// Static methods
PostSchema.statics.findByUser = function(userId, limit = 20, skip = 0) {
  return this.find({ user_id: userId })
    .sort({ 'instagram_data.posted_at': -1 })
    .limit(limit)
    .skip(skip);
};

PostSchema.statics.getTopPerformingPosts = function(userId, limit = 10) {
  return this.find({ user_id: userId })
    .sort({ 'performance.engagement_rate': -1 })
    .limit(limit)
    .select('shortcode media_type likes comments performance.engagement_rate instagram_data.posted_at');
};

PostSchema.statics.getPostsByHashtag = function(hashtag, limit = 50) {
  return this.find({ hashtags: hashtag })
    .sort({ 'performance.engagement_rate': -1 })
    .limit(limit)
    .populate('user_id', 'instagram_username profile.full_name');
};

PostSchema.statics.getRecentPosts = function(userId, days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.find({
    user_id: userId,
    'instagram_data.posted_at': { $gte: dateThreshold }
  }).sort({ 'instagram_data.posted_at': -1 });
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
        avg_comments: { $avg: '$comments' },
        avg_engagement_rate: { $avg: '$performance.engagement_rate' },
        best_performing: { $max: '$performance.engagement_rate' }
      }
    }
  ]);
};

PostSchema.statics.getContentBreakdown = function(userId) {
  return this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$media_type',
        count: { $sum: 1 },
        avg_likes: { $avg: '$likes' },
        avg_comments: { $avg: '$comments' },
        total_engagement: { $sum: { $add: ['$likes', '$comments'] } }
      }
    }
  ]);
};

// Pre-save middleware
PostSchema.pre('save', function(next) {
  // Auto-calculate engagement rate if we have the data
  if (this.isModified('likes') || this.isModified('comments')) {
    this.last_updated = new Date();
  }
  next();
});

module.exports = mongoose.model('Post', PostSchema);