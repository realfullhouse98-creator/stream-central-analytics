// modules/data-fusion.js
export class DataFusion {
    constructor() {
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000;
        this.tvChannelsData = null;
    }

    async loadMatches() {
        console.log('🔄 loadMatches called - checking cache...');
        
        // RE-ENABLE CACHE but with fusion
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('📦 Using cached FUSED data');
            return cachedData;
        }
        
        console.log('🔥 No cache - running fresh fusion...');
        
        try {
            const apiData = await this.tryAllProxies();
            this.cacheData(apiData);
            return apiData;
        } catch (error) {
            console.warn('All API attempts failed:', error);
            return this.useFallbackData();
        }
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

    async tryAllProxies() {
        console.log('🎯 tryAllProxies CALLED - starting API fusion...');
        let topEmbedData = null;
        let streamedData = null;
        
        // Try to get data from BOTH APIs
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
        
        try {
            streamedData = await this.fetchFromStreamed('all');
            console.log('✅ Sarah data loaded:', Object.keys(streamedData.events || {}).length, 'days');
        } catch (error) {
            console.log('❌ Sarah failed, but continuing...');
        }
        
        // FUSE THE DATA: Combine both sources
        return this.fuseAPIData(topEmbedData, streamedData);
    }

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
                sport: 'Other', // This will be classified by main script
                unix_timestamp: Math.floor(match.date / 1000),
                channels: channels,
                streamedMatch: match
            });
        });
        
        return { events };
    }

    // ENHANCED METHOD: Combine data from both APIs with better duplicate detection
    fuseAPIData(tomData, sarahData) {
        console.log('🔗 Fusing Tom & Sarah data with enhanced duplicate detection...');
        
        const fusedData = { events: {} };
        const duplicateTracker = new Set();
        let duplicatesFound = 0;
        let tomMatchesAdded = 0;
        let sarahMatchesAdded = 0;

        // Helper function to generate match fingerprint for duplicate detection
        const generateMatchFingerprint = (match) => {
            if (!match) return '';
            
            // Create multiple fingerprint strategies for better detection
            const strategies = [
                // Strategy 1: Basic team names + timestamp
                `${(match.match || '').toLowerCase().replace(/[^a-z0-9]/g, '')}-${match.unix_timestamp}`,
                
                // Strategy 2: Tournament + simplified teams
                `${(match.tournament || '').toLowerCase().replace(/[^a-z0-9]/g, '')}-${
                    (match.match || '').toLowerCase()
                        .replace(/\s*vs\.?\s*/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                }`
            ];
            
            return strategies.join('|');
        };

        // Add Tom data with enhanced duplicate checking
        if (tomData && tomData.events) {
            Object.entries(tomData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                
                matches.forEach(match => {
                    const fingerprint = generateMatchFingerprint(match);
                    
                    if (!duplicateTracker.has(fingerprint)) {
                        fusedData.events[date].push(match);
                        duplicateTracker.add(fingerprint);
                        tomMatchesAdded++;
                    } else {
                        duplicatesFound++;
                    }
                });
            });
            console.log(`✅ Tom added ${tomMatchesAdded} unique matches`);
        }

        // Add Sarah data with enhanced duplicate checking
        if (sarahData && sarahData.events) {
            Object.entries(sarahData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                
                matches.forEach(match => {
                    const fingerprint = generateMatchFingerprint(match);
                    
                    if (!duplicateTracker.has(fingerprint)) {
                        fusedData.events[date].push(match);
                        duplicateTracker.add(fingerprint);
                        sarahMatchesAdded++;
                    } else {
                        duplicatesFound++;
                    }
                });
            });
            console.log(`✅ Sarah added ${sarahMatchesAdded} unique matches`);
        }

        const totalMatches = Object.values(fusedData.events).flat().length;
        console.log(`🎉 Fusion complete: ${totalMatches} total matches (${duplicatesFound} duplicates filtered)`);
        
        return fusedData;
    }

    useFallbackData() {
        const now = Math.floor(Date.now() / 1000);
        const sampleMatches = {
            events: {
                '2024-12-20': [
                    {
                        match: 'Research Team A - Research Team B',
                        tournament: '9kilos Demo League',
                        sport: 'Football',
                        unix_timestamp: now + 3600,
                        channels: ['https://example.com/stream1', 'https://example.com/stream2']
                    }
                ]
            }
        };
        return sampleMatches;
    }

    async loadTVChannelsData() {
        try {
            const response = await fetch('tv-channels.json');
            this.tvChannelsData = await response.json();
            console.log('✅ TV Channels data loaded:', Object.keys(this.tvChannelsData).length, 'countries');
        } catch (error) {
            console.error('❌ Failed to load TV channels data:', error);
            this.tvChannelsData = {
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
                ]
            };
        }
    }

    getTVChannelsData() {
        return this.tvChannelsData || {};
    }

    backgroundPreload() {
        setTimeout(() => {
            this.preloadSportsData().catch(() => {});
        }, 1000);
    }

    async preloadSportsData() {
        // Simple preload implementation
        try {
            const cachedData = this.getCachedData();
            if (cachedData) {
                return cachedData;
            }
        } catch (error) {
            // Silent fail
        }
    }
}
