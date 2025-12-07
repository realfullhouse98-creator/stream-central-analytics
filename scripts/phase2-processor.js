const fs = require('fs');

/**
 * 🏆 ENTERPRISE SPORTS DATA PROCESSOR - PHASE 2 (TOURNAMENTS IGNORED)
 * Version: 4.2-enterprise-enhanced
 */
class PerformanceMonitor {
    constructor() {
        this.startTime = Date.now();
        this.performanceData = {
            processingTimes: [],
            mergeRates: [],
            cacheEfficiency: {},
            memoryUsage: [],
            stepDurations: {}
        };
    }

    recordProcessingStep(stepName, duration, details = {}) {
        if (!this.performanceData.stepDurations[stepName]) {
            this.performanceData.stepDurations[stepName] = [];
        }
        this.performanceData.stepDurations[stepName].push(duration);
        
        this.performanceData.processingTimes.push(duration);
        
        // Auto-alert for slow processing
        if (duration > 1000) {
            console.log(`⚠️ ALERT: ${stepName} took ${duration}ms (above 1s threshold)`);
        }
    }

    trackMergeRate(inputCount, outputCount) {
        const rate = ((inputCount - outputCount) / inputCount * 100).toFixed(1);
        this.performanceData.mergeRates.push(parseFloat(rate));
    }

    trackCacheEfficiency(cacheName, hits, misses) {
        const efficiency = hits / (hits + misses) * 100;
        this.performanceData.cacheEfficiency[cacheName] = efficiency.toFixed(1);
    }

    trackMemoryUsage() {
        const usage = process.memoryUsage();
        this.performanceData.memoryUsage.push({
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
            timestamp: Date.now()
        });
    }

    generatePerformanceReport() {
        const totalTime = Date.now() - this.startTime;
        const avgStepTimes = {};
        
        Object.entries(this.performanceData.stepDurations).forEach(([step, times]) => {
            avgStepTimes[step] = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
        });

        return {
            total_processing_time_ms: totalTime,
            average_step_times: avgStepTimes,
            cache_efficiency: this.performanceData.cacheEfficiency,
            average_merge_rate: this.performanceData.mergeRates.length > 0 ? 
                (this.performanceData.mergeRates.reduce((a, b) => a + b, 0) / this.performanceData.mergeRates.length).toFixed(1) + '%' : '0%',
            memory_peak_mb: this.performanceData.memoryUsage.length > 0 ?
                Math.max(...this.performanceData.memoryUsage.map(m => m.heapUsed)) : 0,
            recommendations: this.generateOptimizationRecommendations()
        };
    }

    generateOptimizationRecommendations() {
        const recommendations = [];
        const avgTimes = this.performanceData.processingTimes;
        
        if (avgTimes.length > 0) {
            const avgTime = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;
            if (avgTime > 500) {
                recommendations.push("Consider optimizing slow processing steps");
            }
        }

        Object.entries(this.performanceData.cacheEfficiency).forEach(([cache, efficiency]) => {
            if (efficiency < 70) {
                recommendations.push(`Increase ${cache} cache size or improve key strategy`);
            }
        });

        return recommendations.length > 0 ? recommendations : ["Performance is optimal"];
    }
}

class EnhancedTeamNormalizerNoTournament {
    constructor() {
        this.teamAliases = new Map([
            ['man utd', 'manchester united'],
            ['man city', 'manchester city'],
            ['spurs', 'tottenham hotspur'],
            ['newcastle', 'newcastle united'],
            ['inter', 'internazionale'],
            ['atletico', 'atletico madrid'],
            ['psg', 'paris saint-germain'],
            ['rm', 'real madrid'],
            ['barca', 'barcelona'],
            ['mufc', 'manchester united'],
            ['mcfc', 'manchester city']
        ]);

        this.teamNormalizationCache = new Map();
    }

    normalizeTeamName(teamName) {
        if (!teamName) return '';
        
        // Cache check
        if (this.teamNormalizationCache.has(teamName)) {
            return this.teamNormalizationCache.get(teamName);
        }

        let normalized = teamName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '') // Remove special chars
            .replace(/\b(fc|cf|afc|sc|club)\b/g, '') // Remove common prefixes
            .replace(/\b(utd|united)\b/g, 'united')
            .replace(/\b(int|international)\b/g, 'international')
            .replace(/\b(athletic|atletico|atl)\b/g, 'athletic');

        // Handle known aliases
        if (this.teamAliases.has(normalized)) {
            normalized = this.teamAliases.get(normalized);
        }

        // Remove extra spaces and return
        normalized = normalized.replace(/\s+/g, ' ').trim();
        
        this.teamNormalizationCache.set(teamName, normalized);
        return normalized;
    }

    extractTeams(matchText) {
        if (!matchText) return [];
        
        // Remove common tournament-like phrases that might confuse team extraction
        const cleanedText = matchText
            .replace(/\b(premier league|la liga|serie a|bundesliga|nba|nfl|mlb|nhl)\b/gi, '')
            .replace(/\b(champions league|europa league|world cup|olympics)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (!cleanedText.includes(' vs ')) {
            return [this.normalizeTeamName(cleanedText)];
        }
        
        const [teamA, teamB] = cleanedText.split(' vs ');
        return [
            this.normalizeTeamName(teamA),
            this.normalizeTeamName(teamB)
        ];
    }

    getCacheStats() {
        return {
            cacheSize: this.teamNormalizationCache.size,
            aliasesCount: this.teamAliases.size
        };
    }
}

class EnterpriseSportsProcessorNoTournament {
    constructor() {
        this.results = {
            totalProcessed: 0,
            merged: 0,
            individual: 0,
            sportBreakdown: {},
            processingTime: 0,
            memoryUsage: 0,
            mergeStatistics: {},
            missingTimestamps: 0
        };
        this.startTime = Date.now();
        this.performanceMonitor = new PerformanceMonitor();
        this.teamNormalizer = new EnhancedTeamNormalizerNoTournament();

        this.sportConfigs = this.getEnhancedSportConfigs();

        // 🎯 PERFORMANCE CACHES
        this.teamNormalizationCache = new Map();
        this.dateCache = new Map();
        this.similarityCache = new Map();
        this.tokenCache = new Map();
        
        this.cacheStats = {
            teamNormalization: { hits: 0, misses: 0 },
            dateCache: { hits: 0, misses: 0 },
            similarityCache: { hits: 0, misses: 0 },
            tokenCache: { hits: 0, misses: 0 }
        };

        this.debugEnabled = true;
    }

    debugLog(category, message, data = null) {
        if (this.debugEnabled) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.log(`🔍 [${timestamp}] ${category}: ${message}`);
            if (data) console.log('   📊', data);
        }
    }

    getMatchDate(unixTimestamp) {
        if (this.dateCache.has(unixTimestamp)) {
            this.cacheStats.dateCache.hits++;
            return this.dateCache.get(unixTimestamp);
        }
        
        this.cacheStats.dateCache.misses++;
        if (!unixTimestamp) {
            this.results.missingTimestamps++;
            return null;
        }
        const date = new Date(unixTimestamp * 1000).toISOString().split('T')[0];
        this.dateCache.set(unixTimestamp, date);
        return date;
    }

    // Enhanced Team Normalization using the dedicated normalizer
    normalizeTeamName(teamName) {
        if (this.teamNormalizationCache.has(teamName)) {
            this.cacheStats.teamNormalization.hits++;
            return this.teamNormalizationCache.get(teamName);
        }
        
        this.cacheStats.teamNormalization.misses++;
        const normalized = this.teamNormalizer.normalizeTeamName(teamName);
        this.teamNormalizationCache.set(teamName, normalized);
        return normalized;
    }

    extractTeams(matchText) {
        return this.teamNormalizer.extractTeams(matchText);
    }

    hasSameTeams(matchA, matchB) {
        const cacheKey = `${matchA.match}|${matchB.match}`;
        if (this.similarityCache.has(cacheKey)) {
            this.cacheStats.similarityCache.hits++;
            return this.similarityCache.get(cacheKey);
        }

        this.cacheStats.similarityCache.misses++;
        const teamsA = this.extractTeams(matchA.match);
        const teamsB = this.extractTeams(matchB.match);

        let result = false;
        if (teamsA.length === 2 && teamsB.length === 2) {
            // Check both orders for team matching
            result = (teamsA[0] === teamsB[0] && teamsA[1] === teamsB[1]) ||
                     (teamsA[0] === teamsB[1] && teamsA[1] === teamsB[0]);
        } else {
            // For single team or multiple teams, check inclusion
            result = teamsA.every(t => teamsB.includes(t)) && teamsB.every(t => teamsA.includes(t));
        }

        this.similarityCache.set(cacheKey, result);
        return result;
    }

    advancedTokenize(text) {
        if (this.tokenCache.has(text)) {
            this.cacheStats.tokenCache.hits++;
            return this.tokenCache.get(text);
        }
        
        this.cacheStats.tokenCache.misses++;
        const tokens = text
            .replace(/[^\w\s-]/g, ' ')
            .split(/[\s\-]+/)
            .filter(t => t.length > 2)
            .map(t => t.toLowerCase());
        
        this.tokenCache.set(text, tokens);
        return tokens;
    }

    tokensMatch(tokenA, tokenB) {
        if (tokenA === tokenB) return true;
        if (tokenA.includes(tokenB) || tokenB.includes(tokenA)) return true;
        
        // Handle common abbreviations
        const abbreviations = {
            'utd': 'united',
            'int': 'international',
            'fc': '',
            'afc': ''
        };
        
        const normalizedA = abbreviations[tokenA] || tokenA;
        const normalizedB = abbreviations[tokenB] || tokenB;
        
        return normalizedA === normalizedB || 
               normalizedA.includes(normalizedB) || 
               normalizedB.includes(normalizedA);
    }

    // Multi-Factor Match Scoring (No Tournament)
    calculateAdvancedMatchScore(matchA, matchB, sport) {
        const startTime = Date.now();
        
        if (matchA.source === matchB.source && matchA.source !== 'wendy') {
            this.performanceMonitor.recordProcessingStep('match_scoring', Date.now() - startTime);
            return 0;
        }

        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        
        // Factor 1: Team Similarity (60% weight)
        const teamSimilarity = this.calculateTeamSimilarityScore(matchA.match, matchB.match);
        
        // Factor 2: Time Proximity (30% weight)
        const timeProximity = this.calculateTimeProximityScore(matchA.unix_timestamp, matchB.unix_timestamp);
        
        // Factor 3: Source Compatibility (10% weight)
        const sourceCompatibility = this.assessSourceCompatibility(matchA.source, matchB.source);

        const factors = {
            teamSimilarity: teamSimilarity,
            timeProximity: timeProximity,
            sourceCompatibility: sourceCompatibility
        };

        const finalScore = this.calculateWeightedScore(factors, sportConfig);
        
        // Auto-merge for perfect team matches with close timestamps
        if (teamSimilarity >= 0.95 && timeProximity >= 0.8) {
            this.performanceMonitor.recordProcessingStep('match_scoring', Date.now() - startTime);
            return 1.0;
        }

        this.performanceMonitor.recordProcessingStep('match_scoring', Date.now() - startTime);
        return Math.min(1.0, finalScore);
    }

    calculateTeamSimilarityScore(teamA, teamB) {
        const teamsA = this.extractTeams(teamA);
        const teamsB = this.extractTeams(teamB);
        
        // Different number of teams = no match
        if (teamsA.length !== teamsB.length) return 0;
        
        let totalScore = 0;
        
        if (teamsA.length === 2) {
            // Two teams - check both orders
            const order1 = this.calculateStringSimilarity(teamsA[0], teamsB[0]) + 
                           this.calculateStringSimilarity(teamsA[1], teamsB[1]);
            const order2 = this.calculateStringSimilarity(teamsA[0], teamsB[1]) + 
                           this.calculateStringSimilarity(teamsA[1], teamsB[0]);
            
            totalScore = Math.max(order1, order2) / 2;
        } else {
            // Single team or multiple teams
            teamsA.forEach((teamA, index) => {
                const teamB = teamsB[index];
                const similarity = this.calculateStringSimilarity(teamA, teamB);
                totalScore += similarity;
            });
            totalScore /= teamsA.length;
        }
        
        return totalScore;
    }

    calculateStringSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;
        
        const tokens1 = this.advancedTokenize(str1);
        const tokens2 = this.advancedTokenize(str2);
        
        if (tokens1.length === 0 || tokens2.length === 0) return 0;
        
        const intersection = tokens1.filter(token => 
            tokens2.some(t2 => this.tokensMatch(token, t2))
        ).length;
        
        const union = new Set([...tokens1, ...tokens2]).size;
        
        return union > 0 ? intersection / union : 0;
    }

    calculateTimeProximityScore(timestampA, timestampB) {
        if (!timestampA || !timestampB) return 0.5; // Neutral score for missing timestamps
        
        const timeDiff = Math.abs(timestampA - timestampB);
        const sportConfig = this.sportConfigs['default']; // Use default time window
        
        if (timeDiff > sportConfig.timeWindow) return 0;
        return 1 - (timeDiff / sportConfig.timeWindow);
    }

    assessSourceCompatibility(sourceA, sourceB) {
        // Wendy is more compatible for merging
        if (sourceA === 'wendy' || sourceB === 'wendy') return 0.8;
        // Different sources are generally good for merging
        if (sourceA !== sourceB) return 0.6;
        // Same source (except wendy) - less compatible
        return 0.2;
    }

    calculateWeightedScore(factors, sportConfig) {
        return (factors.teamSimilarity * sportConfig.teamSimilarityWeight) +
               (factors.timeProximity * sportConfig.timeWeight) +
               (factors.sourceCompatibility * sportConfig.sourceWeight);
    }

    // Sport-Specific Config (Tournament-Free)
    getEnhancedSportConfigs() {
        return {
            'Football': { 
                mergeThreshold: 0.50,
                timeWindow: 7200,
                teamSimilarityWeight: 0.6,
                timeWeight: 0.3,
                sourceWeight: 0.1,
                requireExactTeamOrder: true
            },
            'Basketball': {
                mergeThreshold: 0.50,
                timeWindow: 3600,
                teamSimilarityWeight: 0.6,
                timeWeight: 0.3,
                sourceWeight: 0.1,
                handleCollegePrefixes: true
            },
            'Tennis': {
                mergeThreshold: 0.50,
                timeWindow: 3600,
                teamSimilarityWeight: 0.5,
                timeWeight: 0.4,
                sourceWeight: 0.1,
                allowPlayerOrderSwap: true
            },
            'American Football': {
                mergeThreshold: 0.50,
                timeWindow: 86400,
                teamSimilarityWeight: 0.7,
                timeWeight: 0.2,
                sourceWeight: 0.1,
                handleNFLTeams: true
            },
            'Ice Hockey': {
                mergeThreshold: 0.50,
                timeWindow: 3600,
                teamSimilarityWeight: 0.6,
                timeWeight: 0.3,
                sourceWeight: 0.1
            },
            'default': {
                mergeThreshold: 0.50,
                timeWindow: 3600,
                teamSimilarityWeight: 0.6,
                timeWeight: 0.3,
                sourceWeight: 0.1
            }
        };
    }

    // Advanced Cluster Merging
    mergeClusterWithConfidence(cluster, sport) {
        const startTime = Date.now();
        
        if (cluster.length === 0) return null;
        
        const baseMatch = this.selectBestBaseMatch(cluster, sport);
        const confidence = this.calculateMergeConfidence(cluster, sport);
        
        const mergedSources = this.mergeAllSources(cluster);
        const bestTimestamp = this.selectBestTimestamp(cluster);
        const bestMatchName = this.selectBestMatchName(cluster, sport);
        
        const result = {
            unix_timestamp: bestTimestamp,
            sport: sport,
            match: bestMatchName,
            sources: mergedSources,
            confidence: confidence,
            merged: cluster.length > 1,
            merged_count: cluster.length,
            cluster_details: {
                original_sources: cluster.map(m => m.source),
                team_consistency: this.calculateTeamConsistency(cluster),
                time_consistency: this.calculateTimeConsistency(cluster),
                merge_quality: this.calculateClusterQuality(cluster)
            },
            processing_metadata: {
                processed_at: new Date().toISOString(),
                processor_version: '4.2-enhanced-no-tournament',
                sport_specific_rules_applied: this.getAppliedRules(sport)
            }
        };

        this.performanceMonitor.recordProcessingStep('cluster_merging', Date.now() - startTime);
        return result;
    }

    selectBestBaseMatch(cluster, sport) {
        // Prefer matches with more streams and better data quality
        const scoredMatches = cluster.map(match => ({
            match,
            score: this.calculateMatchQualityScore(match, sport)
        }));
        
        scoredMatches.sort((a, b) => b.score - a.score);
        return scoredMatches[0].match;
    }

    calculateMatchQualityScore(match, sport) {
        let score = 0;
        
        // More streams = higher quality
        const totalStreams = Object.values(match.sources || {}).flat().length;
        score += Math.min(totalStreams * 10, 50);
        
        // Valid timestamp
        if (match.unix_timestamp) {
            const now = Date.now() / 1000;
            const isFuture = match.unix_timestamp > now;
            const isRecent = (now - match.unix_timestamp) < 86400 * 7;
            
            if (isFuture || isRecent) {
                score += 30;
            }
        }
        
        // Good team format
        const teams = this.extractTeams(match.match);
        if (teams.length === 2 && teams.every(team => team.length > 2)) {
            score += 20;
        }
        
        return score;
    }

    calculateMergeConfidence(cluster, sport) {
        if (cluster.length === 1) return 1.0;
        
        const factors = {
            teamConsistency: this.calculateTeamConsistency(cluster),
            timeConsistency: this.calculateTimeConsistency(cluster),
            sourceDiversity: this.calculateSourceDiversity(cluster)
        };
        
        return (factors.teamConsistency * 0.5 + 
                factors.timeConsistency * 0.3 + 
                factors.sourceDiversity * 0.2);
    }

    calculateTeamConsistency(cluster) {
        const allTeams = cluster.map(match => this.extractTeams(match.match));
        const baseTeams = allTeams[0];
        
        let consistentCount = 0;
        for (let i = 1; i < allTeams.length; i++) {
            if (this.areTeamsEquivalent(baseTeams, allTeams[i])) {
                consistentCount++;
            }
        }
        
        return consistentCount / (cluster.length - 1);
    }

    areTeamsEquivalent(teamsA, teamsB) {
        if (teamsA.length !== teamsB.length) return false;
        
        if (teamsA.length === 2) {
            return (teamsA[0] === teamsB[0] && teamsA[1] === teamsB[1]) ||
                   (teamsA[0] === teamsB[1] && teamsA[1] === teamsB[0]);
        }
        
        return teamsA.every(t => teamsB.includes(t)) && teamsB.every(t => teamsA.includes(t));
    }

    calculateTimeConsistency(cluster) {
        const timestamps = cluster.map(m => m.unix_timestamp).filter(t => t);
        if (timestamps.length < 2) return 1.0;
        
        const avgTimestamp = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
        const variances = timestamps.map(t => Math.abs(t - avgTimestamp));
        const maxVariance = Math.max(...variances);
        
        return Math.max(0, 1 - (maxVariance / 3600)); // 1 hour normalization
    }

    calculateSourceDiversity(cluster) {
        const uniqueSources = new Set(cluster.map(m => m.source));
        return uniqueSources.size / cluster.length;
    }

    calculateClusterQuality(cluster) {
        const qualityScores = cluster.map(match => 
            this.calculateMatchQualityScore(match, 'default')
        );
        return qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    }

    mergeAllSources(cluster) {
        const allSources = { tom: [], sarah: [], wendy: [] };
        
        cluster.forEach(match => {
            ['tom', 'sarah', 'wendy'].forEach(source => {
                if (match.sources[source]) {
                    match.sources[source].forEach(stream => {
                        if (!allSources[source].includes(stream)) {
                            allSources[source].push(stream);
                        }
                    });
                }
            });
        });
        
        return allSources;
    }

    selectBestTimestamp(cluster) {
        // Prefer timestamps that are most common or have highest quality matches
        const timestampScores = {};
        
        cluster.forEach(match => {
            if (match.unix_timestamp) {
                if (!timestampScores[match.unix_timestamp]) {
                    timestampScores[match.unix_timestamp] = 0;
                }
                timestampScores[match.unix_timestamp] += this.calculateMatchQualityScore(match, 'default');
            }
        });
        
        const bestTimestamp = Object.entries(timestampScores)
            .sort(([,a], [,b]) => b - a)[0];
            
        return bestTimestamp ? parseInt(bestTimestamp[0]) : cluster[0].unix_timestamp;
    }

    selectBestMatchName(cluster, sport) {
        if (cluster.length === 1) return cluster[0].match;
        
        // Group by team combinations to find the most common format
        const teamFormats = new Map();
        
        cluster.forEach(match => {
            const teams = this.extractTeams(match.match);
            const teamKey = teams.sort().join('|');
            
            if (!teamFormats.has(teamKey)) {
                teamFormats.set(teamKey, []);
            }
            teamFormats.get(teamKey).push(match.match);
        });
        
        // Find the most common team combination
        let bestTeamKey = '';
        let maxCount = 0;
        
        for (const [teamKey, matches] of teamFormats) {
            if (matches.length > maxCount) {
                maxCount = matches.length;
                bestTeamKey = teamKey;
            }
        }
        
        // Return the most descriptive match name for this team combination
        const matchesWithBestTeams = teamFormats.get(bestTeamKey);
        return this.selectMostDescriptiveName(matchesWithBestTeams, sport);
    }

    selectMostDescriptiveName(matchNames, sport) {
        const scoredNames = matchNames.map(name => {
            let score = 0;
            
            if (name.includes(' vs ')) score += 30;
            if (!name.toLowerCase().includes('vs.')) score += 10;
            
            const teams = this.extractTeams(name);
            if (teams.length === 2) {
                // Prefer longer team names (more descriptive)
                const totalLength = teams[0].length + teams[1].length;
                score += Math.min(totalLength / 10, 20);
                
                // Prefer names without extra words
                const extraWords = name.split(' ').length - (teams[0].split(' ').length + teams[1].split(' ').length + 2);
                score -= extraWords * 5;
            }
            
            return { name, score };
        });
        
        scoredNames.sort((a, b) => b.score - a.score);
        return scoredNames[0].name;
    }

    getAppliedRules(sport) {
        const config = this.sportConfigs[sport] || this.sportConfigs.default;
        const rules = [];
        
        if (config.requireExactTeamOrder) rules.push('exact_team_order');
        if (config.allowPlayerOrderSwap) rules.push('player_order_swap');
        if (config.handleCollegePrefixes) rules.push('college_prefix_handling');
        if (config.handleNFLTeams) rules.push('nfl_team_standardization');
        
        return rules.length > 0 ? rules : ['default_rules'];
    }

    // Find and Merge Matches
    findAndMergeMatches(matches, sport) {
        const startTime = Date.now();
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();

        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;

            const cluster = [matches[i]];
            processed.add(i);

            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                const score = this.calculateAdvancedMatchScore(matches[i], matches[j], sport);
                if (score >= sportConfig.mergeThreshold) {
                    cluster.push(matches[j]);
                    processed.add(j);
                }
            }

            clusters.push(cluster);
        }

        this.performanceMonitor.recordProcessingStep('find_merge_matches', Date.now() - startTime);
        return clusters;
    }

    processSport(sport, matches) {
        const startTime = Date.now();
        this.debugLog('PROCESSING', `Processing ${matches.length} ${sport} matches`);
        
        const clusters = this.findAndMergeMatches(matches, sport);
        const processedMatches = [];

        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                processedMatches.push({ 
                    ...cluster[0], 
                    merged: false,
                    confidence: 1.0
                });
                this.results.individual++;
            } else {
                const mergedMatch = this.mergeClusterWithConfidence(cluster, sport);
                processedMatches.push(mergedMatch);
                this.results.merged++;
            }
        });

        this.results.totalProcessed += processedMatches.length;

        this.results.mergeStatistics[sport] = {
            input: matches.length,
            output: processedMatches.length,
            clusters: clusters.length,
            mergedClusters: clusters.filter(c => c.length > 1).length,
            efficiency: ((matches.length - processedMatches.length) / matches.length * 100).toFixed(1) + '%',
            average_confidence: processedMatches.length > 0 ? 
                (processedMatches.reduce((sum, m) => sum + (m.confidence || 1), 0) / processedMatches.length).toFixed(2) : 1.0
        };

        this.performanceMonitor.trackMergeRate(matches.length, processedMatches.length);
        this.performanceMonitor.recordProcessingStep(`process_sport_${sport}`, Date.now() - startTime);
        
        return {
            summary: this.results.mergeStatistics[sport],
            matches: processedMatches
        };
    }

    loadStandardizedData() {
        const startTime = Date.now();
        const filePath = './standardization-UNIVERSAL.json';
        if (!fs.existsSync(filePath)) throw new Error('Phase 1 output not found.');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.performanceMonitor.recordProcessingStep('load_data', Date.now() - startTime);
        return data;
    }

    groupBySport(matches) {
        const startTime = Date.now();
        const sportGroups = {};
        matches.forEach(match => {
            const sport = match.sport || 'Unknown';
            if (!sportGroups[sport]) sportGroups[sport] = [];
            sportGroups[sport].push(match);
            this.results.sportBreakdown[sport] = (this.results.sportBreakdown[sport] || 0) + 1;
        });
        this.performanceMonitor.recordProcessingStep('group_by_sport', Date.now() - startTime);
        return sportGroups;
    }

    async processStandardizedData() {
        const pipelineStart = Date.now();
        console.log('🚀 STARTING ENHANCED PHASE 2 PROCESSOR (NO TOURNAMENT)');
        
        try {
            const standardizedData = this.loadStandardizedData();
            const sportGroups = this.groupBySport(standardizedData.matches);

            const processedData = {};
            for (const [sport, matches] of Object.entries(sportGroups)) {
                processedData[sport] = this.processSport(sport, matches);
            }

            // Update cache efficiency stats
            this.performanceMonitor.trackCacheEfficiency('team_normalization', 
                this.cacheStats.teamNormalization.hits, this.cacheStats.teamNormalization.misses);
            this.performanceMonitor.trackCacheEfficiency('date_cache',
                this.cacheStats.dateCache.hits, this.cacheStats.dateCache.misses);
            this.performanceMonitor.trackCacheEfficiency('similarity_cache',
                this.cacheStats.similarityCache.hits, this.cacheStats.similarityCache.misses);
            this.performanceMonitor.trackCacheEfficiency('token_cache',
                this.cacheStats.tokenCache.hits, this.cacheStats.tokenCache.misses);

            this.performanceMonitor.trackMemoryUsage();

            // 🎯 CREATE FINAL OUTPUT
            const masterData = {
                processed_at: new Date().toISOString(),
                processor_version: '4.2-enterprise-enhanced-no-tournament',
                summary: {
                    total_sports: Object.keys(processedData).length,
                    total_matches: this.results.totalProcessed,
                    merged_matches: this.results.merged,
                    individual_matches: this.results.individual,
                    processing_time_ms: Date.now() - this.startTime,
                    merge_statistics: this.results.mergeStatistics,
                    performance_report: this.performanceMonitor.generatePerformanceReport(),
                    cache_stats: {
                        team_normalization: this.teamNormalizer.getCacheStats(),
                        internal_caches: this.cacheStats
                    }
                },
                matches: []
            };

            Object.values(processedData).forEach(sportData => {
                masterData.matches.push(...sportData.matches);
            });

            fs.writeFileSync('./master-data.json', JSON.stringify(masterData, null, 2));
            
            const totalTime = Date.now() - pipelineStart;
            console.log(`🎉 Phase 2 completed in ${totalTime}ms!`);
            console.log(`📊 Processed ${this.results.totalProcessed} matches (${this.results.merged} merged)`);
            console.log(`💾 Master data saved as master-data.json`);
            
            // Log performance summary
            const perfReport = this.performanceMonitor.generatePerformanceReport();
            console.log(`📈 Performance: ${perfReport.average_merge_rate} merge rate`);
            console.log(`⚡ Cache Efficiency: ${Object.values(perfReport.cache_efficiency).join('% / ')}%`);

        } catch (error) {
            console.error('💥 Phase 2 processor failed:', error);
            throw error;
        }
    }
}

if (require.main === module) {
    const processor = new EnterpriseSportsProcessorNoTournament();
    processor.processStandardizedData().catch(console.error);
}

module.exports = EnterpriseSportsProcessorNoTournament;
