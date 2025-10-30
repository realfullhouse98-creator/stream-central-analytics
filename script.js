// 9kilo Stream - Ultra Bandwidth Optimized (<500KB target)
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
        
        // Bandwidth Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.apiCallCount = 0;
        this.lastApiCall = 0;
        this.analyticsLoaded = false;
        this.essentialDataLoaded = false;
        
        // Bandwidth Limits
        this.cacheKey = '9kilos-essential-cache';
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        this.minApiInterval = 30000; // 30 seconds between API calls
        this.maxApiCallsPerSession = 15;
        
        // Caching
        this.preloadedSports = null;
        this.lastDataUpdate = null;
        
        // Filter state
        this.showLiveOnly = false;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 MatchScheduler initialized - Ultra Bandwidth Optimized!');
        this.showMainMenu();
        this.setupEventListeners();
        this.registerServiceWorker();
        this.loadEssentialFromCache(); // Load UI instantly from cache
        
        // Delay non-critical loads
        setTimeout(() => this.lazyLoadAnalytics(), 3000);
    }

    // ==================== BANDWIDTH OPTIMIZATION ====================
    loadEssentialFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return;
            
            const { sports, timestamp, version } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > this.cacheTimeout;
            
            if (!isExpired && sports && sports.length > 0) {
                this.preloadedSports = sports;
                this.essentialDataLoaded = true;
                console.log('📦 Loaded essential data from cache:', sports.length + ' sports');
            }
        } catch (error) {
            console.log('Cache load failed:', error);
        }
    }

    cacheEssentialData(apiData) {
        if (!apiData?.events) return;
        
        const sports = new Set();
        let matchCount = 0;
        
        // Quick pass - only extract essential data
        Object.values(apiData.events).forEach(matches => {
            matches.forEach(match => {
                if (match?.sport) {
                    const sport = this.classifySport(match);
                    sports.add(sport);
                    matchCount++;
                }
            });
        });
        
        this.preloadedSports = Array.from(sports);
        
        // Cache only minimal essential data
        const essentialData = {
            sports: this.preloadedSports,
            matchCount: matchCount,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(essentialData));
            console.log('💾 Cached essential data:', this.preloadedSports.length + ' sports, ' + matchCount + ' matches');
        } catch (error) {
            console.warn('Essential cache failed:', error);
        }
    }

    shouldMakeApiCall() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        
        // Don't call API too frequently
        if (timeSinceLastCall < this.minApiInterval) {
            console.log('⏰ Skipping API call - too soon');
            return false;
        }
        
        // Limit API calls per session
        if (this.apiCallCount >= this.maxApiCallsPerSession) {
            console.log('📊 API call limit reached for session');
            return false;
        }
        
        // Prefer cached data if available and recent
        if (this.essentialDataLoaded && timeSinceLastCall < 120000) { // 2 minutes
            console.log('🔄 Using cached data instead of API');
            return false;
        }
        
        return true;
    }

    // ==================== LAZY LOADING ====================
    lazyLoadAnalytics() {
        if (this.analyticsLoaded) return;
        
        // Only load analytics after user interaction or delay
        console.log('📊 Loading analytics delayed');
        this.analyticsLoaded = true;
        
        // Your existing analytics code would go here
        // This reduces initial page load bandwidth
    }

    lazyLoadFullMatchData() {
        // Only load full match data when user drills down
        if (this.currentView === 'matches' || this.currentView === 'details') {
            this.ensureDataLoaded().catch(console.error);
        }
    }

    // ==================== COMPRESSED API REQUESTS ====================
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
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
                
                console.log('🌐 Making compressed API request...');
                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip, deflate, br', // Request compression
                        'Cache-Control': 'max-age=300' // Cache hint
                    },
                    referrerPolicy: 'no-referrer' // Reduce header size
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Log bandwidth usage
                    const contentLength = response.headers.get('content-length');
                    console.log(`📦 API Response: ${contentLength ? contentLength + ' bytes' : 'compressed'}`);
                    
                    this.apiCallCount++;
                    this.lastApiCall = Date.now();
                    return data;
                }
            } catch (error) {
                console.warn(`Proxy failed: ${proxyUrl}`, error);
                continue;
            }
        }
        
        throw new Error('All proxy attempts failed');
    }

    // ==================== ERROR BOUNDARIES ====================
    setupEventListeners() {
        // Use event delegation with error handling
        document.addEventListener('click', (e) => {
            try {
                if (e.target.closest('.sports-button')) {
                    this.showSportsView();
                }
                else if (e.target.closest('.tv-button')) {
                    this.showTVChannels();
                }
                else if (e.target.closest('.community')) {
                    this.showCommunity();
                }
                
                // Lazy load analytics on first user interaction
                if (!this.analyticsLoaded) {
                    this.lazyLoadAnalytics();
                }
            } catch (error) {
                console.error('🎯 Navigation error handled:', error);
                this.showErrorUI('Navigation issue - please try again');
            }
        });
        
        // Mouseover for sports preloading with error handling
        document.addEventListener('mouseover', (e) => {
            try {
                if (e.target.closest('.sports-button')) {
                    this.preloadSportsData();
                }
            } catch (error) {
                console.error('🎯 Preload error handled:', error);
                // Silent fail - preloading is non-critical
            }
        });
        
        console.log('✅ Event listeners with error boundaries setup complete');
    }

    showErrorUI(message) {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="error-message">
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="retry-btn" onclick="matchScheduler.showMainMenu()">
                        Return to Home
                    </button>
                </div>
            </div>
        `;
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
            return 'American Football';
        }
        
        // Then use the sport field from API with simple normalization
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

    // ==================== OPTIMIZED NAVIGATION ====================
    async showSportsView() {
        try {
            console.log('🎯 Sports button clicked - Bandwidth optimized');
            
            // 1. INSTANT UI - Show cached sports immediately
            if (this.preloadedSports && this.preloadedSports.length > 0) {
                this.showSportsUIWithCachedData();
            } else {
                this.showSportsLoadingUI();
            }
            
            // 2. BACKGROUND - Load data only if needed and allowed
            if (this.shouldMakeApiCall()) {
                this.loadSportsDataBackground();
            } else {
                console.log('💡 Using cached data for sports view');
                // Still try to update in background but don't block
                setTimeout(() => {
                    if (this.shouldMakeApiCall()) {
                        this.loadSportsDataBackground();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('🎯 Sports view error handled:', error);
            this.showSportsUIWithCachedData(); // Graceful fallback
        }
    }

    showSportsUIWithCachedData() {
        const container = document.getElementById('dynamic-content');
        const sports = this.preloadedSports ? this.preloadedSports.map(sport => ({
            id: sport,
            name: sport,
            count: 'Loading...'
        })) : [];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>Select</p>
                </div>
                <div class="sports-grid">
                    ${sports.length > 0 ? sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <div class="match-count">${sport.count}</div>
                        </div>
                    `).join('') : `
                        <div class="sport-button" style="opacity: 0.7; cursor: wait;">
                            <div class="sport-name">Loading Categories</div>
                            <div class="match-count">Please wait</div>
                        </div>
                    `}
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <p style="color: var(--text-muted); font-size: 0.7em;">
                        📦 Bandwidth Optimized • Cached Data
                    </p>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }

    showSportsLoadingUI() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>Loading...</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" style="opacity: 0.7; cursor: wait;">
                        <div class="sport-name">Loading Categories</div>
                        <div class="match-count">Please wait</div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }

    async loadSportsDataBackground() {
        // Set a safety timeout - never get stuck loading
        const safetyTimeout = setTimeout(() => {
            console.log('⚡ Safety timeout: Showing available data');
            this.showSportsDataUI();
        }, 4000);

        try {
            const success = await this.ensureDataLoaded();
            clearTimeout(safetyTimeout);
            
            if (success) {
                console.log('✅ Data loaded successfully');
                this.showSportsDataUI();
            } else {
                console.log('⚠️ Using cached/fallback data');
                this.showSportsDataUI();
            }
        } catch (error) {
            clearTimeout(safetyTimeout);
            console.log('🛡️ Error handled gracefully:', error.message);
            this.showSportsDataUI();
        }
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
                name: sportId,
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
                    <h2>Categories</h2>
                    <p>Select</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <div class="match-count">${sport.count} match${sport.count !== 1 ? 'es' : ''}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <p style="color: var(--text-muted); font-size: 0.7em;">
                        🌐 Live Data • ${this.apiCallCount} API calls
                    </p>
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
                    <h2>Categories</h2>
                    <p>No data available</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="matchScheduler.retryLoadMatches()" style="cursor: pointer;">
                        <div class="sport-name">Retry Loading</div>
                        <div class="match-count">Click to refresh</div>
                    </div>
                </div>
            </div>
        `;
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
        this.cacheEssentialData(apiData); // Cache minimal data
        
        // Update UI if we're currently on sports view
        if (this.currentView === 'sports' && this.preloadedSports.length > 0) {
            this.showSportsUIWithCachedData();
        }
    }

    retryLoadMatches() {
        if (this.shouldMakeApiCall()) {
            this.isDataLoaded = false;
            this.showSportsView();
        } else {
            console.log('⏰ Please wait before making another API call');
        }
    }
    
    // ==================== OPTIMIZED DATA LOADING ====================
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
            console.error('Data loading failed, using fallback:', error);
            return this.useCachedDataAsFallback();
        } finally {
            this.isLoading = false;
        }
    }

    useCachedDataAsFallback() {
        console.log('📦 Attempting to use cached data as fallback');
        const cached = this.getCachedData();
        if (cached) {
            console.log('✅ Using cached data as fallback');
            this.organizeMatches(cached);
            return true;
        } else {
            console.log('🔄 Using demo data as final fallback');
            this.useFallbackData();
            return false;
        }
    }
    
    async loadMatches() {
        // Check if we should make API call
        if (!this.shouldMakeApiCall()) {
            const cachedData = this.getCachedData();
            if (cachedData) {
                console.log('📦 Using cached data (API call skipped)');
                this.organizeMatches(cachedData);
                return;
            }
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
        
        // EXTRACT SPORTS CATEGORIES FIRST (for instant navigation)
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
        
        // Log bandwidth usage
        console.log(`📊 Processed: ${this.verifiedMatches.length} matches, ${this.preloadedSports.length} sports`);
        
        if (this.currentView !== 'main') {
            this[`show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`]();
        }
    }

    // ==================== UI METHODS WITH ERROR HANDLING ====================
    showMainMenu() {
        try {
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
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: var(--text-muted); font-size: 0.8em;">
                            ⚡ Ultra Bandwidth Optimized • <1MB Target
                        </p>
                        <p style="color: var(--text-muted); font-size: 0.7em; margin-top: 5px;">
                            📊 API Calls: ${this.apiCallCount}/${this.maxApiCallsPerSession}
                        </p>
                    </div>
                </div>
            `;
            
            this.showStats();
            this.currentView = 'main';
        } catch (error) {
            console.error('Main menu error:', error);
            this.showErrorUI('Cannot load main menu');
        }
    }

    // ... (rest of your existing UI methods remain the same with error handling)
    // [Include all the other methods from previous version: showDatesView, showMatchesView, etc.]
    
    // ==================== MEMORY LEAK PREVENTION ====================
    cleanupVideoPlayers() {
        try {
            const iframes = document.querySelectorAll('.stream-iframe');
            iframes.forEach(iframe => {
                iframe.src = '';
                iframe.remove();
            });
            console.log('🧹 Cleaned up video players:', iframes.length);
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }

    // ==================== UTILITY METHODS ====================
    // [Include all your existing utility methods]
}

// Initialize the application with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.matchScheduler = new MatchScheduler();
        console.log('✅ 9kilos Ultra-Optimized App initialized successfully');
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        document.getElementById('dynamic-content').innerHTML = `
            <div class="error-message">
                <h3>App Failed to Load</h3>
                <p>Please refresh the page or try again later.</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    Reload Page
                </button>
            </div>
        `;
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
