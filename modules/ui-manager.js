// modules/ui-manager.js
export class UIManager {
    constructor(scheduler) {
        this.scheduler = scheduler;
    }

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
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
    }

    showSportsView() {
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
                    <div class="sport-button" onclick="matchScheduler.selectSport('Football')">
                        <div class="sport-name">Football</div>
                    </div>
                    <div class="sport-button" onclick="matchScheduler.selectSport('Basketball')">
                        <div class="sport-name">Basketball</div>
                    </div>
                </div>
            </div>
        `;
    }

    showTVChannels() {
        const container = document.getElementById('dynamic-content');
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
                    <div class="country-card" onclick="matchScheduler.showCountryChannels('USA')">
                        <div class="country-flag">🇺🇸</div>
                        <div class="country-name">USA</div>
                        <div class="channel-count">1 channel</div>
                    </div>
                </div>
            </div>
        `;
    }
}
