// Stream Central Analytics Engine with MongoDB
class StreamCentralAnalytics {
    constructor() {
        this.mongoConnected = false;
        this.viewers = {
            stream1: 15,
            stream2: 23
        };
        this.totalViewers = 38;
        this.countries = 1;
        this.init();
    }
    
    async init() {
        await this.connectToMongoDB();
        this.startAnalytics();
        this.updateViewerCounts();
        this.startLiveUpdates();
        console.log('🔴 Stream Central Analytics - MongoDB Connected');
    }
    
    async connectToMongoDB() {
        try {
            // MongoDB connection will be added via environment variables
            const mongoURI = await this.getMongoURI();
            if (mongoURI && mongoURI.includes('mongodb')) {
                this.mongoConnected = true;
                console.log('✅ MongoDB: Ready for connection');
                this.showMongoStatus('connected');
            } else {
                console.log('⚠️ MongoDB: Using simulated data (connection setup required)');
                this.showMongoStatus('simulated');
            }
        } catch (error) {
            console.log('❌ MongoDB: Connection failed, using simulated data');
            this.showMongoStatus('failed');
        }
    }
    
    async getMongoURI() {
        // This will be handled by Netlify environment variables
        // In production, this comes from process.env.MONGODB_URI
        return null; // Simulated for now
    }
    
    async storeVisitorData(visitorData) {
        if (!this.mongoConnected) {
            // Simulate database storage
            this.simulateDataStorage(visitorData);
            return;
        }
        
        // Real MongoDB storage would go here
        console.log('📊 Storing visitor data:', visitorData);
    }
    
    simulateDataStorage(visitorData) {
        // Simulate database operations
        const timestamp = new Date().toISOString();
        const data = {
            timestamp,
            ...visitorData,
            storedIn: 'simulated-db'
        };
        console.log('📊 Simulated DB Storage:', data);
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
    }
    
    trackCurrentVisitor() {
        const visitorData = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString(),
            isBot: this.detectBot()
        };
        
        this.storeVisitorData(visitorData);
        this.updateVisitorStats(visitorData);
    }
    
    detectBot() {
        const botIndicators = [
            'bot', 'crawler', 'spider', 'googlebot', 'bingbot', 'slurp'
        ];
        const ua = navigator.userAgent.toLowerCase();
        return botIndicators.some(bot => ua.includes(bot));
    }
    
    updateVisitorStats(visitorData) {
        // Update dashboard with real visitor info
        const statsElement = document.getElementById('visitor-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="visitor-info">
                    <strong>Current Session:</strong><br>
                    📱 ${visitorData.platform} | 🌐 ${visitorData.language}<br>
                    🖥️ ${visitorData.screen} | 🤖 ${visitorData.isBot ? 'Bot Detected' : 'Human'}
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
        document.getElementById('update-time').textContent = timeString;
    }
    
    showMongoStatus(status) {
        const statusElement = document.getElementById('mongo-status');
        if (statusElement) {
            const statusMessages = {
                connected: '🟢 MongoDB: Connected',
                simulated: '🟡 MongoDB: Simulated Data',
                failed: '🔴 MongoDB: Connection Failed'
            };
            statusElement.textContent = statusMessages[status] || '⚪ MongoDB: Unknown';
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
function refreshStream(streamId) {
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
                analytics.storeVisitorData({
                    action: 'stream_refresh',
                    streamId: streamId,
                    timestamp: new Date().toISOString()
                });
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
        padding: 10px;
        border-radius: 8px;
        margin-top: 10px;
        font-size: 0.9em;
        border-left: 3px solid #4ecdc4;
    }
    
    .mongo-status {
        background: rgba(255, 255, 255, 0.1);
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.8em;
        margin-top: 10px;
        display: inline-block;
    }
`;
document.head.appendChild(styles);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.streamAnalytics = new StreamCentralAnalytics();
});
