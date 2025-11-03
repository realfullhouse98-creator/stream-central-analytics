// MAIN SCRIPT - FINAL CLEAN VERSION
import { SportsClassifier } from './modules/sports-classifier.js';
import { DataFusion } from './modules/data-fusion.js';
import { UIManager } from './modules/ui-manager.js';
import { StreamManager } from './modules/stream-manager.js';
import { 
    formatNumber, 
    formatDisplayDate, 
    formatTeamNames,
    convertUnixToLocalTime,
    checkIfLive,
    generateMatchId,
    getTeamName,
    setupGlobalErrorHandling,
    registerServiceWorker
} from './modules/utils.js';

class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.verifiedMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.currentCountry = '';
        this.currentTVChannel = null;
        
        // MODULES
        this.sportsClassifier = new SportsClassifier();
        this.dataFusion = new DataFusion();
        this.uiManager = new UIManager(this);
        this.streamManager = new StreamManager();
        
        // State
        this.matchStats = this.streamManager.matchStats;
        this.currentStreams = this.streamManager.currentStreams;
        this.isDataLoaded = false;
        this.isLoading = false;
        this.showLiveOnly = false;
        this.isDOMReady = false;
        
        console.log('🚀 MatchScheduler initialized with all modules!');
    }

    // ==================== DELEGATED METHODS ====================
    classifySport(match) { return this.sportsClassifier.classifySport(match); }
    
    async loadMatches() { 
        console.log('🔄 loadMatches called - delegating to DataFusion...');
        try {
            const apiData = await this.dataFusion.loadMatches();
            this.organizeMatches(apiData);
            return apiData;
        } catch (error) {
            console.warn('Data loading failed:', error);
            const fallbackData = this.dataFusion.useFallbackData();
            this.organizeMatches(fallbackData);
            return fallbackData;
        }
    }

    // UI Methods
    showMainMenu() { return this.uiManager.showMainMenu(); }
    showSportsView() { return this.uiManager.showSportsView(); }
    showTVChannels() { return this.uiManager.showTVChannels(); }
    showDatesView() { return this.uiManager.showDatesView(); }
    showMatchesView() { return this.uiManager.showMatchesView(); }
    showMatchDetails(matchId) { return this.uiManager.showMatchDetails(matchId); }
    showCommunity() { return this.uiManager.showCommunity(); }
    showCountryChannels(country) { return this.uiManager.showCountryChannels(country); }
    playTVChannel(channelName) { return this.uiManager.playTVChannel(channelName); }

    // Stream Methods
    detectSourceType(streamUrl) { return this.streamManager.detectSourceType(streamUrl); }
    generatePersonalityLabel(sourceType, index) { return this.streamManager.generatePersonalityLabel(sourceType, index); }
    getSourceColor(sourceType) { return this.streamManager.getSourceColor(sourceType); }
    async getStreamUrlFromStreamed(streamApiUrl) { return this.streamManager.getStreamUrlFromStreamed(streamApiUrl); }
    switchChannel(matchId, channelIndex) { return this.streamManager.switchChannel(matchId, channelIndex); }
    toggleDropdown(matchId) { return this.streamManager.toggleDropdown(matchId); }
    refreshCurrentStream(matchId) { return this.streamManager.refreshCurrentStream(matchId); }
    handleLike(matchId) { return this.streamManager.handleLike(matchId); }
    handleDislike(matchId) { return this.streamManager.handleDislike(matchId); }
    handleShare(matchId) { return this.streamManager.handleShare(matchId); }
    incrementViews(matchId) { return this.streamManager.incrementViews(matchId); }

    // Data Methods
    async loadTVChannelsData() { return this.dataFusion.loadTVChannelsData(); }
    getTVChannelsData() { return this.dataFusion.getTVChannelsData(); }
    backgroundPreload() { return this.dataFusion.backgroundPreload(); }
    async preloadSportsData() { return this.dataFusion.preloadSportsData(); }

    // Utility Methods
    formatNumber(num) { return formatNumber(num); }
    formatDisplayDate(dateString) { return formatDisplayDate(dateString); }
    formatTeamNames(teamString) { return formatTeamNames(teamString); }
    convertUnixToLocalTime(unixTimestamp) { return convertUnixToLocalTime(unixTimestamp); }
    checkIfLive(match) { return checkIfLive(match); }
    generateMatchId(match) { return generateMatchId(match); }
    getTeamName(teamString, index) { return getTeamName(teamString, index); }

    // ==================== CORE METHODS ====================
    async init() {
        await this.waitForDOMReady();
        setupGlobalErrorHandling();
        this.setupEventListeners();
        this.showMainMenu();
        registerServiceWorker();
        
        await this.loadTVChannelsData();
        this.backgroundPreload();
    }

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

    console.log('🎯 Setting up ENHANCED event listeners...');
    
    // Remove any existing listeners first
    document.removeEventListener('click', this.boundHandleGlobalClick);
    document.removeEventListener('mouseover', this.boundHandleMouseover);
    document.removeEventListener('click', this.boundHandleDropdownClose);

    // Bind methods to maintain 'this' context
    this.boundHandleGlobalClick = this.handleGlobalClick.bind(this);
    this.boundHandleMouseover = this.handleMouseover.bind(this);
    this.boundHandleDropdownClose = this.handleDropdownClose.bind(this);

    // Mouseover for sports preloading
    document.addEventListener('mouseover', this.boundHandleMouseover);

    // Global click handler - use capture phase to catch dynamic elements
    document.addEventListener('click', this.boundHandleGlobalClick, true);

    // Close dropdowns when clicking outside
    document.addEventListener('click', this.boundHandleDropdownClose);

    console.log('✅ Enhanced event listeners setup complete');
}

// ADD THESE NEW METHODS RIGHT AFTER setupEventListeners:

handleMouseover(e) {
    if (e.target.closest('.sports-button')) {
        this.preloadSportsData();
    }
}

handleDropdownClose(e) {
    if (!e.target.closest('.channel-dropdown-inline')) {
        document.querySelectorAll('.channel-dropdown-content-inline.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            if (dropdown.previousElementSibling) {
                dropdown.previousElementSibling.classList.remove('open');
            }
        });
    }
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
                case 'sports': this.showSportsView(); break;
                case 'tv': this.showTVChannels(); break;
                case 'community': this.showCommunity(); break;
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
            if (sportName) this.selectSport(sportName);
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
                const match = matches.find(m => {
                    const displayDate = this.formatDisplayDate(m.date);
                    return displayDate === dateText || 
                           (dateText.includes('Today') && m.date === new Date().toISOString().split('T')[0]);
                });
                if (match) this.selectDate(match.date);
            }
            return;
        }

        const watchButton = e.target.closest('.watch-btn');
        if (watchButton) {
            e.preventDefault();
            e.stopPropagation();
            const matchRow = watchButton.closest('.match-row');
            if (matchRow) {
                const rowIndex = Array.from(matchRow.parentNode.children).indexOf(matchRow) - 1;
                localStorage.setItem('lastScrollPosition', rowIndex);
                const teamNames = matchRow.querySelector('.team-names')?.textContent;
                if (teamNames) {
                    const match = this.verifiedMatches.find(m => 
                        this.formatTeamNames(m.teams) === teamNames
                    );
                    if (match) this.showMatchDetails(match.id);
                }
            }
            return;
        }

        // Filter buttons
        const filterButton = e.target.closest('.filter-btn');
        if (filterButton) {
            e.preventDefault();
            e.stopPropagation();
            const filterType = filterButton.getAttribute('data-filter');
            this.setFilter(filterType);
            return;
        }
    }

    handleBackButton() {
        switch(this.currentView) {
            case 'sports': this.showMainMenu(); break;
            case 'dates': this.showSportsView(); break;
            case 'matches': this.showDatesView(); break;
            case 'match-details': this.showMatchesView(); break;
            default: this.showMainMenu();
        }
    }

    // ==================== DATA ORGANIZATION ====================
    organizeMatches(apiData) {
        if (!apiData || typeof apiData !== 'object' || !apiData.events) {
            const fallbackData = this.dataFusion.useFallbackData();
            this.organizeMatches(fallbackData);
            return;
        }
        
        this.allMatches = [];
        this.verifiedMatches = [];
        
        Object.entries(apiData.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) {
                matches.forEach(match => {
                    if (match?.match) {
                        const matchId = this.generateMatchId(match);
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
            const fallbackData = this.dataFusion.useFallbackData();
            this.organizeMatches(fallbackData);
            return;
        }
        
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
        this.isDataLoaded = true;
        
        if (this.currentView !== 'main') {
            this[`show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`]();
        }
    }

    // ==================== SPORTS NAVIGATION ====================
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

    // ==================== FILTER SYSTEM ====================
    setFilter(type) {
        try {
            this.showLiveOnly = (type === 'live');
            this.showMatchesView();
        } catch (error) {
            console.log('🛡️ Filter error - resetting to safe state');
            this.showLiveOnly = false;
            this.showMatchesView();
        }
    }

    // ==================== DATA LOADING ====================
    retryLoadMatches() {
        this.isDataLoaded = false;
        this.showSportsView();
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

    // ==================== ANALYTICS ====================
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
        
        const totalStreamsEl = document.getElementById('total-streams');
        const liveViewersEl = document.getElementById('live-viewers');
        const countriesEl = document.getElementById('countries');
        const uptimeEl = document.getElementById('uptime');
        const updateTimeEl = document.getElementById('update-time');
        
        if (totalStreamsEl) totalStreamsEl.textContent = this.verifiedMatches.length;
        if (liveViewersEl) liveViewersEl.textContent = this.formatNumber(Math.floor(totalViewers / 100));
        if (countriesEl) countriesEl.textContent = this.verifiedMatches.length < 5 ? '3' : '1';
        if (uptimeEl) uptimeEl.textContent = this.verifiedMatches.length < 5 ? 'Research' : '100%';
        if (updateTimeEl) updateTimeEl.textContent = new Date().toLocaleTimeString();
    }

    showErrorState(errorMessage = '') {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="error-message">
                    <h3>Connection Issue</h3>
                    <p>Using fallback data</p>
                    ${errorMessage ? `<p style="font-size: 0.8em; color: var(--accent-red); margin: 10px 0;">${errorMessage}</p>` : ''}
                    <button class="retry-btn" onclick="matchScheduler.loadMatches()">
                        Retry Live Data
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM fully loaded, initializing MatchScheduler...');
    try {
        window.matchScheduler = new MatchScheduler();
        window.matchScheduler.init().then(() => {
            console.log('✅ 9kilos fully initialized with modules!');
        }).catch(error => {
            console.error('❌ Initialization failed:', error);
        });
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
    }
});

// Optional: Test modules after load
setTimeout(() => {
    if (window.matchScheduler) {
        console.log('🧪 Testing modules...');
        console.log('Sports:', window.matchScheduler.sportsClassifier);
        console.log('Data:', window.matchScheduler.dataFusion);
        console.log('UI:', window.matchScheduler.uiManager);
        console.log('Stream:', window.matchScheduler.streamManager);
    }
}, 2000);
