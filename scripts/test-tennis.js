const TennisProcessor = require('./tennis-processor');
const fs = require('fs');

async function testTennisProcessor() {
    console.log('🧪 TESTING TENNIS PROCESSOR IN GITHUB ACTIONS...\n');
    
    try {
        // ✅ FIX: The tennis processor runs automatically when required
        // Just require it and it will execute
        console.log('🚀 Starting tennis processor...');
        
        // The processor will automatically:
        // 1. Load supplier data
        // 2. Process tennis matches  
        // 3. Save results to ./tennis-results/tennis-results.json
        // 4. Log output to console
        
        console.log('✅ Tennis processor execution completed');
        
        // Now check if results were generated
        const resultsPath = './tennis-results/tennis-results.json';
        if (fs.existsSync(resultsPath)) {
            const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            
            console.log('🎯 TEST COMPLETED SUCCESSFULLY!');
            console.log(`📊 Generated ${results.matches.length} tennis matches`);
            
            // Show sample output
            console.log('\n🔍 SAMPLE MATCHES:');
            results.matches.slice(0, 5).forEach((match, index) => {
                console.log(`${index + 1}. ${match.teams}`);
                console.log(`   Time: ${match.time} | Sources: ${Object.keys(match.sources).join(', ')}`);
                console.log(`   Confidence: ${match.confidence} | Merged: ${match.merged}`);
            });
            
            return results;
        } else {
            throw new Error('Tennis results file was not generated');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Only run if called directly
if (require.main === module) {
    testTennisProcessor().catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = testTennisProcessor;
