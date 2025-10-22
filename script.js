// Sport71.pro Style Match Schedules - CLEAN STRUCTURE VERSION
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentSport = 'all';
        this.init();
    }
    
    async init() {
        console.log('Loading match schedules...');
        await this.loadMatches();
        this.displayScheduledEvents();
        this.startAutoRefresh();
    }
    
    async loadMatches() {
        try {
            console.log('🔍 Fetching data from API...');
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            
            // Extract and organize matches
            this.organizeMatches(apiData);
            
        } catch (error) {
            console.log('❌ Failed to load matches:', error);
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData || !apiData.events) {
            console.log('❌ No events data found in API response');
            return;
        }
        
        this.allMatches = [];
        
        // Process all dates and matches
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach((match) => {
                    // Check if match has required data
                    if (match && match.match && match.sport) {
                        // Convert unix timestamp to readable time
                        const matchTime = this.convertUnixToTime(match.unix_timestamp);
                        
                        const processedMatch = {
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport,
                            streamUrl: this.getStreamUrl(match.channels),
                            isLive: this.checkIfLive(match),
                            sport: match.sport
                        };
                        
                        this.allMatches.push(processedMatch);
                    }
                });
            }
        });
        
        // Update analytics counters
        this.updateAnalytics();
    }
    
    getStreamUrl(channels) {
        if (!channels || !Array.isArray(channels) || channels.length === 0) {
            return null;
        }
        
        // Take the first channel URL
        return channels[0];
    }
    
    convertUnixToTime(unixTimestamp) {
        if (!unixTimestamp) return 'TBD';
        
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    checkIfLive(match) {
        // Simple live check
        return false;
    }
    
    updateAnalytics() {
        // Update live viewers (random demo data)
        const liveViewers = Math.floor(Math.random() * 10000) + 5000;
        document.getElementById('live-viewers').textContent = liveViewers.toLocaleString();
        
        // Update active matches count
        document.getElementById('total-streams').textContent = this.allMatches.length;
        
        // Update countries (demo data)
        const countries = Math.floor(Math.random() * 10) + 1;
        document.getElementById('countries').textContent = countries;
        
        // Update last updated time
        const now = new Date();
        document.getElementById('update-time').textContent = now.toLocaleTimeString();
    }
    
    displayScheduledEvents() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="scheduled-events">
                <div class="events-header">
                    <h1 class="main-title">📅 Schedule Events</h1>
                    <div class="current-date-display">${this.getCurrentDate()}</div>
                </div>
                
                <div class="sports-categories">
                    <button class="sport-btn active" onclick="matchScheduler.setSport('all')">
                        🌍 All Sports
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('football')">
                        ⚽ Football
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('basketball')">
                        🏀 Basketball
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('ice hockey')">
                        🏒 Ice Hockey
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('volleyball')">
                        🏐 Volleyball
                    </button>
                </div>
                
                <div class="matches-section">
                    <div class="section-title-bar">
                        <h2 class="section-title">${this.getSectionTitle()}</h2>
                        <span class="match-count">${this.getFilteredMatches().length} matches</span>
                    </div>
                    
                    <div class="matches-table">
                        <div class="table-header">
                            <div class="col-time">🕒 Time</div>
                            <div class="col-match">⚽ Match</div>
                            <div class="col-watch">📺 Watch</div>
                        </div>
                        <div class="table-body">
                            ${this.renderMatchesTable()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getCurrentDate() {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    getSectionTitle() {
        if (this.currentSport === 'all') return 'All Sports Events';
        return `${this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1)} Matches`;
    }
    
    getFilteredMatches() {
        if (this.currentSport === 'all') return this.allMatches;
        return this.allMatches.filter(match => 
            match.sport.toLowerCase().includes(this.currentSport.toLowerCase())
        );
    }
    
    renderMatchesTable() {
        const filteredMatches = this.getFilteredMatches();
        
        if (filteredMatches.length === 0) {
            return `
                <div class="no-matches">
                    <div class="col-time">-</div>
                    <div class="col-match">No ${this.currentSport === 'all' ? '' : this.currentSport + ' '}matches scheduled</div>
                    <div class="col-watch">-</div>
                </div>
            `;
        }
        
        return filteredMatches.map(match => `
            <div class="match-row">
                <div class="col-time">
                    <span class="time-display">${match.time}</span>
                    ${match.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
                <div class="col-match">
                    <div class="teams">${match.teams}</div>
                    <div class="league">${match.league} • ${match.sport}</div>
                </div>
                <div class="col-watch">
                    ${match.streamUrl ? 
                        `<button class="watch-btn" onclick="matchScheduler.watchMatch('${match.streamUrl}')">
                            🎥 WATCH
                        </button>` :
                        `<span class="no-stream">⏸️ OFFLINE</span>`
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
        
        // Update the entire display
        this.displayScheduledEvents();
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
    
    startAutoRefresh() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.loadMatches().then(() => {
                this.displayScheduledEvents();
            });
        }, 5 * 60 * 1000);
    }
}

// Add Clean CSS Structure
const sportsStyles = document.createElement('style');
sportsStyles.textContent = `
    .scheduled-events {
        background: white;
        border-radius: 15px;
        padding: 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        margin: 30px auto;
        max-width: 1200px;
        width: 95%;
    }
    
    .events-header {
        background: linear-gradient(135deg, #34495e, #2c3e50);
        color: white;
        padding: 30px 40px;
        border-radius: 15px 15px 0 0;
        text-align: center;
    }
    
    .main-title {
        margin: 0 0 10px 0;
        font-size: 2.5em;
        font-weight: 700;
        color: white;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .current-date-display {
        font-size: 1.4em;
        color: #ecf0f1;
        font-weight: 500;
        opacity: 0.9;
    }
    
    .sports-categories {
        padding: 20px 30px;
        background: #f8f9fa;
        border-bottom: 2px solid #e9ecef;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .sport-btn {
        background: white;
        border: 2px solid #dee2e6;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 1em;
        font-weight: 600;
        transition: all 0.3s ease;
        color: #495057;
    }
    
    .sport-btn.active {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
    }
    
    .sport-btn:hover {
        background: #3498db;
        color: white;
        border-color: #3498db;
        transform: translateY(-2px);
    }
    
    .matches-section {
        padding: 30px;
    }
    
    .section-title-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid #ecf0f1;
    }
    
    .section-title {
        margin: 0;
        color: #2c3e50;
        font-size: 1.8em;
        font-weight: 600;
    }
    
    .match-count {
        background: #3498db;
        color: white;
        padding: 6px 15px;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: 600;
    }
    
    .matches-table {
        border: 2px solid #ecf0f1;
        border-radius: 10px;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .table-header {
        display: grid;
        grid-template-columns: 120px 1fr 120px;
        background: linear-gradient(135deg, #2c3e50, #34495e);
        color: white;
        font-weight: 700;
        padding: 18px 20px;
        font-size: 1.1em;
    }
    
    .match-row, .no-matches {
        display: grid;
        grid-template-columns: 120px 1fr 120px;
        padding: 18px 20px;
        border-bottom: 1px solid #f1f2f6;
        align-items: center;
        background: white;
        transition: background 0.2s ease;
    }
    
    .match-row:last-child {
        border-bottom: none;
    }
    
    .match-row:hover {
        background: #f8f9fa;
        transform: translateX(5px);
    }
    
    .col-time {
        font-weight: 700;
        color: #e74c3c;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.1em;
    }
    
    .time-display {
        font-size: 1em;
        font-weight: 600;
    }
    
    .live-badge {
        background: #e74c3c;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75em;
        font-weight: 700;
        text-transform: uppercase;
    }
    
    .col-match .teams {
        font-weight: 700;
        margin-bottom: 5px;
        color: #2c3e50;
        font-size: 1.1em;
        line-height: 1.3;
    }
    
    .col-match .league {
        font-size: 0.9em;
        color: #7f8c8d;
        font-weight: 500;
    }
    
    .watch-btn {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        border: none;
        padding: 10px 18px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 700;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
    }
    
    .watch-btn:hover {
        background: linear-gradient(135deg, #c0392b, #a93226);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
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
        grid-column: 1 / -1;
        font-size: 1.1em;
    }
    
    .retry-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 15px;
        font-weight: 600;
        transition: background 0.3s ease;
    }
    
    .retry-btn:hover {
        background: #2980b9;
    }
    
    .error-state h3 {
        color: #e74c3c;
        margin-bottom: 15px;
        font-size: 1.4em;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .scheduled-events {
            margin: 15px;
            width: auto;
        }
        
        .main-title {
            font-size: 2em;
        }
        
        .current-date-display {
            font-size: 1.1em;
        }
        
        .table-header, .match-row {
            grid-template-columns: 80px 1fr 90px;
            padding: 12px 15px;
        }
        
        .sports-categories {
            padding: 15px 20px;
        }
        
        .sport-btn {
            padding: 10px 15px;
            font-size: 0.9em;
        }
    }
`;
document.head.appendChild(sportsStyles);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
