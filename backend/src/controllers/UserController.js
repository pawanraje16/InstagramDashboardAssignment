const InstagramService = require('../services/InstagramService');
const DatabaseService = require('../services/DatabaseService');
const imageService = require('../services/imageService');
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
    this.getUserReels = this.getUserReels.bind(this);
    this.getUserAnalytics = this.getUserAnalytics.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.getTopInfluencers = this.getTopInfluencers.bind(this);
    this.processUserThumbnails = this.processUserThumbnails.bind(this);
    this.processThumbnails = this.processThumbnails.bind(this);
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
          // Return cached basic profile data only
          this.logger.info(`Returning cached data for ${username}`);

          const response = ApiResponse.cached(
            {
              // Basic Information (mandatory)
              username: existingUser.instagram_username,
              full_name: existingUser.profile.full_name,
              bio: existingUser.profile.bio,
              profile_pic_url: existingUser.profile.profile_pic_url,
              profile_pic_cloudinary: existingUser.profile.profile_pic_cloudinary,
              followers: existingUser.profile.followers,
              following: existingUser.profile.following,
              posts_count: existingUser.profile.posts_count,
              is_verified: existingUser.profile.is_verified,

              // Engagement & Analytics (mandatory)
              engagement_rate: existingUser.analytics.engagement_rate,
              avg_likes: existingUser.analytics.avg_likes,
              avg_comments: existingUser.analytics.avg_comments
            },
            `Data cached since ${existingUser.last_scraped}`,
            `Profile data for @${username}`
          );

          if (!res.headersSent) {
            return response.send(res);
          } else {
            this.logger.warn(`Headers already sent for ${username}, skipping cached response`);
            return;
          }
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
      let user = await this.databaseService.findUserByUsername(username);

      if (!user) {
        // User doesn't exist, trigger scraping first
        this.logger.info(`User ${username} not found, triggering scraping...`);

        try {
          // Fetch complete data from Instagram
          const instagramData = await this.instagramService.getCompleteUserData(username, 12);

          // Save user profile
          user = await this.databaseService.upsertUser(instagramData.profile);

          // Save posts and reels
          await this.databaseService.savePosts(user._id, instagramData.posts);

          // Save analytics
          await this.databaseService.saveAnalytics(user._id, instagramData.analytics);

          // Update scraping status to completed
          await this.databaseService.updateScrapingStatus(user._id, 'completed');

          // Process thumbnails in background (don't await to avoid blocking response)
          this.processUserThumbnails(username).catch(error => {
            this.logger.warn(`Background thumbnail processing failed for ${username}:`, error);
          });

          this.logger.info(`Successfully scraped and saved data for ${username}`);
        } catch (scrapingError) {
          this.logger.error(`Failed to scrape data for ${username}:`, scrapingError);
          throw ApiError.notFound(`User @${username} not found on Instagram`);
        }
      }

      // Get posts with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const posts = await this.databaseService.getUserPosts(user._id, {
        limit: parseInt(limit),
        skip,
        sortBy
      });

      // Format posts to only include required fields
      const formattedPosts = posts.map(post => ({
        type: 'post',
        shortcode: post.shortcode,
        media_type: post.media_type,
        caption: post.caption,
        display_url: post.display_url,
        display_url_cloudinary: post.display_url_cloudinary,
        likes: post.likes,
        comments: post.comments,
        posted_at: post.posted_at
      }));

      // Get total count for pagination
      const totalPosts = user.profile.posts_count || posts.length;

      const response = ApiResponse.paginated(
        formattedPosts,
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
   * Get user reels with pagination
   *
   * @route GET /api/user/:username/reels
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserReels(req, res, next) {
    try {
      const { username } = req.params;
      const { page = 1, limit = 20, sortBy = '-posted_at' } = req.query;

      if (!username) {
        throw ApiError.badRequest('Username parameter is required');
      }

      this.logger.info(`Getting reels for user: ${username}`);

      // Find user
      let user = await this.databaseService.findUserByUsername(username);

      if (!user) {
        // User doesn't exist, trigger scraping first
        this.logger.info(`User ${username} not found, triggering scraping...`);

        try {
          // Fetch complete data from Instagram
          const instagramData = await this.instagramService.getCompleteUserData(username, 12);

          // Save user profile
          user = await this.databaseService.upsertUser(instagramData.profile);

          // Save posts and reels
          await this.databaseService.savePosts(user._id, instagramData.posts);

          // Save analytics
          await this.databaseService.saveAnalytics(user._id, instagramData.analytics);

          // Update scraping status to completed
          await this.databaseService.updateScrapingStatus(user._id, 'completed');

          // Process thumbnails in background (don't await to avoid blocking response)
          this.processUserThumbnails(username).catch(error => {
            this.logger.warn(`Background thumbnail processing failed for ${username}:`, error);
          });

          this.logger.info(`Successfully scraped and saved data for ${username}`);
        } catch (scrapingError) {
          this.logger.error(`Failed to scrape data for ${username}:`, scrapingError);
          throw ApiError.notFound(`User @${username} not found on Instagram`);
        }
      }

      // Get reels with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const reels = await this.databaseService.getUserReels(user._id, {
        limit: parseInt(limit),
        skip,
        sortBy
      });

      // Format reels to include all required fields
      const formattedReels = reels.map(reel => ({
        type: 'reel',
        shortcode: reel.shortcode,
        caption: reel.caption,
        display_url: reel.display_url,
        display_url_cloudinary: reel.display_url_cloudinary,
        video_url: reel.video_url,
        likes: reel.likes,
        comments: reel.comments,
        views: reel.views,
        hashtags: reel.hashtags,
        tags: reel.tags,
        posted_at: reel.posted_at,
        duration: reel.duration
      }));

      // Get total count for pagination (approximate)
      const totalReels = formattedReels.length;

      const response = ApiResponse.paginated(
        formattedReels,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalReels,
          totalPages: Math.ceil(totalReels / parseInt(limit)),
          hasNext: formattedReels.length === parseInt(limit),
          hasPrev: parseInt(page) > 1
        },
        `Reels for @${username}`
      );

      response.send(res);

    } catch (error) {
      this.logger.error(`Error in getUserReels for ${req.params.username}:`, error);
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

      // Return analytics from user profile (only required fields)
      const analytics = {
        engagement_rate: user.analytics.engagement_rate,
        avg_likes: user.analytics.avg_likes,
        avg_comments: user.analytics.avg_comments
      };

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
      console.log("below is user data")
      console.log("Instagram Data:", JSON.stringify(instagramData, null, 2));
      console.log("new line start");
      
      // Save user profile
      const user = await this.databaseService.upsertUser(instagramData.profile);
      userId = user._id;

      // Save posts and reels
      const savedContent = await this.databaseService.savePosts(user._id, instagramData.posts);

      // Save analytics
      const savedAnalytics = await this.databaseService.saveAnalytics(user._id, instagramData.analytics);

      // Update scraping status to completed
      await this.databaseService.updateScrapingStatus(user._id, 'completed');

      // Process thumbnails in background (don't await to avoid blocking response)
      this.processUserThumbnails(username).catch(error => {
        this.logger.warn(`Background thumbnail processing failed for ${username}:`, error);
      });

      // Get fresh data from database to ensure consistency
      const refreshedUser = await this.databaseService.findUserByUsername(username);

      // Prepare response data - only basic profile information
      const responseData = {
        // Basic Information (mandatory)
        username: refreshedUser.instagram_username,
        full_name: refreshedUser.profile.full_name,
        bio: refreshedUser.profile.bio,
        profile_pic_url: refreshedUser.profile.profile_pic_url,
        profile_pic_cloudinary: refreshedUser.profile.profile_pic_cloudinary,
        followers: refreshedUser.profile.followers,
        following: refreshedUser.profile.following,
        posts_count: refreshedUser.profile.posts_count,
        is_verified: refreshedUser.profile.is_verified,

        // Engagement & Analytics (mandatory)
        engagement_rate: refreshedUser.analytics.engagement_rate,
        avg_likes: refreshedUser.analytics.avg_likes,
        avg_comments: refreshedUser.analytics.avg_comments
      };

      const isNewUser = !existingUser;
      const response = isNewUser
        ? ApiResponse.created(responseData, `New profile created for @${username}`)
        : ApiResponse.success(responseData, `Profile refreshed for @${username}`);

      if (!res.headersSent) {
        response.send(res);
        this.logger.info(`Successfully refreshed data for ${username}`);
      } else {
        this.logger.warn(`Headers already sent for ${username}, skipping response`);
      }

    } catch (error) {
      // Update scraping status to failed
      if (userId) {
        try {
          await this.databaseService.updateScrapingStatus(userId, 'failed', error.message);
        } catch (statusError) {
          this.logger.warn(`Failed to update scraping status:`, statusError);
        }
      }

      this.logger.error(`Failed to refresh data for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Process thumbnails for a user (profile picture, posts, reels)
   * Downloads and uploads to Cloudinary
   */
  async processUserThumbnails(username) {
    try {
      this.logger.info(`🖼️ Processing thumbnails for user: ${username}`);

      // Get user data
      const user = await this.databaseService.findUserByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      const thumbnailsToProcess = [];

      // Process profile picture thumbnail
      if (user.profile.profile_pic_url && !user.profile.profile_pic_cloudinary) {
        thumbnailsToProcess.push({
          url: user.profile.profile_pic_url,
          folder: 'thumbnails/profiles',
          publicId: imageService.generatePublicId(user.profile.profile_pic_url, `profile_${user.instagram_username}`)
        });
      }

      // Get posts and reels to process
      const posts = await this.databaseService.getUserPosts(user._id, { limit: 20 });
      const reels = await this.databaseService.getUserReels(user._id, { limit: 20 });

      // Process post thumbnails
      for (const post of posts) {
        if (post.display_url && !post.display_url_cloudinary) {
          thumbnailsToProcess.push({
            url: post.display_url,
            folder: 'thumbnails/posts',
            publicId: imageService.generatePublicId(post.display_url, `post_${post.shortcode}`),
            postId: post._id
          });
        }
      }

      // Process reel thumbnails
      for (const reel of reels) {
        if (reel.display_url && !reel.display_url_cloudinary) {
          thumbnailsToProcess.push({
            url: reel.display_url,
            folder: 'thumbnails/reels',
            publicId: imageService.generatePublicId(reel.display_url, `reel_${reel.shortcode}`),
            reelId: reel._id
          });
        }
      }

      this.logger.info(`📸 Found ${thumbnailsToProcess.length} thumbnails to process for ${username}`);

      if (thumbnailsToProcess.length === 0) {
        return { processed: 0, message: 'No thumbnails to process' };
      }

      // Process thumbnails in batches
      const results = await imageService.batchProcessThumbnails(thumbnailsToProcess);
      let processedCount = 0;

      // Update database with Cloudinary URLs
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const thumbnailData = thumbnailsToProcess[i];

        if (result.cloudinary) {
          processedCount++;

          try {
            if (thumbnailData.publicId.startsWith('profile_')) {
              // Update user profile picture
              await this.databaseService.updateUser(user._id, {
                'profile.profile_pic_cloudinary': result.cloudinary
              });
              this.logger.info(`✅ Updated profile picture for ${username}`);

            } else if (thumbnailData.postId) {
              // Update post thumbnail
              await this.databaseService.updatePost(thumbnailData.postId, {
                display_url_cloudinary: result.cloudinary
              });
              this.logger.info(`✅ Updated post thumbnail: ${thumbnailData.publicId}`);

            } else if (thumbnailData.reelId) {
              // Update reel thumbnail
              await this.databaseService.updateReel(thumbnailData.reelId, {
                display_url_cloudinary: result.cloudinary
              });
              this.logger.info(`✅ Updated reel thumbnail: ${thumbnailData.publicId}`);
            }
          } catch (updateError) {
            this.logger.error(`❌ Failed to update database for ${thumbnailData.publicId}:`, updateError);
          }
        }
      }

      this.logger.info(`🎉 Thumbnail processing completed for ${username}: ${processedCount}/${thumbnailsToProcess.length} thumbnails processed`);

      return {
        processed: processedCount,
        total: thumbnailsToProcess.length,
        message: `Successfully processed ${processedCount} thumbnails`
      };

    } catch (error) {
      this.logger.error(`❌ Error processing thumbnails for ${username}:`, error);
      throw error;
    }
  }

  /**
   * API endpoint to manually trigger thumbnail processing
   */
  async processThumbnails(req, res, next) {
    try {
      const { username } = req.params;

      if (!username) {
        throw new ApiError(400, 'Username is required');
      }

      this.logger.info(`🖼️ Manual thumbnail processing triggered for: ${username}`);

      // Process thumbnails in background
      const result = await this.processUserThumbnails(username);

      return res.json(new ApiResponse(200, result, 'Thumbnail processing completed'));

    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;