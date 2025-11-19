const fs = require('fs');

function debugTomTimestamps() {
    console.log('🔍 DEBUGGING TOM TIMESTAMPS IN DETAIL...\n');
    
    try {
        const tomData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
        
        console.log('🎯 LOOKING FOR TENNIS MATCHES WITH TIMESTAMPS:\n');
        
        let tennisCount = 0;
        let timestampedTennis = 0;
        
        if (tomData.events) {
            Object.entries(tomData.events).forEach(([date, matches]) => {
                matches.forEach(match => {
                    if (match.sport?.toLowerCase().includes('tennis')) {
                        tennisCount++;
                        
                        console.log(`🎾 ${match.match}`);
                        console.log(`   Date: ${date}`);
                        console.log(`   Timestamp: ${match.unix_timestamp}`);
                        console.log(`   Tournament: ${match.tournament}`);
                        
                        if (match.unix_timestamp) {
                            timestampedTennis++;
                            
                            // Test the conversion
                            const testDate = new Date(match.unix_timestamp * 1000);
                            console.log(`   Conversion Test:`);
                            console.log(`     toISOString: ${testDate.toISOString()}`);
                            console.log(`     toTimeString: ${testDate.toTimeString()}`);
                            console.log(`     getHours: ${testDate.getHours()}:${testDate.getMinutes()}`);
                            console.log(`     getUTCHours: ${testDate.getUTCHours()}:${testDate.getUTCMinutes()}`);
                        } else {
                            console.log(`   ❌ NO TIMESTAMP`);
                        }
                        console.log('   ---');
                    }
                });
            });
        }
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`Total tennis matches: ${tennisCount}`);
        console.log(`Matches with timestamps: ${timestampedTennis}`);
        console.log(`Matches without timestamps: ${tennisCount - timestampedTennis}`);
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugTomTimestamps();
