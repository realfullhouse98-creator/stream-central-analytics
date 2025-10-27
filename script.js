// 9kilo Stream - Fixed Layout & Clean Structure
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.matchPolls = new Map();
        this.init();
    }
    
    async init() {
        // Load matches in background
        this.loadMatches().catch(console.error);
        
        // Show main menu immediately
        this.showMainMenu();
        
        // Start background updates
        this.startAutoRefresh();
    }
    
    async loadMatches() {
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            this.organizeMatches(apiData);
        } catch (error) {
            console.warn('API load failed:', error);
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
                        const matchId = this.generateMatchId(match);
                        
                        if (!this.matchStats.has(matchId)) {
                            this.matchStats.set(matchId, {
                                views: Math.floor(Math.random() * 10000) + 500,
                                likes: Math.floor(Math.random() * 500) + 50,
                                dislikes: Math.floor(Math.random() * 100) + 10
                            });
                        }
                        
                        const processedMatch = {
                            id: matchId,
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
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        
        const sportMapping = {
            'football': 'football',
            'soccer': 'football',
            'ice hockey': 'hockey',
            'hockey': 'hockey',
            'basketball': 'basketball',
            'baseball': 'baseball',
            'tennis': 'tennis',
            'badminton': 'badminton',
            'golf': 'golf',
            'snooker': 'snooker',
            'cricket': 'cricket',
            'handball': 'handball',
            'darts': 'darts',
            'rugby': 'rugby union',
            'volleyball': 'volleyball',
            'mma': 'mma',
            'equestrian': 'equestrian',
            'winter sports': 'wintersports',
            'motorsports': 'motorsports'
        };
        
        if (sport && sportMapping[sport]) {
            return sportMapping[sport];
        }
        
        for (const [key, value] of Object.entries(sportMapping)) {
            if (sport.includes(key) || tournament.includes(key)) {
                return value;
            }
        }
        
        return 'other';
    }
    
    generateMatchId(match) {
        return `${match.match}-${match.unix_timestamp}-${Math.random().toString(36).substr(2, 6)}`;
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
    
    showStats() {
        document.querySelector('.analytics-overview').style.display = 'grid';
    }
    
    hideStats() {
        document.querySelector('.analytics-overview').style.display = 'none';
    }
    
    showMainMenu() {
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" onclick="matchScheduler.showSportsView()">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">Games & schedules</div>
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
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
    }
    
    showCommunity() {
        const container = document.getElementById('psl-streams-container');
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
                        <div class="match-count">Live Chat</div>
                    </div>
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Match Reactions</div>
                        <div class="match-count">Community</div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
    }
    
    showSportsView() {
        const container = document.getElementById('psl-streams-container');
        const sports = [
            { id: 'football', name: 'Football' },
            { id: 'hockey', name: 'Hockey' },
            { id: 'basketball', name: 'Basketball' },
            { id: 'baseball', name: 'Baseball' },
            { id: 'tennis', name: 'Tennis' },
            { id: 'badminton', name: 'Badminton' },
            { id: 'golf', name: 'Golf' },
            { id: 'cricket', name: 'Cricket' },
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
                    <p>Select category</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <!-- REMOVED match count from Choose page -->
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }
    
    showTVChannels() {
        const container = document.getElementById('psl-streams-container');
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
                        <div class="match-count">Sports</div>
                    </div>
                    <div class="sport-button" onclick="alert('ESPN - Coming soon!')">
                        <div class="sport-name">ESPN</div>
                        <div class="match-count">Sports</div>
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
    
    showDatesView() {
        const container = document.getElementById('psl-streams-container');
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
    
    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }
    
    showMatchesView() {
        const container = document.getElementById('psl-streams-container');
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.getSportDisplayName();
        const displayDate = this.formatDisplayDate(this.currentDate);
        
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
                    ${match.streamUrl ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span style="color: var(--text-muted); font-size: 0.8em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    showMatchDetails(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn" onclick="matchScheduler.showMatchesView()">← Back</button>
                    </div>
                    
                    <div class="video-container">
                        <div class="video-player">
                            ${match.streamUrl ? 
                                `<iframe src="${match.streamUrl}" class="stream-iframe" allowfullscreen></iframe>` :
                                `<div class="no-stream">
                                    <h3>Stream Offline</h3>
                                    <p>Check back later</p>
                                </div>`
                            }
                        </div>
                        
                        <div class="video-controls">
                            <div class="video-title">${formattedTeams}</div>
                            <div class="video-stats">
                                <span class="views-count">${this.formatNumber(stats.views)} views</span>
                                ${match.isLive ? '<span class="live-badge-details">LIVE</span>' : ''}
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn like-btn" onclick="matchScheduler.handleLike('${matchId}')">
                                    👍 ${this.formatNumber(stats.likes)}
                                </button>
                                <button class="action-btn dislike-btn" onclick="matchScheduler.handleDislike('${matchId}')">
                                    👎 ${this.formatNumber(stats.dislikes)}
                                </button>
                                <button class="action-btn" onclick="matchScheduler.handleShare('${matchId}')">
                                    📤 Share
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    ${this.getTeamName(match.teams, 0)} vs ${this.getTeamName(match.teams, 1)} - ${match.league}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.incrementViews(matchId);
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
    
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport === sport);
    }
    
    getMatchesBySportAndDate(sport, date) {
        return this.getMatchesBySport(sport).filter(match => match.date === date);
    }
    
    getSportDisplayName() {
        const names = {
            'football': 'Football',
            'hockey': 'Hockey', 
            'basketball': 'Basketball',
            'baseball': 'Baseball',
            'tennis': 'Tennis',
            'badminton': 'Badminton',
            'golf': 'Golf',
            'cricket': 'Cricket',
            'other': 'Other Sports'
        };
        return names[this.currentSport] || this.currentSport;
    }
    
    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        const totalViewers = this.verifiedMatches.reduce((sum, match) => {
            const stats = this.matchStats.get(match.id);
            return sum + (stats ? stats.views : 0);
        }, 0);
        
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('live-viewers').textContent = this.formatNumber(Math.floor(totalViewers / 100));
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches();
        }, 300000);
    }
}

// Initialize immediately
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});
