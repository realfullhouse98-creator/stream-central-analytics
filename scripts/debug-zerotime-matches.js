const fs = require('fs');

function debugZeroTimeMatches() {
    console.log('🔍 DEBUGGING THE 8 MATCHES WITH 00:00 TIMES...\n');
    
    try {
        const tomData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
        
        console.log('🎯 FINDING "Cooper White VS Marvin Buytaert" AND OTHER 00:00 MATCHES:\n');
        
        if (tomData.events) {
            Object.entries(tomData.events).forEach(([date, matches]) => {
                matches.forEach(match => {
                    if (match.sport?.toLowerCase().includes('tennis') && 
                        (match.match.includes('Cooper White') || !match.unix_timestamp || match.unix_timestamp === 0)) {
                        
                        console.log(`🎾 ${match.match}`);
                        console.log(`   Date: ${date}`);
                        console.log(`   Timestamp: ${match.unix_timestamp}`);
                        console.log(`   Tournament: ${match.tournament}`);
                        console.log(`   Channels: ${match.channels?.length || 0}`);
                        
                        if (match.unix_timestamp) {
                            const testDate = new Date(match.unix_timestamp * 1000);
                            console.log(`   CONVERSION DEBUG:`);
                            console.log(`     Raw timestamp: ${match.unix_timestamp}`);
                            console.log(`     ×1000: ${match.unix_timestamp * 1000}`);
                            console.log(`     toISOString: ${testDate.toISOString()}`);
                            console.log(`     toTimeString: ${testDate.toTimeString()}`);
                            console.log(`     Local Hours: ${testDate.getHours()}:${testDate.getMinutes()}`);
                            console.log(`     UTC Hours: ${testDate.getUTCHours()}:${testDate.getUTCMinutes()}`);
                            
                            // Check if it's a timezone issue
                            const now = new Date();
                            console.log(`     Current time: ${now.toTimeString()}`);
                            console.log(`     Timezone offset: ${now.getTimezoneOffset()} minutes`);
                        } else {
                            console.log(`   ❌ NO TIMESTAMP - This is the problem!`);
                        }
                        console.log('   ---');
                    }
                });
            });
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugZeroTimeMatches();
