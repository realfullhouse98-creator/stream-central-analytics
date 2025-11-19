const fs = require('fs');

async function testTennisProcessor() {
    console.log('🧪 TESTING TENNIS PROCESSOR IN GITHUB ACTIONS...\n');
    
    try {
        console.log('🚀 Starting tennis processor...');
        
        // ✅ FIX: Import and run directly, bypassing the main module check
        const TennisProcessor = require('./tennis-processor');
        const processor = new TennisProcessor();
        
        // Manually call the processing pipeline
        console.log('📥 Loading supplier data...');
        const supplierData = await processor.loadSupplierData();
        console.log(`📥 Loaded ${supplierData.length} total matches`);
        
        console.log('🎾 Extracting tennis matches...');
        const tennisMatches = processor.extractTennisMatches(supplierData);
        console.log(`🎾 Found ${tennisMatches.length} tennis matches`);
        
        console.log('⏰ Grouping by time slots...');
        const timeSlots = processor.groupByTimeSlots(tennisMatches);
        console.log(`⏰ Created ${Object.keys(timeSlots).length} time slots`);
        
        console.log('🔄 Processing time slots...');
        const processedMatches = processor.processTimeSlots(timeSlots);
        
        console.log('📊 Generating final output...');
        const results = processor.generateFinalOutput(processedMatches);
        
        processor.logResults();
        processor.logTimeDebugInfo(results.matches);
        
        console.log('🎯 TEST COMPLETED SUCCESSFULLY!');
        console.log(`📊 Generated ${results.matches.length} tennis matches`);
        
        // Show sample output
        console.log('\n🔍 SAMPLE MATCHES:');
        results.matches.slice(0, 5).forEach((match, index) => {
            console.log(`${index + 1}. ${match.teams}`);
            console.log(`   Time: ${match.time} | Sources: ${Object.keys(match.sources).join(', ')}`);
            console.log(`   Confidence: ${match.confidence} | Merged: ${match.merged}`);
        });

        // Save to repository
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
