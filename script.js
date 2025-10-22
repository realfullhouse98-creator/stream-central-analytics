// Uncle Stream - Intelligent Match Discovery
class UncleStream {
    constructor() {
        this.siteName = "Uncle Stream";
        this.liveMatches = [];
        this.upcomingMatches = [];
        this.systemStatus = "initializing";
        
        this.init();
    }
    
    async init() {
        console.log('🎯 UNCLE STREAM: Starting Intelligent Match Discovery');
        
        // Update site branding
        this.updateBranding();
        
        // Immediate API fetch for match data
        await this.fetchMatchData();
        
        // Continuous updates
        this.startContinuousUpdates();
        
        // Render clean interface
        this.renderMatchInterface();
    }
    
    updateBranding() {
        // Update page title and header
        document.title = `${this.siteName} - Live Football Match Schedules`;
        
        const header = document.querySelector('.dashboard-header h1');
        if (header) {
            header.innerHTML = '🔴 Uncle Stream';
            header.nextElementSibling.textContent = 'Live Football Match Discovery';
        }
    }
    
    async fetchMatchData() {
        console.log('📡 UNCLE STREAM: Fetching match schedules...');
        
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            
            console.log('🎯 RAW API DATA:', apiData);
            
            // FOCUS: Extract REAL match information
            const extractedMatches = this.extractRealMatches(apiData);
            
            console.log('🎯 EXTRACTED MATCHES:', extractedMatches);
            
            this.processMatches(extractedMatches);
            this.systemStatus = "api_connected";
            
        } catch (error) {
            console.log('❌ UNCLE STREAM: API connection failed');
            this.systemStatus = "api_failed";
            this.showConnectionMessage();
        }
    }
    
    extractRealMatches(apiData) {
        if (!apiData || !Array.isArray(apiData)) {
            return [];
        }
        
        return apiData
            .filter(item => item && this.isFootballMatch(item))
            .map(item => this.createMatchObject(item))
            .filter(match => match.teams && match.time); // Only valid matches
    }
    
    isFootballMatch(item) {
        // SMART DETECTION: Identify actual football matches
        const title = (item.title || '').toLowerCase();
        const league = (item.league || '').toLowerCase();
        
        const footballIndicators = [
            'psl', 'premier league', 'champions league', 'europa league',
            'vs', 'fc', 'united', 'city', 'afc', 'fc vs'
        ];
        
        return footballIndicators.some(indicator => 
            title.includes(indicator) || league.includes(indicator)
        );
    }
    
    createMatchObject(apiItem) {
        // FOCUS: Extract CLEAN match information
        const teams = this.extractTeams(apiItem.title || apiItem.league);
        const time = apiItem.time || 'TBD';
        const league = this.detectLeague(apiItem.league, apiItem.title);
        
        return {
            id: apiItem.id || Math.random().toString(36).substr(2, 9),
            teams: teams,
            league: league,
            time: time,
            startTime: this.parseTimeToDate(time),
            streamUrl: apiItem.url || null,
            dataQuality: this.assessDataQuality(apiItem),
            source: 'api_direct'
        };
    }
    
    extractTeams(title) {
        if (!title) return 'Match TBD';
        
        // CLEAN team extraction
        const cleanTitle = title
            .replace(/\[.*?\]/g, '') // Remove brackets
            .replace(/\(.*?\)/g, '') // Remove parentheses
            .replace(/live|stream|hd/gi, '') // Remove common fluff
            .trim();
            
        return cleanTitle || 'Football Match';
    }
    
    detectLeague(league, title) {
        if (league) return league;
        
        // Auto-detect from title
        const titleStr = (title || '').toLowerCase();
        if (titleStr.includes('psl')) return 'PSL';
        if (titleStr.includes('champions league')) return 'Champions League';
        if (titleStr.includes('premier league')) return 'Premier League';
        
        return 'Football';
    }
    
    parseTimeToDate(timeString) {
        if (!timeString || timeString === 'TBD') return null;
        
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            const matchTime = new Date();
            matchTime.setHours(hours, minutes, 0, 0);
            
            // If time passed, assume tomorrow
            if (matchTime < new Date()) {
                matchTime.setDate(matchTime.getDate() + 1);
            }
            
            return matchTime;
        } catch (error) {
            return null;
        }
    }
    
    assessDataQuality(item) {
        let score = 0;
        if (item.title) score += 40;
        if (item.league) score += 30;
        if (item.time) score += 20;
        if (item.url) score += 10;
        return score;
    }
    
    processMatches(matches) {
        const now = new Date();
        
        this.liveMatches = matches.filter(match => 
            match.startTime && this.isMatchLive(match.startTime)
        );
        
        this.upcomingMatches = matches.filter(match => 
            match.startTime && match.startTime > now
        ).sort((a, b) => a.startTime - b.startTime); // Sort by time
        
        console.log(`🎯 UNCLE STREAM: ${this.liveMatches.length} live, ${this.upcomingMatches.length} upcoming`);
    }
    
    isMatchLive(startTime) {
        const now = new Date();
        const matchStart = new Date(startTime);
        const matchEnd = new Date(matchStart.getTime() + 2 * 60 * 60 * 1000); // +2 hours
        
        return now >= matchStart && now <= matchEnd;
    }
    
    renderMatchInterface() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="uncle-stream-interface">
                <div class="stream-header">
                    <h3>🔴 ${this.siteName} - Match Schedules</h3>
                    <div class="system-status ${this.systemStatus}">
                        ${this.getStatusText()}
                    </div>
                </div>
                
                <div class="matches-display">
                    ${this.renderMatchesSection()}
                </div>
                
                <div class="match-actions">
                    <button onclick="uncleStream.refreshData()" class="uncle-btn">
                        🔄 Update Schedules
                    </button>
                    <div class="last-update">
                        Last checked: ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMatchesSection() {
        if (this.liveMatches.length === 0 && this.upcomingMatches.length === 0) {
            return `
                <div class="no-matches">
                    <h4>🔍 Scanning for Matches</h4>
                    <p>No live or upcoming matches detected in current data.</p>
                    <p>This could mean:</p>
                    <ul>
                        <li>No matches scheduled right now</li>
                        <li>API data format has changed</li>
                        <li>Matches outside current detection patterns</li>
                    </ul>
                    <div class="raw-data-toggle">
                        <button onclick="uncleStream.showRawData()">View Raw API Data</button>
                    </div>
                </div>
            `;
        }
        
        return `
            ${this.liveMatches.length > 0 ? `
                <div class="live-section">
                    <h4>🔴 LIVE NOW</h4>
                    ${this.liveMatches.map(match => this.renderMatchCard(match, 'live')).join('')}
                </div>
            ` : ''}
            
            ${this.upcomingMatches.length > 0 ? `
                <div class="upcoming-section">
                    <h4>⏰ UPCOMING MATCHES</h4>
                    ${this.upcomingMatches.map(match => this.renderMatchCard(match, 'upcoming')).join('')}
                </div>
            ` : ''}
        `;
    }
    
    renderMatchCard(match, status) {
        const timeInfo = status === 'live' 
            ? '🔴 LIVE' 
            : `🕒 ${match.time}`;
            
        const actionButton = status === 'live'
            ? `<button class="watch-live" onclick="uncleStream.watchMatch('${match.streamUrl}')">WATCH LIVE</button>`
            : `<div class="countdown" data-time="${match.startTime?.toISOString()}">Starts: ${match.time}</div>`;
        
        return `
            <div class="match-card-uncle ${status}">
                <div class="match-info">
                    <h5>${match.teams}</h5>
                    <div class="match-meta">
                        <span class="league">${match.league}</span>
                        <span class="time">${timeInfo}</span>
                        <span class="quality">Data: ${match.dataQuality}%</span>
                    </div>
                </div>
                <div class="match-action">
                    ${actionButton}
                </div>
            </div>
        `;
    }
    
    getStatusText() {
        switch(this.systemStatus) {
            case 'api_connected': return '📡 Connected to Match Data';
            case 'api_failed': return '❌ Checking Alternative Sources';
            default: return '🔍 Initializing Match Discovery';
        }
    }
    
    showConnectionMessage() {
        // Show helpful connection status
        console.log('🔍 UNCLE STREAM: Analyzing connection issues...');
    }
    
    startContinuousUpdates() {
        // Update every 2 minutes
        setInterval(() => {
            this.fetchMatchData();
        }, 120000);
        
        // Update countdowns every 30 seconds
        setInterval(() => {
            this.updateCountdowns();
        }, 30000);
    }
    
    updateCountdowns() {
        // Update any countdown timers
        document.querySelectorAll('.countdown').forEach(element => {
            const matchTime = new Date(element.dataset.time);
            const now = new Date();
            const diff = matchTime - now;
            
            if (diff <= 0) {
                element.textContent = '🔴 LIVE NOW';
                element.classList.add('live');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                element.textContent = `Starts in: ${hours}h ${minutes}m`;
            }
        });
    }
    
    // Public methods
    refreshData() {
        console.log('🔄 UNCLE STREAM: Manual refresh');
        this.fetchMatchData();
        this.showNotification('🔄 Updating match schedules...');
    }
    
    watchMatch(streamUrl) {
        if (streamUrl) {
            window.open(streamUrl, '_blank');
            this.showNotification('🔴 Opening live stream...');
        } else {
            this.showNotification('❌ Stream URL not available');
        }
    }
    
    showRawData() {
        console.log('📊 UNCLE STREAM: Raw API data analysis');
        this.showNotification('📊 Check browser console for raw data');
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize Uncle Stream
document.addEventListener('DOMContentLoaded', () => {
    window.uncleStream = new UncleStream();
});

// Add Uncle Stream CSS
const uncleStyles = document.createElement('style');
uncleStyles.textContent = `
    .uncle-stream-interface {
        background: linear-gradient(135deg, #2c3e50, #34495e);
        border-radius: 15px;
        padding: 25px;
        color: white;
        margin: 20px 0;
    }
    
    .stream-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        border-bottom: 2px solid #e74c3c;
        padding-bottom: 15px;
    }
    
    .stream-header h3 {
        margin: 0;
        color: #e74c3c;
        font-size: 1.5em;
    }
    
    .system-status {
        padding: 8px 15px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9em;
    }
    
    .system-status.api_connected { background: #27ae60; }
    .system-status.api_failed { background: #e74c3c; }
    .system-status.initializing { background: #f39c12; }
    
    .match-card-uncle {
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        padding: 20px;
        margin: 15px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 4px solid #e74c3c;
        transition: transform 0.2s ease;
    }
    
    .match-card-uncle.live {
        border-left-color: #27ae60;
        background: rgba(39, 174, 96, 0.1);
    }
    
    .match-card-uncle:hover {
        transform: translateX(5px);
    }
    
    .match-info h5 {
        margin: 0 0 10px 0;
        font-size: 1.2em;
        color: white;
    }
    
    .match-meta {
        display: flex;
        gap: 15px;
        font-size: 0.9em;
        color: #bdc3c7;
    }
    
    .league { color: #3498db; }
    .time { color: #f39c12; }
    .quality { color: #2ecc71; }
    
    .watch-live {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 25px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .watch-live:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
    }
    
    .countdown {
        background: #34495e;
        color: #f39c12;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        font-family: monospace;
    }
    
    .countdown.live {
        background: #27ae60;
        color: white;
    }
    
    .uncle-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: bold;
        margin-right: 15px;
    }
    
    .last-update {
        color: #bdc3c7;
        font-size: 0.9em;
    }
    
    .no-matches {
        text-align: center;
        padding: 40px;
        color: #bdc3c7;
    }
    
    .no-matches ul {
        text-align: left;
        max-width: 400px;
        margin: 20px auto;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(uncleStyles);
