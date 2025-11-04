// Research Dashboard Controller
class ResearchDashboard {
    constructor() {
        this.tracker = new ResearchTracker();
        this.isLoading = false;
        this.autoRefreshInterval = null;
        
        this.init();
    }

    async init() {
        console.log('📊 Research Dashboard initializing...');
        
        // Start auto-refresh every 2 minutes
        this.startAutoRefresh();
        
        // Initial data load
        await this.refreshData();
        
        console.log('✅ Research Dashboard ready');
    }

    async refreshData() {
        if (this.isLoading) {
            console.log('⚠️ Refresh already in progress');
            return;
        }

        this.isLoading = true;
        this.updateLoadingState(true);
        
        try {
            // Get match data from main site or use fallback
            const matches = await this.getMatchData();
            
            if (!matches || matches.length === 0) {
                this.showError('No match data available. Please ensure main site is loaded.');
                return;
            }

            // Analyze suppliers
            const metrics = this.tracker.analyzeSuppliers(matches);
            
            // Update UI with new data
            this.updateDashboard(metrics);
            
            // Update timestamp
            this.updateLastRefreshed();
            
            console.log('✅ Dashboard refreshed with', matches.length, 'matches');
            
        } catch (error) {
            console.error('❌ Error refreshing dashboard:', error);
            this.showError('Failed to refresh data: ' + error.message);
        } finally {
            this.isLoading = false;
            this.updateLoadingState(false);
        }
    }

    async getMatchData() {
        // Try to get data from main site first
        if (window.matchScheduler && window.matchScheduler.verifiedMatches) {
            return window.matchScheduler.verifiedMatches;
        }
        
        // Fallback: try to load main site data
        try {
            console.log('🔄 Attempting to load main site data...');
            // If main site is loaded in another tab/window, we might access it
            // For now, return empty array - user should load main site first
            return [];
        } catch (error) {
            console.warn('Could not access main site data:', error);
            return [];
        }
    }

    updateDashboard(metrics) {
        if (!metrics) return;
        
        // Update TopEmbed metrics
        this.updateSupplierMetrics('topembed', metrics.topembed);
        
        // Update Streamed metrics
        this.updateSupplierMetrics('streamed', metrics.streamed);
        
        // Calculate and display differences
        this.updateDifferenceColumns();
    }

    updateSupplierMetrics(supplier, data) {
        const elements = {
            'total-matches': data.totalMatches,
            'live-matches': data.liveMatches,
            'upcoming-matches': data.upcomingMatches,
            'working-streams': data.workingStreams,
            'dead-streams': data.deadStreams,
            'multi-stream': data.multiStreamMatches,
            'sports-count': data.sportsCount,
            'leagues-count': data.leaguesCount,
            'countries-count': data.countriesCount,
            'new-today': data.newMatchesToday,
            'success-rate': data.successRate.toFixed(1) + '%',
            'load-time': (data.averageLoadTime / 1000).toFixed(1) + 's',
            'last-update': data.lastUpdateTime ? data.lastUpdateTime.toLocaleTimeString() : 'Never'
        };

        for (const [metric, value] of Object.entries(elements)) {
            const element = document.getElementById(`${supplier}-${metric}`);
            if (element) {
                element.textContent = value;
            }
        }
    }

    updateDifferenceColumns() {
        const metrics = [
            'total-matches', 'live-matches', 'upcoming-matches', 
            'working-streams', 'dead-streams', 'multi-stream',
            'sports-count', 'leagues-count', 'countries-count', 'new-today'
        ];

        metrics.forEach(metric => {
            const topembedElement = document.getElementById(`topembed-${metric}`);
            const streamedElement = document.getElementById(`streamed-${metric}`);
            const diffElement = document.getElementById(`diff-${metric}`);
            
            if (topembedElement && streamedElement && diffElement) {
                const topembedValue = this.extractNumber(topembedElement.textContent);
                const streamedValue = this.extractNumber(streamedElement.textContent);
                const difference = topembedValue - streamedValue;
                
                this.updateDifferenceElement(diffElement, difference, metric);
            }
        });

        // Handle percentage and time differences separately
        this.updateSpecialDifferences();
    }

    updateSpecialDifferences() {
        // Success Rate difference
        const topembedSuccess = this.extractNumber(document.getElementById('topembed-success-rate').textContent);
        const streamedSuccess = this.extractNumber(document.getElementById('streamed-success-rate').textContent);
        const successDiff = topembedSuccess - streamedSuccess;
        this.updateDifferenceElement(document.getElementById('diff-success-rate'), successDiff, 'percentage');

        // Load Time difference (negative is better)
        const topembedLoad = this.extractNumber(document.getElementById('topembed-load-time').textContent);
        const streamedLoad = this.extractNumber(document.getElementById('streamed-load-time').textContent);
        const loadDiff = topembedLoad - streamedLoad; // Negative means TopEmbed is faster
        this.updateDifferenceElement(document.getElementById('diff-load-time'), -loadDiff, 'time');
    }

    updateDifferenceElement(element, difference, type = 'number') {
        let displayValue;
        
        if (type === 'percentage') {
            displayValue = difference >= 0 ? `+${difference.toFixed(1)}%` : `${difference.toFixed(1)}%`;
        } else if (type === 'time') {
            displayValue = difference >= 0 ? `+${difference.toFixed(1)}s` : `${difference.toFixed(1)}s`;
        } else {
            displayValue = difference >= 0 ? `+${difference}` : `${difference}`;
        }

        element.textContent = displayValue;
        
        // Update styling based on what's better
        if (type === 'time') {
            // For load time, negative difference is better (faster)
            element.className = `metric-difference ${difference <= 0 ? 'positive' : 'negative'}`;
        } else {
            // For other metrics, positive difference is better
            element.className = `metric-difference ${difference >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (difference === 0) {
            element.className = 'metric-difference neutral';
        }
    }

    extractNumber(text) {
        // Extract numeric value from strings like "95.5%" or "2.3s"
        const match = text.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }

    updateLoadingState(loading) {
        const buttons = document.querySelectorAll('.refresh-btn, .export-btn');
        buttons.forEach(btn => {
            btn.disabled = loading;
        });

        if (loading) {
            document.querySelector('.refresh-btn').textContent = '🔄 Testing Streams...';
        } else {
            document.querySelector('.refresh-btn').textContent = '🔄 Refresh Data';
        }
    }

    updateLastRefreshed() {
        const now = new Date();
        document.getElementById('last-refreshed').textContent = now.toLocaleTimeString();
    }

    showError(message) {
        console.error('Dashboard Error:', message);
        // Simple error display - could be enhanced with toast notifications
        alert('Research Dashboard Error: ' + message);
    }

    startAutoRefresh() {
        // Refresh every 2 minutes
        this.autoRefreshInterval = setInterval(() => {
            this.refreshData();
        }, 2 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    // DATA EXPORT
    exportData() {
        try {
            const researchData = this.tracker.exportResearchData();
            const dataStr = JSON.stringify(researchData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `supplier-research-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ Research data exported');
        } catch (error) {
            console.error('❌ Export failed:', error);
            alert('Export failed: ' + error.message);
        }
    }
}

// Initialize dashboard when page loads
let researchDashboard;

document.addEventListener('DOMContentLoaded', () => {
    researchDashboard = new ResearchDashboard();
});

// Global functions for button clicks
window.refreshResearchData = function() {
    if (researchDashboard) {
        researchDashboard.refreshData();
    }
};

window.exportResearchData = function() {
    if (researchDashboard) {
        researchDashboard.exportData();
    }
};
