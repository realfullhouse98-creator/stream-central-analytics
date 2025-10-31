// 9kilo Stream - Bulletproof 4-Layer Data System
class MatchScheduler {
    constructor() {
        // Data layers
        this.verifiedMatches = [];
        this.isDataLoaded = false;
        
        // Sync configuration
        this.SYNC_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
        this.CACHE_MAX_AGE = 4 * 60 * 60 * 1000; // 4 hours
        this.lastSyncTime = 0;
        
        // App state
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.currentCountry = '';
        this.currentTVChannel = null;
        
        // Stats and tracking
        this.matchStats = new Map();
        this.currentStreams = new Map();
        this.showLiveOnly = false;
        
        // DOM state
        this.isDOMReady = false;
        
        console.log('🚀 9kilos Bulletproof System Initialized!');
    }
    
    async init() {
        await this.waitForDOMReady();
        this.setupGlobalErrorHandling();
        this.setupEventListeners();
        this.showMainMenu();
        this.registerServiceWorker();
        
        // Start data loading (non-blocking)
        this.loadMatchesData().then(() => {
            this.updateAnalytics();
        });
        
        // Start background sync system
        this.startBackgroundSync();
    }

    // ==================== 4-LAYER DATA SYSTEM ====================
    async loadMatchesData() {
        console.log('🔄 Starting 4-layer data load...');
        
        const loadStrategies = [
            this.loadFromFreshCache.bind(this),     // Layer 1: Fresh localStorage
            this.loadFromAPIFallback.bind(this),    // Layer 2: Direct API
            this.loadFromEmergencyBackup.bind(this), // Layer 3: Emergency file
            this.useEmergencyData.bind(this)        // Layer 4: Hardcoded fallback
        ];

        for (let strategy of loadStrategies) {
            try {
                const success = await strategy();
                if (success) {
                    this.isDataLoaded = true;
                    this.lastSyncTime = Date.now();
                    return;
                }
            } catch (error) {
                console.log(`❌ ${strategy.name} failed:`, error.message);
                continue;
            }
        }
        
        // Ultimate fallback
        this.useEmergencyData();
        this.isDataLoaded = true;
    }

    // LAYER 1: Fresh localStorage cache
    async loadFromFreshCache() {
        try {
            const cache = localStorage.getItem('9kilos-matches-cache');
            if (!cache) return false;
            
            const { data, timestamp, version = 1 } = JSON.parse(cache);
            const cacheAge = Date.now() - timestamp;
            
            // Use cache if fresh or if offline
            const isFresh = cacheAge < this.CACHE_MAX_AGE;
            const isOffline = !navigator.onLine;
            
            if (isFresh || isOffline) {
                this.verifiedMatches = data;
                console.log(`✅ Layer 1: Fresh cache (${Math.round(cacheAge/1000/60)}min old)`);
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    // LAYER 2: Direct API with multiple endpoints
    async loadFromAPIFallback() {
        const apiEndpoints = [
            'https://corsproxy.io/?https://topembed.pw/api.php?format=json',
            'https://api.allorigins.win/raw?url=https://topembed.pw/api.php?format=json',
            'https://topembed.pw/api.php?format=json'
        ];

        for (let endpoint of apiEndpoints) {
            try {
                console.log(`🔄 Trying endpoint: ${endpoint.split('/')[2]}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(endpoint, { 
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const apiData = await response.json();
                    this.verifiedMatches = this.processAPIData(apiData);
                    
                    // Cache the successful API data
                    this.cacheData(this.verifiedMatches, 'api');
                    
                    console.log(`✅ Layer 2: API success from ${endpoint.split('/')[2]}`);
                    return true;
                }
            } catch (error) {
                console.log(`❌ Endpoint failed: ${error.message}`);
                continue;
            }
        }
        
        throw new Error('All API endpoints failed');
    }

    // LAYER 3: Emergency backup file
    async loadFromEmergencyBackup() {
        try {
            const response = await fetch('emergency-backup.json');
            if (!response.ok) throw new Error('No emergency file');
            
            const data = await response.json();
            this.verifiedMatches = data.matches || [];
            
            console.log('✅ Layer 3: Emergency backup loaded');
            return this.verifiedMatches.length > 0;
        } catch (error) {
            return false;
        }
    }

    // LAYER 4: Hardcoded emergency data
    useEmergencyData() {
        const now = Math.floor(Date.now() / 1000);
        this.verifiedMatches = [{
            id: 'emergency-1',
            date: new Date().toISOString().split('T')[0],
            time: '19:00',
            teams: '9kilos Research - Demo Team',
            league: 'Emergency Broadcast',
            sport: 'Football',
            isLive: true,
            channels: [],
            unixTimestamp: now
        }];
        console.log('🆘 Layer 4: Using hardcoded emergency data');
        return true;
    }

    // ==================== BACKGROUND SYNC SYSTEM ====================
    startBackgroundSync() {
        // Sync every 30 minutes when visible
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.silentSync();
            }
        }, 30 * 60 * 1000);

        // Sync when coming online
        window.addEventListener('online', () => {
            this.silentSync();
        });

        // Sync when returning to tab
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                const timeSinceLastSync = Date.now() - this.lastSyncTime;
                if (timeSinceLastSync > 30 * 60 * 1000) {
                    this.silentSync();
                }
            }
        });
    }

    async silentSync() {
        if (!navigator.onLine) return;
        
        try {
            const apiData = await this.tryFastProxies();
            if (apiData && this.hasNewData(apiData)) {
                this.verifiedMatches = this.processAPIData(apiData);
                this.cacheData(this.verifiedMatches, 'api-sync');
                this.lastSyncTime = Date.now();
                
                // Update UI if needed
                this.refreshCurrentView();
                this.updateAnalytics();
                
                console.log('🔄 Background sync: Data updated');
            }
        } catch (error) {
            // Completely silent fail
        }
    }

    // ==================== CACHE MANAGEMENT ====================
    cacheData(matches, source) {
        const cacheData = {
            data: matches,
            timestamp: Date.now(),
            source: source,
            version: 2
        };
        
        try {
            localStorage.setItem('9kilos-matches-cache', JSON.stringify(cacheData));
        } catch (e) {
            // Ignore storage errors
        }
    }

    hasNewData(apiData) {
        // Simple check - compare match counts
        const currentCount = this.verifiedMatches.length;
        const newCount = this.countMatchesInAPI(apiData);
        return newCount > currentCount * 0.8; // 80% threshold
    }

    countMatchesInAPI(apiData) {
        if (!apiData?.events) return 0;
        return Object.values(apiData.events).reduce((total, matches) => total + matches.length, 0);
    }

    // ==================== TV CHANNELS SYSTEM ====================
    async getTVChannelsData() {
        try {
            const response = await fetch('tv-channels.json');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('TV channels load failed:', error);
            return {};
        }
    }

    async showTVChannels() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        await this.showCountriesView();
    }

    async showCountriesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        try {
            const tvData = await this.getTVChannelsData();
            
            if (!tvData || Object.keys(tvData).length === 0) {
                throw new Error('No TV channels data');
            }
            
            container.innerHTML = `
                <div class="content-section">
                    <div class="navigation-buttons">
                        <button class="home-button">⌂</button>
                    </div>
                    <div class="section-header">
                        <h2>📺 TV Channels</h2>
                        <p>Select a country to browse channels</p>
                    </div>
                    
                    <div class="countries-grid">
                        ${Object.entries(tvData).map(([country, channels]) => `
                            <div class="country-card" onclick="matchScheduler.showCountryChannels('${country}')">
                                <div class="country-flag">${this.getCountryFlag(country)}</div>
                                <div class="country-name">${country}</div>
                                <div class="channel-count">${channels.length} channel${channels.length !== 1 ? 's' : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
        } catch (error) {
            container.innerHTML = `
                <div class="content-section">
                    <div class="navigation-buttons">
                        <button class="home-button">⌂</button>
                    </div>
                    <div class="error-message">
                        <h3>TV Channels Unavailable</h3>
                        <p>Please check your connection</p>
                        <button class="retry-btn" onclick="matchScheduler.showCountriesView()">Retry</button>
                    </div>
                </div>
            `;
        }
        
        this.hideStats();
        this.currentView = 'tv-countries';
    }

    async showCountryChannels(country) {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        this.currentCountry = country;
        
        try {
            const tvData = await this.getTVChannelsData();
            const channels = tvData[country] || [];
            
            container.innerHTML = `
                <div class="content-section">
                    <div class="navigation-buttons">
                        <button class="home-button">⌂</button>
                        <button class="top-back-button">←</button>
                    </div>
                    <div class="section-header">
                        <h2>${this.getCountryFlag(country)} ${country}</h2>
                        <p>${channels.length} channel${channels.length !== 1 ? 's' : ''} available</p>
                    </div>
                    
                    <div class="channels-grid">
                        ${channels.map(channel => `
                            <div class="channel-card">
                                <div class="channel-header">
                                    <div class="channel-logo">${this.getChannelLogo(channel.name)}</div>
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
            
        } catch (error) {
            container.innerHTML = `
                <div class="content-section">
                    <div class="navigation-buttons">
                        <button class="home-button">⌂</button>
                        <button class="top-back-button">←</button>
                    </div>
                    <div class="error-message">
                        <h3>Unable to load channels</h3>
                        <button class="retry-btn" onclick="matchScheduler.showCountryChannels('${country}')">Retry</button>
                    </div>
                </div>
            `;
        }
        
        this.hideStats();
        this.currentView = 'tv-channels';
    }

    async playTVChannel(channelName) {
        const country = this.currentCountry;
        
        try {
            const tvData = await this.getTVChannelsData();
            const countryChannels = tvData[country] || [];
            const channel = countryChannels.find(c => c.name === channelName);
            
            if (!channel) throw new Error('Channel not found');
            
            this.currentTVChannel = channel;
            const container = document.getElementById('dynamic-content');
            if (!container) return;
            
            container.innerHTML = `
                <div class="match-details-overlay">
                    <div class="match-details-modal">
                        <div class="match-header">
                            <button class="back-btn">← Back</button>
                        </div>
                        
                        <div class="video-container">
                            <div class="video-player-controls">
                                <div class="control-buttons-right">
                                    <button class="player-control-btn refresh" onclick="matchScheduler.refreshTVStream()">
                                        Refresh
                                    </button>
                                </div>
                            </div>
                            
                            <div class="video-player-wrapper">
                                <div class="video-player" id="video-player-${channel.name}">
                                    <iframe src="${channel.streamUrl}" class="stream-iframe" id="tv-player"
                                            allow="autoplay; fullscreen" allowfullscreen
                                            title="${channel.displayName}">
                                    </iframe>
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
                                    <button class="action-btn" onclick="matchScheduler.handleLikeTV('${channel.name}')">
                                        👍 Like
                                    </button>
                                    <button class="action-btn" onclick="matchScheduler.handleShareTV('${channel.name}')">
                                        Share
                                    </button>
                                </div>
                                
                                <div class="match-description">
                                    <div class="description-text">
                                        <strong>Channel Info:</strong> ${channel.displayName} from ${channel.country}. 
                                        ${channel.description} Category: ${channel.category}.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            const container = document.getElementById('dynamic-content');
            if (container) {
                container.innerHTML = `
                    <div class="content-section">
                        <div class="navigation-buttons">
                            <button class="home-button">⌂</button>
                            <button class="top-back-button">←</button>
                        </div>
                        <div class="error-message">
                            <h3>Channel Unavailable</h3>
                            <button class="retry-btn" onclick="matchScheduler.playTVChannel('${channelName}')">Retry</button>
                        </div>
                    </div>
                `;
            }
        }
        
        this.hideStats();
        this.currentView = 'tv-player';
    }

    refreshTVStream() {
        const iframe = document.getElementById('tv-player');
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
            }, 500);
        }
    }

    // ==================== SPORTS SYSTEM ====================
    showSportsView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        if (this.isDataLoaded && this.verifiedMatches.length > 0) {
            this.showSportsDataUI();
        } else {
            this.showSportsUIWithCachedData();
            // Data will appear when loaded via background sync
        }
        
        this.hideStats();
        this.currentView = 'sports';
    }

    showSportsDataUI() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const uniqueSports = [...new Set(this.verifiedMatches.map(match => match.sport))];
        const sports = uniqueSports.map(sportId => {
            const count = this.getMatchesBySport(sportId).length;
            return { id: sportId, name: sportId, count: count };
        }).filter(sport => sport.count > 0).sort((a, b) => b.count - a.count);

        const sportsHTML = sports.map(sport => `
            <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                <div class="sport-name">${sport.name}</div>
                <div class="match-count">${sport.count} match${sport.count !== 1 ? 'es' : ''}</div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>Select your sport</p>
                </div>
                <div class="sports-grid">
                    ${sportsHTML}
                </div>
            </div>
        `;
    }

    showSportsUIWithCachedData() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>Loading sports data...</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" style="opacity: 0.7;">
                        <div class="sport-name">Loading...</div>
                        <div class="match-count">Please wait</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== DATA PROCESSING ====================
    processAPIData(apiData) {
        if (!apiData?.events) return [];
        
        const processedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match?.match) {
                        const matchId = this.generateMatchId(match);
                        
                        if (!this.matchStats.has(matchId)) {
                            this.matchStats.set(matchId, {
                                views: Math.floor(Math.random() * 10000) + 500,
                                likes: Math.floor(Math.random() * 500) + 50,
                                dislikes: Math.floor(Math.random() * 100) + 10
                            });
                        }
                        
                        const processedMatch = {
                            id: matchId,
                            date: date,
                            time: this.convertUnixToLocalTime(match.unix_timestamp),
                            teams: match.match,
                            league: match.tournament || 'Sports',
                            streamUrl: match.channels?.[0] || null,
                            channels: match.channels || [],
                            isLive: this.checkIfLive(match),
                            sport: this.classifySport(match),
                            unixTimestamp: match.unix_timestamp
                        };
                        
                        processedMatches.push(processedMatch);
                    }
                });
            }
        });
        
        return processedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
    }

    // ==================== UTILITY METHODS ====================
    waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.isDOMReady = true;
                    resolve();
                });
            } else {
                this.isDOMReady = true;
                resolve();
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });
    }

    handleGlobalClick(e) {
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            const action = menuButton.getAttribute('data-action');
            switch(action) {
                case 'sports': this.showSportsView(); break;
                case 'tv': this.showTVChannels(); break;
                case 'community': this.showCommunity(); break;
            }
            return;
        }

        const homeButton = e.target.closest('.home-button');
        if (homeButton) {
            this.showMainMenu();
            return;
        }

        const backButton = e.target.closest('.top-back-button, .back-btn');
        if (backButton) {
            this.handleBackButton();
            return;
        }

        const sportButton = e.target.closest('.sport-button');
        if (sportButton && !sportButton.hasAttribute('data-action')) {
            const sportName = sportButton.querySelector('.sport-name')?.textContent;
            if (sportName) this.selectSport(sportName);
            return;
        }

        const dateButton = e.target.closest('.date-button');
        if (dateButton) {
            const dateText = dateButton.querySelector('.date-name')?.textContent;
            const match = this.verifiedMatches.find(m => this.formatDisplayDate(m.date) === dateText);
            if (match) this.selectDate(match.date);
            return;
        }

        const watchButton = e.target.closest('.watch-btn');
        if (watchButton) {
            const matchRow = watchButton.closest('.match-row');
            const teamNames = matchRow?.querySelector('.team-names')?.textContent;
            const match = this.verifiedMatches.find(m => this.formatTeamNames(m.teams) === teamNames);
            if (match) this.showMatchDetails(match.id);
            return;
        }

        const filterToggle = e.target.closest('.filter-toggle');
        if (filterToggle) {
            this.toggleLiveFilter();
            return;
        }
    }

    handleBackButton() {
        switch(this.currentView) {
            case 'sports': case 'tv-countries': this.showMainMenu(); break;
            case 'dates': this.showSportsView(); break;
            case 'matches': this.showDatesView(); break;
            case 'tv-channels': this.showCountriesView(); break;
            case 'tv-player': this.showCountryChannels(this.currentCountry); break;
            default: this.showMainMenu();
        }
    }

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
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

    // ==================== SPORTS NAVIGATION ====================
    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }

    async showDatesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${this.currentSport}</h2>
                    <p>Select date</p>
                </div>
                <div class="sports-grid">
                    ${dates.map(date => {
                        const dateMatches = matches.filter(m => m.date === date);
                        const liveCount = dateMatches.filter(m => m.isLive).length;
                        return `
                            <div class="date-button" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-name">${this.formatDisplayDate(date)}</div>
                                <div class="match-count">${dateMatches.length} match${dateMatches.length !== 1 ? 'es' : ''}${liveCount > 0 ? ` • ${liveCount} live` : ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'dates';
    }

    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }

    async showMatchesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const filteredMatches = this.showLiveOnly ? matches.filter(match => match.isLive) : matches;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>Schedule</h2>
                    <p>${this.formatDisplayDate(this.currentDate)}</p>
                </div>
                
                <div class="matches-table-container">
                    <div class="table-filter">
                        <button class="filter-toggle ${this.showLiveOnly ? 'active' : ''}" onclick="matchScheduler.toggleLiveFilter()">
                            ${this.showLiveOnly ? 'LIVE' : 'ALL'}
                        </button>
                    </div>
                    <div class="matches-table">
                        <div class="table-header">
                            <div>Time</div>
                            <div>Match</div>
                            <div>Watch</div>
                        </div>
                        ${filteredMatches.length > 0 ? 
                            filteredMatches.map(match => this.renderMatchRow(match)).join('') :
                            '<div class="no-matches">No matches found</div>'
                        }
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'matches';
    }

    renderMatchRow(match) {
        const isLive = match.isLive;
        const formattedTeams = this.formatTeamNames(match.teams);
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">${match.time}</div>
                <div class="match-details">
                    <div class="team-names">${formattedTeams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.channels && match.channels.length > 0 ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span style="color: var(--text-muted); font-size: 0.8em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }

    toggleLiveFilter() {
        this.showLiveOnly = !this.showLiveOnly;
        this.showMatchesView();
    }

    async showMatchDetails(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const currentStreamUrl = match.channels?.[0] || null;
        
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
                                ${currentStreamUrl ? 
                                    `<iframe src="${currentStreamUrl}" class="stream-iframe" id="stream-iframe-${matchId}"
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.incrementViews(matchId);
    }

    refreshCurrentStream(matchId) {
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
            }, 500);
        }
    }

    // ==================== CORE UTILITIES ====================
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
        return now >= matchTime && now <= (matchTime + 7200);
    }

    classifySport(match) {
        const sportFromApi = match.sport || 'Other';
        const sportMap = {
            'football': 'Football', 'soccer': 'Football',
            'basketball': 'Basketball', 'baseball': 'Baseball',
            'tennis': 'Tennis', 'cricket': 'Cricket', 'rugby': 'Rugby'
        };
        return sportMap[sportFromApi.toLowerCase()] || sportFromApi;
    }

    formatTeamNames(teamString) {
        return teamString.replace(/ - /g, ' vs ');
    }

    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    getTeamName(teamString, index) {
        const teams = teamString.split(' - ');
        return teams[index] || `Team ${index + 1}`;
    }

    incrementViews(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) stats.views++;
    }

    handleLike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.likes++;
            this.showMatchDetails(matchId);
        }
    }

    handleDislike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.dislikes++;
            this.showMatchDetails(matchId);
        }
    }

    handleShare(matchId) {
        alert('Share feature coming soon!');
    }

    handleLikeTV() {
        alert('Like feature coming soon for TV!');
    }

    handleShareTV() {
        alert('Share feature coming soon for TV!');
    }

    showCommunity() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
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
                </div>
            </div>
        `;
        this.hideStats();
    }

    // ==================== ANALYTICS & UI ====================
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
        document.getElementById('countries').textContent = '22';
        document.getElementById('uptime').textContent = '100%';
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }

    refreshCurrentView() {
        if (this.currentView === 'sports') this.showSportsDataUI();
        else if (this.currentView === 'matches') this.showMatchesView();
    }

    // ==================== TV CHANNELS UTILS ====================
    getCountryFlag(country) {
        const flags = {
            'South Africa': '🇿🇦', 'USA': '🇺🇸', 'UK': '🇬🇧',
            'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Ireland': '🇮🇪',
            'Germany': '🇩🇪', 'France': '🇫🇷', 'Spain': '🇪🇸',
            'Italy': '🇮🇹', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱',
            'Canada': '🇨🇦', 'Australia': '🇦🇺', 'New Zealand': '🇳🇿',
            'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'India': '🇮🇳',
            'Pakistan': '🇵🇰', 'Poland': '🇵🇱', 'Romania': '🇷🇴', 'Serbia': '🇷🇸'
        };
        return flags[country] || '🌍';
    }

    getChannelLogo(channelName) {
        if (channelName.includes('SuperSport')) return 'SS';
        if (channelName.includes('FanDuel')) return 'FD';
        if (channelName.includes('ESPN')) return 'ES';
        if (channelName.includes('Fox')) return 'FX';
        if (channelName.includes('Sky')) return 'SK';
        if (channelName.includes('BT')) return 'BT';
        if (channelName.includes('Premier')) return 'PL';
        if (channelName.includes('NBA')) return 'NB';
        if (channelName.includes('Eleven')) return '11';
        if (channelName.includes('SporTV')) return 'ST';
        if (channelName.includes('RTE')) return 'RT';
        return 'TV';
    }

    // ==================== ERROR HANDLING ====================
    setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e);
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise:', e);
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered');
                })
                .catch(error => {
                    console.log('SW failed:', error);
                });
        }
    }

    // ==================== API PROXY HELPERS ====================
    async tryFastProxies() {
        const endpoints = [
            'https://corsproxy.io/?https://topembed.pw/api.php?format=json',
            'https://api.allorigins.win/raw?url=https://topembed.pw/api.php?format=json'
        ];

        for (let endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, { 
                    signal: AbortSignal.timeout(5000) 
                });
                if (response.ok) return await response.json();
            } catch (error) {
                continue;
            }
        }
        return null;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 9kilos Bulletproof System Starting...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos Fully Operational!');
        });
    } catch (error) {
        console.error('❌ Critical Error:', error);
    }
});
