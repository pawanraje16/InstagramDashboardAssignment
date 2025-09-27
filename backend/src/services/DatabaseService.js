const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
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
        last_scraped: new Date(),
        scrape_status: 'completed',
        updated_at: new Date()
      };

      const user = await User.findOneAndUpdate(
        { instagram_username: instagram_username.toLowerCase() },
        {
          $set: updateData
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
   * Save posts and reels for a user
   * @param {string} userId - User ObjectId
   * @param {Array} postsData - Array of post data (includes both posts and reels)
   * @returns {Object} Saved posts and reels
   */
  async savePosts(userId, postsData) {
    try {
      this.logger.info(`Saving ${postsData.length} posts/reels for user: ${userId}`);

      const savedPosts = [];
      const savedReels = [];

      for (const postData of postsData) {
        try {
          const itemWithUserId = {
            ...postData,
            user_id: userId
          };

          // Check if it's a reel or post based on presence of views/hashtags/tags
          const isReel = postData.views !== undefined || postData.hashtags || postData.tags;

          if (isReel) {
            // Save as reel
            const reel = await Reel.findOneAndUpdate(
              { instagram_post_id: postData.instagram_post_id },
              { $set: itemWithUserId },
              {
                new: true,
                upsert: true,
                runValidators: true
              }
            );
            savedReels.push(reel);
          } else {
            // Save as post
            const post = await Post.findOneAndUpdate(
              { instagram_post_id: postData.instagram_post_id },
              { $set: itemWithUserId },
              {
                new: true,
                upsert: true,
                runValidators: true
              }
            );
            savedPosts.push(post);
          }

        } catch (itemError) {
          this.logger.warn(`Error saving individual item ${postData.instagram_post_id}:`, itemError);
          // Continue with other items even if one fails
          continue;
        }
      }

      this.logger.info(`Successfully saved ${savedPosts.length} posts and ${savedReels.length} reels`);
      return { posts: savedPosts, reels: savedReels };

    } catch (error) {
      this.logger.error('Error saving posts/reels:', error);
      throw new ApiError(500, 'Database error while saving posts/reels');
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
   * Get user's reels
   * @param {string} userId - User ObjectId
   * @param {Object} options - Query options (limit, skip, sortBy)
   * @returns {Array} User's reels
   */
  async getUserReels(userId, options = {}) {
    try {
      const { limit = 20, skip = 0, sortBy = 'posted_at' } = options;
      this.logger.info(`Getting reels for user: ${userId} (limit: ${limit}, skip: ${skip})`);

      const reels = await Reel.findByUser(userId, limit, skip);

      this.logger.info(`Found ${reels.length} reels for user: ${userId}`);
      return reels;

    } catch (error) {
      this.logger.error(`Error getting reels for user ${userId}:`, error);
      throw new ApiError(500, 'Database error while retrieving reels');
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

      const now = new Date();
      const lastScrape = user.last_scraped;
      const hoursSinceLastScrape = (now - lastScrape) / (1000 * 60 * 60);
      const canScrape = hoursSinceLastScrape >= 4;

      return {
        canScrape,
        reason: canScrape ? 'allowed' : 'rate_limited',
        lastScraped: user.last_scraped,
        nextAllowedScrape: canScrape ? null : new Date(user.last_scraped.getTime() + 4 * 60 * 60 * 1000)
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

      const [userCount, postCount] = await Promise.all([
        User.countDocuments({ is_active: true }),
        Post.countDocuments({ is_active: true })
      ]);

      const stats = {
        users: userCount,
        posts: postCount,
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
        scrape_status: status,
        last_scraped: new Date()
      };

      await User.findByIdAndUpdate(userId, { $set: updateData });

      this.logger.info(`Updated scraping status for user ${userId}: ${status}`);

    } catch (dbError) {
      this.logger.error(`Error updating scraping status for user ${userId}:`, dbError);
      // Don't throw error here to avoid cascading failures
    }
  }

  /**
   * Update user document
   * @param {string} userId - User ObjectId
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      this.logger.info(`Updating user: ${userId}`);

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      this.logger.info(`User updated successfully: ${userId}`);
      return user;

    } catch (error) {
      this.logger.error(`Error updating user ${userId}:`, error);
      throw new ApiError(500, 'Database error while updating user');
    }
  }

  /**
   * Update post document
   * @param {string} postId - Post ObjectId
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated post
   */
  async updatePost(postId, updateData) {
    try {
      this.logger.info(`Updating post: ${postId}`);

      const post = await Post.findByIdAndUpdate(
        postId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!post) {
        throw new ApiError(404, 'Post not found');
      }

      this.logger.info(`Post updated successfully: ${postId}`);
      return post;

    } catch (error) {
      this.logger.error(`Error updating post ${postId}:`, error);
      throw new ApiError(500, 'Database error while updating post');
    }
  }

  /**
   * Update reel document
   * @param {string} reelId - Reel ObjectId
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated reel
   */
  async updateReel(reelId, updateData) {
    try {
      this.logger.info(`Updating reel: ${reelId}`);

      const reel = await Reel.findByIdAndUpdate(
        reelId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!reel) {
        throw new ApiError(404, 'Reel not found');
      }

      this.logger.info(`Reel updated successfully: ${reelId}`);
      return reel;

    } catch (error) {
      this.logger.error(`Error updating reel ${reelId}:`, error);
      throw new ApiError(500, 'Database error while updating reel');
    }
  }
}

module.exports = DatabaseService;