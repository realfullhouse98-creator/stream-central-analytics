// Uncle Stream - Sports Schedules (Enhanced Version)
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'sports';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.showSportsView();
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
        if (!apiData || !apiData.events) return;
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach((match) => {
                    if (match && match.match) {
                        const matchTime = this.convertUnixToLocalTime(match.unix_timestamp);
                        const sportType = this.classifySport(match);
                        
                        const processedMatch = {
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport || 'Sports',
                            streamUrl: match.channels && match.channels[0] ? match.channels[0] : null,
                            isLive: this.checkIfLive(match),
                            sport: sportType,
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
        
        // Cricket
        if (tournament.includes('cricket') || tournament.includes('icc') || 
            tournament.includes('ipl') || tournament.includes('t20') ||
            tournament.includes('test match') || tournament.includes('odi') ||
            tournament.includes('big bash') || tournament.includes('psl') ||
            tournament.includes('caribbean premier league') || tournament.includes('the hundred')) {
            return 'cricket';
        }
        
        // Basketball
        if (tournament.includes('nba') || tournament.includes('basketball') ||
            tournament.includes('euroleague') || tournament.includes('wnba') ||
            tournament.includes('ncaa') || tournament.includes('fibra')) {
            return 'basketball';
        }
        
        // American Football
        if (tournament.includes('nfl') || tournament.includes('college football') ||
            tournament.includes('super bowl') || tournament.includes('ncaa football') ||
            tournament.includes('cfp') || tournament.includes('madden')) {
            return 'american football';
        }
        
        // Soccer/Football
        if (tournament.includes('premier league') || tournament.includes('champions league') ||
            tournament.includes('la liga') || tournament.includes('serie a') ||
            tournament.includes('bundesliga') || tournament.includes('world cup') ||
            tournament.includes('euro') || tournament.includes('mls') ||
            tournament.includes('fa cup') || tournament.includes('ligue 1') ||
            tournament.includes('europa league') || tournament.includes('copa america') ||
            tournament.includes('afcon') || tournament.includes('asian cup') ||
            tournament.includes('concacaf') || tournament.includes('libertadores') ||
            tournament.includes('uefa') || tournament.includes('fifa') ||
            tournament.includes('world cup qualifiers') || tournament.includes('friendlies') ||
            tournament.includes('carabao cup') || tournament.includes('coppa italia') ||
            tournament.includes('copa del rey') || tournament.includes('dfb pokal')) {
            return 'soccer';
        }
        
        // Rugby
        if (tournament.includes('rugby') || tournament.includes('six nations') ||
            tournament.includes('super rugby') || tournament.includes('premiership') ||
            tournament.includes('rugby championship') || tournament.includes('world cup rugby') ||
            tournament.includes('rugby league') || tournament.includes('rugby union')) {
            return 'rugby';
        }
        
        // Hockey
        if (tournament.includes('hockey') || tournament.includes('nhl') ||
            tournament.includes('khl') || tournament.includes('stanley cup') ||
            tournament.includes('ice hockey') || tournament.includes('ahl') ||
            tournament.includes('world championship') || tournament.includes('iihf')) {
            return 'hockey';
        }
        
        // Tennis
        if (tournament.includes('tennis') || tournament.includes('wimbledon') ||
            tournament.includes('us open') || tournament.includes('australian open') ||
            tournament.includes('french open') || tournament.includes('atp') || 
            tournament.includes('wta') || tournament.includes('davis cup') ||
            tournament.includes('grand slam') || tournament.includes('masters')) {
            return 'tennis';
        }
        
        // Baseball
        if (tournament.includes('baseball') || tournament.includes('mlb') ||
            tournament.includes('world series') || tournament.includes('mlb world series') ||
            tournament.includes('major league baseball') || tournament.includes('npb') ||
            tournament.includes('kbo') || tournament.includes('little league')) {
            return 'baseball';
        }

        // MMA/UFC
        if (tournament.includes('ufc') || tournament.includes('mma') ||
            tournament.includes('mixed martial arts') || tournament.includes('bellator') ||
            tournament.includes('one championship') || tournament.includes('pfl')) {
            return 'mma';
        }

        // Boxing
        if (tournament.includes('boxing') || tournament.includes('wbc') ||
            tournament.includes('wba') || tournament.includes('wbo') ||
            tournament.includes('ibf') || tournament.includes('heavyweight') ||
            matchName.includes('vs') && (matchName.includes('boxing') || matchName.includes('fight'))) {
            return 'boxing';
        }
        
        // Motorsports
        if (tournament.includes('f1') || tournament.includes('formula 1') ||
            tournament.includes('nascar') || tournament.includes('motogp') ||
            tournament.includes('indycar') || tournament.includes('wec') ||
            tournament.includes('formula e') || tournament.includes('wrc')) {
            return 'motorsports';
        }
        
        // Golf
        if (tournament.includes('golf') || tournament.includes('pga') ||
            tournament.includes('european tour') || tournament.includes('masters tournament') ||
            tournament.includes('us open') || tournament.includes('the open') ||
            tournament.includes('ryder cup')) {
            return 'golf';
        }
        
        // Default to Soccer for any football-related content
        if (tournament.includes('football') || matchName.includes('vs') || 
            matchName.includes('fc') || matchName.includes('united')) {
            return 'soccer';
        }
        
        return 'other';
    }
    
    convertUnixToLocalTime(unixTimestamp) {
        if (!unixTimestamp) return 'TBD';
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    checkIfLive(match) {
        if (!match.unixTimestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unixTimestamp;
        const twoHours = 2 * 60 * 60;
        return now >= matchTime && now <= (matchTime + twoHours);
    }
    
    // STEP 1: Show Sports Selection
    showSportsView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const sports = [
            { id: 'soccer', name: 'Soccer', icon: '⚽', count: this.getMatchesBySport('soccer').length },
            { id: 'basketball', name: 'Basketball', icon: '🏀', count: this.getMatchesBySport('basketball').length },
            { id: 'cricket', name: 'Cricket', icon: '🏏', count: this.getMatchesBySport('cricket').length },
            { id: 'american football', name: 'American Football', icon: '🏈', count: this.getMatchesBySport('american football').length },
            { id: 'rugby', name: 'Rugby', icon: '🏉', count: this.getMatchesBySport('rugby').length },
            { id: 'hockey', name: 'Hockey', icon: '🏒', count: this.getMatchesBySport('hockey').length },
            { id: 'tennis', name: 'Tennis', icon: '🎾', count: this.getMatchesBySport('tennis').length },
            { id: 'baseball', name: 'Baseball', icon: '⚾', count: this.getMatchesBySport('baseball').length },
            { id: 'mma', name: 'MMA/UFC', icon: '🥊', count: this.getMatchesBySport('mma').length },
            { id: 'boxing', name: 'Boxing', icon: '👊', count: this.getMatchesBySport('boxing').length },
            { id: 'motorsports', name: 'Motorsports', icon: '🏎️', count: this.getMatchesBySport('motorsports').length },
            { id: 'golf', name: 'Golf', icon: '⛳', count: this.getMatchesBySport('golf').length },
            { id: 'other', name: 'Other Sports', icon: '🏆', count: this.getMatchesBySport('other').length }
        ].filter(sport => sport.count > 0); // Only show sports that have matches
        
        container.innerHTML = `
            <div class="streams-grid">
                ${sports.map(sport => `
                    <div class="match-card sport-category" onclick="matchScheduler.selectSport('${sport.id}')">
                        <div class="match-header">
                            <div class="team-logo sport-icon">${sport.icon}</div>
                            <div class="vs sport-name">${sport.name}</div>
                            <div class="team-logo match-count">${sport.count}</div>
                        </div>
                        <h4>${sport.count} Match${sport.count !== 1 ? 'es' : ''} Available</h4>
                        <div class="match-info">
                            <span class="date">Click to view dates</span>
                            <span class="match-status status-upcoming">SELECT</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${sports.length === 0 ? '<div class="loading-streams">No matches available at the moment</div>' : ''}
        `;
        
        this.currentView = 'sports';
        this.currentSport = null;
        this.currentDate = null;
    }
    
    // STEP 2: Show Dates for Selected Sport
    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }
    
    showDatesView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = this.getUniqueDates(matches);
        const sportName = this.getSportDisplayName();
        
        container.innerHTML = `
            <div class="section-header">
                <h2>${sportName} Matches</h2>
                <p>Select a date to view matches</p>
            </div>
            <div class="streams-grid">
                ${dates.map(date => {
                    const dateMatches = matches.filter(m => m.date === date);
                    const liveMatches = dateMatches.filter(m => m.isLive).length;
                    return `
                        <div class="match-card date-card" onclick="matchScheduler.selectDate('${date}')">
                            <div class="match-header">
                                <div class="team-logo">📅</div>
                                <div class="vs">${this.formatDisplayDate(date)}</div>
                                <div class="team-logo">${dateMatches.length}</div>
                            </div>
                            <h4>${dateMatches.length} Match${dateMatches.length !== 1 ? 'es' : ''}${liveMatches > 0 ? ` • ${liveMatches} LIVE` : ''}</h4>
                            <div class="match-info">
                                <span class="date">${sportName}</span>
                                <span class="match-status ${liveMatches > 0 ? 'status-live' : 'status-upcoming'}">${liveMatches > 0 ? 'LIVE' : 'VIEW'}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="back-btn" onclick="matchScheduler.showSportsView()">← Back to Sports</button>
            </div>
        `;
        
        this.currentView = 'dates';
        this.currentDate = null;
    }
    
    // STEP 3: Show Matches for Selected Date
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
        
        // Update live status for all matches
        matches.forEach(match => {
            match.isLive = this.checkIfLive(match);
        });
        
        const liveMatches = matches.filter(m => m.isLive).length;
        
        container.innerHTML = `
            <div class="section-header">
                <h2>${sportName} • ${displayDate}</h2>
                <p>${matches.length} matches scheduled • ${liveMatches} live now</p>
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
    
    // Helper Methods
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport.toLowerCase() === sport.toLowerCase());
    }
    
    getMatchesBySportAndDate(sport, date) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase() === sport.toLowerCase() && match.date === date
        );
    }
    
    getUniqueDates(matches) {
        const dates = [...new Set(matches.map(match => match.date))];
        return dates.sort((a, b) => new Date(a) - new Date(b));
    }
    
    getSportDisplayName() {
        const names = {
            'soccer': 'Soccer',
            'basketball': 'Basketball',
            'cricket': 'Cricket',
            'american football': 'American Football',
            'rugby': 'Rugby',
            'hockey': 'Hockey',
            'tennis': 'Tennis',
            'baseball': 'Baseball',
            'mma': 'MMA/UFC',
            'boxing': 'Boxing',
            'motorsports': 'Motorsports',
            'golf': 'Golf',
            'other': 'Other Sports'
        };
        return names[this.currentSport] || this.currentSport;
    }
    
    formatDisplayDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    updateLiveStatus() {
        if (this.currentView === 'matches') {
            this.showMatchesView();
        }
    }
    
    updateAnalytics() {
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
        
        // Update live viewers count (simulated)
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        document.getElementById('live-viewers').textContent = liveMatches * 125; // Simulated viewer count
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
                if (this.currentView === 'matches') {
                    this.showMatchesView();
                } else if (this.currentView === 'dates') {
                    this.showDatesView();
                } else {
                    this.showSportsView();
                }
            });
        }, 5 * 60 * 1000);
    }
}

// Add enhanced styles to the document
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    /* Enhanced table styles */
    .matches-table {
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
        border: 1px solid rgba(255,215,0,0.2);
        overflow: hidden;
        margin-bottom: 20px;
    }

    .table-header {
        display: grid;
        grid-template-columns: 100px 1fr 120px;
        background: rgba(255,255,255,0.1);
        color: white;
        font-weight: bold;
        padding: 15px 25px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .match-row {
        display: grid;
        grid-template-columns: 100px 1fr 120px;
        padding: 15px 25px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        align-items: center;
        transition: background 0.3s ease;
    }

    .match-row:hover {
        background: rgba(255,255,255,0.05);
    }

    .match-row:last-child {
        border-bottom: none;
    }

    /* Live match styling */
    .match-row.live {
        background: rgba(255,107,107,0.1);
        border-left: 3px solid #ff6b6b;
    }

    .match-time {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        color: #ffd93d;
    }

    .live-badge {
        background: #ff6b6b;
        color: white;
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 0.7em;
        font-weight: bold;
    }

    .team-names {
        font-weight: bold;
        color: white;
        margin-bottom: 4px;
    }

    .league-name {
        color: rgba(255,255,255,0.7);
        font-size: 0.9em;
    }

    .watch-action {
        text-align: center;
    }

    .watch-btn {
        background: linear-gradient(45deg, #ff6b6b, #ffd93d);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
        min-width: 80px;
    }

    .watch-btn.live {
        background: linear-gradient(45deg, #ff6b6b, #e74c3c);
        animation: pulse 2s infinite;
    }

    .watch-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255,107,107,0.3);
    }

    .offline-text {
        color: rgba(255,255,255,0.5);
        font-style: italic;
        font-size: 0.9em;
    }

    .no-matches {
        text-align: center;
        padding: 40px;
        color: rgba(255,255,255,0.7);
        grid-column: 1 / -1;
    }

    .error-message {
        text-align: center;
        padding: 60px;
        color: rgba(255,255,255,0.7);
    }

    .retry-btn {
        background: rgba(52,152,219,0.2);
        color: #3498db;
        border: 1px solid #3498db;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 20px;
        transition: all 0.3s ease;
    }

    .retry-btn:hover {
        background: rgba(52,152,219,0.3);
    }

    .back-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .back-btn:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
    }

    /* Sport category enhancements */
    .sport-category:hover {
        border-color: rgba(255,217,61,0.4);
        transform: translateY(-5px);
    }

    .sport-icon {
        font-size: 1.2em;
    }

    .sport-name {
        font-weight: bold;
    }

    .match-count {
        background: rgba(255,217,61,0.2);
        color: #ffd93d;
    }

    /* Pulse animation for live elements */
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }

    /* Responsive design for tables */
    @media (max-width: 768px) {
        .table-header {
            grid-template-columns: 80px 1fr 100px;
            padding: 12px 15px;
            font-size: 0.9em;
        }

        .match-row {
            grid-template-columns: 80px 1fr 100px;
            padding: 12px 15px;
        }

        .watch-btn {
            padding: 6px 12px;
            font-size: 0.8em;
            min-width: 70px;
        }

        .match-time {
            font-size: 0.9em;
        }

        .team-names {
            font-size: 0.9em;
        }

        .league-name {
            font-size: 0.8em;
        }
    }

    @media (max-width: 480px) {
        .table-header {
            grid-template-columns: 70px 1fr 90px;
            padding: 10px 12px;
            font-size: 0.8em;
        }

        .match-row {
            grid-template-columns: 70px 1fr 90px;
            padding: 10px 12px;
        }

        .watch-btn {
            padding: 5px 10px;
            font-size: 0.7em;
            min-width: 60px;
        }
    }
`;
document.head.appendChild(enhancedStyles);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
