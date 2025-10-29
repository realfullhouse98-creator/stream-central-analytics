// 9kilo Stream - Complete Sports Classification System
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
        
        // Filter state - will reset on refresh
        this.showLiveOnly = false;
        
        // Performance Monitoring
        this.performanceMetrics = {
            pageLoadTime: 0,
            apiResponseTime: 0,
            userActions: []
        };
        
        // SPORTS REFERENCE DATABASE - 16 CATEGORIES
        this.sportsReference = {
            // 1. FOOTBALL (SOCCER)
            football: {
                keywords: [
                    // Leagues
                    'premier league', 'champions league', 'europa league', 'conference league', 'la liga', 
                    'serie a', 'bundesliga', 'ligue 1', 'mls', 'eredivisie', 'primeira liga', 'super lig',
                    'liga mx', 'argentina primera', 'brasileirão', 'scottish premiership', 'belgian pro league',
                    'copa libertadores', 'copa sudamericana', 'afc champions league', 'concacaf champions league',
                    'world cup', 'euro', 'copa america', 'african cup', 'asian cup', 'gold cup',
                    'fa cup', 'carabao cup', 'dfb pokal', 'coppa italia', 'copa del rey', 'super cup',
                    'uefa', 'fifa', 'concacaf', 'conmebol',
                    
                    // Teams (Soccer)
                    'manchester', 'liverpool', 'chelsea', 'arsenal', 'tottenham', 'city', 'united',
                    'real madrid', 'barcelona', 'atletico', 'sevilla', 'valencia', 'villarreal',
                    'juventus', 'milan', 'inter', 'roma', 'napoli', 'lazio', 'fiorentina', 'atalanta',
                    'bayern', 'dortmund', 'leipzig', 'leverkusen', 'schalke', 'frankfurt',
                    'psg', 'lyon', 'marseille', 'monaco', 'lille', 'nice', 'rennes',
                    'ajax', 'psv', 'feyenoord', 'benfica', 'porto', 'sporting', 'celtic', 'rangers',
                    
                    // Generic soccer terms
                    'fc', 'cf', 'afc', 'as', 'club', 'football club', 'soccer', 'goal', 'penalty', 'futbol'
                ],
                displayName: '⚽ Football'
            },
            
            // 2. AMERICAN FOOTBALL
            american_football: {
                keywords: [
                    // Leagues
                    'nfl', 'super bowl', 'afc', 'nfc', 'pro bowl', 'college football', 'ncaa football', 'xfl', 'usfl',
                    'madden', 'espn nfl', 'nfl network', 'nfl redzone', 'nfl sunday ticket',
                    
                    // Teams
                    'patriots', 'cowboys', 'packers', 'chiefs', 'bills', 'eagles', '49ers', 'steelers', 'broncos',
                    'seahawks', 'ravens', 'vikings', 'saints', 'rams', 'chargers', 'raiders', 'bears', 'giants',
                    'jets', 'dolphins', 'falcons', 'panthers', 'bengals', 'browns', 'buccaneers', 'cardinals',
                    'colts', 'jaguars', 'lions', 'texans', 'titans', 'commanders', 'football team',
                    
                    // Terms
                    'touchdown', 'quarterback', 'running back', 'wide receiver', 'offensive line', 'defensive line'
                ],
                displayName: '🏈 American Football'
            },
            
            // 3. BASKETBALL
            basketball: {
                keywords: [
                    // Leagues
                    'nba', 'euroleague', 'fiba', 'wnba', 'ncaa basketball', 'march madness', 'final four',
                    'acb', 'lega basket', 'bbl', 'lnb', 'nbl',
                    
                    // Teams
                    'lakers', 'celtics', 'warriors', 'bulls', 'knicks', 'heat', 'spurs', 'mavericks',
                    'nets', 'suns', 'bucks', '76ers', 'trail blazers', 'jazz', 'nuggets', 'clippers',
                    'rockets', 'thunder', 'pistons', 'kings', 'pacers', 'hawks', 'hornets', 'cavaliers',
                    'magic', 'timberwolves', 'pelicans', 'raptors', 'grizzlies', 'wizards',
                    
                    // Terms
                    'basketball', 'hoops', 'dunk', 'three-pointer', 'free throw', 'rebound', 'nba tv'
                ],
                displayName: '🏀 Basketball'
            },
            
            // 4. BASEBALL
            baseball: {
                keywords: [
                    // Leagues
                    'mlb', 'world series', 'american league', 'national league', 'minor league',
                    'npb', 'kbo', 'cpbl', 'mlb network',
                    
                    // Teams
                    'yankees', 'red sox', 'dodgers', 'cubs', 'giants', 'cardinals', 'mets', 'phillies',
                    'braves', 'astros', 'white sox', 'angels', 'tigers', 'brewers', 'padres', 'mariners',
                    'rangers', 'guardians', 'royals', 'twins', 'athletics', 'orioles', 'rays', 'blue jays',
                    'nationals', 'pirates', 'reds', 'diamondbacks', 'rockies', 'marlins',
                    
                    // Terms
                    'home run', 'world series', 'all-star game', 'baseball', 'inning', 'pitcher'
                ],
                displayName: '⚾ Baseball'
            },
            
            // 5. HOCKEY
            hockey: {
                keywords: [
                    // Leagues
                    'nhl', 'stanley cup', 'khl', 'ahl', 'shl', 'liiga', 'nhl hockey', 'ice hockey',
                    
                    // Teams
                    'maple leafs', 'canadiens', 'bruins', 'red wings', 'blackhawks', 'rangers', 'flyers',
                    'oilers', 'canucks', 'flames', 'stars', 'avalanche', 'devils', 'penguins', 'capitals',
                    'lightning', 'sabres', 'senators', 'predators', 'blues', 'kings', 'sharks', 'wild',
                    'jets', 'blue jackets', 'ducks', 'coyotes', 'panthers', 'hurricanes', 'islanders',
                    'golden knights', 'kraken',
                    
                    // Terms
                    'hockey', 'nhl network', 'stanley cup playoffs', 'power play', 'penalty kill', 'hockey night'
                ],
                displayName: '🏒 Hockey'
            },
            
            // 6. TENNIS
            tennis: {
                keywords: [
                    // Tournaments
                    'wimbledon', 'us open', 'french open', 'australian open', 'atp', 'wta',
                    'davis cup', 'fed cup', 'grand slam', 'tennis',
                    
                    // Players & Terms
                    'djokovic', 'nadal', 'federer', 'murray', 'williams', 'tennis', 'grand slam', 'master', 'open'
                ],
                displayName: '🎾 Tennis'
            },
            
            // 7. CRICKET
            cricket: {
                keywords: [
                    // Tournaments
                    'ipl', 'big bash', 't20', 'test match', 'odi', 'world cup', 'ashes', 'county championship',
                    
                    // Teams
                    'india', 'australia', 'england', 'pakistan', 'south africa', 'west indies', 'new zealand',
                    'sri lanka', 'bangladesh',
                    
                    // Terms
                    'cricket', 'wicket', 'innings', 'overs', 'six', 'four', 'bowler', 'batsman'
                ],
                displayName: '🏏 Cricket'
            },
            
            // 8. RUGBY
            rugby: {
                keywords: [
                    // Tournaments
                    'six nations', 'rugby championship', 'world cup', 'super rugby', 'premiership', 'top 14', 'pro14',
                    
                    // Teams
                    'all blacks', 'springboks', 'wallabies', 'england rugby', 'wales rugby', 'ireland rugby',
                    'scotland rugby', 'france rugby',
                    
                    // Terms
                    'rugby', 'try', 'conversion', 'scrum', 'lineout', 'ruck', 'maul'
                ],
                displayName: '🏉 Rugby'
            },
            
            // 9. GOLF
            golf: {
                keywords: [
                    // Tournaments
                    'masters', 'us open', 'pga championship', 'open championship', 'ryder cup',
                    'presidents cup', 'pga tour', 'european tour',
                    
                    // Terms
                    'golf', 'pga', 'masters tournament', 'green jacket', 'birdie', 'eagle', 'putt'
                ],
                displayName: '⛳ Golf'
            },
            
            // 10. MMA & BOXING
            fighting: {
                keywords: [
                    // Organizations
                    'ufc', 'boxing', 'espn boxing', 'top rank', 'premier boxing', 'bellator',
                    'one championship', 'pfl',
                    
                    // Terms
                    'knockout', 'ko', 'tko', 'championship fight', 'pay-per-view', 'heavyweight'
                ],
                displayName: '🥊 MMA & Boxing'
            },
            
            // 11. RACING
            racing: {
                keywords: [
                    // Series
                    'formula 1', 'f1', 'nascar', 'indycar', 'motogp', 'wrc', 'formula e', 'supercars', 'dtm',
                    
                    // Events
                    'daytona 500', 'monaco grand prix', 'indianapolis 500', 'le mans', 'dakar rally',
                    
                    // Terms
                    'grand prix', 'qualifying', 'race', 'lap', 'pit stop', 'pole position'
                ],
                displayName: '🏎️ Racing'
            },
            
            // 12. EQUESTRIAN
            equestrian: {
                keywords: [
                    // Events
                    'equestrian', 'horse racing', 'derby', 'kentucky derby', 'preakness', 'belmont stakes',
                    'royal ascot', 'dubai world cup', 'breeders cup', 'grand national', 'show jumping',
                    'dressage', 'eventing', 'cross country',
                    
                    // Terms
                    'thoroughbred', 'jockey', 'steeplechase', 'furlong', 'handicap', 'triple crown'
                ],
                displayName: '🏇 Equestrian'
            },
            
            // 13. VOLLEYBALL
            volleyball: {
                keywords: [
                    // Leagues/Events
                    'volleyball', 'beach volleyball', 'fivb', 'ncaa volleyball', 'cev', 'world championship',
                    'olympics volleyball', 'vnl', 'club world championship', 'volley',
                    
                    // Terms
                    'spike', 'block', 'dig', 'set', 'serve', 'rotation', 'libero'
                ],
                displayName: '🏐 Volleyball'
            },
            
            // 14. AUSTRALIAN FOOTBALL
            australian_football: {
                keywords: [
                    // Leagues
                    'afl', 'australian football', 'aussie rules', 'afl premiership', 'afl grand final',
                    'aflw', 'vfl', 'sanfl', 'wafl',
                    
                    // Teams
                    'collingwood', 'carlton', 'essendon', 'richmond', 'hawthorn', 'geelong', 'melbourne',
                    'sydney', 'west coast', 'fremantle', 'adelaide', 'port adelaide', 'brisbane',
                    'gold coast', 'gws', 'st kilda', 'western bulldogs', 'north melbourne',
                    
                    // Terms
                    'footy', 'mark', 'behind', 'goal', 'ruck', 'rover', 'brownlow medal'
                ],
                displayName: '🇦🇺 Australian Football'
            },
            
            // 15. BADMINTON
            badminton: {
                keywords: [
                    // Tournaments
                    'badminton', 'bwf', 'all england', 'world championships', 'thomas cup', 'uber cup',
                    'sudirman cup', 'olympics badminton',
                    
                    // Terms
                    'shuttlecock', 'racket', 'smash', 'drop shot', 'clear', 'drive', 'singles'
                ],
                displayName: '🏸 Badminton'
            },
            
            // 16. OTHER (fallback)
            other: {
                keywords: [],
                displayName: '🎯 Other Sports'
            }
        };
        
        this.init();
    }
    
    async init() {
        this.trackPerformance('pageStart');
        this.showMainMenu();
        this.startPerformanceMonitoring();
        this.trackPerformance('pageLoaded');
        
        // Safe Service Worker Registration
        this.registerServiceWorker();
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
    
    // ==================== OPTIMIZATION 1: LAZY LOADING ====================
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
    
    // ==================== OPTIMIZATION 2: SMART CACHING ====================
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
    
    // ==================== OPTIMIZATION 3: INTELLIGENT PRELOADING ====================
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
    
    preloadMatchDetails(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (match && match.channels && match.channels.length > 0) {
            fetch(match.channels[0], { mode: 'no-cors' }).catch(() => {});
        }
    }
    
    // ==================== OPTIMIZATION 4: PERFORMANCE MONITORING ====================
    trackPerformance(event, duration = 0, extra = '') {
        this.performanceMetrics.userActions.push({
            event,
            duration,
            timestamp: Date.now(),
            view: this.currentView,
            extra
        });
        
        if (this.performanceMetrics.userActions.length >= 5) {
            this.flushPerformanceMetrics();
        }
        
        console.log(`🎯 ${event}: ${duration}ms`);
    }
    
    flushPerformanceMetrics() {
        if (this.performanceMetrics.userActions.length > 0) {
            console.log('Performance Metrics:', this.performanceMetrics.userActions);
            this.performanceMetrics.userActions = [];
        }
    }
    
    startPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.trackPerformance(entry.name, entry.duration);
                });
            });
            observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
        }
    }
    
    // ==================== OPTIMIZATION 5: ENHANCED ERROR RECOVERY ====================
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
                        sport: 'football',
                        unix_timestamp: now + 3600,
                        channels: ['https://example.com/stream1', 'https://example.com/stream2']
                    },
                    {
                        match: 'Demo United - Test City FC',
                        tournament: 'Research Championship',
                        sport: 'football', 
                        unix_timestamp: now - 1800,
                        channels: ['https://example.com/stream1']
                    }
                ]
            }
        };
        this.organizeMatches(sampleMatches);
    }
    
    showLoadingState() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="loading-message">
                    <div class="loading-spinner"></div>
                    <p>Loading sports data...</p>
                    <p style="font-size: 0.8em; color: var(--text-muted); margin-top: 10px;">
                        Optimized loading in progress
                    </p>
                </div>
            </div>
        `;
    }
    
    showErrorState(errorMessage = '') {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="error-message">
                    <h3>Smart Recovery Active</h3>
                    <p>Using optimized fallback system</p>
                    ${errorMessage ? `<p style="font-size: 0.8em; color: var(--accent-red); margin: 10px 0;">${errorMessage}</p>` : ''}
                    <button class="retry-btn" onclick="matchScheduler.loadMatches()">
                        Retry Live Data
                    </button>
                    <p style="margin-top: 20px; font-size: 0.8em; color: var(--text-muted);">
                        Cached content available • Fast fallback system
                    </p>
                </div>
            </div>
        `;
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
        
        // Log sports classification results
        const sportsCount = {};
        this.verifiedMatches.forEach(match => {
            sportsCount[match.sport] = (sportsCount[match.sport] || 0) + 1;
        });
        console.log('🏆 Sports Classification Results:', sportsCount);
        
        if (this.currentView !== 'main') {
            this[`show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`]();
        }
    }

    // ==================== IMPROVED SPORTS CLASSIFICATION ====================
    classifySport(match) {
        // Use the original sport field if it exists and is valid
        const originalSport = (match.sport || '').toLowerCase().trim();
        
        // If original sport already matches one of our categories, use it
        if (originalSport && this.sportsReference[originalSport]) {
            console.log(`✅ Using original sport: ${originalSport} for "${match.match}"`);
            return originalSport;
        }
        
        // Normalize search text for better matching
        const searchString = (match.match + ' ' + match.tournament + ' ' + (match.sport || ''))
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
        
        console.log(`🔍 Classifying: "${match.match}" - Search: ${searchString}`);
        
        // Check each sport category for keywords (excluding 'other')
        for (const [sportId, sportData] of Object.entries(this.sportsReference)) {
            if (sportId === 'other') continue;
            
            for (const keyword of sportData.keywords) {
                const normalizedKeyword = keyword.toLowerCase().trim();
                if (searchString.includes(normalizedKeyword)) {
                    console.log(`✅ Classified "${match.match}" as ${sportId} (keyword: ${keyword})`);
                    return sportId;
                }
            }
            
            // Also check if sport name itself is in the search string
            const sportName = sportData.displayName.toLowerCase();
            if (searchString.includes(sportName.replace(/[^a-z\s]/g, ''))) {
                console.log(`✅ Classified "${match.match}" as ${sportId} (sport name match)`);
                return sportId;
            }
        }
        
        // Try to map common sport names to our categories
        const sportMappings = {
            'soccer': 'football',
            'nfl football': 'american_football',
            'college football': 'american_football', 
            'nhl hockey': 'hockey',
            'ice hockey': 'hockey',
            'nba basketball': 'basketball',
            'college basketball': 'basketball',
            'mlb baseball': 'baseball',
            'atp tennis': 'tennis',
            'wta tennis': 'tennis',
            'grand slam': 'tennis',
            'iplt20': 'cricket',
            't20': 'cricket',
            'test cricket': 'cricket',
            'one day international': 'cricket',
            'ufc fight': 'fighting',
            'boxing match': 'fighting',
            'formula1': 'racing',
            'f1 grand prix': 'racing',
            'nascar cup': 'racing',
            'horse racing': 'equestrian',
            'afl football': 'australian_football'
        };
        
        for (const [key, sportId] of Object.entries(sportMappings)) {
            if (searchString.includes(key)) {
                console.log(`✅ Mapped "${match.match}" from ${key} to ${sportId}`);
                return sportId;
            }
        }
        
        console.log(`❓ No classification found for "${match.match}", using 'other'`);
        return 'other';
    }

    getSportDisplayName(sportId = this.currentSport) {
        if (!sportId) return 'Unknown Sport';
        
        const sportData = this.sportsReference[sportId];
        if (sportData) {
            return sportData.displayName;
        }
        
        // Fallback: capitalize the sport ID
        return sportId.charAt(0).toUpperCase() + sportId.slice(1);
    }

    // ==================== UI METHODS ====================
    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" onmouseover="matchScheduler.preloadSportsData()" onclick="matchScheduler.showSportsView()">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">${this.isDataLoaded ? this.verifiedMatches.length + ' matches' : 'Games & schedules'}</div>
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
        this.trackPerformance('mainMenuView');
    }

    async showSportsView() {
        this.trackPerformance('sportsViewStart');
        const success = await this.ensureDataLoaded();
        
        if (!success) {
            this.showErrorState('Failed to load sports data');
            return;
        }
        
        const container = document.getElementById('dynamic-content');
        
        // Get unique sports from actual matches
        const uniqueSports = [...new Set(this.verifiedMatches.map(match => match.sport))];
        
        // Create sports list with counts and proper display names
        const sports = uniqueSports.map(sportId => {
            const count = this.getMatchesBySport(sportId).length;
            return {
                id: sportId,
                name: this.getSportDisplayName(sportId),
                count: count
            };
        }).filter(sport => sport.count > 0)
          .sort((a, b) => b.count - a.count); // Sort by match count (most first)

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
        this.trackPerformance('sportsViewLoaded');
    }
    
    async showDatesView() {
        await this.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.getSportDisplayName();
        
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
        const sportName = this.getSportDisplayName();
        const displayDate = this.formatDisplayDate(this.currentDate);
        
        // Always start with ALL matches when entering matches view
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
        this.showMatchesView(); // Refresh the view with new filter
    }
    
    renderMatchRow(match) {
        const isLive = match.isLive;
        const formattedTeams = this.formatTeamNames(match.teams);
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}" onmouseover="matchScheduler.preloadMatchDetails('${match.id}')">
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
        this.trackPerformance('matchDetailsView', 0, matchId);
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
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches();
        }, 300000);
    }
    
    // Debug method to check sports classification
    debugSportsClassification() {
        console.log('=== SPORTS CLASSIFICATION DEBUG ===');
        this.verifiedMatches.forEach(match => {
            console.log(`"${match.match}" -> ${match.sport}`);
        });
        console.log('=== END DEBUG ===');
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
