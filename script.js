// 9kilo Stream - Complete Version with TV Channels & Sports
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
        
        // TV Channels State
        this.currentCountry = '';
        this.currentTVChannel = null;
        this.tvChannelsData = null;
        this.currentTVSource = 0;
        
        // Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000;
        
        // Caching
        this.preloadedSports = null;
        this.lastDataUpdate = null;
        
        // Filter state
        this.showLiveOnly = false;
        
        // DOM ready state
        this.isDOMReady = false;
        
        // Service Worker
        this.registration = null;
        
        console.log('🚀 MatchScheduler initialized with TV Channels!');
    }
    
    async init() {
        await this.waitForDOMReady();
        this.setupGlobalErrorHandling();
        this.setupEventListeners();
        this.showMainMenu();
        await this.registerServiceWorker();
        await this.loadTVChannelsData();
        this.backgroundPreload();
    }

    // ==================== SERVICE WORKER & BACKGROUND SYNC ====================
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered');
                
                // Check for updates every 10 minutes
                setInterval(() => this.checkForUpdates(), 10 * 60 * 1000);
                
                // Listen for updates
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'UPDATE_AVAILABLE') {
                        this.showUpdateNotification();
                    }
                });
                
            } catch (error) {
                console.log('❌ SW registration failed:', error);
            }
        }
    }

    async checkForUpdates() {
        if (this.registration) {
            try {
                await this.registration.update();
                console.log('🔄 Background update check completed');
            } catch (error) {
                console.log('Background update check failed:', error);
            }
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            🎉 New content available! 
            <button onclick="matchScheduler.refreshContent()" style="margin-left: 10px; background: black; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                Refresh
            </button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    refreshContent() {
        localStorage.removeItem(this.cacheKey);
        location.reload();
    }

    // ==================== TV CHANNELS DATA ====================
    async loadTVChannelsData() {
        try {
            const response = await fetch('tv-channels.json');
            this.tvChannelsData = await response.json();
            console.log('✅ TV Channels data loaded:', Object.keys(this.tvChannelsData).length, 'countries');
        } catch (error) {
            console.error('❌ Failed to load TV channels data:', error);
            this.tvChannelsData = this.getFallbackTVData();
        }
    }

    getFallbackTVData() {
        return {
            "South Africa": [
                {
                    name: "SuperSportRugby",
                    displayName: "SuperSport Rugby",
                    country: "South Africa",
                    streamUrl: "https://topembed.pw/channel/SuperSportRugby%5BSouthAfrica%5D",
                    category: "Rugby",
                    description: "Live rugby matches, highlights, and analysis"
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
                }
            ]
        };
    }

    getTVChannelsData() {
        return this.tvChannelsData || {};
    }

    // ==================== TV CHANNELS NAVIGATION ====================
    showTVChannels() {
        console.log('🎯 TV Channels button clicked');
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        // Add TV page class to hide main header
        document.body.classList.add('tv-page');
        this.showCountriesView();
    }

    showCountriesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const tvData = this.getTVChannelsData();
        
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
                        <div class="country-card" onclick="matchScheduler.showCountryChannels('${country}')">
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
        const tvData = this.getTVChannelsData();
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
                            <button class="watch-button" onclick="matchScheduler.playTVChannel('${channel.name}')">
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
        const tvData = this.getTVChannelsData();
        const channel = tvData[country].find(c => c.name === channelName);
        
        if (!channel) return;
        
        this.currentTVChannel = channel;
        this.currentTVSource = 0;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        // Check if channel has multiple sources (using existing sports logic)
        const sources = this.getChannelSources(channel);
        const hasMultipleSources = sources.length > 1;
        
        container.innerHTML = `
            <div class="tv-player-overlay">
                <div class="tv-player-modal">
                    <div class="tv-player-header">
                        <button class="back-btn">← Back</button>
                        <div class="control-buttons-right">
                            ${hasMultipleSources ? `
                                <div class="channel-dropdown-inline">
                                    <button class="channel-dropdown-btn-inline">
                                        Sources <span class="source-counter">${sources.length}</span> ▼
                                    </button>
                                    <div class="channel-dropdown-content-inline">
                                        ${sources.map((source, index) => `
                                            <div class="channel-dropdown-item-inline ${index === this.currentTVSource ? 'active' : ''}" 
                                                 onclick="matchScheduler.switchTVSource(${index})">
                                                Source ${index + 1}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <button class="player-control-btn refresh" onclick="matchScheduler.refreshTVStream()">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                    
                    <div class="tv-player-container">
                        <div class="tv-player-wrapper">
                            <div class="tv-video-player-enhanced">
                                <iframe src="${sources[this.currentTVSource]}" 
                                        class="tv-stream-iframe" 
                                        id="tv-stream-iframe"
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
                                ${hasMultipleSources ? `<span class="source-counter">${sources.length} sources</span>` : ''}
                            </div>
                            
                            <div class="tv-video-actions">
                                <button class="tv-action-btn" onclick="matchScheduler.handleTVLike('${channel.name}')">
                                    👍 Like
                                </button>
                                <button class="tv-action-btn" onclick="matchScheduler.handleTVShare('${channel.name}')">
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
        
        // Setup dropdown toggle
        this.setupDropdowns();
    }

    getChannelSources(channel) {
        // For TV channels, we might have multiple stream URLs in future
        // Currently using single URL, but structure supports multiples
        return [channel.streamUrl];
    }

    switchTVSource(sourceIndex) {
        this.currentTVSource = sourceIndex;
        const iframe = document.getElementById('tv-stream-iframe');
        const channel = this.currentTVChannel;
        const sources = this.getChannelSources(channel);
        
        if (iframe && sources[sourceIndex]) {
            iframe.src = sources[sourceIndex];
        }
        
        // Update active source in dropdown
        document.querySelectorAll('.channel-dropdown-item-inline').forEach((item, index) => {
            item.classList.toggle('active', index === sourceIndex);
        });
        
        // Close dropdown
        const dropdown = document.querySelector('.channel-dropdown-content-inline');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    setupDropdowns() {
        document.addEventListener('click', (e) => {
            const dropdownBtn = e.target.closest('.channel-dropdown-btn-inline');
            if (dropdownBtn) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = dropdownBtn.nextElementSibling;
                const isOpen = dropdown.classList.contains('show');
                
                // Close all dropdowns
                document.querySelectorAll('.channel-dropdown-content-inline').forEach(d => {
                    d.classList.remove('show');
                    d.previousElementSibling.classList.remove('open');
                });
                
                // Toggle current dropdown
                if (!isOpen) {
                    dropdown.classList.add('show');
                    dropdownBtn.classList.add('open');
                }
            }
        });
    }

    refreshTVStream() {
        const iframe = document.getElementById('tv-stream-iframe');
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

    handleTVLike(channelName) {
        alert(`Thanks for liking ${channelName}!`);
    }

    handleTVShare(channelName) {
        alert(`Share ${channelName} feature coming soon!`);
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

    getChannelLogo(channelName) {
        if (channelName.includes('SuperSport')) return 'SS';
        if (channelName.includes('FanDuel')) return 'FD';
        if (channelName.includes('ESPN')) return 'ES';
        if (channelName.includes('Fox')) return 'FX';
        if (channelName.includes('Sky')) return 'SK';
        if (channelName.includes('BT')) return 'BT';
        if (channelName.includes('Premier')) return 'PL';
        if (channelName.includes('NBA')) return 'NB';
        if (channelName.includes('Eleven')) return '11';
        if (channelName.includes('SporTV')) return 'ST';
        if (channelName.includes('RTE')) return 'RT';
        if (channelName.includes('DAZN')) return 'DZ';
        if (channelName.includes('beIN')) return 'bN';
        if (channelName.includes('Eurosport')) return 'EU';
        return 'TV';
    }

    // ==================== EVENT LISTENERS ====================
    waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.isDOMReady = true;
                    console.log('✅ DOM fully loaded and parsed');
                    resolve();
                });
            } else {
                this.isDOMReady = true;
                console.log('✅ DOM already ready');
                resolve();
            }
        });
    }

    setupEventListeners() {
        if (!this.isDOMReady) {
            setTimeout(() => this.setupEventListeners(), 100);
            return;
        }

        console.log('🎯 Setting up event listeners...');
        
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        console.log('✅ Event listeners setup complete');
    }

    handleGlobalClick(e) {
        // Remove TV page class when going home
        const homeButton = e.target.closest('.home-button');
        if (homeButton) {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.remove('tv-page');
            this.showMainMenu();
            return;
        }

        // Menu buttons
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = menuButton.getAttribute('data-action');
            console.log(`🎯 Menu button: ${action}`);
            
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
            return;
        }

        // Navigation buttons
        const backButton = e.target.closest('.top-back-button');
        if (backButton) {
            e.preventDefault();
            e.stopPropagation();
            this.handleBackButton();
            return;
        }

        // Back buttons (both match and TV)
        const matchBackBtn = e.target.closest('.back-btn');
        if (matchBackBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.handleBackButton();
            return;
        }

        // Sports navigation
        const sportButton = e.target.closest('.sport-button');
        if (sportButton && !sportButton.hasAttribute('data-action')) {
            e.preventDefault();
            e.stopPropagation();
            const sportName = sportButton.querySelector('.sport-name')?.textContent;
            if (sportName) {
                this.selectSport(sportName);
            }
            return;
        }

        const dateButton = e.target.closest('.date-button');
        if (dateButton) {
            e.preventDefault();
            e.stopPropagation();
            const dateElement = dateButton.querySelector('.date-name');
            if (dateElement) {
                const dateText = dateElement.textContent;
                const matches = this.verifiedMatches;
                const match = matches.find(m => this.formatDisplayDate(m.date) === dateText);
                if (match) {
                    this.selectDate(match.date);
                }
            }
            return;
        }

        const watchButton = e.target.closest('.watch-btn');
        if (watchButton) {
            e.preventDefault();
            e.stopPropagation();
            const matchRow = watchButton.closest('.match-row');
            if (matchRow) {
                const teamNames = matchRow.querySelector('.team-names')?.textContent;
                if (teamNames) {
                    const match = this.verifiedMatches.find(m => 
                        this.formatTeamNames(m.teams) === teamNames
                    );
                    if (match) {
                        this.showMatchDetails(match.id);
                    }
                }
            }
            return;
        }

        const filterToggle = e.target.closest('.filter-toggle');
        if (filterToggle) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleLiveFilter();
            return;
        }
    }

    handleBackButton() {
        // Remove TV page class if going back from TV
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

    // ... (REST OF THE METHODS REMAIN THE SAME AS BEFORE - Sports functionality, caching, etc.)
    // [Include all the previous sports methods, caching, analytics, etc. here]
    // They remain unchanged from your original code

    setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error caught:', e);
            this.showErrorUI('Something went wrong. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e);
            this.showErrorUI('Application error occurred.');
        });
    }

    showErrorUI(message) {
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = message;
            errorBoundary.style.display = 'block';
        }
    }

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        // Ensure TV page class is removed
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
                        ⚡ Now with enhanced TV Channels!
                    </p>
                </div>
            </div>
        `;
        
        this.showStats();
        this.currentView = 'main';
    }

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
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Fan Zone</div>
                    </div>
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Match Reactions</div>
                    </div>
                </div>
            </div>
        `;
        this.hideStats();
    }

    // ... (Include all other existing methods exactly as they were)

}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM fully loaded, initializing MatchScheduler with enhanced TV Channels...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos with enhanced TV Channels fully initialized!');
        }).catch(error => {
            console.error('❌ Initialization failed:', error);
        });
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
    }
});
