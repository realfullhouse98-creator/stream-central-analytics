// 9kilo Stream - GitHub Optimized Version
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
        
        // GitHub Fixes
        this.isNavigating = false;
        this.lastClickTime = 0;
        
        // Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Performance Monitoring
        this.performanceMetrics = {
            pageLoadTime: 0,
            apiResponseTime: 0,
            userActions: []
        };
        
        this.init();
    }
    
    async init() {
        // GitHub Fix: Global error handlers
        this.setupErrorHandling();
        
        this.trackPerformance('pageStart');
        this.showMainMenu();
        
        // GitHub Fix: Safe background preloading
        setTimeout(() => {
            this.preloadSportsData();
        }, 1000);
        
        this.startPerformanceMonitoring();
        this.trackPerformance('pageLoaded');
    }
    
    // ==================== GITHUB FIXES ====================
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            return true;
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }
    
    safeUpdateElement(id, content) {
        try {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = content;
            }
        } catch (error) {
            console.warn('DOM update failed:', error);
        }
    }
    
    // ==================== ENHANCED UX METHODS ====================
    async showSportsViewWithFeedback(event) {
        const button = event?.currentTarget;
        
        // GitHub Fix: Prevent rapid clicks
        const now = Date.now();
        if (now - this.lastClickTime < 1000) {
            console.log('⏳ Click too fast');
            return;
        }
        this.lastClickTime = now;
        
        // Immediate visual feedback
        if (button) {
            this.showButtonLoading(button, true);
        }
        
        try {
            await this.showSportsView();
        } catch (error) {
            console.error('Navigation failed:', error);
            this.showErrorState('Please try again');
        } finally {
            if (button) {
                this.showButtonLoading(button, false);
            }
        }
    }
    
    showButtonLoading(button, isLoading) {
        const loadingEl = button.querySelector('.button-loading');
        const subtitle = button.querySelector('.button-subtitle');
        
        if (isLoading) {
            button.style.opacity = '0.8';
            button.style.pointerEvents = 'none';
            if (loadingEl) loadingEl.classList.add('show');
            if (subtitle) subtitle.style.visibility = 'hidden';
        } else {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            if (loadingEl) loadingEl.classList.remove('show');
            if (subtitle) subtitle.style.visibility = 'visible';
        }
    }
    
    async showSportsView() {
        // GitHub Fix: Navigation lock
        if (this.isNavigating) {
            console.log('⚠️ Navigation in progress');
            return;
        }
        
        this.isNavigating = true;
        
        try {
            // Show loading state immediately
            this.showLoadingState();
            
            // Load data with timeout protection
            const loadPromise = this.ensureDataLoaded();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Load timeout')), 8000);
            });
            
            try {
                await Promise.race([loadPromise, timeoutPromise]);
                this.renderSportsView();
            } catch (error) {
                console.warn('Sports view loading failed:', error);
                this.showSportsViewWithFallback();
            }
        } finally {
            this.isNavigating = false;
        }
    }
    
    renderSportsView() {
        const sports = this.getAvailableSports();
        
        this.safeUpdateElement('dynamic-content', `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Choose Sport</h2>
                    <p>${sports.length} sports available</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <div class="match-count">${sport.count} matches</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
        
        this.hideStats();
        this.currentView = 'sports';
        this.trackPerformance('sportsViewLoaded');
    }
    
    showSportsViewWithFallback() {
        this.safeUpdateElement('dynamic-content', `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Live Sports</h2>
                    <p>Connection issues - showing demo data</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="matchScheduler.selectSport('football')">
                        <div class="sport-name">Football</div>
                        <div class="match-count">Demo matches</div>
                    </div>
                    <div class="sport-button" onclick="matchScheduler.selectSport('basketball')">
                        <div class="sport-name">Basketball</div>
                        <div class="match-count">Demo matches</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="retry-btn" onclick="matchScheduler.showSportsView()">
                        Retry Live Data
                    </button>
                </div>
            </div>
        `);
    }
    
    // ==================== CORE FUNCTIONALITY ====================
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
        const cacheStartTime = performance.now();
        
        // Try cache first
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('📦 Using cached data');
            this.organizeMatches(cachedData);
            this.trackPerformance('cacheHit', performance.now() - cacheStartTime);
            return;
        }
        
        // Cache miss, try API
        try {
            const apiStartTime = performance.now();
            const apiData = await this.tryAllProxies();
            this.organizeMatches(apiData);
            
            // Cache successful response
            this.cacheData(apiData);
            this.trackPerformance('apiSuccess', performance.now() - apiStartTime);
            
        } catch (error) {
            console.warn('All API attempts failed:', error);
            this.useFallbackData();
            this.showErrorState('Connection failed. Using cached/demo data.');
            this.trackPerformance('apiFailure');
        }
    }
    
    // GitHub Fix: Updated CORS proxies
    async tryAllProxies() {
        const targetUrl = 'https://topembed.pw/api.php?format=json';
        
        const proxyOptions = [
            `https://cors-anywhere.herokuapp.com/${targetUrl}`,
            `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`,
            `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
            targetUrl
        ];

        for (const proxyUrl of proxyOptions) {
            try {
                console.log(`Trying: ${proxyUrl}`);
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ API Success via:', proxyUrl);
                    return data;
                }
            } catch (error) {
                console.warn(`❌ Proxy failed: ${proxyUrl}`, error);
                continue;
            }
        }
        throw new Error('All API attempts failed');
    }
    
    // GitHub Fix: Safe caching
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
            // GitHub Fix: Storage quota check
            const cacheItem = {
                data: data,
                timestamp: Date.now(),
                size: JSON.stringify(data).length
            };
            
            if (cacheItem.size > 5000000) {
                console.warn('Cache too large, skipping');
                return;
            }
            
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Caching failed, clearing old data:', error);
            localStorage.removeItem(this.cacheKey);
        }
    }
    
    // Enhanced preloading
    async preloadSportsData() {
        if (this.isDataLoaded || this.isLoading) return;
        
        // Show subtle loading hint
        const subtitle = document.getElementById('sports-subtitle');
        if (subtitle) {
            const originalText = subtitle.textContent;
            subtitle.textContent = 'Preloading...';
            subtitle.style.color = 'var(--accent-gold)';
            
            setTimeout(() => {
                subtitle.textContent = originalText;
                subtitle.style.color = '';
            }, 2000);
        }
        
        // Start background loading
        this.loadMatches().catch(() => {}); // Silent fail
    }
    
    showLoadingState() {
        this.safeUpdateElement('dynamic-content', `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Loading Sports</h2>
                    <p>Fetching latest matches...</p>
                </div>
                <div class="loading-message">
                    <div class="loading-spinner"></div>
                    <p>Optimizing your experience</p>
                    <div class="optimized-loading">
                        <div class="features">
                            <div class="feature-item">✓ Smart caching enabled</div>
                            <div class="feature-item">✓ Fast fallback ready</div>
                            <div class="feature-item">✓ Performance optimized</div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    showMainMenu() {
        this.safeUpdateElement('dynamic-content', `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" 
                         onmouseenter="matchScheduler.preloadSportsData()" 
                         onclick="matchScheduler.showSportsViewWithFeedback(event)">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle" id="sports-subtitle">${this.isDataLoaded ? this.verifiedMatches.length + ' matches' : 'Games & schedules'}</div>
                        <div class="button-loading">
                            <div class="mini-spinner"></div>
                            Loading...
                        </div>
                    </div>
                    <div class="menu-button tv-button" onclick="matchScheduler.showTVChannels()">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                    <div class="menu-button community" onclick="matchScheduler.showCommunity()">
                        <div class="button-title">COMMUNITY</div>
                        <div class="button-subtitle">Fan discussions</div>
                    </div>
                </div>
                ${!this.isDataLoaded ? `
                    <div class="optimized-loading">
                        <p>⚡ Optimized Loading • Data loads on demand</p>
                    </div>
                ` : ''}
            </div>
        `);
        
        this.showStats();
        this.currentView = 'main';
        this.trackPerformance('mainMenuView');
    }
    
    // ==================== EXISTING METHODS (keep your current implementation) ====================
    organizeMatches(apiData) {
        // Keep your existing organizeMatches method
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
                            league: match.tournament || match.sport || 'Sports',
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
    
    useFallbackData() {
        const now = Math.floor(Date.now() / 1000);
        const fallbackMatches = {
            events: {
                '2024-12-20': [
                    {
                        match: 'Research Demo - Test Match',
                        tournament: '9kilos Research League',
                        sport: 'football',
                        unix_timestamp: now + 3600,
                        channels: []
                    }
                ]
            }
        };
        
        if (!this.verifiedMatches || this.verifiedMatches.length === 0) {
            this.organizeMatches(fallbackMatches);
        }
    }
    
    getAvailableSports() {
        return [
            { id: 'football', name: 'Football' }, { id: 'hockey', name: 'Hockey' },
            { id: 'basketball', name: 'Basketball' }, { id: 'baseball', name: 'Baseball' },
            { id: 'tennis', name: 'Tennis' }, { id: 'badminton', name: 'Badminton' },
            { id: 'golf', name: 'Golf' }, { id: 'cricket', name: 'Cricket' },
            { id: 'other', name: 'Other Sports' }
        ].map(sport => ({
            ...sport, count: this.getMatchesBySport(sport.id).length
        })).filter(sport => sport.count > 0);
    }
    
    // ... Include all your other existing methods exactly as they were:
    // showDatesView(), showMatchesView(), renderMatchRow(), showMatchDetails(), 
    // generateChannelSelector(), switchChannel(), toggleDropdown(), 
    // refreshCurrentStream(), toggleFullscreen(), getTeamName(), 
    // incrementViews(), handleLike(), handleDislike(), handleShare(),
    // showTVChannels(), showCommunity(), selectSport(), selectDate(),
    // getMatchesBySport(), getMatchesBySportAndDate(), getSportDisplayName(),
    // classifySport(), generateMatchId(), convertUnixToLocalTime(), 
    // checkIfLive(), formatTeamNames(), formatNumber(), formatDisplayDate(),
    // showStats(), hideStats(), updateAnalytics(), startAutoRefresh(),
    // trackPerformance(), flushPerformanceMetrics(), startPerformanceMonitoring()
    
    // ==================== KEEP ALL YOUR EXISTING METHODS BELOW THIS LINE ====================
    // Only replace the methods I've provided above, keep everything else exactly as you had it
    
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.channel-dropdown')) {
        document.querySelectorAll('.channel-dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            dropdown.previousElementSibling.classList.remove('open');
        });
    }
});

// GitHub Fix: Remove Service Worker to prevent 404 errors
// No Service Worker registration - remove if you had it
