// modules/data-fusion.js
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
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                topEmbedData = await response.json();
                console.log('✅ Tom data loaded');
            }
        } catch (error) {
            console.log('❌ Tom failed');
        }
        
        // Sarah API
        try {
            streamedData = await this.fetchFromStreamed('all');
            console.log('✅ Sarah data loaded');
        } catch (error) {
            console.log('❌ Sarah failed');
        }
        
        return this.fuseAPIData(topEmbedData, streamedData);
    }

    async fetchFromStreamed(endpoint = 'all') {
        try {
            let url = 'https://streamed.pk/api/matches/all';
            if (endpoint === 'live') url = 'https://streamed.pk/api/matches/live';
            if (endpoint === 'today') url = 'https://streamed.pk/api/matches/all-today';
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('HTTP error');
            const data = await response.json();
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
            if (match.teams?.home && match.teams?.away) {
                teamNames = match.teams.home.name + ' - ' + match.teams.away.name;
            }
            const channels = match.sources.map(source => 
                'https://streamed.pk/api/stream/' + source.source + '/' + source.id
            );
            events[date].push({
                match: teamNames,
                tournament: match.category,
                sport: 'Other',
                unix_timestamp: Math.floor(match.date / 1000),
                channels: channels
            });
        });
        return { events };
    }

    fuseAPIData(tomData, sarahData) {
        const fusedData = { events: {} };
        // Simple fusion - just combine
        if (tomData?.events) Object.assign(fusedData.events, tomData.events);
        if (sarahData?.events) Object.assign(fusedData.events, sarahData.events);
        console.log('🎉 Fusion complete');
        return fusedData;
    }

    useFallbackData() {
        const now = Math.floor(Date.now() / 1000);
        return {
            events: {
                '2024-12-20': [{
                    match: 'Demo Match',
                    tournament: 'Demo League', 
                    sport: 'Football',
                    unix_timestamp: now + 3600,
                    channels: ['https://example.com/stream1']
                }]
            }
        };
    }

    async loadTVChannelsData() {
        try {
            const response = await fetch('tv-channels.json');
            this.tvChannelsData = await response.json();
        } catch (error) {
            this.tvChannelsData = {
                "USA": [{ name: "ESPN", displayName: "ESPN", streamUrl: "https://topembed.pw/channel/ESPN%5BUSA%5D" }]
            };
        }
    }

    getTVChannelsData() {
        return this.tvChannelsData || {};
    }
}
