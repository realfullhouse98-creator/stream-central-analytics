// 9kilo Stream - MULTI-SOURCE VERSION WITH TOM & SARAH
// 🚨 IMPORTANT: SIMPLIFIED SOURCE HANDLING - SCALABLE FOR HUNDREDS OF MATCHES
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.matchPolls = new Map();
        this.currentStreams = new Map();
        
        // TV Channels State
        this.currentCountry = '';
        this.currentTVChannel = null;
        this.tvChannelsData = null;
        
        // Multi-source configuration
        this.sources = {
            'tom': { name: "Tom's Stream", baseUrl: "https://topembed.pw" },
            'sarah': { name: "Sarah's Stream", baseUrl: "https://streamed.pk" }
        };
        
        // Sport normalization (minimal - only fix critical duplicates)
        this.sportNormalization = {
            "American Foot": "American Football",
            "Motosports": "Motor Sports",
            "Moto - sports": "Motor Sports"
        };
        
        // Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000;
        
        // Caching
        this.preloadedSports = null;
        this.lastDataUpdate = null;
        
        // Filter state
        this.showLiveOnly = false;
        
        // DOM ready state
        this.isDOMReady = false;
        
        console.log('🚀 MatchScheduler initialized with Multi-Source Support!');
    }
    
    async init() {
        await this.waitForDOMReady();
        this.setupGlobalErrorHandling();
        this.setupEventListeners();
        this.showMainMenu();
        this.registerServiceWorker();
        
        // Load TV channels data
        await this.loadTVChannelsData();
        
        // Start preloading in background
        this.backgroundPreload();
    }

    // ==================== MULTI-SOURCE DATA LOADING ====================
    async loadMatches() {
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('📦 Using cached multi-source data');
            this.organizeMatches(cachedData);
            return;
        }
        
        try {
            // Load data from both sources in parallel
            const [tomData, sarahData] = await Promise.allSettled([
                this.loadSourceData('tom'),
                this.loadSourceData('sarah')
            ]);
            
            const combinedData = this.combineSourceData(
                tomData.status === 'fulfilled' ? tomData.value : null,
                sarahData.status === 'fulfilled' ? sarahData.value : null
            );
            
            this.organizeMatches(combinedData);
            this.cacheData(combinedData);
            
        } catch (error) {
            console.warn('Multi-source loading failed:', error);
            this.useFallbackData();
        }
    }

    async loadSourceData(source) {
        const sourceConfig = this.sources[source];
        if (!sourceConfig) throw new Error(`Unknown source: ${source}`);
        
        const targetUrl = `${sourceConfig.baseUrl}/api.php?format=json`;
        const proxyOptions = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];
        
        for (const proxyUrl of proxyOptions) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    return { source, data };
                }
            } catch (error) {
                console.warn(`Source ${source} failed: ${proxyUrl}`, error);
                continue;
            }
        }
        
        throw new Error(`All proxies failed for ${source}`);
    }

    combineSourceData(tomData, sarahData) {
        const combined = { events: {} };
        
        // Process Tom's data
        if (tomData && tomData.data && tomData.data.events) {
            this.addSourceToMatches(tomData.data, 'tom', combined);
        }
        
        // Process Sarah's data
        if (sarahData && sarahData.data && sarahData.data.events) {
            this.addSourceToMatches(sarahData.data, 'sarah', combined);
        }
        
        console.log(`✅ Combined ${tomData ? 'Tom' : 'no Tom'} + ${sarahData ? 'Sarah' : 'no Sarah'}`);
        return combined;
    }

    addSourceToMatches(sourceData, sourceName, combinedData) {
        Object.entries(sourceData.events).forEach(([date, matches]) => {
            if (!combinedData.events[date]) {
                combinedData.events[date] = [];
            }
            
            matches.forEach(match => {
                if (match?.match) {
                    // Normalize sport name
                    const normalizedSport = this.normalizeSportName(match.sport);
                    
                    // Create enhanced match with source information
                    const enhancedMatch = {
                        ...match,
                        sport: normalizedSport,
                        sources: {
                            [sourceName]: match.channels || []
                        }
                    };
                    
                    combinedData.events[date].push(enhancedMatch);
                }
            });
        });
    }

    // ==================== SPORT NORMALIZATION ====================
    normalizeSportName(sport) {
        if (!sport) return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        
        // Apply critical fixes first
        if (this.sportNormalization[sport]) {
            return this.sportNormalization[sport];
        }
        
        // Basic sport mapping (preserve most variations)
        const sportMap = {
            'football': 'Football',
            'soccer': 'Football',
            'basketball': 'Basketball',
            'baseball': 'Baseball',
            'hockey': 'Ice Hockey',
            'ice hockey': 'Ice Hockey',
            'tennis': 'Tennis',
            'cricket': 'Cricket',
            'rugby': 'Rugby',
            'golf': 'Golf',
            'boxing': 'Boxing',
            'mma': 'MMA',
            'ufc': 'MMA',
            'formula 1': 'Racing',
            'f1': 'Racing',
            'nascar': 'Racing',
            'motogp': 'Racing',
            'volleyball': 'Volleyball',
            'australian football': 'Australian Football',
            'afl': 'Australian Football',
            'badminton': 'Badminton',
            'american football': 'American Football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            'nfl': 'American Football',
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'beach volleyball': 'Beach Volleyball'
        };
        
        return sportMap[sportLower] || sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
    }

    // ==================== MATCH ORGANIZATION ====================
    organizeMatches(apiData) {
        if (!apiData || typeof apiData !== 'object' || !apiData.events) {
            this.useFallbackData();
            return;
        }
        
        this.extractAndCacheSports(apiData);
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match?.match && match.sources) {
                        const matchId = this.generateMatchId(match);
                        
                        // Initialize stats
                        if (!this.matchStats.has(matchId)) {
                            this.matchStats.set(matchId, {
                                views: Math.floor(Math.random() * 10000) + 500,
                                likes: Math.floor(Math.random() * 500) + 50,
                                dislikes: Math.floor(Math.random() * 100) + 10
                            });
                        }
                        
                        // Get all available streams from all sources
                        const allStreams = [];
                        Object.entries(match.sources).forEach(([source, channels]) => {
                            channels.forEach(channel => {
                                allStreams.push({
                                    url: channel,
                                    source: source,
                                    name: this.sources[source].name
                                });
                            });
                        });
                        
                        // Set current stream to first available
                        if (allStreams.length > 0 && !this.currentStreams.has(matchId)) {
                            this.currentStreams.set(matchId, 0);
                        }
                        
                        const processedMatch = {
                            id: matchId,
                            date: date,
                            time: this.convertUnixToLocalTime(match.unix_timestamp),
                            teams: match.match,
                            league: match.tournament || 'Sports',
                            streams: allStreams,
                            isLive: this.checkIfLive(match),
                            sport: match.sport,
                            unixTimestamp: match.unix_timestamp,
                            sourceCount: Object.keys(match.sources).length,
                            availableSources: Object.keys(match.sources)
                        };
                        
                        this.allMatches.push(processedMatch);
                        this.verifiedMatches.push(processedMatch);
                    }
                });
            }
        });
        
        if (this.verifiedMatches.length === 0) {
            this.useFallbackData();
            return;
        }
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
        
        if (this.currentView !== 'main') {
            this[`show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`]();
        }
    }

    // ==================== SIMPLIFIED SOURCE SELECTION ====================
    generateSourceSelector(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match || match.streams.length === 0) return '';
        
        if (match.streams.length === 1) {
            const stream = match.streams[0];
            return `<span class="source-badge">${stream.name}</span>`;
        }
        
        // Multiple sources - show simple dropdown
        const currentIndex = this.currentStreams.get(matchId) || 0;
        const currentStream = match.streams[currentIndex];
        
        return `
            <select class="source-dropdown" onchange="matchScheduler.switchSource('${matchId}', this.value)">
                ${match.streams.map((stream, index) => `
                    <option value="${index}" ${index === currentIndex ? 'selected' : ''}>
                        ${stream.name}
                    </option>
                `).join('')}
            </select>
        `;
    }

    switchSource(matchId, sourceIndex) {
        this.currentStreams.set(matchId, parseInt(sourceIndex));
        this.showMatchDetails(matchId);
    }

    // ==================== UPDATED MATCH ROW RENDERING ====================
    renderMatchRow(match) {
        const isLive = match.isLive;
        const formattedTeams = this.formatTeamNames(match.teams);
        const sourceIndicator = this.getSourceIndicator(match);

        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">${match.time}</div>
                <div class="match-details">
                    <div class="team-names">${formattedTeams}</div>
                    <div class="league-name">${match.league} ${sourceIndicator}</div>
                </div>
                <div class="watch-action">
                    ${match.streams && match.streams.length > 0 ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span style="color: var(--text-muted); font-size: 0.8em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }

    getSourceIndicator(match) {
        if (match.sourceCount === 0) return '';
        
        const sources = match.availableSources;
        if (sources.length === 1) {
            return `<span class="source-indicator">[${sources[0] === 'tom' ? 'T' : 'S'}]</span>`;
        }
        
        return `<span class="source-indicator">[T+S]</span>`;
    }

    // ==================== UPDATED MATCH DETAILS ====================
    async showMatchDetails(matchId) {
        console.log('🎯 showMatchDetails called - setting currentView to match-details');
        this.currentView = 'match-details';
        
        await this.ensureDataLoaded();
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const currentStreamIndex = this.currentStreams.get(matchId) || 0;
        const currentStream = match.streams[currentStreamIndex] || null;
        
        const sourceSelectorHTML = this.generateSourceSelector(matchId);
        
        container.innerHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn">← Back</button>
                    </div>
                    
                    <div class="video-container">
                        <div class="video-player-controls">
                            <div class="control-buttons-right">
                                <button class="player-control-btn refresh" onclick="matchScheduler.refreshCurrentStream('${matchId}')">
                                    Refresh
                                </button>
                            </div>
                        </div>
                        
                        <div class="video-player-wrapper">
                            <div class="video-player" id="video-player-${matchId}">
                                ${currentStream ? 
                                    `<iframe src="${currentStream.url}" class="stream-iframe" id="stream-iframe-${matchId}"
                                            allow="autoplay; fullscreen" allowfullscreen></iframe>` :
                                    `<div class="no-stream">
                                        <h3>Stream Offline</h3>
                                        <p>No streams available for this match</p>
                                    </div>`
                                }
                            </div>
                        </div>
                        
                        <div class="video-controls">
                            <div class="video-title">${formattedTeams}</div>
                            <div class="video-stats">
                                <span class="views-count">${this.formatNumber(stats.views)} views</span>
                                ${match.isLive ? '<span class="live-badge-details">LIVE NOW</span>' : ''}
                                <span style="color: var(--text-muted);">• ${match.league}</span>
                                ${match.streams.length > 1 ? `<span style="color: var(--accent-gold);">• ${match.streams.length} sources</span>` : ''}
                                ${sourceSelectorHTML}
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn like-btn" onclick="matchScheduler.handleLike('${matchId}')">
                                    👍 ${this.formatNumber(stats.likes)}
                                </button>
                                <button class="action-btn dislike-btn" onclick="matchScheduler.handleDislike('${matchId}')">
                                    👎 ${this.formatNumber(stats.dislikes)}
                                </button>
                                <button class="action-btn" onclick="matchScheduler.handleShare('${matchId}')">
                                    Share
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    <strong>Match Info:</strong> ${this.getTeamName(match.teams, 0)} vs ${this.getTeamName(match.teams, 1)} in ${match.league}. 
                                    ${match.isLive ? 'Live now!' : `Scheduled for ${match.time} on ${this.formatDisplayDate(match.date)}.`}
                                    ${match.streams.length > 1 ? `Multiple streaming sources available.` : `Source: ${currentStream ? currentStream.name : 'None'}`}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <footer class="dashboard-footer">
                        <div class="footer-legal">
                            <p class="copyright">© 2025 9KILOS. All rights reserved.</p>
                            <p class="legal-disclaimer">
                                KILOS is simply a database of embedded streams and HLS files available throughout the internet. 
                                WE does not host, control or upload any streams and/or media files. Please contact appropriate 
                                media owners or hosts.
                            </p>
                        </div>
                        <div class="last-updated">Updated: <span id="update-time-details">Just now</span></div>
                    </footer>
                </div>
            </div>
        `;
        
        document.getElementById('update-time-details').textContent = new Date().toLocaleTimeString();
        this.hideStats();
        this.incrementViews(matchId);
    }

    // ==================== TV CHANNELS (UNCHANGED) ====================
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

    showTVChannels() {
        console.log('🎯 TV Channels button clicked');
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.add('tv-section');
        this.showCountriesView();
    }

    showCountriesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const tvData = this.getTVChannelsData();
        
        container.innerHTML = `
            <div class="content-section">
                <div class="tv-navigation">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Country</h2>
                    <p>Select country for TV channels</p>
                </div>
                
                <div class="countries-grid">
                    ${Object.entries(tvData).map(([country, channels]) => `
                        <div class="country-card" onclick="matchScheduler.showCountryChannels('${country}')">
                            <div class="country-flag">${this.getCountryFlag(country)}</div>
                            <div class="country-name">${country}</div>
                            <div class="channel-count">${channels.length} channels</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'tv-countries';
    }

    showCountryChannels(country) {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        this.currentCountry = country;
        const tvData = this.getTVChannelsData();
        const channels = tvData[country] || [];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="tv-navigation">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>TV Channels</h2>
                    <p>Browse ${country} channels</p>
                </div>
                
                <div class="channels-grid">
                    ${channels.map(channel => `
                        <div class="channel-card">
                            <div class="channel-header">
                                <div class="channel-info">
                                    <div class="channel-name">${channel.displayName}</div>
                                    <div class="channel-category">${channel.category}</div>
                                </div>
                            </div>
                            <div class="channel-description">${channel.description}</div>
                            <button class="watch-button" onclick="matchScheduler.playTVChannel('${channel.name}')">
                                ▶ Watch Live
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'tv-channels';
    }

    playTVChannel(channelName) {
        const country = this.currentCountry;
        const tvData = this.getTVChannelsData();
        const channel = tvData[country].find(c => c.name === channelName);
        
        if (!channel) return;
        
        this.currentTVChannel = channel;
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn">← Back to Channels</button>
                    </div>
                    
                    <div class="video-container">
                        <div class="video-player-wrapper">
                            <div class="video-player" id="video-player-tv">
                                <iframe src="${channel.streamUrl}" class="stream-iframe" id="stream-iframe-tv"
                                        allow="autoplay; fullscreen" allowfullscreen></iframe>
                            </div>
                        </div>
                        
                        <div class="video-controls">
                            <div class="video-title">${channel.displayName}</div>
                            <div class="video-stats">
                                <span class="views-count">Live TV Channel</span>
                                <span class="live-badge-details">LIVE NOW</span>
                                <span style="color: var(--text-muted);">• ${channel.country}</span>
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn" onclick="matchScheduler.showCountryChannels('${country}')">
                                    📺 More Channels
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    <strong>Channel Info:</strong> ${channel.displayName} from ${channel.country}. 
                                    ${channel.description} Live 24/7 broadcast.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'tv-player';
    }

    getCountryFlag(country) {
        const flags = {
            'South Africa': '🇿🇦',
            'USA': '🇺🇸',
            'UK': '🇬🇧',
            'Argentina': '🇦🇷',
            'Australia': '🇦🇺',
            'Belgium': '🇧🇪',
            'Brazil': '🇧🇷',
            'Canada': '🇨🇦',
            'France': '🇫🇷',
            'Germany': '🇩🇪',
            'India': '🇮🇳',
            'Ireland': '🇮🇪',
            'Italy': '🇮🇹',
            'Mexico': '🇲🇽',
            'Netherlands': '🇳🇱',
            'New Zealand': '🇳🇿',
            'Pakistan': '🇵🇰',
            'Poland': '🇵🇱',
            'Portugal': '🇵🇹',
            'Romania': '🇷🇴',
            'Serbia': '🇷🇸',
            'Spain': '🇪🇸'
        };
        return flags[country] || '🌍';
    }

    getTVChannelsData() {
        return this.tvChannelsData || {};
    }

    // ==================== UTILITY METHODS (UNCHANGED) ====================
    waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.isDOMReady = true;
                    console.log('✅ DOM fully loaded and parsed');
                    resolve();
                });
            } else {
                this.isDOMReady = true;
                console.log('✅ DOM already ready');
                resolve();
            }
        });
    }

    setupEventListeners() {
        if (!this.isDOMReady) {
            setTimeout(() => this.setupEventListeners(), 100);
            return;
        }

        console.log('🎯 Setting up enhanced event listeners...');
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.sports-button')) {
                this.preloadSportsData();
            }
        });

        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        console.log('✅ Enhanced event listeners setup complete');
    }

    handleGlobalClick(e) {
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = menuButton.getAttribute('data-action');
            console.log(`🎯 Menu button: ${action}`);
            
            switch(action) {
                case 'sports':
                    this.showSportsView();
                    break;
                case 'tv':
                    this.showTVChannels();
                    break;
                case 'community':
                    this.showCommunity();
                    break;
            }
            return;
        }

        const homeButton = e.target.closest('.home-button');
        if (homeButton) {
            e.preventDefault();
            e.stopPropagation();
            this.showMainMenu();
            return;
        }

        const backButton = e.target.closest('.top-back-button');
        if (backButton) {
            e.preventDefault();
            e.stopPropagation();
            this.handleBackButton();
            return;
        }

        const matchBackBtn = e.target.closest('.back-btn');
        if (matchBackBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.handleBackButton();
            return;
        }

        const sportButton = e.target.closest('.sport-button');
        if (sportButton && !sportButton.hasAttribute('data-action')) {
            e.preventDefault();
            e.stopPropagation();
            const sportName = sportButton.querySelector('.sport-name')?.textContent;
            if (sportName) {
                this.selectSport(sportName);
            }
            return;
        }

        const dateButton = e.target.closest('.date-button');
        if (dateButton) {
            e.preventDefault();
            e.stopPropagation();
            const dateElement = dateButton.querySelector('.date-name');
            if (dateElement) {
                const dateText = dateElement.textContent;
                const matches = this.verifiedMatches;
                const match = matches.find(m => {
                    const displayDate = this.formatDisplayDate(m.date);
                    return displayDate === dateText || 
                           (dateText.includes('Today') && m.date === new Date().toISOString().split('T')[0]);
                });
                if (match) {
                    this.selectDate(match.date);
                }
            }
            return;
        }

        const watchButton = e.target.closest('.watch-btn');
        if (watchButton) {
            e.preventDefault();
            e.stopPropagation();
            const matchRow = watchButton.closest('.match-row');
            if (matchRow) {
                const teamNames = matchRow.querySelector('.team-names')?.textContent;
                if (teamNames) {
                    const match = this.verifiedMatches.find(m => 
                        this.formatTeamNames(m.teams) === teamNames
                    );
                    if (match) {
                        this.showMatchDetails(match.id);
                    }
                }
            }
            return;
        }

        const filterButton = e.target.closest('.filter-btn');
        if (filterButton) {
            e.preventDefault();
            e.stopPropagation();
            const filterType = filterButton.getAttribute('data-filter');
            this.setFilter(filterType);
            return;
        }
    }

    handleBackButton() {
        switch(this.currentView) {
            case 'sports':
                this.showMainMenu();
                break;
            case 'dates':
                this.showSportsView();
                break;
            case 'matches':
                this.showDatesView();
                break;
            case 'match-details':
                this.showMatchesView();
                break;
            default:
                this.showMainMenu();
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error caught:', e);
            this.showErrorUI('Something went wrong. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e);
            this.showErrorUI('Application error occurred.');
        });
    }

    showErrorUI(message) {
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = message;
            errorBoundary.style.display = 'block';
        }
    }

    setFilter(type) {
        try {
            this.showLiveOnly = (type === 'live');
            this.showMatchesView();
        } catch (error) {
            console.log('🛡️ Filter error - resetting to safe state');
            this.showLiveOnly = false;
            this.showMatchesView();
        }
    }

  async showSportsView() {
    console.log('🎯 Sports button clicked - Multi-source version');
    this.showSportsLoadingUI();
    
    const safetyTimeout = setTimeout(() => {
        console.log('⚡ Safety timeout: Showing available data');
        this.showSportsDataUI();
    }, 3000);
    
    try {
        const success = await this.ensureDataLoaded();
        clearTimeout(safetyTimeout);
        
        if (success) {
            this.showSportsDataUI();
        } else {
            this.showSportsDataUI();
        }
    } catch (error) {
        clearTimeout(safetyTimeout);
        this.showSportsDataUI();
    }
}

    showSportsLoadingUI() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>select</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" style="opacity: 0.7; cursor: wait;">
                        <div class="sport-name">Loading Sports</div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }

    showSportsDataUI() {
        if (!this.verifiedMatches || this.verifiedMatches.length === 0) {
            this.showSportsEmptyState();
            return;
        }
        
        const container = document.getElementById('dynamic-content');
        const uniqueSports = [...new Set(this.verifiedMatches.map(match => match.sport))];
        
        const sports = uniqueSports.map(sportId => {
            return {
                id: sportId,
                name: sportId
            };
        }).filter(sport => sport.name).sort((a, b) => a.name.localeCompare(b.name));

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>select</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }

    showSportsEmptyState() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>select</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="matchScheduler.retryLoadMatches()" style="cursor: pointer;">
                        <div class="sport-name">Retry Loading</div>
                    </div>
                </div>
            </div>
        `;
    }

    retryLoadMatches() {
        this.isDataLoaded = false;
        this.showSportsView();
    }

    async ensureDataLoaded() {
        if (this.isDataLoaded) return true;
        
        if (this.isLoading) {
            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.isDataLoaded) {
                        clearInterval(checkInterval);
                        resolve(true);
                    }
                }, 100);
            });
        }
        
        this.isLoading = true;
        try {
            await this.loadMatches();
            this.isDataLoaded = true;
            return true;
        } catch (error) {
            console.error('Data loading failed:', error);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    extractAndCacheSports(apiData) {
        if (!apiData?.events) return;
        
        const sports = new Set();
        Object.values(apiData.events).forEach(matches => {
            matches.forEach(match => {
                if (match?.sport) {
                    const sport = this.normalizeSportName(match.sport);
                    sports.add(sport);
                }
            });
        });
        
        this.preloadedSports = Array.from(sports);
        
        if (this.currentView === 'sports' && this.preloadedSports.length > 0) {
            this.showSportsDataUI();
        }
    }

    async showDatesView() {
        await this.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.currentSport;
        const today = new Date().toISOString().split('T')[0];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName}</h2>
                    <p>Select date</p>
                </div>
                <div class="sports-grid">
                    ${dates.map(date => {
                        const isToday = date === today;
                        return `
                            <div class="date-button" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-name">
                                    ${isToday ? '<span class="today-badge">Today</span>' : this.formatDisplayDate(date)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'dates';
    }

    async showMatchesView() {
        console.log('🔍 showMatchesView called with:', {
            sport: this.currentSport,
            date: this.currentDate,
            showLiveOnly: this.showLiveOnly
        });
        
        await this.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.currentSport;
        const today = new Date().toISOString().split('T')[0];
        const isToday = this.currentDate === today;
        
        const allMatches = matches;
        const liveMatches = allMatches.filter(match => match.isLive === true);
        const displayMatches = this.showLiveOnly ? liveMatches : allMatches;
        
        const scheduleHeader = `Today's ${sportName}`;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${scheduleHeader}</h2>
                    <p>${isToday ? '' : this.formatDisplayDate(this.currentDate)}</p>
                </div>
                
                <div class="matches-table-container">
                    <div class="professional-filter">
                        <button class="filter-btn ${this.showLiveOnly ? '' : 'active'}" 
                                data-filter="all" onclick="matchScheduler.setFilter('all')">
                            All Matches
                        </button>
                        <button class="filter-btn ${this.showLiveOnly ? 'active' : ''}" 
                                data-filter="live" onclick="matchScheduler.setFilter('live')">
                            Live Only
                        </button>
                    </div>
                    
                    <div class="matches-table">
                        <div class="table-header">
                            <div>Time</div>
                            <div>Match</div>
                            <div>Watch</div>
                        </div>
                        ${displayMatches.length > 0 ? 
                            displayMatches.map(match => this.renderMatchRow(match)).join('') :
                            this.renderEmptyState(this.showLiveOnly)
                        }
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'matches';
    }

    renderEmptyState(isLiveFilter) {
        if (isLiveFilter) {
            return `
                <div class="no-matches">
                    <h3>No Live Matches Right Now</h3>
                    <p>Check back later for live games</p>
                    <button class="retry-btn" onclick="matchScheduler.setFilter('all')">
                        View All Matches
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="no-matches">
                    <h3>No Matches Scheduled</h3>
                    <p>Check other dates or sports categories</p>
                </div>
            `;
        }
    }

    refreshCurrentStream(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
                
                const refreshBtn = document.querySelector('.player-control-btn.refresh');
                const originalText = refreshBtn.innerHTML;
                refreshBtn.innerHTML = 'Refreshing...';
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                }, 1000);
            }, 500);
        }
    }

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.remove('tv-section');
        
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" data-action="sports">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">Games & schedules</div>
                    </div>
                    <div class="menu-button tv-button" data-action="tv">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                    <div class="menu-button community" data-action="community">
                        <div class="button-title">COMMUNITY</div>
                        <div class="button-subtitle">Fan discussions</div>
                    </div>
                </div>
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
    }

    showCommunity() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.remove('tv-section');
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Community</h2>
                    <p>Fan discussions</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Fan Zone</div>
                    </div>
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Match Reactions</div>
                    </div>
                </div>
            </div>
        `;
        this.hideStats();
    }

    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }

    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }

    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport === sport);
    }

    getMatchesBySportAndDate(sport, date) {
        return this.getMatchesBySport(sport).filter(match => match.date === date);
    }

    generateMatchId(match) {
        return `${match.match}-${match.unix_timestamp}-${Math.random().toString(36).substr(2, 6)}`;
    }

    convertUnixToLocalTime(unixTimestamp) {
        if (!unixTimestamp) return 'TBD';
        return new Date(unixTimestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }

    checkIfLive(match) {
        if (!match.unix_timestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unix_timestamp;
        return now >= matchTime && now <= (matchTime + 10800);
    }

    formatTeamNames(teamString) {
        return teamString.replace(/ - /g, ' vs ');
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    }

    getTeamName(teamString, index) {
        const teams = teamString.split(' - ');
        return teams[index] || `Team ${index + 1}`;
    }

    incrementViews(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.views++;
            this.matchStats.set(matchId, stats);
        }
    }

    handleLike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.likes++;
            this.matchStats.set(matchId, stats);
            this.showMatchDetails(matchId);
        }
    }

    handleDislike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.dislikes++;
            this.matchStats.set(matchId, stats);
            this.showMatchDetails(matchId);
        }
    }

    handleShare(matchId) {
        alert('Share feature coming soon!');
    }

    showStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'grid';
    }

    hideStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'none';
    }

    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        const totalViewers = this.verifiedMatches.reduce((sum, match) => {
            const stats = this.matchStats.get(match.id);
            return sum + (stats ? stats.views : 0);
        }, 0);
        
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('live-viewers').textContent = this.formatNumber(Math.floor(totalViewers / 100));
        document.getElementById('countries').textContent = this.verifiedMatches.length < 5 ? '3' : '1';
        document.getElementById('uptime').textContent = this.verifiedMatches.length < 5 ? 'Research' : '100%';
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }

    backgroundPreload() {
        setTimeout(() => {
            this.preloadSportsData().catch(() => {});
        }, 1000);
    }

    async preloadSportsData() {
        if (this.isDataLoaded || this.isLoading) return;
        
        this.isLoading = true;
        try {
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.extractAndCacheSports(cachedData);
                return;
            }
            
            const fastData = await this.tryFastProxies();
            if (fastData) {
                this.extractAndCacheSports(fastData);
                this.cacheData(fastData);
            }
        } catch (error) {
            // Silent fail
        } finally {
            this.isLoading = false;
        }
    }

    async tryFastProxies() {
        // Try both sources quickly
        const tomUrl = 'https://topembed.pw/api.php?format=json';
        const sarahUrl = 'https://streamed.pk/api.php?format=json';
        
        const fastProxies = [
            `https://corsproxy.io/?${encodeURIComponent(tomUrl)}`,
            tomUrl,
            `https://corsproxy.io/?${encodeURIComponent(sarahUrl)}`,
            sarahUrl
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
                    return { data, source: proxyUrl.includes('streamed') ? 'sarah' : 'tom' };
                }
            } catch (error) {
                continue;
            }
        }
        return null;
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
                        sources: {
                            'tom': ['https://example.com/tom-stream1'],
                            'sarah': ['https://example.com/sarah-stream1']
                        }
                    }
                ]
            }
        };
        this.organizeMatches(sampleMatches);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    showErrorState(errorMessage = '') {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="error-message">
                    <h3>Connection Issue</h3>
                    <p>Using fallback data</p>
                    ${errorMessage ? `<p style="font-size: 0.8em; color: var(--accent-red); margin: 10px 0;">${errorMessage}</p>` : ''}
                    <button class="retry-btn" onclick="matchScheduler.loadMatches()">
                        Retry Live Data
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM fully loaded, initializing Multi-Source MatchScheduler...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos Multi-Source Version fully initialized!');
        }).catch(error => {
            console.error('❌ Initialization failed:', error);
        });
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
    }
});
