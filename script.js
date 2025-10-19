// Stream Central Analytics Engine
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
        console.log('🔴 Stream Central Analytics - Live');
    }
    
    startAnalytics() {
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
    
    simulateViewerChanges() {
        // Simulate realistic viewer fluctuations
        Object.keys(this.viewers).forEach(streamId => {
            const change = Math.floor(Math.random() * 6) - 2; // -2 to +3
            this.viewers[streamId] = Math.max(5, this.viewers[streamId] + change);
        });
        
        // Update totals
        this.totalViewers = Object.values(this.viewers).reduce((a, b) => a + b, 0);
        
        // Occasionally add new countries
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
        
        // Add visual feedback
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
    
    startLiveUpdates() {
        // Simulate live events
        setInterval(() => {
            this.triggerRandomEvent();
        }, 120000); // Every 2 minutes
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

// Global functions for buttons
function refreshStream(streamId) {
    const iframe = document.querySelector(`[data-stream-id="${streamId}"] iframe`);
    if (iframe) {
        const originalSrc = iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = originalSrc;
            showNotification(`Stream ${streamId} refreshed`);
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
    // Create notification element
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
`;
document.head.appendChild(styles);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new StreamCentralAnalytics();
});
