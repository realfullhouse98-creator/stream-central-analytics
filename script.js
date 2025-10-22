// Stream Central Analytics - Hybrid Research & Production
class StreamCentralHybrid {
    constructor() {
        // Production Data
        this.liveMatches = [];
        this.upcomingMatches = [];
        
        // Research Data
        this.research = {
            apiCalls: 0,
            successes: 0,
            lastSuccess: null,
            reliability: 0
        };
        
        // Fallback System
        this.fallbackActive = false;
        this.fallbackStreams = [
            {
                id: 'fallback1',
                title: 'Live Sports Stream',
                league: 'Various Sports',
                streamUrl: 'https://www.youtube.com/embed/I42XWG-wddk',
                type: 'fallback'
            },
            {
                id: 'fallback2', 
                title: 'Live Football Stream',
                league: 'International',
                streamUrl: 'https://www.youtube.com/embed/mXbecrDVNM4',
                type: 'fallback'
            }
        ];
        
        this.init();
    }
    
    async init() {
        console.log('🎯 HYBRID: Starting Production + Research System');
        
        // 1. Start immediate API call for production data
        await this.fetchProductionData();
        
        // 2. Start background research
        this.startResearchEngine();
        
        // 3. Initialize analytics
        this.startAnalytics();
        
        // 4. Render initial interface
        this.renderHybridInterface();
    }
    
    // PRODUCTION: Get matches for users NOW
    async fetchProductionData() {
        this.research.apiCalls++;
        
        try {
            const response = await fetch('https://topembed.pw/api.php?format=json');
            const data = await response.json();
            
            this.research.successes++;
            this.research.lastSuccess = new Date();
            this.research.reliability = (this.research.successes / this.research.apiCalls) * 100;
            
            // PROCESS FOR PRODUCTION USE
            this.processProductionData(data);
            
        } catch (error) {
            console.log('⚠️ PRODUCTION: API failed, using fallback');
            this.activateFallbackSystem();
        }
    }
    
    processProductionData(apiData) {
        if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
            console.log('📭 PRODUCTION: API returned no matches');
            this.activateFallbackSystem();
            return;
        }
        
        // EXTRACT REAL MATCHES FOR USERS
        const productionMatches = apiData
            .filter(item => item && (item.title || item.league))
            .map(item => this.createProductionMatch(item));
        
        console.log(`🎯 PRODUCTION: Found ${productionMatches.length} matches for users`);
        
        this.liveMatches = productionMatches.filter(m => this.isMatchLive(m));
        this.upcomingMatches = productionMatches.filter(m => !this.isMatchLive(m));
        
        this.fallbackActive = false;
        this.updateProductionDisplay();
    }
    
    createProductionMatch(apiItem) {
        return {
            id: apiItem.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
            title: apiItem.title || 'Live Match',
            league: apiItem.league || 'Football',
            time: apiItem.time || '19:30',
            streamUrl: apiItem.url || this.getSmartStreamUrl(apiItem),
            source: 'api',
            confidence: this.calculateConfidence(apiItem),
            timestamp: new Date().toISOString()
        };
    }
    
    getSmartStreamUrl(apiItem) {
        // Prefer API-provided streams, fallback to ours
        if (apiItem.url && apiItem.url.includes('youtube.com/embed')) {
            return apiItem.url;
        }
        if (apiItem.embed && apiItem.embed.includes('youtube.com/embed')) {
            return apiItem.embed;
        }
        
        // Use our reliable fallback streams
        return this.fallbackStreams[Math.floor(Math.random() * this.fallbackStreams.length)].streamUrl;
    }
    
    calculateConfidence(item) {
        let score = 0;
        if (item.title) score += 40;
        if (item.league) score += 30;
        if (item.time) score += 15;
        if (item.url) score += 15;
        return score;
    }
    
    isMatchLive(match) {
        // Simple live detection - in production we can be more aggressive
        return match.time && this.isCurrentTime(match.time);
    }
    
    isCurrentTime(matchTime) {
        const now = new Date();
        const [hours, minutes] = matchTime.split(':').map(Number);
        const matchDate = new Date(now);
        matchDate.setHours(hours, minutes, 0, 0);
        
        const diff = Math.abs(now - matchDate);
        return diff < 30 * 60 * 1000; // Within 30 minutes
    }
    
    activateFallbackSystem() {
        console.log('🛡️ PRODUCTION: Activating fallback streams');
        this.fallbackActive = true;
        this.liveMatches = this.fallbackStreams;
        this.upcomingMatches = [];
        this.updateProductionDisplay();
    }
    
    // RESEARCH: Background analysis
    startResearchEngine() {
        // Research polling at different intervals
        setInterval(() => {
            this.conductResearch();
        }, 60000); // Every minute
        
        console.log('🔬 RESEARCH: Background analysis started');
    }
    
    async conductResearch() {
        try {
            const response = await fetch('https://topembed.pw/api.php');
            const data = await response.json();
            
            // Analyze without affecting production
            this.analyzeDataPatterns(data);
            
        } catch (error) {
            this.analyzeErrorPatterns(error);
        }
    }
    
    analyzeDataPatterns(data) {
        const analysis = {
            timestamp: new Date().toISOString(),
            dataType: typeof data,
            isArray: Array.isArray(data),
            itemCount: Array.isArray(data) ? data.length : 0,
            sampleStructure: Array.isArray(data) && data[0] ? Object.keys(data[0]) : []
        };
        
        console.log('🔬 RESEARCH: Data Analysis', analysis);
        this.updateResearchDisplay(analysis);
    }
    
    analyzeErrorPatterns(error) {
        console.log('🔬 RESEARCH: Error Analysis', error.message);
    }
    
    // HYBRID INTERFACE
    renderHybridInterface() {
        const container = document.getElementById('psl-streams-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="hybrid-system">
                <!-- PRODUCTION STATUS -->
                <div class="production-status" id="production-status">
                    <div class="status-header">
                        <h3>🎯 LIVE MATCHES</h3>
                        <div class="system-health">
                            <span class="health-indicator ${this.research.reliability > 70 ? 'healthy' : 'degraded'}">
                                ${Math.round(this.research.reliability)}% Reliable
                            </span>
                            <span class="source-badge ${this.fallbackActive ? 'fallback' : 'api'}">
                                ${this.fallbackActive ? '🛡️ Fallback' : '📡 API'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="matches-container" id="matches-container">
                        <div class="loading-production">
                            <div class="spinner"></div>
                            <p>Loading live matches...</p>
                        </div>
                    </div>
                </div>
                
                <!-- RESEARCH INSIGHTS -->
                <div class="research-sidebar">
                    <h4>🔬 SYSTEM INSIGHTS</h4>
                    <div class="insights-container" id="insights-container">
                        <div class="insight-item">
                            <div class="insight-icon">📊</div>
                            <div class="insight-text">
                                <strong>Initializing Hybrid System</strong>
                                <div>Production data loading...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="research-actions">
                        <button onclick="forceProductionRefresh()" class="action-btn">
                            🔄 Refresh Matches
                        </button>
                        <button onclick="toggleResearchView()" class="action-btn">
                            🔍 Research Mode
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    updateProductionDisplay() {
        const container = document.getElementById('matches-container');
        if (!container) return;
        
        const allMatches = [...this.liveMatches, ...this.upcomingMatches];
        
        if (allMatches.length === 0) {
            container.innerHTML = `
                <div class="no-matches-production">
                    <h4>No Live Matches Available</h4>
                    <p>Check back later for scheduled matches</p>
                    <button onclick="activateFallbackStreams()" class="fallback-action">
                        🎯 Show Available Streams
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = allMatches.map(match => `
            <div class="production-match-card ${match.source === 'api' ? 'api-match' : 'fallback-match'}">
                <div class="match-main">
                    <h4>${match.title}</h4>
                    <div class="match-details">
                        <span class="league">${match.league}</span>
                        <span class="time">${match.time}</span>
                        <span class="source ${match.source}">${match.source.toUpperCase()}</span>
                    </div>
                    ${match.confidence < 70 ? `
                        <div class="confidence-warning">
                            ⚠️ Low confidence data
                        </div>
                    ` : ''}
                </div>
                <div class="match-action">
                    <button class="watch-btn-production" 
                            onclick="loadProductionStream('${match.streamUrl}', '${match.title}')">
                        ${this.liveMatches.includes(match) ? '🔴 WATCH LIVE' : '⏰ SCHEDULED'}
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update status
        this.updateSystemStatus();
    }
    
    updateSystemStatus() {
        const statusElement = document.getElementById('production-status');
        if (!statusElement) return;
        
        const statusHeader = statusElement.querySelector('.status-header h3');
        const healthIndicator = statusElement.querySelector('.health-indicator');
        const sourceBadge = statusElement.querySelector('.source-badge');
        
        const matchCount = this.liveMatches.length + this.upcomingMatches.length;
        statusHeader.textContent = `🎯 LIVE MATCHES (${matchCount})`;
        
        // Update health indicator
        healthIndicator.className = `health-indicator ${this.research.reliability > 70 ? 'healthy' : this.research.reliability > 30 ? 'degraded' : 'poor'}`;
        healthIndicator.textContent = `${Math.round(this.research.reliability)}% Reliable`;
        
        // Update source badge
        sourceBadge.className = `source-badge ${this.fallbackActive ? 'fallback' : 'api'}`;
        sourceBadge.textContent = this.fallbackActive ? '🛡️ Fallback' : '📡 API';
    }
    
    updateResearchDisplay(analysis) {
        const insightsContainer = document.getElementById('insights-container');
        if (!insightsContainer) return;
        
        insightsContainer.innerHTML = `
            <div class="insight-item">
                <div class="insight-icon">📡</div>
                <div class="insight-text">
                    <strong>API Analysis</strong>
                    <div>Data: ${analysis.itemCount} items</div>
                    <div>Type: ${analysis.dataType}</div>
                </div>
            </div>
            <div class="insight-item">
                <div class="insight-icon">⚡</div>
                <div class="insight-text">
                    <strong>System Performance</strong>
                    <div>Calls: ${this.research.apiCalls}</div>
                    <div>Success: ${this.research.successes}</div>
                </div>
            </div>
        `;
    }
    
    // Existing analytics (keep your current functionality)
    startAnalytics() {
        this.viewers = { stream1: 15, stream2: 23 };
        this.totalViewers = 38;
        this.countries = 1;
        
        setInterval(() => {
            this.simulateViewerChanges();
            this.updateViewerCounts();
        }, 30000);
        
        setInterval(() => {
            this.updateLastRefreshed();
        }, 1000);
    }
    
    simulateViewerChanges() {
        Object.keys(this.viewers).forEach(streamId => {
            const change = Math.floor(Math.random() * 6) - 2;
            this.viewers[streamId] = Math.max(5, this.viewers[streamId] + change);
        });
        this.totalViewers = Object.values(this.viewers).reduce((a, b) => a + b, 0);
    }
    
    updateViewerCounts() {
        Object.keys(this.viewers).forEach(streamId => {
            const element = document.getElementById(`${streamId}-viewers`);
            if (element) {
                element.textContent = this.viewers[streamId];
            }
        });
        
        document.getElementById('live-viewers').textContent = this.totalViewers;
        document.getElementById('countries').textContent = this.countries;
    }
    
    updateLastRefreshed() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const statusElement = document.getElementById('update-time');
        if (statusElement) {
            statusElement.textContent = timeString;
        }
    }
}

// HYBRID SYSTEM FUNCTIONS
function loadProductionStream(url, title) {
    console.log('🎯 PRODUCTION: Loading stream -', title);
    showNotification(`🔴 Loading: ${title}`);
    window.open(url, '_blank');
}

function forceProductionRefresh() {
    console.log('🔄 HYBRID: Manual production refresh');
    showNotification('🔄 Refreshing matches...');
    window.hybridSystem.fetchProductionData();
}

function activateFallbackStreams() {
    console.log('🎯 HYBRID: Manual fallback activation');
    window.hybridSystem.activateFallbackSystem();
    showNotification('🛡️ Fallback streams activated');
}

function toggleResearchView() {
    console.log('🔍 HYBRID: Toggling research view');
    showNotification('🔍 Research mode activated');
    // Could show detailed research data
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4ecdc4, #44a08d);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        animation: slideInRight 0.5s ease-out;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add Hybrid CSS
const hybridStyles = document.createElement('style');
hybridStyles.textContent = `
    .hybrid-system {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        margin-top: 20px;
    }
    
    .production-status {
        background: linear-gradient(135deg, #1e3c72, #2a5298);
        border-radius: 15px;
        padding: 20px;
        color: white;
    }
    
    .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .system-health {
        display: flex;
        gap: 10px;
    }
    
    .health-indicator {
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: bold;
    }
    
    .health-indicator.healthy { background: #27ae60; }
    .health-indicator.degraded { background: #f39c12; }
    .health-indicator.poor { background: #e74c3c; }
    
    .source-badge {
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: bold;
    }
    
    .source-badge.api { background: #3498db; }
    .source-badge.fallback { background: #9b59b6; }
    
    .production-match-card {
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 4px solid #4ecdc4;
    }
    
    .production-match-card.fallback-match {
        border-left-color: #9b59b6;
    }
    
    .match-main h4 {
        margin: 0 0 8px 0;
        color: white;
    }
    
    .match-details {
        display: flex;
        gap: 15px;
        font-size: 0.9em;
        color: #bdc3c7;
    }
    
    .confidence-warning {
        color: #f39c12;
        font-size: 0.8em;
        margin-top: 5px;
    }
    
    .watch-btn-production {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .watch-btn-production:hover {
        transform: scale(1.05);
    }
    
    .research-sidebar {
        background: #2c3e50;
        border-radius: 15px;
        padding: 20px;
        color: white;
    }
    
    .insight-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 15px 0;
        padding: 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
    }
    
    .insight-icon {
        font-size: 1.2em;
    }
    
    .action-btn {
        background: #34495e;
        color: white;
        border: 1px solid #4ecdc4;
        padding: 8px 15px;
        border-radius: 20px;
        cursor: pointer;
        margin: 5px;
        transition: all 0.3s ease;
    }
    
    .action-btn:hover {
        background: #4ecdc4;
    }
    
    .loading-production {
        text-align: center;
        padding: 40px;
        color: #bdc3c7;
    }
    
    .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #4ecdc4;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(hybridStyles);

// Initialize Hybrid System
document.addEventListener('DOMContentLoaded', () => {
    window.hybridSystem = new StreamCentralHybrid();
});
