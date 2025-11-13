// api.js - CORRECTED VERSION
const API_CONFIG = {
    // TOM (Working)
    TOM: {
        BASE_URL: 'https://topembed.pw',
        ENDPOINTS: {
            ALL_MATCHES: '/api.php?format=json'
        }
    }, // ← MISSING COMMA HERE
    
   // CORRECT Sarah API configuration
SARAH: {
    BASE_URL: 'https://streamed.pk',  // ← CHANGED FROM embedsports.top!
    ENDPOINTS: {
        ALL_MATCHES: '/api/matches/all',
        SPORT_MATCHES: '/api/matches/{sport}',
        LIVE_MATCHES: '/api/matches/live',
        TODAY_MATCHES: '/api/matches/all-today'
    }
}, 
    
    // FOOTY (NEW)
    FOOTY: {
        BASE_URL: 'https://watchfooty.live',
        ENDPOINTS: {
            ALL_MATCHES: '/api/v1/matches/football',
            SPORT_MATCHES: '/api/v1/matches/{sport}',
            MATCH_DETAILS: '/api/v1/match/{id}'
        }
    }
};

// Enhanced fetch with better error handling
async function fetchWithFallback(url, options = {}) {
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        url // Direct attempt
    ];
    
    for (const proxyUrl of proxies) {
        try {
            console.log(`🔄 Trying: ${proxyUrl}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(proxyUrl, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log(`✅ Success: ${url}`);
                return await response.json();
            }
        } catch (error) {
            console.warn(`❌ Failed: ${proxyUrl}`, error);
            continue;
        }
    }
    
    throw new Error(`All attempts failed for: ${url}`);
}

// Fixed Sarah API calls
async function fetchSarahMatches(sport = 'all') {
    try {
        const endpoint = API_CONFIG.SARAH.ENDPOINTS.ALL_MATCHES;
        const url = API_CONFIG.SARAH.BASE_URL + endpoint;
        return await fetchWithFallback(url);
    } catch (error) {
        console.warn('Sarah API unavailable:', error);
        return [];
    }
}

// New Footy API calls
async function fetchFootyMatches(sport = 'football') {
    try {
        const endpoint = API_CONFIG.FOOTY.ENDPOINTS.ALL_MATCHES;
        const url = API_CONFIG.FOOTY.BASE_URL + endpoint;
        return await fetchWithFallback(url);
    } catch (error) {
        console.warn('Footy API unavailable:', error);
        return [];
    }
}

// Enhanced stream detection for Footy
function extractFootyStreams(footyMatch) {
    if (!footyMatch.streams || footyMatch.streams.length === 0) {
        return [];
    }
    
    return footyMatch.streams.map(stream => ({
        url: stream.url,
        quality: stream.quality || 'hd',
        source: 'footy',
        language: stream.language || 'en'
    }));
}
