// modules/data-fusion.js - COMPLETE VERSION
export class DataFusion {
    constructor() {
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000;
        this.tvChannelsData = null;
    }

    async loadMatches() {
        console.log('🔄 loadMatches called - checking cache...');
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
            const cacheItem = { data: data, timestamp: Date.now() };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Caching failed:', error);
        }
    }

    async tryAllProxies() {
        console.log('🎯 tryAllProxies CALLED - starting API fusion...');
        let topEmbedData = null;
        let streamedData = null;
        
        // Tom API
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
        
        // Sarah API
        try {
            streamedData = await this.fetchFromStreamed('all');
            console.log('✅ Sarah data loaded:', Object.keys(streamedData.events || {}).length, 'days');
        } catch (error) {
            console.log('❌ Sarah failed, but continuing...');
        }
        
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
                sport: 'Other', // Will be classified by main script
                unix_timestamp: Math.floor(match.date / 1000),
                channels: channels,
                streamedMatch: match
            });
        });
        return { events };
    }

    fuseAPIData(tomData, sarahData) {
        console.log('🔗 Fusing Tom & Sarah data...');
        const fusedData = { events: {} };
        const duplicateTracker = new Set();

        // Add Tom data
        if (tomData && tomData.events) {
            Object.entries(tomData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                matches.forEach(match => {
                    const fingerprint = `${match.match}-${match.unix_timestamp}`;
                    if (!duplicateTracker.has(fingerprint)) {
                        fusedData.events[date].push(match);
                        duplicateTracker.add(fingerprint);
                    }
                });
            });
        }

        // Add Sarah data
        if (sarahData && sarahData.events) {
            Object.entries(sarahData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                matches.forEach(match => {
                    const fingerprint = `${match.match}-${match.unix_timestamp}`;
                    if (!duplicateTracker.has(fingerprint)) {
                        fusedData.events[date].push(match);
                        duplicateTracker.add(fingerprint);
                    }
                });
            });
        }

        const totalMatches = Object.values(fusedData.events).flat().length;
        console.log(`🎉 Fusion complete: ${totalMatches} total matches`);
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
                        channels: ['https://example.com/stream1', 'https://example.com/stream2']
                    },
                    {
                        match: 'Demo United - Test City FC',
                        tournament: 'Research Championship',
                        sport: 'Football', 
                        unix_timestamp: now - 1800,
                        channels: ['https://example.com/stream1']
                    }
                ]
            }
        };
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
        try {
            const cachedData = this.getCachedData();
            if (cachedData) {
                return cachedData;
            }
        } catch (error) {
            // Silent fail
        }
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
                    return data;
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }
}
