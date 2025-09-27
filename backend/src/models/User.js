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

  // Profile Information (Basic Information - Mandatory)
  profile: {
    full_name: String,
    profile_pic_url: String,
    is_verified: { type: Boolean, default: false },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts_count: { type: Number, default: 0 }
  },

  // Analytics Metrics (Engagement & Analytics - Mandatory)
  analytics: {
    engagement_rate: { type: Number, default: 0 },
    avg_likes: { type: Number, default: 0 },
    avg_comments: { type: Number, default: 0 }
  },

  // Minimal scraping metadata
  last_scraped: { type: Date, default: Date.now },
  scrape_status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },

  // System fields
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance
UserSchema.index({ instagram_username: 1 });
UserSchema.index({ 'profile.followers': -1 });
UserSchema.index({ last_scraped: 1 });
UserSchema.index({ created_at: -1 });

// Virtual for posts
UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user_id'
});

// Methods
UserSchema.methods.updateAnalytics = function(analyticsData) {
  this.analytics = { ...this.analytics, ...analyticsData };
  this.last_scraped = new Date();
  this.updated_at = new Date();
  return this.save();
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
    .sort({ 'profile.followers': -1 })
    .limit(limit)
    .select('instagram_username profile.full_name profile.followers profile.is_verified');
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