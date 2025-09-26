const axios = require('axios');

class InstagramPostScraper {
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

  async getUserProfileAndPosts(username, postLimit = 20) {
    try {
      console.log(`🔍 Fetching profile and posts for @${username}...`);

      // First get user profile data
      const profileUrl = `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`;
      const profileResponse = await axios.get(profileUrl, { headers: this.headers });

      if (!profileResponse.data?.data?.user) {
        throw new Error('User profile not found');
      }

      const user = profileResponse.data.data.user;
      const userId = user.id;

      // Get user's posts using the media endpoint
      const postsData = await this.getUserPosts(userId, postLimit);

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
        posts: postsData
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserPosts(userId, limit = 20) {
    try {
      const postsUrl = `${this.baseURL}/graphql/query/`;

      // Instagram GraphQL query for user media
      const variables = {
        id: userId,
        first: limit
      };

      const queryHash = 'e769aa130647d2354c40ea6a439bfc08'; // This might need updating

      const response = await axios.get(postsUrl, {
        headers: this.headers,
        params: {
          query_hash: queryHash,
          variables: JSON.stringify(variables)
        }
      });

      if (response.data?.data?.user?.edge_owner_to_timeline_media?.edges) {
        return this.parsePostsData(response.data.data.user.edge_owner_to_timeline_media.edges);
      }

      return [];

    } catch (error) {
      console.log('GraphQL method failed, trying alternative...');
      return await this.getPostsFromProfile(userId, limit);
    }
  }

  async getPostsFromProfile(username, limit = 20) {
    try {
      // Alternative method: scrape from profile page
      const profileUrl = `${this.baseURL}/${username}/`;
      const response = await axios.get(profileUrl, { headers: this.headers });

      const htmlContent = response.data;

      // Extract JSON data from HTML
      const sharedDataMatch = htmlContent.match(/window\._sharedData\s*=\s*({.+?});/);
      const additionalDataMatch = htmlContent.match(/window\.__additionalDataLoaded\('\w+',({.+?})\);/);

      let posts = [];

      if (sharedDataMatch) {
        const sharedData = JSON.parse(sharedDataMatch[1]);
        if (sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
          posts = sharedData.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges;
        }
      }

      return this.parsePostsData(posts.slice(0, limit));

    } catch (error) {
      console.log('Alternative posts method also failed:', error.message);
      return [];
    }
  }

  parsePostsData(edges) {
    return edges.map(edge => {
      const node = edge.node;

      return {
        id: node.id,
        shortcode: node.shortcode, // Used for post URL
        url: `https://www.instagram.com/p/${node.shortcode}/`,
        media_type: this.getMediaType(node),
        caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
        comments: node.edge_media_to_comment?.count || node.edge_media_preview_comment?.count || 0,
        timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
        display_url: node.display_url,
        dimensions: {
          height: node.dimensions?.height,
          width: node.dimensions?.width
        },
        is_video: node.is_video || false,
        video_view_count: node.video_view_count || null,
        video_duration: node.video_duration || null,
        location: node.location ? {
          id: node.location.id,
          name: node.location.name,
          slug: node.location.slug
        } : null,
        tagged_users: this.extractTaggedUsers(node),
        hashtags: this.extractHashtags(node.edge_media_to_caption?.edges?.[0]?.node?.text || ''),
        engagement_rate: this.calculateEngagementRate(
          node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
          node.edge_media_to_comment?.count || node.edge_media_preview_comment?.count || 0
        )
      };
    });
  }

  getMediaType(node) {
    if (node.__typename === 'GraphVideo') return 'video';
    if (node.__typename === 'GraphSidecar') return 'carousel';
    if (node.is_video) return 'video';
    return 'image';
  }

  extractTaggedUsers(node) {
    if (node.edge_media_to_tagged_user?.edges) {
      return node.edge_media_to_tagged_user.edges.map(edge => ({
        username: edge.node.user.username,
        full_name: edge.node.user.full_name,
        id: edge.node.user.id
      }));
    }
    return [];
  }

  extractHashtags(caption) {
    if (!caption) return [];
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return caption.match(hashtagRegex) || [];
  }

  calculateEngagementRate(likes, comments) {
    const totalEngagement = likes + comments;
    return {
      total_engagement: totalEngagement,
      likes_percentage: likes > 0 ? ((likes / totalEngagement) * 100).toFixed(2) : 0,
      comments_percentage: comments > 0 ? ((comments / totalEngagement) * 100).toFixed(2) : 0
    };
  }

  async getDetailedPostData(shortcode) {
    try {
      const postUrl = `${this.baseURL}/p/${shortcode}/?__a=1&__d=dis`;
      const response = await axios.get(postUrl, { headers: this.headers });

      if (response.data?.items?.[0]) {
        const post = response.data.items[0];
        return {
          success: true,
          data: {
            id: post.id,
            shortcode: post.code,
            likes: post.like_count,
            comments: post.comment_count,
            caption: post.caption?.text || '',
            location: post.location,
            tagged_users: post.usertags?.in || [],
            media_urls: this.extractMediaUrls(post)
          }
        };
      }

      return { success: false, error: 'Post data not found' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  extractMediaUrls(post) {
    const urls = [];

    if (post.image_versions2?.candidates) {
      urls.push(...post.image_versions2.candidates.map(c => c.url));
    }

    if (post.video_versions) {
      urls.push(...post.video_versions.map(v => v.url));
    }

    if (post.carousel_media) {
      post.carousel_media.forEach(item => {
        if (item.image_versions2?.candidates) {
          urls.push(...item.image_versions2.candidates.map(c => c.url));
        }
        if (item.video_versions) {
          urls.push(...item.video_versions.map(v => v.url));
        }
      });
    }

    return urls;
  }

  async analyzeInfluencerMetrics(username, postLimit = 20) {
    console.log(`\n📊 Analyzing influencer metrics for @${username}...`);
    console.log('=' .repeat(60));

    const data = await this.getUserProfileAndPosts(username, postLimit);

    if (!data.success) {
      console.log('❌ Failed to fetch data:', data.error);
      return null;
    }

    const { profile, posts } = data;

    // Calculate metrics
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
    const totalEngagement = totalLikes + totalComments;
    const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0;
    const avgComments = posts.length > 0 ? Math.round(totalComments / posts.length) : 0;
    const engagementRate = profile.followers > 0 ? ((totalEngagement / posts.length) / profile.followers * 100).toFixed(2) : 0;

    // Content analysis
    const videoCount = posts.filter(p => p.media_type === 'video').length;
    const imageCount = posts.filter(p => p.media_type === 'image').length;
    const carouselCount = posts.filter(p => p.media_type === 'carousel').length;

    // Popular hashtags
    const allHashtags = posts.flatMap(p => p.hashtags);
    const hashtagFreq = {};
    allHashtags.forEach(tag => hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1);
    const topHashtags = Object.entries(hashtagFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // Display results
    console.log(`\n👤 PROFILE OVERVIEW:`);
    console.log(`   Name: ${profile.full_name}`);
    console.log(`   Followers: ${profile.followers.toLocaleString()}`);
    console.log(`   Following: ${profile.following.toLocaleString()}`);
    console.log(`   Total Posts: ${profile.posts_count.toLocaleString()}`);
    console.log(`   Verified: ${profile.is_verified ? 'Yes' : 'No'}`);
    console.log(`   Business: ${profile.is_business ? 'Yes' : 'No'}`);

    console.log(`\n📊 ENGAGEMENT METRICS (Last ${posts.length} posts):`);
    console.log(`   Total Likes: ${totalLikes.toLocaleString()}`);
    console.log(`   Total Comments: ${totalComments.toLocaleString()}`);
    console.log(`   Avg Likes per Post: ${avgLikes.toLocaleString()}`);
    console.log(`   Avg Comments per Post: ${avgComments.toLocaleString()}`);
    console.log(`   Engagement Rate: ${engagementRate}%`);

    console.log(`\n📱 CONTENT BREAKDOWN:`);
    console.log(`   Images: ${imageCount} (${((imageCount/posts.length)*100).toFixed(1)}%)`);
    console.log(`   Videos: ${videoCount} (${((videoCount/posts.length)*100).toFixed(1)}%)`);
    console.log(`   Carousels: ${carouselCount} (${((carouselCount/posts.length)*100).toFixed(1)}%)`);

    if (topHashtags.length > 0) {
      console.log(`\n🏷️ TOP HASHTAGS:`);
      topHashtags.forEach(([tag, count], i) => {
        console.log(`   ${i+1}. ${tag} (${count} times)`);
      });
    }

    console.log(`\n🔥 TOP PERFORMING POSTS:`);
    const topPosts = posts.sort((a, b) => b.engagement_rate.total_engagement - a.engagement_rate.total_engagement).slice(0, 3);
    topPosts.forEach((post, i) => {
      console.log(`   ${i+1}. ${post.url}`);
      console.log(`      Likes: ${post.likes.toLocaleString()} | Comments: ${post.comments.toLocaleString()}`);
      console.log(`      Type: ${post.media_type} | Date: ${new Date(post.timestamp).toLocaleDateString()}`);
    });

    return {
      profile,
      posts,
      metrics: {
        total_likes: totalLikes,
        total_comments: totalComments,
        avg_likes: avgLikes,
        avg_comments: avgComments,
        engagement_rate: parseFloat(engagementRate),
        content_breakdown: {
          images: imageCount,
          videos: videoCount,
          carousels: carouselCount
        },
        top_hashtags: topHashtags,
        top_posts: topPosts.map(p => ({
          url: p.url,
          likes: p.likes,
          comments: p.comments,
          type: p.media_type,
          date: p.timestamp
        }))
      }
    };
  }
}

module.exports = InstagramPostScraper;

// Test if run directly
if (require.main === module) {
  async function test() {
    const scraper = new InstagramPostScraper();
    const username = process.argv[2] || 'theboyfrom_maharashtra';
    await scraper.analyzeInfluencerMetrics(username, 20);
  }

  test().catch(console.error);
}