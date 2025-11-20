// scripts/test-processor.js
const TennisProcessor = require('./tennis-processor');

async function testProcessor() {
  console.log('🧪 TESTING TENNIS PROCESSOR...\n');
  
  try {
    const processor = new TennisProcessor();
    const results = await processor.processAllSuppliers();
    
    console.log('🎯 TEST COMPLETED SUCCESSFULLY!');
    console.log(`📊 Generated ${results.matches.length} matches`);
    
    // Show sample matches
    console.log('\n🔍 SAMPLE MATCHES:');
    results.matches.slice(0, 3).forEach((match, index) => {
      console.log(`${index + 1}. ${match.match}`);
      console.log(`   Sources: ${match.sources.join(', ')} | Confidence: ${match.confidence}`);
      console.log(`   Channels: ${match.channels.length} streams`);
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  testProcessor().catch(() => process.exit(1));
}

module.exports = testProcessor;
