// Uncle Stream - YouTube Style with Enhanced Match Details
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.matchPolls = new Map();
        this.init();
    }
    
    async init() {
        await this.loadMatches();
        this.showMainMenu();
        this.startAutoRefresh();
        this.initFooterVisibility();
    }
    
    async loadMatches() {
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const apiData = await response.json();
            this.organizeMatches(apiData);
        } catch (error) {
            this.showError();
        }
    }
    
    organizeMatches(apiData) {
        if (!apiData?.events) return;
        
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
    }
    
    generateMatchId(match) {
        return `${match.match || 'match'}-${match.unix_timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    classifySport(match) {
        const tournament = (match.tournament || '').toLowerCase();
        const matchName = (match.match || '').toLowerCase();
        
        const sportPatterns = {
            tennis: ['tennis', 'wimbledon', 'us open', 'australian open', 'french open', 'atp', 'wta', 'davis cup'],
            football: ['premier league', 'champions league', 'la liga', 'serie a', 'bundesliga', 'world cup', 
                      'euro', 'mls', 'fa cup', 'ligue 1', 'europa league', 'copa america', 'afcon', 'asian cup'],
            badminton: ['badminton', 'bwf', 'all england', 'thomas cup', 'uber cup'],
            golf: ['golf', 'pga', 'european tour', 'masters tournament', 'us open', 'the open', 'ryder cup'],
            baseball: ['baseball', 'mlb', 'world series', 'major league baseball', 'npb', 'kbo'],
            basketball: ['nba', 'basketball', 'euroleague', 'wnba', 'ncaa', 'fibra'],
            snooker: ['snooker', 'world snooker', 'uk championship', 'masters snooker'],
            cricket: ['cricket', 'icc', 'ipl', 't20', 'test match', 'odi', 'big bash', 'psl', 'cpl'],
            hockey: ['hockey', 'nhl', 'khl', 'stanley cup', 'ice hockey', 'field hockey'],
            handball: ['handball', 'euro handball', 'world handball'],
            darts: ['darts', 'pdc', 'world darts', 'premier league darts'],
            'rugby union': ['rugby union', 'six nations', 'super rugby', 'premiership', 'rugby championship'],
            volleyball: ['volleyball', 'beach volleyball', 'fivb', 'world volleyball'],
            mma: ['ufc', 'mma', 'mixed martial arts', 'bellator', 'one championship'],
            equestrian: ['equestrian', 'horse racing', 'derby', 'grand national', 'show jumping'],
            wintersports: ['wintersports', 'skiing', 'snowboarding', 'biathlon', 'cross-country', 'alpine'],
            motorsports: ['f1', 'formula 1', 'nascar', 'motogp', 'indycar', 'wec', 'wrc', 'formula e']
        };
        
        for (const [sport, patterns] of Object.entries(sportPatterns)) {
            if (patterns.some(pattern => tournament.includes(pattern))) {
                return sport;
            }
        }
        
        return tournament.includes('football') || matchName.includes('vs') ? 'football' : 'other';
    }
    
    convertUnixToLocalTime(unixTimestamp) {
        if (!unixTimestamp) return 'TBD';
        return new Date(unixTimestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    checkIfLive(match) {
        if (!match.unix_timestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unix_timestamp;
        const twoHours = 2 * 60 * 60;
        
        return now >= matchTime && now <= (matchTime + twoHours);
    }
    
    formatTeamNames(teamString) {
        return teamString.replace(/ - /g, ' Vs ');
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
                </div>
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.updateFooterVisibility();
    }
    
    showSportsView() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;

        const sports = [
            { id: 'tennis', name: 'Tennis' },
            { id: 'football', name: 'Football' },
            { id: 'badminton', name: 'Badminton' },
            { id: 'golf', name: 'Golf' },
            { id: 'baseball', name: 'Baseball' },
            { id: 'basketball', name: 'Basketball' },
            { id: 'snooker', name: 'Snooker' },
            { id: 'cricket', name: 'Cricket' },
            { id: 'hockey', name: 'Hockey' },
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
                    <p>Select a category</p>
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
        this.currentSport = null;
        this.updateFooterVisibility();
    }
    
    showTVChannels() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        const tvChannels = [
            { name: 'Sky Sports Main Event', category: 'Sports', url: 'https://example.com/sky-sports' },
            { name: 'BT Sport 1', category: 'Sports', url: 'https://example.com/bt-sport' },
            { name: 'ESPN', category: 'Sports', url: 'https://example.com/espn' },
            { name: 'beIN Sports', category: 'Sports', url: 'https://example.com/beinsports' },
            { name: 'NBA TV', category: 'Basketball', url: 'https://example.com/nba-tv' },
            { name: 'NFL Network', category: 'American Football', url: 'https://example.com/nfl' },
            { name: 'MLB Network', category: 'Baseball', url: 'https://example.com/mlb' },
            { name: 'NHL Network', category: 'Hockey', url: 'https://example.com/nhl' },
            { name: 'Tennis Channel', category: 'Tennis', url: 'https://example.com/tennis' },
            { name: 'Sky Sports Cricket', category: 'Cricket', url: 'https://example.com/cricket' },
            { name: 'Eurosport 1', category: 'Multi-Sport', url: 'https://example.com/eurosport' },
            { name: 'DAZN', category: 'Sports', url: 'https://example.com/dazn' }
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
                        <div class="sport-button" onclick="window.open('${channel.url}', '_blank')">
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
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showSportsView()">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName}</h2>
                    <p>Select a date</p>
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
                    <h2>${sportName}</h2>
                    <p>${displayDate} • ${matches.length} matches${liveCount > 0 ? ` • ${liveCount} live` : ''}</p>
                </div>
                
                <div class="matches-table">
                    <div class="table-header">
                        <div>Time</div>
                        <div>Match</div>
                        <div>Watch</div>
                    </div>
                    ${matches.length > 0 ? 
                        matches.map(match => this.renderMatchRow(match)).join('') :
                        '<div class="no-matches">No matches found</div>'
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
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">
                    ${match.time}
                </div>
                <div class="match-details">
                    <div class="team-names">${formattedTeams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.streamUrl ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" 
                                onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span class="offline-text">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    showMatchDetails(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        
        // Generate poll data
        if (!this.matchPolls.has(matchId)) {
            this.matchPolls.set(matchId, {
                question: `Who will win ${formattedTeams}?`,
                options: [
                    { text: this.getTeamName(match.teams, 0), votes: Math.floor(Math.random() * 100) + 20 },
                    { text: this.getTeamName(match.teams, 1), votes: Math.floor(Math.random() * 100) + 15 },
                    { text: "Draw", votes: Math.floor(Math.random() * 50) + 5 }
                ],
                totalVotes: 0,
                userVoted: false
            });
            
            // Calculate total votes
            const poll = this.matchPolls.get(matchId);
            poll.totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        }
        
        const poll = this.matchPolls.get(matchId);
        
        const matchDetailsHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn" onclick="matchScheduler.showMatchesView()">← Back</button>
                        <div class="header-controls">
                            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
                            <button class="fullscreen-btn" onclick="matchScheduler.toggleFullscreen()">⛶ Fullscreen</button>
                        </div>
                    </div>
                    
                    <div class="match-content">
                        <div class="video-container">
                            <!-- Video Player Controls -->
                            <div class="video-player-controls">
                                <button class="player-refresh-btn" onclick="matchScheduler.refreshStream('${matchId}')">🔄 Stream</button>
                                <button class="player-fullscreen-btn" onclick="matchScheduler.toggleVideoFullscreen('${matchId}')">⛶ Video</button>
                            </div>
                            
                            <div class="video-player" id="video-player-${matchId}">
                                ${match.streamUrl ? 
                                    `<iframe src="${match.streamUrl}" class="stream-iframe" id="stream-iframe-${matchId}"
                                            allowfullscreen></iframe>` :
                                    `<div class="no-stream">
                                        <h3>Stream Not Available</h3>
                                        <p>This match stream is currently offline</p>
                                    </div>`
                                }
                            </div>
                            
                            <div class="video-controls">
                                <div class="video-title">${formattedTeams}</div>
                                <div class="video-stats">
                                    <span class="views-count">${this.formatNumber(stats.views)} views</span>
                                    ${match.isLive ? '<span class="live-badge-details">LIVE</span>' : '<span class="match-status">UPCOMING</span>'}
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
                                
                                <!-- Match Description -->
                                <div class="match-description">
                                    <div class="description-text">
                                        ${this.getTeamName(match.teams, 0)} against ${this.getTeamName(match.teams, 1)} clash - who will emerge the winner?
                                    </div>
                                </div>
                                
                                <!-- Poll Section -->
                                <div class="poll-section">
                                    <div class="poll-title">Community Poll: ${poll.question}</div>
                                    <div class="poll-options">
                                        ${poll.options.map((option, index) => {
                                            const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
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
                                        ${poll.userVoted ? '<span>Thanks for voting! 🗳️</span>' : '<span>Click to vote!</span>'}
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
        
        // Increment views
        this.incrementViews(matchId);
        this.updateFooterVisibility();
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
        
        const likeBtn = document.querySelector('.like-btn');
        const dislikeBtn = document.querySelector('.dislike-btn');
        
        if (likeBtn) {
            likeBtn.querySelector('.like-count').textContent = this.formatNumber(stats.likes);
        }
        if (dislikeBtn) {
            dislikeBtn.querySelector('.dislike-count').textContent = this.formatNumber(stats.dislikes);
        }
    }
    
    handleShare(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (match && navigator.share) {
            navigator.share({
                title: `${this.formatTeamNames(match.teams)} - Live Stream`,
                text: `Watch ${this.formatTeamNames(match.teams)} live on 9kilo Stream!`,
                url: window.location.href
            });
        } else {
            alert('Share this match with your friends!');
        }
    }
    
    refreshStream(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match || !match.streamUrl) return;
        
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) {
            // Reload the iframe to refresh the stream
            iframe.src = iframe.src;
            
            // Show refresh feedback
            const refreshBtn = document.querySelector('.player-refresh-btn');
            if (refreshBtn) {
                refreshBtn.textContent = '🔄 Refreshing...';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Stream';
                }, 1000);
            }
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
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    voteInPoll(matchId, optionIndex) {
        const poll = this.matchPolls.get(matchId);
        if (!poll || poll.userVoted) return;
        
        // Add vote
        poll.options[optionIndex].votes++;
        poll.totalVotes++;
        poll.userVoted = true;
        
        // Update UI
        this.updatePollUI(matchId);
    }
    
    updatePollUI(matchId) {
        const poll = this.matchPolls.get(matchId);
        if (!poll) return;
        
        // This would need to be more sophisticated in a real app
        // For now, we'll just reload the match details to show updated poll
        this.showMatchDetails(matchId);
    }
    
    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport.toLowerCase() === sport.toLowerCase());
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
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }
    
    updateLiveStatus() {
        if (this.currentView === 'matches') this.showMatchesView();
    }
    
    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        const totalViewers = this.verifiedMatches.reduce((sum, match) => {
            const stats = this.matchStats.get(match.id);
            return sum + (stats ? stats.views : 0);
        }, 0);
        
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('live-viewers').textContent = Math.floor(totalViewers / 100);
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    showError() {
        const container = document.getElementById('psl-streams-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Unable to Load Schedules</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="matchScheduler.init()">Try Again</button>
                </div>
            `;
        }
    }
    
    startLiveUpdates() {
        setInterval(() => this.updateLiveStatus(), 30000);
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadMatches().then(() => {
                if (this.currentView === 'matches') this.showMatchesView();
                else if (this.currentView === 'dates') this.showDatesView();
                else if (this.currentView === 'sports') this.showSportsView();
                else if (this.currentView === 'main') this.showMainMenu();
            });
        }, 300000);
    }
    
    // Footer Visibility Control
    initFooterVisibility() {
        const footer = document.querySelector('.dashboard-footer');
        
        if (!footer) return;
        
        let lastScrollTop = 0;
        
        const checkFooterVisibility = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Show footer when near bottom of page (within 100px)
            if (scrollTop + windowHeight >= documentHeight - 100) {
                footer.classList.add('visible');
            } else {
                footer.classList.remove('visible');
            }
            
            lastScrollTop = scrollTop;
        };
        
        // Check on scroll and resize
        window.addEventListener('scroll', checkFooterVisibility);
        window.addEventListener('resize', checkFooterVisibility);
        
        // Initial check
        setTimeout(checkFooterVisibility, 100);
    }
    
    updateFooterVisibility() {
        // Force a re-check of footer visibility when view changes
        setTimeout(() => {
            const event = new Event('scroll');
            window.dispatchEvent(event);
        }, 100);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});
