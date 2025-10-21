// Stream Central Analytics - GitHub Pages + Back4app
class StreamCentralAnalytics {
    constructor() {
        this.back4appConnected = false;
        this.viewers = {
            stream1: 15,
            stream2: 23
        };
        this.totalViewers = 38;
        this.countries = 1;
        this.init();
    }
    
    async init() {
        await this.initBack4app();
        this.startAnalytics();
        this.updateViewerCounts();
        this.startLiveUpdates();
        console.log('🔴 Stream Central Analytics - GitHub Pages + Back4app');
    }
    
    async initBack4app() {
        try {
            if (typeof Parse === 'undefined') {
                console.log('🔴 Parse SDK not loaded');
                return;
            }
            
            Parse.initialize("kV7E4rsswsAfJFXBiWASjbjOtFLmf0iSh8cUHznK", "7VNrsFK2G0sKmlNp3OlNrZnmIPiP84l5Ygn6JvgH");
            Parse.serverURL = "https://parseapi.back4app.com/";
            
            // Test connection
            const TestObject = Parse.Object.extend('TestObject');
            const testObject = new TestObject();
            testObject.set('testField', 'connection_test');
            await testObject.save();
            
            this.back4appConnected = true;
            console.log('✅ Back4app: Connected successfully');
            this.showBack4appStatus('connected');
            
        } catch (error) {
            console.log('🔴 Back4app: Connection failed', error);
            this.showBack4appStatus('failed');
        }
    }
    
    async logAnalytics(data) {
        if (!this.back4appConnected) return;
        
        try {
            const Analytics = Parse.Object.extend("visitor_analytics");
            const analytics = new Analytics();
            await analytics.save({
                userAgent: data.userAgent || navigator.userAgent,
                platform: data.platform || navigator.platform,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                isBot: this.detectBot(),
                timestamp: new Date()
            });
            
            console.log('📊 Analytics logged to Back4app');
            
        } catch (error) {
            console.log('🔴 Analytics logging failed:', error);
        }
    }
    
    collectVisitorData() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            url: window.location.href,
            timestamp: new Date(),
            isBot: this.detectBot()
        };
    }
    
    detectBot() {
        const botIndicators = ['bot', 'crawler', 'spider'];
        const ua = navigator.userAgent.toLowerCase();
        return botIndicators.some(bot => ua.includes(bot));
    }
    
    startAnalytics() {
        this.trackCurrentVisitor();
        
        setInterval(() => {
            this.simulateViewerChanges();
            this.updateDashboard();
        }, 30000);
        
        setInterval(() => {
            this.updateLastRefreshed();
        }, 1000);
    }
    
    async trackCurrentVisitor() {
        const visitorData = this.collectVisitorData();
        await this.logAnalytics(visitorData);
        this.updateVisitorStats(visitorData);
    }
    
    updateVisitorStats(visitorData) {
        const statsElement = document.getElementById('visitor-stats');
        if (statsElement) {
            const botStatus = visitorData.isBot ? '🤖 Bot' : '👤 Human';
            statsElement.innerHTML = `
                <div class="visitor-info">
                    <strong>Current Session:</strong><br>
                    📱 ${visitorData.platform} | 🌐 ${visitorData.language}<br>
                    🖥️ ${visitorData.screen} | ${botStatus}
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
    
    updateDashboard() {
        this.updateViewerCounts();
        this.updateLastRefreshed();
    }
    
    updateLastRefreshed() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const statusElement = document.getElementById('update-time');
        if (statusElement) {
            statusElement.textContent = timeString;
        }
    }
    
    showBack4appStatus(status) {
        const statusElement = document.getElementById('mongo-status');
        if (statusElement) {
            const statusMessages = {
                connected: '🟢 Back4app: Connected',
                failed: '🔴 Back4app: Connection Failed'
            };
            statusElement.textContent = statusMessages[status] || '⚪ Back4app: Unknown';
            statusElement.className = `mongo-status status-${status}`;
        }
    }
    
    startLiveUpdates() {
        setInterval(() => {
            this.simulateViewerChanges();
            this.updateDashboard();
        }, 120000);
    }
}

// Global functions remain the same
async function refreshStream(streamId) {
    const iframe = document.querySelector(`[data-stream-id="${streamId}"] iframe`);
    if (iframe) {
        const originalSrc = iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = originalSrc;
            showNotification(`🔄 Stream ${streamId} refreshed`);
        }, 500);
    }
}

function toggleFullscreen(streamId) {
    const iframe = document.querySelector(`[data-stream-id="${streamId}"] iframe`);
    if (!document.fullscreenElement) {
        iframe.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
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
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.streamAnalytics = new StreamCentralAnalytics();
});
