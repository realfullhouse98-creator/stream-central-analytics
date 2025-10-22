// Uncle Stream - Match Schedule Display
class UncleStream {
    constructor() {
        this.allMatches = [];
        this.init();
    }
    
    async init() {
        console.log('📅 UNCLE STREAM: Loading match schedules...');
        await this.loadMatchSchedules();
        this.startScheduleUpdates();
    }
    
    async loadMatchSchedules() {
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            
            console.log('📊 API SCHEDULE DATA:', apiData);
            
            // Get ALL matches from API
            this.allMatches = this.extractAllMatches(apiData);
            
            console.log(`🎯 FOUND ${this.allMatches.length} MATCHES:`, this.allMatches);
            
            this.displaySchedule();
            
        } catch (error) {
            console.log('❌ Failed to load schedules:', error);
            this.showError();
        }
    }
    
    // ADD THIS MISSING METHOD:
    extractAllMatches(apiData) {
        if (!apiData || !apiData.events) {
            console.log('❌ No events data in API');
            return [];
        }
        
        const allMatches = [];
        
        // Get ALL matches from ALL dates
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    // Show EVERY match, no filtering
                    allMatches.push({
                        id: match.id || Math.random().toString(36).substr(2, 9),
                        title: match.title || 'Football Match',
                        league: match.league || 'Football',
                        time: match.time || 'Time TBD',
                        date: date,
                        startTime: this.parseDateTime(date, match.time),
                        streamUrl: match.url || null,
                        hasStream: !!match.url // Just note if stream exists
                    });
                });
            }
        });
        
        console.log(`📅 FOUND ${allMatches.length} MATCHES TOTAL`);
        return allMatches.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    }
    
    // ADD THIS METHOD TOO:
    parseDateTime(dateStr, timeStr) {
        if (!dateStr || !timeStr || timeStr === 'TBD') return null;
        
        try {
            // Combine date "2025-10-22" with time "19:30"
            const [hours, minutes] = timeStr.split(':').map(Number);
            const dateTime = new Date(dateStr);
            dateTime.setHours(hours, minutes, 0, 0);
            
            return dateTime;
        } catch (e) {
            return null;
        }
    }
    
    displaySchedule() {
        const container = document.getElementById('psl-streams-container');
        
        if (this.allMatches.length === 0) {
            container.innerHTML = `
                <div class="no-schedules">
                    <h3>📅 No Match Schedules Found</h3>
                    <p>The API returned no match schedule data.</p>
                    <p>This could mean:</p>
                    <ul>
                        <li>No matches scheduled in the API</li>
                        <li>API data format has changed</li>
                        <li>Temporary API issue</li>
                    </ul>
                    <button onclick="uncleStream.loadMatchSchedules()" class="retry-btn">
                        🔄 Try Again
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="schedule-container">
                <div class="schedule-header">
                    <h3>📅 Football Match Schedules</h3>
                    <div class="match-count">${this.allMatches.length} matches found</div>
                </div>
                
                <div class="matches-list">
                    ${this.allMatches.map(match => this.createMatchRow(match)).join('')}
                </div>
                
                <div class="schedule-footer">
                    <div class="last-updated">Updated: ${new Date().toLocaleTimeString()}</div>
                    <button onclick="uncleStream.loadMatchSchedules()" class="refresh-btn">
                        🔄 Refresh Schedules
                    </button>
                </div>
            </div>
        `;
        
        this.startTimeUpdates();
    }
    
    createMatchRow(match) {
        const displayDate = match.date ? new Date(match.date).toLocaleDateString() : 'TBD';
        
        return `
            <div class="match-row">
                <div class="match-info">
                    <div class="teams">${match.title}</div>
                    <div class="match-details">
                        <span class="league">${match.league}</span>
                        <span class="date">${displayDate}</span>
                        <span class="time">${match.time}</span>
                        ${match.hasStream ? '<span class="stream-available">📺 Stream</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    isMatchLive(startTime) {
        if (!startTime) return false;
        
        const now = new Date();
        const matchTime = new Date(startTime);
        const twoHoursLater = new Date(matchTime.getTime() + 2 * 60 * 60 * 1000);
        
        return now >= matchTime && now <= twoHoursLater;
    }
    
    startScheduleUpdates() {
        // Check every minute if matches should go live
        setInterval(() => {
            this.updateLiveStatus();
        }, 60000);
    }
    
    startTimeUpdates() {
        // Update time displays every 30 seconds
        setInterval(() => {
            this.updateLiveStatus();
        }, 30000);
    }
    
    updateLiveStatus() {
        this.allMatches.forEach(match => {
            const row = document.querySelector(`[data-match-id="${match.id}"]`);
            if (!row) return;
            
            const isLive = this.isMatchLive(match.startTime);
            const statusElement = row.querySelector('.match-status');
            
            if (statusElement) {
                if (isLive) {
                    statusElement.innerHTML = 
                        `<button class="live-btn" onclick="uncleStream.watchMatch('${match.streamUrl}')">
                            🔴 LIVE NOW
                        </button>`;
                    row.classList.add('live');
                    row.classList.remove('scheduled');
                } else {
                    statusElement.innerHTML = 
                        `<div class="upcoming">Starts at ${match.time}</div>`;
                    row.classList.remove('live');
                    row.classList.add('scheduled');
                }
            }
        });
    }
    
    watchMatch(streamUrl) {
        if (streamUrl) {
            window.open(streamUrl, '_blank');
            this.showNotification('🔴 Opening live stream...');
        } else {
            this.showNotification('⚠️ Stream URL not available for this match');
        }
    }
    
    showError() {
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = `
            <div class="error-state">
                <h3>❌ Connection Issue</h3>
                <p>Unable to load match schedules from the API.</p>
                <button onclick="uncleStream.loadMatchSchedules()" class="retry-btn">
                    🔄 Retry Connection
                </button>
            </div>
        `;
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// Add Schedule CSS
const scheduleStyles = document.createElement('style');
scheduleStyles.textContent = `
    .schedule-container {
        background: white;
        border-radius: 10px;
        padding: 0;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .schedule-header {
        background: #2c3e50;
        color: white;
        padding: 20px;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .schedule-header h3 {
        margin: 0;
        color: white;
    }
    
    .match-count {
        background: #e74c3c;
        padding: 5px 12px;
        border-radius: 15px;
        font-size: 0.9em;
    }
    
    .matches-list {
        max-height: 600px;
        overflow-y: auto;
    }
    
    .match-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #ecf0f1;
        transition: background-color 0.3s ease;
    }
    
    .match-row:last-child {
        border-bottom: none;
    }
    
    .match-row:hover {
        background: #f8f9fa;
    }
    
    .teams {
        font-weight: bold;
        font-size: 1.1em;
        margin-bottom: 5px;
        color: #2c3e50;
    }
    
    .match-details {
        display: flex;
        gap: 10px;
        font-size: 0.85em;
        color: #7f8c8d;
    }
    
    .league {
        color: #3498db;
        font-weight: bold;
    }
    
    .date {
        color: #9b59b6;
        font-weight: bold;
    }
    
    .time {
        color: #e74c3c;
        font-weight: bold;
    }
    
    .stream-available {
        color: #27ae60;
        font-weight: bold;
    }
    
    .schedule-footer {
        padding: 15px 20px;
        background: #f8f9fa;
        border-radius: 0 0 10px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #ecf0f1;
    }
    
    .refresh-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 15px;
        cursor: pointer;
    }
    
    .retry-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        margin-top: 15px;
    }
    
    .no-schedules, .error-state {
        text-align: center;
        padding: 40px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .no-schedules ul {
        text-align: left;
        max-width: 400px;
        margin: 15px auto;
    }
`;
document.head.appendChild(scheduleStyles);

// DEBUG FUNCTION 
async function debugAPIData() {
    try {
        console.log('🔍 DEBUG: Fetching raw API data...');
        const response = await fetch('https://topembed.pw/api.php?format=json');
        const rawData = await response.json();
        
        console.log('📊 RAW API RESPONSE:', rawData);
        
        if (rawData && rawData.events) {
            console.log(`📝 Found events for ${Object.keys(rawData.events).length} dates`);
        } else {
            console.log('❌ API returned no events data');
        }
        
    } catch (error) {
        console.log('❌ DEBUG: API fetch failed:', error);
    }
}

// Test immediately
setTimeout(debugAPIData, 1000);

// THIS IS THE VERY LAST LINE - ONLY ONCE
// IMMEDIATE DEBUG - Add this right before the last line
console.log('🚨 IMMEDIATE DEBUG: Checking API connection...');

fetch('https://topembed.pw/api.php?format=json')
    .then(response => response.json())
    .then(data => {
        console.log('✅ API CONNECTION SUCCESS:', data);
        console.log('📅 DATES AVAILABLE:', Object.keys(data.events || {}));
        
        // Count total matches
        let totalMatches = 0;
        if (data.events) {
            Object.values(data.events).forEach(matches => {
                if (Array.isArray(matches)) totalMatches += matches.length;
            });
        }
        console.log(`🎯 TOTAL MATCHES: ${totalMatches}`);
        
    })
    .catch(error => {
        console.log('❌ API CONNECTION FAILED:', error);
    });

// THIS IS THE VERY LAST LINE
document.addEventListener('DOMContentLoaded', () => {
    window.uncleStream = new UncleStream();
});
