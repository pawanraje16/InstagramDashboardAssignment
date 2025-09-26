const { CombinedInstagramScraper } = require('./python-bridge');

async function testAllMethods() {
  console.log('Instagram Data Scraping Test Suite');
  console.log('===================================\n');

  const scraper = new CombinedInstagramScraper();

  // Test with different types of accounts
  const testUsers = [
    'cristiano',    // Large celebrity account
    'therock',      // Another large account
    'coding',       // Tech account
  ];

  const results = [];

  for (const username of testUsers) {
    try {
      const result = await scraper.scrapeUser(username);
      results.push(result);

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error(`Failed to test ${username}:`, error);
      results.push({
        username,
        error: error.message,
        success: false
      });
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('FINAL TEST RESULTS');
  console.log('='.repeat(60));

  results.forEach(result => {
    if (result.bestResult) {
      console.log(`✓ ${result.username}: SUCCESS`);
      console.log(`  - Followers: ${result.bestResult.followers}`);
      console.log(`  - Posts: ${result.bestResult.posts}`);
      console.log(`  - Verified: ${result.bestResult.is_verified}`);
    } else {
      console.log(`✗ ${result.username}: FAILED`);
      if (result.methods) {
        const attempted = result.methods.length;
        const successful = result.methods.filter(m => m.success).length;
        console.log(`  - Attempted ${attempted} methods, ${successful} succeeded`);
      }
    }
  });

  // Method effectiveness analysis
  console.log('\n' + '='.repeat(60));
  console.log('METHOD EFFECTIVENESS ANALYSIS');
  console.log('='.repeat(60));

  const methodStats = {};
  results.forEach(result => {
    if (result.methods) {
      result.methods.forEach(method => {
        const key = `${method.type}-${method.method}`;
        if (!methodStats[key]) {
          methodStats[key] = { attempts: 0, successes: 0 };
        }
        methodStats[key].attempts++;
        if (method.success) {
          methodStats[key].successes++;
        }
      });
    }
  });

  Object.entries(methodStats).forEach(([method, stats]) => {
    const successRate = (stats.successes / stats.attempts * 100).toFixed(1);
    console.log(`${method}: ${stats.successes}/${stats.attempts} (${successRate}%)`);
  });

  return results;
}

// Run tests
if (require.main === module) {
  testAllMethods()
    .then(results => {
      console.log('\nTest completed. Results saved in memory.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testAllMethods };