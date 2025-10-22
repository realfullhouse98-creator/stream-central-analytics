// Sport71.pro Style Match Schedules
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentSport = 'soccer';
        this.init();
    }
    
    async init() {
        console.log('Loading match schedules...');
        await this.loadMatches();
        this.displayScheduledEvents();
    }
    
    async loadMatches() {
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            
            console.log('API Data received:', apiData);
            
            // Extract and organize matches
            this.organizeMatches(apiData);
            
        } catch (error) {
            console.log('Failed to load matches:', error);
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData || !apiData.events) {
            console.log('No events data found');
            return;
        }
        
        this.allMatches = [];
        
        // Process all dates and matches
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match && this.isSoccerMatch(match)) {
                        this.allMatches.push({
                            date: date,
                            time: match.time || 'TBD',
                            teams: this.getTeamNames(match),
                            league: this.getLeague(match),
                            streamUrl: match.url || null
                        });
                    }
                });
            }
        });
        
        console.log('Organized matches:', this.allMatches);
    }
    
    isSoccerMatch(match) {
        // Focus on soccer/football matches
        const title = (match.title || '').toLowerCase();
        const league = (match.league || '').toLowerCase();
        
        return title.includes('vs') || 
               league.includes('football') || 
               league.includes('soccer') ||
               title.includes('fc') ||
               title.includes('united');
    }
    
    getTeamNames(match) {
        // Extract team names from title
        if (match.title && match.title !== 'Football Match') {
            return match.title;
        }
        if (match.teams) {
            return match.teams;
        }
        return 'Teams TBD';
    }
    
    getLeague(match) {
        if (match.league && match.league !== 'Football') {
            return match.league;
        }
        return 'Football';
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
                    <h2>Scheduled Events</h2>
                    <div class="current-date">${currentDate}</div>
                </div>
                
                <div class="sports-categories">
                    <button class="sport-btn active" onclick="matchScheduler.setSport('soccer')">
                        Soccer
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('rugby')">
                        Rugby
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('hockey')">
                        Hockey
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('basketball')">
                        Basketball
                    </button>
                </div>
                
                <div class="matches-section">
                    <h3>Soccer Matches</h3>
                    <div class="matches-table">
                        <div class="table-header">
                            <div class="col-time">Time</div>
                            <div class="col-match">Match</div>
                            <div class="col-watch">Watch</div>
                        </div>
                        <div class="table-body">
                            ${this.renderMatchesTable()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMatchesTable() {
        if (this.allMatches.length === 0) {
            return `
                <div class="no-matches">
                    <div class="col-time">-</div>
                    <div class="col-match">No scheduled matches found</div>
                    <div class="col-watch">-</div>
                </div>
            `;
        }
        
        // Show first 10 matches for demo
        return this.allMatches.slice(0, 10).map(match => `
            <div class="match-row">
                <div class="col-time">${match.time}</div>
                <div class="col-match">
                    <div class="teams">${match.teams}</div>
                    <div class="league">${match.league}</div>
                </div>
                <div class="col-watch">
                    ${match.streamUrl ? 
                        `<button class="watch-btn" onclick="matchScheduler.watchMatch('${match.streamUrl}')">
                            WATCH
                        </button>` :
                        `<span class="no-stream">OFFLINE</span>`
                    }
                </div>
            </div>
        `).join('');
    }
    
    setSport(sport) {
        this.currentSport = sport;
        
        // Update active button
        document.querySelectorAll('.sport-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update matches section title
        const titleElement = document.querySelector('.matches-section h3');
        if (titleElement) {
            titleElement.textContent = sport.charAt(0).toUpperCase() + sport.slice(1) + ' Matches';
        }
        
        console.log('Switched to sport:', sport);
    }
    
    watchMatch(streamUrl) {
        if (streamUrl) {
            window.open(streamUrl, '_blank');
            this.showNotification('Opening stream...');
        } else {
            this.showNotification('Stream not available');
        }
    }
    
    showError() {
        const container = document.getElementById('psl-streams-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>Unable to Load Schedules</h3>
                    <p>Please check your connection and try again.</p>
                    <button onclick="matchScheduler.loadMatches()" class="retry-btn">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 10000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Add Sport71.pro Style CSS
const sportsStyles = document.createElement('style');
sportsStyles.textContent = `
    .scheduled-events {
        background: white;
        border-radius: 10px;
        padding: 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .events-header {
        background: #34495e;
        color: white;
        padding: 20px;
        border-radius: 10px 10px 0 0;
    }
    
    .events-header h2 {
        margin: 0 0 5px 0;
        font-size: 1.8em;
    }
    
    .current-date {
        color: #bdc3c7;
        font-size: 1em;
    }
    
    .sports-categories {
        padding: 15px 20px;
        background: #ecf0f1;
        border-bottom: 1px solid #bdc3c7;
        display: flex;
        gap: 10px;
    }
    
    .sport-btn {
        background: white;
        border: 1px solid #bdc3c7;
        padding: 8px 15px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.3s ease;
    }
    
    .sport-btn.active {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
    }
    
    .sport-btn:hover {
        background: #3498db;
        color: white;
        border-color: #3498db;
    }
    
    .matches-section {
        padding: 20px;
    }
    
    .matches-section h3 {
        margin: 0 0 15px 0;
        color: #2c3e50;
        font-size: 1.3em;
    }
    
    .matches-table {
        border: 1px solid #ecf0f1;
        border-radius: 5px;
        overflow: hidden;
    }
    
    .table-header {
        display: grid;
        grid-template-columns: 100px 1fr 100px;
        background: #2c3e50;
        color: white;
        font-weight: bold;
        padding: 12px 15px;
    }
    
    .match-row, .no-matches {
        display: grid;
        grid-template-columns: 100px 1fr 100px;
        padding: 15px;
        border-bottom: 1px solid #ecf0f1;
        align-items: center;
    }
    
    .match-row:last-child {
        border-bottom: none;
    }
    
    .match-row:hover {
        background: #f8f9fa;
    }
    
    .col-time {
        font-weight: bold;
        color: #e74c3c;
    }
    
    .col-match .teams {
        font-weight: bold;
        margin-bottom: 3px;
        color: #2c3e50;
    }
    
    .col-match .league {
        font-size: 0.85em;
        color: #7f8c8d;
    }
    
    .watch-btn {
        background: #27ae60;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.85em;
        font-weight: bold;
    }
    
    .watch-btn:hover {
        background: #219653;
    }
    
    .no-stream {
        color: #95a5a6;
        font-style: italic;
        font-size: 0.85em;
    }
    
    .no-matches, .error-state {
        text-align: center;
        padding: 30px;
        color: #7f8c8d;
    }
    
    .retry-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
    }
`;
document.head.appendChild(sportsStyles);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
