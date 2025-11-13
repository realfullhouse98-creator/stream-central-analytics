const https = require('https');
const fs = require('fs');

const SUPPLIERS = {
  tom: 'https://topembed.pw/api.php?format=json',
  sarah: 'https://streamed.pk/api/matches/all', 
  footy: 'https://watchfooty.live/api/v1/matches/football'
};

async function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function processMatches(apiData, supplier) {
  if (!apiData?.events) return [];
  
  const matches = [];
  Object.entries(apiData.events).forEach(([date, matchList]) => {
    if (Array.isArray(matchList)) {
      matchList.forEach(match => {
        if (match?.match) {
          const matchTime = match.unix_timestamp ? 
            new Date(match.unix_timestamp * 1000) : 
            new Date(date + 'T12:00:00Z');
            
          const expiresAt = new Date(matchTime.getTime() + (3 * 60 * 60 * 1000));
          
          matches.push({
            id: `${supplier}-${match.match}-${match.unix_timestamp}`,
            teams: match.match,
            league: match.tournament || 'Sports',
            date: date,
            time: matchTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', minute: '2-digit', hour12: false 
            }),
            timestamp: match.unix_timestamp,
            streams: match.channels || [],
            expiresAt: expiresAt.toISOString(),
            sport: (match.sport || 'Football').charAt(0).toUpperCase() + 
                   (match.sport || 'Football').slice(1).toLowerCase(),
            supplier: supplier
          });
        }
      });
    }
  });
  
  return matches;
}

async function updateMasterFile() {
  console.log('🔄 Starting data update...');
  
  let allMatches = [];
  
  for (const [supplier, url] of Object.entries(SUPPLIERS)) {
    try {
      console.log(`📡 Fetching from ${supplier}...`);
      const data = await fetchData(url);
      const processed = processMatches(data, supplier);
      allMatches = [...allMatches, ...processed];
      console.log(`✅ ${supplier}: ${processed.length} matches`);
    } catch (error) {
      console.log(`❌ ${supplier} failed: ${error.message}`);
    }
  }
  
  // Group by sport
  const sportsData = {};
  allMatches.forEach(match => {
    if (!sportsData[match.sport]) sportsData[match.sport] = [];
    sportsData[match.sport].push(match);
  });
  
  const masterData = {
    version: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    sports: sportsData
  };
  
  fs.writeFileSync('master-data.json', JSON.stringify(masterData, null, 2));
  console.log(`🎉 Master file updated! ${allMatches.length} total matches`);
}

updateMasterFile().catch(console.error);
