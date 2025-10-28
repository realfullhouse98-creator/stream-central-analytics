// 9kilo Stream - Enhanced Professional Layout with Multiple Fallbacks
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.matchPolls = new Map();
        this.currentStreams = new Map();
        this.init();
    }
    
    async init() {
        this.showMainMenu();
        await this.loadMatches();
        this.startAutoRefresh();
    }
    
    async loadMatches() {
        this.showLoadingState();
        
        try {
            // Try multiple CORS proxy options
            const apiData = await this.tryAllProxies();
            this.organizeMatches(apiData);
            
        } catch (error) {
            console.warn('All API attempts failed:', error);
            this.useFallbackData();
            this.showErrorState('All connection attempts failed. Using demo data.');
        }
    }
    
    async tryAllProxies() {
        const targetUrl = 'https://topembed.pw/api.php?format=json';
        
        // List of CORS proxy options to try
        const proxyOptions = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            `https://proxy.cors.sh/${targetUrl}`,
            targetUrl // Direct attempt (might work in some environments)
        ];
        
        for (const proxyUrl of proxyOptions) {
            try {
                console.log(`Trying proxy: ${proxyUrl}`);
                const response = await fetch(proxyUrl, {
                    headers: {
                        'Accept': 'application/json',
                    },
                    signal: AbortSignal.timeout(8000) // 8 second timeout
                });
                
                if (response.ok) {
                    console.log(`Success with proxy: ${proxyUrl}`);
                    return await response.json();
                }
            } catch (error) {
                console.warn(`Proxy failed: ${proxyUrl}`, error);
                // Continue to next proxy
            }
        }
        
        throw new Error('All proxy attempts failed');
    }
    
    useFallbackData() {
        // Create realistic sample data for demo/research purposes
        const now = Math.floor(Date.now() / 1000);
        const sampleMatches = {
            events: {
                '2024-12-20': [
                    {
                        match: 'Research Team A - Research Team B',
                        tournament: '9kilos Demo League',
                        sport: 'football',
                        unix_timestamp: now + 3600, // 1 hour from now
                        channels: []
                    },
                    {
                        match: 'Demo United - Test City FC',
                        tournament: 'Research Championship',
                        sport: 'football', 
                        unix_timestamp: now - 1800, // 30 minutes ago (LIVE)
                        channels: ['https://example.com/stream1']
                    },
                    {
                        match: 'Tech Giants - Innovation Stars',
                        tournament: 'Digital Cup',
                        sport: 'football',
                        unix_timestamp: now + 7200, // 2 hours from now
                        channels: []
                    }
                ],
                '2024-12-21': [
                    {
                        match: 'Basketball Research - Tech Demos',
                        tournament: 'Demo Games 2024',
                        sport: 'basketball',
                        unix_timestamp: now + 86400, // Tomorrow
                        channels: []
                    },
                    {
                        match: 'Tennis Pros - Future Stars',
                        tournament: 'International Open',
                        sport: 'tennis',
                        unix_timestamp: now + 90000,
                        channels: []
                    }
                ],
                '2024-12-22': [
                    {
                        match: 'Hockey Legends - New Generation',
                        tournament: 'Winter Classic',
                        sport: 'hockey',
                        unix_timestamp: now + 172800,
                        channels: []
                    }
                ]
            }
        };
        this.organizeMatches(sampleMatches);
    }
    
    showLoadingState() {
        if (this.currentView === 'main') {
            const container = document.getElementById('psl-streams-container');
            container.innerHTML = `
                <div class="content-section">
                    <div class="loading-message">
                        <div class="loading-spinner"></div>
                        <p>Loading live sports data...</p>
                        <p style="font-size: 0.8em; color: var(--text-muted); margin-top: 10px;">
                            9kilos Research Project - Testing API Integration
                        </p>
                        <p style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px;">
                            Attempting to connect to data source...
                        </p>
                    </div>
                </div>
            `;
        }
    }
    
    showErrorState(errorMessage = '') {
        const container = document.getElementById('psl-streams-container');
        if (this.currentView === 'main') {
            container.innerHTML = `
                <div class="content-section">
                    <div class="error-message">
                        <h3>🔧 Research Mode Active</h3>
                        <p>We're testing API reliability. Using demo data for research purposes.</p>
                        ${errorMessage ? `<p style="font-size: 0.8em; color: var(--accent-red); margin: 10px 0;">${errorMessage}</p>` : ''}
                        <div style="margin: 20px 0;">
                            <button class="retry-btn" onclick="matchScheduler.loadMatches()" style="margin: 5px;">
                                Retry Live Data
                            </button>
                            <button class="retry-btn" onclick="matchScheduler.useFallbackData(); matchScheduler.showMainMenu();" style="margin: 5px; background: var(--accent-blue);">
                                Use Demo Data
                            </button>
                        </div>
                        <p style="margin-top: 20px; font-size: 0.8em; color: var(--text-muted);">
                            This is expected during our research phase. The site is fully functional with demo content.
                        </p>
                    </div>
                </div>
            `;
        }
    }
    
    organizeMatches(apiData) {
        // Validate API response structure
        if (!apiData || typeof apiData !== 'object') {
            console.error('Invalid API response format');
            this.useFallbackData();
            return;
        }
        
        if (!apiData.events || typeof apiData.events !== 'object') {
            console.warn('No events in API response, using fallback data');
            this.useFallbackData();
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match?.match) {
                        const matchId = this.generateMatchId(match);
                        
                        if (!this.matchStats.has(matchId)) {
                            this.matchStats.set(matchId, {
                                views: Math.floor(Math.random() * 10000) + 500,
                                likes: Math.floor(Math.random() * 500) + 50,
                                dislikes: Math.floor(Math.random() * 100) + 10
                            });
                        }
                        
                        const channels = match.channels || [];
                        if (channels.length > 0 && !this.currentStreams.has(matchId)) {
                            this.currentStreams.set(matchId, 0);
                        }
                        
                        const processedMatch = {
                            id: matchId,
                            date: date,
                            time: this.convertUnixToLocalTime(match.unix_timestamp),
                            teams: match.match,
                            league: match.tournament || match.sport || 'Sports',
                            streamUrl: channels[0] || null,
                            channels: channels,
                            isLive: this.checkIfLive(match),
                            sport: this.classifySport(match),
                            unixTimestamp: match.unix_timestamp
                        };
                        
                        this.allMatches.push(processedMatch);
                        this.verifiedMatches.push(processedMatch);
                    }
                });
            }
        });
        
        // If no matches were processed, use fallback
        if (this.verifiedMatches.length === 0) {
            console.warn('No valid matches processed, using fallback data');
            this.useFallbackData();
            return;
        }
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
        
        // Refresh current view if needed
        if (this.currentView !== 'main') {
            this.showMainMenu();
        } else {
            // Force refresh main menu to show the loaded data
            this.showMainMenu();
        }
    }
    
    classifySport(match) {
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        
        const sportMapping = {
            'football': 'football', 'soccer': 'football',
            'ice hockey': 'hockey', 'hockey': 'hockey',
            'basketball': 'basketball', 'baseball': 'baseball',
            'tennis': 'tennis', 'badminton': 'badminton',
            'golf': 'golf', 'snooker': 'snooker',
            'cricket': 'cricket', 'handball': 'handball',
            'darts': 'darts', 'rugby': 'rugby union',
            'volleyball': 'volleyball', 'mma': 'mma',
            'equestrian': 'equestrian', 'winter sports': 'wintersports',
            'motorsports': 'motorsports'
        };
        
        if (sport && sportMapping[sport]) return sportMapping[sport];
        
        for (const [key, value] of Object.entries(sportMapping)) {
            if (sport.includes(key) || tournament.includes(key)) return value;
        }
        
        return 'other';
    }
    
    generateMatchId(match) {
        return `${match.match}-${match.unix_timestamp}-${Math.random().toString(36).substr(2, 6)}`;
    }
    
    convertUnixToLocalTime(unixTimestamp) {
        if (!unixTimestamp) return 'TBD';
        return new Date(unixTimestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }
    
    checkIfLive(match) {
        if (!match.unix_timestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unix_timestamp;
        return now >= matchTime && now <= (matchTime + 7200);
    }
    
    formatTeamNames(teamString) {
        return teamString.replace(/ - /g, ' vs ');
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    showStats() {
        document.querySelector('.analytics-overview').style.display = 'grid';
    }
    
    hideStats() {
        document.querySelector('.analytics-overview').style.display = 'none';
    }
    
    showMainMenu() {
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" onclick="matchScheduler.showSportsView()">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">${this.verifiedMatches.length} matches loaded</div>
                    </div>
                    <div class="menu-button tv-button" onclick="matchScheduler.showTVChannels()">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                    <div class="menu-button community" onclick="matchScheduler.showCommunity()">
                        <div class="button-title">COMMUNITY</div>
                        <div class="button-subtitle">Fan discussions</div>
                    </div>
                </div>
                ${this.verifiedMatches.length < 5 ? `
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: var(--text-muted); font-size: 0.8em;">
                            🔬 Research Mode: Demo data active | 
                            <button onclick="matchScheduler.loadMatches()" style="background: none; border: none; color: var(--accent-gold); cursor: pointer; text-decoration: underline;">
                                Retry Live Data
                            </button>
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
    }
    
    showCommunity() {
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Community</h2>
                    <p>Fan discussions</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Fan Zone</div>
                        <div class="match-count">Live Chat</div>
                    </div>
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Match Reactions</div>
                        <div class="match-count">Community</div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
    }
    
    showSportsView() {
        const container = document.getElementById('psl-streams-container');
        const sports = [
            { id: 'football', name: 'Football' }, { id: 'hockey', name: 'Hockey' },
            { id: 'basketball', name: 'Basketball' }, { id: 'baseball', name: 'Baseball' },
            { id: 'tennis', name: 'Tennis' }, { id: 'badminton', name: 'Badminton' },
            { id: 'golf', name: 'Golf' }, { id: 'cricket', name: 'Cricket' },
            { id: 'other', name: 'Other Sports' }
        ].map(sport => ({
            ...sport, count: this.getMatchesBySport(sport.id).length
        })).filter(sport => sport.count > 0);

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Choose</h2>
                    <p>Select category</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }
    
    showTVChannels() {
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>TV Channels</h2>
                    <p>24/7 live streams</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="alert('Sky Sports - Coming soon!')">
                        <div class="sport-name">Sky Sports</div>
                        <div class="match-count">Sports</div>
                    </div>
                    <div class="sport-button" onclick="alert('ESPN - Coming soon!')">
                        <div class="sport-name">ESPN</div>
                        <div class="match-count">Sports</div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
    }
    
    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }
    
    showDatesView() {
        const container = document.getElementById('psl-streams-container');
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.getSportDisplayName();
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showSportsView()">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName}</h2>
                    <p>Select date</p>
                </div>
                <div class="sports-grid">
                    ${dates.map(date => {
                        const dateMatches = matches.filter(m => m.date === date);
                        const liveCount = dateMatches.filter(m => m.isLive).length;
                        return `
                            <div class="date-button" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-name">${this.formatDisplayDate(date)}</div>
                                <div class="match-count">${dateMatches.length} match${dateMatches.length !== 1 ? 'es' : ''}${liveCount > 0 ? ` • ${liveCount} live` : ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'dates';
    }
    
    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }
    
    showMatchesView() {
        const container = document.getElementById('psl-streams-container');
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.getSportDisplayName();
        const displayDate = this.formatDisplayDate(this.currentDate);
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showDatesView()">←</button>
                </div>
                <div class="section-header">
                    <h2>Schedule</h2>
                    <p>${displayDate}</p>
                </div>
                
                <div class="matches-table">
                    <div class="table-header">
                        <div>Time</div>
                        <div>Match</div>
                        <div>Watch</div>
                    </div>
                    ${matches.length > 0 ? 
                        matches.map(match => this.renderMatchRow(match)).join('') :
                        '<div class="no-matches">No matches found for this date</div>'
                    }
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'matches';
    }
    
    renderMatchRow(match) {
        const isLive = match.isLive;
        const formattedTeams = this.formatTeamNames(match.teams);
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">${match.time}</div>
                <div class="match-details">
                    <div class="team-names">${formattedTeams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.channels && match.channels.length > 0 ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span style="color: var(--text-muted); font-size: 0.8em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    generateChannelSelector(channels, matchId) {
        const currentChannelIndex = this.currentStreams.get(matchId) || 0;
        const hasMultipleChannels = channels.length > 1;
        
        if (!hasMultipleChannels || channels.length === 0) {
            return '';
        }
        
        if (channels.length <= 2) {
            return `
                <div class="channel-selector">
                    <span class="channel-label">Source:</span>
                    <div class="channel-buttons">
                        ${channels.map((channel, index) => `
                            <button class="channel-btn ${index === currentChannelIndex ? 'active' : ''}" 
                                    onclick="matchScheduler.switchChannel('${matchId}', ${index})">
                                Source ${index + 1}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="channel-selector">
                <span class="channel-label">Source:</span>
                <div class="channel-dropdown">
                    <button class="channel-dropdown-btn" onclick="matchScheduler.toggleDropdown('${matchId}')">
                        Source ${currentChannelIndex + 1} of ${channels.length}
                    </button>
                    <div class="channel-dropdown-content" id="dropdown-${matchId}">
                        ${channels.map((channel, index) => `
                            <div class="channel-dropdown-item ${index === currentChannelIndex ? 'active' : ''}" 
                                 onclick="matchScheduler.switchChannel('${matchId}', ${index})">
                                Source ${index + 1}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    showMatchDetails(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const channels = match.channels || [];
        const currentChannelIndex = this.currentStreams.get(matchId) || 0;
        const currentStreamUrl = channels[currentChannelIndex] || null;
        
        const channelSelectorHTML = this.generateChannelSelector(channels, matchId);
        
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn" onclick="matchScheduler.showMatchesView()">← Back</button>
                    </div>
                    
                    <div class="video-container">
                        <!-- Enhanced Player Controls -->
                        <div class="video-player-controls">
                            ${channelSelectorHTML}
                            <div class="control-buttons-right">
                                <button class="player-control-btn refresh" onclick="matchScheduler.refreshCurrentStream('${matchId}')">
                                    Refresh
                                </button>
                                <button class="player-control-btn fullscreen" onclick="matchScheduler.toggleFullscreen('${matchId}')">
                                    ⛶
                                </button>
                            </div>
                        </div>
                        
                        <!-- YouTube-style Video Player -->
                        <div class="video-player-wrapper">
                            <div class="video-player" id="video-player-${matchId}">
                                ${currentStreamUrl ? 
                                    `<iframe src="${currentStreamUrl}" class="stream-iframe" id="stream-iframe-${matchId}"
                                            allow="autoplay; fullscreen" allowfullscreen></iframe>` :
                                    `<div class="no-stream">
                                        <h3>Stream Offline</h3>
                                        <p>No streams available for this match</p>
                                    </div>`
                                }
                            </div>
                        </div>
                        
                        <div class="video-controls">
                            <div class="video-title">${formattedTeams}</div>
                            <div class="video-stats">
                                <span class="views-count">${this.formatNumber(stats.views)} views</span>
                                ${match.isLive ? '<span class="live-badge-details">LIVE NOW</span>' : ''}
                                <span style="color: var(--text-muted);">• ${match.league}</span>
                                ${channels.length > 1 ? `<span style="color: var(--accent-gold);">• ${channels.length} sources</span>` : ''}
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn like-btn" onclick="matchScheduler.handleLike('${matchId}')">
                                    👍 ${this.formatNumber(stats.likes)}
                                </button>
                                <button class="action-btn dislike-btn" onclick="matchScheduler.handleDislike('${matchId}')">
                                    👎 ${this.formatNumber(stats.dislikes)}
                                </button>
                                <button class="action-btn" onclick="matchScheduler.handleShare('${matchId}')">
                                    📤 Share
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    <strong>Match Info:</strong> ${this.getTeamName(match.teams, 0)} vs ${this.getTeamName(match.teams, 1)} in ${match.league}. 
                                    ${match.isLive ? 'Live now!' : `Scheduled for ${match.time} on ${this.formatDisplayDate(match.date)}.`}
                                    ${channels.length > 1 ? `Multiple streaming sources available.` : ''}
                                    ${this.verifiedMatches.length < 5 ? '<br><br><em>⚠️ Research Mode: Demo data active</em>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer in match details -->
                    <footer class="dashboard-footer">
                        <div class="footer-legal">
                            <p class="copyright">© 2025 9KILOS. All rights reserved.</p>
                            <p class="legal-disclaimer">
                                KILOS is simply a database of embedded streams and HLS files available throughout the internet. 
                                WE does not host, control or upload any streams and/or media files. Please contact appropriate 
                                media owners or hosts.
                            </p>
                        </div>
                        <div class="last-updated">Updated: <span id="update-time-details">Just now</span></div>
                    </footer>
                </div>
            </div>
        `;
        
        document.getElementById('update-time-details').textContent = new Date().toLocaleTimeString();
        this.hideStats();
        this.incrementViews(matchId);
    }
    
    switchChannel(matchId, channelIndex) {
        this.currentStreams.set(matchId, channelIndex);
        this.showMatchDetails(matchId);
    }
    
    toggleDropdown(matchId) {
        const dropdown = document.getElementById(`dropdown-${matchId}`);
        const button = document.querySelector(`#dropdown-${matchId}`).previousElementSibling;
        
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            button.classList.remove('open');
        } else {
            document.querySelectorAll('.channel-dropdown-content.show').forEach(dd => {
                dd.classList.remove('show');
                dd.previousElementSibling.classList.remove('open');
            });
            
            dropdown.classList.add('show');
            button.classList.add('open');
        }
    }
    
    refreshCurrentStream(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
                
                const refreshBtn = document.querySelector('.player-control-btn.refresh');
                const originalText = refreshBtn.innerHTML;
                refreshBtn.innerHTML = 'Refreshing...';
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                }, 1000);
            }, 500);
        }
    }
    
    toggleFullscreen(matchId) {
        const videoPlayer = document.getElementById(`video-player-${matchId}`);
        if (!videoPlayer) return;
        
        if (!document.fullscreenElement) {
            videoPlayer.requestFullscreen().catch(err => {
                console.log('Fullscreen failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    getTeamName(teamString, index) {
        const teams = teamString.split(' - ');
        return teams[index] || `Team ${index + 1}`;
    }
    
    incrementViews(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.views++;
            this.matchStats.set(matchId, stats);
        }
    }
    
    handleLike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.likes++;
            this.matchStats.set(matchId, stats);
            this.showMatchDetails(matchId);
        }
    }
    
    handleDislike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.dislikes++;
            this.matchStats.set(matchId, stats);
            this.showMatchDetails(matchId);
        }
    }
    
    handleShare(matchId) {
        alert('Share feature coming soon!');
    }
    
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport === sport);
    }
    
    getMatchesBySportAndDate(sport, date) {
        return this.getMatchesBySport(sport).filter(match => match.date === date);
    }
    
    getSportDisplayName() {
        const names = {
            'football': 'Football', 'hockey': 'Hockey', 
            'basketball': 'Basketball', 'baseball': 'Baseball',
            'tennis': 'Tennis', 'badminton': 'Badminton',
            'golf': 'Golf', 'cricket': 'Cricket',
            'other': 'Other Sports'
        };
        return names[this.currentSport] || this.currentSport;
    }
    
    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    }
    
    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        const totalViewers = this.verifiedMatches.reduce((sum, match) => {
            const stats = this.matchStats.get(match.id);
            return sum + (stats ? stats.views : 0);
        }, 0);
        
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('live-viewers').textContent = this.formatNumber(Math.floor(totalViewers / 100));
        document.getElementById('countries').textContent = this.verifiedMatches.length < 5 ? '3' : '1';
        document.getElementById('uptime').textContent = this.verifiedMatches.length < 5 ? 'Research' : '100%';
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches();
        }, 300000); // 5 minutes
    }
}

// Add timeout support for fetch
if (!AbortSignal.timeout) {
    AbortSignal.timeout = function(ms) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(new Error("Timeout")), ms);
        return controller.signal;
    };
}

// Initialize immediately
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.channel-dropdown')) {
        document.querySelectorAll('.channel-dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            dropdown.previousElementSibling.classList.remove('open');
        });
    }
});
