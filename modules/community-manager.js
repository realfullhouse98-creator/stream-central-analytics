class CommunityManager {
    constructor(matchScheduler) {
        this.matchScheduler = matchScheduler;
        this.modules = {
            fanZone: new FanZone(this),
            matchReaction: new MatchReaction(this)
        };
    }

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;

        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                </div>
                
                <div class="menu-grid">
                    <div class="menu-button fan-zone-button">
                        <div class="button-title">Fan Zone</div>
                    </div>
                    
                    <div class="menu-button match-reaction-button">
                        <div class="button-title">Match Reaction</div>
                    </div>
                </div>
            </div>
        `;

        document.querySelector('.fan-zone-button').onclick = () => this.loadFanZone();
        document.querySelector('.match-reaction-button').onclick = () => this.loadMatchReaction();
        document.querySelector('.home-button').onclick = () => this.matchScheduler.uiManager.showMainMenu();
    }

    async loadFanZone() {
        try {
            await this.modules.fanZone.init();
            this.modules.fanZone.show();
        } catch (error) {
            this.showError();
        }
    }

    async loadMatchReaction() {
        try {
            await this.modules.matchReaction.init();
            this.modules.matchReaction.show();
        } catch (error) {
            this.showError();
        }
    }

    showError() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="error-message">
                    <button class="retry-btn" onclick="matchScheduler.uiManager.showCommunity()">Back</button>
                </div>
            </div>
        `;
        document.querySelector('.home-button').onclick = () => this.matchScheduler.uiManager.showMainMenu();
        document.querySelector('.top-back-button').onclick = () => this.showMainMenu();
    }
}
