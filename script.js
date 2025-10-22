// Uncle Stream - Sports Schedules (Using Your Existing CSS)
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
        
        if (tournament.includes('cricket') || tournament.includes('icc')) return 'Cricket';
        if (tournament.includes('nba') || matchName.includes('basketball')) return 'Basketball';
        if (tournament.includes('nfl') || tournament.includes('college football')) return 'American Football';
        return 'Soccer';
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
            { id: 'american football', name: 'American Football', icon: '🏈', count: this.getMatchesBySport('american football').length }
        ];
        
        container.innerHTML = `
            <div class="streams-grid">
                ${sports.map(sport => `
                    <div class="match-card" onclick="matchScheduler.selectSport('${sport.id}')">
                        <div class="match-header">
                            <div class="team-logo">${sport.icon}</div>
                            <div class="vs">${sport.name}</div>
                            <div class="team-logo">${sport.count}</div>
                        </div>
                        <h4>${sport.count} Matches Available</h4>
                        <div class="match-info">
                            <span class="date">Click to view dates</span>
                            <span class="match-status status-upcoming">SELECT</span>
                        </div>
                    </div>
                `).join('')}
            </div>
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
                    return `
                        <div class="match-card" onclick="matchScheduler.selectDate('${date}')">
                            <div class="match-header">
                                <div class="team-logo">📅</div>
                                <div class="vs">${this.formatDisplayDate(date)}</div>
                                <div class="team-logo">${dateMatches.length}</div>
                            </div>
                            <h4>${dateMatches.length} Matches</h4>
                            <div class="match-info">
                                <span class="date">${sportName}</span>
                                <span class="match-status status-upcoming">VIEW</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="back-btn" onclick="matchScheduler.showSportsView()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer;">← Back to Sports</button>
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
        
        matches.forEach(match => {
            match.isLive = this.checkIfLive(match);
        });
        
        container.innerHTML = `
            <div class="section-header">
                <h2>${sportName} • ${displayDate}</h2>
                <p>${matches.length} matches scheduled</p>
            </div>
            
            <div class="matches-table" style="background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,215,0,0.2); overflow: hidden;">
                <div class="table-header" style="display: grid; grid-template-columns: 100px 1fr 120px; background: rgba(255,255,255,0.1); color: white; font-weight: bold; padding: 15px 25px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div>Time</div>
                    <div>Match</div>
                    <div>Watch</div>
                </div>
                ${matches.length > 0 ? 
                    matches.map(match => this.renderMatchRow(match)).join('') :
                    '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">No matches found for this date</div>'
                }
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="back-btn" onclick="matchScheduler.showDatesView()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer;">← Back to Dates</button>
            </div>
        `;
        
        this.currentView = 'matches';
        this.startLiveUpdates();
    }
    
    renderMatchRow(match) {
        return `
            <div class="match-row" style="display: grid; grid-template-columns: 100px 1fr 120px; padding: 15px 25px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; transition: background 0.3s ease; ${match.isLive ? 'background: rgba(255,107,107,0.1); border-left: 3px solid #ff6b6b;' : ''}">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: bold; color: #ffd93d;">
                    ${match.time}
                    ${match.isLive ? '<span style="background: #ff6b6b; color: white; padding: 3px 8px; border-radius: 10px; font-size: 0.7em; font-weight: bold;">LIVE</span>' : ''}
                </div>
                <div>
                    <div style="font-weight: bold; color: white; margin-bottom: 4px;">${match.teams}</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9em;">${match.league}</div>
                </div>
                <div style="text-align: center;">
                    ${match.streamUrl ? 
                        `<button style="background: ${match.isLive ? 'linear-gradient(45deg, #ff6b6b, #e74c3c)' : 'linear-gradient(45deg, #ff6b6b, #ffd93d)'}; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; ${match.isLive ? 'animation: pulse 2s infinite;' : ''}" onclick="window.open('${match.streamUrl}', '_blank')">
                            ${match.isLive ? 'LIVE NOW' : 'WATCH'}
                        </button>` :
                        '<span style="color: rgba(255,255,255,0.5); font-style: italic;">OFFLINE</span>'
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
            this.showMatchesView();
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
                <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.7);">
                    <h3>Unable to Load Schedules</h3>
                    <p>Please check your connection and try again.</p>
                    <button style="background: rgba(52,152,219,0.2); color: #3498db; border: 1px solid #3498db; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 20px;" onclick="matchScheduler.init()">Try Again</button>
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

// Add pulse animation to style.css
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
