// Uncle Stream - Enhanced Live Detection Version
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
            console.log('🔍 Loading matches from API...');
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            this.organizeMatches(apiData);
        } catch (error) {
            console.error('API Error:', error);
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData?.events) {
            console.log('❌ No events found in API data');
            console.log('📊 API response:', apiData);
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        console.log('📅 API Events structure:', Object.keys(apiData.events));
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            console.log(`🕒 Processing date: ${date}, matches count:`, Array.isArray(matches) ? matches.length : 'N/A');
            
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match?.match) {
                        // Enhanced debugging for raw match data
                        if (match.unix_timestamp) {
                            const matchTime = new Date(match.unix_timestamp * 1000);
                            const now = new Date();
                            const timeDiff = (now.getTime() - matchTime.getTime()) / (1000 * 60); // minutes
                            
                            console.log('⚽ Raw match:', {
                                teams: match.match,
                                timestamp: match.unix_timestamp,
                                matchTime: matchTime.toLocaleString(),
                                currentTime: now.toLocaleString(),
                                difference: timeDiff.toFixed(1) + ' minutes',
                                tournament: match.tournament
                            });
                        }
                        
                        const processedMatch = {
                            date: date,
                            time: this.convertUnixToLocalTime(match.unix_timestamp),
                            teams: match.match,
                            league: match.tournament || match.sport || 'Sports',
                            streamUrl: match.channels?.[0] || null,
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
        
        // TEST: Add guaranteed live matches for debugging
        const now = Math.floor(Date.now() / 1000);
        this.verifiedMatches.push({
            date: new Date().toISOString().split('T')[0],
            time: 'NOW',
            teams: 'TEST LIVE FOOTBALL 🔴',
            league: 'Live Test League',
            streamUrl: 'https://example.com',
            isLive: true,
            sport: 'football',
            unixTimestamp: now - 1800 // 30 minutes ago
        });
        
        this.verifiedMatches.push({
            date: new Date().toISOString().split('T')[0],
            time: 'SOON',
            teams: 'TEST UPCOMING MATCH ⏰',
            league: 'Upcoming Test',
            streamUrl: 'https://example.com',
            isLive: false,
            sport: 'basketball',
            unixTimestamp: now + 3600 // 1 hour from now
        });
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
        
        // Enhanced debug log
        console.log('=== 🎯 MATCH ANALYSIS ===');
        console.log('Total matches loaded:', this.verifiedMatches.length);
        
        const liveMatches = this.verifiedMatches.filter(m => m.isLive);
        const realLiveMatches = liveMatches.filter(m => !m.teams.includes('TEST'));
        
        console.log('Live matches found:', liveMatches.length);
        console.log('Real live matches:', realLiveMatches.length);
        console.log('Test live matches:', liveMatches.length - realLiveMatches.length);
        
        liveMatches.forEach(match => {
            const timeDiff = (Math.floor(Date.now() / 1000) - match.unixTimestamp) / 60;
            console.log('🔴 LIVE MATCH:', {
                teams: match.teams,
                time: match.time, 
                timestamp: match.unixTimestamp,
                started: timeDiff.toFixed(1) + ' minutes ago',
                isTest: match.teams.includes('TEST')
            });
        });
        
        // Show real matches that should be live but aren't
        const realMatches = this.verifiedMatches.filter(m => !m.teams.includes('TEST'));
        const shouldBeLive = realMatches.filter(m => {
            if (!m.unixTimestamp) return false;
            const now = Math.floor(Date.now() / 1000);
            return now >= m.unixTimestamp && now <= (m.unixTimestamp + 7200); // 2-hour window
        });
        
        console.log('Real matches that should be LIVE:', shouldBeLive.length);
        shouldBeLive.forEach(match => {
            const timeDiff = (Math.floor(Date.now() / 1000) - match.unixTimestamp) / 60;
            console.log('❓ Should be LIVE:', {
                teams: match.teams,
                time: match.time,
                timestamp: match.unixTimestamp,
                started: timeDiff.toFixed(1) + ' minutes ago',
                isLive: match.isLive
            });
        });
    }
    
    classifySport(match) {
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        
        const sportPatterns = {
            tennis: ['tennis', 'wimbledon', 'us open', 'australian open', 'french open', 'atp', 'wta', 'davis cup'],
            football: ['premier league', 'champions league', 'la liga', 'serie a', 'bundesliga', 'world cup', 
                      'euro', 'mls', 'fa cup', 'ligue 1', 'europa league', 'copa america', 'afcon', 'asian cup'],
            badminton: ['badminton', 'bwf', 'all england', 'thomas cup', 'uber cup'],
            golf: ['golf', 'pga', 'european tour', 'masters tournament', 'us open', 'the open', 'ryder cup'],
            baseball: ['baseball', 'mlb', 'world series', 'major league baseball', 'npb', 'kbo'],
            basketball: ['nba', 'basketball', 'euroleague', 'wnba', 'ncaa', 'fibra'],
            snooker: ['snooker', 'world snooker', 'uk championship', 'masters snooker'],
            cricket: ['cricket', 'icc', 'ipl', 't20', 'test match', 'odi', 'big bash', 'psl', 'cpl'],
            hockey: ['hockey', 'nhl', 'khl', 'stanley cup', 'ice hockey', 'field hockey'],
            handball: ['handball', 'euro handball', 'world handball'],
            darts: ['darts', 'pdc', 'world darts', 'premier league darts'],
            'rugby union': ['rugby union', 'six nations', 'super rugby', 'premiership', 'rugby championship'],
            volleyball: ['volleyball', 'beach volleyball', 'fivb', 'world volleyball'],
            mma: ['ufc', 'mma', 'mixed martial arts', 'bellator', 'one championship'],
            equestrian: ['equestrian', 'horse racing', 'derby', 'grand national', 'show jumping'],
            wintersports: ['wintersports', 'skiing', 'snowboarding', 'biathlon', 'cross-country', 'alpine'],
            motorsports: ['f1', 'formula 1', 'nascar', 'motogp', 'indycar', 'wec', 'wrc', 'formula e']
        };
        
        for (const [sport, patterns] of Object.entries(sportPatterns)) {
            if (patterns.some(pattern => tournament.includes(pattern))) {
                return sport;
            }
        }
        
        return tournament.includes('football') || matchName.includes('vs') ? 'football' : 'other';
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
        if (!match.unix_timestamp) {
            console.log('⏰ No timestamp for match:', match.match);
            return false;
        }
        
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unix_timestamp;
        const twoHours = 2 * 60 * 60;
        
        // Match is live if current time is between match start and 2 hours after
        const isLive = now >= matchTime && now <= (matchTime + twoHours);
        
        // Enhanced debugging for ALL matches
        if (isLive || match.teams?.includes('TEST')) {
            const timeDiff = (now - matchTime) / 60; // minutes
            console.log('🔍 LIVE CHECK:', {
                teams: match.match,
                matchTime: new Date(matchTime * 1000).toLocaleTimeString(),
                currentTime: new Date(now * 1000).toLocaleTimeString(),
                timeDifference: timeDiff.toFixed(1) + ' minutes',
                isLive: isLive,
                window: `${new Date(matchTime * 1000).toLocaleTimeString()} - ${new Date((matchTime + twoHours) * 1000).toLocaleTimeString()}`
            });
        }
        
        return isLive;
    }
    
    showStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) {
            analytics.style.display = 'grid';
        }
    }
    
    hideStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) {
            analytics.style.display = 'none';
        }
    }
    
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

        const sports = [
            { id: 'tennis', name: 'Tennis' },
            { id: 'football', name: 'Football' },
            { id: 'badminton', name: 'Badminton' },
            { id: 'golf', name: 'Golf' },
            { id: 'baseball', name: 'Baseball' },
            { id: 'basketball', name: 'Basketball' },
            { id: 'snooker', name: 'Snooker' },
            { id: 'cricket', name: 'Cricket' },
            { id: 'hockey', name: 'Hockey' },
            { id: 'handball', name: 'Handball' },
            { id: 'darts', name: 'Darts' },
            { id: 'rugby union', name: 'Rugby Union' },
            { id: 'volleyball', name: 'Volleyball' },
            { id: 'mma', name: 'MMA' },
            { id: 'equestrian', name: 'Equestrian' },
            { id: 'wintersports', name: 'Wintersports' },
            { id: 'motorsports', name: 'Motorsports' },
            { id: 'other', name: 'Other Sports' }
        ].map(sport => ({
            ...sport,
            count: this.getMatchesBySport(sport.id).length
        })).filter(sport => sport.count > 0);

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Choose</h2>
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
        this.currentSport = null;
    }
    
    showTVChannels() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const tvChannels = [
            { name: 'Sky Sports Main Event', category: 'Sports', url: 'https://example.com/sky-sports' },
            { name: 'BT Sport 1', category: 'Sports', url: 'https://example.com/bt-sport' },
            { name: 'ESPN', category: 'Sports', url: 'https://example.com/espn' },
            { name: 'beIN Sports', category: 'Sports', url: 'https://example.com/beinsports' },
            { name: 'NBA TV', category: 'Basketball', url: 'https://example.com/nba-tv' },
            { name: 'NFL Network', category: 'American Football', url: 'https://example.com/nfl' },
            { name: 'MLB Network', category: 'Baseball', url: 'https://example.com/mlb' },
            { name: 'NHL Network', category: 'Hockey', url: 'https://example.com/nhl' },
            { name: 'Tennis Channel', category: 'Tennis', url: 'https://example.com/tennis' },
            { name: 'Sky Sports Cricket', category: 'Cricket', url: 'https://example.com/cricket' },
            { name: 'Eurosport 1', category: 'Multi-Sport', url: 'https://example.com/eurosport' },
            { name: 'DAZN', category: 'Sports', url: 'https://example.com/dazn' }
        ];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>TV Channels</h2>
                    <p>Click any channel to watch live</p>
                </div>
                <div class="streams-grid">
                    ${tvChannels.map(channel => `
                        <div class="tv-channel-card" onclick="window.open('${channel.url}', '_blank')">
                            <div class="tv-channel-name">${channel.name}</div>
                            <div class="tv-channel-category">${channel.category}</div>
                            <button class="watch-btn">WATCH LIVE</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
    }
    
    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }
    
    showDatesView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
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
                    <p>Select a date</p>
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
        this.currentDate = null;
    }
    
    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }
    
    showMatchesView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.getSportDisplayName();
        const displayDate = this.formatDisplayDate(this.currentDate);
        const liveCount = matches.filter(m => m.isLive).length;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showDatesView()">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName} • ${displayDate}</h2>
                    <p>${matches.length} matches • ${liveCount} live</p>
                </div>
                
                <div class="matches-table">
                    <div class="table-header">
                        <div>Time</div>
                        <div>Match</div>
                        <div>Watch</div>
                    </div>
                    ${matches.length > 0 ? 
                        matches.map(match => this.renderMatchRow(match)).join('') :
                        '<div class="no-matches">No matches found</div>'
                    }
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'matches';
        this.startLiveUpdates();
    }
    
    renderMatchRow(match) {
        const isLive = match.isLive;
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">
                    ${match.time}
                    ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
                <div class="match-details">
                    <div class="team-names">${match.teams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.streamUrl ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="window.open('${match.streamUrl}', '_blank')">
                            ${isLive ? 'LIVE NOW' : 'WATCH'}
                        </button>` :
                        '<span class="offline-text">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport.toLowerCase() === sport.toLowerCase());
    }
    
    getMatchesBySportAndDate(sport, date) {
        return this.getMatchesBySport(sport).filter(match => match.date === date);
    }
    
    getSportDisplayName() {
        const names = {
            'tennis': 'Tennis',
            'football': 'Football',
            'badminton': 'Badminton',
            'golf': 'Golf',
            'baseball': 'Baseball',
            'basketball': 'Basketball',
            'snooker': 'Snooker',
            'cricket': 'Cricket',
            'hockey': 'Hockey',
            'handball': 'Handball',
            'darts': 'Darts',
            'rugby union': 'Rugby Union',
            'volleyball': 'Volleyball',
            'mma': 'MMA',
            'equestrian': 'Equestrian',
            'wintersports': 'Wintersports',
            'motorsports': 'Motorsports',
            'other': 'Other Sports'
        };
        return names[this.currentSport] || this.currentSport;
    }
    
    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }
    
    updateLiveStatus() {
        if (this.currentView === 'matches') this.showMatchesView();
    }
    
    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('live-viewers').textContent = liveMatches * 125;
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    showError() {
        const container = document.getElementById('psl-streams-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Unable to Load Schedules</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="matchScheduler.init()">Try Again</button>
                </div>
            `;
        }
    }
    
    startLiveUpdates() {
        setInterval(() => this.updateLiveStatus(), 30000);
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches().then(() => {
                if (this.currentView === 'matches') this.showMatchesView();
                else if (this.currentView === 'dates') this.showDatesView();
                else if (this.currentView === 'sports') this.showSportsView();
            });
        }, 300000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});
