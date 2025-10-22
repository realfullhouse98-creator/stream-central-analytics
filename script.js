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
        this.startAutoRefresh();
    }
    
    async loadMatches() {
        try {
            console.log('🔍 Fetching data from API...');
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            
            console.log('📦 RAW API RESPONSE:', apiData);
            console.log('🔍 Events object keys:', Object.keys(apiData.events || {}));
            
            // Log first date's matches to see structure
            const firstDate = Object.keys(apiData.events || {})[0];
            if (firstDate) {
                console.log('📅 First date matches:', apiData.events[firstDate]);
                if (apiData.events[firstDate] && apiData.events[firstDate].length > 0) {
                    console.log('🔍 First match structure:', apiData.events[firstDate][0]);
                }
            }
            
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
        
        console.log('📊 Total dates in events:', Object.keys(apiData.events).length);
        
        this.allMatches = [];
        let matchCount = 0;
        
        // Process all dates and matches
        Object.entries(apiData.events).forEach(([date, matches]) => {
            console.log(`📅 Processing date: ${date}`, matches);
            
            if (Array.isArray(matches)) {
                matches.forEach((match, index) => {
                    console.log(`⚽ Match ${index} on ${date}:`, match);
                    
                    // For now, include ALL matches to see what we get
                    if (match && match.title) {
                        this.allMatches.push({
                            date: date,
                            time: match.time || 'TBD',
                            teams: match.title, // Use the full title directly
                            league: match.league || 'Football',
                            streamUrl: match.url || null,
                            isLive: this.checkIfLive(match), // Add live status
                            rawMatch: match // Keep raw data for debugging
                        });
                        matchCount++;
                    }
                });
            }
        });
        
        console.log(`✅ Organized ${matchCount} matches:`, this.allMatches);
        
        // Update analytics counters
        this.updateAnalytics();
    }
    
    checkIfLive(match) {
        // Simple check - if match has "Live" in title or is happening now
        const title = (match.title || '').toLowerCase();
        return title.includes('live') || (match.time && this.isCurrentTime(match.time));
    }
    
    isCurrentTime(matchTime) {
        // Basic check if match time is around current time
        // You can enhance this with more precise logic
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Simple time comparison (you can improve this)
        if (matchTime.includes(':')) {
            const [hour, minute] = matchTime.split(':').map(Number);
            return Math.abs((currentHour * 60 + currentMinute) - (hour * 60 + minute)) <= 120; // Within 2 hours
        }
        
        return false;
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
        
        // Show first 15 matches
        return this.allMatches.slice(0, 15).map(match => `
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
    
    startAutoRefresh() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            console.log('🔄 Auto-refreshing match data...');
            this.loadMatches();
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
