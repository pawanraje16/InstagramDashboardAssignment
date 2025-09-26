const { spawn } = require('child_process');
const path = require('path');

class PythonInstagramBridge {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'instagram_scraper.py');
  }

  async runPythonScraper(username) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.pythonScriptPath, username, '--json']);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Extract JSON from the output (it's printed after the summary)
            const jsonMatch = dataString.match(/\n(\[[\s\S]*\])\s*$/);
            if (jsonMatch) {
              const results = JSON.parse(jsonMatch[1]);
              resolve({
                success: true,
                results: results,
                rawOutput: dataString
              });
            } else {
              resolve({
                success: false,
                error: 'No JSON output found',
                rawOutput: dataString
              });
            }
          } catch (parseError) {
            reject({
              success: false,
              error: `JSON parse error: ${parseError.message}`,
              rawOutput: dataString
            });
          }
        } else {
          reject({
            success: false,
            error: `Python script failed with code ${code}`,
            stderr: errorString,
            stdout: dataString
          });
        }
      });

      pythonProcess.on('error', (error) => {
        reject({
          success: false,
          error: `Failed to start Python process: ${error.message}`
        });
      });

      // Set timeout
      setTimeout(() => {
        pythonProcess.kill();
        reject({
          success: false,
          error: 'Python script timeout'
        });
      }, 60000); // 60 second timeout
    });
  }

  async testPythonIntegration(usernames = ['cristiano', 'therock']) {
    console.log('=== Testing Python-Node.js Integration ===\n');

    for (const username of usernames) {
      try {
        console.log(`Testing ${username}...`);
        const result = await this.runPythonScraper(username);

        if (result.success) {
          console.log('✓ Python scraper executed successfully');

          result.results.forEach(methodResult => {
            console.log(`\nMethod: ${methodResult.method}`);
            console.log(`Success: ${methodResult.success}`);

            if (methodResult.success && methodResult.data) {
              console.log(`Username: ${methodResult.data.username}`);
              console.log(`Followers: ${methodResult.data.followers}`);
              console.log(`Posts: ${methodResult.data.posts}`);
            }
          });
        } else {
          console.log('✗ Python scraper failed:', result.error);
          if (result.rawOutput) {
            console.log('Raw output:', result.rawOutput.substring(0, 500));
          }
        }

      } catch (error) {
        console.error(`✗ Error testing ${username}:`, error.error || error.message);
      }

      console.log('\n' + '-'.repeat(50) + '\n');
    }
  }
}

// Combined Instagram scraper that tries multiple methods
class CombinedInstagramScraper {
  constructor() {
    this.nodeJSScraper = require('./instagram-test');
    this.pythonBridge = new PythonInstagramBridge();
  }

  async scrapeUser(username) {
    console.log(`\n=== Comprehensive Instagram scraping for: ${username} ===\n`);

    const results = {
      username: username,
      methods: [],
      bestResult: null,
      timestamp: new Date().toISOString()
    };

    // Method 1: Node.js unofficial endpoints
    try {
      console.log('1. Testing Node.js unofficial endpoints...');
      const nodeScraper = new this.nodeJSScraper();
      const nodeResults = await nodeScraper.testAllMethods(username);

      nodeResults.forEach(result => {
        results.methods.push({
          type: 'nodejs',
          method: result.method,
          success: result.success,
          data: result.data,
          error: result.error
        });

        if (result.success && result.data && !results.bestResult) {
          results.bestResult = result.data;
        }
      });

    } catch (error) {
      console.log('Node.js scraping failed:', error.message);
      results.methods.push({
        type: 'nodejs',
        method: 'All Node.js methods',
        success: false,
        error: error.message
      });
    }

    // Method 2: Python scraper
    try {
      console.log('\n2. Testing Python scraper...');
      const pythonResult = await this.pythonBridge.runPythonScraper(username);

      if (pythonResult.success) {
        pythonResult.results.forEach(result => {
          results.methods.push({
            type: 'python',
            method: result.method,
            success: result.success,
            data: result.data,
            error: result.error
          });

          if (result.success && result.data && !results.bestResult) {
            results.bestResult = result.data;
          }
        });
      }

    } catch (error) {
      console.log('Python scraping failed:', error.error || error.message);
      results.methods.push({
        type: 'python',
        method: 'Python scraper',
        success: false,
        error: error.error || error.message
      });
    }

    // Summary
    const successfulMethods = results.methods.filter(m => m.success);
    console.log(`\n=== Results Summary for ${username} ===`);
    console.log(`Total methods tried: ${results.methods.length}`);
    console.log(`Successful methods: ${successfulMethods.length}`);

    if (results.bestResult) {
      console.log('\n✓ Best result found:');
      console.log(`Username: ${results.bestResult.username}`);
      console.log(`Full name: ${results.bestResult.full_name}`);
      console.log(`Followers: ${results.bestResult.followers}`);
      console.log(`Following: ${results.bestResult.following}`);
      console.log(`Posts: ${results.bestResult.posts}`);
      console.log(`Verified: ${results.bestResult.is_verified}`);
    } else {
      console.log('\n✗ No successful data extraction');
    }

    return results;
  }
}

module.exports = {
  PythonInstagramBridge,
  CombinedInstagramScraper
};

// Test if run directly
if (require.main === module) {
  async function test() {
    const scraper = new CombinedInstagramScraper();
    await scraper.scrapeUser('cristiano');
  }

  test().catch(console.error);
}