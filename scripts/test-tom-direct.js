// test-tom-direct.js - DIRECT TOM API TEST
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');

async function testTomDirect() {
  console.log('🔍 DIRECT TOM API TEST - NO WORKER\n');
  
  try {
    // 1. Fetch directly from Tom API
    console.log('📡 Fetching from Tom API directly...');
    const response = await fetch('https://topembed.pw/api.php?format=json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SportsPipeline-Direct-Test/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const rawData = await response.json();
    
    // 2. Analyze the raw data
    console.log('\n📊 RAW DATA ANALYSIS:');
    console.log('====================');
    console.log('Event keys:', Object.keys(rawData.events || {}));
    
    let totalMatches = 0;
    if (rawData.events) {
      Object.entries(rawData.events).forEach(([date, matches]) => {
        const count = Array.isArray(matches) ? matches.length : 'not_array';
        console.log(`📅 ${date}: ${count} matches`);
        totalMatches += Array.isArray(matches) ? matches.length : 0;
      });
    }
    
    console.log(`\n📈 Total matches in raw API: ${totalMatches}`);
    
    // 3. Save raw data
    const rawDataFile = './suppliers/tom-raw-data.json';
    fs.writeFileSync(rawDataFile, JSON.stringify(rawData, null, 2));
    console.log(`💾 Raw data saved: ${rawDataFile}`);
    
    // 4. Process like update-suppliers.js would
    console.log('\n🔧 PROCESSING LIKE UPDATE-SUPPLIERS.JS:');
    console.log('=====================================');
    
    const processedData = {
      events: rawData.events || {},
      matches: Object.values(rawData.events || {}).flat(),
      _metadata: {
        supplier: 'tom',
        lastUpdated: new Date().toISOString(),
        matchCount: totalMatches,
        dataHash: crypto.createHash('md5').update(JSON.stringify(rawData.events)).digest('hex').substring(0, 12),
        source: 'direct-test',
        success: true
      }
    };
    
    const processedFile = './suppliers/tom-data-test.json';
    fs.writeFileSync(processedFile, JSON.stringify(processedData, null, 2));
    console.log(`💾 Processed data saved: ${processedFile}`);
    console.log(`📊 Event keys in processed:`, Object.keys(processedData.events));
    
    // 5. Compare with current tom-data.json
    console.log('\n🔍 COMPARISON WITH CURRENT DATA:');
    console.log('================================');
    
    if (fs.existsSync('./suppliers/tom-data.json')) {
      const currentData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
      console.log('Current tom-data.json event keys:', Object.keys(currentData.events || {}));
      console.log('Current match count:', currentData._metadata?.matchCount || 0);
    }
    
    // 6. Test universal-standardizer.js on this data
    console.log('\n🚀 TESTING UNIVERSAL-STANDARDIZER:');
    console.log('=================================');
    
    // Create a test match for the standardizer
    if (processedData.matches.length > 0) {
      const testMatch = processedData.matches[0];
      console.log('Sample match:', {
        match: testMatch.match,
        sport: testMatch.sport,
        date: Object.keys(processedData.events)[0],
        channels: testMatch.channels?.length || 0
      });
    }
    
    console.log('\n✅ DIRECT TEST COMPLETE!');
    console.log('📁 Files created:');
    console.log('   - suppliers/tom-raw-data.json (raw API response)');
    console.log('   - suppliers/tom-data-test.json (processed data)');
    
  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
  }
}

// Run the test
testTomDirect();
