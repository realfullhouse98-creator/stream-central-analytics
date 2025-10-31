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
        
        console.log('🚀 MatchScheduler initialized with TV Channels!');
    }
    
    async init() {
        try {
            await this.waitForDOMReady();
            this.setupGlobalErrorHandling();
            this.setupEventListeners();
            this.showMainMenu();
            await this.loadTVChannelsData();
            this.backgroundPreload();
            console.log('✅ 9kilos fully initialized!');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showErrorUI('Failed to initialize app. Please refresh the page.');
        }
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
        
        // Add event listeners to country cards
        setTimeout(() => {
            document.querySelectorAll('.country-card').forEach(card => {
                card.addEventListener('click', () => {
                    const country = card.getAttribute('data-country');
                    this.showCountryChannels(country);
                });
            });
        }, 100);
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
                        <div class="channel-card" data-channel="${channel.name}">
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
        
        // Add event listeners to watch buttons
        setTimeout(() => {
            document.querySelectorAll('.watch-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const channelName = button.getAttribute('data-channel');
                    this.playTVChannel(channelName);
                });
            });
        }, 100);
    }

    playTVChannel(channelName) {
        const country = this.currentCountry;
        const tvData = this.getTVChannelsData();
        const channel = tvData[country]?.find(c => c.name === channelName);
        
        if (!channel) {
            console.error('Channel not found:', channelName);
            return;
        }
        
        this.currentTVChannel = channel;
        this.currentTVSource = 0;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
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
                                                 data-source="${index}">
                                                Source ${index + 1}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <button class="player-control-btn refresh">
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
        
        // Setup event listeners for TV player
        setTimeout(() => {
            // Back button
            const backBtn = document.querySelector('.back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.handleBackButton();
                });
            }
            
            // Refresh button
            const refreshBtn = document.querySelector('.player-control-btn.refresh');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.refreshTVStream();
                });
            }
            
            // Source dropdown
            this.setupTVSourceDropdown();
            
            // Action buttons
            const likeBtn = document.querySelector('.like-btn');
            if (likeBtn) {
                likeBtn.addEventListener('click', () => {
                    this.handleTVLike(channel.name);
                });
            }
            
            const shareBtn = document.querySelector('.share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    this.handleTVShare(channel.name);
                });
            }
        }, 100);
    }

    getChannelSources(channel) {
        return [channel.streamUrl];
    }

    setupTVSourceDropdown() {
        const dropdownBtn = document.querySelector('.channel-dropdown-btn-inline');
        const dropdownContent = document.querySelector('.channel-dropdown-content-inline');
        
        if (dropdownBtn && dropdownContent) {
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdownContent.classList.contains('show');
                
                // Close all dropdowns
                document.querySelectorAll('.channel-dropdown-content-inline').forEach(d => {
                    d.classList.remove('show');
                    d.previousElementSibling.classList.remove('open');
                });
                
                // Toggle current dropdown
                if (!isOpen) {
                    dropdownContent.classList.add('show');
                    dropdownBtn.classList.add('open');
                }
            });
            
            // Source items
            dropdownContent.querySelectorAll('.channel-dropdown-item-inline').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const sourceIndex = parseInt(item.getAttribute('data-source'));
                    this.switchTVSource(sourceIndex);
                });
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (dropdownContent) {
                dropdownContent.classList.remove('show');
                if (dropdownBtn) dropdownBtn.classList.remove('open');
            }
        });
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
    }

    refreshTVStream() {
        const iframe = document.getElementById('tv-stream-iframe');
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
                
                const refreshBtn = document.querySelector('.player-control-btn.refresh');
                if (refreshBtn) {
                    const originalText = refreshBtn.innerHTML;
                    refreshBtn.innerHTML = 'Refreshing...';
                    setTimeout(() => {
                        refreshBtn.innerHTML = originalText;
                    }, 1000);
                }
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
        
        // Use event delegation for dynamic content
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        console.log('✅ Event listeners setup complete');
    }

    handleGlobalClick(e) {
        // Home button
        if (e.target.closest('.home-button')) {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.remove('tv-page');
            this.showMainMenu();
            return;
        }

        // Top back button
        if (e.target.closest('.top-back-button')) {
            e.preventDefault();
            e.stopPropagation();
            this.handleBackButton();
            return;
        }

        // Main menu buttons
        const menuButton = e.target.closest('.menu-button');
        if (menuButton) {
            e.preventDefault();
            e.stopPropagation();
            const action = menuButton.getAttribute('data-action');
            this.handleMenuAction(action);
            return;
        }

        // Sports buttons
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

        // Date buttons
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

        // Watch buttons in matches table
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

        // Filter toggle
        const filterToggle = e.target.closest('.filter-toggle');
        if (filterToggle) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleLiveFilter();
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

    // ==================== SPORTS FUNCTIONALITY ====================
    showSportsView() {
        console.log('🎯 Sports view loading...');
        this.showSportsUIWithCachedData();
        this.loadSportsDataBackground();
    }

    showSportsUIWithCachedData() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        let sportsHTML;
        
        if (this.preloadedSports && this.preloadedSports.length > 0) {
            sportsHTML = this.preloadedSports.map(sport => `
                <div class="sport-button" data-sport="${sport}">
                    <div class="sport-name">${sport}</div>
                    <div class="match-count">Loading...</div>
                </div>
            `).join('');
        } else {
            sportsHTML = `
                <div class="sport-button" data-sport="Football" style="opacity: 0.7;">
                    <div class="sport-name">Football</div>
                    <div class="match-count">Loading...</div>
                </div>
                <div class="sport-button" data-sport="Basketball" style="opacity: 0.7;">
                    <div class="sport-name">Basketball</div>
                    <div class="match-count">Loading...</div>
                </div>
                <div class="sport-button" data-sport="Tennis" style="opacity: 0.7;">
                    <div class="sport-name">Tennis</div>
                    <div class="match-count">Loading...</div>
                </div>
            `;
        }
        
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
                    ${sportsHTML}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'sports';
        
        // Add event listeners to sport buttons
        setTimeout(() => {
            document.querySelectorAll('.sport-button[data-sport]').forEach(button => {
                button.addEventListener('click', () => {
                    const sport = button.getAttribute('data-sport');
                    this.selectSport(sport);
                });
            });
        }, 100);
    }

    async loadSportsDataBackground() {
        try {
            const success = await this.ensureDataLoaded();
            if (success && this.currentView === 'sports') {
                this.showSportsDataUI();
            }
        } catch (error) {
            console.log('Background data loading failed');
        }
    }

    showSportsDataUI() {
        if (!this.verifiedMatches || this.verifiedMatches.length === 0) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container || this.currentView !== 'sports') return;
        
        const uniqueSports = [...new Set(this.verifiedMatches.map(match => match.sport))];
        const sports = uniqueSports.map(sportId => {
            const count = this.getMatchesBySport(sportId).length;
            return { id: sportId, name: sportId, count: count };
        }).filter(sport => sport.count > 0).sort((a, b) => b.count - a.count);

        const sportsHTML = sports.map(sport => `
            <div class="sport-button" data-sport="${sport.id}">
                <div class="sport-name">${sport.name}</div>
                <div class="match-count">${sport.count} match${sport.count !== 1 ? 'es' : ''}</div>
            </div>
        `).join('');

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
                    ${sportsHTML}
                </div>
            </div>
        `;
        
        // Re-add event listeners
        setTimeout(() => {
            document.querySelectorAll('.sport-button[data-sport]').forEach(button => {
                button.addEventListener('click', () => {
                    const sport = button.getAttribute('data-sport');
                    this.selectSport(sport);
                });
            });
        }, 100);
    }

    async ensureDataLoaded() {
        if (this.isDataLoaded) return true;
        
        if (this.isLoading) {
            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.isDataLoaded) {
                        clearInterval(checkInterval);
                        resolve(true);
                    }
                }, 100);
            });
        }
        
        this.isLoading = true;
        try {
            await this.loadMatches();
            this.isDataLoaded = true;
            return true;
        } catch (error) {
            console.error('Data loading failed:', error);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    async loadMatches() {
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('📦 Using cached data');
            this.organizeMatches(cachedData);
            return;
        }
        
        try {
            const apiData = await this.tryAllProxies();
            this.organizeMatches(apiData);
            this.cacheData(apiData);
        } catch (error) {
            console.warn('All API attempts failed:', error);
            this.useFallbackData();
        }
    }

    getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > this.cacheTimeout;
            
            return isExpired ? null : data;
        } catch (error) {
            return null;
        }
    }

    cacheData(data) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Caching failed:', error);
        }
    }

    async tryAllProxies() {
        const targetUrl = 'https://topembed.pw/api.php?format=json';
        
        const proxyOptions = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];
        
        for (const proxyUrl of proxyOptions) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                
                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn(`Proxy failed: ${proxyUrl}`, error);
                continue;
            }
        }
        
        throw new Error('All proxy attempts failed');
    }

    useFallbackData() {
        const now = Math.floor(Date.now() / 1000);
        const sampleMatches = {
            events: {
                '2024-12-20': [
                    {
                        match: 'Research Team A - Research Team B',
                        tournament: '9kilos Demo League',
                        sport: 'Football',
                        unix_timestamp: now + 3600,
                        channels: ['https://example.com/stream1', 'https://example.com/stream2']
                    },
                    {
                        match: 'Demo United - Test City FC',
                        tournament: 'Research Championship',
                        sport: 'Football', 
                        unix_timestamp: now - 1800,
                        channels: ['https://example.com/stream1']
                    }
                ]
            }
        };
        this.organizeMatches(sampleMatches);
    }

    organizeMatches(apiData) {
        if (!apiData || typeof apiData !== 'object' || !apiData.events) {
            this.useFallbackData();
            return;
        }
        
        this.extractAndCacheSports(apiData);
        
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
                            league: match.tournament || 'Sports',
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
        
        if (this.verifiedMatches.length === 0) {
            this.useFallbackData();
            return;
        }
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
        
        const sportsCount = {};
        this.verifiedMatches.forEach(match => {
            sportsCount[match.sport] = (sportsCount[match.sport] || 0) + 1;
        });
        console.log('🏆 Sports Classification:', sportsCount);
        
        if (this.currentView !== 'main') {
            this.refreshCurrentView();
        }
    }

    refreshCurrentView() {
        switch(this.currentView) {
            case 'sports':
                this.showSportsView();
                break;
            case 'dates':
                this.showDatesView();
                break;
            case 'matches':
                this.showMatchesView();
                break;
        }
    }

    extractAndCacheSports(apiData) {
        if (!apiData?.events) return;
        
        const sports = new Set();
        Object.values(apiData.events).forEach(matches => {
            matches.forEach(match => {
                if (match?.sport) {
                    const sport = this.classifySport(match);
                    sports.add(sport);
                }
            });
        });
        
        this.preloadedSports = Array.from(sports);
        
        if (this.currentView === 'sports' && this.preloadedSports.length > 0) {
            this.showSportsDataUI();
        }
    }

    classifySport(match) {
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        if (searchString.includes('middle tennessee') || 
            searchString.includes('jacksonville state') ||
            searchString.includes('college football')) {
            return 'American Football';
        }
        
        const sportFromApi = match.sport || 'Other';
        const normalizedSport = this.normalizeSportName(sportFromApi);
        
        return normalizedSport;
    }

    normalizeSportName(sport) {
        if (!sport) return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        const sportMap = {
            'football': 'Football',
            'soccer': 'Football',
            'basketball': 'Basketball',
            'baseball': 'Baseball',
            'hockey': 'Ice Hockey',
            'ice hockey': 'Ice Hockey',
            'tennis': 'Tennis',
            'cricket': 'Cricket',
            'rugby': 'Rugby',
            'golf': 'Golf',
            'boxing': 'Boxing',
            'mma': 'MMA',
            'ufc': 'MMA',
            'formula 1': 'Racing',
            'f1': 'Racing',
            'nascar': 'Racing',
            'motogp': 'Racing',
            'volleyball': 'Volleyball',
            'australian football': 'Australian Football',
            'afl': 'Australian Football',
            'badminton': 'Badminton',
            'american football': 'American Football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            'nfl': 'American Football',
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'beach volleyball': 'Beach Volleyball'
        };
        
        return sportMap[sportLower] || sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
    }

    async showDatesView() {
        await this.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.currentSport;
        
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
                        const dateMatches = matches.filter(m => m.date === date);
                        const liveCount = dateMatches.filter(m => m.isLive).length;
                        return `
                            <div class="date-button" data-date="${date}">
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
        
        // Add event listeners to date buttons
        setTimeout(() => {
            document.querySelectorAll('.date-button').forEach(button => {
                button.addEventListener('click', () => {
                    const date = button.getAttribute('data-date');
                    this.selectDate(date);
                });
            });
        }, 100);
    }

    async showMatchesView() {
        await this.ensureDataLoaded();
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.currentSport;
        const displayDate = this.formatDisplayDate(this.currentDate);
        
        const filteredMatches = this.showLiveOnly ? matches.filter(match => match.isLive) : matches;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>Schedule</h2>
                    <p>${displayDate}</p>
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
                            filteredMatches.map(match => this.renderMatchRow(match)).join('') :
                            '<div class="no-matches">No matches found</div>'
                        }
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'matches';
        
        // Add event listeners
        setTimeout(() => {
            // Filter toggle
            const filterToggle = document.querySelector('.filter-toggle');
            if (filterToggle) {
                filterToggle.addEventListener('click', () => {
                    this.toggleLiveFilter();
                });
            }
            
            // Watch buttons
            document.querySelectorAll('.watch-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const matchRow = button.closest('.match-row');
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
                });
            });
        }, 100);
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
                        `<button class="watch-btn ${isLive ? 'live' : ''}">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span style="color: var(--text-muted); font-size: 0.8em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }

    toggleLiveFilter() {
        this.showLiveOnly = !this.showLiveOnly;
        this.showMatchesView();
    }

    async showMatchDetails(matchId) {
        await this.ensureDataLoaded();
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const formattedTeams = this.formatTeamNames(match.teams);
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
        const channels = match.channels || [];
        const currentChannelIndex = this.currentStreams.get(matchId) || 0;
        const currentStreamUrl = channels[currentChannelIndex] || null;
        
        container.innerHTML = `
            <div class="match-details-overlay">
                <div class="match-details-modal">
                    <div class="match-header">
                        <button class="back-btn">← Back</button>
                    </div>
                    
                    <div class="video-container">
                        <div class="video-player-controls">
                            <div class="control-buttons-right">
                                <button class="player-control-btn refresh">
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
                                <span class="views-count">${this.formatNumber(stats.views)} views</span>
                                ${match.isLive ? '<span class="live-badge-details">LIVE NOW</span>' : ''}
                                <span style="color: var(--text-muted);">• ${match.league}</span>
                            </div>
                            
                            <div class="video-actions">
                                <button class="action-btn like-btn">
                                    👍 ${this.formatNumber(stats.likes)}
                                </button>
                                <button class="action-btn dislike-btn">
                                    👎 ${this.formatNumber(stats.dislikes)}
                                </button>
                                <button class="action-btn share-btn">
                                    Share
                                </button>
                            </div>
                            
                            <div class="match-description">
                                <div class="description-text">
                                    <strong>Match Info:</strong> ${this.getTeamName(match.teams, 0)} vs ${this.getTeamName(match.teams, 1)} in ${match.league}. 
                                    ${match.isLive ? 'Live now!' : `Scheduled for ${match.time} on ${this.formatDisplayDate(match.date)}.`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.currentView = 'match-details';
        this.incrementViews(matchId);
        
        // Add event listeners for match details
        setTimeout(() => {
            // Back button
            const backBtn = document.querySelector('.back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.handleBackButton();
                });
            }
            
            // Refresh button
            const refreshBtn = document.querySelector('.player-control-btn.refresh');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.refreshCurrentStream(matchId);
                });
            }
            
            // Action buttons
            const likeBtn = document.querySelector('.like-btn');
            if (likeBtn) {
                likeBtn.addEventListener('click', () => {
                    this.handleLike(matchId);
                });
            }
            
            const dislikeBtn = document.querySelector('.dislike-btn');
            if (dislikeBtn) {
                dislikeBtn.addEventListener('click', () => {
                    this.handleDislike(matchId);
                });
            }
            
            const shareBtn = document.querySelector('.share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    this.handleShare(matchId);
                });
            }
        }, 100);
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
                if (refreshBtn) {
                    const originalText = refreshBtn.innerHTML;
                    refreshBtn.innerHTML = 'Refreshing...';
                    setTimeout(() => {
                        refreshBtn.innerHTML = originalText;
                    }, 1000);
                }
            }, 500);
        }
    }

    // ==================== UTILITY METHODS ====================
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
        
        // Add event listeners to community buttons
        setTimeout(() => {
            document.querySelectorAll('.sport-button[data-community]').forEach(button => {
                button.addEventListener('click', () => {
                    alert('Coming soon!');
                });
            });
        }, 100);
    }

    selectSport(sport) {
        this.currentSport = sport;
        this.showDatesView();
    }

    selectDate(date) {
        this.currentDate = date;
        this.showMatchesView();
    }

    getMatchesBySport(sport) {
        return this.verifiedMatches.filter(match => match.sport === sport);
    }

    getMatchesBySportAndDate(sport, date) {
        return this.getMatchesBySport(sport).filter(match => match.date === date);
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

    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
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

    showStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'grid';
    }

    hideStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'none';
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

    async tryFastProxies() {
        const targetUrl = 'https://topembed.pw/api.php?format=json';
        
        const fastProxies = [
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];
        
        for (const proxyUrl of fastProxies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('🚀 Fast data loaded from:', proxyUrl);
                    return data;
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM fully loaded, initializing MatchScheduler...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init();
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = 'Failed to initialize application. Please refresh the page.';
            errorBoundary.style.display = 'block';
        }
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
