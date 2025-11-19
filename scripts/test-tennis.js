const TennisProcessor = require('./tennis-processor');
const fs = require('fs');

async function testTennisProcessor() {
    console.log('🧪 TESTING TENNIS PROCESSOR IN GITHUB ACTIONS...\n');
    
    const processor = new TennisProcessor();
    
    try {
        const results = await processor.processTennisMatches();
        
        console.log('🎯 TEST COMPLETED SUCCESSFULLY!');
        console.log(`📊 Generated ${results.matches.length} tennis matches`);
        
        // Show sample output
        console.log('\n🔍 SAMPLE MATCHES:');
        results.matches.slice(0, 5).forEach((match, index) => {
            console.log(`${index + 1}. ${match.teams}`);
            console.log(`   Time: ${match.time} | Sources: ${Object.keys(match.sources).join(', ')}`);
            console.log(`   Confidence: ${match.confidence} | Merged: ${match.merged}`);
        });

        // ✅ GITHUB-FIX: Save to repository (not temp directory)
        const outputDir = './tennis-results';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(
            `${outputDir}/tennis-results.json`, 
            JSON.stringify(results, null, 2)
        );
        
        console.log(`💾 Tennis results saved to ${outputDir}/tennis-results.json`);
        
        return results;
        
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
