const InstagramScraper = require('./instagram-test');

async function quickTest(username) {
    console.log(`\n🔍 Testing Instagram data for: @${username}`);
    console.log('=' .repeat(50));

    const scraper = new InstagramScraper();

    try {
        // Only test the working method (Alternative Endpoint)
        const result = await scraper.getUserDataAlt(username);

        if (result.success && result.data && result.data.username) {
            const data = result.data;
            console.log('✅ SUCCESS! Data retrieved:');
            console.log(`📱 Username: @${data.username}`);
            console.log(`👤 Full Name: ${data.full_name || 'N/A'}`);
            console.log(`👥 Followers: ${data.followers?.toLocaleString() || 'N/A'}`);
            console.log(`➡️ Following: ${data.following?.toLocaleString() || 'N/A'}`);
            console.log(`📸 Posts: ${data.posts?.toLocaleString() || 'N/A'}`);
            console.log(`✔️ Verified: ${data.is_verified ? 'Yes' : 'No'}`);
            console.log(`🏢 Business: ${data.is_business ? 'Yes' : 'No'}`);
            console.log(`🔒 Private: ${data.is_private ? 'Yes' : 'No'}`);

            if (data.biography) {
                console.log(`📝 Bio: ${data.biography.substring(0, 100)}${data.biography.length > 100 ? '...' : ''}`);
            }

            if (data.external_url) {
                console.log(`🔗 Website: ${data.external_url}`);
            }

            console.log(`\n📊 Quick Stats:`);
            console.log(`   Engagement potential: ${data.followers > 1000000 ? 'HIGH' : data.followers > 100000 ? 'MEDIUM' : 'LOW'}`);

            return data;
        } else {
            console.log('❌ FAILED: Could not retrieve data');
            console.log(`   Error: ${result.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return null;
    }
}

// Test with command line argument or default
const username = process.argv[2] || 'cristiano';
quickTest(username).then(() => {
    console.log('\n✨ Test completed!');
});

module.exports = { quickTest };