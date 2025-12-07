// api.js - ENHANCED UNIFIED SPORTS DATA API
// Version: 3.0 - Updated Wendy API Integration
const API_CONFIG = {
    // 🎯 DIRECT APIS (Primary sources)
    DIRECT_APIS: {
        TOM: {
            BASE_URL: 'https://topembed.pw',
            ENDPOINTS: {
                ALL_MATCHES: '/api.php?format=json'
            },
            TIMEOUT: 8000,
            CORS_PROXIES: [
                'https://corsproxy.io/?',
                'https://api.allorigins.win/raw?url=',
                'https://cors-anywhere.herokuapp.com/'
            ]
        },
        SARAH: {
            BASE_URL: 'https://streamed.pk',
            ENDPOINTS: {
                ALL_MATCHES: '/api/matches/all'
            },
            TIMEOUT: 8000,
            CORS_PROXIES: [
                'https://corsproxy.io/?',
                'https://api.allorigins.win/raw?url=',
                'https://cors-anywhere.herokuapp.com/'
            ]
        },
        WENDY: {
            BASE_URL: 'https://api.watchfooty.st',  // UPDATED: Now uses "api." prefix
            ENDPOINTS: {
                SPORTS: '/api/v1/sports',
                MATCHES_BY_SPORT: '/api/v1/matches/{sport}'
            },
            TIMEOUT: 10000,
            CORS_PROXIES: [
                'https://corsproxy.io/?',
                'https://api.allorigins.win/raw?url=',
                ''  // Direct as fallback
            ],
            MAX_SPORTS: 5  // Limit for performance
        }
    },
    
    // 🔄 FALLBACK STRATEGY
    RETRY_STRATEGY: {
        MAX_RETRIES: 2,
        RETRY_DELAY: 1000,
        TIMEOUT_BACKOFF: true
    }
};

// 🎯 SMART FETCH WITH RETRY
async function smartFetch(url, options = {}, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return await response.json();
            } else {
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                console.log(`   ⚠️ Attempt ${attempt} failed: ${lastError.message}`);
            }
        } catch (error) {
            lastError = error;
            console.log(`   ⚠️ Attempt ${attempt} error: ${error.message}`);
        }
        
        if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

// 🎯 FETCH TOM DATA
async function fetchTomData() {
    console.log('🔍 Fetching Tom data...');
    
    const config = API_CONFIG.DIRECT_APIS.TOM;
    const directUrl = config.BASE_URL + config.ENDPOINTS.ALL_MATCHES;
    
    // Try each CORS proxy
    for (const proxy of config.CORS_PROXIES) {
        try {
            const url = proxy + (proxy ? encodeURIComponent(directUrl) : directUrl);
            console.log(`   Trying: ${new URL(url).hostname}`);
            
            const data = await smartFetch(url, { timeout: config.TIMEOUT });
            
            if (data && (data.events || Array.isArray(data))) {
                const matchCount = data.events ? 
                    Object.values(data.events).reduce((sum, matches) => sum + (Array.isArray(matches) ? matches.length : 0), 0) :
                    (Array.isArray(data) ? data.length : 0);
                
                console.log(`   ✅ Tom: ${matchCount} matches via ${new URL(url).hostname}`);
                return {
                    source: 'tom',
                    data: data,
                    matchCount: matchCount,
                    success: true,
                    endpoint: new URL(url).hostname
                };
            }
        } catch (error) {
            console.log(`   ❌ Tom via ${proxy ? 'proxy' : 'direct'}: ${error.message}`);
        }
    }
    
    throw new Error('All Tom endpoints failed');
}

// 🎯 FETCH SARAH DATA
async function fetchSarahData() {
    console.log('🔍 Fetching Sarah data...');
    
    const config = API_CONFIG.DIRECT_APIS.SARAH;
    const directUrl = config.BASE_URL + config.ENDPOINTS.ALL_MATCHES;
    
    for (const proxy of config.CORS_PROXIES) {
        try {
            const url = proxy + (proxy ? encodeURIComponent(directUrl) : directUrl);
            console.log(`   Trying: ${new URL(url).hostname}`);
            
            const data = await smartFetch(url, { timeout: config.TIMEOUT });
            
            if (data && (Array.isArray(data) || data.matches)) {
                const matches = Array.isArray(data) ? data : data.matches;
                console.log(`   ✅ Sarah: ${matches.length} matches via ${new URL(url).hostname}`);
                
                return {
                    source: 'sarah',
                    data: matches,
                    matchCount: matches.length,
                    success: true,
                    endpoint: new URL(url).hostname
                };
            }
        } catch (error) {
            console.log(`   ❌ Sarah via ${proxy ? 'proxy' : 'direct'}: ${error.message}`);
        }
    }
    
    throw new Error('All Sarah endpoints failed');
}

// 🎯 FETCH WENDY DATA - UPDATED FOR NEW API STRUCTURE
async function fetchWendyData() {
    console.log('🔍 Fetching Wendy data via updated API...');
    
    const config = API_CONFIG.DIRECT_APIS.WENDY;
    
    // Strategy: Get sports list, then fetch matches for each sport
    try {
        // Step 1: Get available sports
        const sports = await fetchWendySports(config);
        if (!Array.isArray(sports) || sports.length === 0) {
            throw new Error('No sports returned from Wendy API');
        }
        
        console.log(`   Found ${sports.length} sports: ${sports.map(s => s.displayName || s.name).join(', ')}`);
        
        // Step 2: Fetch matches for each sport (parallel, limited)
        const sportPromises = sports.slice(0, config.MAX_SPORTS).map(async (sport) => {
            try {
                const matches = await fetchWendySportMatches(sport.name, config);
                console.log(`   ✅ ${sport.displayName}: ${matches.length} matches`);
                
                // Add sport category to each match
                matches.forEach(match => {
                    match.sportCategory = sport.name;
                    match.source = 'wendy';
                });
                
                return matches;
            } catch (error) {
                console.log(`   ❌ ${sport.displayName || sport.name}: ${error.message}`);
                return [];
            }
        });
        
        const results = await Promise.allSettled(sportPromises);
        
        // Step 3: Combine all matches
        const allMatches = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);
        
        console.log(`✅ Wendy: ${allMatches.length} total matches from ${sports.length} sports`);
        
        return {
            source: 'wendy',
            data: allMatches,
            matchCount: allMatches.length,
            success: true,
            strategy: 'sports-approach',
            sportsFetched: sports.slice(0, config.MAX_SPORTS).length
        };
        
    } catch (error) {
        console.log(`❌ Wendy API failed: ${error.message}`);
        
        // Emergency fallback: Try direct football matches
        try {
            console.log('   🔄 Attempting emergency fallback (football only)...');
            const footballMatches = await fetchWendySportMatches('football', config);
            
            if (footballMatches.length > 0) {
                footballMatches.forEach(match => {
                    match.sportCategory = 'football';
                    match.source = 'wendy';
                });
                
                console.log(`   ✅ Emergency fallback: ${footballMatches.length} football matches`);
                
                return {
                    source: 'wendy',
                    data: footballMatches,
                    matchCount: footballMatches.length,
                    success: true,
                    strategy: 'emergency-football-only'
                };
            }
        } catch (fallbackError) {
            console.log(`   ❌ Emergency fallback also failed: ${fallbackError.message}`);
        }
        
        throw error;
    }
}

// 🎯 WENDY HELPER FUNCTIONS
async function fetchWendySports(config) {
    for (const proxy of config.CORS_PROXIES) {
        try {
            const sportsUrl = config.BASE_URL + config.ENDPOINTS.SPORTS;
            const url = proxy + (proxy ? encodeURIComponent(sportsUrl) : sportsUrl);
            
            console.log(`   Trying Wendy sports: ${new URL(url).hostname}`);
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const sports = await response.json();
                
                // Filter to only include sports with matches likely available
                const popularSports = ['football', 'basketball', 'tennis', 'hockey', 'baseball', 'rugby', 'american-football'];
                return sports.filter(sport => 
                    popularSports.includes(sport.name) || 
                    sport.displayName?.toLowerCase().includes('football')
                );
            }
        } catch (error) {
            console.log(`   ⚠️ Wendy sports via ${proxy ? 'proxy' : 'direct'}: ${error.message}`);
        }
    }
    
    // Fallback sports list if API fails
    return [
        { name: 'football', displayName: 'Football' },
        { name: 'basketball', displayName: 'Basketball' },
        { name: 'tennis', displayName: 'Tennis' }
    ];
}

async function fetchWendySportMatches(sport, config) {
    for (const proxy of config.CORS_PROXIES) {
        try {
            const matchesUrl = config.BASE_URL + config.ENDPOINTS.MATCHES_BY_SPORT.replace('{sport}', sport);
            const url = proxy + (proxy ? encodeURIComponent(matchesUrl) : matchesUrl);
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(8000)
            });
            
            if (response.ok) {
                const matches = await response.json();
                
                if (!Array.isArray(matches)) {
                    return [];
                }
                
                // Ensure each match has required fields
                return matches.map(match => ({
                    matchId: match.matchId || `wendy-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
                    title: match.title || `${match.teams?.home?.name || 'Team A'} vs ${match.teams?.away?.name || 'Team B'}`,
                    poster: match.poster || '',
                    teams: match.teams || { home: { name: '' }, away: { name: '' } },
                    scores: match.scores || { home: 0, away: 0 },
                    status: match.status || 'scheduled',
                    currentMinute: match.currentMinute || '',
                    currentMinuteNumber: match.currentMinuteNumber || 0,
                    isEvent: match.isEvent || false,
                    date: match.date || new Date().toISOString(),
                    timestamp: match.timestamp || Math.floor(Date.now() / 1000),
                    league: match.league || 'Unknown League',
                    sport: match.sport || sport,
                    streams: Array.isArray(match.streams) ? match.streams : []
                }));
            }
        } catch (error) {
            console.log(`   ⚠️ Wendy ${sport} via ${proxy ? 'proxy' : 'direct'}: ${error.message}`);
        }
    }
    
    return []; // Return empty if all proxies fail
}

// 🎯 UNIFIED DATA FETCHER (For Pipeline)
async function fetchAllSuppliersForPipeline() {
    console.log('🚀 FETCHING ALL SUPPLIERS FOR PIPELINE');
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    const results = {
        tom: null,
        sarah: null,
        wendy: null,
        errors: [],
        summary: {
            totalMatches: 0,
            successfulSuppliers: 0,
            failedSuppliers: 0,
            duration: 0
        }
    };
    
    try {
        // Fetch all suppliers in parallel
        const fetchPromises = [
            fetchTomData().then(r => results.tom = r).catch(e => results.errors.push({ supplier: 'tom', error: e.message })),
            fetchSarahData().then(r => results.sarah = r).catch(e => results.errors.push({ supplier: 'sarah', error: e.message })),
            fetchWendyData().then(r => results.wendy = r).catch(e => results.errors.push({ supplier: 'wendy', error: e.message }))
        ];
        
        await Promise.allSettled(fetchPromises);
        
        // Calculate summary
        results.summary.duration = Date.now() - startTime;
        results.summary.successfulSuppliers = [results.tom, results.sarah, results.wendy].filter(r => r && r.success).length;
        results.summary.failedSuppliers = 3 - results.summary.successfulSuppliers;
        
        let totalMatches = 0;
        if (results.tom && results.tom.success) totalMatches += results.tom.matchCount;
        if (results.sarah && results.sarah.success) totalMatches += results.sarah.matchCount;
        if (results.wendy && results.wendy.success) totalMatches += results.wendy.matchCount;
        results.summary.totalMatches = totalMatches;
        
        // Log results
        console.log('\n📊 FETCH RESULTS:');
        console.log('=' .repeat(50));
        console.log(`✅ Successful: ${results.summary.successfulSuppliers}/3 suppliers`);
        console.log(`📦 Total matches: ${totalMatches}`);
        console.log(`⏱️  Duration: ${results.summary.duration}ms`);
        
        if (results.tom && results.tom.success) {
            console.log(`   Tom: ${results.tom.matchCount} matches via ${results.tom.endpoint}`);
        }
        if (results.sarah && results.sarah.success) {
            console.log(`   Sarah: ${results.sarah.matchCount} matches via ${results.sarah.endpoint}`);
        }
        if (results.wendy && results.wendy.success) {
            console.log(`   Wendy: ${results.wendy.matchCount} matches via ${results.wendy.strategy} (${results.wendy.sportsFetched || 0} sports)`);
        }
        
        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(err => {
                console.log(`   ${err.supplier}: ${err.error}`);
            });
        }
        
        return results;
        
    } catch (error) {
        console.log(`💥 Unified fetch failed: ${error.message}`);
        throw error;
    }
}

// 🎯 FORMAT FOR PIPELINE CONSUMPTION
function formatForPipeline(results) {
    const formatted = {
        tom: { matches: [], _metadata: { supplier: 'tom', error: 'Failed' } },
        sarah: { matches: [], _metadata: { supplier: 'sarah', error: 'Failed' } },
        wendy: { matches: [], _metadata: { supplier: 'wendy', error: 'Failed' } },
        pipeline_metadata: {
            fetched_at: new Date().toISOString(),
            api_version: '3.0',
            success_rate: results.summary.successfulSuppliers / 3
        }
    };
    
    // Format Tom data
    if (results.tom && results.tom.success) {
        formatted.tom = {
            matches: results.tom.data.matches || results.tom.data,
            _metadata: {
                supplier: 'tom',
                lastUpdated: new Date().toISOString(),
                matchCount: results.tom.matchCount,
                endpoint: results.tom.endpoint,
                dataHash: require('crypto').createHash('md5').update(JSON.stringify(results.tom.data)).digest('hex'),
                professional: true
            }
        };
    }
    
    // Format Sarah data
    if (results.sarah && results.sarah.success) {
        formatted.sarah = {
            matches: results.sarah.data,
            _metadata: {
                supplier: 'sarah',
                lastUpdated: new Date().toISOString(),
                matchCount: results.sarah.matchCount,
                endpoint: results.sarah.endpoint,
                dataHash: require('crypto').createHash('md5').update(JSON.stringify(results.sarah.data)).digest('hex'),
                professional: true
            }
        };
    }
    
    // Format Wendy data
    if (results.wendy && results.wendy.success) {
        formatted.wendy = {
            matches: results.wendy.data,
            _metadata: {
                supplier: 'wendy',
                lastUpdated: new Date().toISOString(),
                matchCount: results.wendy.matchCount,
                strategy: results.wendy.strategy,
                sportsFetched: results.wendy.sportsFetched || 0,
                dataHash: require('crypto').createHash('md5').update(JSON.stringify(results.wendy.data)).digest('hex'),
                professional: true
            }
        };
    }
    
    return formatted;
}

// 🎯 EMERGENCY DATA (When all else fails)
function getEmergencyData() {
    console.log('🚨 PROVIDING EMERGENCY DATA');
    
    const now = Math.floor(Date.now() / 1000);
    const emergencyMatches = [
        {
            matchId: 'emergency-1',
            title: 'Demo Match 1 vs Demo Match 2',
            sport: 'Football',
            timestamp: now + 3600,
            league: 'Emergency League',
            teams: { home: { name: 'Demo Match 1' }, away: { name: 'Demo Match 2' } },
            streams: []
        }
    ];
    
    return {
        tom: { matches: emergencyMatches, _metadata: { supplier: 'tom', emergency: true } },
        sarah: { matches: emergencyMatches, _metadata: { supplier: 'sarah', emergency: true } },
        wendy: { matches: emergencyMatches, _metadata: { supplier: 'wendy', emergency: true } }
    };
}

// 🎯 MAIN EXPORT FOR PIPELINE
async function fetchDataForPipeline() {
    try {
        console.log('=' .repeat(60));
        console.log('SPORTS DATA PIPELINE API FETCHER');
        console.log('=' .repeat(60));
        
        const results = await fetchAllSuppliersForPipeline();
        
        if (results.summary.successfulSuppliers === 0) {
            console.log('⚠️ No suppliers successful, using emergency data');
            return getEmergencyData();
        }
        
        return formatForPipeline(results);
        
    } catch (error) {
        console.log(`💥 Pipeline fetch failed: ${error.message}`);
        return getEmergencyData();
    }
}

// 🎯 DIAGNOSTICS
async function runDiagnostics() {
    console.log('🔍 RUNNING API DIAGNOSTICS');
    console.log('=' .repeat(50));
    
    const diagnostics = {
        timestamp: new Date().toISOString(),
        suppliers: {},
        recommendations: []
    };
    
    // Test each supplier
    const suppliers = [
        { name: 'tom', fetcher: fetchTomData },
        { name: 'sarah', fetcher: fetchSarahData },
        { name: 'wendy', fetcher: fetchWendyData }
    ];
    
    for (const supplier of suppliers) {
        console.log(`\nTesting ${supplier.name.toUpperCase()}...`);
        try {
            const result = await supplier.fetcher();
            diagnostics.suppliers[supplier.name] = {
                status: 'SUCCESS',
                matchCount: result.matchCount,
                endpoint: result.endpoint || result.strategy,
                details: result
            };
            console.log(`   ✅ ${supplier.name}: ${result.matchCount} matches`);
        } catch (error) {
            diagnostics.suppliers[supplier.name] = {
                status: 'FAILED',
                error: error.message
            };
            console.log(`   ❌ ${supplier.name}: ${error.message}`);
        }
    }
    
    console.log('\n📋 DIAGNOSTIC SUMMARY:');
    console.log('=' .repeat(50));
    Object.entries(diagnostics.suppliers).forEach(([name, data]) => {
        console.log(`   ${name.toUpperCase()}: ${data.status} ${data.matchCount ? `(${data.matchCount} matches)` : ''}`);
    });
    
    return diagnostics;
}

// 🚀 EXPORT FOR USE IN PIPELINE
module.exports = {
    fetchDataForPipeline,
    fetchTomData,
    fetchSarahData,
    fetchWendyData,
    runDiagnostics,
    API_CONFIG,
    getEmergencyData
};

console.log('✅ Enhanced API Module Loaded (Wendy API Updated)');
console.log('🎯 Ready for pipeline integration');
