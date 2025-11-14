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
  if (supplier === 'sarah') {
    // SARAH'S SPECIAL FORMAT
    if (!Array.isArray(apiData)) return [];
    
    const matches = [];
    apiData.forEach(match => {
      if (match?.title) {
        const matchDate = match.date ? new Date(match.date) : new Date();
        const expiresAt = new Date(matchDate.getTime() + (3 * 60 * 60 * 1000));
        
        // Convert "Team A vs Team B" to "Team A - Team B" format
        const teams = match.title.replace(/ vs /g, ' - ');
        
        matches.push({
          id: `${supplier}-${match.id}`,
          teams: teams,
          league: match.category || 'Sports',
          date: matchDate.toISOString().split('T')[0],
          time: matchDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit', hour12: false 
          }),
          timestamp: Math.floor(matchDate.getTime() / 1000),
          streams: match.sources ? match.sources.map(source => 
            `https://embedsports.top/embed/${source.source}/${source.id}/1`
          ) : [],
          expiresAt: expiresAt.toISOString(),
          sport: (match.category || 'Football').charAt(0).toUpperCase() + 
                 (match.category || 'Football').slice(1).toLowerCase(),
          supplier: supplier
        });
      }
    });
    
    return matches;
  } else {
    // TOM'S ORIGINAL FORMAT
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
}

async function updateMasterFile() {
  console.log('🔄 Starting data update...');
  
  let allMatches = [];
  
  for (const [supplier, url] of Object.entries(SUPPLIERS)) {
    try {
      console.log(`📡 Fetching from ${supplier}...`);
      const data = await fetchData(url);
      
      // DEBUG CODE FOR SARAH - ADD THIS BLOCK
      if (supplier === 'sarah') {
        console.log('🔍 Sarah API response type:', typeof data);
        console.log('🔍 Sarah data length:', data ? data.length : 'no data');
        if (data && data.length > 0) {
          console.log('🔍 First Sarah item:', JSON.stringify(data[0]).substring(0, 200));
        } else {
          console.log('🔍 Sarah data is empty or null');
        }
      }
      // END DEBUG CODE
      
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

// ADD DEBUG CODE RIGHT HERE:
console.log('🔍 Checking Sarah data in final array:');
const sarahMatches = allMatches.filter(m => m.supplier && m.supplier.toLowerCase() === 'sarah');
console.log(`🔍 Sarah matches in final: ${sarahMatches.length}`);
if (sarahMatches.length > 0) {
  console.log('🔍 First Sarah match:', JSON.stringify(sarahMatches[0]));
}

console.log('🔍 All suppliers:', [...new Set(allMatches.map(m => m.supplier))]);
// END DEBUG CODE
  
  fs.writeFileSync('master-data.json', JSON.stringify(masterData, null, 2));
  console.log(`🎉 Master file updated! ${allMatches.length} total matches`);
}

updateMasterFile().catch(console.error);
