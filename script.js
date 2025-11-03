// 9kilo Stream - COMPLETE WORKING VERSION WITH API FUSION
// ADD AT THE VERY TOP
import { SportsClassifier } from './modules/sports-classifier.js';
import { DataFusion } from './modules/data-fusion.js';  // ← ADD THIS LINE
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

        // ADD THIS LINE - Sports Classifier Module
        this.sportsClassifier = new SportsClassifier();
        this.dataFusion = new DataFusion();  // ← ADD THIS LINE
        
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
        this.lastDataUpdate = null;
        
        // Filter state
        this.showLiveOnly = false;
        
        // DOM ready state
        this.isDOMReady = false;
        
        // ==================== STREAM PERSONALITIES ====================
        this.streamPersonalities = {
            'topembed': { 
                name: 'Tom', 
                color: '#3498db', 
                emoji: '🔵',
                fullName: 'TopEmbed'
            },
            'streamed': { 
                name: 'Sarah', 
                color: '#e74c3c', 
                emoji: '🔴',
                fullName: 'Streamed' 
            },
            'unknown': {
                name: 'Mystery',
                color: '#9b59b6',
                emoji: '🟣', 
                fullName: 'Unknown Source'
            }
        };

         // ADD THIS LINE RIGHT HERE:
    this.sportsClassifier = new SportsClassifier();
    
        
        console.log('🚀 MatchScheduler initialized with Streamed API!');
    }
    
    // ==================== PERSONALITY METHODS ====================
    detectSourceType(streamUrl) {
        if (!streamUrl) return 'unknown';
        if (streamUrl.includes('topembed')) return 'topembed';
        if (streamUrl.includes('streamed.pk')) return 'streamed';
        return 'unknown';
    }

    generatePersonalityLabel(sourceType, index) {
        const personality = this.streamPersonalities[sourceType] || this.streamPersonalities['unknown'];
        return `${personality.emoji} ${personality.name} ${index + 1}`;
    }

    getSourceColor(sourceType) {
        const personality = this.streamPersonalities[sourceType] || this.streamPersonalities['unknown'];
        return personality.color;
    }
 // ==================== DELEGATED SPORTS CLASSIFICATION ====================
    classifySport(match) {                              // ← ADDED
        return this.sportsClassifier.classifySport(match);
    }
    // ==================== STREAMED API METHODS ====================
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
                sport: this.classifySport({ sport: match.category }),
                unix_timestamp: Math.floor(match.date / 1000),
                channels: channels,
                streamedMatch: match
            });
        });
        
        return { events };
    }

    async getStreamUrlFromStreamed(streamApiUrl) {
        try {
            console.log('🔄 Getting actual stream URL from:', streamApiUrl);
            const response = await fetch(streamApiUrl);
            const streamData = await response.json();
            console.log('📦 Stream data received:', streamData);
            
            if (streamData && streamData.length > 0 && streamData[0].embedUrl) {
                console.log('✅ Found embed URL:', streamData[0].embedUrl);
                return streamData[0].embedUrl;
            }
            return null;
        } catch (error) {
            console.warn('❌ Failed to get stream from Streamed:', error);
            return null;
        }
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

    // ==================== TV CHANNELS DATA ====================
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
                const rowIndex = Array.from(matchRow.parentNode.children).indexOf(matchRow) - 1;
                localStorage.setItem('lastScrollPosition', rowIndex);
                console.log('📜 Saving scroll position:', rowIndex);

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

    // ==================== BULLETPROOF FILTER SYSTEM ====================
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

    isCollegeFootball(match) {
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        const collegeFootballIndicators = [
            'middle tennessee', 'jacksonville state', 'college football', 
            'ncaa football', 'fbs', 'fcs', 'bowl game', 'cotton bowl',
            'rose bowl', 'orange bowl', 'sugar bowl', 'college gameday',
            'ncaaf', 'college bowl', 'cfp', 'college playoff'
        ];
        
        return collegeFootballIndicators.some(indicator => 
            searchString.includes(indicator)
        );
    }

    // ==================== SIMPLIFIED SPORTS NAVIGATION ====================
    async showSportsView() {
        console.log('🎯 Sports button clicked - Simplified version');
        
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
        console.log('🔍 ALL VERIFIED MATCHES:', this.verifiedMatches);
        console.log('🔍 UNIQUE SPORTS FOUND:', [...new Set(this.verifiedMatches.map(m => m.sport))].sort());
        
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

    // ==================== DATA LOADING ====================
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

    async loadMatches() {
        console.log('🔄 loadMatches called - checking cache...');
        
        // RE-ENABLE CACHE but with fusion
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('📦 Using cached FUSED data');
            this.organizeMatches(cachedData);
            return;
        }
        
        console.log('🔥 No cache - running fresh fusion...');
        
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
                }`,
                
                // Strategy 3: Sport context + teams (for Streamed data)
                `${(match.sport || '').toLowerCase().replace(/[^a-z0-9]/g, '')}-${
                    (match.match || '').toLowerCase()
                        .split(' - ')[0]?.replace(/[^a-z0-9]/g, '') || ''
                }`
            ];
            
            return strategies.join('|');
        };

        // Helper function to normalize team names for comparison
        const normalizeTeamNames = (teamString) => {
            if (!teamString) return '';
            
            return teamString
                .toLowerCase()
                .replace(/\s*vs\.?\s*/g, ' - ') // Standardize vs separator
                .replace(/\s*-\s*/g, ' - ')     // Standardize hyphen separator
                .replace(/\s+/g, ' ')           // Normalize spaces
                .replace(/[^\w\s-]/g, '')       // Remove special chars but keep hyphens
                .trim();
        };

        // Helper function to isSimilarMatch for fuzzy matching
        const isSimilarMatch = (match1, match2) => {
            if (!match1 || !match2) return false;
            
            const teams1 = normalizeTeamNames(match1.match);
            const teams2 = normalizeTeamNames(match2.match);
            
            // Exact match after normalization
            if (teams1 === teams2) return true;
            
            // Same teams but different order
            const teams1Sorted = teams1.split(' - ').sort().join(' - ');
            const teams2Sorted = teams2.split(' - ').sort().join(' - ');
            if (teams1Sorted === teams2Sorted) return true;
            
            // Tournament-based similarity
            const tournament1 = (match1.tournament || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const tournament2 = (match2.tournament || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (tournament1 && tournament2 && tournament1 === tournament2) {
                // Check if team names have significant overlap
                const teamWords1 = new Set(teams1.split(/\s+/));
                const teamWords2 = new Set(teams2.split(/\s+/));
                const commonWords = [...teamWords1].filter(word => teamWords2.has(word) && word.length > 3);
                
                if (commonWords.length >= 2) {
                    console.log(`🔍 Fuzzy match: "${teams1}" ↔ "${teams2}" (${commonWords.length} common words)`);
                    return true;
                }
            }
            
            return false;
        };

        // Add Tom data with enhanced duplicate checking
        if (tomData && tomData.events) {
            Object.entries(tomData.events).forEach(([date, matches]) => {
                if (!fusedData.events[date]) fusedData.events[date] = [];
                
                matches.forEach(match => {
                    const fingerprint = generateMatchFingerprint(match);
                    
                    if (!duplicateTracker.has(fingerprint)) {
                        // Check for fuzzy duplicates before adding
                        const isDuplicate = fusedData.events[date].some(existingMatch => 
                            isSimilarMatch(match, existingMatch)
                        );
                        
                        if (!isDuplicate) {
                            fusedData.events[date].push(match);
                            duplicateTracker.add(fingerprint);
                            tomMatchesAdded++;
                        } else {
                            duplicatesFound++;
                            console.log(`🚫 Duplicate detected (Tom): ${match.match}`);
                        }
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
                        // Check for fuzzy duplicates before adding
                        const isDuplicate = fusedData.events[date].some(existingMatch => 
                            isSimilarMatch(match, existingMatch)
                        );
                        
                        if (!isDuplicate) {
                            fusedData.events[date].push(match);
                            duplicateTracker.add(fingerprint);
                            sarahMatchesAdded++;
                        } else {
                            duplicatesFound++;
                            console.log(`🚫 Duplicate detected (Sarah): ${match.match}`);
                        }
                    } else {
                        duplicatesFound++;
                    }
                });
            });
            console.log(`✅ Sarah added ${sarahMatchesAdded} unique matches`);
        }

        // Post-process: Merge streams from duplicates that passed fuzzy check
        this.mergeStreamsFromSimilarMatches(fusedData);

        const totalMatches = Object.values(fusedData.events).flat().length;
        console.log(`🎉 Fusion complete: ${totalMatches} total matches (${duplicatesFound} duplicates filtered)`);
        console.log(`📊 Source breakdown: Tom ${tomMatchesAdded} + Sarah ${sarahMatchesAdded} = ${totalMatches}`);
        
        return fusedData;
    }

    // NEW: Merge streams from similar matches that might have different stream sources
    mergeStreamsFromSimilarMatches(fusedData) {
        let streamsMerged = 0;
        
        Object.entries(fusedData.events).forEach(([date, matches]) => {
            for (let i = 0; i < matches.length; i++) {
                for (let j = i + 1; j < matches.length; j++) {
                    const matchA = matches[i];
                    const matchB = matches[j];
                    
                    if (this.areSimilarEnoughToMerge(matchA, matchB)) {
                        // Merge streams from both matches
                        const allStreams = [
                            ...(matchA.channels || []),
                            ...(matchB.channels || [])
                        ];
                        
                        // Remove duplicates and keep unique streams
                        const uniqueStreams = [...new Set(allStreams)];
                        
                        if (uniqueStreams.length > (matchA.channels?.length || 0)) {
                            matchA.channels = uniqueStreams;
                            // Remove the duplicate match
                            matches.splice(j, 1);
                            j--; // Adjust index after removal
                            streamsMerged++;
                            console.log(`🔄 Merged streams for: ${matchA.match}`);
                        }
                    }
                }
            }
        });
        
        if (streamsMerged > 0) {
            console.log(`🔗 Stream merging: ${streamsMerged} matches had streams merged`);
        }
    }

    // NEW: Determine if matches are similar enough to merge streams
    areSimilarEnoughToMerge(matchA, matchB) {
        if (!matchA || !matchB) return false;
        
        const teamsA = this.normalizeTeamNamesForComparison(matchA.match);
        const teamsB = this.normalizeTeamNamesForComparison(matchB.match);
        
        // Must have same normalized team names
        if (teamsA !== teamsB) return false;
        
        // Must be within 2 hours of each other (accounting for timezone differences)
        const timeDiff = Math.abs((matchA.unix_timestamp || 0) - (matchB.unix_timestamp || 0));
        if (timeDiff > 7200) return false; // 2 hours in seconds
        
        // Tournament should be similar
        const tournamentA = (matchA.tournament || '').toLowerCase();
        const tournamentB = (matchB.tournament || '').toLowerCase();
        
        if (tournamentA && tournamentB) {
            const wordsA = new Set(tournamentA.split(/\s+/));
            const wordsB = new Set(tournamentB.split(/\s+/));
            const commonWords = [...wordsA].filter(word => wordsB.has(word) && word.length > 3);
            
            // Require at least 2 common significant words in tournament name
            return commonWords.length >= 2;
        }
        
        return true;
    }

    // Helper function to normalize team names for comparison
    normalizeTeamNamesForComparison(teamString) {
        if (!teamString) return '';
        
        return teamString
            .toLowerCase()
            .replace(/\s*vs\.?\s*/g, ' - ') // Standardize vs separator
            .replace(/\s*-\s*/g, ' - ')     // Standardize hyphen separator
            .replace(/\s+/g, ' ')           // Normalize spaces
            .replace(/[^\w\s-]/g, '')       // Remove special chars but keep hyphens
            .trim();
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
        
        if (this.currentView !== 'main') {
            this[`show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`]();
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
        
        if (this.currentView === 'sports' && this.preloadedSports.length > 0) {
            this.showSportsDataUI();
        }
    }
      // ==================== DELEGATED DATA LOADING ====================
async loadMatches() {
    return this.dataFusion.loadMatches();
}
    // ==================== SIMPLIFIED MATCH NAVIGATION ====================
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

    // ==================== FIXED MATCH DETAILS WITH STREAMED SUPPORT ====================
    async showMatchDetails(matchId) {
        console.log('🎯 showMatchDetails called');
        this.currentView = 'match-details';
        
        await this.ensureDataLoaded();
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const channels = match.channels || [];
        const currentChannelIndex = this.currentStreams.get(matchId) || 0;
        let currentStreamUrl = channels[currentChannelIndex] || null;

        // If this is a Streamed API URL, get the actual stream URL
        if (currentStreamUrl && currentStreamUrl.includes('streamed.pk/api/stream')) {
            console.log('🔄 Detected Streamed API URL, fetching actual stream...');
            currentStreamUrl = await this.getStreamUrlFromStreamed(currentStreamUrl);
        }
        
        const channelSelectorHTML = this.generateChannelSelector(channels, matchId);
        
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
        
        if (channels.length === 0) {
            return '';
        }
        
        if (channels.length <= 4) {
            return `
                <div class="channel-buttons-inline">
                    ${channels.map((channel, index) => {
                        const sourceType = this.detectSourceType(channel);
                        const personalityLabel = this.generatePersonalityLabel(sourceType, index);
                        return `
                            <button class="channel-btn-inline ${index === currentChannelIndex ? 'active' : ''}" 
                                    onclick="matchScheduler.switchChannel('${matchId}', ${index})"
                                    style="border-left: 3px solid ${this.getSourceColor(sourceType)}">
                                ${personalityLabel}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        return `
            <div class="channel-dropdown-inline">
                <button class="channel-dropdown-btn-inline" onclick="matchScheduler.toggleDropdown('${matchId}')">
                    Source ${currentChannelIndex + 1} of ${channels.length}
                </button>
                <div class="channel-dropdown-content-inline" id="dropdown-${matchId}">
                    ${channels.map((channel, index) => {
                        const sourceType = this.detectSourceType(channel);
                        const personalityLabel = this.generatePersonalityLabel(sourceType, index);
                        return `
                            <div class="channel-dropdown-item-inline ${index === currentChannelIndex ? 'active' : ''}" 
                                 onclick="matchScheduler.switchChannel('${matchId}', ${index})"
                                 style="border-left: 3px solid ${this.getSourceColor(sourceType)}">
                                ${personalityLabel}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    switchChannel(matchId, channelIndex) {
        this.currentStreams.set(matchId, channelIndex);
        this.showMatchDetails(matchId);
    }
    
    toggleDropdown(matchId) {
        try {
            console.log('🔧 toggleDropdown called for:', matchId);
            const dropdown = document.getElementById(`dropdown-${matchId}`);
            
            if (!dropdown) {
                console.error('❌ Dropdown not found for:', matchId);
                return;
            }
            
            const button = dropdown.previousElementSibling;
            
            if (!button) {
                console.error('❌ Button not found for dropdown:', matchId);
                return;
            }
            
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                button.classList.remove('open');
            } else {
                document.querySelectorAll('.channel-dropdown-content-inline.show').forEach(dd => {
                    dd.classList.remove('show');
                    if (dd.previousElementSibling) {
                        dd.previousElementSibling.classList.remove('open');
                    }
                });
                
                dropdown.classList.add('show');
                button.classList.add('open');
            }
        } catch (error) {
            console.error('❌ toggleDropdown crashed:', error);
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
    console.log('🎯 DOM fully loaded, initializing MatchScheduler with Streamed API...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos with Streamed API fully initialized!');
        }).catch(error => {
            console.error('❌ Initialization failed:', error);
        });
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
    }
});

// TEST STREAMED API
setTimeout(() => {
    console.log('🧪 Testing Streamed API...');
    if (window.matchScheduler) {
        window.matchScheduler.fetchFromStreamed('all')
            .then(data => console.log('🎉 Streamed test successful!'))
            .catch(err => console.log('💥 Streamed test failed:', err));
    }
}, 5000);

// TEST PERSONALITY SYSTEM
setTimeout(() => {
    console.log('🎭 Testing personality system...');
    if (window.matchScheduler) {
        console.log('Tom:', window.matchScheduler.generatePersonalityLabel('topembed', 0));
        console.log('Sarah:', window.matchScheduler.generatePersonalityLabel('streamed', 0));
        console.log('Mystery:', window.matchScheduler.generatePersonalityLabel('unknown', 0));
    }
}, 6000);

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.channel-dropdown-inline')) {
        document.querySelectorAll('.channel-dropdown-content-inline.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            dropdown.previousElementSibling.classList.remove('open');
        });
    }
});
