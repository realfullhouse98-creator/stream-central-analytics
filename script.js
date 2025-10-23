// Uncle Stream - ENHANCED Live Scheduling with Animations
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.liveUpdateIntervals = new Map();
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.showMainMenu();
        this.startAutoRefresh();
        this.initLiveUpdates();
    }
    
    async loadMatches() {
        try {
            console.log('Loading matches from API...');
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            console.log('Raw API data structure:', Object.keys(apiData));
            this.organizeMatches(apiData);
        } catch (error) {
            console.error('API Error:', error);
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData?.events) {
            console.log('No events found in API data');
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        this.clearAllIntervals();
        
        console.log('Processing API events...');
        let totalMatches = 0;
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach((match) => {
                    if (match && (match.match || match.name || match.teams)) {
                        const processedMatch = this.processMatchData(match, date);
                        if (processedMatch) {
                            this.allMatches.push(processedMatch);
                            this.verifiedMatches.push(processedMatch);
                            totalMatches++;
                        }
                    }
                });
            }
        });
        
        console.log(`Total matches processed: ${totalMatches}`);
        
        // Add test matches for demonstration
        this.addLiveTestMatches();
        
        this.verifiedMatches.sort((a, b) => (a.unixTimestamp || 0) - (b.unixTimestamp || 0));
        this.updateAnalytics();
        
        // Debug all match statuses
        this.debugMatchStatuses();
    }
    
    processMatchData(match, date) {
        try {
            const matchName = match.match || match.name || match.teams || 'TBD vs TBD';
            const tournament = match.tournament || match.league || match.competition || match.sport || 'Sports';
            const unixTimestamp = match.unix_timestamp || match.timestamp || match.time;
            
            // Calculate match status using enhanced logic
            const matchStatus = this.calculateMatchStatus(unixTimestamp, match.duration);
            
            const processedMatch = {
                id: this.generateMatchId(match),
                date: date,
                time: this.convertUnixToLocalTime(unixTimestamp),
                teams: matchName,
                league: tournament,
                streamUrl: match.channels?.[0] || match.stream_url || match.url || null,
                status: matchStatus.status,
                isLive: matchStatus.status === 'LIVE',
                isUpcoming: matchStatus.status === 'UPCOMING',
                isEnded: matchStatus.status === 'ENDED',
                sport: this.classifySport(match),
                unixTimestamp: unixTimestamp,
                startTime: unixTimestamp ? new Date(unixTimestamp * 1000) : null,
                countdownText: matchStatus.countdownText,
                duration: match.duration || 7200, // Default 2 hours
                rawData: match
            };
            
            console.log(`Processed match [${processedMatch.status}]:`, {
                teams: processedMatch.teams,
                time: processedMatch.time,
                status: processedMatch.status,
                countdown: processedMatch.countdownText
            });
            
            return processedMatch;
        } catch (error) {
            console.error('Error processing match:', error, match);
            return null;
        }
    }
    
    calculateMatchStatus(unixTimestamp, duration = 7200) {
        const now = new Date();
        const nowUnix = Math.floor(now.getTime() / 1000);
        
        if (!unixTimestamp) {
            return { status: 'UNKNOWN', countdownText: 'TBD' };
        }
        
        const matchTime = parseInt(unixTimestamp);
        const matchEndTime = matchTime + (duration || 7200); // Default 2 hours
        const matchDate = new Date(matchTime * 1000);
        const matchEndDate = new Date(matchEndTime * 1000);
        
        // Enhanced status detection
        if (nowUnix < matchTime) {
            // UPCOMING - Calculate countdown
            const timeLeft = matchTime - nowUnix;
            return {
                status: 'UPCOMING',
                countdownText: this.formatCountdown(timeLeft),
                timeLeft: timeLeft
            };
        } else if (nowUnix >= matchTime && nowUnix <= matchEndTime) {
            // LIVE - Calculate progress
            const progress = ((nowUnix - matchTime) / (matchEndTime - matchTime)) * 100;
            return {
                status: 'LIVE',
                countdownText: 'LIVE',
                progress: Math.min(progress, 100)
            };
        } else {
            // ENDED
            return {
                status: 'ENDED',
                countdownText: 'ENDED'
            };
        }
    }
    
    formatCountdown(seconds) {
        if (seconds <= 0) return 'LIVE';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `in ${hours}h ${minutes}m`;
        } else if (minutes > 5) {
            return `in ${minutes}m`;
        } else {
            return `in ${minutes}m ${secs}s`;
        }
    }
    
    generateMatchId(match) {
        return `${match.match || 'match'}-${match.unix_timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // ENHANCED: Add realistic test matches with different statuses
    addLiveTestMatches() {
        const now = Math.floor(Date.now() / 1000);
        const today = new Date().toISOString().split('T')[0];
        
        const testMatches = [
            // LIVE matches (started 30 mins ago, 2-hour duration)
            {
                id: 'test-live-football',
                date: today,
                time: 'LIVE',
                teams: 'Real Madrid vs Barcelona 🔴',
                league: 'La Liga',
                streamUrl: 'https://example.com/football',
                status: 'LIVE',
                isLive: true,
                isUpcoming: false,
                isEnded: false,
                sport: 'football',
                unixTimestamp: now - 1800, // 30 mins ago
                startTime: new Date((now - 1800) * 1000),
                countdownText: 'LIVE',
                duration: 7200
            },
            {
                id: 'test-live-tennis',
                date: today,
                time: 'LIVE',
                teams: 'Nadal vs Djokovic 🔴',
                league: 'Wimbledon Finals',
                streamUrl: 'https://example.com/tennis',
                status: 'LIVE',
                isLive: true,
                isUpcoming: false,
                isEnded: false,
                sport: 'tennis',
                unixTimestamp: now - 2700, // 45 mins ago
                startTime: new Date((now - 2700) * 1000),
                countdownText: 'LIVE',
                duration: 10800 // 3 hours for tennis
            },
            // UPCOMING matches (starting soon)
            {
                id: 'test-upcoming-basketball',
                date: today,
                time: 'SOON',
                teams: 'Lakers vs Warriors ⏰',
                league: 'NBA Regular Season',
                streamUrl: 'https://example.com/nba',
                status: 'UPCOMING',
                isLive: false,
                isUpcoming: true,
                isEnded: false,
                sport: 'basketball',
                unixTimestamp: now + 900, // 15 mins from now
                startTime: new Date((now + 900) * 1000),
                countdownText: 'in 15m',
                duration: 7200
            },
            {
                id: 'test-upcoming-cricket',
                date: today,
                time: 'SOON',
                teams: 'India vs Australia ⏰',
                league: 'ICC World Cup',
                streamUrl: 'https://example.com/cricket',
                status: 'UPCOMING',
                isLive: false,
                isUpcoming: true,
                isEnded: false,
                sport: 'cricket',
                unixTimestamp: now + 1800, // 30 mins from now
                startTime: new Date((now + 1800) * 1000),
                countdownText: 'in 30m',
                duration: 10800 // 3 hours for cricket
            },
            // ENDED matches
            {
                id: 'test-ended-football',
                date: today,
                time: 'ENDED',
                teams: 'Manchester United vs Chelsea ✅',
                league: 'Premier League',
                streamUrl: null,
                status: 'ENDED',
                isLive: false,
                isUpcoming: false,
                isEnded: true,
                sport: 'football',
                unixTimestamp: now - 10800, // 3 hours ago
                startTime: new Date((now - 10800) * 1000),
                countdownText: 'ENDED',
                duration: 7200
            }
        ];
        
        testMatches.forEach(match => {
            this.verifiedMatches.push(match);
        });
    }
    
    // ENHANCED: Initialize live updates system
    initLiveUpdates() {
        // Update countdowns every second
        setInterval(() => this.updateAllCountdowns(), 1000);
        
        // Check status changes every 30 seconds
        setInterval(() => this.checkStatusTransitions(), 30000);
        
        console.log('Live updates initialized');
    }
    
    updateAllCountdowns() {
        this.verifiedMatches.forEach(match => {
            if (match.status === 'UPCOMING' || match.status === 'LIVE') {
                const newStatus = this.calculateMatchStatus(match.unixTimestamp, match.duration);
                
                // Update countdown text
                if (match.status === 'UPCOMING' && newStatus.countdownText !== match.countdownText) {
                    match.countdownText = newStatus.countdownText;
                    this.updateMatchDisplay(match);
                }
                
                // Check for status transition
                if (newStatus.status !== match.status) {
                    console.log(`Status change: ${match.teams} from ${match.status} to ${newStatus.status}`);
                    match.status = newStatus.status;
                    match.isLive = newStatus.status === 'LIVE';
                    match.isUpcoming = newStatus.status === 'UPCOMING';
                    match.isEnded = newStatus.status === 'ENDED';
                    match.countdownText = newStatus.countdownText;
                    this.updateMatchDisplay(match);
                }
            }
        });
    }
    
    checkStatusTransitions() {
        this.verifiedMatches.forEach(match => {
            const newStatus = this.calculateMatchStatus(match.unixTimestamp, match.duration);
            if (newStatus.status !== match.status) {
                console.log(`Periodic check: ${match.teams} changed from ${match.status} to ${newStatus.status}`);
                match.status = newStatus.status;
                match.isLive = newStatus.status === 'LIVE';
                match.isUpcoming = newStatus.status === 'UPCOMING';
                match.isEnded = newStatus.status === 'ENDED';
                match.countdownText = newStatus.countdownText;
                this.updateMatchDisplay(match);
            }
        });
    }
    
    updateMatchDisplay(match) {
        // Find and update the match in the current view
        if (this.currentView === 'matches' || this.currentView === 'main') {
            // Re-render the current view to reflect changes
            if (this.currentView === 'matches') {
                this.showMatchesView();
            } else if (this.currentView === 'main') {
                this.showMainMenu();
            }
        }
    }
    
    clearAllIntervals() {
        // Clear any existing intervals to prevent memory leaks
        this.liveUpdateIntervals.forEach((intervalId, matchId) => {
            clearInterval(intervalId);
        });
        this.liveUpdateIntervals.clear();
    }
    
    // ENHANCED: Show main menu with live matches
    showMainMenu() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const liveMatches = this.verifiedMatches.filter(m => m.isLive);
        const upcomingMatches = this.verifiedMatches
            .filter(m => m.isUpcoming)
            .slice(0, 5);
        
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" onclick="matchScheduler.showSportsView()">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">Live games & schedules</div>
                    </div>
                    <div class="menu-button tv-button" onclick="matchScheduler.showTVChannels()">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                </div>
                
                ${liveMatches.length > 0 ? `
                    <div class="content-section" style="margin-top: 30px;">
                        <div class="section-header">
                            <h2>🔴 LIVE NOW</h2>
                            <p>Matches currently in progress</p>
                        </div>
                        <div class="matches-table">
                            <div class="table-header">
                                <div>Time</div>
                                <div>Match</div>
                                <div>Watch</div>
                            </div>
                            ${liveMatches.slice(0, 8).map(match => this.renderMatchRow(match)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${upcomingMatches.length > 0 ? `
                    <div class="content-section" style="margin-top: 30px;">
                        <div class="section-header">
                            <h2>⏰ UPCOMING</h2>
                            <p>Next matches starting soon</p>
                        </div>
                        <div class="matches-table">
                            <div class="table-header">
                                <div>Time</div>
                                <div>Match</div>
                                <div>Watch</div>
                            </div>
                            ${upcomingMatches.map(match => this.renderMatchRow(match)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
    }
    
    // ENHANCED: Render match rows with status-based styling
    renderMatchRow(match) {
        const statusClass = match.status.toLowerCase();
        const isTest = match.teams.includes('TEST');
        
        let timeDisplay = match.time;
        if (match.status === 'UPCOMING') {
            timeDisplay = match.countdownText;
        } else if (match.status === 'LIVE') {
            timeDisplay = 'LIVE';
        }
        
        return `
            <div class="match-row ${statusClass} ${isTest ? 'test-match' : ''}">
                <div class="match-time">
                    ${timeDisplay}
                    ${match.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                    ${match.isUpcoming ? '<span class="upcoming-badge">SOON</span>' : ''}
                </div>
                <div class="match-details">
                    <div class="team-names">${match.teams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.streamUrl && !match.isEnded ? 
                        `<button class="watch-btn ${match.isLive ? 'live' : (match.isUpcoming ? 'upcoming' : '')}" 
                                onclick="window.open('${match.streamUrl}', '_blank')">
                            ${match.isLive ? 'LIVE NOW' : (match.isUpcoming ? 'WATCH SOON' : 'WATCH')}
                        </button>` :
                        '<span class="offline-text">' + (match.isEnded ? 'ENDED' : 'OFFLINE') + '</span>'
                    }
                </div>
            </div>
        `;
    }
    
    debugMatchStatuses() {
        console.log('=== MATCH STATUS DEBUG ===');
        const statusCount = {
            LIVE: 0,
            UPCOMING: 0,
            ENDED: 0,
            UNKNOWN: 0
        };
        
        this.verifiedMatches.forEach(match => {
            statusCount[match.status] = (statusCount[match.status] || 0) + 1;
        });
        
        console.log('Status distribution:', statusCount);
        
        // Log examples of each status
        Object.keys(statusCount).forEach(status => {
            const examples = this.verifiedMatches
                .filter(m => m.status === status)
                .slice(0, 2);
            console.log(`${status} matches:`, examples.map(m => ({
                teams: m.teams,
                time: m.time,
                countdown: m.countdownText,
                timestamp: m.unixTimestamp
            })));
        });
    }
    
    // ... keep other methods like classifySport, showSportsView, etc. from previous versions ...
    
    startAutoRefresh() {
        // Full data refresh every 5 minutes
        setInterval(() => {
            this.loadMatches().then(() => {
                if (this.currentView === 'matches') this.showMatchesView();
                else if (this.currentView === 'dates') this.showDatesView();
                else if (this.currentView === 'sports') this.showSportsView();
                else if (this.currentView === 'main') this.showMainMenu();
            });
        }, 300000); // 5 minutes
    }
}

// Add CSS for status-based styling
const additionalCSS = `
    .match-row.live {
        background: rgba(255, 107, 107, 0.1) !important;
        border-left: 4px solid #ff6b6b !important;
        animation: glow 3s infinite ease-in-out;
    }
    
    .match-row.upcoming {
        background: rgba(255, 217, 61, 0.1) !important;
        border-left: 4px solid #ffd93d !important;
    }
    
    .match-row.ended {
        background: rgba(255, 255, 255, 0.05) !important;
        border-left: 4px solid #666 !important;
        opacity: 0.7;
    }
    
    .match-row.unknown {
        background: rgba(255, 255, 255, 0.03) !important;
        border-left: 4px solid #999 !important;
    }
    
    .upcoming-badge {
        background: #ffd93d;
        color: #000;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 0.8em;
        font-weight: bold;
        text-transform: uppercase;
        margin-left: 8px;
    }
    
    .watch-btn.upcoming {
        background: linear-gradient(45deg, #ffd93d, #ffb347) !important;
        color: #000 !important;
    }
    
    .watch-btn.ended {
        background: #666 !important;
        opacity: 0.7;
    }
    
    @keyframes glow {
        0% { box-shadow: 0 0 5px rgba(255, 107, 107, 0.3); }
        50% { box-shadow: 0 0 15px rgba(255, 107, 107, 0.6); }
        100% { box-shadow: 0 0 5px rgba(255, 107, 107, 0.3); }
    }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});
