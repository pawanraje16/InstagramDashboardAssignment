const axios = require('axios');

class InstagramPostScraperFixed {
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
  }

  async getUserProfileAndPosts(username, postLimit = 12) {
    try {
      console.log(`🔍 Fetching profile and posts for @${username}...`);

      // Get user profile which includes first batch of posts
      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`;
      const profileResponse = await axios.get(profileUrl, { headers: this.headers });

      if (!profileResponse.data?.data?.user) {
        throw new Error('User profile not found');
      }

      const user = profileResponse.data.data.user;

      // Extract posts from the initial profile response
      const posts = this.extractPostsFromProfile(user, postLimit);

      console.log(`✅ Found ${posts.length} posts in profile data`);

      return {
        success: true,
        profile: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          biography: user.biography,
          followers: user.edge_followed_by?.count || 0,
          following: user.edge_follow?.count || 0,
          posts_count: user.edge_owner_to_timeline_media?.count || 0,
          profile_pic: user.profile_pic_url_hd || user.profile_pic_url,
          is_verified: user.is_verified,
          is_business: user.is_business_account,
          external_url: user.external_url,
          is_private: user.is_private
        },
        posts: posts
      };

    } catch (error) {
      console.error('Error fetching profile and posts:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractPostsFromProfile(user, limit = 12) {
    if (!user.edge_owner_to_timeline_media?.edges) {
      console.log('⚠️ No posts found in profile data');
      return [];
    }

    const edges = user.edge_owner_to_timeline_media.edges.slice(0, limit);
    console.log(`📸 Processing ${edges.length} posts...`);

    return edges.map((edge, index) => {
      const node = edge.node;

      const post = {
        id: node.id,
        shortcode: node.shortcode,
        url: `https://www.instagram.com/p/${node.shortcode}/`,
        media_type: this.getMediaType(node),
        caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
        comments: node.edge_media_to_comment?.count || node.edge_media_preview_comment?.count || 0,
        timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
        display_url: node.display_url,
        dimensions: {
          height: node.dimensions?.height || 0,
          width: node.dimensions?.width || 0
        },
        is_video: node.is_video || false,
        video_view_count: node.video_view_count || null,
        location: node.location ? {
          id: node.location.id,
          name: node.location.name
        } : null,
        hashtags: this.extractHashtags(node.edge_media_to_caption?.edges?.[0]?.node?.text || ''),
        engagement: {
          total: (node.edge_liked_by?.count || 0) + (node.edge_media_to_comment?.count || 0),
          likes: node.edge_liked_by?.count || 0,
          comments: node.edge_media_to_comment?.count || 0
        }
      };

      console.log(`   ${index + 1}. ${post.media_type} - ${post.likes} likes, ${post.comments} comments`);
      return post;
    });
  }

  getMediaType(node) {
    if (node.__typename === 'GraphVideo') return 'video';
    if (node.__typename === 'GraphSidecar') return 'carousel';
    if (node.is_video) return 'video';
    return 'image';
  }

  extractHashtags(caption) {
    if (!caption) return [];
    const hashtagRegex = /#[\w\u0590-\u05ff\u0900-\u097f]+/g;
    return caption.match(hashtagRegex) || [];
  }

  async getReelsData(username, limit = 12) {
    try {
      console.log(`🎬 Fetching reels for @${username}...`);

      // Try to get reels from profile
      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`;
      const profileResponse = await axios.get(profileUrl, { headers: this.headers });

      if (!profileResponse.data?.data?.user) {
        throw new Error('User not found');
      }

      const user = profileResponse.data.data.user;

      // Extract reels from posts (videos are often reels)
      if (user.edge_owner_to_timeline_media?.edges) {
        const reels = user.edge_owner_to_timeline_media.edges
          .filter(edge => edge.node.is_video)
          .slice(0, limit)
          .map(edge => {
            const node = edge.node;
            return {
              id: node.id,
              shortcode: node.shortcode,
              url: `https://www.instagram.com/reel/${node.shortcode}/`,
              video_url: node.video_url || node.display_url,
              thumbnail_url: node.display_url,
              duration: node.video_duration || 0,
              views: node.video_view_count || 0,
              likes: node.edge_liked_by?.count || 0,
              comments: node.edge_media_to_comment?.count || 0,
              caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
              timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
              hashtags: this.extractHashtags(node.edge_media_to_caption?.edges?.[0]?.node?.text || '')
            };
          });

        console.log(`✅ Found ${reels.length} reels`);
        return reels;
      }

      return [];

    } catch (error) {
      console.error('Error fetching reels:', error.message);
      return [];
    }
  }

  async analyzeInfluencerComplete(username, postLimit = 12) {
    console.log(`\n📊 COMPLETE INFLUENCER ANALYSIS`);
    console.log(`👤 Username: @${username}`);
    console.log('=' .repeat(60));

    // Get profile and posts data
    const profileData = await this.getUserProfileAndPosts(username, postLimit);

    if (!profileData.success) {
      console.log('❌ Failed to fetch profile data:', profileData.error);
      return null;
    }

    const { profile, posts } = profileData;

    // Get reels data
    const reels = await this.getReelsData(username, 10);

    // Calculate comprehensive metrics
    const metrics = this.calculateMetrics(profile, posts, reels);

    // Display comprehensive analysis
    this.displayAnalysis(profile, posts, reels, metrics);

    return {
      profile,
      posts,
      reels,
      metrics,
      database_ready_data: this.formatForDatabase(profile, posts, reels, metrics)
    };
  }

  calculateMetrics(profile, posts, reels) {
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
    const totalEngagement = totalLikes + totalComments;

    const reelLikes = reels.reduce((sum, reel) => sum + reel.likes, 0);
    const reelComments = reels.reduce((sum, reel) => sum + reel.comments, 0);
    const reelViews = reels.reduce((sum, reel) => sum + reel.views, 0);

    // Content type analysis
    const contentBreakdown = {
      images: posts.filter(p => p.media_type === 'image').length,
      videos: posts.filter(p => p.media_type === 'video').length,
      carousels: posts.filter(p => p.media_type === 'carousel').length,
      reels_count: reels.length
    };

    // Engagement rates
    const postEngagementRate = profile.followers > 0 && posts.length > 0
      ? ((totalEngagement / posts.length) / profile.followers * 100).toFixed(2)
      : 0;

    const reelEngagementRate = profile.followers > 0 && reels.length > 0
      ? (((reelLikes + reelComments) / reels.length) / profile.followers * 100).toFixed(2)
      : 0;

    // Hashtag analysis
    const allHashtags = [...posts, ...reels].flatMap(item => item.hashtags);
    const hashtagFreq = {};
    allHashtags.forEach(tag => hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1);
    const topHashtags = Object.entries(hashtagFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      post_metrics: {
        total_likes: totalLikes,
        total_comments: totalComments,
        avg_likes: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0,
        avg_comments: posts.length > 0 ? Math.round(totalComments / posts.length) : 0,
        engagement_rate: parseFloat(postEngagementRate)
      },
      reel_metrics: {
        total_likes: reelLikes,
        total_comments: reelComments,
        total_views: reelViews,
        avg_likes: reels.length > 0 ? Math.round(reelLikes / reels.length) : 0,
        avg_comments: reels.length > 0 ? Math.round(reelComments / reels.length) : 0,
        avg_views: reels.length > 0 ? Math.round(reelViews / reels.length) : 0,
        engagement_rate: parseFloat(reelEngagementRate)
      },
      content_breakdown: contentBreakdown,
      top_hashtags: topHashtags,
      influence_score: this.calculateInfluenceScore(profile, posts, reels),
      best_performing_content: this.getBestPerformingContent(posts, reels)
    };
  }

  calculateInfluenceScore(profile, posts, reels) {
    // Proprietary influence scoring algorithm
    let score = 0;

    // Follower base (max 30 points)
    if (profile.followers > 1000000) score += 30;
    else if (profile.followers > 100000) score += 25;
    else if (profile.followers > 10000) score += 20;
    else if (profile.followers > 1000) score += 15;
    else score += 10;

    // Engagement quality (max 25 points)
    const totalPosts = posts.length + reels.length;
    if (totalPosts > 0) {
      const avgEngagement = (
        posts.reduce((sum, p) => sum + p.engagement.total, 0) +
        reels.reduce((sum, r) => sum + r.likes + r.comments, 0)
      ) / totalPosts;

      const engagementRatio = avgEngagement / profile.followers;
      if (engagementRatio > 0.05) score += 25;
      else if (engagementRatio > 0.03) score += 20;
      else if (engagementRatio > 0.01) score += 15;
      else score += 10;
    }

    // Content consistency (max 20 points)
    if (profile.posts_count > 100) score += 20;
    else if (profile.posts_count > 50) score += 15;
    else if (profile.posts_count > 20) score += 10;
    else score += 5;

    // Verification and business status (max 15 points)
    if (profile.is_verified) score += 10;
    if (profile.is_business) score += 5;

    // Activity recency (max 10 points)
    if (posts.length > 0) {
      const latestPost = new Date(posts[0].timestamp);
      const daysSincePost = (Date.now() - latestPost.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePost < 7) score += 10;
      else if (daysSincePost < 30) score += 7;
      else if (daysSincePost < 90) score += 5;
      else score += 2;
    }

    return Math.min(100, score);
  }

  getBestPerformingContent(posts, reels) {
    const allContent = [
      ...posts.map(p => ({...p, type: 'post'})),
      ...reels.map(r => ({...r, type: 'reel', engagement: {total: r.likes + r.comments}}))
    ];

    return allContent
      .sort((a, b) => b.engagement.total - a.engagement.total)
      .slice(0, 5)
      .map(item => ({
        type: item.type,
        url: item.url,
        engagement: item.engagement.total,
        likes: item.likes,
        comments: item.comments,
        views: item.views || null,
        media_type: item.media_type || 'video',
        date: item.timestamp
      }));
  }

  displayAnalysis(profile, posts, reels, metrics) {
    console.log(`\n👤 PROFILE OVERVIEW:`);
    console.log(`   Name: ${profile.full_name}`);
    console.log(`   Followers: ${profile.followers.toLocaleString()}`);
    console.log(`   Following: ${profile.following.toLocaleString()}`);
    console.log(`   Total Posts: ${profile.posts_count.toLocaleString()}`);
    console.log(`   Verified: ${profile.is_verified ? '✓' : '✗'}`);
    console.log(`   Business Account: ${profile.is_business ? '✓' : '✗'}`);

    console.log(`\n📊 POST METRICS (Last ${posts.length} posts):`);
    console.log(`   Total Likes: ${metrics.post_metrics.total_likes.toLocaleString()}`);
    console.log(`   Total Comments: ${metrics.post_metrics.total_comments.toLocaleString()}`);
    console.log(`   Avg Likes: ${metrics.post_metrics.avg_likes.toLocaleString()}`);
    console.log(`   Avg Comments: ${metrics.post_metrics.avg_comments.toLocaleString()}`);
    console.log(`   Engagement Rate: ${metrics.post_metrics.engagement_rate}%`);

    if (reels.length > 0) {
      console.log(`\n🎬 REELS METRICS (${reels.length} reels):`);
      console.log(`   Total Views: ${metrics.reel_metrics.total_views.toLocaleString()}`);
      console.log(`   Total Likes: ${metrics.reel_metrics.total_likes.toLocaleString()}`);
      console.log(`   Avg Views: ${metrics.reel_metrics.avg_views.toLocaleString()}`);
      console.log(`   Engagement Rate: ${metrics.reel_metrics.engagement_rate}%`);
    }

    console.log(`\n📱 CONTENT BREAKDOWN:`);
    console.log(`   Images: ${metrics.content_breakdown.images}`);
    console.log(`   Videos: ${metrics.content_breakdown.videos}`);
    console.log(`   Carousels: ${metrics.content_breakdown.carousels}`);
    console.log(`   Reels: ${metrics.content_breakdown.reels_count}`);

    console.log(`\n🏆 INFLUENCE SCORE: ${metrics.influence_score}/100`);

    if (metrics.top_hashtags.length > 0) {
      console.log(`\n🏷️ TOP HASHTAGS:`);
      metrics.top_hashtags.slice(0, 5).forEach(([tag, count], i) => {
        console.log(`   ${i+1}. ${tag} (${count}x)`);
      });
    }

    console.log(`\n🔥 TOP PERFORMING CONTENT:`);
    metrics.best_performing_content.forEach((item, i) => {
      console.log(`   ${i+1}. ${item.type.toUpperCase()} - ${item.engagement.toLocaleString()} engagement`);
      console.log(`      ${item.url}`);
    });
  }

  formatForDatabase(profile, posts, reels, metrics) {
    return {
      profile: {
        ...profile,
        scraped_at: new Date().toISOString(),
        influence_score: metrics.influence_score
      },
      posts: posts.map(post => ({
        ...post,
        profile_id: profile.id,
        scraped_at: new Date().toISOString()
      })),
      reels: reels.map(reel => ({
        ...reel,
        profile_id: profile.id,
        scraped_at: new Date().toISOString()
      })),
      metrics: {
        ...metrics,
        profile_id: profile.id,
        analyzed_at: new Date().toISOString()
      }
    };
  }
}

module.exports = InstagramPostScraperFixed;

// Test if run directly
if (require.main === module) {
  async function test() {
    const scraper = new InstagramPostScraperFixed();
    const username = process.argv[2] || 'theboyfrom_maharashtra';
    await scraper.analyzeInfluencerComplete(username, 12);
  }

  test().catch(console.error);
}