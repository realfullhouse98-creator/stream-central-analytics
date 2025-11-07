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
        
        // Try Streamed API - USE WORKING VERSION
        try {
            streamedData = await this.fetchFromStreamed('all');
            console.log('✅ Sarah data loaded:', Object.keys(streamedData.events || {}).length, 'days');
        } catch (error) {
            console.log('❌ Sarah failed, but continuing...');
        }
        
        // Try Emily API
        try {
            emilyData = await this.fetchFromEmily();
            if (emilyData) {
                console.log('✅ Emily data loaded:', Object.keys(emilyData.events || {}).length, 'days');
            }
        } catch (error) {
            console.log('❌ Emily failed, but continuing...');
        }
        
        // Fuse the data with sports classification
        return this.fuseAPIData(topEmbedData, streamedData, emilyData);
    }

    // STREAMED API - RESTORE WORKING VERSION
    async fetchFromStreamed(endpoint = 'all') {
        try {
            let url;
            if (endpoint === 'live') {
                url = 'https://streamed.pk/api/matches/live';
            } else if (endpoint === 'today') {
                url = 'https://streamed.pk/api/matches/all-today';
            } else {
                url = 'https://streamed.pk/api/matches/all';
            }
            
            console.log('🔄 Fetching from Streamed:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error('HTTP error');
            
            const data = await response.json();
            console.log('✅ Streamed data received:', data.length, 'matches');
            return this.normalizeStreamedData(data);
            
        } catch (error) {
            console.warn('❌ Streamed failed:', error);
            throw error;
        }
    }

    // EMILY API - ADD PROPERLY
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
            if (!response.ok) return null;
            
            const data = await response.json();
            if (!data.success) return null;
            
            console.log('✅ Emily raw data:', data.streams.length, 'categories');
            
            const normalizedData = this.normalizeEmilyData(data);
            this.cacheEmilyData(normalizedData);
            
            return normalizedData;
            
        } catch (error) {
            console.warn('❌ Emily API failed:', error.message);
            return null;
        }
    }

    // STREAMED DATA NORMALIZATION - RESTORE WORKING VERSION
    normalizeStreamedData(streamedData) {
        const events = {};
        
        streamedData.forEach(match => {
            const date = new Date(match.date).toISOString().split('T')[0];
            
            if (!events[date]) events[date] = [];
            
            let teamNames = match.title;
            if (match.teams && match.teams.home && match.teams.away) {
                teamNames = match.teams.home.name + ' - ' + match.teams.away.name;
            }
            
            const channels = match.sources.map(source => 
                'https://streamed.pk/api/stream/' + source.source + '/' + source.id
            );
            
            events[date].push({
                match: teamNames,
                tournament: match.category,
                sport: match.category, // Will be classified during fusion
                unix_timestamp: Math.floor(match.date / 1000),
                channels: channels,
                streamedMatch: match,
                source: 'streamed' // Add source tracking
            });
        });
        
        return { events };
    }

    // EMILY DATA NORMALIZATION - ADD NEW
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
                    poster: stream.poster
                };
                
                events[date].push(matchData);
            });
        });
        
        console.log('✅ Emily normalized:', Object.keys(events).length, 'days with streams');
        return { events };
    }

    // EMILY SPORT CLASSIFICATION
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

    // EMILY CACHE METHODS
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

    // FUSION METHOD - UPDATE TO INCLUDE EMILY
    fuseAPIData(tomData, sarahData, emilyData) {
        console.log('🔗 Fusing Tom, Sarah & Emily data with sports classification...');
        
        const fusedData = { events: {} };
        
        // Add all Tom data with sports classification
        if (tomData && tomData.events) {
            Object.entries(tomData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                
                const classifiedMatches = matches.map(match => ({
                    ...match,
                    sport: this.sportsClassifier.classifySport(match),
                    source: match.source || 'topembed'
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
                            sport: this.sportsClassifier.classifySport(match),
                            source: 'streamed'
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
                const source = match.source || 'topembed';
                sources[source] = (sources[source] || 0) + 1;
            });
        });
        console.log('📊 Source breakdown:', sources);
        
        return fusedData;
    }

    useFallbackData() {
        const now = Math.floor(Date.now() / 1000);
        return {
            events: {
                '2024-12-20': [
                    {
                        match: 'Research Team A - Research Team B',
                        tournament: '9kilos Demo League',
                        sport: 'Football',
                        unix_timestamp: now + 3600,
                        channels: ['https://example.com/stream1', 'https://example.com/stream2'],
                        source: 'fallback'
                    }
                ]
            }
        };
    }

    getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > this.cacheTimeout;
            
            return isExpired ? null : data;
        } catch (error) {
            return null;
        }
    }

    cacheData(data) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Caching failed:', error);
        }
    }

    async loadTVChannelsData() {
        try {
            const response = await fetch('tv-channels.json');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to load TV channels data:', error);
            return this.getDefaultTVChannels();
        }
    }

    getDefaultTVChannels() {
        return {
            "South Africa": [
                {
                    name: "SuperSportRugby",
                    displayName: "SuperSport Rugby",
                    country: "South Africa",
                    streamUrl: "https://topembed.pw/channel/SuperSportRugby%5BSouthAfrica%5D",
                    category: "Rugby",
                    description: "Live rugby matches, highlights, and analysis"
                }
            ],
            "USA": [
                {
                    name: "ESPN",
                    displayName: "ESPN",
                    country: "USA",
                    streamUrl: "https://topembed.pw/channel/ESPN%5BUSA%5D", 
                    category: "Multi-sport",
                    description: "Worldwide sports leader"
                }
            ],
            "UK": [
                {
                    name: "SkySportsMain",
                    displayName: "Sky Sports Main Event",
                    country: "UK",
                    streamUrl: "https://topembed.pw/channel/SkySportsMain%5BUK%5D",
                    category: "Multi-sport",
                    description: "Premier sports coverage"
                }
            ]
        };
    }

    async tryFastProxies() {
        const targetUrl = 'https://topembed.pw/api.php?format=json';
        
        const fastProxies = [
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];
        
        for (const proxyUrl of fastProxies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('🚀 Fast data loaded from:', proxyUrl);
                    return data;
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFusion;
} else {
    window.DataFusion = DataFusion;
}
