// test-tom-direct.js - COMPLETE CODE
const fs = require('fs');

async function testTomDirect() {
    console.log('=== TOM API DIRECT TEST ===\n');
    
    try {
        // 1. Fetch directly from Tom API
        console.log('1️⃣ Fetching from Tom API directly...');
        const response = await fetch('https://topembed.pw/api.php?format=json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 2. Save raw data
        fs.writeFileSync('test-tom-data.json', JSON.stringify(data, null, 2));
        console.log('✅ Saved raw data to: test-tom-data.json');
        console.log('   File size:', fs.statSync('test-tom-data.json').size, 'bytes');
        
        // 3. Analyze dates
        console.log('\n2️⃣ Checking dates...');
        if (data.events) {
            const dates = Object.keys(data.events);
            console.log('   Number of dates:', dates.length);
            console.log('   Dates found:', dates.join(', '));
            
            // Check for "today"
            const hasToday = dates.includes('today');
            console.log('   Contains "today":', hasToday ? 'YES ❌' : 'NO ✅');
            
            // Check for date format (YYYY-MM-DD)
            const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
            const hasDateStrings = dates.some(date => dateFormat.test(date));
            console.log('   Has date strings (YYYY-MM-DD):', hasDateStrings ? 'YES ✅' : 'NO ❌');
            
            // Count matches per date
            console.log('\n3️⃣ Match counts:');
            let totalMatches = 0;
            dates.forEach(date => {
                const matches = data.events[date];
                const count = Array.isArray(matches) ? matches.length : 0;
                totalMatches += count;
                console.log(`   ${date}: ${count} matches`);
            });
            
            console.log('\n4️⃣ Total matches:', totalMatches);
            
            // 4. Sample data
            if (dates.length > 0 && data.events[dates[0]].length > 0) {
                console.log('\n5️⃣ Sample match (first date, first match):');
                const sample = data.events[dates[0]][0];
                console.log('   Match:', sample.match || 'No name');
                console.log('   Sport:', sample.sport || 'Unknown');
                console.log('   Timestamp:', sample.unix_timestamp || 'None');
                console.log('   Channels:', sample.channels?.length || 0);
            }
            
            // 5. Conclusion
            console.log('\n6️⃣ RESULT:');
            if (hasToday) {
                console.log('   ❌ Tom API returns "today" (API changed)');
                console.log('   Need to update ALL code to handle this');
            } else if (hasDateStrings) {
                console.log('   ✅ Tom API returns date strings (YYYY-MM-DD)');
                console.log('   ⚠️ Problem is in YOUR CODE, not the API');
                console.log('   Your code is converting dates to "today"');
            } else {
                console.log('   ❓ Unknown date format');
                console.log('   Dates:', dates);
            }
            
        } else {
            console.log('❌ No "events" found in API response');
            console.log('Response keys:', Object.keys(data));
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testTomDirect().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
