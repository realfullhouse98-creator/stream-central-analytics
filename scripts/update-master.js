const https = require('https');
const fs = require('fs');

const SUPPLIERS = {
  tom: 'https://topembed.pw/api.php?format=json',
  sarah: 'https://streamed.pk/api/matches/all'
  // footy removed - handled separately
};

// TEAM NAME NORMALIZATION FUNCTION
function normalizeTeamNames(teams) {
    const teamMappings = {
        'tara galilor': 'wales',
        'wales': 'wales',
        'belarus': 'belarus'
        // Add more as we find them
    };
    
    let normalized = teams.toLowerCase();
    
    Object.keys(teamMappings).forEach(wrongName => {
        const correctName = teamMappings[wrongName];
        normalized = normalized.replace(wrongName, correctName);
    });
    
    // Convert back to proper case (First Letter Capital)
    return normalized.split(' - ')
        .map(team => team.charAt(0).toUpperCase() + team.slice(1))
        .join(' - ');
}

// SPORT NAME NORMALIZATION FUNCTION
function normalizeSportName(sport) {
    const sportMappings = {
        'american football': 'American Football',
        'american-football': 'American Football',
        'ice hockey': 'Ice Hockey',
        'hockey': 'Ice Hockey',
        'motorsport': 'Motorsport',
        'moto-sport': 'Motorsport',
        'fight': 'Fighting',
        'fighting': 'Fighting'
    };
   
    const normalized = sport.toLowerCase().trim();
    return sportMappings[normalized] || sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
}

async function fetchData(url) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const { URL } = require('url');
    
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    };

    console.log(`🔍 Making request to: ${url}`);
    
    const req = https.request(options, (response) => {
      let data = '';
      
      console.log(`🔍 ${url} - Status: ${response.statusCode}`);
      
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        console.log(`🔍 ${url} - Raw response length: ${data.length}`);
        
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.log(`🚨 ${url} - Parse error, raw data:`, data.substring(0, 200));
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}
// ADD THIS FUNCTION TO GET FOOTY SPORTS
async function getFootySports() {
  try {
    const sportsUrl = 'https://www.watchfooty.live/api/v1/sports';
    console.log(`📡 Getting Footy sports from: ${sportsUrl}`);
    const sportsData = await fetchData(sportsUrl);
    console.log(`✅ Found ${sportsData.length} Footy sports`);
    return sportsData.map(sport => sport.name); // returns ['football', 'tennis', 'basketball', ...]
  } catch (error) {
    console.log('❌ Failed to get Footy sports:', error.message);
    return ['football', 'tennis', 'basketball', 'cricket', 'rugby', 'baseball']; // fallback
  }
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
        const teams = normalizeTeamNames(match.title.replace(/ vs /g, ' - '));
        
        matches.push({
          id: `${supplier}-${normalizeTeamNames(match.title.replace(/ vs /g, ' - '))}-${Math.floor(matchDate.getTime() / 1000)}`,
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
          sport: normalizeSportName(match.category || 'Football'),
          supplier: supplier
        });
      }
    });
    
    return matches;
  } else if (supplier === 'footy') {
    // FOOTY'S SPECIAL FORMAT
    if (!Array.isArray(apiData)) return [];
    
    const matches = [];
    apiData.forEach(match => {
      if (match?.title && match.teams) {
        const matchDate = match.date ? new Date(match.date) : new Date();
        const expiresAt = new Date(matchDate.getTime() + (3 * 60 * 60 * 1000));
        
        // Convert team objects to string format
        const teams = `${match.teams.home?.name || 'Home'} - ${match.teams.away?.name || 'Away'}`;
        
        matches.push({
          id: `${supplier}-${normalizeTeamNames(teams)}-${match.timestamp || Math.floor(matchDate.getTime() / 1000)}`,
          teams: teams,
          league: match.league || 'Sports',
          date: matchDate.toISOString().split('T')[0],
          time: matchDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit', hour12: false 
          }),
          timestamp: match.timestamp || Math.floor(matchDate.getTime() / 1000),
          streams: match.streams ? match.streams.map(stream => stream.url) : [],
          expiresAt: expiresAt.toISOString(),
          sport: normalizeSportName(match.sport || 'Football'),
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
              id: `${supplier}-${normalizeTeamNames(match.match)}-${match.unix_timestamp}`,
              teams: normalizeTeamNames(match.match),
              league: match.tournament || 'Sports',
              date: date,
              time: matchTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', minute: '2-digit', hour12: false 
              }),
              timestamp: match.unix_timestamp,
              streams: match.channels || [],
              expiresAt: expiresAt.toISOString(),
              sport: normalizeSportName(match.sport || 'Football'),
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
  
  // 1. Fetch from Tom and Sarah
  for (const [supplier, url] of Object.entries(SUPPLIERS)) {
    try {
      console.log(`📡 Fetching from ${supplier}...`);
      const data = await fetchData(url);
      
      // DEBUG CODE FOR SARAH
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
  
  // 2. Fetch from Footy for ALL sports
  try {
    console.log('📡 Getting Footy sports...');
    const footySports = await getFootySports();
    console.log(`✅ Found ${footySports.length} Footy sports:`, footySports);
    
    for (const sport of footySports) {
      try {
        console.log(`📡 Fetching from footy (${sport})...`);
        const url = `https://www.watchfooty.live/api/v1/matches/${sport}`;
        const data = await fetchData(url);
        const processed = processMatches(data, 'footy');
        allMatches = [...allMatches, ...processed];
        console.log(`✅ footy (${sport}): ${processed.length} matches`);
      } catch (error) {
        console.log(`❌ footy (${sport}) failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ Footy sports failed:', error.message);
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

  // DEBUG CODE
  console.log('🔍 Checking all data in final array:');
  const sarahMatches = allMatches.filter(m => m.supplier && m.supplier.toLowerCase() === 'sarah');
  const footyMatches = allMatches.filter(m => m.supplier && m.supplier.toLowerCase() === 'footy');
  console.log(`🔍 Sarah matches in final: ${sarahMatches.length}`);
  console.log(`🔍 Footy matches in final: ${footyMatches.length}`);
  console.log('🔍 All suppliers:', [...new Set(allMatches.map(m => m.supplier))]);
  // END DEBUG CODE
  
  fs.writeFileSync('master-data.json', JSON.stringify(masterData, null, 2));
  console.log(`🎉 Master file updated! ${allMatches.length} total matches`);
}

updateMasterFile().catch(console.error);
