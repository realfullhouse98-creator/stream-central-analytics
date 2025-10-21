// Stream Central Analytics Engine - Back4app + GitHub Pages
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
        console.log('🔴 Stream Central Analytics - Back4app + GitHub Pages');
    }
    
    async initBack4app() {
        try {
            // Initialize Back4app Parse SDK
            Parse.initialize("kV7E4rsswsAfJFXBiWASjbjOtFLmf0iSh8cUHznK", "7VNrsFK2G0sKmlNp3OlNrZnmIPiP84l5Ygn6JvgH");
            Parse.serverURL = "https://parseapi.back4app.com/";
            
            this.back4appConnected = true;
            console.log('✅ Back4app: Connected');
            this.showMongoStatus('connected');
        } catch (error) {
            console.log('🔴 Back4app: Connection failed');
            this.showMongoStatus('failed');
        }
    }
    
    async logToBack4app(data) {
        if (!this.back4appConnected) return false;
        
        try {
            const result = await Parse.Cloud.run("logAnalytics", {
                userAgent: data.userAgent,
                platform: data.platform,
                screen: data.screen,
                timezone: data.timezone,
                isBot: data.isBot
            });
            console.log('📊 Back4app Storage Success:', result);
            return true;
        } catch (error) {
            console.log('📊 Back4app Storage Failed:', error);
            return false;
        }
    }
    
    collectVisitorData() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString(),
            isBot: this.detectBot(),
            sessionStart: new Date().toISOString()
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
        this.trackCurrentVisitor();
        
        setInterval(() => {
            this.simulateViewerChanges();
            this.updateDashboard();
        }, 30000);
        
        setInterval(() => {
            this.updateLastRefreshed();
        }, 1000);
        
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
        await this.logToBack4app(visitorData);
        this.updateVisitorStats(visitorData);
    }
    
    async trackEvent(eventName, additionalData = {}) {
        const eventData = {
            event: eventName,
            ...additionalData,
            timestamp: new Date().toISOString()
        };
        await this.logToBack4app(eventData);
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
                    🕒 ${new Date().toLocaleTimeString()}<br>
                    🔗 Back4app: ${this.back4appConnected ? 'Connected' : 'Failed'}
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
            statusElement.title = `Back4app: ${this.back4appConnected ? 'Connected' : 'Failed'}`;
        }
    }
    
    showMongoStatus(status) {
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

// Add Parse SDK to your HTML - Add this before the script.js include
const parseScript = document.createElement('script');
parseScript.src = 'https://npmcdn.com/parse/dist/parse.min.js';
document.head.appendChild(parseScript);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.streamAnalytics = new StreamCentralAnalytics();
});
