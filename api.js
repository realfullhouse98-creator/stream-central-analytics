// api.js - ENHANCED UNIFIED SPORTS DATA API
// Version: 2.0 - Optimized for GitHub Actions Pipeline

const API_CONFIG = {
    // 🎯 PRIMARY PROXY (If working)
    UNIFIED_PROXY: {
        BASE_URL: 'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev',
        ENDPOINTS: {
            COMBINED_MATCHES: '/api/combined-matches',
            TOM_ALL: '/api/tom/all',
            SARAH_ALL: '/api/sarah/all', 
            WENDY_ALL: '/api/wendy/all'
        },
        TIMEOUT: 10000 // 10 seconds
    },
    
    // 🛡️ DIRECT APIS (Primary fallback)
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
            BASE_URL: 'https://watchfooty.st',
            ENDPOINTS: {
                // Based on your raw Wendy data structure
                ALL_MATCHES: '/api/v1/all-matches',  // Try this first
                MATCHES_DIRECT: '/matches',           // Alternative
                SPORTS: '/api/v1/sports',
                SPORT_MATCHES: '/api/v1/matches/{sport}'
            },
            TIMEOUT: 15000, // Wendy needs more time
            CORS_PROXIES: [
                'https://corsproxy.io/?',
                'https://api.allorigins.win/raw?url=',
                ''
            ],
            MAX_SPORTS: 3 // Limit for performance
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

// 🎯 FETCH WENDY DATA - MULTIPLE STRATEGIES
async function fetchWendyData() {
    console.log('🔍 Fetching Wendy data...');
    
    const config = API_CONFIG.DIRECT_APIS.WENDY;
    
    // Strategy 1: Try direct all-matches endpoint
    try {
        const allMatchesUrl = config.BASE_URL + config.ENDPOINTS.ALL_MATCHES;
        console.log(`   Strategy 1: Direct all-matches endpoint`);
        
        const data = await smartFetch(allMatchesUrl, { 
            timeout: config.TIMEOUT,
            headers: {
                'Origin': config.BASE_URL,
                'Referer': config.BASE_URL + '/'
            }
        });
        
        if (data && (Array.isArray(data) || data.matches)) {
            const matches = Array.isArray(data) ? data : data.matches;
            console.log(`   ✅ Wendy Strategy 1: ${matches.length} matches`);
            
            return {
                source: 'wendy',
                data: matches,
                matchCount: matches.length,
                success: true,
                strategy: 'direct-all-matches'
            };
        }
    } catch (error) {
        console.log(`   ❌ Wendy Strategy 1 failed: ${error.message}`);
    }
    
    // Strategy 2: Try sports → matches approach
    try {
        console.log(`   Strategy 2: Sports → matches approach`);
        const sportsUrl = config.BASE_URL + config.ENDPOINTS.SPORTS;
        
        const sports = await smartFetch(sportsUrl, { 
            timeout: 5000,
            headers: {
                'Origin': config.BASE_URL,
                'Referer': config.BASE_URL + '/'
            }
        });
        
        if (!Array.isArray(sports) || sports.length === 0) {
            throw new Error('No sports returned');
        }
        
        const allMatches = [];
        const sportsToFetch = sports.slice(0, config.MAX_SPORTS);
        
        console.log(`   Found ${sports.length} sports, fetching ${sportsToFetch.length}`);
        
        for (const sport of sportsToFetch) {
            try {
                const sportName = sport.name || sport;
                const matchesUrl = config.BASE_URL + 
                    config.ENDPOINTS.SPORT_MATCHES.replace('{sport}', encodeURIComponent(sportName));
                
                const matches = await smartFetch(matchesUrl, { timeout: 5000 });
                
                if (Array.isArray(matches)) {
                    matches.forEach(match => {
                        match.sportCategory = sportName;
                        match.source = 'wendy';
                    });
                    allMatches.push(...matches);
                    console.log(`   ✅ ${sportName}: ${matches.length} matches`);
                }
            } catch (error) {
                console.log(`   ⚠️ ${sport.name || sport}: ${error.message}`);
            }
        }
        
        if (allMatches.length > 0) {
            console.log(`   ✅ Wendy Strategy 2: ${allMatches.length} total matches`);
            return {
                source: 'wendy',
                data: allMatches,
                matchCount: allMatches.length,
                success: true,
                strategy: 'sports-approach',
                sportsFetched: sportsToFetch.length
            };
        }
    } catch (error) {
        console.log(`   ❌ Wendy Strategy 2 failed: ${error.message}`);
    }
    
    // Strategy 3: Try with CORS proxies
    console.log(`   Strategy 3: Trying CORS proxies`);
    for (const proxy of config.CORS_PROXIES) {
        try {
            const testUrl = config.BASE_URL + '/api/v1/sports';
            const url = proxy + (proxy ? encodeURIComponent(testUrl) : testUrl);
            
            const data = await smartFetch(url, { timeout: 8000 });
            
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   ✅ Wendy via ${proxy ? 'proxy' : 'direct'}: Found ${data.length} sports`);
                // Just return the sports list as proof of connectivity
                return {
                    source: 'wendy',
                    data: { sports: data },
                    matchCount: 0,
                    success: true,
                    strategy: 'proxy-test',
                    endpoint: proxy ? 'cors-proxy' : 'direct'
                };
            }
        } catch (error) {
            console.log(`   ❌ Wendy proxy ${proxy || 'direct'}: ${error.message}`);
        }
    }
    
    throw new Error('All Wendy strategies failed');
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
        // Fetch all suppliers in parallel with timeout
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
            console.log(`   Wendy: ${results.wendy.matchCount} matches via ${results.wendy.strategy}`);
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
            api_version: '2.0',
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
            matches: Array.isArray(results.wendy.data) ? results.wendy.data : results.wendy.data.matches || [],
            _metadata: {
                supplier: 'wendy',
                lastUpdated: new Date().toISOString(),
                matchCount: results.wendy.matchCount,
                strategy: results.wendy.strategy,
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
            match: 'Demo Match 1 - Demo Match 2',
            sport: 'Football',
            unix_timestamp: now + 3600,
            tournament: 'Emergency League',
            channels: []
        },
        {
            match: 'Test Team A - Test Team B',
            sport: 'Basketball',
            unix_timestamp: now + 7200,
            tournament: 'Backup Tournament',
            channels: []
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
            
            // Add recommendation
            if (supplier.name === 'wendy') {
                diagnostics.recommendations.push({
                    supplier: 'wendy',
                    issue: 'API connectivity',
                    suggestion: 'Check if watchfooty.st/api/v1/all-matches exists'
                });
            }
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
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS export
    module.exports = {
        fetchDataForPipeline,
        fetchTomData,
        fetchSarahData,
        fetchWendyData,
        runDiagnostics,
        API_CONFIG,
        getEmergencyData
    };
} else {
    // Browser export
    window.SportsDataAPI = {
        fetchDataForPipeline,
        fetchTomData,
        fetchSarahData,
        fetchWendyData,
        runDiagnostics,
        API_CONFIG
    };
    console.log('🚀 Sports Data API loaded for browser use');
}

console.log('✅ Enhanced API Module Loaded');
console.log('🎯 Ready for pipeline integration');
