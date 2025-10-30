// 9kilo Stream - Complete Version with TV Channels
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
        
        console.log('🚀 MatchScheduler initialized with TV Channels!');
    }
    
    async init() {
        await this.waitForDOMReady();
        this.setupGlobalErrorHandling();
        this.setupEventListeners();
        this.showMainMenu();
        this.registerServiceWorker();
        
        // Start preloading in background
        this.backgroundPreload();
    }

    // ==================== TV CHANNELS DATA ====================
    getTVChannelsData() {
        return {
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
                },
                {
                    name: "SuperSportSoccer",
                    displayName: "SuperSport Soccer",
                    country: "South Africa", 
                    streamUrl: "https://topembed.pw/channel/SuperSportSoccer%5BSouthAfrica%5D",
                    category: "Football",
                    description: "Football matches and leagues"
                },
                {
                    name: "SuperSportCricket",
                    displayName: "SuperSport Cricket",
                    country: "South Africa",
                    streamUrl: "https://topembed.pw/channel/SuperSportCricket%5BSouthAfrica%5D",
                    category: "Cricket", 
                    description: "Cricket matches and tournaments"
                },
                {
                    name: "SuperSportAction",
                    displayName: "SuperSport Action",
                    country: "South Africa",
                    streamUrl: "https://topembed.pw/channel/SuperSportAction%5BSouthAfrica%5D",
                    category: "Multi-sport",
                    description: "24/7 sports action and events"
                },
                {
                    name: "SuperSportVariety1",
                    displayName: "SuperSport Variety 1",
                    country: "South Africa",
                    streamUrl: "https://topembed.pw/channel/SuperSportVariety1%5BSouthAfrica%5D",
                    category: "Multi-sport",
                    description: "Variety sports programming"
                }
            ],
            "USA": [
                {
                    name: "FanDuelSportsMidwest",
                    displayName: "FanDuel Sports Midwest",
                    country: "USA",
                    streamUrl: "https://topembed.pw/channel/FanDuelSportsMidwest%5BUSA%5D",
                    category: "Multi-sport",
                    description: "Regional sports coverage"
                },
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
                },
                {
                    name: "NBASports",
                    displayName: "NBA TV",
                    country: "USA",
                    streamUrl: "https://topembed.pw/channel/NBASports%5BUSA%5D",
                    category: "Basketball",
                    description: "Basketball games and analysis"
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
                },
                {
                    name: "PremierSports",
                    displayName: "Premier Sports",
                    country: "UK",
                    streamUrl: "https://topembed.pw/channel/PremierSports%5BUK%5D",
                    category: "Football",
                    description: "Premier League and football"
                }
            ]
        };
    }

    // ==================== TV CHANNELS NAVIGATION ====================
    showTVChannels() {
        console.log('🎯 TV Channels button clicked');
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
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
                    <h2>📺 TV Channels</h2>
                    <p>Select a country to browse channels</p>
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
                    <h2>${this.getCountryFlag(country)} ${country}</h2>
                    <p>${channels.length} channels available</p>
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
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                
                <div class="section-header">
                    <h2>${channel.displayName}</h2>
                    <p>Live TV Channel from ${channel.country}</p>
                </div>
                
                <div class="tv-player-container">
                    <div class="tv-video-player">
                        <iframe id="tv-player" title="${channel.name}[${channel.country}]" 
                                frameborder="0" allowfullscreen 
                                allow="encrypted-media; picture-in-picture;"
                                src="${channel.streamUrl}">
                        </iframe>
                    </div>
                </div>
                
                <div class="tv-channel-info">
                    <div class="tv-info-item"><strong>Channel:</strong> ${channel.name}</div>
                    <div class="tv-info-item"><strong>Country:</strong> ${channel.country}</div>
                    <div class="tv-info-item"><strong>Live Now:</strong> ${channel.name}</div>
                    <div class="tv-info-item"><strong>Category:</strong> ${channel.category}</div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="watch-button" onclick="matchScheduler.refreshTVStream()" style="margin: 5px;">
                        🔄 Refresh Stream
                    </button>
                    <button class="watch-button" onclick="matchScheduler.showCountryChannels('${country}')" style="background: var(--accent-blue); margin: 5px;">
                        ← Back to Channels
                    </button>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'tv-player';
    }

    refreshTVStream() {
        const iframe = document.getElementById('tv-player');
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
            }, 500);
        }
    }

    getCountryFlag(country) {
        const flags = {
            'South Africa': '🇿🇦',
            'USA': '🇺🇸',
            'UK': '🇬🇧'
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
        
        // Global click handler
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        console.log('✅ Event listeners setup complete');
    }

    handleGlobalClick(e) {
        // Menu buttons
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = menuButton.getAttribute('data-action');
            console.log(`🎯 Menu button: ${action}`);
            
            switch(action) {
                case 'sports':
                    this.showSportsView();
                    break;
                case 'tv':
                    this.showTVChannels();
                    break;
                case 'community':
                    this.showCommunity();
                    break;
            }
            return;
        }

        // Navigation buttons
        const homeButton = e.target.closest('.home-button');
        if (homeButton) {
            e.preventDefault();
            e.stopPropagation();
            this.showMainMenu();
            return;
        }

        const backButton = e.target.closest('.top-back-button');
        if (backButton) {
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
            default:
                this.showMainMenu();
        }
    }

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

    // ==================== EXISTING SPORTS FUNCTIONALITY ====================
    // ... (All your existing sports methods remain exactly the same)
    // showMainMenu(), showSportsView(), loadSportsDataBackground(), 
    // showSportsUIWithCachedData(), ensureDataLoaded(), loadMatches(),
    // organizeMatches(), classifySport(), showDatesView(), showMatchesView(),
    // showMatchDetails(), and all utility methods...

    // [Include all your existing sports methods here - they remain unchanged]
    // I'm omitting them for brevity, but they should be copied from your previous working version

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
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
                        ⚡ Now with TV Channels! Click to explore
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

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    backgroundPreload() {
        setTimeout(() => {
            this.preloadSportsData().catch(() => {});
        }, 1000);
    }

    async preloadSportsData() {
        if (this.isDataLoaded || this.isLoading) return;
        this.isLoading = true;
        try {
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.extractAndCacheSports(cachedData);
                return;
            }
            const fastData = await this.tryFastProxies();
            if (fastData) {
                this.extractAndCacheSports(fastData);
                this.cacheData(fastData);
            }
        } catch (error) {
            // Silent fail
        } finally {
            this.isLoading = false;
        }
    }

    showStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'grid';
    }

    hideStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'none';
    }

    // [Include all other existing methods...]
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM fully loaded, initializing MatchScheduler with TV Channels...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos with TV Channels fully initialized!');
        }).catch(error => {
            console.error('❌ Initialization failed:', error);
        });
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.channel-dropdown-inline')) {
        document.querySelectorAll('.channel-dropdown-content-inline.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            dropdown.previousElementSibling.classList.remove('open');
        });
    }
});
