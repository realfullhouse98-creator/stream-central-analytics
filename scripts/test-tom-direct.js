// fetch-tom-completely-fresh.js
// NO imports from your code, NO dependencies

const https = require('https');
const fs = require('fs');

function fetchTomFresh() {
    console.log('🚀 FETCHING TOM API - 100% FRESH CODE\n');
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'topembed.pw',
            path: '/api.php?format=json',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Fresh-Test/1.0'
            },
            timeout: 10000
        };
        
        console.log('📡 Making HTTPS request to:', options.hostname + options.path);
        
        const req = https.request(options, (res) => {
            console.log('📊 Response status:', res.statusCode);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    console.log('✅ Received', data.length, 'bytes');
                    
                    // Parse JSON
                    const parsed = JSON.parse(data);
                    
                    // Analyze
                    console.log('\n🔍 RAW ANALYSIS:');
                    console.log('=' .repeat(40));
                    
                    if (parsed.events) {
                        const dates = Object.keys(parsed.events);
                        console.log('📅 Dates found:', dates.join(', '));
                        console.log('📊 Number of dates:', dates.length);
                        
                        let totalMatches = 0;
                        dates.forEach(date => {
                            const matches = parsed.events[date];
                            const count = Array.isArray(matches) ? matches.length : 0;
                            totalMatches += count;
                            console.log(`   ${date}: ${count} matches`);
                        });
                        
                        console.log(`\n📈 Total matches: ${totalMatches}`);
                        
                        // Check for "today"
                        const hasToday = dates.includes('today');
                        console.log(`🚨 Contains "today": ${hasToday ? 'YES ❌' : 'NO ✅'}`);
                        
                        // Save raw file
                        fs.writeFileSync('tom-100percent-raw.json', JSON.stringify(parsed, null, 2));
                        console.log('\n💾 Saved raw data: tom-100percent-raw.json');
                        
                        // Save just events
                        fs.writeFileSync('tom-events-only.json', JSON.stringify({ events: parsed.events }, null, 2));
                        console.log('💾 Saved events only: tom-events-only.json');
                        
                        resolve({
                            dates: dates,
                            totalMatches: totalMatches,
                            hasToday: hasToday,
                            rawSize: data.length
                        });
                        
                    } else {
                        console.log('❌ No "events" key found!');
                        console.log('Available keys:', Object.keys(parsed));
                        reject(new Error('No events key'));
                    }
                    
                } catch (error) {
                    console.log('❌ JSON parse error:', error.message);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request error:', error.message);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.log('❌ Request timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.end();
    });
}

// Run it
fetchTomFresh()
    .then(result => {
        console.log('\n🎉 FRESH FETCH COMPLETE!');
        console.log('Result:', result);
    })
    .catch(error => {
        console.error('💥 Fetch failed:', error.message);
        process.exit(1);
    });
