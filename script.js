// Sport71.pro Style Match Schedules - CLEAN 3-STEP NAVIGATION
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.showSportSelection();
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
        this.updateAnalytics();
    }
    
    // STEP 1: Show Sport Selection
    showSportSelection() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const sports = [
            { id: 'soccer', name: '⚽ Soccer', count: this.getMatchesBySport('soccer').length },
            { id: 'basketball', name: '🏀 Basketball', count: this.getMatchesBySport('basketball').length },
            { id: 'cricket', name: '🏏 Cricket', count: this.getMatchesBySport('cricket').length },
            { id: 'american football', name: '🏈 American Football', count: this.getMatchesBySport('american football').length }
        ];
        
        container.innerHTML = `
            <div class="sport-selection-page">
                <div class="page-header">
                    <h2>Choose Your Sport</h2>
                    <p>Select a sport to view available matches</p>
                </div>
                
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-card" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-icon">${sport.name.split(' ')[0]}</div>
                            <div class="sport-info">
                                <h3>${sport.name.split(' ').slice(1).join(' ')}</h3>
                                <span class="match-count">${sport.count} matches</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // STEP 2: Show Dates for Selected Sport
    selectSport(sport) {
        this.currentSport = sport;
        this.currentDate = null;
        this.showDateSelection();
    }
    
    showDateSelection() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = this.getUniqueDates(matches);
        
        container.innerHTML = `
            <div class="date-selection-page">
                <div class="page-header">
                    <button class="back-btn" onclick="matchScheduler.showSportSelection()">← Back to Sports</button>
                    <h2>${this.getSportDisplayName()} Matches</h2>
                    <p>Select a date to view matches</p>
                </div>
                
                <div class="dates-grid">
                    ${dates.map(date => {
                        const dateMatches = matches.filter(m => m.date === date);
                        return `
                            <div class="date-card" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-display">${this.formatDisplayDate(date)}</div>
                                <div class="date-match-count">${dateMatches.length} matches</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
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
        
        container.innerHTML = `
            <div class="matches-page">
                <div class="page-header">
                    <button class="back-btn" onclick="matchScheduler.showDateSelection()">← Back to Dates</button>
                    <h2>${this.getSportDisplayName()} • ${this.formatDisplayDate(this.currentDate)}</h2>
                    <p>${matches.length} matches scheduled</p>
                </div>
                
                <div class="matches-container">
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
        
        this.startLiveUpdates();
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
                    <div class="league">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.streamUrl ? 
                        `<button class="watch-btn ${match.isLive ? 'live-watch-btn' : ''}" onclick="matchScheduler.watchMatch('${match.streamUrl}')">
                            ${match.isLive ? 'LIVE NOW' : 'WATCH'}
                        </button>` :
                        `<span class="no-stream">OFFLINE</span>`
                    }
                </div>
            </div>
        `;
    }
    
    // Helper methods
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase().includes(sport.toLowerCase())
        );
    }
    
    getMatchesBySportAndDate(sport, date) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase().includes(sport.toLowerCase()) && 
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
    
    correctSportClassification(match) {
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        
        if (tournament.includes('cricket') || tournament.includes('icc')) {
            return 'Cricket';
        }
        
        const americanFootballTerms = ['nfl', 'college football', 'ncaa football'];
        const hasAmericanFootballContent = americanFootballTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        );
        
        const basketballTerms = ['nba', 'basketball'];
        const hasBasketballContent = basketballTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        );
        
        if (hasAmericanFootballContent) return 'American Football';
        if (hasBasketballContent) return 'Basketball';
        
        return 'Soccer';
    }
    
    isValidMatch(match) {
        const matchName = (match.teams || '').toLowerCase();
        return !(matchName.includes('undefined') || matchName.includes('null') || matchName.length < 3);
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
    
    shouldShowLivePlaceholder(match) {
        if (!match.unixTimestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unixTimestamp;
        const oneHour = 60 * 60;
        return Math.abs(now - matchTime) <= oneHour;
    }
    
    updateLiveStatus() {
        let hasUpdates = false;
        this.verifiedMatches.forEach(match => {
            const wasLive = match.isLive;
            match.isLive = this.checkIfLive(match);
            if (wasLive !== match.isLive) hasUpdates = true;
        });
        if (hasUpdates && this.currentDate) {
            this.showMatches(); // Refresh matches view if live status changes
        }
    }
    
    updateAnalytics() {
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
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
                    <button onclick="matchScheduler.init()" class="retry-btn">Try Again</button>
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
            this.loadMatches().then(() => {
                // Refresh current view if needed
                if (this.currentDate) {
                    this.showMatches();
                } else if (this.currentSport) {
                    this.showDateSelection();
                }
            });
        }, 5 * 60 * 1000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
