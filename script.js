// Sport71.pro Style Match Schedules
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
            
            console.log('📦 RAW API RESPONSE:', apiData);
            
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
                matches.forEach(match => {
                    if (match && match.match) {
                        // Convert unix timestamp to readable time
                        const matchTime = this.convertUnixToTime(match.unix_timestamp);
                        
                        this.allMatches.push({
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport || 'Sports',
                            streamUrl: this.getStreamUrl(match.channels),
                            isLive: this.checkIfLive(match),
                            sport: match.sport || 'Unknown',
                            rawData: match // Keep original data for reference
                        });
                    }
                });
            }
        });
        
        console.log('✅ Organized matches:', this.allMatches);
        
        // Update analytics counters
        this.updateAnalytics();
    }
    
    getStreamUrl(channels) {
        if (!channels || !Array.isArray(channels) || channels.length === 0) {
            return null;
        }
        
        // Take the first channel URL
        const channelUrl = channels[0];
        
        // Convert topembed.pw channel link to actual stream page
        if (channelUrl.includes('topembed.pw/channel/')) {
            // This creates a link to the channel page where the actual stream is embedded
            return channelUrl.replace('/channel/', '/embed/') + '.html';
        }
        
        return channelUrl;
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
        if (!match.unix_timestamp) return false;
        
        const matchTime = match.unix_timestamp * 1000;
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000;
        
        // Consider match live if it's within 2 hours of current time
        return Math.abs(now - matchTime) <= twoHours;
    }
    
    updateAnalytics() {
        // Update live viewers (random demo data)
        const liveViewers = Math.floor(Math.random() * 10000) + 5000;
        document.getElementById('live-viewers').textContent = liveViewers.toLocaleString();
        
        // Update active matches count
        const activeMatches = this.allMatches.filter(match => match.isLive).length;
        document.getElementById('total-streams').textContent = activeMatches;
        
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
                    <button class="sport-btn active" onclick="matchScheduler.setSport('all')">
                        All Sports
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('football')">
                        Football
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('ice hockey')">
                        Ice Hockey
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('basketball')">
                        Basketball
                    </button>
                </div>
                
                <div class="matches-section">
                    <h3>All Matches</h3>
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
        
        // Filter matches based on current sport selection
        let filteredMatches = this.allMatches;
        if (this.currentSport !== 'all') {
            filteredMatches = this.allMatches.filter(match => 
                match.sport.toLowerCase().includes(this.currentSport.toLowerCase())
            );
        }
        
        if (filteredMatches.length === 0) {
            return `
                <div class="no-matches">
                    <div class="col-time">-</div>
                    <div class="col-match">No ${this.currentSport} matches found</div>
                    <div class="col-watch">-</div>
                </div>
            `;
        }
        
        // Show first 15 matches
        return filteredMatches.slice(0, 15).map(match => `
            <div class="match-row">
                <div class="col-time">
                    ${match.time}
                    ${match.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
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
            const sportName = sport === 'all' ? 'All' : sport.charAt(0).toUpperCase() + sport.slice(1);
            titleElement.textContent = sportName + ' Matches';
        }
        
        // Refresh the matches display
        const tableBody = document.querySelector('.table-body');
        if (tableBody) {
            tableBody.innerHTML = this.renderMatchesTable();
        }
        
        console.log('Switched to sport:', sport);
    }
    
    watchMatch(streamUrl) {
        if (streamUrl) {
            // Open in new tab
            window.open(streamUrl, '_blank', 'noopener,noreferrer');
            this.showNotification('Opening stream...');
            
            // Track stream click in analytics
            console.log('🎥 Stream opened:', streamUrl);
        } else {
            this.showNotification('Stream not available yet');
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
            console.log('🔄 Auto-refreshing match data...');
            this.loadMatches().then(() => {
                // Refresh the display after loading new data
                const tableBody = document.querySelector('.table-body');
                if (tableBody) {
                    tableBody.innerHTML = this.renderMatchesTable();
                }
            });
        }, 5 * 60 * 1000); // 5 minutes
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
        margin: 20px 0;
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
        flex-wrap: wrap;
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
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .live-badge {
        background: #e74c3c;
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.7em;
        font-weight: bold;
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
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.85em;
        font-weight: bold;
        transition: background 0.3s ease;
    }
    
    .watch-btn:hover {
        background: #c0392b;
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
        grid-column: 1 / -1;
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
    
    .error-state h3 {
        color: #e74c3c;
        margin-bottom: 10px;
    }
`;
document.head.appendChild(sportsStyles);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
