// Sport71.pro Style Match Schedules - DEBUG VERSION
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentSport = 'all';
        this.init();
    }
    
    async init() {
        console.log('🚀 INIT: Starting match scheduler...');
        await this.loadMatches();
        this.displayScheduledEvents();
    }
    
    async loadMatches() {
        try {
            console.log('🔍 FETCH: Loading data from API...');
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            
            console.log('📦 API RAW DATA:', apiData);
            
            if (!apiData || !apiData.events) {
                console.log('❌ ERROR: No events in API response');
                return;
            }
            
            console.log('📅 DATES FOUND:', Object.keys(apiData.events));
            
            // Process the data
            this.organizeMatches(apiData);
            
        } catch (error) {
            console.log('❌ FETCH ERROR:', error);
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        this.allMatches = [];
        let totalMatches = 0;
        
        console.log('🔄 PROCESSING: Organizing matches...');
        
        // Process all dates and matches
        Object.entries(apiData.events).forEach(([date, matches]) => {
            console.log(`📅 PROCESSING DATE: ${date}`, matches);
            
            if (Array.isArray(matches)) {
                matches.forEach((match, index) => {
                    if (match && match.match) {
                        console.log(`⚽ MATCH ${index}:`, match);
                        
                        // Convert unix timestamp to readable time
                        const matchTime = this.convertUnixToTime(match.unix_timestamp);
                        
                        this.allMatches.push({
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport || 'Sports',
                            streamUrl: match.channels && match.channels.length > 0 ? match.channels[0] : null,
                            isLive: false, // Simplified for now
                            sport: match.sport || 'Unknown'
                        });
                        totalMatches++;
                    }
                });
            }
        });
        
        console.log(`✅ SUCCESS: Organized ${totalMatches} matches total`);
        console.log('📊 MATCHES ARRAY:', this.allMatches);
        
        // Update display
        this.updateDisplay();
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
    
    updateDisplay() {
        console.log('🖥️ UPDATING DISPLAY...');
        const container = document.getElementById('psl-streams-container');
        
        if (!container) {
            console.log('❌ ERROR: Container element not found!');
            return;
        }
        
        if (this.allMatches.length === 0) {
            console.log('ℹ️ INFO: No matches to display');
            container.innerHTML = `
                <div class="scheduled-events">
                    <div class="events-header">
                        <h2>Debug Info</h2>
                        <div class="current-date">No matches found in data</div>
                    </div>
                    <div class="matches-section">
                        <p>API returned data but no matches were processed.</p>
                        <p>Check console for details.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        console.log(`🎯 DISPLAYING: ${this.allMatches.length} matches`);
        
        // Simple display for debugging
        const matchesHTML = this.allMatches.slice(0, 10).map((match, index) => `
            <div class="match-row">
                <div class="col-time">${match.time}</div>
                <div class="col-match">
                    <strong>${match.teams}</strong><br>
                    <small>${match.league} • ${match.sport}</small>
                </div>
                <div class="col-watch">
                    ${match.streamUrl ? '<button class="watch-btn">WATCH</button>' : 'OFFLINE'}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="scheduled-events">
                <div class="events-header">
                    <h2>Live Sports Schedules</h2>
                    <div class="current-date">Debug Mode - ${this.allMatches.length} matches loaded</div>
                </div>
                <div class="matches-section">
                    <div class="matches-table">
                        <div class="table-header">
                            <div class="col-time">Time</div>
                            <div class="col-match">Match</div>
                            <div class="col-watch">Watch</div>
                        </div>
                        <div class="table-body">
                            ${matchesHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ DISPLAY UPDATED SUCCESSFULLY');
    }
    
    displayScheduledEvents() {
        console.log('📋 DISPLAY: Creating schedule events...');
        this.updateDisplay();
    }
    
    showError() {
        const container = document.getElementById('psl-streams-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>Unable to Load Schedules</h3>
                    <p>Please check your connection and try again.</p>
                    <button onclick="location.reload()" class="retry-btn">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
}

// Add basic CSS
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
    
    .matches-section {
        padding: 20px;
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
    
    .match-row {
        display: grid;
        grid-template-columns: 100px 1fr 100px;
        padding: 15px;
        border-bottom: 1px solid #ecf0f1;
        align-items: center;
    }
    
    .match-row:last-child {
        border-bottom: none;
    }
    
    .col-time {
        font-weight: bold;
        color: #e74c3c;
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
    }
    
    .error-state {
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
    console.log('🎬 DOM LOADED: Starting application...');
    window.matchScheduler = new MatchScheduler();
});
