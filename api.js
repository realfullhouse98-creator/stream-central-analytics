// api.js - PROXY-FIRST WITH DIRECT API FALLBACK
const API_CONFIG = {
    // 🎯 UNIFIED PROXY (Primary)
    UNIFIED_PROXY: {
        BASE_URL: 'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev',
        ENDPOINTS: {
            COMBINED_MATCHES: '/api/combined-matches',
            TOM_ALL: '/api/tom/all',
            SARAH_ALL: '/api/sarah/all', 
            WENDY_ALL: '/api/wendy/all'
        }
    },
    
    // 🛡️ DIRECT APIS (Fallback - No CORS issues through proxy, but backup)
    DIRECT_APIS: {
        TOM: {
            BASE_URL: 'https://topembed.pw',
            ENDPOINTS: {
                ALL_MATCHES: '/api.php?format=json'
            }
        },
        SARAH: {
            BASE_URL: 'https://streamed.pk',
            ENDPOINTS: {
                ALL_MATCHES: '/api/matches/all'
            }
        },
        WENDY: {
            BASE_URL: 'https://watchfooty.st',
            ENDPOINTS: {
                SPORTS: '/api/v1/sports',
                SPORT_MATCHES: '/api/v1/matches/{sport}'
            }
        }
    }
};

// 🎯 PROXY-FIRSTR STRATEGY
async function fetchUnifiedMatches() {
    console.log('🚀 PRIMARY: Trying Unified Proxy...');
    
    try {
        const url = API_CONFIG.UNIFIED_PROXY.BASE_URL + API_CONFIG.UNIFIED_PROXY.ENDPOINTS.COMBINED_MATCHES;
        
        const response = await fetch(url, {
            signal: AbortSignal.timeout(8000), // 8 second timeout
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        console.log('✅ PROXY SUCCESS!', {
            totalMatches: data.totalMatches,
            successfulAPIs: data.success,
            failedAPIs: data.failed
        });
        
        return data;
        
    } catch (error) {
        console.warn('❌ Proxy failed, falling back to direct APIs:', error.message);
        return await fetchDirectAPIsFallback();
    }
}

// 🛡️ DIRECT API FALLBACK (When proxy fails)
async function fetchDirectAPIsFallback() {
    console.log('🔄 FALLBACK: Trying direct APIs...');
    
    const results = await Promise.allSettled([
        fetchTomDirect().catch(e => ({ error: e.message, source: 'tom' })),
        fetchSarahDirect().catch(e => ({ error: e.message, source: 'sarah' })),
        fetchWendyDirect().catch(e => ({ error: e.message, source: 'wendy' }))
    ]);

    const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error);
    const failed = results.filter(r => r.status === 'rejected' || r.value.error);
    
    console.log(`🛡️ Direct APIs: ${successful.length} successful, ${failed.length} failed`);
    
    if (successful.length === 0) {
        console.log('🚨 All direct APIs failed, using emergency data');
        return getEmergencyFallbackData();
    }
    
    // Combine successful direct API data
    return combineDirectAPIData(successful.map(r => r.value));
}

// 🔧 DIRECT API FETCHERS (Using CORS proxies)
async function fetchTomDirect() {
    try {
        const url = API_CONFIG.DIRECT_APIS.TOM.BASE_URL + API_CONFIG.DIRECT_APIS.TOM.ENDPOINTS.ALL_MATCHES;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        return { source: 'tom', data: data, count: data?.events ? Object.values(data.events).flat().length : 0 };
        
    } catch (error) {
        throw new Error(`Tom direct failed: ${error.message}`);
    }
}

async function fetchSarahDirect() {
    try {
        const url = API_CONFIG.DIRECT_APIS.SARAH.BASE_URL + API_CONFIG.DIRECT_APIS.SARAH.ENDPOINTS.ALL_MATCHES;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        return { source: 'sarah', data: data, count: Array.isArray(data) ? data.length : 0 };
        
    } catch (error) {
        throw new Error(`Sarah direct failed: ${error.message}`);
    }
}

async function fetchWendyDirect() {
    try {
        // Get sports first, then matches for each sport
        const sportsUrl = API_CONFIG.DIRECT_APIS.WENDY.BASE_URL + API_CONFIG.DIRECT_APIS.WENDY.ENDPOINTS.SPORTS;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(sportsUrl)}`;
        
        const sportsResponse = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
        if (!sportsResponse.ok) throw new Error('Failed to fetch sports');
        
        const sports = await sportsResponse.json();
        const allMatches = [];
        
        // Fetch first 3 sports only (for performance)
        const limitedSports = sports.slice(0, 3);
        
        for (const sport of limitedSports) {
            try {
                const matchesUrl = API_CONFIG.DIRECT_APIS.WENDY.BASE_URL + 
                    API_CONFIG.DIRECT_APIS.WENDY.ENDPOINTS.SPORT_MATCHES.replace('{sport}', sport.name);
                const matchesProxyUrl = `https://corsproxy.io/?${encodeURIComponent(matchesUrl)}`;
                
                const matchesResponse = await fetch(matchesProxyUrl, { signal: AbortSignal.timeout(3000) });
                if (matchesResponse.ok) {
                    const matches = await matchesResponse.json();
                    matches.forEach(match => {
                        match.sportCategory = sport.name;
                        match.source = 'wendy';
                    });
                    allMatches.push(...matches);
                }
            } catch (e) {
                console.warn(`Wendy ${sport.name} failed:`, e.message);
            }
        }
        
        return { source: 'wendy', data: allMatches, count: allMatches.length };
        
    } catch (error) {
        throw new Error(`Wendy direct failed: ${error.message}`);
    }
}

// 🎯 COMBINE DIRECT API DATA
function combineDirectAPIData(apiResults) {
    const successful = apiResults.filter(r => !r.error);
    const failed = apiResults.filter(r => r.error).map(r => r.source);
    
    const combinedData = {
        success: successful.map(r => r.source),
        failed: failed,
        totals: {},
        matches: [],
        source: 'direct-fallback' // Mark as direct API fallback
    };

    successful.forEach(result => {
        const { source, data, count } = result;
        combinedData.totals[source] = count;
        
        const normalized = normalizeDirectAPIData(data, source);
        combinedData.matches.push(...normalized);
    });

    combinedData.totalMatches = combinedData.matches.length;
    console.log(`🛡️ Direct Fallback: ${combinedData.totalMatches} matches from ${successful.length} APIs`);
    
    return combinedData;
}

// 🔄 NORMALIZE DIRECT API DATA
function normalizeDirectAPIData(data, source) {
    if (!data) return [];
    
    try {
        switch(source) {
            case 'tom':
                return Object.values(data.events || {}).flat().map(match => ({
                    ...match,
                    source: 'tom',
                    normalized: true,
                    id: match.id || `tom-${Math.random().toString(36).substr(2, 9)}`
                }));
                
            case 'sarah':
                return (Array.isArray(data) ? data : []).map(match => ({
                    ...match,
                    source: 'sarah', 
                    normalized: true,
                    id: match.id || `sarah-${Math.random().toString(36).substr(2, 9)}`
                }));
                
            case 'wendy':
                return (Array.isArray(data) ? data : []).map(match => ({
                    ...match,
                    source: 'wendy',
                    normalized: true,
                    id: match.id || `wendy-${Math.random().toString(36).substr(2, 9)}`,
                    match: match.title || `${match.homeTeam} - ${match.awayTeam}`,
                    tournament: match.league || 'Sports'
                }));
                
            default:
                return [];
        }
    } catch (error) {
        console.error(`❌ Failed to normalize ${source} direct data:`, error);
        return [];
    }
}

// 🆘 EMERGENCY FALLBACK
function getEmergencyFallbackData() {
    console.log('🚨 Using emergency fallback data');
    const now = Math.floor(Date.now() / 1000);
    
    return {
        success: ['emergency'],
        failed: ['proxy', 'tom', 'sarah', 'wendy'],
        totals: { emergency: 3 },
        totalMatches: 3,
        source: 'emergency',
        matches: [
            {
                id: 'emergency-1',
                match: 'Research Team A - Research Team B',
                tournament: '9kilos Demo League',
                sport: 'Football',
                unix_timestamp: now + 3600,
                channels: [],
                source: 'emergency',
                normalized: true,
                time: '19:00',
                date: new Date().toISOString().split('T')[0]
            },
            {
                id: 'emergency-2', 
                match: 'Demo United - Test City FC',
                tournament: 'Research Championship',
                sport: 'Football',
                unix_timestamp: now - 1800,
                channels: [],
                source: 'emergency',
                normalized: true,
                time: '15:00',
                date: new Date().toISOString().split('T')[0],
                isLive: true
            },
            {
                id: 'emergency-3',
                match: 'Backup Sports - Emergency Stream',
                tournament: 'Fallback Tournament',
                sport: 'Basketball', 
                unix_timestamp: now + 7200,
                channels: [],
                source: 'emergency',
                normalized: true,
                time: '21:00',
                date: new Date().toISOString().split('T')[0]
            }
        ]
    };
}

// 🎯 ENHANCED DATA PROCESSING
function processUnifiedData(proxyData) {
    if (!proxyData || !proxyData.matches) {
        console.warn('❌ No matches in data, using emergency');
        return getEmergencyFallbackData().matches;
    }
    
    console.log('🔄 Processing', proxyData.matches.length, 'matches from:', proxyData.source || 'proxy');
    
    return proxyData.matches.map(match => {
        return {
            id: match.id || `processed-${Math.random().toString(36).substr(2, 9)}`,
            date: match.date || new Date().toISOString().split('T')[0],
            time: match.time || 'TBD',
            teams: match.match || match.title || `${match.homeTeam} - ${match.awayTeam}`,
            league: match.tournament || match.league || 'Sports',
            isLive: match.status === 'live' || match.isLive === true,
            sport: match.sport || 'Football',
            unixTimestamp: match.unix_timestamp || Math.floor(Date.now() / 1000),
            
            // Stream data
            channels: match.channels || [],
            stream_sources: match.stream_sources || {},
            streamUrl: match.streamUrl || (match.channels && match.channels[0]) || null,
            
            // Source tracking
            source: match.source || 'unknown',
            normalized: match.normalized || false,
            dataSource: proxyData.source || 'proxy' // Track where data came from
        };
    });
}

// 🎯 SMART STREAM SOURCES (Unchanged - works with any data source)
async function getAllSourcesForMatch(match) {
    const sources = [];
    let sourceCounters = { tom: 0, sarah: 0, wendy: 0 };

    if (match.stream_sources) {
        ['tom', 'sarah', 'wendy'].forEach(source => {
            if (match.stream_sources[source]) {
                match.stream_sources[source].forEach((url, index) => {
                    sources.push({
                        value: `${source}-${index}`,
                        label: `<span class="source-option"><span class="circle-icon ${source}-icon"></span> ${source} ${index + 1}</span>`,
                        url: url,
                        source: source
                    });
                    sourceCounters[source]++;
                });
            }
        });
    } else if (match.channels && match.channels.length > 0) {
        const uniqueChannels = [...new Set(match.channels)];
        
        uniqueChannels.forEach(channel => {
            let source = null;
            
            if (channel.includes('embedsports.top') || channel.includes('streamed.pk')) source = 'sarah';
            else if (channel.includes('topembed.pw')) source = 'tom';
            else if (channel.includes('watchfooty.st')) source = 'wendy';
            
            if (source) {
                sources.push({
                    value: `${source}-${sourceCounters[source]}`,
                    label: `<span class="source-option"><span class="circle-icon ${source}-icon"></span> ${source} ${sourceCounters[source] + 1}</span>`,
                    url: channel,
                    source: source
                });
                sourceCounters[source]++;
            }
        });
    }

    console.log('📊 Sources found:', sourceCounters);
    return sources;
}

// 🎯 DEBUG UTILITIES
async function debugDataSources() {
    console.log('🔍 9kilos Data Source Debug:');
    
    // Test proxy
    try {
        const proxyTest = await fetch(API_CONFIG.UNIFIED_PROXY.BASE_URL + '/api/tom/all', { signal: AbortSignal.timeout(3000) });
        console.log('✅ Proxy Status:', proxyTest.status, proxyTest.ok ? 'OK' : 'FAILED');
    } catch (e) {
        console.log('❌ Proxy Test Failed:', e.message);
    }
    
    // Test direct APIs
    const directResults = await Promise.allSettled([
        fetchTomDirect().then(r => `✅ Tom: ${r.count} matches`).catch(e => `❌ Tom: ${e.message}`),
        fetchSarahDirect().then(r => `✅ Sarah: ${r.count} matches`).catch(e => `❌ Sarah: ${e.message}`),
        fetchWendyDirect().then(r => `✅ Wendy: ${r.count} matches`).catch(e => `❌ Wendy: ${e.message}`)
    ]);
    
    directResults.forEach((result, index) => {
        const sources = ['Tom', 'Sarah', 'Wendy'];
        console.log(`🛡️ ${sources[index]} Direct:`, result.status === 'fulfilled' ? result.value : result.reason);
    });
}

// 🚀 EXPORT FOR GLOBAL USE
window.UnifiedAPI = {
    fetchUnifiedMatches,
    processUnifiedData,
    getAllSourcesForMatch,
    debugDataSources,
    config: API_CONFIG
};

console.log('🚀 9kilos Enhanced API Loaded!');
console.log('🎯 Strategy: Proxy-First → Direct API Fallback → Emergency Data');
