// Sport71.pro Style Match Schedules - FIXED COLORS VERSION
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentSport = 'all';
        this.verifiedMatches = [];
        this.expandedDays = new Set();
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.displayScheduledEvents();
        this.startLiveUpdates();
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
                    if (match && match.match && match.sport) {
                        const matchTime = this.convertUnixToLocalTime(match.unix_timestamp);
                        const correctedSport = this.correctSportClassification(match);
                        
                        const processedMatch = {
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport,
                            streamUrl: this.getStreamUrl(match.channels),
                            isLive: this.checkIfLive(match),
                            sport: correctedSport,
                            unixTimestamp: match.unix_timestamp,
                            displayDate: this.formatDisplayDate(date)
                        };
                        
                        this.allMatches.push(processedMatch);
                        if (this.isContentAccurate(processedMatch)) {
                            this.verifiedMatches.push(processedMatch);
                        }
                    }
                });
            }
        });
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
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
    
    correctSportClassification(match) {
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        
        // FIX: Kaizer Chiefs is Soccer (South African team)
        if (matchName.includes('kaizer chiefs') || matchName.includes('orlando pirates')) {
            return 'Soccer';
        }
        
        // Cricket detection
        if (tournament.includes('cricket') || tournament.includes('icc')) {
            return 'Cricket';
        }
        
        // Women's Football detection
        if (matchName.includes(' w ') || matchName.includes('women')) {
            if (tournament.includes('football') || tournament.includes('soccer')) {
                return 'Soccer';
            }
        }
        
        // American Football detection
        const americanFootballTerms = ['nfl', 'college football', 'ncaa football'];
        const americanFootballTeams = ['packers', 'chiefs', 'patriots', 'cowboys', 'raiders', 'broncos'];
        
        const hasAmericanFootballContent = 
            americanFootballTerms.some(term => tournament.includes(term)) ||
            americanFootballTeams.some(team => matchName.includes(team)) ||
            tournament.includes('college football');
        
        // Soccer detection
        const soccerTerms = [
            'champions league', 'premier league', 'la liga', 'serie a', 'bundesliga',
            'europa league', 'copa libertadores', 'copa sudamericana', 'african'
        ];
        
        const soccerTeams = [
            'kaizer', 'chiefs', 'pirates', 'sundowns', 'manchester', 'liverpool', 
            'chelsea', 'arsenal', 'barcelona', 'real madrid', 'bayern'
        ];
        
        const hasSoccerContent = soccerTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        ) || soccerTeams.some(team =>
            matchName.includes(team)
        );
        
        if (hasAmericanFootballContent) return 'American Football';
        if (hasSoccerContent) return 'Soccer';
        
        return sport.charAt(0).toUpperCase() + sport.slice(1);
    }
    
    isContentAccurate(match) {
        const matchName = (match.teams || '').toLowerCase();
        return !(matchName.includes('undefined') || matchName.includes('null') || 
                matchName.length < 5 || matchName === 'vs' || matchName === 'tbd');
    }
    
    getStreamUrl(channels) {
        return channels && Array.isArray(channels) && channels.length > 0 ? channels[0] : null;
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
    
    updateLiveStatus() {
        let hasUpdates = false;
        this.verifiedMatches.forEach(match => {
            const wasLive = match.isLive;
            match.isLive = this.checkIfLive(match);
            if (wasLive !== match.isLive) hasUpdates = true;
        });
        if (hasUpdates) this.updateDisplay();
    }
    
    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        document.getElementById('total-streams').textContent = liveMatches;
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    displayScheduledEvents() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        // REMOVED: Don't show duplicate header here, let HTML handle it
        
        container.innerHTML = `
            <div class="scheduled-events">
                <!-- Header removed - using HTML header instead -->
                
                <div class="sports-categories">
                    <button class="sport-btn ${this.currentSport === 'all' ? 'active' : ''}" data-sport="all">
                        All Sports (${this.verifiedMatches.length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'soccer' ? 'active' : ''}" data-sport="soccer">
                        Soccer (${this.getVerifiedMatchesBySport('soccer').length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'american football' ? 'active' : ''}" data-sport="american football">
                        American Football (${this.getVerifiedMatchesBySport('american football').length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'basketball' ? 'active' : ''}" data-sport="basketball">
                        Basketball (${this.getVerifiedMatchesBySport('basketball').length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'cricket' ? 'active' : ''}" data-sport="cricket">
                        Cricket (${this.getVerifiedMatchesBySport('cricket').length})
                    </button>
                </div>
                
                <div class="matches-section">
                    <div class="section-title-bar">
                        <h2 class="section-title">${this.getSectionTitle()}</h2>
                        <span class="match-count">${this.getFilteredMatches().length} matches</span>
                    </div>
                    
                    <div class="day-organized-matches">
                        ${this.renderDaySections()}
                    </div>
                </div>
            </div>
        `;
        
        this.attachSportButtonListeners();
        this.attachDayDropdownListeners();
    }
    
    renderDaySections() {
        const filteredMatches = this.getFilteredMatches();
        
        const matchesByDate = {};
        filteredMatches.forEach(match => {
            if (!matchesByDate[match.date]) {
                matchesByDate[match.date] = [];
            }
            matchesByDate[match.date].push(match);
        });
        
        if (Object.keys(matchesByDate).length === 0) {
            return `<div class="no-matches">No ${this.currentSport === 'all' ? '' : this.currentSport + ' '}matches available</div>`;
        }
        
        return Object.entries(matchesByDate)
            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
            .map(([date, matches]) => {
                const isExpanded = this.expandedDays.has(date);
                const matchCount = matches.length;
                
                return `
                    <div class="day-section">
                        <div class="day-header ${isExpanded ? 'expanded' : ''}" data-date="${date}">
                            <div class="day-title">
                                <span class="dropdown-arrow">${isExpanded ? '▼' : '►'}</span>
                                ${this.formatDisplayDate(date)}
                            </div>
                            <div class="day-match-count">${matchCount} match${matchCount !== 1 ? 'es' : ''}</div>
                        </div>
                        <div class="day-matches ${isExpanded ? 'expanded' : 'collapsed'}">
                            <div class="matches-table">
                                <div class="table-header">
                                    <div class="col-time">Time</div>
                                    <div class="col-match">Match</div>
                                    <div class="col-watch">Watch</div>
                                </div>
                                <div class="table-body">
                                    ${matches.map(match => this.renderMatchRow(match)).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }
    
    renderMatchRow(match) {
        const showLivePlaceholder = this.shouldShowLivePlaceholder(match);
        
        return `
            <div class="match-row ${match.isLive ? 'live-match' : ''} ${showLivePlaceholder ? 'live-placeholder' : ''}">
                <div class="col-time">
                    ${match.time}
                    ${match.isLive ? '<span class="live-badge">LIVE</span>' : 
                      showLivePlaceholder ? '<span class="live-badge loading">LIVE</span>' : ''}
                </div>
                <div class="col-match">
                    <div class="teams">${match.teams}</div>
                    <div class="league">${match.league} • ${match.sport}</div>
                </div>
                <div class="col-watch">
                    ${match.streamUrl ? 
                        `<button class="watch-btn ${match.isLive ? 'live-watch-btn' : ''} ${showLivePlaceholder ? 'live-watch-btn loading' : ''}" onclick="matchScheduler.watchMatch('${match.streamUrl}')">
                            ${match.isLive ? 'LIVE NOW' : showLivePlaceholder ? 'CHECKING...' : 'WATCH'}
                        </button>` :
                        `<span class="no-stream">OFFLINE</span>`
                    }
                </div>
            </div>
        `;
    }
    
    shouldShowLivePlaceholder(match) {
        if (!match.unixTimestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unixTimestamp;
        const oneHour = 60 * 60;
        return Math.abs(now - matchTime) <= oneHour;
    }
    
    attachSportButtonListeners() {
        document.querySelectorAll('.sport-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sport = e.target.getAttribute('data-sport');
                this.setSport(sport);
            });
        });
    }
    
    attachDayDropdownListeners() {
        document.querySelectorAll('.day-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const date = e.currentTarget.getAttribute('data-date');
                this.toggleDay(date);
            });
        });
    }
    
    toggleDay(date) {
        if (this.expandedDays.has(date)) {
            this.expandedDays.delete(date);
        } else {
            this.expandedDays.add(date);
        }
        this.updateDisplay();
    }
    
    getVerifiedMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase().includes(sport.toLowerCase())
        );
    }
    
    getSectionTitle() {
        if (this.currentSport === 'all') return 'All Sports Events';
        return `${this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1)} Matches`;
    }
    
    getFilteredMatches() {
        return this.currentSport === 'all' ? this.verifiedMatches : this.getVerifiedMatchesBySport(this.currentSport);
    }
    
    setSport(sport) {
        this.currentSport = sport;
        this.updateDisplay();
    }
    
    updateDisplay() {
        const matchesSection = document.querySelector('.day-organized-matches');
        if (matchesSection) {
            matchesSection.innerHTML = this.renderDaySections();
            this.attachDayDropdownListeners();
        }
        
        document.querySelectorAll('.sport-btn').forEach(btn => {
            const btnSport = btn.getAttribute('data-sport');
            btn.classList.toggle('active', btnSport === this.currentSport);
        });
    }
    
    watchMatch(streamUrl) {
        if (streamUrl) window.open(streamUrl, '_blank');
    }
    
    showError() {
        const container = document.getElementById('psl-streams-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>Unable to Load Schedules</h3>
                    <p>Please check your connection and try again.</p>
                    <button onclick="matchScheduler.loadMatches()" class="retry-btn">Try Again</button>
                </div>
            `;
        }
    }
    
    startLiveUpdates() {
        setTimeout(() => this.updateLiveStatus(), 1000);
        setInterval(() => this.updateLiveStatus(), 30000);
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches().then(() => this.displayScheduledEvents());
        }, 5 * 60 * 1000);
    }
}

// Add CSS with FIXED COLORS and BETTER CONTRAST
const sportsStyles = document.createElement('style');
sportsStyles.textContent = `
    .scheduled-events {
        background: white;
        border-radius: 12px;
        padding: 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        margin: 20px auto;
        max-width: 1200px;
        width: 95%;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .sports-categories {
        padding: 22px 30px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .sport-btn {
        background: white;
        border: 2px solid #dee2e6;
        padding: 12px 22px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 1em;
        font-weight: 600;
        transition: all 0.3s ease;
        color: #495057;
        letter-spacing: 0.3px;
    }
    
    .sport-btn:hover {
        border-color: #adb5bd;
        transform: translateY(-1px);
    }
    
    .sport-btn.active {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
    }
    
    .matches-section {
        padding: 28px 32px;
    }
    
    .section-title-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f1f2f6;
    }
    
    .section-title {
        margin: 0;
        color: #2c3e50;
        font-size: 1.8em;
        font-weight: 700;
        letter-spacing: -0.3px;
    }
    
    .match-count {
        background: #3498db;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    
    .day-organized-matches {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .day-section {
        border: 1px solid #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        transition: box-shadow 0.3s ease;
    }
    
    .day-section:hover {
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }
    
    .day-header {
        background: linear-gradient(135deg, #2c3e50, #34495e);
        padding: 20px 25px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s ease;
        border-bottom: 1px solid #2c3e50;
    }
    
    .day-header:hover {
        background: linear-gradient(135deg, #34495e, #2c3e50);
    }
    
    .day-header.expanded {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border-bottom-color: #c0392b;
    }
    
    .day-title {
        font-weight: 700;
        font-size: 1.3em;
        display: flex;
        align-items: center;
        gap: 14px;
        letter-spacing: 0.2px;
        color: white; /* FIX: White text on dark background */
    }
    
    .dropdown-arrow {
        font-size: 0.9em;
        transition: transform 0.3s ease;
        font-weight: 700;
        color: white;
    }
    
    .day-match-count {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.85em;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    
    .day-matches {
        transition: all 0.3s ease;
    }
    
    .day-matches.collapsed {
        display: none;
    }
    
    .day-matches.expanded {
        display: block;
    }
    
    .matches-table {
        background: white;
    }
    
    .table-header {
        display: grid;
        grid-template-columns: 110px 1fr 120px;
        background: #34495e;
        color: white;
        font-weight: 700;
        padding: 18px 25px;
        font-size: 1em;
        letter-spacing: 0.5px;
    }
    
    .col-time {
        color: white; /* FIX: White text for "Time" header */
        font-weight: 700;
    }
    
    .match-row, .no-matches {
        display: grid;
        grid-template-columns: 110px 1fr 120px;
        padding: 18px 25px;
        border-bottom: 1px solid #f8f9fa;
        align-items: center;
        transition: background 0.2s ease;
    }
    
    .match-row:hover {
        background: #f8f9fa;
    }
    
    .live-match {
        background: #fffaf0 !important;
        border-left: 4px solid #e74c3c;
    }
    
    .live-placeholder {
        background: #f8f9fa !important;
        border-left: 4px solid #ffa500;
    }
    
    .col-time {
        font-weight: 600;
        color: #2c3e50; /* Match times in dark color */
        font-size: 1em;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .live-badge {
        background: #e74c3c;
        color: white;
        padding: 5px 10px;
        border-radius: 12px;
        font-size: 0.75em;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        animation: pulse 2s infinite;
    }
    
    .live-badge.loading {
        background: #ffa500;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
    
    .col-match .teams {
        font-weight: 700;
        margin-bottom: 6px;
        color: #2c3e50;
        font-size: 1.1em;
        line-height: 1.3;
        letter-spacing: 0.2px;
    }
    
    .col-match .league {
        font-size: 0.9em;
        color: #7f8c8d;
        font-weight: 500;
        letter-spacing: 0.2px;
    }
    
    .watch-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 10px 18px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 700;
        transition: all 0.3s ease;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
    }
    
    .watch-btn:hover {
        background: #c0392b;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
    }
    
    .live-watch-btn {
        background: #dc3545;
        animation: pulse 2s infinite;
        font-weight: 800;
    }
    
    .live-watch-btn.loading {
        background: #ffa500;
        animation: pulse 1s infinite;
    }
    
    .no-stream {
        color: #95a5a6;
        font-style: italic;
        font-size: 0.9em;
        font-weight: 500;
    }
    
    .no-matches, .error-state {
        text-align: center;
        padding: 40px 30px;
        color: #7f8c8d;
        font-size: 1.1em;
        font-weight: 500;
    }
    
    .error-state {
        grid-column: 1 / -1;
    }
`;
document.head.appendChild(sportsStyles);

document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
