// Uncle Stream - FIXED Live Detection for Real Matches
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.showMainMenu();
        this.startAutoRefresh();
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
            // Try alternative data structures
            if (apiData.matches) {
                console.log('Found matches in alternative structure');
                this.processAlternativeStructure(apiData);
                return;
            }
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        console.log('Processing API events...');
        let totalMatches = 0;
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            console.log(`Date: ${date}, Matches type:`, typeof matches, 'Length:', Array.isArray(matches) ? matches.length : 'N/A');
            
            if (Array.isArray(matches)) {
                matches.forEach((match, index) => {
                    if (match && (match.match || match.name || match.teams)) {
                        const processedMatch = this.processMatchData(match, date);
                        if (processedMatch) {
                            this.allMatches.push(processedMatch);
                            this.verifiedMatches.push(processedMatch);
                            totalMatches++;
                        }
                    }
                });
            } else if (typeof matches === 'object') {
                // Handle object structure
                Object.entries(matches).forEach(([matchId, match]) => {
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
        
        // Only add test matches if no real matches found
        if (this.verifiedMatches.length === 0) {
            console.log('No real matches found, adding test matches');
            this.addTestMatches();
        } else {
            // Add a few test matches for comparison
            this.addTestMatchesForComparison();
        }
        
        this.verifiedMatches.sort((a, b) => (a.unixTimestamp || 0) - (b.unixTimestamp || 0));
        this.updateAnalytics();
        
        // Debug live detection
        this.debugLiveDetection();
    }
    
    processMatchData(match, date) {
        try {
            // Extract match information from various possible field names
            const matchName = match.match || match.name || match.teams || 'TBD vs TBD';
            const tournament = match.tournament || match.league || match.competition || match.sport || 'Sports';
            const unixTimestamp = match.unix_timestamp || match.timestamp || match.time;
            
            // Calculate if match is live
            const isLive = this.checkIfLive(match);
            
            const processedMatch = {
                date: date,
                time: this.convertUnixToLocalTime(unixTimestamp),
                teams: matchName,
                league: tournament,
                streamUrl: match.channels?.[0] || match.stream_url || match.url || null,
                isLive: isLive,
                sport: this.classifySport(match),
                unixTimestamp: unixTimestamp,
                rawData: match // Keep original for debugging
            };
            
            console.log(`Processed match:`, {
                teams: processedMatch.teams,
                league: processedMatch.league,
                time: processedMatch.time,
                isLive: processedMatch.isLive,
                sport: processedMatch.sport,
                timestamp: unixTimestamp
            });
            
            return processedMatch;
        } catch (error) {
            console.error('Error processing match:', error, match);
            return null;
        }
    }
    
    processAlternativeStructure(apiData) {
        console.log('Processing alternative API structure');
        this.allMatches = [];
        this.verifiedMatches = [];
        
        if (Array.isArray(apiData.matches)) {
            apiData.matches.forEach(match => {
                const processedMatch = this.processMatchData(match, match.date || new Date().toISOString().split('T')[0]);
                if (processedMatch) {
                    this.allMatches.push(processedMatch);
                    this.verifiedMatches.push(processedMatch);
                }
            });
        }
    }
    
    checkIfLive(match) {
        const unixTimestamp = match.unix_timestamp || match.timestamp;
        
        if (!unixTimestamp) {
            console.log('No timestamp for match:', match.match);
            return false;
        }
        
        const now = Math.floor(Date.now() / 1000);
        const matchTime = parseInt(unixTimestamp);
        
        if (isNaN(matchTime)) {
            console.log('Invalid timestamp:', unixTimestamp, 'for match:', match.match);
            return false;
        }
        
        // More flexible live detection:
        // - Match is live if it started in the last 4 hours and will end in next 2 hours
        // - This accounts for different sport durations
        const fourHours = 4 * 60 * 60;
        const twoHours = 2 * 60 * 60;
        
        const matchStarted = now >= matchTime;
        const recentlyStarted = now <= (matchTime + fourHours);
        const notTooFarFuture = now >= (matchTime - twoHours); // Starting soon
        
        const isLive = matchStarted && recentlyStarted;
        const isStartingSoon = notTooFarFuture && !matchStarted;
        
        // Debug specific matches
        if (match.match && (match.match.includes('TEST') || isLive)) {
            console.log('LIVE CHECK DETAILS:', {
                teams: match.match,
                matchTime: new Date(matchTime * 1000).toLocaleString(),
                currentTime: new Date(now * 1000).toLocaleString(),
                matchTimestamp: matchTime,
                now: now,
                timeDifference: now - matchTime,
                isLive: isLive,
                isStartingSoon: isStartingSoon,
                window: `Live if between ${new Date(matchTime * 1000).toLocaleTimeString()} and ${new Date((matchTime + fourHours) * 1000).toLocaleTimeString()}`
            });
        }
        
        return isLive;
    }
    
    addTestMatches() {
        const now = Math.floor(Date.now() / 1000);
        const today = new Date().toISOString().split('T')[0];
        
        const testMatches = [
            {
                date: today,
                time: 'LIVE',
                teams: 'TEST FOOTBALL 🔴 Real Madrid vs Barcelona',
                league: 'La Liga',
                streamUrl: 'https://example.com/football',
                isLive: true,
                sport: 'football',
                unixTimestamp: now - 3600 // 1 hour ago
            },
            {
                date: today,
                time: 'LIVE',
                teams: 'TEST TENNIS 🔴 Nadal vs Djokovic',
                league: 'Wimbledon',
                streamUrl: 'https://example.com/tennis',
                isLive: true,
                sport: 'tennis',
                unixTimestamp: now - 7200 // 2 hours ago
            },
            {
                date: today,
                time: '18:00',
                teams: 'TEST Basketball - Lakers vs Warriors',
                league: 'NBA',
                streamUrl: 'https://example.com/nba',
                isLive: false,
                sport: 'basketball',
                unixTimestamp: now + 3600 // 1 hour from now
            }
        ];
        
        testMatches.forEach(match => {
            this.verifiedMatches.push(match);
        });
    }
    
    addTestMatchesForComparison() {
        const now = Math.floor(Date.now() / 1000);
        const today = new Date().toISOString().split('T')[0];
        
        // Add one test live match for comparison
        this.verifiedMatches.push({
            date: today,
            time: 'LIVE',
            teams: 'TEST MATCH 🔴 For Comparison',
            league: 'Test League',
            streamUrl: 'https://example.com/test',
            isLive: true,
            sport: 'football',
            unixTimestamp: now - 3600
        });
    }
    
    debugLiveDetection() {
        console.log('=== LIVE DETECTION DEBUG ===');
        const liveMatches = this.verifiedMatches.filter(m => m.isLive);
        const realLiveMatches = liveMatches.filter(m => !m.teams.includes('TEST'));
        
        console.log(`Total matches: ${this.verifiedMatches.length}`);
        console.log(`Total live matches: ${liveMatches.length}`);
        console.log(`Real live matches: ${realLiveMatches.length}`);
        console.log(`Test live matches: ${liveMatches.length - realLiveMatches.length}`);
        
        if (realLiveMatches.length > 0) {
            console.log('REAL LIVE MATCHES FOUND:');
            realLiveMatches.forEach(match => {
                console.log('→', {
                    teams: match.teams,
                    league: match.league,
                    time: match.time,
                    sport: match.sport,
                    timestamp: match.unixTimestamp,
                    currentTime: Math.floor(Date.now() / 1000)
                });
            });
        } else {
            console.log('NO REAL LIVE MATCHES DETECTED');
            console.log('All matches:');
            this.verifiedMatches.forEach(match => {
                console.log('•', {
                    teams: match.teams,
                    time: match.time,
                    isLive: match.isLive,
                    timestamp: match.unixTimestamp,
                    currentTime: Math.floor(Date.now() / 1000),
                    difference: Math.floor(Date.now() / 1000) - (match.unixTimestamp || 0)
                });
            });
        }
    }
    
    // ENHANCED: Show live matches on main page
    showMainMenu() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const liveMatches = this.verifiedMatches.filter(m => m.isLive && !m.teams.includes('TEST'));
        const upcomingMatches = this.verifiedMatches
            .filter(m => !m.isLive && !m.teams.includes('TEST'))
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
    
    renderMatchRow(match) {
        const isLive = match.isLive;
        const isTest = match.teams.includes('TEST');
        
        return `
            <div class="match-row ${isLive ? 'live' : ''} ${isTest ? 'test-match' : ''}">
                <div class="match-time">
                    ${match.time}
                    ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
                <div class="match-details">
                    <div class="team-names">${match.teams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.streamUrl ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="window.open('${match.streamUrl}', '_blank')">
                            ${isLive ? 'LIVE NOW' : 'WATCH'}
                        </button>` :
                        '<span class="offline-text">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    // ... keep the classifySport method and other methods from previous version ...
    classifySport(match) {
        const tournament = (match.tournament || match.league || '').toLowerCase();
        const matchName = (match.match || match.name || '').toLowerCase();
        const sport = (match.sport || '').toLowerCase();
        
        // Enhanced sport classification logic from previous version
        const sportPatterns = {
            football: ['premier league', 'champions league', 'la liga', 'serie a', 'bundesliga', 'world cup', 'euro', 'mls', 'fa cup', 'ligue 1', 'europa league', 'copa america', 'afcon', 'asian cup', 'concacaf', 'uefa', 'fifa'],
            tennis: ['tennis', 'wimbledon', 'us open', 'australian open', 'french open', 'atp', 'wta', 'davis cup', 'grand slam'],
            basketball: ['nba', 'basketball', 'euroleague', 'wnba', 'ncaa', 'fiba'],
            cricket: ['cricket', 'icc', 'ipl', 't20', 'test match', 'odi', 'big bash', 'psl', 'cpl'],
            // ... other sports patterns
        };
        
        for (const [sportKey, patterns] of Object.entries(sportPatterns)) {
            if (patterns.some(pattern => tournament.includes(pattern) || matchName.includes(pattern))) {
                return sportKey;
            }
        }
        
        return 'other';
    }
    
    // ... other methods remain the same ...
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});
