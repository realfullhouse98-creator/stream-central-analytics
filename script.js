// Uncle Stream - Complete with TV Channels
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'sports';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.currentTab = 'sports';
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.showNavigation();
        this.startAutoRefresh();
    }
    
    async loadMatches() {
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            this.organizeMatches(apiData);
        } catch (error) {
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData?.events) return;
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match?.match) {
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
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
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
        if (!match.unixTimestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unixTimestamp;
        return now >= matchTime && now <= (matchTime + 7200);
    }
    
    showNavigation() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="navigation-tabs">
                <button class="tab-btn ${this.currentTab === 'sports' ? 'active' : ''}" onclick="matchScheduler.switchTab('sports')">
                    🏆 Sports Matches
                </button>
                <button class="tab-btn ${this.currentTab === 'tv' ? 'active' : ''}" onclick="matchScheduler.switchTab('tv')">
                    📺 TV Channels
                </button>
            </div>
            <div id="tab-content"></div>
        `;
        
        this.showTabContent();
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        this.currentView = 'main';
        this.showNavigation();
    }
    
    showTabContent() {
        const content = document.getElementById('tab-content');
        if (!content) return;
        
        if (this.currentTab === 'sports') {
            this.showSportsView();
        } else {
            this.showTVChannels();
        }
    }
    
    showSportsView() {
        const content = document.getElementById('tab-content');
        if (!content) return;
        
        const sports = [
            { id: 'tennis', name: 'Tennis', icon: '🎾' },
            { id: 'football', name: 'Football', icon: '⚽' },
            { id: 'badminton', name: 'Badminton', icon: '🏸' },
            { id: 'golf', name: 'Golf', icon: '⛳' },
            { id: 'baseball', name: 'Baseball', icon: '⚾' },
            { id: 'basketball', name: 'Basketball', icon: '🏀' },
            { id: 'snooker', name: 'Snooker', icon: '🎱' },
            { id: 'cricket', name: 'Cricket', icon: '🏏' },
            { id: 'hockey', name: 'Hockey', icon: '🏒' },
            { id: 'handball', name: 'Handball', icon: '🤾' },
            { id: 'darts', name: 'Darts', icon: '🎯' },
            { id: 'rugby union', name: 'Rugby Union', icon: '🏉' },
            { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
            { id: 'mma', name: 'MMA', icon: '🥊' },
            { id: 'equestrian', name: 'Equestrian', icon: '🏇' },
            { id: 'wintersports', name: 'Wintersports', icon: '⛷️' },
            { id: 'motorsports', name: 'Motorsports', icon: '🏎️' },
            { id: 'other', name: 'Other Sports', icon: '🏆' }
        ].map(sport => ({
            ...sport,
            count: this.getMatchesBySport(sport.id).length
        })).filter(sport => sport.count > 0);
        
        content.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h2>Live Sports Schedules</h2>
                    <p>Select a sport to view available matches</p>
                </div>
                <div class="streams-grid compact">
                    ${sports.map(sport => `
                        <div class="match-card sport-category" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="match-header">
                                <div class="team-logo sport-icon">${sport.icon}</div>
                                <div class="vs sport-name">${sport.name}</div>
                                <div class="team-logo match-count">${sport.count}</div>
                            </div>
                            <h4>${sport.count} Match${sport.count !== 1 ? 'es' : ''}</h4>
                            <div class="match-info">
                                <span class="date">View Schedule</span>
                                <span class="match-status status-upcoming">GO</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${sports.length === 0 ? '<div class="loading-streams">No matches available at the moment</div>' : ''}
            </div>
        `;
        
        this.currentView = 'sports';
        this.currentSport = null;
    }
    
    showTVChannels() {
        const content = document.getElementById('tab-content');
        if (!content) return;
        
        const tvChannels = [
            { name: 'Sky Sports Main Event', icon: '📡', category: 'Sports', url: 'https://example.com/sky-sports' },
            { name: 'BT Sport 1', icon: '⚽', category: 'Sports', url: 'https://example.com/bt-sport' },
            { name: 'ESPN', icon: '🏀', category: 'Sports', url: 'https://example.com/espn' },
            { name: 'beIN Sports', icon: '🌍', category: 'Sports', url: 'https://example.com/beinsports' },
            { name: 'NBA TV', icon: '🏀', category: 'Basketball', url: 'https://example.com/nba-tv' },
            { name: 'NFL Network', icon: '🏈', category: 'American Football', url: 'https://example.com/nfl' },
            { name: 'MLB Network', icon: '⚾', category: 'Baseball', url: 'https://example.com/mlb' },
            { name: 'NHL Network', icon: '🏒', category: 'Hockey', url: 'https://example.com/nhl' },
            { name: 'Tennis Channel', icon: '🎾', category: 'Tennis', url: 'https://example.com/tennis' },
            { name: 'Sky Sports Cricket', icon: '🏏', category: 'Cricket', url: 'https://example.com/cricket' },
            { name: 'Eurosport 1', icon: '🏆', category: 'Multi-Sport', url: 'https://example.com/eurosport' },
            { name: 'DAZN', icon: '🎯', category: 'Sports', url: 'https://example.com/dazn' }
        ];
        
        content.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h2>Live TV Channels</h2>
                    <p>Click on any channel to start watching</p>
                </div>
                <div class="streams-grid">
                    ${tvChannels.map(channel => `
                        <div class="tv-channel-card" onclick="window.open('${channel.url}', '_blank')">
                            <div class="tv-channel-icon">${channel.icon}</div>
                            <div class="tv-channel-name">${channel.name}</div>
                            <div class="tv-channel-category">${channel.category}</div>
                            <button class="watch-btn">WATCH LIVE</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }
    
    showDatesView() {
        const content = document.getElementById('tab-content');
        if (!content) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.getSportDisplayName();
        
        content.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h2>${sportName} Matches</h2>
                    <p>Select a date to view matches</p>
                </div>
                <div class="streams-grid">
                    ${dates.map(date => {
                        const dateMatches = matches.filter(m => m.date === date);
                        const liveCount = dateMatches.filter(m => m.isLive).length;
                        return `
                            <div class="match-card date-card" onclick="matchScheduler.selectDate('${date}')">
                                <div class="match-header">
                                    <div class="team-logo">📅</div>
                                    <div class="vs">${this.formatDisplayDate(date)}</div>
                                    <div class="team-logo">${dateMatches.length}</div>
                                </div>
                                <h4>${dateMatches.length} Match${dateMatches.length !== 1 ? 'es' : ''}${liveCount > 0 ? ` • ${liveCount} LIVE` : ''}</h4>
                                <div class="match-info">
                                    <span class="date">${sportName}</span>
                                    <span class="match-status ${liveCount > 0 ? 'status-live' : 'status-upcoming'}">
                                        ${liveCount > 0 ? 'LIVE' : 'VIEW'}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="back-btn" onclick="matchScheduler.showSportsView()">← Back to Sports</button>
                </div>
            </div>
        `;
        
        this.currentView = 'dates';
        this.currentDate = null;
    }
    
    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }
    
    showMatchesView() {
        const content = document.getElementById('tab-content');
        if (!content) return;
        
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.getSportDisplayName();
        const displayDate = this.formatDisplayDate(this.currentDate);
        const liveCount = matches.filter(m => m.isLive).length;
        
        content.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h2>${sportName} • ${displayDate}</h2>
                    <p>${matches.length} matches scheduled • ${liveCount} live now</p>
                </div>
                
                <div class="matches-table">
                    <div class="table-header">
                        <div>Time</div>
                        <div>Match</div>
                        <div>Watch</div>
                    </div>
                    ${matches.length > 0 ? 
                        matches.map(match => this.renderMatchRow(match)).join('') :
                        '<div class="no-matches">No matches found for this date</div>'
                    }
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="back-btn" onclick="matchScheduler.showDatesView()">← Back to Dates</button>
                </div>
            </div>
        `;
        
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
            year: 'numeric',
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
                else this.showNavigation();
            });
        }, 300000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});
