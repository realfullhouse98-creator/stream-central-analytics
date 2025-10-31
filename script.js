// 9kilo Stream - Simplified Bulletproof Version
class MatchScheduler {
    constructor() {
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.currentCountry = '';
        this.tvChannelsData = null;
        console.log('🚀 MatchScheduler initialized!');
    }
    
    async init() {
        try {
            // Wait for DOM to be fully ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }
            
            this.setupEventListeners();
            this.showMainMenu();
            await this.loadTVChannelsData();
            console.log('✅ 9kilos fully initialized!');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }

    // ==================== SIMPLE EVENT LISTENERS ====================
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Use event delegation for the entire document
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }

    handleClick(e) {
        const target = e.target;
        
        // Home button
        if (target.closest('.home-button')) {
            e.preventDefault();
            this.showMainMenu();
            return;
        }

        // Back button
        if (target.closest('.top-back-button') || target.closest('.back-btn')) {
            e.preventDefault();
            this.handleBackButton();
            return;
        }

        // Main menu buttons
        if (target.closest('.menu-button')) {
            e.preventDefault();
            const action = target.closest('.menu-button').getAttribute('data-action');
            this.handleMenuAction(action);
            return;
        }

        // Country cards
        if (target.closest('.country-card')) {
            e.preventDefault();
            const country = target.closest('.country-card').getAttribute('data-country');
            if (country) this.showCountryChannels(country);
            return;
        }

        // Watch buttons in TV channels
        if (target.closest('.watch-button')) {
            e.preventDefault();
            const channel = target.closest('.watch-button').getAttribute('data-channel');
            if (channel) this.playTVChannel(channel);
            return;
        }

        // Sport buttons
        if (target.closest('.sport-button') && !target.closest('.sport-button').hasAttribute('data-action')) {
            e.preventDefault();
            const sportName = target.closest('.sport-button').querySelector('.sport-name')?.textContent;
            if (sportName) this.selectSport(sportName);
            return;
        }

        // Date buttons
        if (target.closest('.date-button')) {
            e.preventDefault();
            const date = target.closest('.date-button').getAttribute('data-date');
            if (date) this.selectDate(date);
            return;
        }

        // Watch buttons in matches
        if (target.closest('.watch-btn')) {
            e.preventDefault();
            alert('Match streaming would open here');
            return;
        }

        // Filter toggle
        if (target.closest('.filter-toggle')) {
            e.preventDefault();
            this.toggleLiveFilter();
            return;
        }

        // Refresh buttons
        if (target.closest('.player-control-btn.refresh')) {
            e.preventDefault();
            alert('Stream would refresh here');
            return;
        }

        // TV action buttons
        if (target.closest('.tv-action-btn')) {
            e.preventDefault();
            alert('Action button clicked');
            return;
        }
    }

    handleMenuAction(action) {
        switch(action) {
            case 'sports':
                document.body.classList.remove('tv-page');
                this.showSportsView();
                break;
            case 'tv':
                this.showTVChannels();
                break;
            case 'community':
                document.body.classList.remove('tv-page');
                this.showCommunity();
                break;
        }
    }

    handleBackButton() {
        if (this.currentView === 'tv-player' || this.currentView === 'tv-channels') {
            document.body.classList.remove('tv-page');
        }

        switch(this.currentView) {
            case 'sports':
            case 'tv-countries':
                this.showMainMenu();
                break;
            case 'dates':
                this.showSportsView();
                break;
            case 'matches':
                this.showDatesView();
                break;
            case 'tv-channels':
                this.showCountriesView();
                break;
            case 'tv-player':
                this.showCountryChannels(this.currentCountry);
                break;
            case 'match-details':
                if (this.currentDate) {
                    this.showMatchesView();
                } else {
                    this.showMainMenu();
                }
                break;
            default:
                this.showMainMenu();
        }
    }

    // ==================== TV CHANNELS ====================
    async loadTVChannelsData() {
        try {
            // For now, use fallback data - you can replace with JSON file later
            this.tvChannelsData = {
                "South Africa": [
                    {
                        name: "SuperSportRugby",
                        displayName: "SuperSport Rugby",
                        country: "South Africa",
                        streamUrl: "https://topembed.pw/channel/SuperSportRugby%5BSouthAfrica%5D",
                        category: "Rugby",
                        description: "Live rugby matches, highlights, and analysis"
                    },
                    {
                        name: "SuperSportTennis",
                        displayName: "SuperSport Tennis", 
                        country: "South Africa",
                        streamUrl: "https://topembed.pw/channel/SuperSportTennis%5BSouthAfrica%5D",
                        category: "Tennis",
                        description: "Tennis tournaments and matches"
                    }
                ],
                "USA": [
                    {
                        name: "ESPN",
                        displayName: "ESPN",
                        country: "USA",
                        streamUrl: "https://topembed.pw/channel/ESPN%5BUSA%5D", 
                        category: "Multi-sport",
                        description: "Worldwide sports leader"
                    },
                    {
                        name: "FoxSports",
                        displayName: "Fox Sports",
                        country: "USA",
                        streamUrl: "https://topembed.pw/channel/FoxSports%5BUSA%5D",
                        category: "Multi-sport",
                        description: "National sports coverage"
                    }
                ],
                "UK": [
                    {
                        name: "SkySportsMain",
                        displayName: "Sky Sports Main Event",
                        country: "UK",
                        streamUrl: "https://topembed.pw/channel/SkySportsMain%5BUK%5D",
                        category: "Multi-sport",
                        description: "Premier sports coverage"
                    },
                    {
                        name: "BTSport1",
                        displayName: "BT Sport 1",
                        country: "UK",
                        streamUrl: "https://topembed.pw/channel/BTSport1%5BUK%5D",
                        category: "Multi-sport", 
                        description: "Live sports and events"
                    }
                ]
            };
            console.log('✅ TV Channels data loaded');
        } catch (error) {
            console.error('❌ Failed to load TV channels data:', error);
        }
    }

    showTVChannels() {
        console.log('🎯 TV Channels button clicked');
        document.body.classList.add('tv-page');
        this.showCountriesView();
    }

    showCountriesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const tvData = this.tvChannelsData || {};
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Country - select</h2>
                    <p>Choose your region</p>
                </div>
                
                <div class="countries-grid">
                    ${Object.entries(tvData).map(([country, channels]) => `
                        <div class="country-card" data-country="${country}">
                            <div class="country-flag">${this.getCountryFlag(country)}</div>
                            <div class="country-name">${country}</div>
                            <div class="channel-count">${channels.length} channels</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'tv-countries';
    }

    showCountryChannels(country) {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        this.currentCountry = country;
        const tvData = this.tvChannelsData || {};
        const channels = tvData[country] || [];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>Tv channels - browse</h2>
                    <p>${country} • ${channels.length} channels</p>
                </div>
                
                <div class="channels-grid">
                    ${channels.map(channel => `
                        <div class="channel-card">
                            <div class="channel-header">
                                <div class="channel-logo">${this.getChannelLogo(channel.name)}</div>
                                <div class="channel-info">
                                    <div class="channel-name">${channel.displayName}</div>
                                    <div class="channel-category">${channel.category}</div>
                                </div>
                            </div>
                            <div class="channel-description">${channel.description}</div>
                            <button class="watch-button" data-channel="${channel.name}">
                                ▶ Watch Live
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'tv-channels';
    }

    playTVChannel(channelName) {
        const country = this.currentCountry;
        const tvData = this.tvChannelsData || {};
        const channel = tvData[country]?.find(c => c.name === channelName);
        
        if (!channel) return;
        
        this.currentTVChannel = channel;
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="tv-player-overlay">
                <div class="tv-player-modal">
                    <div class="tv-player-header">
                        <button class="back-btn">← Back</button>
                        <div class="control-buttons-right">
                            <button class="player-control-btn refresh">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                    
                    <div class="tv-player-container">
                        <div class="tv-player-wrapper">
                            <div class="tv-video-player-enhanced">
                                <iframe src="${channel.streamUrl}" 
                                        class="tv-stream-iframe" 
                                        allow="autoplay; fullscreen" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                        </div>
                        
                        <div class="tv-player-controls">
                            <div class="tv-video-title">${channel.displayName}</div>
                            <div class="tv-video-stats">
                                <span class="tv-views-count">Live TV Channel</span>
                                <span style="color: var(--text-muted);">• ${channel.country}</span>
                            </div>
                            
                            <div class="tv-video-actions">
                                <button class="tv-action-btn like-btn">
                                    👍 Like
                                </button>
                                <button class="tv-action-btn share-btn">
                                    Share
                                </button>
                            </div>
                            
                            <div class="tv-channel-description">
                                <div class="tv-description-text">
                                    <strong>Channel Info:</strong> ${channel.description}. 
                                    Category: ${channel.category}. Broadcasting from ${channel.country}.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'tv-player';
    }

    getCountryFlag(country) {
        const flags = {
            'South Africa': '🇿🇦', 'USA': '🇺🇸', 'UK': '🇬🇧'
        };
        return flags[country] || '🌍';
    }

    getChannelLogo(channelName) {
        if (channelName.includes('SuperSport')) return 'SS';
        if (channelName.includes('ESPN')) return 'ES';
        if (channelName.includes('Fox')) return 'FX';
        if (channelName.includes('Sky')) return 'SK';
        if (channelName.includes('BT')) return 'BT';
        return 'TV';
    }

    // ==================== SPORTS FUNCTIONALITY ====================
    showSportsView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Categories</h2>
                    <p>Select your sport</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" data-sport="Football">
                        <div class="sport-name">Football</div>
                        <div class="match-count">12 matches</div>
                    </div>
                    <div class="sport-button" data-sport="Basketball">
                        <div class="sport-name">Basketball</div>
                        <div class="match-count">8 matches</div>
                    </div>
                    <div class="sport-button" data-sport="Tennis">
                        <div class="sport-name">Tennis</div>
                        <div class="match-count">6 matches</div>
                    </div>
                    <div class="sport-button" data-sport="Rugby">
                        <div class="sport-name">Rugby</div>
                        <div class="match-count">4 matches</div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
    }

    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }

    showDatesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        // Sample dates for demonstration
        const dates = [
            { date: '2024-12-20', matches: 5, live: 2 },
            { date: '2024-12-21', matches: 8, live: 3 },
            { date: '2024-12-22', matches: 6, live: 1 }
        ];
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${this.currentSport}</h2>
                    <p>Select date</p>
                </div>
                <div class="sports-grid">
                    ${dates.map(date => `
                        <div class="date-button" data-date="${date.date}">
                            <div class="date-name">${this.formatDisplayDate(date.date)}</div>
                            <div class="match-count">${date.matches} match${date.matches !== 1 ? 'es' : ''}${date.live > 0 ? ` • ${date.live} live` : ''}</div>
                        </div>
                    `).join('')}
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
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        // Sample matches for demonstration
        const matches = [
            { time: '14:00', teams: 'Team A vs Team B', league: 'Premier League', live: true },
            { time: '16:30', teams: 'Team C vs Team D', league: 'Championship', live: false },
            { time: '19:00', teams: 'Team E vs Team F', league: 'Cup Match', live: true }
        ];
        
        const filteredMatches = this.showLiveOnly ? matches.filter(match => match.live) : matches;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>Schedule</h2>
                    <p>${this.formatDisplayDate(this.currentDate)}</p>
                </div>
                
                <div class="matches-table-container">
                    <div class="table-filter">
                        <button class="filter-toggle ${this.showLiveOnly ? 'active' : ''}">
                            ${this.showLiveOnly ? 'LIVE' : 'ALL'}
                        </button>
                    </div>
                    <div class="matches-table">
                        <div class="table-header">
                            <div>Time</div>
                            <div>Match</div>
                            <div>Watch</div>
                        </div>
                        ${filteredMatches.length > 0 ? 
                            filteredMatches.map(match => `
                                <div class="match-row ${match.live ? 'live' : ''}">
                                    <div class="match-time">${match.time}</div>
                                    <div class="match-details">
                                        <div class="team-names">${match.teams}</div>
                                        <div class="league-name">${match.league}</div>
                                    </div>
                                    <div class="watch-action">
                                        <button class="watch-btn ${match.live ? 'live' : ''}">
                                            ${match.live ? 'LIVE' : 'WATCH'}
                                        </button>
                                    </div>
                                </div>
                            `).join('') :
                            '<div class="no-matches">No matches found</div>'
                        }
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'matches';
    }

    toggleLiveFilter() {
        this.showLiveOnly = !this.showLiveOnly;
        this.showMatchesView();
    }

    // ==================== COMMUNITY ====================
    showCommunity() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
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
                    <div class="sport-button" data-community="fan-zone">
                        <div class="sport-name">Fan Zone</div>
                    </div>
                    <div class="sport-button" data-community="reactions">
                        <div class="sport-name">Match Reactions</div>
                    </div>
                </div>
            </div>
        `;
        this.hideStats();
        this.currentView = 'community';
    }

    // ==================== MAIN MENU ====================
    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.remove('tv-page');
        
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
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: var(--text-muted); font-size: 0.8em;">
                        ⚡ Enhanced TV Channels & Sports
                    </p>
                </div>
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
    }

    // ==================== UTILITY METHODS ====================
    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    }

    showStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'grid';
    }

    hideStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'none';
    }
}

// Simple initialization - this will definitely work
console.log('🎯 Starting 9kilos app...');
window.matchScheduler = new MatchScheduler();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.matchScheduler.init();
    });
} else {
    window.matchScheduler.init();
}
