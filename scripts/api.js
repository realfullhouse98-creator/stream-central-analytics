// api.js - WORKER-PRIMARY API FETCHER
// Version: 4.0 - Cloudflare Workers as Primary Source
const API_CONFIG = {
    // 🎯 PRIMARY: CLOUDFLARE WORKERS PROXY
    WORKER_PROXY: {
        BASE_URL: 'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev', // Your worker URL
        ENDPOINTS: {
            COMBINED_MATCHES: '/api/combined-matches',
            TOM_ALL: '/api/tom/all',
            SARAH_ALL: '/api/sarah/all',
            WENDY_ALL: '/api/wendy/all'
        },
        TIMEOUT: 15000,
        PRIMARY: true
    },
    
    // 🎯 SECONDARY: DIRECT APIS (Fallback)
    DIRECT_APIS: {
        TOM: {
            BASE_URL: 'https://topembed.pw',
            ENDPOINTS: { ALL_MATCHES: '/api.php?format=json' },
            TIMEOUT: 10000,
            CORS_PROXIES: ['https://corsproxy.io/?', 'https://api.allorigins.win/raw?url=']
        },
        SARAH: {
            BASE_URL: 'https://streamed.pk',
            ENDPOINTS: { ALL_MATCHES: '/api/matches/all' },
            TIMEOUT: 10000,
            CORS_PROXIES: ['https://corsproxy.io/?', 'https://api.allorigins.win/raw?url=']
        },
        WENDY: {
            BASE_URL: 'https://api.watchfooty.st',
            ENDPOINTS: {
                SPORTS: '/api/v1/sports',
                MATCHES_BY_SPORT: '/api/v1/matches/{sport}'
            },
            TIMEOUT: 15000,
            CORS_PROXIES: ['https://corsproxy.io/?', 'https://api.allorigins.win/raw?url='],
            MAX_SPORTS: 5
        }
    },
    
    RETRY_STRATEGY: {
        MAX_RETRIES: 2,
        RETRY_DELAY: 1000
    }
};

// 🎯 SMART FETCH WITH WORKER-FIRST STRATEGY
async function smartFetchWithWorkerFallback(endpoint, options = {}) {
    const workerConfig = API_CONFIG.WORKER_PROXY;
    const workerUrl = `${workerConfig.BASE_URL}${endpoint}`;
    
    console.log(`🔄 PRIMARY: Trying Worker endpoint: ${workerUrl}`);
    
    try {
        const response = await fetch(workerUrl, {
            ...options,
            signal: AbortSignal.timeout(workerConfig.TIMEOUT),
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SportsPipeline/4.0-WorkerPrimary',
                ...options.headers
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Worker success for ${endpoint}`);
            return { source: 'worker', data: data, success: true };
        } else {
            throw new Error(`Worker HTTP ${response.status}`);
        }
    } catch (workerError) {
        console.log(`   ⚠️ Worker failed: ${workerError.message}`);
        console.log(`   🔄 Falling back to direct APIs...`);
        
        // Determine which direct API to use based on endpoint
        if (endpoint.includes('/tom/')) {
            return await fetchTomDataDirect();
        } else if (endpoint.includes('/sarah/')) {
            return await fetchSarahDataDirect();
        } else if (endpoint.includes('/wendy/')) {
            return await fetchWendyDataDirect();
        } else if (endpoint.includes('/combined-matches')) {
            return await fetchCombinedDirect();
        }
        
        throw new Error(`No fallback for endpoint: ${endpoint}`);
    }
}

// 🎯 DIRECT API FALLBACKS
async function fetchTomDataDirect() {
    console.log('   🔄 FALLBACK: Fetching Tom data directly...');
    
    const config = API_CONFIG.DIRECT_APIS.TOM;
    const directUrl = config.BASE_URL + config.ENDPOINTS.ALL_MATCHES;
    
    for (const proxy of config.CORS_PROXIES) {
        try {
            const url = proxy + (proxy ? encodeURIComponent(directUrl) : directUrl);
            const response = await fetch(url, { 
                signal: AbortSignal.timeout(config.TIMEOUT)
            });
            
            if (response.ok) {
                const data = await response.json();
                const matchCount = data.events ? 
                    Object.values(data.events).reduce((sum, dayMatches) => sum + (Array.isArray(dayMatches) ? dayMatches.length : 0), 0) : 0;
                
                console.log(`   ✅ Tom direct: ${matchCount} matches`);
                return { source: 'tom-direct', data: data, success: true, matchCount: matchCount };
            }
        } catch (error) {
            console.log(`   ❌ Tom direct failed: ${error.message}`);
        }
    }
    
    throw new Error('All Tom direct endpoints failed');
}

async function fetchSarahDataDirect() {
    console.log('   🔄 FALLBACK: Fetching Sarah data directly...');
    
    const config = API_CONFIG.DIRECT_APIS.SARAH;
    const directUrl = config.BASE_URL + config.ENDPOINTS.ALL_MATCHES;
    
    for (const proxy of config.CORS_PROXIES) {
        try {
            const url = proxy + (proxy ? encodeURIComponent(directUrl) : directUrl);
            const response = await fetch(url, { 
                signal: AbortSignal.timeout(config.TIMEOUT)
            });
            
            if (response.ok) {
                const data = await response.json();
                const matches = Array.isArray(data) ? data : (data.matches || []);
                
                console.log(`   ✅ Sarah direct: ${matches.length} matches`);
                return { source: 'sarah-direct', data: matches, success: true, matchCount: matches.length };
            }
        } catch (error) {
            console.log(`   ❌ Sarah direct failed: ${error.message}`);
        }
    }
    
    throw new Error('All Sarah direct endpoints failed');
}

async function fetchWendyDataDirect() {
    console.log('   🔄 FALLBACK: Fetching Wendy data directly...');
    
    const config = API_CONFIG.DIRECT_APIS.WENDY;
    
    try {
        // Get sports list
        const sportsUrl = config.BASE_URL + config.ENDPOINTS.SPORTS;
        const sportsResponse = await fetch(sportsUrl, {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!sportsResponse.ok) throw new Error('Sports fetch failed');
        
        const sports = await sportsResponse.json();
        const sportsToFetch = sports.slice(0, config.MAX_SPORTS);
        
        // Fetch matches for each sport
        const matchPromises = sportsToFetch.map(async (sport) => {
            try {
                const matchesUrl = config.BASE_URL + config.ENDPOINTS.MATCHES_BY_SPORT.replace('{sport}', sport.name);
                const response = await fetch(matchesUrl, {
                    signal: AbortSignal.timeout(8000)
                });
                
                if (response.ok) {
                    const matches = await response.json();
                    matches.forEach(match => {
                        match.sportCategory = sport.name;
                        match.source = 'wendy';
                    });
                    return matches;
                }
                return [];
            } catch (error) {
                console.log(`   ⚠️ Wendy ${sport.name}: ${error.message}`);
                return [];
            }
        });
        
        const results = await Promise.allSettled(matchPromises);
        const allMatches = results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value);
        
        console.log(`   ✅ Wendy direct: ${allMatches.length} matches from ${sportsToFetch.length} sports`);
        return { source: 'wendy-direct', data: allMatches, success: true, matchCount: allMatches.length };
        
    } catch (error) {
        console.log(`   ❌ Wendy direct failed: ${error.message}`);
        throw error;
    }
}

async function fetchCombinedDirect() {
    console.log('   🔄 FALLBACK: Fetching combined data directly...');
    
    const results = await Promise.allSettled([
        fetchTomDataDirect().catch(() => ({ source: 'tom', data: { events: {} }, success: false })),
        fetchSarahDataDirect().catch(() => ({ source: 'sarah', data: [], success: false })),
        fetchWendyDataDirect().catch(() => ({ source: 'wendy', data: [], success: false }))
    ]);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    
    const combinedData = {
        success: successful.map(r => r.value.source),
        failed: results.filter(r => r.status === 'rejected' || !r.value.success).map(r => r.value?.source || 'unknown'),
        totals: {},
        matches: []
    };
    
    successful.forEach(result => {
        const { source, data, matchCount } = result.value;
        combinedData.totals[source] = matchCount;
        
        // Add to matches based on source
        if (source === 'tom-direct' && data.events) {
            Object.values(data.events).flat().forEach(match => {
                combinedData.matches.push({ ...match, source: 'tom' });
            });
        } else if (Array.isArray(data)) {
            data.forEach(match => {
                combinedData.matches.push({ ...match, source: source.replace('-direct', '') });
            });
        }
    });
    
    combinedData.totalMatches = combinedData.matches.length;
    console.log(`   ✅ Combined direct: ${combinedData.totalMatches} matches`);
    
    return { source: 'combined-direct', data: combinedData, success: true };
}

// 🎯 MAIN FETCH FUNCTION FOR PIPELINE
async function fetchAllSuppliersForPipeline() {
    console.log('🚀 FETCHING ALL SUPPLIERS (WORKER-PRIMARY STRATEGY)');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
        // PRIMARY: Fetch from Worker
        console.log('🎯 PRIMARY: Fetching from Cloudflare Worker...');
        const workerResult = await smartFetchWithWorkerFallback('/api/combined-matches');
        
        if (workerResult.success) {
            const data = workerResult.data;
            
            // Extract counts from worker response
            let tomCount = 0, sarahCount = 0, wendyCount = 0;
            
            if (data.totals) {
                tomCount = data.totals.tom || 0;
                sarahCount = data.totals.sarah || 0;
                wendyCount = data.totals.wendy || 0;
            }
            
            const totalMatches = data.totalMatches || data.matches?.length || 0;
            
            console.log('\n📊 WORKER RESULTS:');
            console.log('=' .repeat(50));
            console.log(`✅ Success: Worker returned ${totalMatches} total matches`);
            console.log(`📦 Tom: ${tomCount} matches`);
            console.log(`📦 Sarah: ${sarahCount} matches`);
            console.log(`📦 Wendy: ${wendyCount} matches`);
            console.log(`⏱️  Duration: ${Date.now() - startTime}ms`);
            
            return {
                tom: { 
                    matches: data.matches?.filter(m => m.source === 'tom') || [],
                    _metadata: { supplier: 'tom', source: 'worker', matchCount: tomCount }
                },
                sarah: { 
                    matches: data.matches?.filter(m => m.source === 'sarah') || [],
                    _metadata: { supplier: 'sarah', source: 'worker', matchCount: sarahCount }
                },
                wendy: { 
                    matches: data.matches?.filter(m => m.source === 'wendy') || [],
                    _metadata: { supplier: 'wendy', source: 'worker', matchCount: wendyCount }
                },
                pipeline_metadata: {
                    fetched_at: new Date().toISOString(),
                    source: 'worker-primary',
                    success: true,
                    total_matches: totalMatches
                }
            };
        }
        
    } catch (error) {
        console.log(`💥 Worker-primary strategy failed: ${error.message}`);
        
        // SECONDARY: Fallback to individual direct APIs
        console.log('\n🔄 SECONDARY: Falling back to direct APIs...');
        
        const results = await Promise.allSettled([
            fetchTomDataDirect().catch(e => ({ source: 'tom', error: e.message, success: false })),
            fetchSarahDataDirect().catch(e => ({ source: 'sarah', error: e.message, success: false })),
            fetchWendyDataDirect().catch(e => ({ source: 'wendy', error: e.message, success: false }))
        ]);
        
        const formatted = {
            tom: { matches: [], _metadata: { supplier: 'tom', source: 'direct-fallback', error: 'Failed' } },
            sarah: { matches: [], _metadata: { supplier: 'sarah', source: 'direct-fallback', error: 'Failed' } },
            wendy: { matches: [], _metadata: { supplier: 'wendy', source: 'direct-fallback', error: 'Failed' } },
            pipeline_metadata: {
                fetched_at: new Date().toISOString(),
                source: 'direct-fallback',
                success: false,
                total_matches: 0
            }
        };
        
        let totalMatches = 0;
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
                const { source, data, matchCount } = result.value;
                const supplier = source.replace('-direct', '');
                
                formatted[supplier] = {
                    matches: Array.isArray(data) ? data : [],
                    _metadata: {
                        supplier: supplier,
                        source: 'direct',
                        matchCount: matchCount,
                        success: true
                    }
                };
                
                totalMatches += matchCount;
            }
        });
        
        formatted.pipeline_metadata.total_matches = totalMatches;
        formatted.pipeline_metadata.success = totalMatches > 0;
        
        console.log(`📊 Direct fallback: ${totalMatches} total matches`);
        
        return formatted;
    }
}

// 🎯 EMERGENCY DATA
function getEmergencyData() {
    console.log('🚨 PROVIDING EMERGENCY DATA');
    
    return {
        tom: { matches: [], _metadata: { supplier: 'tom', emergency: true } },
        sarah: { matches: [], _metadata: { supplier: 'sarah', emergency: true } },
        wendy: { matches: [], _metadata: { supplier: 'wendy', emergency: true } },
        pipeline_metadata: {
            fetched_at: new Date().toISOString(),
            source: 'emergency',
            success: false
        }
    };
}

// 🎯 MAIN EXPORT FOR PIPELINE
async function fetchDataForPipeline() {
    try {
        console.log('=' .repeat(60));
        console.log('SPORTS DATA PIPELINE - WORKER-PRIMARY STRATEGY');
        console.log('=' .repeat(60));
        
        const data = await fetchAllSuppliersForPipeline();
        
        if (data.pipeline_metadata.total_matches === 0) {
            console.log('⚠️ No matches retrieved, using emergency data');
            return getEmergencyData();
        }
        
        return data;
        
    } catch (error) {
        console.log(`💥 Pipeline fetch failed: ${error.message}`);
        return getEmergencyData();
    }
}

// 🎯 SIMPLIFIED UPDATE-SUPPLIERS.JS INTEGRATION
async function updateSuppliersFromWorker() {
    console.log('🔧 UPDATING SUPPLIERS FROM WORKER');
    
    try {
        const data = await fetchDataForPipeline();
        
        // Save individual supplier files
        if (data.tom._metadata.success) {
            fs.writeFileSync('./suppliers/tom-data.json', JSON.stringify(data.tom, null, 2));
            console.log(`✅ Tom: ${data.tom._metadata.matchCount} matches saved`);
        }
        
        if (data.sarah._metadata.success) {
            fs.writeFileSync('./suppliers/sarah-data.json', JSON.stringify(data.sarah, null, 2));
            console.log(`✅ Sarah: ${data.sarah._metadata.matchCount} matches saved`);
        }
        
        if (data.wendy._metadata.success) {
            fs.writeFileSync('./suppliers/wendy-data.json', JSON.stringify(data.wendy, null, 2));
            console.log(`✅ Wendy: ${data.wendy._metadata.matchCount} matches saved`);
        }
        
        return {
            success: true,
            totalMatches: data.pipeline_metadata.total_matches,
            source: data.pipeline_metadata.source
        };
        
    } catch (error) {
        console.log(`❌ Update failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 🚀 EXPORTS
module.exports = {
    fetchDataForPipeline,
    updateSuppliersFromWorker,
    fetchAllSuppliersForPipeline,
    API_CONFIG
};

console.log('✅ Worker-Primary API Module Loaded');
console.log('🎯 Primary: Cloudflare Worker → Secondary: Direct APIs');
