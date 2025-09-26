const InstagramService = require('../services/InstagramService');
const DatabaseService = require('../services/DatabaseService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * User Controller
 * Handles all user-related API endpoints
 */
class UserController {
  constructor() {
    this.instagramService = new InstagramService();
    this.databaseService = new DatabaseService();
    this.logger = logger.withContext('UserController');

    // Bind methods to preserve 'this' context
    this.getUser = this.getUser.bind(this);
    this.refreshUser = this.refreshUser.bind(this);
    this.getUserPosts = this.getUserPosts.bind(this);
    this.getUserAnalytics = this.getUserAnalytics.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.getTopInfluencers = this.getTopInfluencers.bind(this);
  }

  /**
   * Get user profile data
   * Returns cached data if available, otherwise fetches from Instagram
   *
   * @route GET /api/user/:username
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUser(req, res, next) {
    try {
      const { username } = req.params;

      if (!username) {
        throw ApiError.badRequest('Username parameter is required');
      }

      this.logger.info(`Getting user data for: ${username}`);

      // Check if user exists in database
      const existingUser = await this.databaseService.findUserByUsername(username);

      if (existingUser) {
        // Check if we should refresh the data
        const rateLimitCheck = await this.databaseService.checkRateLimit(username);

        if (!rateLimitCheck.canScrape) {
          // Return cached data
          this.logger.info(`Returning cached data for ${username}`);

          const response = ApiResponse.cached(
            {
              profile: existingUser,
              cache_info: {
                last_updated: existingUser.scraping.last_scraped,
                next_refresh: rateLimitCheck.nextAllowedScrape
              }
            },
            `Data cached since ${existingUser.scraping.last_scraped}`,
            `Profile data for @${username}`
          );

          return response.send(res);
        }
      }

      // Fetch fresh data from Instagram
      await this.refreshUserData(username, res, existingUser);

    } catch (error) {
      this.logger.error(`Error in getUser for ${req.params.username}:`, error);
      next(error);
    }
  }

  /**
   * Force refresh user data from Instagram
   *
   * @route POST /api/user/:username/refresh
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshUser(req, res, next) {
    try {
      const { username } = req.params;

      if (!username) {
        throw ApiError.badRequest('Username parameter is required');
      }

      this.logger.info(`Force refreshing user data for: ${username}`);

      // Check rate limit
      const rateLimitCheck = await this.databaseService.checkRateLimit(username);

      if (!rateLimitCheck.canScrape) {
        throw ApiError.tooManyRequests(
          `Rate limit exceeded. Next refresh available at ${rateLimitCheck.nextAllowedScrape}`
        );
      }

      const existingUser = await this.databaseService.findUserByUsername(username);
      await this.refreshUserData(username, res, existingUser);

    } catch (error) {
      this.logger.error(`Error in refreshUser for ${req.params.username}:`, error);
      next(error);
    }
  }

  /**
   * Get user posts with pagination
   *
   * @route GET /api/user/:username/posts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserPosts(req, res, next) {
    try {
      const { username } = req.params;
      const { page = 1, limit = 20, sortBy = '-instagram_data.posted_at' } = req.query;

      if (!username) {
        throw ApiError.badRequest('Username parameter is required');
      }

      this.logger.info(`Getting posts for user: ${username}`);

      // Find user
      const user = await this.databaseService.findUserByUsername(username);

      if (!user) {
        throw ApiError.notFound(`User @${username} not found in database`);
      }

      // Get posts with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const posts = await this.databaseService.getUserPosts(user._id, {
        limit: parseInt(limit),
        skip,
        sortBy
      });

      // Get total count for pagination
      const totalPosts = user.profile.posts_count || posts.length;

      const response = ApiResponse.paginated(
        posts,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPosts,
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          hasNext: skip + posts.length < totalPosts,
          hasPrev: parseInt(page) > 1
        },
        `Posts for @${username}`
      );

      response.send(res);

    } catch (error) {
      this.logger.error(`Error in getUserPosts for ${req.params.username}:`, error);
      next(error);
    }
  }

  /**
   * Get user analytics
   *
   * @route GET /api/user/:username/analytics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserAnalytics(req, res, next) {
    try {
      const { username } = req.params;

      if (!username) {
        throw ApiError.badRequest('Username parameter is required');
      }

      this.logger.info(`Getting analytics for user: ${username}`);

      // Find user
      const user = await this.databaseService.findUserByUsername(username);

      if (!user) {
        throw ApiError.notFound(`User @${username} not found in database`);
      }

      // Get analytics
      const analytics = await this.databaseService.getUserAnalytics(user._id);

      if (!analytics) {
        throw ApiError.notFound(`No analytics data found for @${username}`);
      }

      const response = ApiResponse.success(
        analytics,
        `Analytics for @${username}`
      );

      response.send(res);

    } catch (error) {
      this.logger.error(`Error in getUserAnalytics for ${req.params.username}:`, error);
      next(error);
    }
  }

  /**
   * Search users by username or name
   *
   * @route GET /api/users/search
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchUsers(req, res, next) {
    try {
      const { q: query, limit = 20 } = req.query;

      if (!query) {
        throw ApiError.badRequest('Search query parameter "q" is required');
      }

      if (query.length < 2) {
        throw ApiError.badRequest('Search query must be at least 2 characters long');
      }

      this.logger.info(`Searching users with query: ${query}`);

      const users = await this.databaseService.searchUsers(query, parseInt(limit));

      const response = ApiResponse.success(
        users,
        `Found ${users.length} users matching "${query}"`
      );

      response.send(res);

    } catch (error) {
      this.logger.error(`Error in searchUsers:`, error);
      next(error);
    }
  }

  /**
   * Get top influencers
   *
   * @route GET /api/users/top
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTopInfluencers(req, res, next) {
    try {
      const { limit = 50 } = req.query;

      this.logger.info(`Getting top ${limit} influencers`);

      const influencers = await this.databaseService.getTopInfluencers(parseInt(limit));

      const response = ApiResponse.success(
        influencers,
        `Top ${influencers.length} influencers`
      );

      response.send(res);

    } catch (error) {
      this.logger.error('Error in getTopInfluencers:', error);
      next(error);
    }
  }

  /**
   * Helper method to refresh user data from Instagram
   * @param {string} username - Instagram username
   * @param {Object} res - Express response object
   * @param {Object} existingUser - Existing user data (if any)
   */
  async refreshUserData(username, res, existingUser = null) {
    let userId = null;

    try {
      // Update scraping status to in_progress
      if (existingUser) {
        await this.databaseService.updateScrapingStatus(existingUser._id, 'in_progress');
        userId = existingUser._id;
      }

      this.logger.info(`Fetching fresh data from Instagram for: ${username}`);

      // Fetch complete data from Instagram
      const instagramData = await this.instagramService.getCompleteUserData(username, 12);

      // Save user profile
      const user = await this.databaseService.upsertUser(instagramData.profile);
      userId = user._id;

      // Save posts
      const savedPosts = await this.databaseService.savePosts(user._id, instagramData.posts);

      // Save analytics
      const savedAnalytics = await this.databaseService.saveAnalytics(user._id, instagramData.analytics);

      // Update scraping status to completed
      await this.databaseService.updateScrapingStatus(user._id, 'completed');

      // Prepare response data
      const responseData = {
        profile: user,
        posts: savedPosts,
        analytics: savedAnalytics,
        summary: {
          total_posts: savedPosts.length,
          total_likes: instagramData.analytics.total_likes,
          total_comments: instagramData.analytics.total_comments,
          engagement_rate: instagramData.analytics.engagement_rate,
          influence_score: instagramData.analytics.influence_score
        },
        meta: {
          scraped_at: new Date().toISOString(),
          data_freshness: 'live',
          next_refresh_available: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
        }
      };

      const isNewUser = !existingUser;
      const response = isNewUser
        ? ApiResponse.created(responseData, `New profile created for @${username}`)
        : ApiResponse.success(responseData, `Profile refreshed for @${username}`);

      response.send(res);

      this.logger.info(`Successfully refreshed data for ${username}: ${savedPosts.length} posts saved`);

    } catch (error) {
      // Update scraping status to failed
      if (userId) {
        await this.databaseService.updateScrapingStatus(userId, 'failed', error.message);
      }

      this.logger.error(`Failed to refresh data for ${username}:`, error);
      throw error;
    }
  }
}

module.exports = UserController;