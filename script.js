// Stream Central Analytics - GitHub Pages
class StreamCentralAnalytics {
    constructor() {
        this.viewers = {
            stream1: 15,
            stream2: 23
        };
        this.totalViewers = 38;
        this.countries = 1;
        this.init();
    }
    
    init() {
        this.startAnalytics();
        this.updateViewerCounts();
        this.startLiveUpdates();
        console.log('🔴 Stream Central Analytics - Live Streaming Dashboard');
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
    
    trackCurrentVisitor() {
        this.updateVisitorStats();
    }
    
    updateVisitorStats() {
        const statsElement = document.getElementById('visitor-stats');
        if (statsElement) {
            const isBot = this.detectBot();
            const botStatus = isBot ? '🤖 Bot' : '👤 Human';
            statsElement.innerHTML = `
                <div class="visitor-info">
                    <strong>Current Session:</strong><br>
                    📱 ${navigator.platform} | 🌐 ${navigator.language}<br>
                    🖥️ ${screen.width}x${screen.height} | ${botStatus}
                </div>
            `;
        }
    }
    
    detectBot() {
        const botIndicators = ['bot', 'crawler', 'spider'];
        const ua = navigator.userAgent.toLowerCase();
        return botIndicators.some(bot => ua.includes(bot));
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

// Global functions
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
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add CSS animations only (no YouTube CSS)
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
`;
document.head.appendChild(styles);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.streamAnalytics = new StreamCentralAnalytics();
});
// ... all your existing code ...

// TEST PSL API - ADD THIS AT THE BOTTOM
async function testPSLApi() {
    try {
        const response = await fetch('https://topembed.pw/api.php');
        const data = await response.json();
        console.log('📡 PSL API Test Result:', data);
        
        // Show what we received
        if (data && data.length > 0) {
            showNotification(`✅ PSL API: Found ${data.length} streams`);
            return data;
        } else {
            showNotification('❌ PSL API: No streams found');
            return null;
        }
    } catch (error) {
        console.log('❌ PSL API Test Failed:', error);
        showNotification('❌ PSL API: Connection failed');
        return null;
    }
}

// Test the API
setTimeout(testPSLApi, 3000);

// THIS SHOULD BE THE VERY LAST LINE
document.addEventListener('DOMContentLoaded', () => {
    window.streamAnalytics = new StreamCentralAnalytics();
});
