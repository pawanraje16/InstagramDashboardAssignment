const User = require('../models/User');
const Post = require('../models/Post');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Database Service
 * Handles all database operations with error handling and logging
 */
class DatabaseService {
  constructor() {
    this.logger = logger.withContext('DatabaseService');
  }

  /**
   * Find user by Instagram username
   * @param {string} username - Instagram username
   * @returns {Object|null} User document or null
   */
  async findUserByUsername(username) {
    try {
      this.logger.info(`Finding user by username: ${username}`);

      const user = await User.findByUsername(username)
        .populate('recent_analytics')
        .lean();

      if (user) {
        this.logger.info(`User found: ${username} (ID: ${user._id})`);
      } else {
        this.logger.info(`User not found: ${username}`);
      }

      return user;

    } catch (error) {
      this.logger.error(`Error finding user ${username}:`, error);
      throw new ApiError(500, 'Database error while finding user');
    }
  }

  /**
   * Create or update user profile
   * @param {Object} profileData - Instagram profile data
   * @returns {Object} User document
   */
  async upsertUser(profileData) {
    try {
      const { instagram_username, instagram_id } = profileData;
      this.logger.info(`Upserting user: ${instagram_username}`);

      const updateData = {
        ...profileData,
        'scraping.last_scraped': new Date(),
        'scraping.scrape_status': 'completed',
        updated_at: new Date()
      };

      const user = await User.findOneAndUpdate(
        { instagram_username: instagram_username.toLowerCase() },
        {
          $set: updateData,
          $inc: { 'scraping.scrape_count': 1 }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      this.logger.info(`User upserted successfully: ${instagram_username} (ID: ${user._id})`);
      return user;

    } catch (error) {
      this.logger.error('Error upserting user:', error);

      if (error.code === 11000) {
        throw new ApiError(409, 'User with this Instagram ID already exists');
      }

      if (error.name === 'ValidationError') {
        throw new ApiError(400, `Validation error: ${error.message}`);
      }

      throw new ApiError(500, 'Database error while saving user');
    }
  }

  /**
   * Save posts for a user
   * @param {string} userId - User ObjectId
   * @param {Array} postsData - Array of post data
   * @returns {Array} Saved posts
   */
  async savePosts(userId, postsData) {
    try {
      this.logger.info(`Saving ${postsData.length} posts for user: ${userId}`);

      const savedPosts = [];

      for (const postData of postsData) {
        try {
          const postWithUserId = {
            ...postData,
            user_id: userId,
            scraped_at: new Date()
          };

          const post = await Post.findOneAndUpdate(
            { instagram_post_id: postData.instagram_post_id },
            { $set: postWithUserId },
            {
              new: true,
              upsert: true,
              runValidators: true
            }
          );

          savedPosts.push(post);

        } catch (postError) {
          this.logger.warn(`Error saving individual post ${postData.instagram_post_id}:`, postError);
          // Continue with other posts even if one fails
          continue;
        }
      }

      this.logger.info(`Successfully saved ${savedPosts.length}/${postsData.length} posts`);
      return savedPosts;

    } catch (error) {
      this.logger.error('Error saving posts:', error);
      throw new ApiError(500, 'Database error while saving posts');
    }
  }

  /**
   * Save analytics for a user
   * @param {string} userId - User ObjectId
   * @param {Object} analyticsData - Analytics data
   * @returns {Object} Saved analytics
   */
  async saveAnalytics(userId, analyticsData) {
    try {
      this.logger.info(`Saving analytics for user: ${userId}`);

      const analyticsWithUserId = {
        user_id: userId,
        period: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end_date: new Date(),
          type: 'monthly'
        },
        engagement: {
          total_likes: analyticsData.total_likes || 0,
          total_comments: analyticsData.total_comments || 0,
          total_views: analyticsData.total_views || 0,
          avg_likes_per_post: analyticsData.avg_likes || 0,
          avg_comments_per_post: analyticsData.avg_comments || 0,
          overall_engagement_rate: analyticsData.engagement_rate || 0
        },
        content: {
          breakdown: {
            images: {
              count: analyticsData.content_breakdown?.images || 0,
              total_engagement: 0,
              avg_engagement: 0
            },
            videos: {
              count: analyticsData.content_breakdown?.videos || 0,
              total_engagement: 0,
              avg_engagement: 0
            },
            carousels: {
              count: analyticsData.content_breakdown?.carousels || 0,
              total_engagement: 0,
              avg_engagement: 0
            },
            reels: {
              count: analyticsData.content_breakdown?.reels || 0,
              total_engagement: 0,
              avg_engagement: 0
            }
          },
          top_posts: [],
          popular_themes: []
        },
        hashtags: {
          most_used: analyticsData.top_hashtags || [],
          best_performing: [],
          trending_tags: []
        },
        influence: {
          overall_score: analyticsData.influence_score || 0,
          reach_score: Math.min(100, (analyticsData.influence_score || 0) + 10),
          engagement_score: Math.min(100, analyticsData.engagement_rate * 10),
          authority_score: analyticsData.influence_score || 0,
          consistency_score: Math.min(100, (analyticsData.influence_score || 0) + 5)
        },
        metadata: {
          data_completeness: 100,
          scrape_quality: 95,
          analysis_version: '1.0',
          computed_at: new Date(),
          computation_time: Date.now()
        }
      };

      const analytics = await Analytics.create(analyticsWithUserId);

      // Also update user's analytics field
      await User.findByIdAndUpdate(userId, {
        $set: {
          'analytics.influence_score': analyticsData.influence_score || 0,
          'analytics.engagement_rate': analyticsData.engagement_rate || 0,
          'analytics.avg_likes': analyticsData.avg_likes || 0,
          'analytics.avg_comments': analyticsData.avg_comments || 0,
          'analytics.content_types': analyticsData.content_breakdown || {}
        }
      });

      this.logger.info(`Analytics saved successfully for user: ${userId}`);
      return analytics;

    } catch (error) {
      this.logger.error('Error saving analytics:', error);
      throw new ApiError(500, 'Database error while saving analytics');
    }
  }

  /**
   * Get user's posts
   * @param {string} userId - User ObjectId
   * @param {Object} options - Query options (limit, skip, sortBy)
   * @returns {Array} User posts
   */
  async getUserPosts(userId, options = {}) {
    try {
      const { limit = 20, skip = 0, sortBy = '-instagram_data.posted_at' } = options;

      this.logger.info(`Getting posts for user: ${userId}, limit: ${limit}, skip: ${skip}`);

      const posts = await Post.find({ user_id: userId })
        .sort(sortBy)
        .limit(limit)
        .skip(skip)
        .lean();

      this.logger.info(`Retrieved ${posts.length} posts for user: ${userId}`);
      return posts;

    } catch (error) {
      this.logger.error(`Error getting posts for user ${userId}:`, error);
      throw new ApiError(500, 'Database error while retrieving posts');
    }
  }

  /**
   * Get user's analytics
   * @param {string} userId - User ObjectId
   * @returns {Object} Latest analytics
   */
  async getUserAnalytics(userId) {
    try {
      this.logger.info(`Getting analytics for user: ${userId}`);

      const analytics = await Analytics.findOne({ user_id: userId })
        .sort({ created_at: -1 })
        .lean();

      if (analytics) {
        this.logger.info(`Analytics found for user: ${userId}`);
      } else {
        this.logger.info(`No analytics found for user: ${userId}`);
      }

      return analytics;

    } catch (error) {
      this.logger.error(`Error getting analytics for user ${userId}:`, error);
      throw new ApiError(500, 'Database error while retrieving analytics');
    }
  }

  /**
   * Search users by username or full name
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Array} Matching users
   */
  async searchUsers(query, limit = 20) {
    try {
      this.logger.info(`Searching users with query: ${query}`);

      const users = await User.searchUsers(query, limit);

      this.logger.info(`Found ${users.length} users matching query: ${query}`);
      return users;

    } catch (error) {
      this.logger.error(`Error searching users with query ${query}:`, error);
      throw new ApiError(500, 'Database error while searching users');
    }
  }

  /**
   * Get top influencers
   * @param {number} limit - Number of influencers to return
   * @returns {Array} Top influencers
   */
  async getTopInfluencers(limit = 50) {
    try {
      this.logger.info(`Getting top ${limit} influencers`);

      const influencers = await User.getTopInfluencers(limit);

      this.logger.info(`Retrieved ${influencers.length} top influencers`);
      return influencers;

    } catch (error) {
      this.logger.error('Error getting top influencers:', error);
      throw new ApiError(500, 'Database error while retrieving top influencers');
    }
  }

  /**
   * Check if user can be scraped again (rate limiting)
   * @param {string} username - Instagram username
   * @returns {Object} Rate limit status
   */
  async checkRateLimit(username) {
    try {
      const user = await User.findByUsername(username);

      if (!user) {
        return {
          canScrape: true,
          reason: 'new_user'
        };
      }

      // Reset daily limit if needed
      await user.resetDailyLimit();

      const canScrape = user.canScrapeAgain();

      return {
        canScrape,
        reason: canScrape ? 'allowed' : 'rate_limited',
        lastScraped: user.scraping.last_scraped,
        scrapeCount: user.scraping.scrape_count,
        dailyScrapes: user.scraping.daily_scrapes,
        nextAllowedScrape: canScrape ? null : new Date(user.scraping.last_scraped.getTime() + 4 * 60 * 60 * 1000)
      };

    } catch (error) {
      this.logger.error(`Error checking rate limit for ${username}:`, error);
      throw new ApiError(500, 'Database error while checking rate limit');
    }
  }

  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  async getStats() {
    try {
      this.logger.info('Getting database statistics');

      const [userCount, postCount, analyticsCount] = await Promise.all([
        User.countDocuments({ is_active: true }),
        Post.countDocuments({ is_active: true }),
        Analytics.countDocuments({ is_active: true })
      ]);

      const stats = {
        users: userCount,
        posts: postCount,
        analytics: analyticsCount,
        updated_at: new Date().toISOString()
      };

      this.logger.info('Database statistics retrieved:', stats);
      return stats;

    } catch (error) {
      this.logger.error('Error getting database statistics:', error);
      throw new ApiError(500, 'Database error while retrieving statistics');
    }
  }

  /**
   * Update user's scraping status
   * @param {string} userId - User ObjectId
   * @param {string} status - Scraping status
   * @param {string} error - Error message (if any)
   */
  async updateScrapingStatus(userId, status, error = null) {
    try {
      const updateData = {
        'scraping.scrape_status': status,
        'scraping.last_scraped': new Date()
      };

      if (error) {
        updateData['scraping.last_error'] = error;
      }

      await User.findByIdAndUpdate(userId, { $set: updateData });

      this.logger.info(`Updated scraping status for user ${userId}: ${status}`);

    } catch (dbError) {
      this.logger.error(`Error updating scraping status for user ${userId}:`, dbError);
      // Don't throw error here to avoid cascading failures
    }
  }
}

module.exports = DatabaseService;