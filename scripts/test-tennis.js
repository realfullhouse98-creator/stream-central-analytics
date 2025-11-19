const TennisProcessor = require('./tennis-processor');

async function testTennisProcessor() {
    console.log('🧪 TESTING TENNIS PROCESSOR...\n');
    
    const processor = new TennisProcessor();
    
    try {
        const results = await processor.processTennisMatches();
        
        console.log('🎯 TEST COMPLETED SUCCESSFULLY!');
        console.log(`📊 Generated ${results.matches.length} tennis matches`);
        
        // Show sample output
        console.log('\n🔍 SAMPLE MATCHES:');
        results.matches.slice(0, 3).forEach((match, index) => {
            console.log(`${index + 1}. ${match.teams}`);
            console.log(`   Time: ${match.time} | Sources: ${Object.keys(match.sources).join(', ')}`);
            console.log(`   Confidence: ${match.confidence} | Merged: ${match.merged}`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testTennisProcessor();
