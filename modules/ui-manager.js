// UI Manager Module - FIXED NAVIGATION STATE
class UIManager {
    constructor(matchScheduler) {
        this.scheduler = matchScheduler;
    }

    showMainMenu() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.remove('tv-section');
        
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
        
        this.showStats();
        this.scheduler.currentView = 'main';
    }

  showSportsView() {
    console.log('🎯 Sports button clicked');
    
    // CHECK IF WE ALREADY HAVE DATA - SHOW IT IMMEDIATELY!
    if (this.scheduler.verifiedMatches.length > 0) {
        console.log('🚀 Already have data, showing immediately!');
        this.showSportsDataUI();
        return; // STOP HERE - don't show loading screen!
    }
    
    // Only show loading if we have NO data
    this.showSportsLoadingUI();
    
    // Wait max 2 seconds, then show whatever we have
    const safetyTimeout = setTimeout(() => {
        console.log('⚡ Safety timeout: Showing available data');
        this.showSportsDataUI();
    }, 2000);
    
    this.scheduler.ensureDataLoaded().then(success => {
        clearTimeout(safetyTimeout);
        this.showSportsDataUI();
    }).catch(error => {
        clearTimeout(safetyTimeout);
        this.showSportsDataUI();
    });
}

    showSportsLoadingUI() {
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
                    <div class="sport-button" style="opacity: 0.7; cursor: wait;">
                        <div class="sport-name">Loading Sports</div>
                    </div>
                </div>
            </div>
        `;
        
        this.hideStats();
        this.scheduler.currentView = 'sports';
    }

    showSportsDataUI() {
        const container = document.getElementById('dynamic-content');
        const matches = this.scheduler.verifiedMatches;
        
        console.log('🔍 Sports data UI - Total matches:', matches?.length);
        console.log('🔍 Unique sports:', [...new Set(matches?.map(m => m.sport) || [])]);
        
        if (!matches || matches.length === 0) {
            this.showSportsEmptyState();
            return;
        }
        
        const uniqueSports = [...new Set(matches.map(match => match.sport))];
       const sports = uniqueSports.map(sportId => ({
    id: sportId,
    name: sportId
})).filter(sport => sport.name && sport.name !== 'Other' && sport.name !== 'Sports').sort((a, b) => a.name.localeCompare(b.name));

// IF NO SPORTS FOUND, SHOW FALLBACK
if (sports.length === 0 && this.scheduler.verifiedMatches.length > 0) {
    // Show "Sports" as fallback category
    sports.push({ id: 'Sports', name: 'Sports' });
}

        if (sports.length === 0) {
            this.showSportsEmptyState();
            return;
        }

        console.log('🔍 Displaying sports categories:', sports.map(s => s.name));

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
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id.replace(/'/g, "\\'")}')">
                            <div class="sport-name">${sport.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.scheduler.currentView = 'sports';
    }

    showSportsEmptyState() {
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
                    <div class="sport-button" onclick="matchScheduler.retryLoadMatches()" style="cursor: pointer;">
                        <div class="sport-name">Retry Loading</div>
                    </div>
                </div>
            </div>
        `;
    }

    showDatesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.scheduler.getMatchesBySport(this.scheduler.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.scheduler.currentSport;
        const today = new Date().toISOString().split('T')[0];
        
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
                        const isToday = date === today;
                        return `
                            <div class="date-button" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-name">
                                    ${isToday ? '<span class="today-badge">Today</span>' : this.scheduler.formatDisplayDate(date)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.hideStats();
        this.scheduler.currentView = 'dates';
    }

    showMatchesView() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        const matches = this.scheduler.getMatchesBySportAndDate(
            this.scheduler.currentSport, 
            this.scheduler.currentDate
        );
        const sportName = this.scheduler.currentSport;
        const today = new Date().toISOString().split('T')[0];
        const isToday = this.scheduler.currentDate === today;
        
        const allMatches = matches;
        const liveMatches = allMatches.filter(match => match.isLive === true);
        const displayMatches = this.scheduler.showLiveOnly ? liveMatches : allMatches;
        const scheduleHeader = `Today's ${sportName}`;
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                <div class="section-header">
                    <h2>${scheduleHeader}</h2>
                    <p>${isToday ? '' : this.scheduler.formatDisplayDate(this.scheduler.currentDate)}</p>
                </div>
                
                <div class="matches-table-container">
                    <div class="professional-filter">
                        <button class="filter-btn ${this.scheduler.showLiveOnly ? '' : 'active'}" 
                                data-filter="all" onclick="matchScheduler.setFilter('all')">
                            All Matches
                        </button>
                        <button class="filter-btn ${this.scheduler.showLiveOnly ? 'active' : ''}" 
                                data-filter="live" onclick="matchScheduler.setFilter('live')">
                            Live Only
                        </button>
                    </div>
                    
                    <div class="matches-table">
                        <div class="table-header">
                            <div>Time</div>
                            <div>Match</div>
                            <div>Watch</div>
                        </div>
                        ${displayMatches.length > 0 ? 
                            displayMatches.map(match => this.renderMatchRow(match)).join('') :
                            this.renderEmptyState(this.scheduler.showLiveOnly)
                        }
                    </div>
                </div>
            </div>
        `;

        this.hideStats();
        this.scheduler.currentView = 'matches';
    }

    renderMatchRow(match) {
        const isLive = match.isLive;
        const formattedTeams = this.scheduler.formatTeamNames(match.teams);
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">${match.time}</div>
                <div class="match-details">
                    <div class="team-names">${formattedTeams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.channels && match.channels.length > 0 ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span style="color: var(--text-muted); font-size: 0.8em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }

    renderEmptyState(isLiveFilter) {
        if (isLiveFilter) {
            return `
                <div class="no-matches">
                    <h3>No Live Matches Right Now</h3>
                    <p>Check back later for live games</p>
                    <button class="retry-btn" onclick="matchScheduler.setFilter('all')">
                        View All Matches
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="no-matches">
                    <h3>No Matches Scheduled</h3>
                    <p>Check other dates or sports categories</p>
                </div>
            `;
        }
    }

    showCommunity() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;
        
        document.body.classList.remove('tv-section');
        
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

    showStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'grid';
    }

    hideStats() {
        const analytics = document.querySelector('.analytics-overview');
        if (analytics) analytics.style.display = 'none';
    }

    handleBackButton() {
        switch(this.scheduler.currentView) {
            case 'sports':
                this.showMainMenu();
                break;
            case 'dates':
                this.showSportsView();
                break;
            case 'matches':
                this.showDatesView();
                break;
            case 'match-details':
                this.showMatchesView();
                break;
            case 'tv-countries':
            case 'tv-channels':
            case 'tv-player':
                this.scheduler.showTVChannels();
                break;
            default:
                this.showMainMenu();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}
