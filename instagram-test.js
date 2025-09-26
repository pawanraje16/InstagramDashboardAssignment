const https = require('https');
const axios = require('axios');

class InstagramScraper {
  constructor() {
    this.baseURL = 'https://www.instagram.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  // Method 1: Try unofficial JSON endpoint
  async getUserDataJSON(username) {
    try {
      const url = `${this.baseURL}/${username}/?__a=1&__d=dis`;
      const response = await axios.get(url, { headers: this.headers });

      if (response.data && response.data.graphql) {
        const user = response.data.graphql.user;
        return {
          method: 'JSON Endpoint',
          success: true,
          data: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            biography: user.biography,
            followers: user.edge_followed_by.count,
            following: user.edge_follow.count,
            posts: user.edge_owner_to_timeline_media.count,
            profile_pic: user.profile_pic_url_hd,
            is_verified: user.is_verified,
            is_business: user.is_business_account,
            external_url: user.external_url
          }
        };
      }

      return {
        method: 'JSON Endpoint',
        success: false,
        error: 'No data found in response'
      };
    } catch (error) {
      return {
        method: 'JSON Endpoint',
        success: false,
        error: error.message
      };
    }
  }

  // Method 2: Scrape HTML page
  async getUserDataHTML(username) {
    try {
      const url = `${this.baseURL}/${username}/`;
      const response = await axios.get(url, { headers: this.headers });

      // Extract JSON from HTML script tags
      const htmlContent = response.data;
      const scriptRegex = /window\._sharedData\s*=\s*({.+?});/;
      const match = htmlContent.match(scriptRegex);

      if (match) {
        const sharedData = JSON.parse(match[1]);
        const user = sharedData.entry_data.ProfilePage[0].graphql.user;

        return {
          method: 'HTML Scraping',
          success: true,
          data: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            biography: user.biography,
            followers: user.edge_followed_by.count,
            following: user.edge_follow.count,
            posts: user.edge_owner_to_timeline_media.count,
            profile_pic: user.profile_pic_url_hd,
            is_verified: user.is_verified,
            is_business: user.is_business_account,
            external_url: user.external_url
          }
        };
      }

      return {
        method: 'HTML Scraping',
        success: false,
        error: 'No _sharedData found in HTML'
      };
    } catch (error) {
      return {
        method: 'HTML Scraping',
        success: false,
        error: error.message
      };
    }
  }

  // Method 3: Try alternative endpoints
  async getUserDataAlt(username) {
    const endpoints = [
      `${this.baseURL}/api/v1/users/web_profile_info/?username=${username}`,
      `${this.baseURL}/${username}/?__a=1`,
      `${this.baseURL}/web/search/topsearch/?query=${username}`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            ...this.headers,
            'X-IG-App-ID': '936619743392459',
            'X-ASBD-ID': '198387',
            'X-CSRFToken': 'missing'
          }
        });

        if (response.data) {
          // Parse the Instagram API response
          let userData = null;

          if (response.data.data && response.data.data.user) {
            const user = response.data.data.user;
            userData = {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              biography: user.biography,
              followers: user.edge_followed_by?.count || 0,
              following: user.edge_follow?.count || 0,
              posts: user.edge_owner_to_timeline_media?.count || 0,
              profile_pic: user.profile_pic_url_hd || user.profile_pic_url,
              is_verified: user.is_verified,
              is_business: user.is_business_account,
              external_url: user.external_url,
              is_private: user.is_private
            };
          }

          return {
            method: `Alternative Endpoint: ${endpoint}`,
            success: true,
            data: userData || response.data,
            rawData: response.data
          };
        }
      } catch (error) {
        console.log(`Failed endpoint: ${endpoint} - ${error.message}`);
      }
    }

    return {
      method: 'Alternative Endpoints',
      success: false,
      error: 'All alternative endpoints failed'
    };
  }

  async testAllMethods(username) {
    console.log(`\n=== Testing Instagram data retrieval for: ${username} ===\n`);

    const methods = [
      () => this.getUserDataJSON(username),
      () => this.getUserDataHTML(username),
      () => this.getUserDataAlt(username)
    ];

    const results = [];

    for (const method of methods) {
      const result = await method();
      results.push(result);

      console.log(`Method: ${result.method}`);
      console.log(`Success: ${result.success}`);

      if (result.success && result.data) {
        if (result.data.username) {
          console.log(`Username: ${result.data.username}`);
          console.log(`Followers: ${result.data.followers}`);
          console.log(`Posts: ${result.data.posts}`);
        } else {
          console.log('Raw data keys:', Object.keys(result.data));
        }
      } else {
        console.log(`Error: ${result.error}`);
      }

      console.log('---\n');
    }

    return results;
  }
}

// Test function
async function testInstagramScraper() {
  const scraper = new InstagramScraper();

  // Test with a few popular accounts
  const testUsers = ['cristiano', 'therock', 'selenagomez'];

  for (const username of testUsers) {
    await scraper.testAllMethods(username);
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Export for use in other files
module.exports = InstagramScraper;

// Run test if executed directly
if (require.main === module) {
  testInstagramScraper().catch(console.error);
}