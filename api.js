// api.js - ULTRA SIMPLIFIED UNIFIED PROXY VERSION
const API_CONFIG = {
    // 🎯 SINGLE UNIFIED PROXY - No more multiple API management!
    UNIFIED_PROXY: {
        BASE_URL: 'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev',
        ENDPOINTS: {
            // 🏆 MAIN ENDPOINT - Gets everything in one call!
            COMBINED_MATCHES: '/api/combined-matches',
            
            // 🔧 INDIVIDUAL APIS (for fallback/debugging)
            TOM_ALL: '/api/tom/all',
            SARAH_ALL: '/api/sarah/all', 
            WENDY_ALL: '/api/wendy/all',
            ALL_SPORTS: '/api/all-sports',
            
            // ⚡ PERFORMANCE ENDPOINTS
            LIVE_MATCHES: '/api/combined-matches?live=true', // You can add this filter later
            TODAY_MATCHES: '/api/combined-matches?today=true' // Future enhancement
        }
    }
};

// 🎯 SINGLE FUNCTION TO RULE THEM ALL!
async function fetchUnifiedMatches() {
    try {
        const url = API_CONFIG.UNIFIED_PROXY.BASE_URL + API_CONFIG.UNIFIED_PROXY.ENDPOINTS.COMBINED_MATCHES;
        console.log('🚀 Fetching unified matches from:', url);
        
        const response = await fetch(url, {
            // 🛡️ Better error handling
            signal: AbortSignal.timeout(10000), // 10 second timeout
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        console.log('✅ UNIFIED PROXY SUCCESS!', {
            totalMatches: data.totalMatches,
            successfulAPIs: data.success,
            failedAPIs: data.failed,
            matchCounts: data.totals
        });
        
        return data;
        
    } catch (error) {
        console.warn('❌ Unified proxy unavailable:', error.message);
        return getEmergencyFallbackData();
    }
}

// 🆘 EMERGENCY FALLBACK (when everything fails)
function getEmergencyFallbackData() {
    console.log('🚨 Using emergency fallback data');
    return {
        success: ['emergency'],
        failed: ['tom', 'sarah', 'wendy'],
        totals: { emergency: 2 },
        totalMatches: 2,
        matches: [
            {
                match: 'Research Team A - Research Team B',
                tournament: '9kilos Demo League',
                sport: 'Football',
                unix_timestamp: Math.floor(Date.now() / 1000) + 3600,
                channels: [],
                source: 'emergency',
                normalized: true
            },
            {
                match: 'Demo United - Test City FC',
                tournament: 'Research Championship', 
                sport: 'Football',
                unix_timestamp: Math.floor(Date.now() / 1000) - 1800,
                channels: [],
                source: 'emergency',
                normalized: true
            }
        ]
    };
}

// 🎯 INDIVIDUAL API FETCHES (for debugging or specific needs)
async function fetchIndividualAPI(apiName) {
    try {
        const endpointMap = {
            'tom': API_CONFIG.UNIFIED_PROXY.ENDPOINTS.TOM_ALL,
            'sarah': API_CONFIG.UNIFIED_PROXY.ENDPOINTS.SARAH_ALL,
            'wendy': API_CONFIG.UNIFIED_PROXY.ENDPOINTS.WENDY_ALL
        };
        
        const url = API_CONFIG.UNIFIED_PROXY.BASE_URL + endpointMap[apiName];
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log(`✅ ${apiName.toUpperCase()} individual:`, data);
        return data;
        
    } catch (error) {
        console.warn(`❌ ${apiName} individual failed:`, error);
        return null;
    }
}

// 🎯 SMART STREAM SOURCE DETECTION (Simplified!)
async function getAllSourcesForMatch(match) {
    console.log('🔍 Getting sources for match:', match.teams);
    
    const sources = [];
    let sourceCounters = { tom: 0, sarah: 0, wendy: 0 };

    // 🎯 METHOD 1: Use stream_sources if available
    if (match.stream_sources) {
        console.log('✅ Using stream_sources classification');
        
        ['tom', 'sarah', 'wendy'].forEach(source => {
            if (match.stream_sources[source] && match.stream_sources[source].length > 0) {
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
    }
    // 🎯 METHOD 2: Auto-detect from channels
    else if (match.channels && match.channels.length > 0) {
        console.log('🔄 Auto-detecting sources from channels');
        
        const uniqueChannels = [...new Set(match.channels)];
        
        uniqueChannels.forEach(channel => {
            let source = null;
            
            if (channel.includes('embedsports.top') || channel.includes('streamed.pk')) {
                source = 'sarah';
            } else if (channel.includes('topembed.pw')) {
                source = 'tom';
            } else if (channel.includes('watchfooty.st')) {
                source = 'wendy';
            }
            
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

// 🎯 ENHANCED DATA PROCESSING
function processUnifiedData(proxyData) {
    if (!proxyData || !proxyData.matches) {
        console.warn('❌ No matches in unified data');
        return [];
    }
    
    console.log('🔄 Processing', proxyData.matches.length, 'matches from unified proxy');
    
    return proxyData.matches.map(match => {
        // Ensure consistent structure
        return {
            id: match.id || `unified-${Math.random().toString(36).substr(2, 9)}`,
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
            normalized: match.normalized || false
        };
    });
}

// 🎯 DEBUG UTILITIES
function debugProxyStatus() {
    console.log('🔍 9kilos Proxy Debug Info:');
    console.log('- Base URL:', API_CONFIG.UNIFIED_PROXY.BASE_URL);
    console.log('- Available Endpoints:', Object.keys(API_CONFIG.UNIFIED_PROXY.ENDPOINTS));
    
    // Test connection
    fetchUnifiedMatches().then(data => {
        console.log('✅ Proxy Connection Test:', {
            success: data.success,
            totalMatches: data.totalMatches,
            failedAPIs: data.failed
        });
    }).catch(error => {
        console.log('❌ Proxy Connection Failed:', error.message);
    });
}

// 🎯 EXPORT FOR GLOBAL USE
window.UnifiedAPI = {
    fetchUnifiedMatches,
    fetchIndividualAPI,
    getAllSourcesForMatch,
    processUnifiedData,
    debugProxyStatus,
    getEmergencyFallbackData
};

console.log('🚀 9kilos Unified API Loaded!');
console.log('📡 Using Proxy:', API_CONFIG.UNIFIED_PROXY.BASE_URL);
