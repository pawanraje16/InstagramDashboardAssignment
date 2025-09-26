const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  // Reference to user
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Time period for this analytics snapshot
  period: {
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      required: true
    }
  },

  // Profile Growth Metrics
  growth: {
    followers: {
      start_count: Number,
      end_count: Number,
      net_change: Number,
      percentage_change: Number,
      daily_average: Number
    },
    following: {
      start_count: Number,
      end_count: Number,
      net_change: Number,
      percentage_change: Number
    },
    posts: {
      start_count: Number,
      end_count: Number,
      new_posts: Number
    }
  },

  // Engagement Metrics
  engagement: {
    total_likes: { type: Number, default: 0 },
    total_comments: { type: Number, default: 0 },
    total_views: { type: Number, default: 0 },
    total_shares: { type: Number, default: 0 },

    // Averages
    avg_likes_per_post: { type: Number, default: 0 },
    avg_comments_per_post: { type: Number, default: 0 },
    avg_views_per_post: { type: Number, default: 0 },

    // Rates
    overall_engagement_rate: { type: Number, default: 0 },
    like_rate: { type: Number, default: 0 },
    comment_rate: { type: Number, default: 0 },

    // Engagement quality
    like_to_comment_ratio: { type: Number, default: 0 },
    engagement_consistency: { type: Number, default: 0 } // How consistent engagement is across posts
  },

  // Content Performance
  content: {
    // Content type breakdown
    breakdown: {
      images: { count: Number, total_engagement: Number, avg_engagement: Number },
      videos: { count: Number, total_engagement: Number, avg_engagement: Number },
      carousels: { count: Number, total_engagement: Number, avg_engagement: Number },
      reels: { count: Number, total_engagement: Number, avg_engagement: Number }
    },

    // Best performing content
    top_posts: [{
      post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      shortcode: String,
      engagement_score: Number,
      likes: Number,
      comments: Number,
      media_type: String
    }],

    // Content themes/categories
    popular_themes: [{
      theme: String,
      count: Number,
      avg_engagement: Number
    }],

    // Quality metrics
    average_quality_score: { type: Number, default: 0 },
    visual_consistency: { type: Number, default: 0 }
  },

  // Hashtag Performance
  hashtags: {
    most_used: [{
      tag: String,
      usage_count: Number,
      total_engagement: Number,
      avg_engagement: Number
    }],
    best_performing: [{
      tag: String,
      engagement_rate: Number,
      posts_count: Number
    }],
    trending_tags: [{
      tag: String,
      growth_rate: Number,
      current_usage: Number
    }]
  },

  // Audience Insights
  audience: {
    // Estimated demographics (from engagement patterns)
    estimated_demographics: {
      age_groups: [{
        range: String, // e.g., "18-24", "25-34"
        percentage: Number
      }],
      gender_split: {
        male: Number,
        female: Number,
        other: Number
      },
      top_locations: [{
        location: String,
        percentage: Number
      }]
    },

    // Engagement patterns
    engagement_patterns: {
      peak_hours: [Number], // Hours of day (0-23)
      peak_days: [String], // Days of week
      best_posting_times: [{
        day: String,
        hour: Number,
        engagement_multiplier: Number
      }]
    },

    // Audience behavior
    behavior_metrics: {
      average_time_to_engage: Number, // Minutes
      scroll_through_rate: Number,
      profile_visit_rate: Number
    }
  },

  // Influence Metrics
  influence: {
    overall_score: { type: Number, min: 0, max: 100 },

    // Score components
    reach_score: { type: Number, min: 0, max: 100 },
    engagement_score: { type: Number, min: 0, max: 100 },
    authority_score: { type: Number, min: 0, max: 100 },
    consistency_score: { type: Number, min: 0, max: 100 },

    // Influence areas
    primary_influence_areas: [String],
    geographic_influence: [{
      region: String,
      strength: Number
    }],

    // Brand collaboration potential
    collaboration_score: { type: Number, min: 0, max: 100 },
    estimated_post_value: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    }
  },

  // Competitive Analysis
  competitive: {
    // Relative performance in niche
    niche_ranking: Number,
    niche_percentile: Number,

    // Growth comparison
    growth_vs_niche: Number, // Percentage above/below niche average
    engagement_vs_niche: Number,

    // Similar accounts metrics
    similar_accounts: [{
      username: String,
      similarity_score: Number,
      followers: Number,
      engagement_rate: Number
    }]
  },

  // AI-Generated Insights
  insights: {
    // Automated insights
    key_insights: [String],
    recommendations: [{
      category: String, // 'content', 'posting', 'engagement', 'growth'
      suggestion: String,
      priority: { type: String, enum: ['high', 'medium', 'low'] },
      potential_impact: String
    }],

    // Trend analysis
    trends: [{
      metric: String,
      trend_direction: { type: String, enum: ['up', 'down', 'stable'] },
      trend_strength: Number,
      description: String
    }]
  },

  // Data Quality & Metadata
  metadata: {
    data_completeness: { type: Number, min: 0, max: 100 },
    scrape_quality: { type: Number, min: 0, max: 100 },
    analysis_version: String,
    computed_at: { type: Date, default: Date.now },
    computation_time: Number // milliseconds
  },

  // System fields
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'analytics'
});

// Indexes for performance
AnalyticsSchema.index({ user_id: 1, 'period.start_date': -1 });
AnalyticsSchema.index({ user_id: 1, 'period.type': 1 });
AnalyticsSchema.index({ 'influence.overall_score': -1 });
AnalyticsSchema.index({ created_at: -1 });

// Virtual for period duration
AnalyticsSchema.virtual('period_duration_days').get(function() {
  const timeDiff = this.period.end_date - this.period.start_date;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
});

// Methods
AnalyticsSchema.methods.calculateInfluenceScore = function() {
  const weights = {
    reach: 0.3,
    engagement: 0.35,
    authority: 0.2,
    consistency: 0.15
  };

  const weightedScore = (
    (this.influence.reach_score || 0) * weights.reach +
    (this.influence.engagement_score || 0) * weights.engagement +
    (this.influence.authority_score || 0) * weights.authority +
    (this.influence.consistency_score || 0) * weights.consistency
  );

  this.influence.overall_score = Math.round(weightedScore);
  return this.influence.overall_score;
};

AnalyticsSchema.methods.addInsight = function(insight) {
  this.insights.key_insights.push(insight);
  this.updated_at = new Date();
  return this.save();
};

AnalyticsSchema.methods.addRecommendation = function(category, suggestion, priority = 'medium') {
  this.insights.recommendations.push({
    category,
    suggestion,
    priority,
    potential_impact: this.estimateImpact(category, priority)
  });
  return this.save();
};

AnalyticsSchema.methods.estimateImpact = function(category, priority) {
  const impacts = {
    high: ['Significant growth potential', 'Major engagement boost', 'Strong influence increase'],
    medium: ['Moderate improvement expected', 'Steady growth potential', 'Good optimization opportunity'],
    low: ['Minor enhancement', 'Small improvement', 'Fine-tuning opportunity']
  };

  const options = impacts[priority] || impacts.medium;
  return options[Math.floor(Math.random() * options.length)];
};

// Static methods
AnalyticsSchema.statics.getLatestAnalytics = function(userId) {
  return this.findOne({ user_id: userId })
    .sort({ created_at: -1 })
    .populate('user_id', 'instagram_username profile');
};

AnalyticsSchema.statics.getAnalyticsByPeriod = function(userId, periodType, limit = 12) {
  return this.find({
    user_id: userId,
    'period.type': periodType
  })
  .sort({ 'period.start_date': -1 })
  .limit(limit);
};

AnalyticsSchema.statics.getGrowthTrend = function(userId, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return this.find({
    user_id: userId,
    'period.type': 'monthly',
    'period.start_date': { $gte: startDate }
  })
  .sort({ 'period.start_date': 1 })
  .select('period growth.followers engagement.overall_engagement_rate influence.overall_score');
};

AnalyticsSchema.statics.getTopInfluencers = function(limit = 100) {
  return this.aggregate([
    { $match: { 'period.type': 'monthly' } },
    { $sort: { created_at: -1 } },
    {
      $group: {
        _id: '$user_id',
        latest_score: { $first: '$influence.overall_score' },
        latest_followers: { $first: '$growth.followers.end_count' },
        latest_engagement: { $first: '$engagement.overall_engagement_rate' },
        latest_analysis: { $first: '$$ROOT' }
      }
    },
    { $sort: { latest_score: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ]);
};

AnalyticsSchema.statics.getNicheAnalysis = function(niche, limit = 50) {
  return this.aggregate([
    { $match: { 'influence.primary_influence_areas': niche } },
    { $sort: { created_at: -1 } },
    {
      $group: {
        _id: '$user_id',
        latest_score: { $first: '$influence.overall_score' },
        latest_analysis: { $first: '$$ROOT' }
      }
    },
    { $sort: { latest_score: -1 } },
    { $limit: limit }
  ]);
};

// Pre-save middleware
AnalyticsSchema.pre('save', function(next) {
  this.updated_at = new Date();

  // Auto-calculate influence score if components exist
  if (this.influence.reach_score && this.influence.engagement_score) {
    this.calculateInfluenceScore();
  }

  next();
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);