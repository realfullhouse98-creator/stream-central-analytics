// Sport71.pro Style Match Schedules - CLEAN VERSION
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
        this.startLiveUpdates();
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
                        const matchTime = this.convertUnixToLocalTime(match.unix_timestamp);
                        
                        const correctedSport = this.correctSportClassification(match);
                        
                        const processedMatch = {
                            date: date,
                            time: matchTime,
                            teams: match.match,
                            league: match.tournament || match.sport,
                            streamUrl: this.getStreamUrl(match.channels),
                            isLive: this.checkIfLive(match),
                            sport: correctedSport,
                            originalSport: match.sport,
                            unixTimestamp: match.unix_timestamp,
                        };
                        
                        this.allMatches.push(processedMatch);
                        
                        if (this.isContentAccurate(processedMatch)) {
                            this.verifiedMatches.push(processedMatch);
                        }
                    }
                });
            }
        });
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        
        console.log(`✅ ${this.verifiedMatches.length} matches organized`);
        this.updateAnalytics();
    }
    
    correctSportClassification(match) {
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        
        const americanFootballTerms = [
            'nfl', 'college football', 'super bowl', 'ncaa football',
            'afc', 'nfc', 'playoffs'
        ];
        
        const americanFootballTeams = [
            'packers', 'chiefs', 'patriots', 'cowboys', 'steelers', '49ers',
            'raiders', 'broncos', 'seahawks', 'buccaneers', 'rams', 'ravens',
            'bills', 'dolphins', 'jets', 'bears', 'lions', 'vikings', 'saints'
        ];
        
        const hasAmericanFootballContent = 
            americanFootballTerms.some(term => tournament.includes(term)) ||
            americanFootballTeams.some(team => matchName.includes(team)) ||
            tournament.includes('college football') ||
            matchName.includes('state') ||
            matchName.includes('university');
        
        const soccerTerms = [
            'champions league', 'premier league', 'la liga', 'serie a', 'bundesliga',
            'europa league', 'fa cup', 'ligue 1', 'mls', 'copa libertadores'
        ];
        
        const hasSoccerContent = soccerTerms.some(term => 
            tournament.includes(term) || matchName.includes(term)
        );
        
        if (tournament.includes('college football') || matchName.includes('kennesaw state')) {
            return 'American Football';
        }
        
        if (hasAmericanFootballContent) {
            return 'American Football';
        }
        
        if (hasSoccerContent) {
            return 'Soccer';
        }
        
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
    
    updateLiveStatus() {
        let hasUpdates = false;
        
        this.verifiedMatches.forEach(match => {
            const wasLive = match.isLive;
            match.isLive = this.checkIfLive(match);
            
            if (wasLive !== match.isLive) {
                hasUpdates = true;
            }
        });
        
        if (hasUpdates) {
            this.updateDisplay();
        }
    }
    
    updateAnalytics() {
        const liveViewers = Math.floor(Math.random() * 10000) + 5000;
        document.getElementById('live-viewers').textContent = liveViewers.toLocaleString();
        
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        document.getElementById('total-streams').textContent = liveMatches;
        
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
                    <h1 class="main-title">Live Sports Schedules</h1>
                    <div class="current-date-display">${currentDate}</div>
                </div>
                
                <div class="sports-categories">
                    <button class="sport-btn ${this.currentSport === 'all' ? 'active' : ''}" data-sport="all">
                        All Sports (${this.verifiedMatches.length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'soccer' ? 'active' : ''}" data-sport="soccer">
                        Soccer (${this.getVerifiedMatchesBySport('soccer').length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'american football' ? 'active' : ''}" data-sport="american football">
                        American Football (${this.getVerifiedMatchesBySport('american football').length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'basketball' ? 'active' : ''}" data-sport="basketball">
                        Basketball (${this.getVerifiedMatchesBySport('basketball').length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'ice hockey' ? 'active' : ''}" data-sport="ice hockey">
                        Ice Hockey (${this.getVerifiedMatchesBySport('ice hockey').length})
                    </button>
                    <button class="sport-btn ${this.currentSport === 'volleyball' ? 'active' : ''}" data-sport="volleyball">
                        Volleyball (${this.getVerifiedMatchesBySport('volleyball').length})
                    </button>
                </div>
                
                <div class="matches-section">
                    <div class="section-title-bar">
                        <h2 class="section-title">${this.getSectionTitle()}</h2>
                        <span class="match-count">${this.getFilteredMatches().length} matches</span>
                    </div>
                    
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
        
        this.attachSportButtonListeners();
    }
    
    attachSportButtonListeners() {
        document.querySelectorAll('.sport-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sport = e.target.getAttribute('data-sport');
                this.setSport(sport);
            });
        });
    }
    
    getVerifiedMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase().includes(sport.toLowerCase())
        );
    }
    
    getSectionTitle() {
        if (this.currentSport === 'all') return 'All Sports Events';
        if (this.currentSport === 'soccer') return 'Soccer Matches';
        if (this.currentSport === 'american football') return 'American Football Matches';
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
            <div class="match-row ${match.isLive ? 'live-match' : ''}">
                <div class="col-time">
                    ${match.time}
                    ${match.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
                <div class="col-match">
                    <div class="teams">${match.teams}</div>
                    <div class="league">${match.league} • ${match.sport}</div>
                </div>
                <div class="col-watch">
                    ${match.streamUrl ? 
                        `<button class="watch-btn ${match.isLive ? 'live-watch-btn' : ''}" onclick="matchScheduler.watchMatch('${match.streamUrl}')">
                            ${match.isLive ? 'LIVE NOW' : 'WATCH'}
                        </button>` :
                        `<span class="no-stream">OFFLINE</span>`
                    }
                </div>
            </div>
        `).join('');
    }
    
    setSport(sport) {
        this.currentSport = sport;
        this.updateDisplay();
    }
    
    updateDisplay() {
        const tableBody = document.querySelector('.table-body');
        if (tableBody) {
            tableBody.innerHTML = this.renderMatchesTable();
        }
        
        document.querySelectorAll('.sport-btn').forEach(btn => {
            const btnSport = btn.getAttribute('data-sport');
            btn.classList.toggle('active', btnSport === this.currentSport);
        });
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
    
    startLiveUpdates() {
        setInterval(() => {
            this.updateLiveStatus();
        }, 30000);
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches().then(() => {
                this.displayScheduledEvents();
            });
        }, 5 * 60 * 1000);
    }
}

// Add Clean CSS
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
    
    .live-match {
        background: #fffaf0 !important;
        border-left: 4px solid #e74c3c;
    }
    
    .col-time {
        font-weight: 600;
        color: #e74c3c;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .live-badge {
        background: #e74c3c;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7em;
        font-weight: 700;
        text-transform: uppercase;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
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
    
    .watch-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.85em;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .live-watch-btn {
        background: #dc3545;
        animation: pulse 2s infinite;
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
