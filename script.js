// 9kilo Stream - FINAL BULLETPROOF VERSION WITH PROFESSIONAL STYLING
// 🚨 IMPORTANT: DO NOT MODIFY THIS SIMPLIFIED DESIGN - Optimized for TikTok-brain users

// ==================== API CONFIG ====================
const API_CONFIG = {
    STREAMED: {
        BASE_URL: 'https://streamed.pk/api',
        ENDPOINTS: {
            ALL_MATCHES: '/matches/all',
            LIVE_MATCHES: '/matches/live',
            TODAY_MATCHES: '/matches/all-today',
            SPORT_MATCHES: '/matches/{sport}',
            STREAMS: '/stream/{source}/{id}',
            SPORTS: '/sports'
        }
    },
    TOPEMBED: {
        BASE_URL: 'https://topembed.pw',
        ENDPOINTS: {
            ALL_MATCHES: '/api.php?format=json'
        }
    }
};
window.API_CONFIG = API_CONFIG;

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
        
        // Source selection state
        this.selectedSource = localStorage.getItem('9kilos-selected-source') || 'tom-0';
        
        // Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000;
        
        // Caching
        this.preloadedSports = null;
        this.lastDataUpdate = null;
        
        // Filter state - SIMPLE BOOLEAN ONLY
        this.showLiveOnly = false; // false = All Matches, true = Live Only
        
        // DOM ready state
        this.isDOMReady = false;
        
        console.log('🚀 MatchScheduler initialized with Bulletproof Features!');
    }
    
    async init() {
        await this.waitForDOMReady();
        this.setupGlobalErrorHandling();
        this.setupEventListeners();
        this.showMainMenu(); // ✅ FIXED: Calling the main menu function
        this.registerServiceWorker();
        
        // Load TV channels data
        await this.loadTVChannelsData();
        
        // Start preloading in background
        this.backgroundPreload();
    }

    // ==================== STREAMED.PK API METHODS ====================
    async fetchStreamedPkMatches(sport = 'all') {
        try {
            const endpoint = sport === 'all' ? 
                API_CONFIG.STREAMED.ENDPOINTS.ALL_MATCHES :
                API_CONFIG.STREAMED.ENDPOINTS.SPORT_MATCHES.replace('{sport}', sport);
            
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(API_CONFIG.STREAMED.BASE_URL + endpoint)}`;
            
            const response = await fetch(proxyUrl, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('Streamed.pk matches API unavailable:', error);
            return [];
        }
    }

    // ==================== STREAMED.PK URL GENERATION ====================
    async getAllSourcesForMatch(match) {
        const sources = [];
        
        // 1. Tom's streams (from Topembed.pw - working)
        if (match.channels && match.channels.length > 0) {
            match.channels.forEach((channel, index) => {
                sources.push({
                    value: `tom-${index}`,
                    label: `<span class="source-option"><span class="circle-icon tom-icon"></span> tom ${index + 1}</span>`,
                    url: channel
                });
            });
        }
        
        // 2. Sarah's streams - SIMPLE & SCALABLE VERSION
        try {
            console.log('🔄 Getting Streamed.pk matches for:', match.teams);
            const streamedMatches = await this.fetchStreamedPkMatches('football');
            console.log('📦 Found', streamedMatches.length, 'matches from Streamed.pk');
            
            const matchingMatch = this.findMatchingStreamedPkMatch(match, streamedMatches);
            
            if (matchingMatch) {
                console.log('✅ FOUND MATCH:', matchingMatch.title);
                console.log('🔧 Sources available:', matchingMatch.sources);
                
                let sarahStreamNumber = 0;
                
                // Loop through each source and add multiple streams
                matchingMatch.sources.forEach((source) => {
                    // Add stream 1 for this source
                    sources.push({
                        value: `sarah-${sarahStreamNumber}`,
                        label: `<span class="source-option"><span class="circle-icon sarah-icon"></span> sarah ${sarahStreamNumber + 1}</span>`,
                        url: `https://embedsports.top/embed/${source.source}/${source.id}/1`
                    });
                    sarahStreamNumber++;
                    
                    // Add stream 2 for this source
                    sources.push({
                        value: `sarah-${sarahStreamNumber}`,
                        label: `<span class="source-option"><span class="circle-icon sarah-icon"></span> sarah ${sarahStreamNumber + 1}</span>`,
                        url: `https://embedsports.top/embed/${source.source}/${source.id}/2`
                    });
                    sarahStreamNumber++;
                    
                    // Add stream 3 for this source
                    sources.push({
                        value: `sarah-${sarahStreamNumber}`,
                        label: `<span class="source-option"><span class="circle-icon sarah-icon"></span> sarah ${sarahStreamNumber + 1}</span>`,
                        url: `https://embedsports.top/embed/${source.source}/${source.id}/3`
                    });
                    sarahStreamNumber++;
                });
                
                console.log(`🔢 Created ${sarahStreamNumber} Sarah streams`);
            } else {
                console.log('❌ No matching Streamed.pk match found for:', match.teams);
            }
        } catch (error) {
            console.log('🚨 Sarah streams error:', error);
        }
        
        console.log('📊 FINAL COUNT: Tom streams =', sources.filter(s => s.value.startsWith('tom-')).length, 
                        '| Sarah streams =', sources.filter(s => s.value.startsWith('sarah-')).length);
        return sources;
    }

    findMatchingStreamedPkMatch(ourMatch, streamedMatches) {
        // Convert "Brentford - Newcastle United" to "Brentford vs Newcastle United"
        const ourTeams = ourMatch.teams.toLowerCase().replace(/ - /g, ' vs ');
        console.log('🔍 Looking for match:', ourTeams);
        
        const ourTeamNames = ourTeams.split(' vs ').map(team => 
            team.trim().toLowerCase()
        );
        
        return streamedMatches.find(streamedMatch => {
            if (!streamedMatch.title) return false;
            
            const streamedTitle = streamedMatch.title.toLowerCase();
            
            // Method 1: Exact match with converted team names
            if (streamedTitle === ourTeams) {
                console.log('✅ Exact title match!');
                return true;
            }
            
            // Method 2: Team name matching (more flexible)
            const allTeamsMatch = ourTeamNames.every(ourTeam => 
                streamedTitle.includes(ourTeam)
            );
            
            if (allTeamsMatch) {
                console.log('✅ All teams match found!');
                return true;
            }
            
            // Method 3: Check if Streamed.pk has team data
            if (streamedMatch.teams && streamedMatch.teams.home && streamedMatch.teams.away) {
                const homeTeam = streamedMatch.teams.home.name.toLowerCase();
                const awayTeam = streamedMatch.teams.away.name.toLowerCase();
                const streamedTeamString = `${homeTeam} vs ${awayTeam}`;
                
                if (streamedTeamString === ourTeams) {
                    console.log('✅ Team data match!');
                    return true;
                }
            }
            
            return false;
        });
    }

    // ==================== TV CHANNELS DATA ====================
    async loadTVChannelsData() {
        try {
            // Using a simple API for the demo to load the data structure
            const response = await fetch('tv-channels.json');
            this.tvChannelsData = await response.json();
            console.log('✅ TV Channels data loaded:', Object.keys(this.tvChannelsData).length, 'countries');
        } catch (error) {
            console.error('❌ Failed to load TV channels data:', error);
            // Fallback to minimal data
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
                            
                            <div class="match-description" style="width: fit-content; max-width: 100%;">
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

    // ==================== MAIN NAVIGATION UI (The main menu) ====================
    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) {
            console.error('❌ dynamic-content container not found');
            return;
        }

        // 🛡️ Ensure body class is clean
        document.body.classList.remove('tv-section');
        
        // Inject the main menu HTML
        container.innerHTML = `
            <div class="main-menu-grid">
                
                <div class="menu-button sports-button" data-action="sports" onclick="matchScheduler.showSportsView()">
                    <span class="button-icon">⚽</span>
                    <span class="button-text">Sports Schedule</span>
                    <span class="button-subtext">View all upcoming matches</span>
                </div>

                <div class="menu-button tv-button" data-action="tv" onclick="matchScheduler.showTVChannels()">
                    <span class="button-icon">📺</span>
                    <span class="button-text">Live TV Channels</span>
                    <span class="button-subtext">24/7 Global Live Streams</span>
                </div>

                <a href="https://t.me/your_community_link" target="_blank" class="menu-button community" data-action="community">
                    <span class="button-icon">💬</span>
                    <span class="button-text">Community Chat</span>
                    <span class="button-subtext">Join our Telegram discussion</span>
                </a>
                
                <div class="menu-button settings-button" data-action="settings" onclick="matchScheduler.showSettings()">
                    <span class="button-icon">⚙️</span>
                    <span class="button-text">Settings</span>
                    <span class="button-subtext">Change API Source / Preferences</span>
                </div>

            </div>
        `;

        this.currentView = 'main';
        this.hideStats();
    }
    // =================================================================================

    // ⚠️ PLACEHOLDER FUNCTIONS - Define these if they aren't elsewhere
    showCommunity() {
        console.log("Community link clicked (Telegram link is in the HTML)");
    }

    showSettings() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Settings</h2>
                    <p>Configure Application</p>
                </div>
                <div class="settings-content">
                    <p>Settings UI implementation is required here.</p>
                </div>
            </div>
        `;
        this.currentView = 'settings';
        this.hideStats();
    }
    // ---------------------------------------------------------------------------------
    
    // ==================== ENHANCED EVENT LISTENERS ====================
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
    }

    handleGlobalClick(e) {
        // Menu buttons
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = menuButton.getAttribute('data-action');
            console.log(`🎯 Menu button: ${action}`);
            
            // Note: Actions are primarily handled by inline onclick, but this handles the data-action fallback
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
                case 'settings':
                    this.showSettings();
                    break;
            }
            return;
        }

        // Navigation buttons
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

        // Match details back button
        const matchBackBtn = e.target.closest('.back-btn');
        if (matchBackBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.handleBackButton();
            return;
        }

        // Sports navigation
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
                // ✅ FIXED: Proper date comparison
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

        // BULLETPROOF FILTER BUTTONS
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
            case 'tv-channels': // Added logic for TV channels navigation
            case 'tv-player':
                this.showCountriesView();
                break;
            case 'tv-countries':
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
            case 'settings':
                this.showMainMenu();
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

    // ==================== BULLETPROOF FILTER SYSTEM ====================
    setFilter(type) {
        try {
            // 🛡️ SIMPLE BOOLEAN LOGIC - IMPOSSIBLE TO BREAK
            this.showLiveOnly = (type === 'live');
            this.showMatchesView();
        } catch (error) {
            console.log('🛡️ Filter error - resetting to safe state');
            this.showLiveOnly = false; // Reset to All Matches
            this.showMatchesView();
        }
    }

    // ==================== SIMPLIFIED SPORTS CLASSIFICATION ====================
    classifySport(match) {
        if (this.isCollegeFootball(match)) {
            return 'American Football';
        }
        
        const sportFromApi = match.sport || 'Other';
        const normalizedSport = this.normalizeSportName(sportFromApi);
        
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

    // ==================== SIMPLIFIED SPORTS NAVIGATION ====================
    showSportsView() {
        console.log('🎯 Sports button clicked - Simplified version');
        
        // 1. IMMEDIATE UI Response
        this.showSportsLoadingUI();
        
        // 2. Safety timeout
        const safetyTimeout = setTimeout(() => {
            console.log('⚡ Safety timeout: Showing available data');
            this.showSportsDataUI();
        }, 3000);
        
        // 3. Try to load fresh data
        try {
            const success = this.ensureDataLoaded();
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

        // --- NOTE: Full implementation requires more data loading and rendering logic ---
        // Placeholder for successful loading:
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>Select a sport to view matches</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="matchScheduler.selectSport('Football')"><div class="sport-name">Football</div></div>
                    <div class="sport-button" onclick="matchScheduler.selectSport('Basketball')"><div class="sport-name">Basketball</div></div>
                    <div class="sport-button" onclick="matchScheduler.selectSport('Rugby')"><div class="sport-name">Rugby</div></div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }
    
    // Placeholder functions needed for the class to be complete
    preloadSportsData() { console.log("Preloading sports data..."); }
    ensureDataLoaded() { console.log("Ensuring data is loaded..."); return true; }
    registerServiceWorker() { console.log("Registering service worker..."); }
    hideStats() { 
        // Example implementation for hiding stats/footer if needed
        const footer = document.querySelector('.app-footer');
        if (footer) footer.style.display = (this.currentView === 'main' || this.currentView === 'sports') ? 'flex' : 'none';
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
                    <p>No matches loaded yet.</p>
                </div>
            </div>
        `;
    }
    selectSport(sportName) { 
        this.currentSport = sportName;
        // In a full app, this would trigger loading dates/matches for that sport
        console.log(`Selected sport: ${sportName}. Now showing dates view.`);
        this.showDatesView(); 
    }
    formatDisplayDate(date) { return date; }
    selectDate(date) { 
        this.currentDate = date;
        console.log(`Selected date: ${date}. Now showing matches view.`);
        this.showMatchesView();
    }
    formatTeamNames(teams) { return teams; }
    showMatchDetails(id) { console.log(`Showing match details for ID: ${id}`); }
    showDatesView() { 
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${this.currentSport || 'Sport'} Dates</h2>
                    <p>Select a date</p>
                </div>
                <div class="dates-grid">
                    <div class="date-button" onclick="matchScheduler.selectDate('2025-11-09')"><div class="date-name">Today</div></div>
                    <div class="date-button" onclick="matchScheduler.selectDate('2025-11-10')"><div class="date-name">Tomorrow</div></div>
                    <div class="date-button" onclick="matchScheduler.selectDate('2025-11-11')"><div class="date-name">Mon, Nov 11</div></div>
                </div>
            </div>
        `;
        this.currentView = 'dates';
        this.hideStats();
    }
    showMatchesView() { 
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${this.currentSport || 'Sport'} Matches</h2>
                    <p>Matches for ${this.currentDate || 'selected date'}</p>
                </div>
                <div class="filter-bar">
                    <button class="filter-btn active" data-filter="all" onclick="matchScheduler.setFilter('all')">All</button>
                    <button class="filter-btn" data-filter="live" onclick="matchScheduler.setFilter('live')">Live Only</button>
                </div>
                <div class="matches-list">
                    <div class="match-row">
                        <div class="time">10:00</div>
                        <div class="team-names">Team A - Team B</div>
                        <div class="tournament">Premier League</div>
                        <button class="watch-btn" onclick="matchScheduler.showMatchDetails(123)">Watch</button>
                    </div>
                    <div class="match-row live">
                        <div class="time">LIVE</div>
                        <div class="team-names">Team C - Team D</div>
                        <div class="tournament">Champions League</div>
                        <button class="watch-btn" onclick="matchScheduler.showMatchDetails(456)">Watch</button>
                    </div>
                </div>
            </div>
        `;
        this.currentView = 'matches';
        this.hideStats();
    }
} // <--- END OF CLASS DEFINITION

// ==================== APPLICATION INITIALIZATION (THE CRITICAL PART) ====================
// 🛑 These two lines are absolutely critical. They create the object and call the startup function. 
window.matchScheduler = new MatchScheduler();
window.matchScheduler.init();
