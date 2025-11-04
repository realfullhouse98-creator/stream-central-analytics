// Research Tracker Module - Comprehensive Supplier Analytics
class ResearchTracker {
    constructor() {
        this.metrics = {
            topembed: this.createSupplierMetrics(),
            streamed: this.createSupplierMetrics()
        };
        
        this.testHistory = [];
        this.dailySnapshots = {};
        this.startTime = Date.now();
        
        console.log('🔬 Research Tracker initialized');
    }

    createSupplierMetrics() {
        return {
            // Basic Counts
            totalMatches: 0,
            liveMatches: 0,
            upcomingMatches: 0,
            deadStreams: 0,
            workingStreams: 0,
            unstableStreams: 0,
            multiStreamMatches: 0,
            
            // Content Coverage
            sportsCount: 0,
            leaguesCount: 0,
            countriesCount: 0,
            newMatchesToday: 0,
            
            // Performance
            successRate: 0,
            averageLoadTime: 0,
            totalTests: 0,
            successfulTests: 0,
            
            // Temporal
            lastUpdateTime: null,
            lastStreamTestTime: null
        };
    }

    // MAIN ANALYSIS FUNCTION
    analyzeSuppliers(matches) {
        console.log('🔍 Analyzing suppliers with', matches.length, 'matches');
        
        this.resetCurrentMetrics();
        
        if (!matches || matches.length === 0) {
            console.warn('No matches available for analysis');
            return;
        }

        // Analyze each supplier
        this.analyzeSupplier(matches, 'topembed');
        this.analyzeSupplier(matches, 'streamed');
        
        // Update timestamps
        const now = new Date();
        this.metrics.topembed.lastUpdateTime = now;
        this.metrics.streamed.lastUpdateTime = now;
        
        // Track daily changes
        this.trackDailyChanges();
        
        console.log('✅ Supplier analysis complete');
        return this.metrics;
    }

    analyzeSupplier(matches, supplier) {
        const supplierMatches = matches.filter(match => 
            match.channels && match.channels.some(channel => this.identifySupplier(channel) === supplier)
        );

        if (supplierMatches.length === 0) return;

        // Basic counts
        this.metrics[supplier].totalMatches = supplierMatches.length;
        this.metrics[supplier].liveMatches = supplierMatches.filter(m => m.isLive).length;
        this.metrics[supplier].upcomingMatches = supplierMatches.filter(m => !m.isLive).length;

        // Content coverage analysis
        this.analyzeContentCoverage(supplierMatches, supplier);
        
        // Stream quality analysis (async - will update later)
        this.analyzeStreamQuality(supplierMatches, supplier);
    }

    analyzeContentCoverage(matches, supplier) {
        const sports = new Set();
        const leagues = new Set();
        const countries = new Set();

        matches.forEach(match => {
            sports.add(match.sport);
            leagues.add(match.league);
            
            // Extract country from league name if possible
            const country = this.extractCountryFromLeague(match.league);
            if (country) countries.add(country);
        });

        this.metrics[supplier].sportsCount = sports.size;
        this.metrics[supplier].leaguesCount = leagues.size;
        this.metrics[supplier].countriesCount = countries.size;
    }

    async analyzeStreamQuality(matches, supplier) {
        let deadStreams = 0;
        let workingStreams = 0;
        let multiStreamMatches = 0;
        let totalLoadTime = 0;
        let successfulTests = 0;
        let totalTests = 0;

        for (const match of matches.slice(0, 20)) { // Test first 20 matches to avoid overload
            const supplierStreams = match.channels.filter(channel => 
                this.identifySupplier(channel) === supplier
            );

            if (supplierStreams.length > 1) {
                this.metrics[supplier].multiStreamMatches++;
            }

            for (const streamUrl of supplierStreams.slice(0, 2)) { // Test max 2 streams per match
                totalTests++;
                const testResult = await this.testStreamHealth(streamUrl, supplier);
                
                if (testResult.healthy) {
                    workingStreams++;
                    successfulTests++;
                    totalLoadTime += testResult.loadTime;
                } else {
                    deadStreams++;
                }
                
                // Avoid rate limiting
                await this.delay(500);
            }
        }

        // Update metrics
        this.metrics[supplier].deadStreams = deadStreams;
        this.metrics[supplier].workingStreams = workingStreams;
        this.metrics[supplier].successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;
        this.metrics[supplier].averageLoadTime = successfulTests > 0 ? totalLoadTime / successfulTests : 0;
        this.metrics[supplier].totalTests = totalTests;
        this.metrics[supplier].successfulTests = successfulTests;
        this.metrics[supplier].lastStreamTestTime = new Date();
    }

    async testStreamHealth(streamUrl, supplier) {
        const startTime = Date.now();
        const testId = Date.now();
        
        try {
            // Simple HEAD request to check if URL is accessible
            const response = await fetch(streamUrl, { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            const loadTime = Date.now() - startTime;
            
            // Record test
            this.recordTest({
                id: testId,
                supplier,
                streamUrl,
                healthy: true,
                loadTime,
                timestamp: new Date().toISOString()
            });
            
            return { healthy: true, loadTime };
            
        } catch (error) {
            this.recordTest({
                id: testId,
                supplier,
                streamUrl, 
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return { healthy: false, loadTime: 0 };
        }
    }

    identifySupplier(streamUrl) {
        if (!streamUrl) return 'unknown';
        if (streamUrl.includes('topembed')) return 'topembed';
        if (streamUrl.includes('streamed.pk')) return 'streamed';
        return 'unknown';
    }

    extractCountryFromLeague(leagueName) {
        if (!leagueName) return null;
        
        const countryPatterns = {
            'England': 'UK', 'English': 'UK', 'Premier League': 'UK',
            'Spain': 'Spain', 'La Liga': 'Spain',
            'Italy': 'Italy', 'Serie A': 'Italy', 
            'Germany': 'Germany', 'Bundesliga': 'Germany',
            'France': 'France', 'Ligue 1': 'France',
            'USA': 'USA', 'NBA': 'USA', 'NFL': 'USA', 'MLB': 'USA',
            'Champions League': 'Europe', 'Europa League': 'Europe'
        };
        
        for (const [pattern, country] of Object.entries(countryPatterns)) {
            if (leagueName.includes(pattern)) return country;
        }
        
        return null;
    }

    trackDailyChanges() {
        const today = new Date().toDateString();
        
        if (!this.dailySnapshots[today]) {
            this.dailySnapshots[today] = {
                topembed: { totalMatches: this.metrics.topembed.totalMatches },
                streamed: { totalMatches: this.metrics.streamed.totalMatches }
            };
            
            // First snapshot of the day - no changes yet
            this.metrics.topembed.newMatchesToday = 0;
            this.metrics.streamed.newMatchesToday = 0;
        } else {
            // Calculate changes from previous snapshot (would need more sophisticated tracking)
            // For now, we'll just track if this is the first analysis of the day
        }
    }

    recordTest(testData) {
        this.testHistory.push(testData);
        
        // Keep only last 1000 tests to prevent memory issues
        if (this.testHistory.length > 1000) {
            this.testHistory = this.testHistory.slice(-500);
        }
    }

    resetCurrentMetrics() {
        // Reset counts but keep historical data
        ['topembed', 'streamed'].forEach(supplier => {
            this.metrics[supplier].totalMatches = 0;
            this.metrics[supplier].liveMatches = 0;
            this.metrics[supplier].upcomingMatches = 0;
            this.metrics[supplier].deadStreams = 0;
            this.metrics[supplier].workingStreams = 0;
            this.metrics[supplier].multiStreamMatches = 0;
            this.metrics[supplier].sportsCount = 0;
            this.metrics[supplier].leaguesCount = 0;
            this.metrics[supplier].countriesCount = 0;
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // DATA EXPORT FOR RESEARCH
    exportResearchData() {
        const researchData = {
            metadata: {
                exportTime: new Date().toISOString(),
                studyPeriod: `${new Date(this.startTime).toISOString()} to ${new Date().toISOString()}`,
                totalTests: this.testHistory.length,
                dataSource: '9kilos Research Dashboard'
            },
            
            supplierComparison: {
                topembed: this.metrics.topembed,
                streamed: this.metrics.streamed
            },
            
            performanceAnalysis: {
                topembed: {
                    successRate: this.metrics.topembed.successRate,
                    averageLoadTime: this.metrics.topembed.averageLoadTime,
                    reliabilityScore: this.calculateReliabilityScore('topembed')
                },
                streamed: {
                    successRate: this.metrics.streamed.successRate,
                    averageLoadTime: this.metrics.streamed.averageLoadTime,
                    reliabilityScore: this.calculateReliabilityScore('streamed')
                }
            },
            
            contentAnalysis: {
                topembed: {
                    coverageScore: this.calculateCoverageScore('topembed'),
                    contentDiversity: this.calculateDiversityScore('topembed')
                },
                streamed: {
                    coverageScore: this.calculateCoverageScore('streamed'),
                    contentDiversity: this.calculateDiversityScore('streamed')
                }
            },
            
            sampleTestData: this.testHistory.slice(-100) // Last 100 tests
        };
        
        return researchData;
    }

    calculateReliabilityScore(supplier) {
        const metrics = this.metrics[supplier];
        if (metrics.totalTests === 0) return 0;
        
        const successWeight = 0.6;
        const loadTimeWeight = 0.3;
        const coverageWeight = 0.1;
        
        const successScore = metrics.successRate / 100;
        const loadTimeScore = Math.max(0, 1 - (metrics.averageLoadTime / 10000)); // Normalize load time
        const coverageScore = Math.min(1, metrics.totalMatches / 100); // Normalize by 100 matches
        
        return (successScore * successWeight + loadTimeScore * loadTimeWeight + coverageScore * coverageWeight) * 100;
    }

    calculateCoverageScore(supplier) {
        const metrics = this.metrics[supplier];
        const maxPossible = {
            sports: 20,
            leagues: 50,
            countries: 30
        };
        
        const sportsScore = Math.min(1, metrics.sportsCount / maxPossible.sports);
        const leaguesScore = Math.min(1, metrics.leaguesCount / maxPossible.leagues);
        const countriesScore = Math.min(1, metrics.countriesCount / maxPossible.countries);
        
        return (sportsScore * 0.4 + leaguesScore * 0.4 + countriesScore * 0.2) * 100;
    }

    calculateDiversityScore(supplier) {
        const metrics = this.metrics[supplier];
        if (metrics.totalMatches === 0) return 0;
        
        // Simple diversity: more sports and leagues per match indicates better diversity
        const sportsPerMatch = metrics.sportsCount / metrics.totalMatches;
        const leaguesPerMatch = metrics.leaguesCount / metrics.totalMatches;
        
        return (sportsPerMatch * 0.6 + leaguesPerMatch * 0.4) * 100;
    }

    getMetrics() {
        return this.metrics;
    }
}
