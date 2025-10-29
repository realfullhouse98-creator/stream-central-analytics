// 9kilo Stream - GitHub Optimized Version
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.matchPolls = new Map();
        this.currentStreams = new Map();
        
        // GitHub Fixes
        this.isNavigating = false;
        this.lastClickTime = 0;
        
        // Optimization Flags
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-matches-cache';
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Performance Monitoring
        this.performanceMetrics = {
            pageLoadTime: 0,
            apiResponseTime: 0,
            userActions: []
        };
        
        this.init();
    }
    
    async init() {
        // GitHub Fix: Global error handlers
        this.setupErrorHandling();
        
        this.trackPerformance('pageStart');
        this.showMainMenu();
        
        // GitHub Fix: Safe background preloading
        setTimeout(() => {
            this.preloadSportsData();
        }, 1000);
        
        this.startPerformanceMonitoring();
        this.trackPerformance('pageLoaded');
    }
    
    // ==================== GITHUB FIXES ====================
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            return true;
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }
    
    safeUpdateElement(id, content) {
        try {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = content;
            }
        } catch (error) {
            console.warn('DOM update failed:', error);
        }
    }
    
    // ==================== ENHANCED UX METHODS ====================
    async showSportsViewWithFeedback(event) {
        const button = event?.currentTarget;
        
        // GitHub Fix: Prevent rapid clicks
        const now = Date.now();
        if (now - this.lastClickTime < 1000) {
            console.log('⏳ Click too fast');
            return;
        }
        this.lastClickTime = now;
        
        // Immediate visual feedback
        if (button) {
            this.showButtonLoading(button, true);
        }
        
        try {
            await this.showSportsView();
        } catch (error) {
            console.error('Navigation failed:', error);
            this.showErrorState('Please try again');
        } finally {
            if (button
