class FanZone {
    constructor(communityManager) {
        this.communityManager = communityManager;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return true;
        this.isInitialized = true;
        return true;
    }

    show() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div>Fan Zone</div>
            </div>
        `;
        document.querySelector('.home-button').onclick = () => this.communityManager.matchScheduler.uiManager.showMainMenu();
        document.querySelector('.top-back-button').onclick = () => this.communityManager.showMainMenu();
    }
}
