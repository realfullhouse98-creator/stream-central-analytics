// scripts/test-unified-processor.js
const UnifiedSportsProcessor = require('./unified-sports-processor');

async function testUnifiedProcessor() {
  console.log('🧪 TESTING UNIFIED SPORTS PROCESSOR...\n');
  
  try {
    const processor = new UnifiedSportsProcessor();
    const results = await processor.processAllSports();
    
    console.log('🎯 UNIFIED TEST COMPLETED SUCCESSFULLY!');
    console.log(`📊 Processed ${Object.keys(results.sports).length} sports`);
    
    // Show results by sport
    Object.entries(results.sports).forEach(([sport, data]) => {
      console.log(`\n🏆 ${sport}:`);
      console.log(`   Total: ${data.summary.total_matches} | Merged: ${data.summary.merged_matches} | Individual: ${data.summary.individual_matches}`);
      
      // Show sample matches
      if (data.matches.length > 0) {
        console.log('   Sample matches:');
        data.matches.slice(0, 2).forEach((match, index) => {
          console.log(`     ${index + 1}. ${match.match} (${match.sources.join(', ')})`);
        });
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Unified test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  testUnifiedProcessor().catch(() => process.exit(1));
}

module.exports = testUnifiedProcessor;
