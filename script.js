// 9kilo Stream - MODULAR ARCHITECTURE VERSION
class MatchScheduler {
    constructor() {
        // Initialize modules
        this.sportsClassifier = new SportsClassifier();
        this.dataFusion = new DataFusion();
        this.uiManager = new UIManager(this);
        this.streamManager = new StreamManager();
        
        // Core state
        this.allMatches = [];
        this.verifiedMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.showLiveOnly = false;
        
        // TV Channels State
        this.currentCountry = '';
        this.currentTVChannel = null;
        this.tvChannelsData = null;
        
        // Analytics
        this.matchStats = new Map();
        this.matchPolls = new Map();
        
        // Loading state
        this.isDataLoaded = false;
        this.isLoading = false;
        this.isDOMReady = false;
        
        console.log('🚀 MatchScheduler initialized with modular architecture!');
    }

    async init() {
        await Utils.waitForDOMReady();
        Utils.setupGlobalErrorHandling();
        this.setupEventListeners();
        this.uiManager.showMainMenu();
        Utils.registerServiceWorker();
        
        // Load TV channels data
        await this.loadTVChannelsData();
        
        // Start preloading in background
        this.backgroundPreload();
    }

    async loadTVChannelsData() {
        this.tvChannelsData = await this.dataFusion.loadTVChannelsData();
        console.log('✅ TV Channels data loaded:', Object.keys(this.tvChannelsData).length, 'countries');
    }

    getTVChannelsData() {
        return this.tvChannelsData || this.dataFusion.getDefaultTVChannels();
    }

    // ==================== TV CHANNELS NAVIGATION ====================
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
                            <div class="country-flag">${Utils.getCountryFlag(country)}</div>
                            <div class="country-name">${country}</div>
                            <div class="channel-count">${channels.length} channels</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.uiManager.hideStats();
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
        
        this.uiManager.hideStats();
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
        
        this.uiManager.hideStats();
        this.currentView = 'tv-player';
    }

    // ==================== EVENT HANDLERS ====================
    setupEventListeners() {
        Utils.waitForDOMReady().then(() => {
            console.log('🎯 Setting up enhanced event listeners...');
            
            // Mouseover for sports preloading
            document.addEventListener('mouseover', (e) => {
                if (e.target.closest('.sports-button')) {
                    this.preloadSportsData();
                }
            });

            // Global click handler
            document.addEventListener('click', (e) => {
                this.handleGlobalClick(e);
            });

            console.log('✅ Enhanced event listeners setup complete');
        });
    }

    handleGlobalClick(e) {
        // Menu buttons
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = menuButton.getAttribute('data-action');
            console.log(`🎯 Menu button: ${action}`);
            
            switch(action) {
                case 'sports':
                    this.uiManager.showSportsView();
                    break;
                case 'tv':
                    this.showTVChannels();
                    break;
                case 'community':
                    this.uiManager.showCommunity();
                    break;
            }
            return;
        }

        // Navigation buttons
        const homeButton = e.target.closest('.home-button');
        if (homeButton) {
            e.preventDefault();
            e.stopPropagation();
            this.uiManager.showMainMenu();
            return;
        }

        const backButton = e.target.closest('.top-back-button');
        if (backButton) {
            e.preventDefault();
            e.stopPropagation();
            this.uiManager.handleBackButton();
            return;
        }

        // Match details back button
        const matchBackBtn = e.target.closest('.back-btn');
        if (matchBackBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.uiManager.handleBackButton();
            return;
        }

        // Filter buttons
        const filterButton = e.target.closest('.filter-btn');
        if (filterButton) {
            e.preventDefault();
            e.stopPropagation();
            const filterType = filterButton.getAttribute('data-filter');
            this.setFilter(filterType);
            return;
        }
    }

    // ==================== CORE METHODS ====================
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
        console.log('🔄 loadMatches called...');
        
        try {
            const apiData = await this.dataFusion.loadMatches();
            this.organizeMatches(apiData);
        } catch (error) {
            console.warn('All API attempts failed:', error);
            this.useFallbackData();
        }
    }

    organizeMatches(apiData) {
        if (!apiData || typeof apiData !== 'object' || !apiData.events) {
            this.useFallbackData();
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match?.match) {
                        const matchId = Utils.generateMatchId(match);
                        
                        if (!this.matchStats.has(matchId)) {
                            this.matchStats.set(matchId, {
                                views: Math.floor(Math.random() * 10000) + 500,
                                likes: Math.floor(Math.random() * 500) + 50,
                                dislikes: Math.floor(Math.random() * 100) + 10
                            });
                        }
                        
                        const channels = match.channels || [];
                        if (channels.length > 0 && !this.streamManager.currentStreams.has(matchId)) {
                            this.streamManager.currentStreams.set(matchId, 0);
                        }
                        
                        const processedMatch = {
                            id: matchId,
                            date: date,
                            time: Utils.convertUnixToLocalTime(match.unix_timestamp),
                            teams: match.match,
                            league: match.tournament || 'Sports',
                            streamUrl: channels[0] || null,
                            channels: channels,
                            isLive: Utils.checkIfLive(match),
                            sport: this.sportsClassifier.classifySport(match),
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
            this.refreshCurrentView();
        }
    }

    useFallbackData() {
        const fallbackData = this.dataFusion.useFallbackData();
        this.organizeMatches(fallbackData);
    }

    refreshCurrentView() {
        const viewMethod = `show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`;
        if (this.uiManager[viewMethod]) {
            this.uiManager[viewMethod]();
        }
    }

    // ==================== MATCH DETAILS ====================
    async showMatchDetails(matchId) {
        console.log('🎯 showMatchDetails called');
        this.currentView = 'match-details';
        
        await this.ensureDataLoaded();
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const formattedTeams = Utils.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const channels = match.channels || [];
        const currentChannelIndex = this.streamManager.getCurrentChannelIndex(matchId);
        let currentStreamUrl = channels[currentChannelIndex] || null;

        // If this is a Streamed API URL, get the actual stream URL
        if (currentStreamUrl && currentStreamUrl.includes('streamed.pk/api/stream')) {
            console.log('🔄 Detected Streamed API URL, fetching actual stream...');
            currentStreamUrl = await this.streamManager.getStreamUrlFromStreamed(currentStreamUrl);
        }
        
        const channelSelectorHTML = this.streamManager.generateChannelSelector(channels, matchId, currentChannelIndex);
        
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
                                <span class="views-count">${Utils.formatNumber(stats.views)} views</span>
                                ${match.isLive ? '<span class="live-badge-details">LIVE NOW</span>' : ''}
                                <span style="color: var(--text-muted);">• ${match.league}</span>
                                ${channels.length > 1 ? `<span style="color: var(--accent-gold);">• ${channels.length} sources</span>` : ''}
                                ${channelSelectorHTML}
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn like-btn" onclick="matchScheduler.handleLike('${matchId}')">
                                    👍 ${Utils.formatNumber(stats.likes)}
                                </button>
                                <button class="action-btn dislike-btn" onclick="matchScheduler.handleDislike('${matchId}')">
                                    👎 ${Utils.formatNumber(stats.dislikes)}
                                </button>
                                <button class="action-btn" onclick="matchScheduler.handleShare('${matchId}')">
                                    Share
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    <strong>Match Info:</strong> ${Utils.getTeamName(match.teams, 0)} vs ${Utils.getTeamName(match.teams, 1)} in ${match.league}. 
                                    ${match.isLive ? 'Live now!' : `Scheduled for ${match.time} on ${Utils.formatDisplayDate(match.date)}.`}
                                    ${channels.length > 1 ? `Multiple streaming sources available.` : ''}
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
        this.uiManager.hideStats();
        this.incrementViews(matchId);
    }

    // ==================== STREAM MANAGEMENT ====================
    switchChannel(matchId, channelIndex) {
        this.streamManager.switchChannel(matchId, channelIndex);
        this.showMatchDetails(matchId);
    }

    toggleDropdown(matchId) {
        this.streamManager.toggleDropdown(matchId);
    }

    refreshCurrentStream(matchId) {
        this.streamManager.refreshCurrentStream(matchId);
    }

    // ==================== SPORTS NAVIGATION ====================
    selectSport(sport) {
        this.currentSport = sport;
        this.uiManager.showDatesView();
    }

    selectDate(date) {
        this.currentDate = date;
        this.uiManager.showMatchesView();
    }

    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport === sport);
    }

    getMatchesBySportAndDate(sport, date) {
        return this.getMatchesBySport(sport).filter(match => match.date === date);
    }

    // ==================== FILTER SYSTEM ====================
    setFilter(type) {
        this.showLiveOnly = (type === 'live');
        this.uiManager.showMatchesView();
    }

    // ==================== ANALYTICS & STATS ====================
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

    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        const totalViewers = this.verifiedMatches.reduce((sum, match) => {
            const stats = this.matchStats.get(match.id);
            return sum + (stats ? stats.views : 0);
        }, 0);
        
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('live-viewers').textContent = Utils.formatNumber(Math.floor(totalViewers / 100));
        document.getElementById('countries').textContent = this.verifiedMatches.length < 5 ? '3' : '1';
        document.getElementById('uptime').textContent = this.verifiedMatches.length < 5 ? 'Research' : '100%';
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }

    // ==================== PERFORMANCE OPTIMIZATION ====================
    backgroundPreload() {
        setTimeout(() => {
            this.preloadSportsData().catch(() => {});
        }, 1000);
    }

    async preloadSportsData() {
        if (this.isDataLoaded || this.isLoading) return;
        
        this.isLoading = true;
        try {
            const cachedData = this.dataFusion.getCachedData();
            if (cachedData) {
                this.sportsClassifier.extractSportsFromData(cachedData);
                return;
            }
            
            const fastData = await this.dataFusion.tryFastProxies();
            if (fastData) {
                this.sportsClassifier.extractSportsFromData(fastData);
                this.dataFusion.cacheData(fastData);
            }
        } catch (error) {
            // Silent fail
        } finally {
            this.isLoading = false;
        }
    }

    retryLoadMatches() {
        this.isDataLoaded = false;
        this.uiManager.showSportsView();
    }

    // ==================== UTILITY METHODS ====================
    formatTeamNames(teamString) {
        return Utils.formatTeamNames(teamString);
    }

    formatDisplayDate(dateString) {
        return Utils.formatDisplayDate(dateString);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM fully loaded, initializing MatchScheduler with modular architecture...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos with modular architecture fully initialized!');
        }).catch(error => {
            console.error('❌ Initialization failed:', error);
        });
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.channel-dropdown-inline')) {
        document.querySelectorAll('.channel-dropdown-content-inline.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            dropdown.previousElementSibling.classList.remove('open');
        });
    }
});
