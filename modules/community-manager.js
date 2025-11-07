// Community Manager - Main Router
class CommunityManager {
    constructor(matchScheduler) {
        this.matchScheduler = matchScheduler;
        this.isInitialized = false;
        this.modules = {
            fanZone: null,
            matchReaction: null
        };
    }

    // Initialize community system
    async init() {
        if (this.isInitialized) return;
        
        console.log('🏠 Initializing Community Manager...');
        this.isInitialized = true;
        
        // Preload module definitions (not the full code)
        this.modules.fanZone = new FanZone(this);
        this.modules.matchReaction = new MatchReaction(this);
    }

    // Show main community menu
    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                
                <div class="section-header">
                    <h2>Community Hub</h2>
                    <p>Connect with fellow sports fans</p>
                </div>

                <div class="menu-grid">
                    <div class="menu-button fan-zone-button" data-action="fan-zone">
                        <div class="button-title">🏠 FAN ZONE</div>
                        <div class="button-subtitle">Discussions & polls</div>
                    </div>
                    
                    <div class="menu-button match-reaction-button" data-action="match-reaction">
                        <div class="button-title">💬 MATCH REACTION</div>
                        <div class="button-subtitle">Live game comments</div>
                    </div>
                </div>

                <div class="community-stats" style="text-align: center; margin-top: 30px; color: var(--text-muted);">
                    <div>🎯 Research Mode: Modular Community System</div>
                    <div style="font-size: 0.8em; margin-top: 8px;">Each section loads independently</div>
                </div>
            </div>
        `;

        this.attachMenuEventListeners();
    }

    attachMenuEventListeners() {
        // Fan Zone button
        const fanZoneBtn = document.querySelector('.fan-zone-button');
        if (fanZoneBtn) {
            fanZoneBtn.onclick = () => this.loadFanZone();
        }

        // Match Reaction button  
        const matchReactionBtn = document.querySelector('.match-reaction-button');
        if (matchReactionBtn) {
            matchReactionBtn.onclick = () => this.loadMatchReaction();
        }
    }

    // Load Fan Zone module
    async loadFanZone() {
        console.log('🏠 Loading Fan Zone module...');
        
        try {
            // Show loading state
            this.showLoadingState('Fan Zone');
            
            // Initialize and show Fan Zone
            await this.modules.fanZone.init();
            this.modules.fanZone.show();
            
        } catch (error) {
            console.error('❌ Fan Zone failed:', error);
            this.showErrorState('Fan Zone', 'discussions and polls');
        }
    }

    // Load Match Reaction module
    async loadMatchReaction() {
        console.log('💬 Loading Match Reaction module...');
        
        try {
            // Show loading state
            this.showLoadingState('Match Reaction');
            
            // Initialize and show Match Reaction
            await this.modules.matchReaction.init();
            this.modules.matchReaction.show();
            
        } catch (error) {
            console.error('❌ Match Reaction failed:', error);
            this.showErrorState('Match Reaction', 'live game comments');
        }
    }

    // Show loading state
    showLoadingState(moduleName) {
        const container = document.getElementById('dynamic-content');
        if (!container) return;

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                
                <div class="loading-message">
                    <div class="loading-spinner"></div>
                    <h3>Loading ${moduleName}...</h3>
                    <p>Initializing modular community system</p>
                </div>
            </div>
        `;

        this.attachNavigationListeners();
    }

    // Show error state
    showErrorState(moduleName, featureDescription) {
        const container = document.getElementById('dynamic-content');
        if (!container) return;

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                
                <div class="error-message">
                    <h3>${moduleName} Temporarily Unavailable</h3>
                    <p>Our ${featureDescription} are currently being upgraded.</p>
                    <p style="font-size: 0.9em; color: var(--text-muted); margin-top: 15px;">
                        🎯 Research Note: This module failed independently without affecting core streaming.
                    </p>
                    <button class="retry-btn" onclick="matchScheduler.uiManager.showCommunity()">
                        Back to Community Hub
                    </button>
                </div>
            </div>
        `;

        this.attachNavigationListeners();
    }

    attachNavigationListeners() {
        // Home button
        const homeBtn = document.querySelector('.home-button');
        if (homeBtn) {
            homeBtn.onclick = () => this.matchScheduler.uiManager.showMainMenu();
        }

        // Back button
        const backBtn = document.querySelector('.top-back-button');
        if (backBtn) {
            backBtn.onclick = () => this.showMainMenu();
        }
    }

    // Get live matches for community features
    getLiveMatches() {
        return this.matchScheduler.verifiedMatches.filter(match => match.isLive) || [];
    }
}
