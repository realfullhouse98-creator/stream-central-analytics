// Sport71.pro Style Match Schedules - DAY ORGANIZED VERSION
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentSport = 'all';
        this.verifiedMatches = [];
        this.expandedDays = new Set(); // Track which days are expanded
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
        
        // Sort by date and time
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        
        // Auto-expand today by default
        const today = new Date().toISOString().split('T')[0];
        this.expandedDays.add(today);
        
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
        
        if (tournament.includes('cricket') || tournament.includes('icc')) {
            return 'Cricket';
        }
        
        if (matchName.includes(' w ') || matchName.includes('women')) {
            if (tournament.includes('football') || tournament.includes('soccer')) {
                return 'Soccer';
            }
        }
        
        const americanFootballTerms = ['nfl', 'college football', 'ncaa football'];
        const americanFootballTeams = ['packers', 'chiefs', 'patriots', 'cowboys'];
        
        const hasAmericanFootballContent = 
            americanFootballTerms.some(term => tournament.includes(term)) ||
            americanFootballTeams.some(team => matchName.includes(team)) ||
            tournament.includes('college football');
        
        const soccerTerms = [
            'champions league', 'premier league', 'la liga', 'serie a', 'bundesliga',
            'europa league', 'copa libertadores', 'copa sudamericana'
        ];
        
        const hasSoccerContent = soccerTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
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
        
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        container.innerHTML = `
            <div class="scheduled-events">
                <div class="events-header">
                    <h1 class="main-title">Live Sports Schedules</h1>
                    <div class="current-date-display">${currentDate}</div>
                </div>
                
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
        
        // Group matches by date
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
        
        // Create day sections
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
        // Show loading state immediately, then update when live detection completes
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
        // Show placeholder for matches happening around now
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
        // Update immediately on load
        setTimeout(() => this.updateLiveStatus(), 1000);
        // Then update every 30 seconds
        setInterval(() => this.updateLiveStatus(), 30000);
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches().then(() => this.displayScheduledEvents());
        }, 5 * 60 * 1000);
    }
}

// Add CSS with Day Organization and Live Animations
const sportsStyles = document.createElement('style');
sportsStyles.textContent = `
    .scheduled-events {
        background: white;
        border-radius: 15px;
        padding: 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        margin: 20px auto;
        max-width: 1200px;
        width: 95%;
    }
    
    .events-header {
        background: linear-gradient(135deg, #34495e, #2c3e50);
        color: white;
        padding: 25px 30px;
        border-radius: 15px 15px 0 0;
        text-align: center;
    }
    
    .main-title {
        margin: 0 0 8px 0;
        font-size: 2.2em;
        font-weight: 700;
        color: white;
    }
    
    .current-date-display {
        font-size: 1.3em;
        color: #ecf0f1;
        font-weight: 500;
    }
    
    .sports-categories {
        padding: 20px 25px;
        background: #f8f9fa;
        border-bottom: 2px solid #e9ecef;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .sport-btn {
        background: white;
        border: 2px solid #dee2e6;
        padding: 10px 18px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.95em;
        font-weight: 600;
        transition: all 0.3s ease;
        color: #495057;
    }
    
    .sport-btn.active {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
    }
    
    .matches-section {
        padding: 25px;
    }
    
    .section-title-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .section-title {
        margin: 0;
        color: #2c3e50;
        font-size: 1.6em;
        font-weight: 600;
    }
    
    .match-count {
        background: #3498db;
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.9em;
        font-weight: 600;
    }
    
    .day-organized-matches {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .day-section {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .day-header {
        background: #f8f9fa;
        padding: 15px 20px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.3s ease;
        border-bottom: 1px solid #e9ecef;
    }
    
    .day-header:hover {
        background: #e9ecef;
    }
    
    .day-header.expanded {
        background: #e74c3c;
        color: white;
    }
    
    .day-title {
        font-weight: 600;
        font-size: 1.1em;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .dropdown-arrow {
        font-size: 0.8em;
        transition: transform 0.3s ease;
    }
    
    .day-header.expanded .dropdown-arrow {
        transform: rotate(0deg);
    }
    
    .day-match-count {
        background: rgba(255,255,255,0.2);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.85em;
        font-weight: 600;
    }
    
    .day-header.expanded .day-match-count {
        background: rgba(255,255,255,0.3);
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
        grid-template-columns: 100px 1fr 110px;
        background: #2c3e50;
        color: white;
        font-weight: 600;
        padding: 15px 20px;
    }
    
    .match-row, .no-matches {
        display: grid;
        grid-template-columns: 100px 1fr 110px;
        padding: 15px 20px;
        border-bottom: 1px solid #f1f2f6;
        align-items: center;
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
        color: #e74c3c;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .live-badge {
        background: #e74c3c;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7em;
        font-weight: 700;
        text-transform: uppercase;
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
        font-weight: 600;
        margin-bottom: 4px;
        color: #2c3e50;
        font-size: 1em;
    }
    
    .col-match .league {
        font-size: 0.85em;
        color: #7f8c8d;
    }
    
    .watch-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.85em;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .live-watch-btn {
        background: #dc3545;
        animation: pulse 2s infinite;
    }
    
    .live-watch-btn.loading {
        background: #ffa500;
        animation: pulse 1s infinite;
    }
    
    .no-matches, .error-state {
        text-align: center;
        padding: 30px;
        color: #7f8c8d;
    }
    
    .error-state {
        grid-column: 1 / -1;
    }
`;
document.head.appendChild(sportsStyles);

document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
