// Data Fusion Module - Combines data from multiple APIs
class DataFusion {
    constructor() {
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.isLoading = false;
        this.sportsClassifier = new SportsClassifier(); // Add classifier instance
        
        // Emily API specific cache
        this.emilyCacheKey = '9kilos-emily-cache';
        this.emilyCacheTimeout = 60 * 1000; // 1 minute (respect their polling advice)
    }

    async loadMatches() {
        console.log('🔄 DataFusion: Loading matches...');
        
        // Try cache first
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('📦 Using cached data');
            return cachedData;
        }
        
        try {
            const apiData = await this.tryAllProxies();
            this.cacheData(apiData);
            return apiData;
        } catch (error) {
            console.warn('All API attempts failed:', error);
            return this.useFallbackData();
        }
    }

    async tryAllProxies() {
        console.log('🎯 DataFusion: Starting API fusion...');
        let topEmbedData = null;
        let streamedData = null;
        let emilyData = null;
        
        // Try TopEmbed API
        try {
            const topEmbedUrl = 'https://topembed.pw/api.php?format=json';
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(topEmbedUrl);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                topEmbedData = await response.json();
                console.log('✅ Tom data loaded:', Object.keys(topEmbedData.events || {}).length, 'days');
            }
        } catch (error) {
            console.log('❌ Tom failed, but continuing...');
        }
        
        // Try Streamed API
        try {
            streamedData = await this.fetchFromStreamed('all');
            console.log('✅ Sarah data loaded:', Object.keys(streamedData.events || {}).length, 'days');
        } catch (error) {
            console.log('❌ Sarah failed, but continuing...');
        }
        
        // Try Emily API
        try {
            emilyData = await this.fetchFromEmily();
            console.log('✅ Emily data loaded:', Object.keys(emilyData.events || {}).length, 'days');
        } catch (error) {
            console.log('❌ Emily failed, but continuing...');
        }
        
        // Fuse the data with sports classification
        return this.fuseAPIData(topEmbedData, streamedData, emilyData);
    }

    // ADD EMILY API METHOD
    async fetchFromEmily() {
        try {
            // Check cache first
            const cachedEmilyData = this.getEmilyCachedData();
            if (cachedEmilyData) {
                console.log('📦 Using cached Emily data');
                return cachedEmilyData;
            }
            
            const url = 'https://embednow.top/api/streams';
            console.log('🔄 Fetching from Emily:', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (!data.success) throw new Error('API returned success: false');
            
            console.log('✅ Emily raw data:', data.streams.length, 'categories');
            
            const normalizedData = this.normalizeEmilyData(data);
            this.cacheEmilyData(normalizedData);
            
            return normalizedData;
            
        } catch (error) {
            console.warn('❌ Emily API failed:', error.message);
            throw error;
        }
    }

    // ADD EMILY DATA NORMALIZATION
    normalizeEmilyData(emilyData) {
        const events = {};
        
        emilyData.streams.forEach(category => {
            category.streams.forEach(stream => {
                // Only include streams with iframe embeds
                if (!stream.iframe) return;
                
                const date = new Date(stream.starts_at * 1000).toISOString().split('T')[0];
                if (!events[date]) events[date] = [];
                
                const matchData = {
                    match: stream.name,
                    tournament: `${category.category} - ${stream.tag}`,
                    sport: this.classifyEmilySport(category.category),
                    unix_timestamp: stream.starts_at,
                    channels: [stream.iframe],
                    isLive: stream.always_live === 1 || this.isEmilyStreamLive(stream),
                    source: 'emily',
                    streamId: stream.id,
                    poster: stream.poster,
                    uri_name: stream.uri_name,
                    allowPastStreams: stream.allowpaststreams === 1
                };
                
                events[date].push(matchData);
            });
        });
        
        console.log('✅ Emily normalized:', Object.keys(events).length, 'days with streams');
        return { events };
    }

    // ADD EMILY SPORT CLASSIFICATION
    classifyEmilySport(category) {
        const sportMap = {
            'Basketball': 'basketball',
            'Football': 'football',
            'Combat Sports': 'mma',
            'Baseball': 'baseball', 
            'Hockey': 'hockey',
            'Tennis': 'tennis',
            'Rugby': 'rugby',
            'Cricket': 'cricket',
            'Motorsports': 'motorsports',
            'Soccer': 'football',
            'American Football': 'american-football',
            'Boxing': 'boxing',
            'MMA': 'mma',
            'UFC': 'mma',
            'Golf': 'golf'
        };
        return sportMap[category] || 'other';
    }

    isEmilyStreamLive(stream) {
        const now = Math.floor(Date.now() / 1000);
        return stream.starts_at <= now && stream.ends_at >= now;
    }

    // ADD EMILY CACHE METHODS
    getEmilyCachedData() {
        try {
            const cached = localStorage.getItem(this.emilyCacheKey);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > this.emilyCacheTimeout;
            
            return isExpired ? null : data;
        } catch (error) {
            return null;
        }
    }

    cacheEmilyData(data) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.emilyCacheKey, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Emily caching failed:', error);
        }
    }

    // UPDATE FUSION METHOD TO INCLUDE EMILY
    fuseAPIData(tomData, sarahData, emilyData) {
        console.log('🔗 Fusing Tom, Sarah & Emily data with sports classification...');
        
        const fusedData = { events: {} };
        
        // Add all Tom data with sports classification
        if (tomData && tomData.events) {
            Object.entries(tomData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                
                const classifiedMatches = matches.map(match => ({
                    ...match,
                    sport: this.sportsClassifier.classifySport(match)
                }));
                
                fusedData.events[date].push(...classifiedMatches);
                console.log(`📅 Tom added ${classifiedMatches.length} matches for ${date}`);
            });
        }
        
        // Add all Sarah data with sports classification (avoid duplicates)
        if (sarahData && sarahData.events) {
            Object.entries(sarahData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                
                const existingTitles = new Set(fusedData.events[date].map(m => m.match));
                
                matches.forEach(match => {
                    if (!existingTitles.has(match.match)) {
                        const classifiedMatch = {
                            ...match,
                            sport: this.sportsClassifier.classifySport(match)
                        };
                        fusedData.events[date].push(classifiedMatch);
                    }
                });
                
                console.log(`📅 Sarah added ${matches.length} matches for ${date}`);
            });
        }
        
        // ADD EMILY DATA FUSION (avoid duplicates)
        if (emilyData && emilyData.events) {
            Object.entries(emilyData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                
                const existingTitles = new Set(fusedData.events[date].map(m => m.match));
                
                matches.forEach(match => {
                    if (!existingTitles.has(match.match)) {
                        fusedData.events[date].push(match);
                    }
                });
                
                console.log(`📅 Emily added ${matches.length} matches for ${date}`);
            });
        }
        
        const totalMatches = Object.values(fusedData.events).flat().length;
        console.log(`🎉 Fusion complete: ${totalMatches} total matches from 3 APIs`);
        
        // Log source breakdown
        const sources = {};
        Object.values(fusedData.events).forEach(matches => {
            matches.forEach(match => {
                const source = match.source || 'tom';
                sources[source] = (sources[source] || 0) + 1;
            });
        });
        console.log('📊 Source breakdown:', sources);
        
        return fusedData;
    }

    // KEEP EXISTING METHODS BELOW (unchanged)
    async fetchFromStreamed(endpoint = 'all') {
        // ... existing streamed code remains the same ...
    }

    normalizeStreamedData(streamedData) {
        // ... existing streamed normalization remains the same ...
    }

    useFallbackData() {
        // ... existing fallback code remains the same ...
    }

    getCachedData() {
        // ... existing cache code remains the same ...
    }

    cacheData(data) {
        // ... existing cache code remains the same ...
    }

    async loadTVChannelsData() {
        // ... existing TV channels code remains the same ...
    }

    getDefaultTVChannels() {
        // ... existing default TV channels code remains the same ...
    }

    async tryFastProxies() {
        // ... existing fast proxies code remains the same ...
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFusion;
} else {
    window.DataFusion = DataFusion;
}
