// 9kilo Stream - Enhanced Sports Classification
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
        
        // Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Filter state
        this.showLiveOnly = false;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 MatchScheduler initialized!');
        this.showMainMenu();
        this.setupEventListeners();
        this.registerServiceWorker();
    }

    // ==================== EVENT LISTENERS SETUP ====================
    setupEventListeners() {
        // Use event delegation for better performance
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sports-button')) {
                this.showSportsView();
            }
            else if (e.target.closest('.tv-button')) {
                this.showTVChannels();
            }
            else if (e.target.closest('.community')) {
                this.showCommunity();
            }
        });
        
        // Mouseover for sports preloading
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.sports-button')) {
                this.preloadSportsData();
            }
        });
        
        console.log('✅ Event listeners setup complete');
    }
    
    // Safe Service Worker Registration for GitHub Pages
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
    
    // ==================== ENHANCED SPORTS CLASSIFICATION ====================
    classifySport(match) {
        // First check if it's a college football match by team names/tournament
        if (this.isCollegeFootball(match)) {
            console.log(`🔄 Manual reclassification to American Football: "${match.match}"`);
            return 'American Football';
        }
        
        // Then use the sport field from API with simple normalization
        const sportFromApi = match.sport || 'Other';
        const normalizedSport = this.normalizeSportName(sportFromApi);
        
        console.log(`✅ Using API sport: "${sportFromApi}" -> "${normalizedSport}" for "${match.match}"`);
        return normalizedSport;
    }

    isCollegeFootball(match) {
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        const collegeFootballIndicators = [
            'middle tennessee', 'jacksonville state', 'college football', 
            'ncaa football', 'fbs', 'fcs', 'bowl game', 'cotton bowl',
            'rose bowl', 'orange bowl', 'sugar bowl'
        ];
        
        return collegeFootballIndicators.some(indicator => 
            searchString.includes(indicator)
        );
    }

    normalizeSportName(sport) {
        if (!sport) return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        
        // Simple mapping for common variations
        const sportMap = {
            // Basic sport normalization
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
            
            // ==================== MANUAL FIXES ====================
            // American Football fixes
            'american football': 'American Football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            'nfl': 'American Football',
            
            // Add any other misclassified sports here as you find them
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'beach volleyball': 'Beach Volleyball'
        };
        
        // Simple lookup - if found in map, use it, otherwise capitalize
        return sportMap[sportLower] || sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
    }
    
    getSportDisplayName(sport) {
        return sport || 'Sports';
    }
    
    // ==================== ENHANCED BULLETPROOF NAVIGATION ====================
    async showSportsView() {
        console.log('🎯 Sports button clicked - Enhanced bulletproof version');
        
        // 1. IMMEDIATE UI Response (under 100ms)
        this.showSportsLoadingUI();
        
        // 2. Set a safety timeout - never get stuck loading
        const safetyTimeout = setTimeout(() => {
            console.log('⚡ Safety timeout: Showing available data');
            this.showSportsDataUI(); // Show whatever we have
        }, 3000); // 3 second max wait
        
        // 3. Try to load fresh data
        try {
            const success = await this.ensureDataLoaded();
            clearTimeout(safetyTimeout); // Cancel timeout if successful
            
            if (success) {
                console.log('✅ Data loaded successfully');
                this.showSportsDataUI();
            } else {
                console.log('⚠️ Using cached/fallback data');
                this.showSportsDataUI(); // Still show UI with available data
            }
        } catch (error) {
            clearTimeout(safetyTimeout);
            console.log('🛡️ Error handled gracefully:', error.message);
            this.showSportsDataUI(); // UI always works, even with errors
        }
    }

    showSportsLoadingUI() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Sports Categories</h2>
                    <p>Loading sports data...</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" style="opacity: 0.7; cursor: wait;">
                        <div class="sport-name">Loading Sports</div>
                        <div class="match-count">Please wait a moment</div>
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
        
        // Create sports list with counts
        const sports = uniqueSports.map(sportId => {
            const count = this.getMatchesBySport(sportId).length;
            return {
                id: sportId,
                name: sportId, // Just use the sport name directly
                count: count
            };
        }).filter(sport => sport.count > 0)
          .sort((a, b) => b.count - a.count);

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Sports Categories</h2>
                    <p>${uniqueSports.length} categories • ${this.verifiedMatches.length} total matches</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <div class="match-count">${sport.count} match${sport.count !== 1 ? 'es' : ''}</div>
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
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Sports Categories</h2>
                    <p>No sports data available</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="matchScheduler.retryLoadMatches()" style="cursor: pointer;">
                        <div class="sport-name">Retry Loading</div>
                        <div class="match-count">Click to refresh data</div>
                    </div>
                </div>
            </div>
        `;
    }

    retryLoadMatches() {
        this.isDataLoaded = false;
        this.showSportsView();
    }
    
    // ==================== SIMPLIFIED DATA LOADING ====================
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
        this.organizeMatches(sampleMatches);
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
                        const matchId = this.generateMatchId(match);
                        
                        if (!this.matchStats.has(matchId)) {
                            this.matchStats.set(matchId, {
                                views: Math.floor(Math.random() * 10000) + 500,
                                likes: Math.floor(Math.random() * 500) + 50,
                                dislikes: Math.floor(Math.random() * 100) + 10
                            });
                        }
                        
                        const channels = match.channels || [];
                        if (channels.length > 0 && !this.currentStreams.has(matchId)) {
                            this.currentStreams.set(matchId, 0);
                        }
                        
                        const processedMatch = {
                            id: matchId,
                            date: date,
                            time: this.convertUnixToLocalTime(match.unix_timestamp),
                            teams: match.match,
                            league: match.tournament || 'Sports',
                            streamUrl: channels[0] || null,
                            channels: channels,
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
        
        // Log simple sports classification results
        const sportsCount = {};
        this.verifiedMatches.forEach(match => {
            sportsCount[match.sport] = (sportsCount[match.sport] || 0) + 1;
        });
        console.log('🏆 Simple Sports Classification:', sportsCount);
        
        if (this.currentView !== 'main') {
            this[`show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`]();
        }
    }

    // ==================== UI METHODS ====================
    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">${this.isDataLoaded ? this.verifiedMatches.length + ' matches' : 'Games & schedules'}</div>
                    </div>
                    <div class="menu-button tv-button">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                    <div class="menu-button community">
                        <div class="button-title">COMMUNITY</div>
                        <div class="button-subtitle">Fan discussions</div>
                    </div>
                </div>
                ${!this.isDataLoaded ? `
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: var(--text-muted); font-size: 0.8em;">
                            ⚡ Optimized Loading • Data loads on demand
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
    }
    
    async showDatesView() {
        await this.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.currentSport;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showSportsView()">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName}</h2>
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
    
    async showMatchesView() {
        await this.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.currentSport;
        const displayDate = this.formatDisplayDate(this.currentDate);
        
        const filteredMatches = this.showLiveOnly ? matches.filter(match => match.isLive) : matches;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showDatesView()">←</button>
                </div>
                <div class="section-header">
                    <h2>Schedule</h2>
                    <p>${displayDate}</p>
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
    
    toggleLiveFilter() {
        this.showLiveOnly = !this.showLiveOnly;
        this.showMatchesView();
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
    
    async showMatchDetails(matchId) {
        await this.ensureDataLoaded();
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const channels = match.channels || [];
        const currentChannelIndex = this.currentStreams.get(matchId) || 0;
        const currentStreamUrl = channels[currentChannelIndex] || null;
        
        const channelSelectorHTML = this.generateChannelSelector(channels, matchId);
        
        const container = document.getElementById('dynamic-content');
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
                                ${channels.length > 1 ? `<span style="color: var(--accent-gold);">• ${channels.length} sources</span>` : ''}
                                ${channelSelectorHTML}
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
                                    ${channels.length > 1 ? `Multiple streaming sources available.` : ''}
                                    ${this.verifiedMatches.length < 5 ? '<br><br><em>Research Mode: Demo data active</em>' : ''}
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
    
    generateChannelSelector(channels, matchId) {
        const currentChannelIndex = this.currentStreams.get(matchId) || 0;
        const hasMultipleChannels = channels.length > 1;
        
        if (!hasMultipleChannels || channels.length === 0) {
            return '';
        }
        
        if (channels.length <= 2) {
            return `
                <div class="channel-buttons-inline">
                    ${channels.map((channel, index) => `
                        <button class="channel-btn-inline ${index === currentChannelIndex ? 'active' : ''}" 
                                onclick="matchScheduler.switchChannel('${matchId}', ${index})">
                            Source ${index + 1}
                        </button>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="channel-dropdown-inline">
                <button class="channel-dropdown-btn-inline" onclick="matchScheduler.toggleDropdown('${matchId}')">
                    Source ${currentChannelIndex + 1} of ${channels.length}
                </button>
                <div class="channel-dropdown-content-inline" id="dropdown-${matchId}">
                    ${channels.map((channel, index) => `
                        <div class="channel-dropdown-item-inline ${index === currentChannelIndex ? 'active' : ''}" 
                             onclick="matchScheduler.switchChannel('${matchId}', ${index})">
                            Source ${index + 1}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    switchChannel(matchId, channelIndex) {
        this.currentStreams.set(matchId, channelIndex);
        this.showMatchDetails(matchId);
    }
    
    toggleDropdown(matchId) {
        const dropdown = document.getElementById(`dropdown-${matchId}`);
        const button = document.querySelector(`#dropdown-${matchId}`).previousElementSibling;
        
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            button.classList.remove('open');
        } else {
            document.querySelectorAll('.channel-dropdown-content-inline.show').forEach(dd => {
                dd.classList.remove('show');
                dd.previousElementSibling.classList.remove('open');
            });
            
            dropdown.classList.add('show');
            button.classList.add('open');
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
    
    // ==================== UTILITY METHODS ====================
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
    
    showTVChannels() {
        console.log('📺 TV Channels button clicked!');
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>TV Channels</h2>
                    <p>24/7 live streams</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="alert('Sky Sports - Coming soon!')">
                        <div class="sport-name">Sky Sports</div>
                    </div>
                    <div class="sport-button" onclick="alert('ESPN - Coming soon!')">
                        <div class="sport-name">ESPN</div>
                    </div>
                </div>
            </div>
        `;
        this.hideStats();
    }
    
    showCommunity() {
        console.log('👥 Community button clicked!');
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
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
        return now >= matchTime && now <= (matchTime + 7200);
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
    
    showStats() {
        document.querySelector('.analytics-overview').style.display = 'grid';
    }
    
    hideStats() {
        document.querySelector('.analytics-overview').style.display = 'none';
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
    
    async preloadSportsData() {
        if (this.isDataLoaded || this.isLoading) return;
        
        setTimeout(async () => {
            try {
                await this.loadMatches();
            } catch (error) {
                // Silent fail
            }
        }, 500);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
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
