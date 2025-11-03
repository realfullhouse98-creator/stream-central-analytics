// modules/ui-manager.js - COMPLETE VERSION
export class UIManager {
    constructor(scheduler) {
        this.scheduler = scheduler;
    }

    // ==================== TV CHANNELS NAVIGATION ====================
    showTVChannels() {
        console.log('🎯 TV Channels button clicked');
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.add('tv-section');
        this.showCountriesView();
    }

    showCountriesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const tvData = this.scheduler.dataFusion.getTVChannelsData();
        
        container.innerHTML = `
            <div class="content-section">
                <div class="tv-navigation">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Country</h2>
                    <p>Select country for TV channels</p>
                </div>
                
                <div class="countries-grid">
                    ${Object.entries(tvData).map(([country, channels]) => `
                        <div class="country-card" onclick="matchScheduler.showCountryChannels('${country}')">
                            <div class="country-flag">${this.getCountryFlag(country)}</div>
                            <div class="country-name">${country}</div>
                            <div class="channel-count">${channels.length} channels</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.scheduler.hideStats();
        this.scheduler.currentView = 'tv-countries';
    }

    showCountryChannels(country) {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        this.scheduler.currentCountry = country;
        const tvData = this.scheduler.dataFusion.getTVChannelsData();
        const channels = tvData[country] || [];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="tv-navigation">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>TV Channels</h2>
                    <p>Browse ${country} channels</p>
                </div>
                
                <div class="channels-grid">
                    ${channels.map(channel => `
                        <div class="channel-card">
                            <div class="channel-header">
                                <div class="channel-info">
                                    <div class="channel-name">${channel.displayName}</div>
                                    <div class="channel-category">${channel.category}</div>
                                </div>
                            </div>
                            <div class="channel-description">${channel.description}</div>
                            <button class="watch-button" onclick="matchScheduler.playTVChannel('${channel.name}')">
                                ▶ Watch Live
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.scheduler.hideStats();
        this.scheduler.currentView = 'tv-channels';
    }

    playTVChannel(channelName) {
        const country = this.scheduler.currentCountry;
        const tvData = this.scheduler.dataFusion.getTVChannelsData();
        const channel = tvData[country].find(c => c.name === channelName);
        
        if (!channel) return;
        
        this.scheduler.currentTVChannel = channel;
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn">← Back to Channels</button>
                    </div>
                    
                    <div class="video-container">
                        <div class="video-player-wrapper">
                            <div class="video-player" id="video-player-tv">
                                <iframe src="${channel.streamUrl}" class="stream-iframe" id="stream-iframe-tv"
                                        allow="autoplay; fullscreen" allowfullscreen></iframe>
                            </div>
                        </div>
                        
                        <div class="video-controls">
                            <div class="video-title">${channel.displayName}</div>
                            <div class="video-stats">
                                <span class="views-count">Live TV Channel</span>
                                <span class="live-badge-details">LIVE NOW</span>
                                <span style="color: var(--text-muted);">• ${channel.country}</span>
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn" onclick="matchScheduler.showCountryChannels('${country}')">
                                    📺 More Channels
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    <strong>Channel Info:</strong> ${channel.displayName} from ${channel.country}. 
                                    ${channel.description} Live 24/7 broadcast.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.scheduler.hideStats();
        this.scheduler.currentView = 'tv-player';
    }

    getCountryFlag(country) {
        const flags = {
            'South Africa': '🇿🇦', 'USA': '🇺🇸', 'UK': '🇬🇧', 'Argentina': '🇦🇷',
            'Australia': '🇦🇺', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Canada': '🇨🇦',
            'France': '🇫🇷', 'Germany': '🇩🇪', 'India': '🇮🇳', 'Ireland': '🇮🇪',
            'Italy': '🇮🇹', 'Mexico': '🇲🇽', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿',
            'Pakistan': '🇵🇰', 'Poland': '🇵🇱', 'Portugal': '🇵🇹', 'Romania': '🇷🇴',
            'Serbia': '🇷🇸', 'Spain': '🇪🇸'
        };
        return flags[country] || '🌍';
    }

    // ==================== SPORTS NAVIGATION ====================
    async showSportsView() {
        console.log('🎯 Sports button clicked');
        
        this.showSportsLoadingUI();
        
        const safetyTimeout = setTimeout(() => {
            console.log('⚡ Safety timeout: Showing available data');
            this.showSportsDataUI();
        }, 3000);
        
        try {
            const success = await this.scheduler.ensureDataLoaded();
            clearTimeout(safetyTimeout);
            
            if (success) {
                this.showSportsDataUI();
            } else {
                this.showSportsDataUI();
            }
        } catch (error) {
            clearTimeout(safetyTimeout);
            this.showSportsDataUI();
        }
    }

    showSportsLoadingUI() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>select</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" style="opacity: 0.7; cursor: wait;">
                        <div class="sport-name">Loading Sports</div>
                    </div>
                </div>
            </div>
        `;
        
        this.scheduler.hideStats();
        this.scheduler.currentView = 'sports';
    }

    showSportsDataUI() {
        console.log('🔍 ALL VERIFIED MATCHES:', this.scheduler.verifiedMatches);
        
        if (!this.scheduler.verifiedMatches || this.scheduler.verifiedMatches.length === 0) {
            this.showSportsEmptyState();
            return;
        }
        
        const container = document.getElementById('dynamic-content');
        const uniqueSports = [...new Set(this.scheduler.verifiedMatches.map(match => match.sport))];
        
        const sports = uniqueSports.map(sportId => {
            return { id: sportId, name: sportId };
        }).filter(sport => sport.name).sort((a, b) => a.name.localeCompare(b.name));

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>select</p>
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
        
        this.scheduler.hideStats();
        this.scheduler.currentView = 'sports';
    }

    showSportsEmptyState() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>select</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="matchScheduler.retryLoadMatches()" style="cursor: pointer;">
                        <div class="sport-name">Retry Loading</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== MATCH NAVIGATION ====================
    async showDatesView() {
        await this.scheduler.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.scheduler.getMatchesBySport(this.scheduler.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.scheduler.currentSport;
        const today = new Date().toISOString().split('T')[0];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName}</h2>
                    <p>Select date</p>
                </div>
                <div class="sports-grid">
                    ${dates.map(date => {
                        const isToday = date === today;
                        return `
                            <div class="date-button" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-name">
                                    ${isToday ? '<span class="today-badge">Today</span>' : this.scheduler.formatDisplayDate(date)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.scheduler.hideStats();
        this.scheduler.currentView = 'dates';
    }

    async showMatchesView() {
        console.log('🔍 showMatchesView called with:', {
            sport: this.scheduler.currentSport,
            date: this.scheduler.currentDate,
            showLiveOnly: this.scheduler.showLiveOnly
        });
        
        await this.scheduler.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.scheduler.getMatchesBySportAndDate(this.scheduler.currentSport, this.scheduler.currentDate);
        const sportName = this.scheduler.currentSport;
        const today = new Date().toISOString().split('T')[0];
        const isToday = this.scheduler.currentDate === today;
        
        const allMatches = matches;
        const liveMatches = allMatches.filter(match => match.isLive === true);
        const displayMatches = this.scheduler.showLiveOnly ? liveMatches : allMatches;
        const scheduleHeader = `Today's ${sportName}`;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${scheduleHeader}</h2>
                    <p>${isToday ? '' : this.scheduler.formatDisplayDate(this.scheduler.currentDate)}</p>
                </div>
                
                <div class="matches-table-container">
                    <div class="professional-filter">
                        <button class="filter-btn ${this.scheduler.showLiveOnly ? '' : 'active'}" 
                                data-filter="all" onclick="matchScheduler.setFilter('all')">
                            All Matches
                        </button>
                        <button class="filter-btn ${this.scheduler.showLiveOnly ? 'active' : ''}" 
                                data-filter="live" onclick="matchScheduler.setFilter('live')">
                            Live Only
                        </button>
                    </div>
                    
                    <div class="matches-table">
                        <div class="table-header">
                            <div>Time</div>
                            <div>Match</div>
                            <div>Watch</div>
                        </div>
                        ${displayMatches.length > 0 ? 
                            displayMatches.map(match => this.renderMatchRow(match)).join('') :
                            this.renderEmptyState(this.scheduler.showLiveOnly)
                        }
                    </div>
                </div>
            </div>
        `;

        this.scheduler.hideStats();
        this.scheduler.currentView = 'matches';
    }

    renderMatchRow(match) {
        const isLive = match.isLive;
        const formattedTeams = this.scheduler.formatTeamNames(match.teams);
        
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

    renderEmptyState(isLiveFilter) {
        if (isLiveFilter) {
            return `
                <div class="no-matches">
                    <h3>No Live Matches Right Now</h3>
                    <p>Check back later for live games</p>
                    <button class="retry-btn" onclick="matchScheduler.setFilter('all')">
                        View All Matches
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="no-matches">
                    <h3>No Matches Scheduled</h3>
                    <p>Check other dates or sports categories</p>
                </div>
            `;
        }
    }

    // ==================== MATCH DETAILS ====================
    async showMatchDetails(matchId) {
        console.log('🎯 showMatchDetails called');
        this.scheduler.currentView = 'match-details';
        
        await this.scheduler.ensureDataLoaded();
        const match = this.scheduler.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const formattedTeams = this.scheduler.formatTeamNames(match.teams);
        const stats = this.scheduler.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const channels = match.channels || [];
        const currentChannelIndex = this.scheduler.currentStreams.get(matchId) || 0;
        let currentStreamUrl = channels[currentChannelIndex] || null;

        // If this is a Streamed API URL, get the actual stream URL
        if (currentStreamUrl && currentStreamUrl.includes('streamed.pk/api/stream')) {
            console.log('🔄 Detected Streamed API URL, fetching actual stream...');
            currentStreamUrl = await this.scheduler.getStreamUrlFromStreamed(currentStreamUrl);
        }
        
        const channelSelectorHTML = this.generateChannelSelector(channels, matchId);
        
        container.innerHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn">← Back</button>
                    </div>
                    
                    <div class="video-container">
                        <div class="video-player-controls">
                            <div class="control-buttons-right">
                                <button class="player-control-btn refresh" onclick="matchScheduler.refreshCurrentStream('${matchId}')">
                                    Refresh
                                </button>
                            </div>
                        </div>
                        
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
                                <span class="views-count">${this.scheduler.formatNumber(stats.views)} views</span>
                                ${match.isLive ? '<span class="live-badge-details">LIVE NOW</span>' : ''}
                                <span style="color: var(--text-muted);">• ${match.league}</span>
                                ${channels.length > 1 ? `<span style="color: var(--accent-gold);">• ${channels.length} sources</span>` : ''}
                                ${channelSelectorHTML}
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn like-btn" onclick="matchScheduler.handleLike('${matchId}')">
                                    👍 ${this.scheduler.formatNumber(stats.likes)}
                                </button>
                                <button class="action-btn dislike-btn" onclick="matchScheduler.handleDislike('${matchId}')">
                                    👎 ${this.scheduler.formatNumber(stats.dislikes)}
                                </button>
                                <button class="action-btn" onclick="matchScheduler.handleShare('${matchId}')">
                                    Share
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    <strong>Match Info:</strong> ${this.scheduler.getTeamName(match.teams, 0)} vs ${this.scheduler.getTeamName(match.teams, 1)} in ${match.league}. 
                                    ${match.isLive ? 'Live now!' : `Scheduled for ${match.time} on ${this.scheduler.formatDisplayDate(match.date)}.`}
                                    ${channels.length > 1 ? `Multiple streaming sources available.` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.scheduler.hideStats();
        this.scheduler.incrementViews(matchId);
    }

    generateChannelSelector(channels, matchId) {
        const currentChannelIndex = this.scheduler.currentStreams.get(matchId) || 0;
        
        if (channels.length === 0) return '';
        
        if (channels.length <= 4) {
            return `
                <div class="channel-buttons-inline">
                    ${channels.map((channel, index) => {
                        const sourceType = this.scheduler.detectSourceType(channel);
                        const personalityLabel = this.scheduler.generatePersonalityLabel(sourceType, index);
                        return `
                            <button class="channel-btn-inline ${index === currentChannelIndex ? 'active' : ''}" 
                                    onclick="matchScheduler.switchChannel('${matchId}', ${index})"
                                    style="border-left: 3px solid ${this.scheduler.getSourceColor(sourceType)}">
                                ${personalityLabel}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        return `
            <div class="channel-dropdown-inline">
                <button class="channel-dropdown-btn-inline" onclick="matchScheduler.toggleDropdown('${matchId}')">
                    Source ${currentChannelIndex + 1} of ${channels.length}
                </button>
                <div class="channel-dropdown-content-inline" id="dropdown-${matchId}">
                    ${channels.map((channel, index) => {
                        const sourceType = this.scheduler.detectSourceType(channel);
                        const personalityLabel = this.scheduler.generatePersonalityLabel(sourceType, index);
                        return `
                            <div class="channel-dropdown-item-inline ${index === currentChannelIndex ? 'active' : ''}" 
                                 onclick="matchScheduler.switchChannel('${matchId}', ${index})"
                                 style="border-left: 3px solid ${this.scheduler.getSourceColor(sourceType)}">
                                ${personalityLabel}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // ==================== MAIN MENU ====================
    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.remove('tv-section');
        
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" data-action="sports">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">Games & schedules</div>
                    </div>
                    <div class="menu-button tv-button" data-action="tv">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                    <div class="menu-button community" data-action="community">
                        <div class="button-title">COMMUNITY</div>
                        <div class="button-subtitle">Fan discussions</div>
                    </div>
                </div>
            </div>
        `;
        
        this.scheduler.showStats();
        this.scheduler.currentView = 'main';
    }

    showCommunity() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.remove('tv-section');
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Community</h2>
                    <p>Fan discussions</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Fan Zone</div>
                    </div>
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Match Reactions</div>
                    </div>
                </div>
            </div>
        `;
        this.scheduler.hideStats();
    }
}
