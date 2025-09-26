const puppeteer = require('puppeteer');

class InstagramPuppeteerScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();

    // Set realistic user agent and viewport
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Set additional headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
  }

  async scrapeUserData(username) {
    try {
      if (!this.page) await this.init();

      const url = `https://www.instagram.com/${username}/`;
      console.log(`Navigating to: ${url}`);

      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for the page to load
      await this.page.waitForTimeout(3000);

      // Check if profile exists
      const notFoundSelectors = [
        'span:contains("Sorry, this page isn\'t available")',
        'h2:contains("This page isn\'t available")',
        '[data-testid="error-page"]'
      ];

      for (const selector of notFoundSelectors) {
        const notFound = await this.page.$(selector);
        if (notFound) {
          return {
            success: false,
            error: 'Profile not found or private'
          };
        }
      }

      // Extract user data using multiple selectors
      const userData = await this.page.evaluate(() => {
        // Try to get data from window._sharedData first
        if (window._sharedData && window._sharedData.entry_data && window._sharedData.entry_data.ProfilePage) {
          const user = window._sharedData.entry_data.ProfilePage[0].graphql.user;
          return {
            method: 'SharedData',
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
          };
        }

        // Fallback to DOM scraping
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        };

        const getMetaContent = (property) => {
          const meta = document.querySelector(`meta[property="${property}"]`);
          return meta ? meta.getAttribute('content') : null;
        };

        // Extract data from meta tags and DOM
        const username = getMetaContent('og:title') || document.querySelector('h2')?.textContent;
        const biography = getMetaContent('og:description');
        const profilePic = getMetaContent('og:image');

        // Try to extract follower counts from DOM
        const statsElements = document.querySelectorAll('a[href*="/followers/"], a[href*="/following/"]');
        let followers = null, following = null, posts = null;

        // Look for stats in various possible locations
        const statLinks = Array.from(document.querySelectorAll('a')).filter(a =>
          a.href.includes('/followers/') || a.href.includes('/following/')
        );

        statLinks.forEach(link => {
          const text = link.textContent;
          const count = text.match(/[\d,]+/)?.[0]?.replace(/,/g, '');
          if (link.href.includes('/followers/')) {
            followers = count ? parseInt(count) : null;
          } else if (link.href.includes('/following/')) {
            following = count ? parseInt(count) : null;
          }
        });

        // Look for posts count
        const postsElement = Array.from(document.querySelectorAll('div')).find(div =>
          div.textContent.includes('posts') && div.textContent.match(/\d+/)
        );
        if (postsElement) {
          const match = postsElement.textContent.match(/(\d+)/);
          posts = match ? parseInt(match[1]) : null;
        }

        return {
          method: 'DOM_Scraping',
          username: username,
          biography: biography,
          profile_pic: profilePic,
          followers: followers,
          following: following,
          posts: posts,
          raw_html_title: document.title,
          page_url: window.location.href
        };
      });

      return {
        success: true,
        data: userData
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testMultipleUsers(usernames) {
    const results = [];

    for (const username of usernames) {
      console.log(`\n=== Testing Puppeteer scraping for: ${username} ===`);

      const result = await this.scrapeUserData(username);
      results.push({ username, ...result });

      console.log(`Success: ${result.success}`);
      if (result.success) {
        console.log(`Data method: ${result.data.method}`);
        console.log(`Username: ${result.data.username}`);
        console.log(`Followers: ${result.data.followers}`);
        console.log(`Biography: ${result.data.biography?.substring(0, 100)}...`);
      } else {
        console.log(`Error: ${result.error}`);
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    await this.close();
    return results;
  }
}

// Test function
async function testPuppeteerScraper() {
  const scraper = new InstagramPuppeteerScraper();
  const testUsers = ['cristiano', 'therock'];

  try {
    const results = await scraper.testMultipleUsers(testUsers);
    console.log('\n=== Final Results ===');
    results.forEach(result => {
      console.log(`${result.username}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    });
  } catch (error) {
    console.error('Test failed:', error);
  }
}

module.exports = InstagramPuppeteerScraper;

// Run test if executed directly
if (require.main === module) {
  testPuppeteerScraper();
}