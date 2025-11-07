class CommunityManager {
    constructor(matchScheduler) {
        this.matchScheduler = matchScheduler;
    }

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;

        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button" data-action="fan-zone">
                        <div class="button-title">Fan Zone</div>
                        <div class="button-subtitle">Discussions & polls</div>
                    </div>
                    <div class="menu-button" data-action="match-reaction">
                        <div class="button-title">Match Reaction</div>
                        <div class="button-subtitle">Live game comments</div>
                    </div>
                </div>
            </div>
        `;

        document.querySelector('[data-action="fan-zone"]').onclick = () => this.showFanZone();
        document.querySelector('[data-action="match-reaction"]').onclick = () => this.showMatchReaction();
    }

    showFanZone() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div>Fan Zone Content</div>
            </div>
        `;

        document.querySelector('.home-button').onclick = () => this.matchScheduler.uiManager.showMainMenu();
        document.querySelector('.top-back-button').onclick = () => this.showMainMenu();
    }

    showMatchReaction() {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div>Match Reaction Content</div>
            </div>
        `;

        document.querySelector('.home-button').onclick = () => this.matchScheduler.uiManager.showMainMenu();
        document.querySelector('.top-back-button').onclick = () => this.showMainMenu();
    }
}
