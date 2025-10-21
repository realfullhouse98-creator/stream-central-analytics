// Stream Central Analytics Engine - Vercel + MongoDB
class StreamCentralAnalytics {
    constructor() {
        this.mongoConnected = false;
        this.viewers = {
            stream1: 15,
            stream2: 23
        };
        this.totalViewers = 38;
        this.countries = 1;
        this.apiBase = '/api'; // Vercel functions path
        this.init();
    }
    
    async init() {
        await this.connectToMongoDB();
        this.startAnalytics();
        this.updateViewerCounts();
        this.startLiveUpdates();
        console.log('🔴 Stream Central Analytics - Vercel + MongoDB');
    }
    
    async connectToMongoDB() {
        try {
            // Test MongoDB connection by sending visitor data
            const visitorData = await this.collectVisitorData();
            const connected = await this.sendToMongoDB(visitorData);
            
            if (connected) {
                this.mongoConnected = true;
                console.log('✅ MongoDB: Connected via Vercel Functions');
                this.showMongoStatus('connected');
            } else {
                console.log('🟡 MongoDB: Using enhanced simulated data');
                this.showMongoStatus('simulated');
            }
        } catch (error) {
            console.log('🔴 MongoDB: Connection failed, using simulated data');
            this.showMongoStatus('failed');
        }
    }
    
    async sendToMongoDB(data) {
        try {
            const response = await fetch(`${this.apiBase}/mongo-analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('📊 MongoDB Storage Success:', result);
                return true;
            }
            return false;
        } catch (error) {
            console.log('📊 MongoDB Storage Failed:', error);
            return false;
        }
    }
    
    collectVisitorData() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            isBot: this.detectBot(),
            sessionStart: new Date().toISOString(),
            streamCentralVersion: '2.0'
        };
    }
    
    detectBot() {
        const botIndicators = [
            'bot', 'crawler', 'spider', 'googlebot', 'bingbot', 'slurp',
            'duckduckbot', 'baiduspider', 'yandexbot', 'facebookexternalhit'
        ];
        const ua = navigator.userAgent.toLowerCase();
        return botIndicators.some(bot => ua.includes(bot));
    }
    
    startAnalytics() {
        // Track current visitor
        this.trackCurrentVisitor();
        
        // Update analytics every 30 seconds
        setInterval(() => {
            this.simulateViewerChanges();
            this.updateDashboard();
        }, 30000);
        
        // Update clock every second
        setInterval(() => {
            this.updateLastRefreshed();
        }, 1000);
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });
    }
    
    async trackCurrentVisitor() {
        const visitorData = this.collectVisitorData();
        await this.sendToMongoDB(visitorData);
        this.updateVisitorStats(visitorData);
    }
    
    async trackEvent(eventName, additionalData = {}) {
        const eventData = {
            event: eventName,
            ...additionalData,
            timestamp: new Date().toISOString()
        };
        await this.sendToMongoDB(eventData);
    }
    
    updateVisitorStats(visitorData) {
        const statsElement = document.getElementById('visitor-stats');
        if (statsElement) {
            const botStatus = visitorData.isBot ? '🤖 Bot' : '👤 Human';
            statsElement.innerHTML = `
                <div class="visitor-info">
                    <strong>Current Session (Live):</strong><br>
                    📱 ${visitorData.platform} | 🌐 ${visitorData.language}<br>
                    🖥️ ${visitorData.screen} | ${botStatus}<br>
                    🕒 ${new Date().toLocaleTimeString()}
                </div>
            `;
        }
    }
    
    simulateViewerChanges() {
        Object.keys(this.viewers).forEach(streamId => {
            const change = Math.floor(Math.random() * 6) - 2;
            this.viewers[streamId] = Math.max(5, this.viewers[streamId] + change);
        });
        
        this.totalViewers = Object.values(this.viewers).reduce((a, b) => a + b, 0);
        
        if (Math.random() < 0.1 && this.countries < 5) {
            this.countries++;
        }
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
        document.getElementById('total-streams').textContent = Object.keys(this.viewers).length;
    }
    
    updateDashboard() {
        this.updateViewerCounts();
        this.updateLastRefreshed();
        
        const viewersElement = document.getElementById('live-viewers');
        viewersElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            viewersElement.style.transform = 'scale(1)';
        }, 300);
    }
    
    updateLastRefreshed() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const statusElement = document.getElementById('update-time');
        if (statusElement) {
            statusElement.textContent = timeString;
            statusElement.title = `MongoDB: ${this.mongoConnected ? 'Connected' : 'Simulated'}`;
        }
    }
    
    showMongoStatus(status) {
        const statusElement = document.getElementById('mongo-status');
        if (statusElement) {
            const statusMessages = {
                connected: '🟢 MongoDB: Connected via Vercel',
                simulated: '🟡 MongoDB: Enhanced Simulation',
                failed: '🔴 MongoDB: Connection Failed'
            };
            statusElement.textContent = statusMessages[status] || '⚪ MongoDB: Unknown';
            statusElement.className = `mongo-status status-${status}`;
        }
    }
    
    startLiveUpdates() {
        setInterval(() => {
            this.triggerRandomEvent();
        }, 120000);
    }
    
    triggerRandomEvent() {
        const events = ['viewer_surge', 'new_country', 'stream_quality_change'];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        switch(randomEvent) {
            case 'viewer_surge':
                this.simulateViewerSurge();
                break;
            case 'new_country':
                if (this.countries < 8) this.countries++;
                break;
        }
    }
    
    simulateViewerSurge() {
        Object.keys(this.viewers).forEach(streamId => {
            this.viewers[streamId] += Math.floor(Math.random() * 10) + 5;
        });
        this.updateDashboard();
    }
}

// Enhanced global functions
async function refreshStream(streamId) {
    const iframe = document.querySelector(`[data-stream-id="${streamId}"] iframe`);
    if (iframe) {
        const originalSrc = iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = originalSrc;
            showNotification(`🔄 Stream ${streamId} refreshed`);
            
            // Log the refresh event
            const analytics = window.streamAnalytics;
            if (analytics) {
                analytics.trackEvent('stream_refresh', { streamId: streamId });
            }
        }, 500);
    }
}

function toggleFullscreen(streamId) {
    const iframe = document.querySelector(`[data-stream-id="${streamId}"] iframe`);
    if (!document.fullscreenElement) {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
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

// Add CSS animations
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    #live-viewers {
        transition: transform 0.3s ease;
    }
    
    .visitor-info {
        background: rgba(255, 255, 255, 0.1);
        padding: 12px;
        border-radius: 8px;
        margin-top: 10px;
        font-size: 0.85em;
        border-left: 3px solid #4ecdc4;
        line-height: 1.4;
    }
    
    .mongo-status {
        background: rgba(255, 255, 255, 0.1);
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.8em;
        margin-top: 10px;
        display: inline-block;
        font-weight: bold;
    }
    
    .status-connected {
        background: rgba(46, 204, 113, 0.2);
        border: 1px solid rgba(46, 204, 113, 0.5);
    }
    
    .status-simulated {
        background: rgba(241, 196, 15, 0.2);
        border: 1px solid rgba(241, 196, 15, 0.5);
    }
    
    .status-failed {
        background: rgba(231, 76, 60, 0.2);
        border: 1px solid rgba(231, 76, 60, 0.5);
    }
`;
document.head.appendChild(styles);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.streamAnalytics = new StreamCentralAnalytics();
});
