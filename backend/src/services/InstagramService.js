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
  async getUserPosts(username, limit = 40) {
    try {
      logger.info(`Fetching ${limit} posts for @${username}`);

      // Strategy 1: Get initial posts from profile
      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`;
      const response = await this.makeRequest(profileUrl);

      if (!response.data?.data?.user) {
        throw new ApiError(404, `Instagram user @${username} not found`);
      }

      const user = response.data.data.user;
      let posts = this.extractPostsFromProfile(user, limit);

      logger.info(`Strategy 1: Got ${posts.length} posts from profile`);

      // Log the post IDs for debugging
      const profilePostIds = posts.map(p => p.shortcode);
      logger.info(`Profile post IDs: ${profilePostIds.join(', ')}`);

      // Strategy 2: If we need more posts, try multiple additional approaches
      if (posts.length < limit) {
        logger.info(`Attempting to get ${limit - posts.length} more posts using aggressive methods`);

        // Try pagination first (most likely to get truly additional posts)
        const paginatedPosts = await this.fetchOlderPostsWithPagination(user.id, limit - posts.length);
        if (paginatedPosts.length > 0) {
          const paginatedPostIds = paginatedPosts.map(p => p.shortcode);
          logger.info(`Paginated post IDs: ${paginatedPostIds.join(', ')}`);

          const uniquePaginatedPosts = paginatedPosts.filter(paginatedPost =>
            !profilePostIds.includes(paginatedPost.shortcode)
          );

          if (uniquePaginatedPosts.length > 0) {
            posts = posts.concat(uniquePaginatedPosts);
            logger.info(`Strategy 2a: Pagination added ${uniquePaginatedPosts.length} NEW posts. Total: ${posts.length}`);
          } else {
            logger.warn(`Strategy 2a: Pagination returned ${paginatedPosts.length} posts but they were all duplicates`);
          }
        }

        // Try mobile web endpoint if still need more
        const mobilePosts = await this.fetchFromMobileWeb(username, posts.length, limit - posts.length);
        if (mobilePosts.length > 0) {
          const mobilePostIds = mobilePosts.map(p => p.shortcode);
          logger.info(`Mobile post IDs: ${mobilePostIds.join(', ')}`);

          // Check for duplicates
          const uniqueMobilePosts = mobilePosts.filter(mobilePost =>
            !profilePostIds.includes(mobilePost.shortcode)
          );

          if (uniqueMobilePosts.length > 0) {
            posts = posts.concat(uniqueMobilePosts);
            logger.info(`Strategy 2a: Mobile web added ${uniqueMobilePosts.length} NEW posts. Total: ${posts.length}`);
          } else {
            logger.warn(`Strategy 2a: Mobile web returned ${mobilePosts.length} posts but they were all duplicates`);
          }
        }

        // Try direct media endpoint if still need more
        if (posts.length < limit) {
          const mediaPosts = await this.fetchFromMediaEndpoint(user.id, posts.length, limit - posts.length);
          if (mediaPosts.length > 0) {
            posts = posts.concat(mediaPosts);
            logger.info(`Strategy 2b: Media endpoint added ${mediaPosts.length} posts. Total: ${posts.length}`);
          }
        }

        // Try GraphQL with different query hashes if still need more
        if (posts.length < limit) {
          const graphqlPosts = await this.fetchWithMultipleGraphQLQueries(user.id, posts.length, limit - posts.length);
          if (graphqlPosts.length > 0) {
            posts = posts.concat(graphqlPosts);
            logger.info(`Strategy 2c: GraphQL added ${graphqlPosts.length} posts. Total: ${posts.length}`);
          }
        }
      }

      logger.info(`Successfully fetched ${posts.length} posts for @${username} (requested: ${limit})`);
      return posts;

    } catch (error) {
      logger.error(`Error fetching posts for @${username}:`, error.message);
      throw this.handleInstagramError(error, username);
    }
  }

  /**
   * Attempt to fetch additional posts beyond the profile limit
   * @param {string} username - Instagram username
   * @param {number} skip - Number of posts to skip (posts already fetched)
   * @param {number} limit - Number of additional posts to fetch
   * @returns {Array} Array of additional post data
   */
  async getAdditionalPosts(username, skip = 12, limit = 28) {
    try {
      logger.info(`Attempting to fetch ${limit} additional posts for @${username}, skipping first ${skip}`);

      // First get user ID from profile
      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`;
      const profileResponse = await this.makeRequest(profileUrl);

      if (!profileResponse.data?.data?.user) {
        throw new ApiError(404, `Instagram user @${username} not found`);
      }

      const user = profileResponse.data.data.user;
      const userId = user.id;

      // Try multiple approaches to get additional posts
      let additionalPosts = [];

      // Approach 1: Try user feed endpoint
      try {
        logger.info(`Trying user feed endpoint for ${username}`);
        const feedPosts = await this.fetchFromUserFeed(userId, skip, limit);
        if (feedPosts.length > 0) {
          additionalPosts = feedPosts;
          logger.info(`Successfully fetched ${feedPosts.length} posts from user feed`);
        }
      } catch (error) {
        logger.warn('User feed approach failed:', error.message);
      }

      // Approach 2: Try GraphQL if feed failed
      if (additionalPosts.length === 0) {
        try {
          logger.info(`Trying GraphQL approach for ${username}`);
          const graphqlPosts = await this.fetchMorePostsViaGraphQL(userId, skip, limit);
          if (graphqlPosts.length > 0) {
            additionalPosts = graphqlPosts;
            logger.info(`Successfully fetched ${graphqlPosts.length} posts from GraphQL`);
          }
        } catch (error) {
          logger.warn('GraphQL approach failed:', error.message);
        }
      }

      // Approach 3: Try alternative endpoints
      if (additionalPosts.length === 0) {
        try {
          logger.info(`Trying alternative endpoints for ${username}`);
          const altPosts = await this.fetchFromAlternativeEndpoints(userId, username, skip, limit);
          if (altPosts.length > 0) {
            additionalPosts = altPosts;
            logger.info(`Successfully fetched ${altPosts.length} posts from alternative endpoints`);
          }
        } catch (error) {
          logger.warn('Alternative endpoints failed:', error.message);
        }
      }

      logger.info(`Total additional posts fetched for @${username}: ${additionalPosts.length}`);
      return additionalPosts;

    } catch (error) {
      logger.error(`Error fetching additional posts for @${username}:`, error.message);
      return []; // Return empty array instead of throwing to prevent breaking the main flow
    }
  }

  /**
   * Fetch posts from user feed endpoint
   */
  async fetchFromUserFeed(userId, skip, limit) {
    const feedUrl = `${this.baseURL}/api/v1/feed/user/${userId}/?count=${limit + skip}&max_id=`;
    const response = await this.makeRequest(feedUrl);

    if (!response.data?.items) {
      return [];
    }

    return response.data.items
      .slice(skip)
      .slice(0, limit)
      .map(item => this.transformInstagramMediaItem(item))
      .filter(post => post !== null);
  }

  /**
   * Fetch posts from alternative Instagram endpoints
   */
  async fetchFromAlternativeEndpoints(userId, username, skip, limit) {
    // Try the mobile endpoint
    try {
      const mobileUrl = `${this.baseURL}/${username}/?__a=1&max_id=`;
      const response = await this.makeRequest(mobileUrl);

      if (response.data?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
        const edges = response.data.graphql.user.edge_owner_to_timeline_media.edges;
        return edges
          .slice(skip)
          .slice(0, limit)
          .map(edge => this.transformPostData(edge.node))
          .filter(post => post !== null);
      }
    } catch (error) {
      logger.warn('Mobile endpoint failed:', error.message);
    }

    return [];
  }

  /**
   * Fetch posts using pagination cursors to get older posts
   */
  async fetchOlderPostsWithPagination(userId, limit) {
    try {
      logger.info(`Trying pagination approach for user ${userId}`);

      // First, get the profile to find pagination cursor
      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${userId}`;
      const profileResponse = await this.makeRequest(profileUrl);

      if (!profileResponse.data?.data?.user?.edge_owner_to_timeline_media?.page_info) {
        logger.warn('No pagination info found in profile');
        return [];
      }

      const pageInfo = profileResponse.data.data.user.edge_owner_to_timeline_media.page_info;

      if (!pageInfo.has_next_page || !pageInfo.end_cursor) {
        logger.warn('No next page available for pagination');
        return [];
      }

      // Use the end cursor to fetch next page
      const paginationUrl = `${this.baseURL}/graphql/query/`;
      const variables = {
        id: userId,
        first: Math.min(limit, 50),
        after: pageInfo.end_cursor
      };

      const params = new URLSearchParams({
        query_hash: 'e769aa130647d2354c40ea6a439bfc08',
        variables: JSON.stringify(variables)
      });

      const response = await this.makeRequest(`${paginationUrl}?${params}`);

      if (response.data?.data?.user?.edge_owner_to_timeline_media?.edges) {
        const edges = response.data.data.user.edge_owner_to_timeline_media.edges;
        logger.info(`Pagination returned ${edges.length} posts`);

        return edges.map(edge => this.transformPostData(edge.node)).filter(post => post !== null);
      }

      return [];
    } catch (error) {
      logger.warn('Pagination approach failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch posts from mobile web interface
   */
  async fetchFromMobileWeb(username, skip, limit) {
    try {
      logger.info(`Trying mobile web interface for ${username}`);

      // Try different mobile endpoints
      const mobileEndpoints = [
        `${this.baseURL}/${username}/?__a=1`,
        `${this.baseURL}/${username}/?__a=1&max_id=`,
        `${this.baseURL}/${username}/channel/?__a=1`
      ];

      for (const endpoint of mobileEndpoints) {
        try {
          const response = await this.makeRequest(endpoint);

          if (response.data?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
            const edges = response.data.graphql.user.edge_owner_to_timeline_media.edges;
            logger.info(`Mobile endpoint returned ${edges.length} total posts`);

            return edges
              .slice(skip)
              .slice(0, limit)
              .map(edge => this.transformPostData(edge.node))
              .filter(post => post !== null);
          }
        } catch (error) {
          logger.warn(`Mobile endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }

      return [];
    } catch (error) {
      logger.warn('All mobile web approaches failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch posts from direct media endpoint
   */
  async fetchFromMediaEndpoint(userId, skip, limit) {
    try {
      logger.info(`Trying media endpoints for user ${userId}`);

      const mediaEndpoints = [
        `${this.baseURL}/api/v1/feed/user/${userId}/`,
        `${this.baseURL}/api/v1/feed/user/${userId}/?count=${limit + skip}`,
        `${this.baseURL}/api/v1/users/${userId}/media/?count=${limit + skip}`
      ];

      for (const endpoint of mediaEndpoints) {
        try {
          const response = await this.makeRequest(endpoint);

          if (response.data?.items && Array.isArray(response.data.items)) {
            logger.info(`Media endpoint returned ${response.data.items.length} items`);

            return response.data.items
              .slice(skip)
              .slice(0, limit)
              .map(item => this.transformInstagramMediaItem(item))
              .filter(post => post !== null);
          }
        } catch (error) {
          logger.warn(`Media endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }

      return [];
    } catch (error) {
      logger.warn('All media endpoint approaches failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch posts using multiple GraphQL query hashes
   */
  async fetchWithMultipleGraphQLQueries(userId, skip, limit) {
    try {
      logger.info(`Trying multiple GraphQL queries for user ${userId}`);

      // Different query hashes that might work
      const queryHashes = [
        'e769aa130647d2354c40ea6a439bfc08', // Standard user media
        '8c2a529969ee035a5063f2fc8602a0fd', // Alternative media query
        '02e14f6a7812a876f7d133c9555b1151', // User timeline
        '69cba40317214236af40e7efa697781d', // User posts
      ];

      for (const queryHash of queryHashes) {
        try {
          const variables = {
            id: userId,
            first: Math.min(limit + skip, 50)
          };

          const params = new URLSearchParams({
            query_hash: queryHash,
            variables: JSON.stringify(variables)
          });

          const graphqlUrl = `${this.baseURL}/graphql/query/?${params}`;
          const response = await this.makeRequest(graphqlUrl);

          // Try different response structures
          let edges = null;
          if (response.data?.data?.user?.edge_owner_to_timeline_media?.edges) {
            edges = response.data.data.user.edge_owner_to_timeline_media.edges;
          } else if (response.data?.data?.user?.edge_web_feed_timeline?.edges) {
            edges = response.data.data.user.edge_web_feed_timeline.edges;
          } else if (response.data?.data?.user?.edge_felix_video_timeline?.edges) {
            edges = response.data.data.user.edge_felix_video_timeline.edges;
          }

          if (edges && edges.length > 0) {
            logger.info(`GraphQL query ${queryHash} returned ${edges.length} posts`);

            return edges
              .slice(skip)
              .slice(0, limit)
              .map(edge => this.transformPostData(edge.node))
              .filter(post => post !== null);
          }
        } catch (error) {
          logger.warn(`GraphQL query ${queryHash} failed:`, error.message);
          continue;
        }
      }

      return [];
    } catch (error) {
      logger.warn('All GraphQL approaches failed:', error.message);
      return [];
    }
  }

  /**
   * Get comprehensive user data (profile + posts + analytics)
   * @param {string} username - Instagram username
   * @param {number} postLimit - Number of posts to fetch
   * @returns {Object} Complete user data
   */
  async getCompleteUserData(username, postLimit = 40) {
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
          bio: user.biography || '',
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
  extractPostsFromProfile(user, limit = 40) {
    try {
      if (!user.edge_owner_to_timeline_media?.edges) {
        logger.warn('DEBUG: No edge_owner_to_timeline_media.edges found in user object');
        return [];
      }

      const totalAvailable = user.edge_owner_to_timeline_media.edges.length;
      logger.info(`DEBUG: extractPostsFromProfile - Available: ${totalAvailable}, Requested limit: ${limit}`);

      const edges = user.edge_owner_to_timeline_media.edges.slice(0, limit);
      logger.info(`DEBUG: Sliced to ${edges.length} edges`);

      const posts = edges.map(edge => {
        const node = edge.node;
        return this.transformPostData(node);
      });

      logger.info(`DEBUG: Transformed ${posts.length} posts successfully`);
      return posts;

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
   * Fetch additional posts via Instagram GraphQL API
   * @param {string} userId - Instagram user ID
   * @param {number} skip - Number of posts to skip
   * @param {number} count - Number of additional posts to fetch
   * @returns {Array} Array of additional post data
   */
  async fetchMorePostsViaGraphQL(userId, skip, count) {
    try {
      logger.info(`DEBUG: fetchMorePostsViaGraphQL called with userId: ${userId}, skip: ${skip}, count: ${count}`);

      // Try using Instagram's media endpoint directly
      const mediaUrl = `${this.baseURL}/api/v1/feed/user/${userId}/?count=${Math.min(count + skip, 50)}`;
      logger.info(`DEBUG: Trying media endpoint: ${mediaUrl}`);

      const response = await this.makeRequest(mediaUrl);

      if (!response.data?.items) {
        logger.warn(`No media items found for user ${userId} via media endpoint`);

        // Fallback: Try GraphQL approach
        return await this.fallbackGraphQLFetch(userId, skip, count);
      }

      const items = response.data.items || [];

      // Skip the first 'skip' posts and take only what we need
      const additionalPosts = items
        .slice(skip)
        .slice(0, count)
        .map(item => this.transformInstagramMediaItem(item));

      logger.info(`Successfully fetched ${additionalPosts.length} additional posts via media endpoint`);
      return additionalPosts;

    } catch (error) {
      logger.warn('Media endpoint failed, trying GraphQL fallback:', error.message);
      // Return empty array instead of throwing to prevent breaking the main flow
      return await this.fallbackGraphQLFetch(userId, skip, count);
    }
  }

  async fallbackGraphQLFetch(userId, skip, count) {
    try {
      // Use the older approach as fallback
      const variables = {
        id: userId,
        first: Math.min(count + skip, 50)
      };

      const queryHash = 'e769aa130647d2354c40ea6a439bfc08';
      const params = new URLSearchParams({
        query_hash: queryHash,
        variables: JSON.stringify(variables)
      });

      const graphqlUrl = `${this.baseURL}/graphql/query/?${params}`;
      const response = await this.makeRequest(graphqlUrl);

      if (!response.data?.data?.user?.edge_owner_to_timeline_media?.edges) {
        logger.warn(`GraphQL fallback also failed for user ${userId}`);
        return [];
      }

      const edges = response.data.data.user.edge_owner_to_timeline_media.edges;
      const additionalPosts = edges
        .slice(skip)
        .slice(0, count)
        .map(edge => this.transformPostData(edge.node));

      logger.info(`GraphQL fallback fetched ${additionalPosts.length} additional posts`);
      return additionalPosts;

    } catch (error) {
      logger.error('GraphQL fallback also failed:', error.message);
      return [];
    }
  }

  transformInstagramMediaItem(item) {
    try {
      // Transform Instagram media API response to our format
      return {
        id: item.id || item.pk,
        shortcode: item.code,
        media_type: this.getMediaTypeFromItem(item),
        media_url: item.image_versions2?.candidates?.[0]?.url || item.video_versions?.[0]?.url,
        thumbnail_url: item.image_versions2?.candidates?.[0]?.url,
        caption: item.caption?.text || '',
        likes: item.like_count || 0,
        comments: item.comment_count || 0,
        views: item.view_count || item.play_count || 0,
        timestamp: new Date(item.taken_at * 1000).toISOString(),
        location: item.location ? {
          name: item.location.name,
          city: item.location.city
        } : null,
        hashtags: this.extractHashtagsFromText(item.caption?.text || ''),
        tagged_users: item.usertags?.in || [],
        is_video: item.media_type === 2,
        duration: item.video_duration || 0
      };
    } catch (error) {
      logger.error('Error transforming media item:', error);
      return null;
    }
  }

  getMediaTypeFromItem(item) {
    if (item.media_type === 2) return 'video';
    if (item.media_type === 8) return 'carousel';
    if (item.clips_metadata || (item.video_duration && item.video_duration < 60)) return 'reel';
    return 'image';
  }

  extractHashtagsFromText(text) {
    if (!text) return [];
    const hashtags = text.match(/#[a-zA-Z0-9_]+/g) || [];
    return hashtags.map(tag => tag.slice(1)); // Remove the # symbol
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