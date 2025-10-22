// Uncle Stream - Sports Schedules (Using Your Professional CSS)
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
        this.showSports();
        this.startAutoRefresh();
    }
    
    async loadMatches() {
        try {
            console.log('Loading matches from API...');
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            this.organizeMatches(apiData);
        } catch (error) {
            console.error('Failed to load matches:', error);
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData || !apiData.events) {
            console.log('No events data found');
            return;
        }
        
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
                            streamUrl: this.getStreamUrl(match.channels),
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
        console.log(`✅ Loaded ${this.verifiedMatches.length} matches`);
        this.updateAnalytics();
    }
    
    classifySport(match) {
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        
        if (tournament.includes('cricket') || tournament.includes('icc')) return 'Cricket';
        if (tournament.includes('nba') || matchName.includes('basketball')) return 'Basketball';
        if (tournament.includes('nfl') || tournament.includes('college football')) return 'American Football';
        return 'Soccer';
    }
    
    getStreamUrl(channels) {
        if (!channels || !Array.isArray(channels) || channels.length === 0) return null;
        return channels[0];
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
    showSports() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const sports = [
            { id: 'soccer', name: 'Soccer', icon: '⚽', count: this.getMatchesBySport('soccer').length },
            { id: 'basketball', name: 'Basketball', icon: '🏀', count: this.getMatchesBySport('basketball').length },
            { id: 'cricket', name: 'Cricket', icon: '🏏', count: this.getMatchesBySport('cricket').length },
            { id: 'american football', name: 'American Football', icon: '🏈', count: this.getMatchesBySport('american football').length }
        ];
        
        container.innerHTML = `
            <div class="sports-selection-section">
                <div class="section-header">
                    <h2>Choose Your Sport</h2>
                    <p>Select a sport to view available matches</p>
                </div>
                <div class="streams-grid">
                    ${sports.map(sport => `
                        <div class="match-card sport-choice-card" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-icon-large">${sport.icon}</div>
                            <h4>${sport.name}</h4>
                            <div class="match-info">
                                <span class="match-count-badge">${sport.count} matches</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.currentView = 'sports';
        this.currentSport = null;
        this.currentDate = null;
    }
    
    // STEP 2: Show Dates for Selected Sport
    selectSport(sport) {
        this.currentSport = sport;
        this.showDates();
    }
    
    showDates() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = this.getUniqueDates(matches);
        const sportName = this.getSportDisplayName();
        
        container.innerHTML = `
            <div class="dates-selection-section">
                <div class="section-header">
                    <button class="btn back-btn" onclick="matchScheduler.showSports()">← Back to Sports</button>
                    <h2>${sportName} Matches</h2>
                    <p>Select a date to view matches</p>
                </div>
                <div class="streams-grid">
                    ${dates.map(date => {
                        const dateMatches = matches.filter(m => m.date === date);
                        return `
                            <div class="match-card date-choice-card" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-display">${this.formatDisplayDate(date)}</div>
                                <div class="match-info">
                                    <span class="match-status status-upcoming">${dateMatches.length} matches</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.currentView = 'dates';
        this.currentDate = null;
    }
    
    // STEP 3: Show Matches for Selected Date
    selectDate(date) {
        this.currentDate = date;
        this.showMatches();
    }
    
    showMatches() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.getSportDisplayName();
        const displayDate = this.formatDisplayDate(this.currentDate);
        
        matches.forEach(match => {
            match.isLive = this.checkIfLive(match);
        });
        
        container.innerHTML = `
            <div class="matches-view-section">
                <div class="section-header">
                    <button class="btn back-btn" onclick="matchScheduler.showDates()">← Back to Dates</button>
                    <h2>${sportName} • ${displayDate}</h2>
                    <p>${matches.length} matches scheduled</p>
                </div>
                
                <div class="matches-table-container">
                    <div class="matches-table">
                        <div class="table-header-row">
                            <div class="col-time-header">Time</div>
                            <div class="col-match-header">Match</div>
                            <div class="col-watch-header">Watch</div>
                        </div>
                        <div class="table-body">
                            ${matches.length > 0 ? 
                                matches.map(match => this.renderMatchRow(match)).join('') :
                                '<div class="no-matches-message">No matches found for this date</div>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.currentView = 'matches';
        this.startLiveUpdates();
    }
    
    renderMatchRow(match) {
        return `
            <div class="match-table-row ${match.isLive ? 'live-match-row' : ''}">
                <div class="col-time">
                    <span class="match-time">${match.time}</span>
                    ${match.isLive ? '<span class="match-status status-live">LIVE</span>' : ''}
                </div>
                <div class="col-match">
                    <div class="teams-display">${match.teams}</div>
                    <div class="league-display">${match.league}</div>
                </div>
                <div class="col-watch">
                    ${match.streamUrl ? 
                        `<button class="watch-stream-btn ${match.isLive ? 'live-stream-btn' : ''}" onclick="window.open('${match.streamUrl}', '_blank')">
                            ${match.isLive ? 'LIVE NOW' : 'WATCH'}
                        </button>` :
                        '<span class="stream-offline">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    // Helper Methods
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase() === sport.toLowerCase()
        );
    }
    
    getMatchesBySportAndDate(sport, date) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase() === sport.toLowerCase() && 
            match.date === date
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
            'american football': 'American Football'
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
            this.showMatches();
        }
    }
    
    updateAnalytics() {
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    showError() {
        const container = document.getElementById('psl-streams-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>Unable to Load Schedules</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="btn retry-btn" onclick="matchScheduler.init()">Try Again</button>
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
                    this.showMatches();
                } else if (this.currentView === 'dates') {
                    this.showDates();
                } else {
                    this.showSports();
                }
            });
        }, 5 * 60 * 1000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
