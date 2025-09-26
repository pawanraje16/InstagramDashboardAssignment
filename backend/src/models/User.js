const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Instagram Profile Data
  instagram_username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  instagram_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Profile Information
  profile: {
    full_name: String,
    biography: String,
    profile_pic_url: String,
    external_url: String,
    is_verified: { type: Boolean, default: false },
    is_business: { type: Boolean, default: false },
    is_private: { type: Boolean, default: false },

    // Follower Metrics
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts_count: { type: Number, default: 0 }
  },

  // Analytics Metrics
  analytics: {
    influence_score: { type: Number, default: 0, min: 0, max: 100 },
    engagement_rate: { type: Number, default: 0 },
    avg_likes: { type: Number, default: 0 },
    avg_comments: { type: Number, default: 0 },

    // Content breakdown
    content_types: {
      images: { type: Number, default: 0 },
      videos: { type: Number, default: 0 },
      carousels: { type: Number, default: 0 },
      reels: { type: Number, default: 0 }
    },

    // Growth metrics (calculated over time)
    growth_rate: { type: Number, default: 0 },
    best_posting_times: [String],
    top_hashtags: [{ tag: String, count: Number }],

    // Performance indicators
    quality_score: { type: Number, default: 0 },
    consistency_score: { type: Number, default: 0 }
  },

  // Scraping Metadata
  scraping: {
    last_scraped: { type: Date, default: Date.now },
    scrape_count: { type: Number, default: 0 },
    next_scrape: Date,
    scrape_status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    last_error: String,

    // Rate limiting
    daily_scrapes: { type: Number, default: 0 },
    last_scrape_reset: { type: Date, default: Date.now }
  },

  // System Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },

  // Soft delete
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance
UserSchema.index({ instagram_username: 1 });
UserSchema.index({ 'profile.followers': -1 });
UserSchema.index({ 'analytics.influence_score': -1 });
UserSchema.index({ 'scraping.last_scraped': 1 });
UserSchema.index({ created_at: -1 });

// Virtual for posts
UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user_id'
});

// Virtual for recent analytics
UserSchema.virtual('recent_analytics', {
  ref: 'Analytics',
  localField: '_id',
  foreignField: 'user_id',
  options: { sort: { created_at: -1 }, limit: 1 }
});

// Methods
UserSchema.methods.updateAnalytics = function(analyticsData) {
  this.analytics = { ...this.analytics, ...analyticsData };
  this.scraping.last_scraped = new Date();
  this.updated_at = new Date();
  return this.save();
};

UserSchema.methods.incrementScrapeCount = function() {
  this.scraping.scrape_count += 1;
  this.scraping.daily_scrapes += 1;
  return this.save();
};

UserSchema.methods.canScrapeAgain = function() {
  const now = new Date();
  const lastScrape = this.scraping.last_scraped;
  const hoursSinceLastScrape = (now - lastScrape) / (1000 * 60 * 60);

  // Allow scraping every 4 hours, max 6 times per day
  return hoursSinceLastScrape >= 4 && this.scraping.daily_scrapes < 6;
};

UserSchema.methods.resetDailyLimit = function() {
  const now = new Date();
  const lastReset = this.scraping.last_scrape_reset;

  if (now.getDate() !== lastReset.getDate()) {
    this.scraping.daily_scrapes = 0;
    this.scraping.last_scrape_reset = now;
    return this.save();
  }
};

// Static methods
UserSchema.statics.findByUsername = function(username) {
  return this.findOne({
    instagram_username: username.toLowerCase(),
    is_active: true
  });
};

UserSchema.statics.getTopInfluencers = function(limit = 10) {
  return this.find({ is_active: true })
    .sort({ 'analytics.influence_score': -1 })
    .limit(limit)
    .select('instagram_username profile.full_name profile.followers analytics.influence_score');
};

UserSchema.statics.searchUsers = function(query, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { instagram_username: searchRegex },
      { 'profile.full_name': searchRegex }
    ],
    is_active: true
  })
  .limit(limit)
  .select('instagram_username profile.full_name profile.profile_pic_url profile.followers profile.is_verified');
};

// Pre-save middleware
UserSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Pre-find middleware to exclude inactive users
UserSchema.pre(/^find/, function(next) {
  this.where({ is_active: { $ne: false } });
  next();
});

module.exports = mongoose.model('User', UserSchema);