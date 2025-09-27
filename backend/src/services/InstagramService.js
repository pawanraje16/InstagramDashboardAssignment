const axios = require('axios');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Instagram Data Scraping Service
 * Modular and reusable Instagram data extraction
 */
class InstagramService {
  constructor() {
    this.baseURL = 'https://www.instagram.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'X-IG-App-ID': '936619743392459',
      'X-ASBD-ID': '198387',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.maxRequestsPerMinute = 30;
    this.requestTimestamps = [];
  }

  /**
   * Get user profile data from Instagram
   * @param {string} username - Instagram username
   * @returns {Object} User profile data
   */
  async getUserProfile(username) {
    try {
      logger.info(`Fetching profile data for @${username}`);

      // Validate username
      if (!this.isValidUsername(username)) {
        throw new ApiError(400, 'Invalid username format');
      }

      // Check rate limit
      await this.checkRateLimit();

      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`;
      const response = await this.makeRequest(profileUrl);

      if (!response.data?.data?.user) {
        throw new ApiError(404, `Instagram user @${username} not found`);
      }

      const user = response.data.data.user;

      // Transform Instagram data to our format
      const profileData = this.transformProfileData(user);

      logger.info(`Successfully fetched profile data for @${username}`);
      return profileData;

    } catch (error) {
      logger.error(`Error fetching profile for @${username}:`, error.message);
      throw this.handleInstagramError(error, username);
    }
  }

  /**
   * Get user posts from Instagram
   * @param {string} username - Instagram username
   * @param {number} limit - Number of posts to fetch (max 50)
   * @returns {Array} Array of post data
   */
  async getUserPosts(username, limit = 12) {
    try {
      logger.info(`Fetching ${limit} posts for @${username}`);

      // First get profile to get posts data
      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`;
      const response = await this.makeRequest(profileUrl);

      if (!response.data?.data?.user) {
        throw new ApiError(404, `Instagram user @${username} not found`);
      }

      const user = response.data.data.user;
      const posts = this.extractPostsFromProfile(user, limit);

      logger.info(`Successfully fetched ${posts.length} posts for @${username}`);
      return posts;

    } catch (error) {
      logger.error(`Error fetching posts for @${username}:`, error.message);
      throw this.handleInstagramError(error, username);
    }
  }

  /**
   * Get comprehensive user data (profile + posts + analytics)
   * @param {string} username - Instagram username
   * @param {number} postLimit - Number of posts to fetch
   * @returns {Object} Complete user data
   */
  async getCompleteUserData(username, postLimit = 12) {
    try {
      logger.info(`Fetching complete data for @${username}`);

      // Get profile data
      const profile = await this.getUserProfile(username);

      // Get posts data
      const posts = await this.getUserPosts(username, postLimit);

      // Get reels (videos from posts)
      const reels = this.extractReelsFromPosts(posts);

      // Calculate analytics
      const analytics = this.calculateAnalytics(profile, posts, reels);

      const completeData = {
        profile,
        posts,
        reels,
        analytics,
        scraped_at: new Date().toISOString(),
        data_version: '1.0'
      };

      logger.info(`Successfully fetched complete data for @${username}: ${posts.length} posts, ${reels.length} reels`);
      return completeData;

    } catch (error) {
      logger.error(`Error fetching complete data for @${username}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform Instagram profile data to our schema format
   * @param {Object} user - Raw Instagram user data
   * @returns {Object} Transformed profile data
   */
  transformProfileData(user) {
    try {
      return {
        instagram_id: user.id,
        instagram_username: user.username,
        profile: {
          full_name: user.full_name || '',
          biography: user.biography || '',
          profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || '',
          external_url: user.external_url || '',
          is_verified: user.is_verified || false,
          is_business: user.is_business_account || false,
          is_private: user.is_private || false,
          followers: user.edge_followed_by?.count || 0,
          following: user.edge_follow?.count || 0,
          posts_count: user.edge_owner_to_timeline_media?.count || 0
        }
      };
    } catch (error) {
      logger.error('Error transforming profile data:', error);
      throw new ApiError(500, 'Error processing Instagram profile data');
    }
  }

  /**
   * Extract posts from Instagram profile data
   * @param {Object} user - Instagram user object
   * @param {number} limit - Number of posts to extract
   * @returns {Array} Array of transformed post data
   */
  extractPostsFromProfile(user, limit = 12) {
    try {
      if (!user.edge_owner_to_timeline_media?.edges) {
        return [];
      }

      const edges = user.edge_owner_to_timeline_media.edges.slice(0, limit);

      return edges.map(edge => {
        const node = edge.node;
        return this.transformPostData(node);
      });

    } catch (error) {
      logger.error('Error extracting posts from profile:', error);
      return [];
    }
  }

  /**
   * Transform Instagram post data to our schema format
   * @param {Object} node - Raw Instagram post node
   * @returns {Object} Transformed post data
   */
  transformPostData(node) {
    try {
      const mediaType = this.getMediaType(node);
      const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';

      // Base data for both posts and reels
      const baseData = {
        instagram_post_id: node.id,
        shortcode: node.shortcode,
        caption,
        display_url: node.display_url,
        likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
        comments: node.edge_media_to_comment?.count || node.edge_media_preview_comment?.count || 0,
        posted_at: new Date(node.taken_at_timestamp * 1000)
      };

      if (mediaType === 'reel' || mediaType === 'video') {
        // For reels - include additional fields
        return {
          ...baseData,
          video_url: node.video_url || null,
          views: node.video_view_count || 0,
          hashtags: this.extractHashtags(caption),
          mentions: this.extractMentions(caption),
          tags: this.extractTags(caption), // Custom tags/categories
          duration: node.video_duration || 0,
          dimensions: {
            width: node.dimensions?.width || 0,
            height: node.dimensions?.height || 0
          }
        };
      } else {
        // For posts (image/carousel) - minimal data
        return {
          ...baseData,
          media_type: mediaType
        };
      }

    } catch (error) {
      logger.error('Error transforming post data:', error);
      throw new ApiError(500, 'Error processing Instagram post data');
    }
  }

  /**
   * Extract reels from posts array
   * @param {Array} posts - Array of posts
   * @returns {Array} Array of reels
   */
  extractReelsFromPosts(posts) {
    try {
      return posts
        .filter(post => post.media_type === 'video' && post.duration > 0)
        .map(post => ({
          ...post,
          type: 'reel',
          url: `https://www.instagram.com/reel/${post.shortcode}/`
        }));
    } catch (error) {
      logger.error('Error extracting reels:', error);
      return [];
    }
  }

  /**
   * Calculate analytics from profile and posts data
   * @param {Object} profile - User profile data
   * @param {Array} posts - User posts data
   * @param {Array} reels - User reels data
   * @returns {Object} Analytics data
   */
  calculateAnalytics(profile, posts, reels) {
    try {
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
      const totalViews = reels.reduce((sum, reel) => sum + (reel.views || 0), 0);

      const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0;
      const avgComments = posts.length > 0 ? Math.round(totalComments / posts.length) : 0;

      const engagementRate = profile.profile.followers > 0 && posts.length > 0
        ? (((totalLikes + totalComments) / posts.length) / profile.profile.followers * 100)
        : 0;

      const contentBreakdown = {
        images: posts.filter(p => p.media_type === 'image').length,
        videos: posts.filter(p => p.media_type === 'video').length,
        carousels: posts.filter(p => p.media_type === 'carousel').length,
        reels: reels.length
      };

      const topHashtags = this.getTopHashtags(posts);
      const influenceScore = this.calculateInfluenceScore(profile, posts, reels);

      return {
        total_likes: totalLikes,
        total_comments: totalComments,
        total_views: totalViews,
        avg_likes: avgLikes,
        avg_comments: avgComments,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        content_breakdown: contentBreakdown,
        top_hashtags: topHashtags,
        influence_score: influenceScore,
        calculated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error calculating analytics:', error);
      return {
        total_likes: 0,
        total_comments: 0,
        engagement_rate: 0,
        influence_score: 0,
        error: 'Analytics calculation failed'
      };
    }
  }

  /**
   * Calculate influence score
   * @param {Object} profile - User profile
   * @param {Array} posts - User posts
   * @param {Array} reels - User reels
   * @returns {number} Influence score (0-100)
   */
  calculateInfluenceScore(profile, posts, reels) {
    try {
      let score = 0;

      // Follower base (max 30 points)
      const followers = profile.profile.followers;
      if (followers > 1000000) score += 30;
      else if (followers > 100000) score += 25;
      else if (followers > 10000) score += 20;
      else if (followers > 1000) score += 15;
      else score += 10;

      // Engagement quality (max 25 points)
      const totalPosts = posts.length + reels.length;
      if (totalPosts > 0) {
        const avgEngagement = posts.reduce((sum, p) => sum + p.likes + p.comments, 0) / totalPosts;
        const engagementRatio = avgEngagement / followers;

        if (engagementRatio > 0.05) score += 25;
        else if (engagementRatio > 0.03) score += 20;
        else if (engagementRatio > 0.01) score += 15;
        else score += 10;
      }

      // Content consistency (max 20 points)
      if (profile.profile.posts_count > 100) score += 20;
      else if (profile.profile.posts_count > 50) score += 15;
      else if (profile.profile.posts_count > 20) score += 10;
      else score += 5;

      // Verification and business status (max 15 points)
      if (profile.profile.is_verified) score += 10;
      if (profile.profile.is_business) score += 5;

      // Content diversity (max 10 points)
      const contentTypes = [
        posts.filter(p => p.media_type === 'image').length > 0,
        posts.filter(p => p.media_type === 'video').length > 0,
        posts.filter(p => p.media_type === 'carousel').length > 0,
        reels.length > 0
      ].filter(Boolean).length;

      score += contentTypes * 2.5;

      return Math.min(100, Math.round(score));

    } catch (error) {
      logger.error('Error calculating influence score:', error);
      return 0;
    }
  }

  /**
   * Get top hashtags from posts
   * @param {Array} posts - Array of posts
   * @returns {Array} Top hashtags with usage count
   */
  getTopHashtags(posts) {
    try {
      const hashtagCount = {};

      posts.forEach(post => {
        post.hashtags.forEach(tag => {
          hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
      });

      return Object.entries(hashtagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

    } catch (error) {
      logger.error('Error getting top hashtags:', error);
      return [];
    }
  }

  /**
   * Extract hashtags from caption
   * @param {string} caption - Post caption
   * @returns {Array} Array of hashtags
   */
  extractHashtags(caption) {
    if (!caption) return [];
    const hashtagRegex = /#[\w\u0590-\u05ff\u0900-\u097f]+/g;
    return caption.match(hashtagRegex) || [];
  }

  /**
   * Extract mentions from caption
   * @param {string} caption - Post caption
   * @returns {Array} Array of mentions
   */
  extractMentions(caption) {
    if (!caption) return [];
    const mentionRegex = /@[\w.]+/g;
    const matches = caption.match(mentionRegex) || [];
    return matches.map(mention => ({
      username: mention.substring(1),
      user_id: null
    }));
  }

  /**
   * Extract custom tags from caption (like categories, topics)
   * @param {string} caption - Post caption
   * @returns {Array} Array of custom tags
   */
  extractTags(caption) {
    try {
      // Extract custom tags - you can modify this logic based on your needs
      // For now, extracting common categories/topics from caption
      const tags = [];
      const lowerCaption = caption.toLowerCase();

      // Common content categories
      const categories = [
        'fashion', 'food', 'travel', 'fitness', 'beauty', 'lifestyle',
        'music', 'art', 'dance', 'comedy', 'tech', 'sports', 'nature',
        'motivation', 'education', 'business', 'diy', 'recipe', 'tutorial'
      ];

      categories.forEach(category => {
        if (lowerCaption.includes(category)) {
          tags.push(category);
        }
      });

      return tags;
    } catch (error) {
      logger.error('Error extracting tags:', error);
      return [];
    }
  }

  /**
   * Extract tagged users from post node
   * @param {Object} node - Instagram post node
   * @returns {Array} Array of tagged users
   */
  extractTaggedUsers(node) {
    try {
      if (node.edge_media_to_tagged_user?.edges) {
        return node.edge_media_to_tagged_user.edges.map(edge => ({
          username: edge.node.user.username,
          full_name: edge.node.user.full_name,
          user_id: edge.node.user.id
        }));
      }
      return [];
    } catch (error) {
      logger.error('Error extracting tagged users:', error);
      return [];
    }
  }

  /**
   * Get media type from Instagram node
   * @param {Object} node - Instagram post node
   * @returns {string} Media type
   */
  getMediaType(node) {
    // Check if it's a reel (short video content)
    if (node.clips_metadata || node.video_duration < 60) {
      return 'reel';
    }
    if (node.__typename === 'GraphVideo') return 'video';
    if (node.__typename === 'GraphSidecar') return 'carousel';
    if (node.is_video) return 'video';
    return 'image';
  }

  /**
   * Validate Instagram username format
   * @param {string} username - Username to validate
   * @returns {boolean} Is valid username
   */
  isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return usernameRegex.test(username);
  }

  /**
   * Make HTTP request with error handling
   * @param {string} url - Request URL
   * @returns {Object} Response data
   */
  async makeRequest(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });

      return response;

    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new ApiError(404, 'Instagram user not found');
        } else if (error.response.status === 429) {
          throw new ApiError(429, 'Rate limit exceeded. Please try again later.');
        } else if (error.response.status === 403) {
          throw new ApiError(403, 'Access forbidden. User may be private.');
        }
      }

      throw new ApiError(500, 'Instagram service temporarily unavailable');
    }
  }

  /**
   * Check rate limit before making request
   */
  async checkRateLimit() {
    const now = Date.now();

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );

    // Check if we've exceeded the limit
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest);

      if (waitTime > 0) {
        logger.warn(`Rate limit exceeded. Waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Add current timestamp
    this.requestTimestamps.push(now);
  }

  /**
   * Handle Instagram-specific errors
   * @param {Error} error - Original error
   * @param {string} username - Username that caused the error
   * @returns {ApiError} Formatted API error
   */
  handleInstagramError(error, username) {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.code === 'ECONNREFUSED') {
      return new ApiError(503, 'Instagram service is currently unavailable');
    }

    if (error.code === 'ETIMEDOUT') {
      return new ApiError(408, 'Request to Instagram timed out. Please try again.');
    }

    logger.error(`Unexpected error for @${username}:`, error);
    return new ApiError(500, 'An unexpected error occurred while fetching Instagram data');
  }
}

module.exports = InstagramService;