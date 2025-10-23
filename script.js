// Uncle Stream - FIXED Sports Categorization & Live Detection
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.showMainMenu();
        this.startAutoRefresh();
    }
    
    async loadMatches() {
        try {
            console.log('Loading matches from API...');
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            console.log('Raw API data:', apiData);
            this.organizeMatches(apiData);
        } catch (error) {
            console.error('API Error:', error);
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData?.events) {
            console.log('No events found in API data');
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        console.log('Processing API events...');
        Object.entries(apiData.events).forEach(([date, matches]) => {
            console.log(`Date: ${date}, Matches:`, matches);
            
            if (Array.isArray(matches)) {
                matches.forEach((match, index) => {
                    if (match?.match) {
                        const processedMatch = {
                            date: date,
                            time: this.convertUnixToLocalTime(match.unix_timestamp),
                            teams: match.match,
                            league: match.tournament || match.sport || 'Sports',
                            streamUrl: match.channels?.[0] || null,
                            isLive: this.checkIfLive(match),
                            sport: this.classifySport(match),
                            unixTimestamp: match.unix_timestamp,
                            rawData: match // Keep original for debugging
                        };
                        
                        this.allMatches.push(processedMatch);
                        this.verifiedMatches.push(processedMatch);
                        
                        console.log(`Processed match ${index}:`, {
                            teams: processedMatch.teams,
                            league: processedMatch.league,
                            sport: processedMatch.sport,
                            isLive: processedMatch.isLive
                        });
                    }
                });
            }
        });
        
        // TEST: Add guaranteed live matches for debugging
        this.verifiedMatches.push({
            date: new Date().toISOString().split('T')[0],
            time: 'NOW',
            teams: 'TEST FOOTBALL MATCH 🔴',
            league: 'Premier League',
            streamUrl: 'https://example.com',
            isLive: true,
            sport: 'football',
            unixTimestamp: Math.floor(Date.now() / 1000) - 1800
        });
        
        this.verifiedMatches.push({
            date: new Date().toISOString().split('T')[0],
            time: 'NOW',
            teams: 'TEST TENNIS MATCH 🔴',
            league: 'Wimbledon',
            streamUrl: 'https://example.com',
            isLive: true,
            sport: 'tennis',
            unixTimestamp: Math.floor(Date.now() / 1000) - 1800
        });
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
        
        // Debug categorization
        this.debugSportsCategorization();
    }
    
    classifySport(match) {
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        const sport = (match.sport || '').toLowerCase();
        
        console.log('Classifying sport:', { tournament, matchName, sport });
        
        // First, check if we have direct sport information
        if (sport && sport !== 'sports' && sport !== 'other') {
            const sportMap = {
                'soccer': 'football',
                'american football': 'football',
                'table tennis': 'tennis',
                'ice hockey': 'hockey',
                'field hockey': 'hockey',
                'rugby': 'rugby union',
                'mixed martial arts': 'mma',
                'formula 1': 'motorsports',
                'motor sports': 'motorsports',
                'winter sports': 'wintersports'
            };
            
            return sportMap[sport] || sport;
        }
        
        // Enhanced sport patterns with better matching
        const sportPatterns = {
            tennis: [
                'tennis', 'wimbledon', 'us open', 'australian open', 'french open', 
                'atp', 'wta', 'davis cup', 'grand slam', 'roland garros'
            ],
            football: [
                'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga', 
                'world cup', 'euro', 'mls', 'fa cup', 'ligue 1', 'europa league', 
                'copa america', 'afcon', 'asian cup', 'concacaf', 'uefa', 'fifa'
            ],
            badminton: [
                'badminton', 'bwf', 'all england', 'thomas cup', 'uber cup', 
                'sudirman cup', 'world championship'
            ],
            golf: [
                'golf', 'pga', 'european tour', 'masters tournament', 'us open', 
                'the open', 'ryder cup', 'augusta', 'pga tour'
            ],
            baseball: [
                'baseball', 'mlb', 'world series', 'major league baseball', 
                'npb', 'kbo', 'little league'
            ],
            basketball: [
                'nba', 'basketball', 'euroleague', 'wnba', 'ncaa', 'fiba',
                'basketball championship'
            ],
            snooker: [
                'snooker', 'world snooker', 'uk championship', 'masters snooker',
                'world championship'
            ],
            cricket: [
                'cricket', 'icc', 'ipl', 't20', 'test match', 'odi', 'big bash', 
                'psl', 'cpl', 'world cup', 'ashes', 'county championship'
            ],
            hockey: [
                'hockey', 'nhl', 'khl', 'stanley cup', 'ice hockey', 'field hockey',
                'world hockey'
            ],
            handball: [
                'handball', 'euro handball', 'world handball', 'handball championship'
            ],
            darts: [
                'darts', 'pdc', 'world darts', 'premier league darts', 'darts championship'
            ],
            'rugby union': [
                'rugby union', 'six nations', 'super rugby', 'premiership', 
                'rugby championship', 'world cup', 'rugby'
            ],
            volleyball: [
                'volleyball', 'beach volleyball', 'fivb', 'world volleyball',
                'volleyball championship'
            ],
            mma: [
                'ufc', 'mma', 'mixed martial arts', 'bellator', 'one championship',
                'ultimate fighting'
            ],
            equestrian: [
                'equestrian', 'horse racing', 'derby', 'grand national', 
                'show jumping', 'royal ascot', 'kentucky derby'
            ],
            wintersports: [
                'wintersports', 'skiing', 'snowboarding', 'biathlon', 'cross-country', 
                'alpine', 'winter olympics', 'ski jump'
            ],
            motorsports: [
                'f1', 'formula 1', 'nascar', 'motogp', 'indycar', 'wec', 'wrc', 
                'formula e', 'racing', 'grand prix'
            ]
        };
        
        // Check tournament names first
        for (const [sport, patterns] of Object.entries(sportPatterns)) {
            if (patterns.some(pattern => tournament.includes(pattern))) {
                console.log(`Matched ${sport} via tournament: ${tournament}`);
                return sport;
            }
        }
        
        // Check match names as fallback
        for (const [sport, patterns] of Object.entries(sportPatterns)) {
            if (patterns.some(pattern => matchName.includes(pattern))) {
                console.log(`Matched ${sport} via match name: ${matchName}`);
                return sport;
            }
        }
        
        // Final fallback based on common patterns
        if (tournament.includes('football') || matchName.includes('vs') || matchName.includes('fc')) {
            return 'football';
        }
        
        console.log(`No sport match found, defaulting to 'other'. Tournament: ${tournament}, Match: ${matchName}`);
        return 'other';
    }
    
    convertUnixToLocalTime(unixTimestamp) {
        if (!unixTimestamp) return 'TBD';
        return new Date(unixTimestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    checkIfLive(match) {
        if (!match.unix_timestamp) return false;
        
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unix_timestamp;
        const threeHours = 3 * 60 * 60; // Extended to 3 hours for longer matches
        
        // Match is live if current time is between match start and 3 hours after
        const isLive = now >= matchTime && now <= (matchTime + threeHours);
        
        // Enhanced debugging
        if (match.match && match.match.includes('TEST')) {
            console.log('TEST MATCH LIVE CHECK:', {
                teams: match.match,
                matchTime: matchTime,
                now: now,
                difference: now - matchTime,
                isLive: isLive,
                window: `${new Date(matchTime * 1000).toLocaleTimeString()} - ${new Date((matchTime + threeHours) * 1000).toLocaleTimeString()}`
            });
        }
        
        return isLive;
    }
    
    debugSportsCategorization() {
        console.log('=== SPORTS CATEGORIZATION DEBUG ===');
        const sportsCount = {};
        
        this.verifiedMatches.forEach(match => {
            if (!sportsCount[match.sport]) {
                sportsCount[match.sport] = 0;
            }
            sportsCount[match.sport]++;
        });
        
        console.log('Sports distribution:', sportsCount);
        console.log('Total matches:', this.verifiedMatches.length);
        console.log('Live matches:', this.verifiedMatches.filter(m => m.isLive).length);
        
        // Log sample matches from each sport
        Object.keys(sportsCount).forEach(sport => {
            const sampleMatches = this.verifiedMatches
                .filter(m => m.sport === sport)
                .slice(0, 2);
            console.log(`Sample ${sport} matches:`, sampleMatches.map(m => ({
                teams: m.teams,
                league: m.league,
                isLive: m.isLive
            })));
        });
    }
    
    // ... rest of your existing methods remain the same ...
    showMainMenu() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" onclick="matchScheduler.showSportsView()">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">Live games & schedules</div>
                    </div>
                    <div class="menu-button tv-button" onclick="matchScheduler.showTVChannels()">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                </div>
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
    }
    
    showSportsView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;

        // Get all sports that have matches, sorted by match count
        const sports = [
            { id: 'football', name: '⚽ Football' },
            { id: 'basketball', name: '🏀 Basketball' },
            { id: 'tennis', name: '🎾 Tennis' },
            { id: 'cricket', name: '🏏 Cricket' },
            { id: 'baseball', name: '⚾ Baseball' },
            { id: 'hockey', name: '🏒 Hockey' },
            { id: 'rugby union', name: '🏉 Rugby' },
            { id: 'golf', name: '⛳ Golf' },
            { id: 'motorsports', name: '🏎️ Motorsports' },
            { id: 'mma', name: '🥊 MMA' },
            { id: 'boxing', name: '🥊 Boxing' },
            { id: 'volleyball', name: '🏐 Volleyball' },
            { id: 'badminton', name: '🏸 Badminton' },
            { id: 'snooker', name: '🎱 Snooker' },
            { id: 'darts', name: '🎯 Darts' },
            { id: 'wintersports', name: '⛷️ Wintersports' },
            { id: 'equestrian', name: '🏇 Equestrian' },
            { id: 'handball', name: '🤾 Handball' },
            { id: 'other', name: '🏆 Other Sports' }
        ].map(sport => ({
            ...sport,
            count: this.getMatchesBySport(sport.id).length,
            liveCount: this.getMatchesBySport(sport.id).filter(m => m.isLive).length
        })).filter(sport => sport.count > 0)
          .sort((a, b) => b.count - a.count);

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Choose Sport</h2>
                    <p>Select a sport to view matches</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <div class="match-count">${sport.count} match${sport.count !== 1 ? 'es' : ''}${sport.liveCount > 0 ? ` • ${sport.liveCount} live` : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
        this.currentSport = null;
    }

    // ... keep all your other existing methods exactly as they were ...
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});
