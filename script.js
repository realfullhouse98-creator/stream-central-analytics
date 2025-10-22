// Sport71.pro Style Match Schedules - PROFESSIONAL VERSION
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
                    if (match && match.match) {
                        const matchTime = this.convertUnixToLocalTime(match.unix_timestamp);
                        const correctedSport = this.correctSportClassification(match);
                        
                        const processedMatch = {
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport || 'Football',
                            streamUrl: this.getStreamUrl(match.channels),
                            isLive: this.checkIfLive(match),
                            sport: correctedSport,
                            unixTimestamp: match.unix_timestamp,
                            displayDate: this.formatDisplayDate(date)
                        };
                        
                        this.allMatches.push(processedMatch);
                        
                        if (this.isValidMatch(processedMatch)) {
                            this.verifiedMatches.push(processedMatch);
                        }
                    }
                });
            }
        });
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        console.log(`✅ Loaded ${this.verifiedMatches.length} matches`);
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
        
        // Cricket detection
        if (tournament.includes('cricket') || tournament.includes('icc')) {
            return 'Cricket';
        }
        
        // American Football detection
        const americanFootballTerms = ['nfl', 'college football', 'ncaa football'];
        const americanFootballTeams = ['packers', 'chiefs', 'patriots', 'cowboys'];
        
        const hasAmericanFootballContent = 
            americanFootballTerms.some(term => tournament.includes(term)) ||
            americanFootballTeams.some(team => matchName.includes(team)) ||
            tournament.includes('college football');
        
        // Basketball detection
        const basketballTerms = ['nba', 'basketball'];
        const hasBasketballContent = basketballTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        );
        
        // Default to Soccer for most football matches
        if (hasAmericanFootballContent) return 'American Football';
        if (hasBasketballContent) return 'Basketball';
        
        return 'Soccer'; // Default for international football
    }
    
    isValidMatch(match) {
        const matchName = (match.teams || '').toLowerCase();
        
        if (matchName.includes('undefined') || matchName.includes('null')) {
            return false;
        }
        
        if (matchName.length < 3) {
            return false;
        }
        
        return true;
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
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    displayScheduledEvents() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="sports-navigation">
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
            
            <div class="matches-container">
                <div class="matches-header">
                    <h3>${this.getSectionTitle()}</h3>
                    <span class="match-count">${this.getFilteredMatches().length} matches</span>
                </div>
                
                <div class="day-organized-matches">
                    ${this.renderDaySections()}
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
                    <div class="day-section fade-in">
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
                                    <div>Time</div>
                                    <div>Match</div>
                                    <div>Watch</div>
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
                <div class="match-time">
                    <span class="time">${match.time}</span>
                    ${match.isLive ? '<span class="live-badge">LIVE</span>' : 
                      showLivePlaceholder ? '<span class="live-badge loading">LIVE</span>' : ''}
                </div>
                <div class="match-details">
                    <div class="teams">${match.teams}</div>
                    <div class="league">${match.league} • ${match.sport}</div>
                </div>
                <div class="watch-action">
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
        // FIX: Instant update instead of waiting
        this.updateDisplay();
    }
    
    updateDisplay() {
        const matchesSection = document.querySelector('.day-organized-matches');
        if (matchesSection) {
            matchesSection.innerHTML = this.renderDaySections();
            this.attachDayDropdownListeners();
        }
        
        // FIX: Instant sport button updates
        document.querySelectorAll('.sport-btn').forEach(btn => {
            const btnSport = btn.getAttribute('data-sport');
            btn.classList.toggle('active', btnSport === this.currentSport);
        });
        
        // FIX: Instant section title update
        const sectionTitle = document.querySelector('.matches-header h3');
        if (sectionTitle) {
            sectionTitle.textContent = this.getSectionTitle();
        }
        
        // FIX: Instant match count update
        const matchCount = document.querySelector('.match-count');
        if (matchCount) {
            matchCount.textContent = `${this.getFilteredMatches().length} matches`;
        }
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

// NO CSS HERE - Using your professional CSS classes only

document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
