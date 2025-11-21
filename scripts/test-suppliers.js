const fs = require('fs');

async function testSportsProcessor() {
    console.log('🧪 TESTING SPORTS PROCESSOR IN GITHUB ACTIONS...\n');
    
    try {
        console.log('🚀 Starting sports processor...');
        
        // ✅ FIX: Test the new simple-sports-processor instead of tennis-processor
        const { spawnSync } = require('child_process');
        
        const result = spawnSync('node', ['scripts/simple-sports-processor.js'], {
            stdio: 'inherit', // Show all output
            encoding: 'utf-8'
        });
        
        if (result.status !== 0) {
            throw new Error(`Sports processor failed with exit code: ${result.status}`);
        }
        
        console.log('✅ Sports processor execution completed');
        
        // Check if results were generated (adjust path based on your new processor output)
        const resultsPath = './master-data.json'; // Or wherever your new processor saves data
        if (fs.existsSync(resultsPath)) {
            const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            
            console.log('🎯 TEST COMPLETED SUCCESSFULLY!');
            console.log(`📊 Processed data structure:`, Object.keys(results));
            
            // Show sample output based on your new data structure
            console.log('\n🔍 DATA OVERVIEW:');
            Object.entries(results).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    console.log(`${key}: ${value.length} items`);
                } else if (typeof value === 'object') {
                    console.log(`${key}: object with keys ${Object.keys(value).join(', ')}`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            });
            
            return results;
        } else {
            throw new Error('Sports results file was not generated');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Only run if called directly
if (require.main === module) {
    testSportsProcessor().catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = testSportsProcessor;
