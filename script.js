// 9kilo Stream - Fixed for Your API Data Structure
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.matchPolls = new Map();
        this.apiCache = {
            data: null,
            timestamp: 0,
            duration: 300000
        };
        this.init();
    }
    
    async init() {
        this.hideInitialLoading();
        await this.loadMatches();
        this.showMainMenu();
        this.startAutoRefresh();
        this.initFooterVisibility();
    }
    
    hideInitialLoading() {
        const loading = document.getElementById('initial-loading');
        const dashboard = document.querySelector('.stream-central-dashboard');
        
        if (loading && dashboard) {
            loading.style.display = 'none';
            dashboard.style.display = 'flex';
        }
    }
    
    async loadMatches() {
        if (this.isCacheValid()) {
            this.organizeMatches(this.apiCache.data);
            return;
        }
        
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            
            this.apiCache = {
                data: apiData,
                timestamp: Date.now(),
                duration: 300000
            };
            
            this.organizeMatches(apiData);
        } catch (error) {
            console.warn('API load failed:', error);
            if (this.apiCache.data) {
                this.organizeMatches(this.apiCache.data);
            } else {
                this.showError();
            }
        }
    }
    
    isCacheValid() {
        return this.apiCache.data && 
               (Date.now() - this.apiCache.timestamp) < this.apiCache.duration;
    }
    
    organizeMatches(apiData) {
        if (!apiData?.events) {
            this.showError('No match data available');
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        try {
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
                            
                            const processedMatch = {
                                id: matchId,
                                date: date,
                                time: this.convertUnixToLocalTime(match.unix_timestamp),
                                teams: match.match,
                                league: match.tournament || match.sport || 'Sports',
                                streamUrl: match.channels?.[0] || null,
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
            
            this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
            this.updateAnalytics();
            
        } catch (error) {
            console.error('Error organizing matches:', error);
            this.showError('Error processing match data');
        }
    }
    
    classifySport(match) {
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        
        const sportMapping = {
            'football': 'football',
            'soccer': 'football',
            'ice hockey': 'hockey',
            'hockey': 'hockey',
            'field hockey': 'hockey',
            'basketball': 'basketball',
            'baseball': 'baseball',
            'tennis': 'tennis',
            'badminton': 'badminton',
            'golf': 'golf',
            'snooker': 'snooker',
            'cricket': 'cricket',
            'handball': 'handball',
            'darts': 'darts',
            'rugby': 'rugby union',
            'rugby union': 'rugby union',
            'volleyball': 'volleyball',
            'mma': 'mma',
            'ufc': 'mma',
            'equestrian': 'equestrian',
            'horse racing': 'equestrian',
            'winter sports': 'wintersports',
            'skiing': 'wintersports',
            'snowboarding': 'wintersports',
            'motorsports': 'motorsports',
            'f1': 'motorsports',
            'formula 1': 'motorsports',
            'nascar': 'motorsports'
        };
        
        // First try exact match with sport field
        if (sport && sportMapping[sport]) {
            return sportMapping[sport];
        }
        
        // Then try partial matching
        for (const [key, value] of Object.entries(sportMapping)) {
            if (sport.includes(key) || tournament.includes(key)) {
                return value;
            }
        }
        
        return 'other';
    }
    
    generateMatchId(match) {
        const teams = (match.match || 'unknown').replace(/[^a-zA-Z0-9]/g, '-');
        const timestamp = match.unix_timestamp || Date.now();
        return `${teams}-${timestamp}-${Math.random().toString(36).substr(2, 6)}`;
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
        if (!match.unix_timestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unix_timestamp;
        const eventDuration = 3 * 60 * 60;
        
        return now >= matchTime && now <= (matchTime + eventDuration);
    }
    
    formatTeamNames(teamString) {
        if (!teamString) return 'Teams TBA';
        return teamString.replace(/ - /g, ' vs ');
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    showStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) {
            analytics.style.display = 'grid';
        }
    }
    
    hideStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) {
            analytics.style.display = 'none';
        }
    }
    
    showMainMenu() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
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
                    <div class="menu-button community" onclick="matchScheduler.showCommunity()">
                        <div class="button-title">COMMUNITY</div>
                        <div class="button-subtitle">Fan discussions & events</div>
                    </div>
                </div>
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.updateFooterVisibility();
    }
    
    showCommunity() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const communityItems = [
            { name: 'Fan Zone', category: 'Live Chat', url: '#' },
            { name: 'Match Reactions', category: 'Community', url: '#' },
            { name: 'Player Discussions', category: 'Forums', url: '#' },
            { name: 'Event Planning', category: 'Meetups', url: '#' }
        ];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Community</h2>
                    <p>Join fan discussions and community events</p>
                </div>
                <div class="sports-grid">
                    ${communityItems.map(item => `
                        <div class="sport-button" onclick="matchScheduler.handleCommunityClick('${item.name}')">
                            <div class="sport-name">${item.name}</div>
                            <div class="match-count">${item.category}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.updateFooterVisibility();
    }
    
    handleCommunityClick(feature) {
        alert(`${feature} coming soon! Follow our updates for new features.`);
    }
    
    showSportsView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;

        const sports = [
            { id: 'football', name: 'Football' },
            { id: 'hockey', name: 'Hockey' },
            { id: 'basketball', name: 'Basketball' },
            { id: 'baseball', name: 'Baseball' },
            { id: 'tennis', name: 'Tennis' },
            { id: 'badminton', name: 'Badminton' },
            { id: 'golf', name: 'Golf' },
            { id: 'snooker', name: 'Snooker' },
            { id: 'cricket', name: 'Cricket' },
            { id: 'handball', name: 'Handball' },
            { id: 'darts', name: 'Darts' },
            { id: 'rugby union', name: 'Rugby Union' },
            { id: 'volleyball', name: 'Volleyball' },
            { id: 'mma', name: 'MMA' },
            { id: 'equestrian', name: 'Equestrian' },
            { id: 'wintersports', name: 'Wintersports' },
            { id: 'motorsports', name: 'Motorsports' },
            { id: 'other', name: 'Other Sports' }
        ].map(sport => ({
            ...sport,
            count: this.getMatchesBySport(sport.id).length
        })).filter(sport => sport.count > 0);

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Choose Sport</h2>
                    <p>Select a category to view matches</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <div class="match-count">${sport.count} match${sport.count !== 1 ? 'es' : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
        this.currentSport = null;
        this.updateFooterVisibility();
    }
    
    showTVChannels() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const tvChannels = [
            { name: 'Sky Sports Main Event', category: 'Sports', url: '#' },
            { name: 'BT Sport 1', category: 'Sports', url: '#' },
            { name: 'ESPN', category: 'Sports', url: '#' },
            { name: 'beIN Sports', category: 'Sports', url: '#' },
            { name: 'NBA TV', category: 'Basketball', url: '#' },
            { name: 'NFL Network', category: 'American Football', url: '#' },
            { name: 'MLB Network', category: 'Baseball', url: '#' },
            { name: 'NHL Network', category: 'Hockey', url: '#' },
            { name: 'Tennis Channel', category: 'Tennis', url: '#' },
            { name: 'Sky Sports Cricket', category: 'Cricket', url: '#' },
            { name: 'Eurosport 1', category: 'Multi-Sport', url: '#' },
            { name: 'DAZN', category: 'Sports', url: '#' }
        ];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>TV Channels</h2>
                    <p>Click any channel to watch live</p>
                </div>
                <div class="sports-grid">
                    ${tvChannels.map(channel => `
                        <div class="sport-button" onclick="matchScheduler.handleTVChannelClick('${channel.name}')">
                            <div class="sport-name">${channel.name}</div>
                            <div class="match-count">${channel.category}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.updateFooterVisibility();
    }
    
    handleTVChannelClick(channel) {
        alert(`${channel} integration coming soon! Currently focusing on live match streams.`);
    }
    
    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }
    
    showDatesView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.getSportDisplayName();
        
        if (dates.length === 0) {
            container.innerHTML = `
                <div class="content-section">
                    <div class="navigation-buttons">
                        <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                        <button class="top-back-button" onclick="matchScheduler.showSportsView()">←</button>
                    </div>
                    <div class="section-header">
                        <h2>${sportName}</h2>
                        <p>No matches scheduled</p>
                    </div>
                    <div class="no-matches">
                        <p>No ${sportName.toLowerCase()} matches found in the schedule.</p>
                        <button class="retry-btn" onclick="matchScheduler.loadMatches().then(() => matchScheduler.showDatesView())">
                            Refresh Schedule
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showSportsView()">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName}</h2>
                    <p>Select a date to view matches</p>
                </div>
                <div class="sports-grid">
                    ${dates.map(date => {
                        const dateMatches = matches.filter(m => m.date === date);
                        const liveCount = dateMatches.filter(m => m.isLive).length;
                        const totalCount = dateMatches.length;
                        
                        return `
                            <div class="date-button" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-name">${this.formatDisplayDate(date)}</div>
                                <div class="match-count">
                                    ${totalCount} match${totalCount !== 1 ? 'es' : ''}
                                    ${liveCount > 0 ? ` • ${liveCount} LIVE` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'dates';
        this.currentDate = null;
        this.updateFooterVisibility();
    }
    
    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }
    
    showMatchesView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.getSportDisplayName();
        const displayDate = this.formatDisplayDate(this.currentDate);
        const liveCount = matches.filter(m => m.isLive).length;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showDatesView()">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName} Schedule</h2>
                    <p>${displayDate} • ${matches.length} matches • ${liveCount} live</p>
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
        this.startLiveUpdates();
        this.updateFooterVisibility();
    }
    
    renderMatchRow(match) {
        const isLive = match.isLive;
        const formattedTeams = this.formatTeamNames(match.teams);
        const streamAvailable = match.streamUrl && match.streamUrl.startsWith('http');
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">
                    ${isLive ? '🔴 ' : ''}${match.time}
                </div>
                <div class="match-details">
                    <div class="team-names">${formattedTeams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${streamAvailable ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" 
                                onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span class="offline-text" style="color: var(--text-muted); font-size: 0.9em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    showMatchDetails(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) {
            this.showError('Match not found');
            return;
        }
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const streamAvailable = match.streamUrl && match.streamUrl.startsWith('http');
        
        if (!this.matchPolls.has(matchId)) {
            const team1 = this.getTeamName(match.teams, 0);
            const team2 = this.getTeamName(match.teams, 1);
            
            this.matchPolls.set(matchId, {
                question: `Who will win ${formattedTeams}?`,
                options: [
                    { text: team1, votes: Math.floor(Math.random() * 100) + 20 },
                    { text: team2, votes: Math.floor(Math.random() * 100) + 15 },
                    { text: "Draw/Tie", votes: Math.floor(Math.random() * 50) + 5 }
                ],
                totalVotes: 0,
                userVoted: false
            });
            
            const poll = this.matchPolls.get(matchId);
            poll.totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        }
        
        const poll = this.matchPolls.get(matchId);
        
        const matchDetailsHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn" onclick="matchScheduler.showMatchesView()">← Back to Schedule</button>
                        <div class="header-controls">
                            <button class="refresh-btn" onclick="matchScheduler.refreshStream('${matchId}')">🔄 Refresh</button>
                            <button class="fullscreen-btn" onclick="matchScheduler.toggleFullscreen()">⛶ Fullscreen</button>
                        </div>
                    </div>
                    
                    <div class="match-content">
                        <div class="video-container">
                            <div class="video-player-controls">
                                <button class="player-refresh-btn" onclick="matchScheduler.refreshStream('${matchId}')">
                                    🔄 Refresh Stream
                                </button>
                                <button class="player-fullscreen-btn" onclick="matchScheduler.toggleVideoFullscreen('${matchId}')">
                                    ⛶ Fullscreen
                                </button>
                            </div>
                            
                            <div class="video-player" id="video-player-${matchId}">
                                ${streamAvailable ? 
                                    `<iframe 
                                        src="${match.streamUrl}" 
                                        class="stream-iframe" 
                                        id="stream-iframe-${matchId}"
                                        allow="autoplay; fullscreen" 
                                        allowfullscreen
                                    ></iframe>` :
                                    `<div class="no-stream">
                                        <h3>Stream Not Available</h3>
                                        <p>This match stream is currently offline or not available.</p>
                                    </div>`
                                }
                            </div>
                            
                            <div class="video-controls">
                                <div class="video-title">${formattedTeams}</div>
                                <div class="video-stats">
                                    <span class="views-count">${this.formatNumber(stats.views)} views</span>
                                    ${match.isLive ? 
                                        '<span class="live-badge-details">LIVE NOW</span>' : 
                                        '<span class="match-status">UPCOMING</span>'
                                    }
                                    <span style="color: var(--text-muted);">• ${match.league}</span>
                                </div>
                                
                                <div class="video-actions">
                                    <button class="action-btn like-btn" onclick="matchScheduler.handleLike('${matchId}')">
                                        👍 <span class="like-count">${this.formatNumber(stats.likes)}</span>
                                    </button>
                                    <button class="action-btn dislike-btn" onclick="matchScheduler.handleDislike('${matchId}')">
                                        👎 <span class="dislike-count">${this.formatNumber(stats.dislikes)}</span>
                                    </button>
                                    <button class="action-btn" onclick="matchScheduler.handleShare('${matchId}')">
                                        📤 Share
                                    </button>
                                </div>
                                
                                <div class="match-description">
                                    <div class="description-text">
                                        <strong>Match Info:</strong> ${this.getTeamName(match.teams, 0)} vs ${this.getTeamName(match.teams, 1)} in ${match.league}. 
                                        ${match.isLive ? 'Live now!' : `Scheduled for ${match.time} on ${this.formatDisplayDate(match.date)}.`}
                                    </div>
                                </div>
                                
                                <div class="poll-section">
                                    <div class="poll-title">${poll.question}</div>
                                    <div class="poll-options">
                                        ${poll.options.map((option, index) => {
                                            const percentage = poll.totalVotes > 0 ? 
                                                Math.round((option.votes / poll.totalVotes) * 100) : 0;
                                            return `
                                                <div class="poll-option" onclick="matchScheduler.voteInPoll('${matchId}', ${index})">
                                                    <input type="radio" name="poll-${matchId}" ${poll.userVoted ? 'disabled' : ''}>
                                                    <div class="poll-label">${option.text}</div>
                                                    <div class="poll-percentage">${percentage}%</div>
                                                    ${poll.userVoted ? `
                                                        <div class="poll-bar">
                                                            <div class="poll-fill" style="width: ${percentage}%"></div>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                    <div class="poll-stats">
                                        <span>Total Votes: ${poll.totalVotes}</span>
                                        ${poll.userVoted ? 
                                            '<span style="color: var(--accent-green);">Thanks for voting!</span>' : 
                                            '<span>Click your prediction to vote!</span>'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.getElementById('psl-streams-container');
        container.innerHTML = matchDetailsHTML;
        this.currentView = 'match-details';
        this.hideStats();
        
        this.incrementViews(matchId);
        this.updateFooterVisibility();
    }
    
    getTeamName(teamString, index) {
        if (!teamString) return `Team ${index + 1}`;
        const teams = teamString.split(' - ');
        return teams[index] || teams[0] || `Team ${index + 1}`;
    }
    
    incrementViews(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.views++;
            this.matchStats.set(matchId, stats);
            this.updateAnalytics();
        }
    }
    
    handleLike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.likes++;
            this.matchStats.set(matchId, stats);
            this.updateActionButtons(matchId);
        }
    }
    
    handleDislike(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.dislikes++;
            this.matchStats.set(matchId, stats);
            this.updateActionButtons(matchId);
        }
    }
    
    updateActionButtons(matchId) {
        const stats = this.matchStats.get(matchId);
        if (!stats) return;
        
        const likeBtn = document.querySelector('.like-btn .like-count');
        const dislikeBtn = document.querySelector('.dislike-btn .dislike-count');
        
        if (likeBtn) likeBtn.textContent = this.formatNumber(stats.likes);
        if (dislikeBtn) dislikeBtn.textContent = this.formatNumber(stats.dislikes);
    }
    
    handleShare(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const shareUrl = window.location.href.split('?')[0] + `?match=${matchId}`;
        const shareText = `Watch ${this.formatTeamNames(match.teams)} live on 9kilo Stream!`;
        
        if (navigator.share) {
            navigator.share({
                title: `${this.formatTeamNames(match.teams)} - Live Stream`,
                text: shareText,
                url: shareUrl
            });
        } else {
            prompt('Copy this link to share:', shareUrl);
        }
    }
    
    refreshStream(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match || !match.streamUrl) return;
        
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
            }, 500);
        }
    }
    
    toggleVideoFullscreen(matchId) {
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
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    voteInPoll(matchId, optionIndex) {
        const poll = this.matchPolls.get(matchId);
        if (!poll || poll.userVoted) return;
        
        poll.options[optionIndex].votes++;
        poll.totalVotes++;
        poll.userVoted = true;
        
        this.updatePollUI(matchId);
    }
    
    updatePollUI(matchId) {
        this.showMatchDetails(matchId);
    }
    
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => 
            match.sport.toLowerCase() === sport.toLowerCase()
        );
    }
    
    getMatchesBySportAndDate(sport, date) {
        return this.getMatchesBySport(sport).filter(match => match.date === date);
    }
    
    getSportDisplayName() {
        const names = {
            'tennis': 'Tennis',
            'football': 'Football',
            'badminton': 'Badminton',
            'golf': 'Golf',
            'baseball': 'Baseball',
            'basketball': 'Basketball',
            'snooker': 'Snooker',
            'cricket': 'Cricket',
            'hockey': 'Hockey',
            'handball': 'Handball',
            'darts': 'Darts',
            'rugby union': 'Rugby Union',
            'volleyball': 'Volleyball',
            'mma': 'MMA',
            'equestrian': 'Equestrian',
            'wintersports': 'Wintersports',
            'motorsports': 'Motorsports',
            'other': 'Other Sports'
        };
        return names[this.currentSport] || this.currentSport;
    }
    
    formatDisplayDate(dateString) {
        try {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }
    
    updateLiveStatus() {
        if (this.currentView === 'matches') {
            this.showMatchesView();
        }
    }
    
    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        const totalViewers = this.verifiedMatches.reduce((sum, match) => {
            const stats = this.matchStats.get(match.id);
            return sum + (stats ? stats.views : 0);
        }, 0);
        
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        
        updateElement('total-streams', this.verifiedMatches.length);
        updateElement('live-viewers', this.formatNumber(Math.floor(totalViewers / 100)));
        updateElement('update-time', new Date().toLocaleTimeString());
    }
    
    showError(message = 'Unable to load schedules') {
        const container = document.getElementById('psl-streams-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>${message}</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="matchScheduler.loadMatches().then(() => matchScheduler.showMainMenu())">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
    
    startLiveUpdates() {
        this.liveUpdateInterval = setInterval(() => {
            this.updateLiveStatus();
        }, 30000);
    }
    
    startAutoRefresh() {
        this.autoRefreshInterval = setInterval(() => {
            this.loadMatches().then(() => {
                if (this.currentView === 'matches') this.showMatchesView();
                else if (this.currentView === 'dates') this.showDatesView();
                else if (this.currentView === 'sports') this.showSportsView();
                else if (this.currentView === 'main') this.showMainMenu();
            });
        }, 300000);
    }
    
    initFooterVisibility() {
        const footer = document.querySelector('.dashboard-footer');
        if (!footer) return;
        
        const checkFooterVisibility = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            if (scrollTop + windowHeight >= documentHeight - 100) {
                footer.classList.add('visible');
            } else {
                footer.classList.remove('visible');
            }
        };
        
        window.addEventListener('scroll', checkFooterVisibility);
        window.addEventListener('resize', checkFooterVisibility);
        setTimeout(checkFooterVisibility, 100);
    }
    
    updateFooterVisibility() {
        setTimeout(() => {
            window.dispatchEvent(new Event('scroll'));
        }, 100);
    }
    
    destroy() {
        if (this.liveUpdateInterval) clearInterval(this.liveUpdateInterval);
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.matchScheduler) {
        window.matchScheduler.destroy();
    }
});
