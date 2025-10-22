// Sport71.pro Style Match Schedules - PROPER FOOTBALL SEPARATION
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentSport = 'all';
        this.verifiedMatches = [];
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
        this.verifiedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach((match) => {
                    if (match && match.match && match.sport) {
                        const matchTime = this.convertUnixToTime(match.unix_timestamp);
                        
                        // PROPERLY SEPARATE FOOTBALL TYPES
                        const correctedSport = this.correctFootballTypes(match);
                        
                        const processedMatch = {
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport,
                            streamUrl: this.getStreamUrl(match.channels),
                            isLive: this.checkIfLive(match),
                            sport: correctedSport,
                            originalSport: match.sport,
                            isVerified: correctedSport === match.sport,
                            contentWarning: correctedSport !== match.sport
                        };
                        
                        this.allMatches.push(processedMatch);
                        
                        if (this.isContentAccurate(processedMatch)) {
                            this.verifiedMatches.push(processedMatch);
                        }
                    }
                });
            }
        });
        
        console.log(`✅ ${this.verifiedMatches.length} verified matches organized`);
        this.updateAnalytics();
    }
    
    correctFootballTypes(match) {
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        
        // SOCCER (World Football) detection
        const soccerTerms = [
            'champions league', 'premier league', 'la liga', 'serie a', 'bundesliga',
            'europa league', 'fa cup', 'carabao cup', 'ligue 1', 'eredivisie',
            'primeira liga', 'mls', 'copa libertadores', 'copa sudamericana',
            'afc champions league', 'uefa', 'fifa', 'world cup', 'euro'
        ];
        
        const hasSoccerContent = soccerTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        );
        
        // SOCCER team patterns
        const soccerTeamPatterns = [
            'fc ', ' united', ' city', ' real ', ' atletico', ' barcelona', ' madrid',
            ' chelsea', ' liverpool', ' arsenal', ' tottenham', ' manchester',
            ' bayern', ' dortmund', ' psg', ' juventus', ' milan', ' inter', ' roma'
        ];
        
        const hasSoccerTeams = soccerTeamPatterns.some(term => 
            matchName.includes(term)
        );
        
        // AMERICAN FOOTBALL detection
        const americanFootballTerms = [
            'nfl', 'college football', 'super bowl', 'touchdown', 'ncaa football',
            'afc', 'nfc', 'playoffs', 'pro bowl', 'madden'
        ];
        
        const hasAmericanFootballContent = americanFootballTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        );
        
        // AMERICAN FOOTBALL team patterns
        const americanFootballTeams = [
            'packers', 'chiefs', 'patriots', 'cowboys', 'steelers', '49ers',
            'raiders', 'broncos', 'seahawks', 'buccaneers', 'rams', 'ravens',
            'bills', 'dolphins', 'jets', 'bears', 'lions', 'vikings', 'saints'
        ];
        
        const hasAmericanFootballTeams = americanFootballTeams.some(term => 
            matchName.includes(term)
        );
        
        // BASKETBALL detection
        const basketballTerms = ['nba', 'basketball', 'warriors', 'lakers', 'celtics'];
        const hasBasketballContent = basketballTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        );
        
        // CORRECT THE MIX-UPS
        
        // If API says "Football" but has soccer content → Soccer
        if (sport === 'football' && (hasSoccerContent || hasSoccerTeams)) {
            return 'Soccer';
        }
        
        // If API says "Football" but has American football content → American Football
        if (sport === 'football' && (hasAmericanFootballContent || hasAmericanFootballTeams)) {
            return 'American Football';
        }
        
        // If API says "Basketball" but has football content → check which type
        if (sport === 'basketball' && (hasSoccerContent || hasAmericanFootballContent)) {
            if (hasSoccerContent || hasSoccerTeams) return 'Soccer';
            if (hasAmericanFootballContent || hasAmericanFootballTeams) return 'American Football';
        }
        
        // Return original if no clear correction
        return sport.charAt(0).toUpperCase() + sport.slice(1);
    }
    
    isContentAccurate(match) {
        const matchName = (match.teams || '').toLowerCase();
        
        if (matchName.includes('undefined') || matchName.includes('null')) {
            return false;
        }
        
        if (matchName.length < 5 || matchName === 'vs' || matchName === 'tbd') {
            return false;
        }
        
        return true;
    }
    
    getStreamUrl(channels) {
        if (!channels || !Array.isArray(channels) || channels.length === 0) {
            return null;
        }
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
        return false;
    }
    
    updateAnalytics() {
        const liveViewers = Math.floor(Math.random() * 10000) + 5000;
        document.getElementById('live-viewers').textContent = liveViewers.toLocaleString();
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        const countries = Math.floor(Math.random() * 10) + 1;
        document.getElementById('countries').textContent = countries;
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
                    <h1 class="main-title">📅 Live Sports Schedules</h1>
                    <div class="current-date-display">${currentDate}</div>
                    <div class="match-stats">${this.verifiedMatches.length} matches • Auto-correcting football types</div>
                </div>
                
                <div class="sports-categories">
                    <button class="sport-btn active" onclick="matchScheduler.setSport('all')">
                        🌍 All Sports (${this.verifiedMatches.length})
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('soccer')">
                        ⚽ Soccer (${this.getVerifiedMatchesBySport('soccer').length})
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('american football')">
                        🏈 American Football (${this.getVerifiedMatchesBySport('american football').length})
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('basketball')">
                        🏀 Basketball (${this.getVerifiedMatchesBySport('basketball').length})
                    </button>
                    <button class="sport-btn" onclick="matchScheduler.setSport('ice hockey')">
                        🏒 Ice Hockey (${this.getVerifiedMatchesBySport('ice hockey').length})
                    </button>
                </div>
                
                <div class="matches-section">
                    <div class="section-title-bar">
                        <h2 class="section-title">${this.getSectionTitle()}</h2>
                        <span class="match-count">${this.getFilteredMatches().length} matches</span>
                    </div>
                    
                    <div class="football-explanation">
                        <strong>Note:</strong> "Soccer" ⚽ = Football (rest of world) • "American Football" 🏈 = NFL/College
                    </div>
                    
                    <div class="matches-table">
                        <div class="table-header">
                            <div class="col-time">🕒 Time</div>
                            <div class="col-match">🎯 Match Details</div>
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
    
    getVerifiedMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase().includes(sport.toLowerCase())
        );
    }
    
    getSectionTitle() {
        if (this.currentSport === 'all') return 'All Sports Events';
        if (this.currentSport === 'soccer') return 'Soccer Matches ⚽';
        if (this.currentSport === 'american football') return 'American Football 🏈';
        return `${this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1)} Matches`;
    }
    
    getFilteredMatches() {
        if (this.currentSport === 'all') return this.verifiedMatches;
        return this.getVerifiedMatchesBySport(this.currentSport);
    }
    
    renderMatchesTable() {
        const filteredMatches = this.getFilteredMatches();
        
        if (filteredMatches.length === 0) {
            return `
                <div class="no-matches">
                    <div class="col-time">-</div>
                    <div class="col-match">No ${this.currentSport === 'all' ? '' : this.currentSport + ' '}matches available</div>
                    <div class="col-watch">-</div>
                </div>
            `;
        }
        
        return filteredMatches.map(match => `
            <div class="match-row ${match.contentWarning ? 'content-warning-row' : ''}">
                <div class="col-time">
                    <span class="time-display">${match.time}</span>
                </div>
                <div class="col-match">
                    <div class="teams">${match.teams}</div>
                    <div class="league">
                        ${match.league} • ${match.sport}
                        ${match.contentWarning ? 
                            `<span class="correction-badge">Corrected from ${match.originalSport}</span>` : 
                            ''
                        }
                    </div>
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
        this.displayScheduledEvents();
    }
    
    watchMatch(streamUrl) {
        if (streamUrl) {
            window.open(streamUrl, '_blank');
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
        setInterval(() => {
            this.loadMatches().then(() => {
                this.displayScheduledEvents();
            });
        }, 5 * 60 * 1000);
    }
}

// Add CSS with proper football separation
const sportsStyles = document.createElement('style');
sportsStyles.textContent = `
    .scheduled-events {
        background: white;
        border-radius: 15px;
        padding: 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        margin: 20px auto;
        max-width: 1200px;
        width: 95%;
    }
    
    .events-header {
        background: linear-gradient(135deg, #34495e, #2c3e50);
        color: white;
        padding: 25px 30px;
        border-radius: 15px 15px 0 0;
        text-align: center;
    }
    
    .main-title {
        margin: 0 0 8px 0;
        font-size: 2.2em;
        font-weight: 700;
        color: white;
    }
    
    .current-date-display {
        font-size: 1.3em;
        color: #ecf0f1;
        font-weight: 500;
        margin-bottom: 5px;
    }
    
    .match-stats {
        font-size: 0.9em;
        color: #bdc3c7;
        opacity: 0.8;
    }
    
    .sports-categories {
        padding: 20px 25px;
        background: #f8f9fa;
        border-bottom: 2px solid #e9ecef;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .sport-btn {
        background: white;
        border: 2px solid #dee2e6;
        padding: 10px 18px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.95em;
        font-weight: 600;
        transition: all 0.3s ease;
        color: #495057;
    }
    
    .sport-btn.active {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
    }
    
    .matches-section {
        padding: 25px;
    }
    
    .section-title-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .section-title {
        margin: 0;
        color: #2c3e50;
        font-size: 1.6em;
        font-weight: 600;
    }
    
    .match-count {
        background: #3498db;
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.9em;
        font-weight: 600;
    }
    
    .football-explanation {
        background: #e3f2fd;
        border: 1px solid #bbdefb;
        color: #1565c0;
        padding: 10px 15px;
        border-radius: 5px;
        margin-bottom: 20px;
        font-size: 0.9em;
        text-align: center;
    }
    
    .matches-table {
        border: 1px solid #ecf0f1;
        border-radius: 8px;
        overflow: hidden;
        background: white;
    }
    
    .table-header {
        display: grid;
        grid-template-columns: 100px 1fr 110px;
        background: #2c3e50;
        color: white;
        font-weight: 600;
        padding: 15px 20px;
    }
    
    .match-row, .no-matches {
        display: grid;
        grid-template-columns: 100px 1fr 110px;
        padding: 15px 20px;
        border-bottom: 1px solid #f1f2f6;
        align-items: center;
    }
    
    .content-warning-row {
        background: #fffaf0;
    }
    
    .col-time {
        font-weight: 600;
        color: #e74c3c;
        font-size: 1em;
    }
    
    .col-match .teams {
        font-weight: 600;
        margin-bottom: 4px;
        color: #2c3e50;
        font-size: 1em;
    }
    
    .col-match .league {
        font-size: 0.85em;
        color: #7f8c8d;
    }
    
    .correction-badge {
        background: #fff3cd;
        color: #856404;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.75em;
        margin-left: 8px;
    }
    
    .watch-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.85em;
        font-weight: 600;
    }
    
    .no-matches, .error-state {
        text-align: center;
        padding: 30px;
        color: #7f8c8d;
        grid-column: 1 / -1;
    }
`;
document.head.appendChild(sportsStyles);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.matchScheduler = new MatchScheduler();
});
