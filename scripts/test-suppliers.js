const fs = require('fs');

async function testTennisProcessor() {
    console.log('🧪 TESTING TENNIS PROCESSOR IN GITHUB ACTIONS...\n');
    
    try {
        console.log('🚀 Starting tennis processor...');
        
        // ✅ FIX: Force execution by running the processor directly
        // Instead of requiring, we'll spawn a child process to run it
        const { spawnSync } = require('child_process');
        
        const result = spawnSync('node', ['scripts/tennis-processor.js'], {
            stdio: 'inherit', // Show all output
            encoding: 'utf-8'
        });
        
        if (result.status !== 0) {
            throw new Error(`Tennis processor failed with exit code: ${result.status}`);
        }
        
        console.log('✅ Tennis processor execution completed');
        
        // Check if results were generated
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
            
            // 🕒 CHECK TIME STATS
            console.log('\n🕒 TIME ANALYSIS:');
            const times = results.matches.map(m => m.time);
            const timeCounts = {};
            times.forEach(time => {
                timeCounts[time] = (timeCounts[time] || 0) + 1;
            });
            
            console.log('Time distribution:');
            Object.entries(timeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([time, count]) => {
                    console.log(`  ${time}: ${count} matches`);
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
