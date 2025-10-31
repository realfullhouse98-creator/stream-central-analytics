// 9kilo Stream - Complete Working Version
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.currentStreams = new Map();
        
        // TV Channels State
        this.currentCountry = '';
        this.currentTVChannel = null;
        this.tvChannelsData = null;
        
        // Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000;
        
        // Caching
        this.preloadedSports = null;
        this.showLiveOnly = false;
        this.isDOMReady = false;
        
        console.log('🚀 MatchScheduler initialized!');
    }
    
    async init() {
        await this.waitForDOMReady();
        this.setupEventListeners();
        this.showMainMenu();
        
        // Start preloading in background
        this.backgroundPreload();
    }

    // ==================== TV CHANNELS ====================
    async getTVChannelsData() {
        try {
            const response = await fetch('tv-channels.json');
            return await response.json();
        } catch (error) {
            console.error('TV channels load failed:', error);
            return {};
        }
    }

    async showTVChannels() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        try {
            const tvData = await this.getTVChannelsData();
            
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
                                <div class="channel-count">${channels.length} channels</div>
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
                        <h3>Unable to load TV channels</h3>
                        <button class="retry-btn" onclick="matchScheduler.showTVChannels()">Retry</button>
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
                        <p>${channels.length} channels available</p>
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
                            <button class="back-btn" onclick="matchScheduler.showCountryChannels('${country}')">← Back</button>
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
                                <div class="video-player">
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

    getCountryFlag(country) {
        const flags = {
            'South Africa': '🇿🇦', 'USA': '🇺🇸', 'UK': '🇬🇧',
            'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Ireland': '🇮🇪',
            'Germany': '🇩🇪', 'France': '🇫🇷', 'Spain': '🇪🇸',
            'Italy': '🇮🇹', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱',
            'Canada': '🇨🇦', 'Australia': '🇦🇺', 'New Zealand': '🇳🇿',
            'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'India': '🇮🇳'
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
        return 'TV';
    }

    // ==================== EVENT LISTENERS ====================
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
        // Menu buttons
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            const action = menuButton.getAttribute('data-action');
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

        // Home button
        const homeButton = e.target.closest('.home-button');
        if (homeButton) {
            this.showMainMenu();
            return;
        }

        // Back button
        const backButton = e.target.closest('.top-back-button');
        if (backButton) {
            this.handleBackButton();
            return;
        }

        // Sports navigation
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
            case 'sports':
            case 'tv-countries':
                this.showMainMenu();
                break;
            case 'dates':
                this.showSportsView();
                break;
            case 'matches':
                this.showDatesView();
                break;
            case 'tv-channels':
                this.showCountriesView();
                break;
            case 'tv-player':
                this.showCountryChannels(this.currentCountry);
                break;
            default:
                this.showMainMenu();
        }
    }

    // ==================== SPORTS FUNCTIONALITY ====================
    showSportsView() {
        // INSTANT UI UPDATE
        this.showSportsUIWithCachedData();
        
        // Load fresh data in background
        this.loadSportsDataBackground();
    }

    showSportsUIWithCachedData() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        let sportsHTML;
        
        if (this.preloadedSports && this.preloadedSports.length > 0) {
            // SHOW ACTUAL SPORTS CATEGORIES IMMEDIATELY
            const sports = this.preloadedSports.map(sport => ({
                id: sport,
                name: sport,
                count: 'Loading...'
            }));
            
            sportsHTML = sports.map(sport => `
                <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                    <div class="sport-name">${sport.name}</div>
                    <div class="match-count">${sport.count}</div>
                </div>
            `).join('');
        } else {
            // FALLBACK LOADING STATES
            sportsHTML = `
                <div class="sport-button" style="opacity: 0.7;">
                    <div class="sport-name">Football</div>
                    <div class="match-count">Loading...</div>
                </div>
                <div class="sport-button" style="opacity: 0.7;">
                    <div class="sport-name">Basketball</div>
                    <div class="match-count">Loading...</div>
                </div>
                <div class="sport-button" style="opacity: 0.7;">
                    <div class="sport-name">Tennis</div>
                    <div class="match-count">Loading...</div>
                </div>
            `;
        }
        
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
        
        this.hideStats();
        this.currentView = 'sports';
    }

    async loadSportsDataBackground() {
        try {
            const success = await this.ensureDataLoaded();
            if (success && this.currentView === 'sports') {
                this.showSportsDataUI();
            }
        } catch (error) {
            console.log('Background data loading failed');
        }
    }

    showSportsDataUI() {
        if (!this.verifiedMatches || this.verifiedMatches.length === 0) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container || this.currentView !== 'sports') return;
        
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

    // ==================== DATA LOADING ====================
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

    async loadMatches() {
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('📦 Using cached data');
            this.organizeMatches(cachedData);
            return;
        }
        
        try {
            const apiData = await this.tryAllProxies();
            this.organizeMatches(apiData);
            this.cacheData(apiData);
        } catch (error) {
            console.warn('All API attempts failed:', error);
            this.useFallbackData();
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
        const targetUrl = 'https://topembed.pw/api.php?format=json';
        
        const proxyOptions = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];
        
        for (const proxyUrl of proxyOptions) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                
                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn(`Proxy failed: ${proxyUrl}`, error);
                continue;
            }
        }
        
        throw new Error('All proxy attempts failed');
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
        this.organizeMatches(sampleMatches);
    }

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
            this.showSportsDataUI();
        }
    }

    extractAndCacheSports(apiData) {
        if (!apiData?.events) return;
        
        const sports = new Set();
        Object.values(apiData.events).forEach(matches => {
            matches.forEach(match => {
                if (match?.sport) {
                    const sport = this.classifySport(match);
                    sports.add(sport);
                }
            });
        });
        
        this.preloadedSports = Array.from(sports);
    }

    // ==================== SPORTS NAVIGATION ====================
    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }

    async showDatesView() {
        await this.ensureDataLoaded();
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
        await this.ensureDataLoaded();
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
        await this.ensureDataLoaded();
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
                        <button class="back-btn" onclick="matchScheduler.showMatchesView()">← Back</button>
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
                            <div class="video-player">
                                ${currentStreamUrl ? 
                                    `<iframe src="${currentStreamUrl}" class="stream-iframe"
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
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.incrementViews(matchId);
    }

    refreshCurrentStream(matchId) {
        // Simple refresh - reload the iframe
        const iframe = document.querySelector('.stream-iframe');
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
            }, 500);
        }
    }

    // ==================== UTILITY METHODS ====================
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

    incrementViews(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) stats.views++;
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
        document.getElementById('countries').textContent = '22';
        document.getElementById('uptime').textContent = '100%';
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }

    backgroundPreload() {
        setTimeout(() => {
            this.loadMatches().catch(() => {});
        }, 1000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM fully loaded, initializing MatchScheduler...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos fully initialized!');
        });
    } catch (error) {
        console.error('❌ Initialization failed:', error);
    }
});
