const fs = require('fs');
const path = require('path');

/**
 * 🏆 ENTERPRISE SPORTS DATA PROCESSOR - PHASE 2
 * Features: Date-based merging, team normalization, performance optimized
 * Version: 4.0-enterprise
 */
class EnterpriseSportsProcessor {
    constructor() {
        this.results = {
            totalProcessed: 0,
            merged: 0,
            individual: 0,
            sportBreakdown: {},
            processingTime: 0,
            memoryUsage: 0,
            mergeStatistics: {}
        };
        this.startTime = Date.now();
        
        // 🎯 COMPLETE SPORT CONFIGURATION
        this.sportConfigs = {
            'Football': { mergeThreshold: 0.50, timeWindow: 600 },
            'American Football': { mergeThreshold: 0.50, timeWindow: 600 },
            'Basketball': { mergeThreshold: 0.50, timeWindow: 600 },
            'Baseball': { mergeThreshold: 0.50, timeWindow: 480 },
            'Ice Hockey': { mergeThreshold: 0.50, timeWindow: 600 },
            'Hockey': { mergeThreshold: 0.50, timeWindow: 600 },
            'Tennis': { mergeThreshold: 0.50, timeWindow: 480 },
            'Cricket': { mergeThreshold: 0.50, timeWindow: 480 },
            'Rugby': { mergeThreshold: 0.50, timeWindow: 480 },
            'Rugby Union': { mergeThreshold: 0.50, timeWindow: 480 },
            'Golf': { mergeThreshold: 0.50, timeWindow: 480 },
            'MMA': { mergeThreshold: 0.50, timeWindow: 480 },
            'Motosport': { mergeThreshold: 0.50, timeWindow: 480 },
            'Motor-sports': { mergeThreshold: 0.50, timeWindow: 480 },
            'Volleyball': { mergeThreshold: 0.50, timeWindow: 480 },
            'Australian Football': { mergeThreshold: 0.50, timeWindow: 480 },
            'Aussie Rules': { mergeThreshold: 0.50, timeWindow: 480 },
            'Darts': { mergeThreshold: 0.50, timeWindow: 480 },
            'Equestrian': { mergeThreshold: 0.50, timeWindow: 480 },
            'Handball': { mergeThreshold: 0.50, timeWindow: 480 },
            'Snooker': { mergeThreshold: 0.50, timeWindow: 480 },
            'Boxing': { mergeThreshold: 0.50, timeWindow: 480 },
            'Badminton': { mergeThreshold: 0.50, timeWindow: 480 },
            'Winter-sports': { mergeThreshold: 0.50, timeWindow: 480 },
            'Wintersports': { mergeThreshold: 0.50, timeWindow: 480 },
            'Fighting': { mergeThreshold: 0.50, timeWindow: 480 },
            'Futsal': { mergeThreshold: 0.50, timeWindow: 480 },
            'default': { mergeThreshold: 0.50, timeWindow: 480 }
        };

        // 🎯 PERFORMANCE CACHES
        this.teamNormalizationCache = new Map();
        this.dateCache = new Map();
        this.similarityCache = new Map();
        
        this.debugEnabled = true;
    }

    // 🎯 DEBUG UTILITIES
    debugLog(category, message, data = null) {
        if (this.debugEnabled) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.log(`🔍 [${timestamp}] ${category}: ${message}`);
            if (data) console.log(`   📊`, data);
        }
    }

    performanceMark(startTime, operation) {
        const duration = Date.now() - startTime;
        this.debugLog('PERFORMANCE', `${operation} completed in ${duration}ms`);
        return duration;
    }

    // 🎯 CORE UTILITIES
    getMatchDate(unixTimestamp) {
        const cached = this.dateCache.get(unixTimestamp);
        if (cached) return cached;
        
        const date = new Date(unixTimestamp * 1000).toISOString().split('T')[0];
        this.dateCache.set(unixTimestamp, date);
        return date;
    }

    normalizeTeamName(teamName) {
        if (this.teamNormalizationCache.has(teamName)) {
            return this.teamNormalizationCache.get(teamName);
        }

        const normalized = teamName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^fc /, '')
            .replace(/ united$/, ' utd')
            .replace(/^man utd$/, 'manchester utd')
            .replace(/^man city$/, 'manchester city')
            .replace(/^spurs$/, 'tottenham')
            .replace(/^korea$/, 'south korea')
            .replace(/^north korea$/, 'korea dpr')
            .replace(/^dpr korea$/, 'korea dpr')
            .replace(/^usa$/, 'united states')
            .replace(/^u\.s\.a\.$/, 'united states')
            .replace(/^uk$/, 'united kingdom')
            .replace(/^u\.k\.$/, 'united kingdom');

        this.teamNormalizationCache.set(teamName, normalized);
        return normalized;
    }

    extractTeams(matchText) {
        if (!matchText.includes(' vs ')) {
            return [this.normalizeTeamName(matchText)];
        }
        
        const [teamA, teamB] = matchText.split(' vs ');
        return [
            this.normalizeTeamName(teamA),
            this.normalizeTeamName(teamB)
        ];
    }

    hasSameTeams(matchA, matchB) {
        const cacheKey = `${matchA.match}|${matchB.match}`;
        if (this.similarityCache.has(cacheKey)) {
            return this.similarityCache.get(cacheKey);
        }

        const teamsA = this.extractTeams(matchA.match);
        const teamsB = this.extractTeams(matchB.match);
        
        let result = false;
        
        if (teamsA.length !== teamsB.length) {
            result = false;
        } else if (teamsA.length === 2 && teamsB.length === 2) {
            result = (teamsA[0] === teamsB[0] && teamsA[1] === teamsB[1]) ||
                   (teamsA[0] === teamsB[1] && teamsA[1] === teamsB[0]);
        } else {
            result = teamsA.every(team => teamsB.includes(team)) && 
                   teamsB.every(team => teamsA.includes(team));
        }

        this.similarityCache.set(cacheKey, result);
        return result;
    }

    // 🎯 TENNIS-SPECIFIC LOGIC
    extractPlayers(matchText) {
        if (!matchText.includes(' vs ')) {
            return [matchText.split(' ')];
        }
        return matchText.split(' vs ').map(player => 
            player.trim().toLowerCase().split(' ').filter(t => t.length > 1)
        );
    }

    playersMatch(playerA, playerB) {
        if (playerA.length !== playerB.length) return false;
        return playerA.every((token, idx) => this.tokensMatch(token, playerB[idx]));
    }

    hasTennisPlayerPattern(match) {
        const text = match.match || '';
        return /[A-Z]\./.test(text) || /\//.test(text);
    }

    // 🎯 TEXT PROCESSING
    advancedTokenize(text) {
        return text
            .replace(/[^\w\s-]/g, ' ')
            .split(/[\s\-]+/)
            .filter(t => t.length > 2)
            .map(t => t.toLowerCase());
    }

    tokensMatch(tokenA, tokenB) {
        if (tokenA === tokenB) return true;
        if (tokenA.includes(tokenB) || tokenB.includes(tokenA)) return true;
        
        const abbreviations = {
            'fc': 'football club',
            'utd': 'united', 
            'afc': 'association football club',
            'vs': 'versus'
        };
        
        const expandedA = abbreviations[tokenA] || tokenA;
        const expandedB = abbreviations[tokenB] || tokenB;
        
        return expandedA === expandedB || expandedA.includes(expandedB) || expandedB.includes(expandedA);
    }

    // 🎯 MAIN PROCESSING PIPELINE
    async processStandardizedData() {
        const pipelineStart = Date.now();
        console.log('🚀 ENTERPRISE PHASE 2 - PROCESSING STARTED\n');
        
        try {
            // 🎯 MEMORY BASELINE
            this.results.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            this.debugLog('SYSTEM', `Initial memory: ${this.results.memoryUsage.toFixed(2)} MB`);

            // 🎯 LOAD DATA
            const loadStart = Date.now();
            const standardizedData = this.loadStandardizedData();
            this.performanceMark(loadStart, 'Data loading');
            this.debugLog('DATA', `Loaded ${standardizedData.matches.length} standardized matches`);

            // 🎯 GROUP BY SPORT
            const groupStart = Date.now();
            const sportGroups = this.groupBySport(standardizedData.matches);
            this.performanceMark(groupStart, 'Sport grouping');
            this.debugLog('PROCESSING', `Found ${Object.keys(sportGroups).length} sports`);

            // 🎯 PROCESS EACH SPORT
            const processedData = {};
            const sports = Object.entries(sportGroups);
            
            for (let i = 0; i < sports.length; i++) {
                const [sport, matches] = sports[i];
                const sportStart = Date.now();
                
                this.debugLog('SPORT', `Processing ${sport} (${i + 1}/${sports.length})`, {
                    matches: matches.length,
                    config: this.sportConfigs[sport] || this.sportConfigs.default
                });
                
                processedData[sport] = this.processSport(sport, matches);
                this.performanceMark(sportStart, `${sport} processing`);

                // 🎯 MEMORY MANAGEMENT
                if (i % 3 === 0) {
                    this.clearCache();
                    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
                    this.debugLog('MEMORY', `Cache cleared - Current: ${currentMemory.toFixed(2)} MB`);
                }
            }

            // 🎯 CREATE FINAL OUTPUT
            const outputStart = Date.now();
            this.createMasterData(processedData, standardizedData);
            this.performanceMark(outputStart, 'Master data creation');

            // 🎯 FINAL RESULTS
            this.results.processingTime = Date.now() - this.startTime;
            this.logResults();
            this.performanceMark(pipelineStart, 'Total Phase 2 processing');

            return processedData;
            
        } catch (error) {
            this.debugLog('ERROR', `Phase 2 failed: ${error.message}`);
            this.saveErrorState(error);
            throw error;
        }
    }

    loadStandardizedData() {
        const filePath = './standardization-UNIVERSAL.json';
        if (!fs.existsSync(filePath)) {
            throw new Error('Phase 1 output not found. Run universal-standardizer first.');
        }
        
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.debugLog('VALIDATION', `Data structure verified`, {
                matches: data.matches?.length || 0,
                sports: [...new Set(data.matches?.map(m => m.sport))].length
            });
            return data;
        } catch (error) {
            throw new Error(`Failed to parse standardized data: ${error.message}`);
        }
    }

    groupBySport(matches) {
        const sportGroups = {};
        let missingSportCount = 0;
        
        matches.forEach(match => {
            const sport = match.sport || 'Unknown';
            if (sport === 'Unknown') missingSportCount++;
            
            if (!sportGroups[sport]) {
                sportGroups[sport] = [];
                this.results.sportBreakdown[sport] = 0;
            }
            
            sportGroups[sport].push(match);
            this.results.sportBreakdown[sport]++;
        });

        if (missingSportCount > 0) {
            this.debugLog('WARNING', `${missingSportCount} matches without sport classification`);
        }
        
        return sportGroups;
    }

    processSport(sport, matches) {
        this.debugLog('CLUSTERING', `Starting duplicate detection for ${sport}`);

        const clusters = this.findAndMergeMatches(matches, sport);
        const processedMatches = [];
        
        // 🎯 PROCESS CLUSTERS
        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                processedMatches.push(this.createFinalMatch(cluster[0]));
                this.results.individual++;
            } else {
                const merged = this.mergeCluster(cluster, sport);
                processedMatches.push(merged);
                this.results.merged++;
                
                this.debugLog('MERGE', `Created merged cluster`, {
                    sport: sport,
                    match: cluster[0].match,
                    sources: cluster.map(m => m.source),
                    count: cluster.length
                });
            }
        });
        
        this.results.totalProcessed += processedMatches.length;

        // 🎯 UPDATE STATISTICS
        this.results.mergeStatistics[sport] = {
            input: matches.length,
            output: processedMatches.length,
            clusters: clusters.length,
            mergedClusters: clusters.filter(c => c.length > 1).length,
            efficiency: ((matches.length - processedMatches.length) / matches.length * 100).toFixed(1) + '%'
        };

        return {
            summary: this.results.mergeStatistics[sport],
            matches: processedMatches
        };
    }

    findAndMergeMatches(matches, sport) {
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();
        
        this.debugLog('ALGORITHM', `Using merge threshold: ${sportConfig.mergeThreshold} for ${sport}`);

        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;
            
            const cluster = [matches[i]];
            processed.add(i);
            
            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                
                const score = this.calculateMatchScore(matches[i], matches[j], sport);
                
                if (score >= sportConfig.mergeThreshold) {
                    this.debugLog('MATCH', `High similarity detected`, {
                        matchA: matches[i].match,
                        matchB: matches[j].match,
                        score: score.toFixed(3),
                        sources: [matches[i].source, matches[j].source]
                    });
                    
                    cluster.push(matches[j]);
                    processed.add(j);
                }
            }
            
            clusters.push(cluster);
            
            if (cluster.length > 1) {
                this.debugLog('CLUSTER', `Created multi-match cluster`, {
                    baseMatch: cluster[0].match,
                    size: cluster.length,
                    sources: cluster.map(m => m.source)
                });
            }
        }
        
        this.debugLog('RESULTS', `Clustering completed for ${sport}`, {
            totalClusters: clusters.length,
            multiMatchClusters: clusters.filter(c => c.length > 1).length
        });
        
        return clusters;
    }

    calculateMatchScore(matchA, matchB, sport) {
        // 🎯 SAME SOURCE PROTECTION
        if (matchA.source === matchB.source && matchA.source !== 'wendy') {
            this.debugLog('FILTER', `Same source blocked`, {
                source: matchA.source,
                matchA: matchA.match,
                matchB: matchB.match
            });
            return 0;
        }
        
        // 🎯 DATE-BASED HIGH CONFIDENCE MERGE
        const dateA = this.getMatchDate(matchA.unix_timestamp);
        const dateB = this.getMatchDate(matchB.unix_timestamp);
        const sameDate = dateA === dateB;
        const sameTeams = this.hasSameTeams(matchA, matchB);
        
        if (sameDate && sameTeams) {
            this.debugLog('AUTO-MERGE', `Date-based high confidence merge`, {
                date: dateA,
                teams: matchA.match,
                sources: [matchA.source, matchB.source]
            });
            return 1.0;
        }
        
        // 🎯 STANDARD SIMILARITY CALCULATION
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const textA = matchA.match.toLowerCase().trim();
        const textB = matchB.match.toLowerCase().trim();
        
        const tokensA = this.advancedTokenize(textA);
        const tokensB = this.advancedTokenize(textB);
        
        const common = tokensA.filter(tA => 
            tokensB.some(tB => this.tokensMatch(tA, tB))
        );
        
        let score = common.length / Math.max(tokensA.length, tokensB.length);
        
        // 🎯 SPORT-SPECIFIC BOOSTS
        if (sport === 'Tennis' && this.hasTennisPlayerPattern(matchA) && this.hasTennisPlayerPattern(matchB)) {
            const playersA = this.extractPlayers(textA);
            const playersB = this.extractPlayers(textB);
            const playerMatch = playersA.length === playersB.length && 
                               playersA.every((player, idx) => this.playersMatch(player, playersB[idx]));
            
            if (playerMatch) {
                this.debugLog('TENNIS', `Tennis exact player match`, { score: 1.0 });
                return 1.0;
            }
            score += 0.15;
        }
        
        if (matchA.source === 'wendy' || matchB.source === 'wendy') {
            score += 0.1;
        }
        
        const finalScore = Math.min(1.0, score);
        this.debugLog('SCORING', `Similarity score calculated`, {
            matchA: matchA.match,
            matchB: matchB.match,
            score: finalScore.toFixed(3),
            threshold: sportConfig.mergeThreshold
        });
        
        return finalScore;
    }

    mergeCluster(cluster, sport) {
        const baseMatch = cluster[0];
        const allSources = { tom: [], sarah: [], wendy: [] };
        
        this.debugLog('MERGE-CLUSTER', `Merging ${cluster.length} matches`, {
            baseMatch: baseMatch.match,
            sources: cluster.map(m => m.source)
        });

        let validMatches = 0;
        cluster.forEach(match => {
            const isSameFixture = this.calculateSimilarity(baseMatch, match) >= 0.8;
            
            if (!isSameFixture) {
                this.debugLog('VALIDATION', `Skipping invalid match in cluster`, {
                    base: baseMatch.match,
                    invalid: match.match,
                    similarity: this.calculateSimilarity(baseMatch, match).toFixed(3)
                });
                return;
            }
            
            validMatches++;
            
            // 🎯 AGGREGATE STREAMS
            ['tom', 'sarah', 'wendy'].forEach(source => {
                if (match.sources[source]) {
                    match.sources[source].forEach(stream => {
                        const isValidStream = source !== 'wendy' || 
                            this.isValidWendyStreamForMatch(stream, baseMatch.match);
                        
                        if (isValidStream && !allSources[source].includes(stream)) {
                            allSources[source].push(stream);
                        }
                    });
                }
            });
        });

        this.debugLog('STREAMS', `Stream aggregation completed`, {
            tom: allSources.tom.length,
            sarah: allSources.sarah.length,
            wendy: allSources.wendy.length,
            validMatches: validMatches
        });

        return {
            unix_timestamp: baseMatch.unix_timestamp,
            sport: sport,
            tournament: baseMatch.tournament || '',
            match: baseMatch.match,
            sources: allSources,
            confidence: 0.8,
            merged: true,
            merged_count: cluster.length
        };
    }

    calculateSimilarity(matchA, matchB) {
        const textA = matchA.match.toLowerCase();
        const textB = matchB.match.toLowerCase();
        
        if (textA === textB) return 1.0;
        
        const tokensA = textA.split(/\s+/);
        const tokensB = textB.split(/\s+/);
        
        const common = tokensA.filter(tA => tokensB.includes(tA));
        return common.length / Math.max(tokensA.length, tokensB.length);
    }

    isValidWendyStreamForMatch(streamUrl, matchText) {
        const url = streamUrl.toLowerCase();
        const match = matchText.toLowerCase();
        const players = match.split(' vs ');
        
        for (let player of players) {
            const nameParts = player.trim().split(' ');
            for (let namePart of nameParts) {
                if (namePart.length > 3 && url.includes(namePart)) {
                    return true;
                }
            }
        }
        
        this.debugLog('STREAM-VALIDATION', `Invalid Wendy stream`, {
            match: matchText,
            stream: streamUrl
        });
        return false;
    }

    createFinalMatch(match) {
        return {
            unix_timestamp: match.unix_timestamp,
            sport: match.sport,
            tournament: match.tournament || '',
            match: match.match,
            sources: match.sources,
            confidence: 1.0,
            merged: false
        };
    }

    createMasterData(processedData, standardizedData) {
        const masterData = {
            processed_at: new Date().toISOString(),
            processor_version: '4.0-enterprise',
            phase1_source: standardizedData.created_at,
            summary: {
                total_sports: Object.keys(processedData).length,
                total_matches: this.results.totalProcessed,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                processing_time_ms: this.results.processingTime,
                memory_usage_mb: this.results.memoryUsage,
                original_matches: standardizedData.matches.length,
                compression_ratio: ((standardizedData.matches.length - this.results.totalProcessed) / standardizedData.matches.length * 100).toFixed(1) + '%',
                merge_statistics: this.results.mergeStatistics
            },
            matches: []
        };
        
        Object.values(processedData).forEach(sportData => {
            masterData.matches.push(...sportData.matches);
        });

        // 🎯 COMPREHENSIVE VALIDATION
        this.validateMasterData(masterData, standardizedData);

        try {
            const masterDataJson = JSON.stringify(masterData, null, 2);
            JSON.parse(masterDataJson); // Validate JSON
            fs.writeFileSync('./master-data.json', masterDataJson);
            this.debugLog('OUTPUT', `Master data saved successfully`);
            
        } catch (error) {
            throw new Error(`JSON validation failed: ${error.message}`);
        }
    }

    validateMasterData(masterData, standardizedData) {
        console.log('\n🔍 ENTERPRISE VALIDATION REPORT');
        console.log('══════════════════════════════════════');
        
        // 🎯 DATA INTEGRITY CHECKS
        console.log(`📊 DATA INTEGRITY:`);
        console.log(`   Input: ${standardizedData.matches.length} matches`);
        console.log(`   Output: ${masterData.matches.length} matches`);
        console.log(`   Compression: ${masterData.summary.compression_ratio}`);
        
        // 🎯 SOURCE DISTRIBUTION
        const sourceCount = { tom: 0, sarah: 0, wendy: 0 };
        masterData.matches.forEach(match => {
            Object.keys(match.sources).forEach(source => {
                if (match.sources[source].length > 0) sourceCount[source]++;
            });
        });
        console.log(`   Source Distribution:`, sourceCount);
        
        // 🎯 MERGE QUALITY
        const mergedMatches = masterData.matches.filter(m => m.merged);
        console.log(`   Merged Matches: ${mergedMatches.length}`);
        console.log(`   Average Merge Count: ${(mergedMatches.reduce((sum, m) => sum + (m.merged_count || 1), 0) / mergedMatches.length || 0).toFixed(1)}`);
        
        // 🎯 PERFORMANCE METRICS
        console.log(`⚡ PERFORMANCE:`);
        console.log(`   Processing Time: ${this.results.processingTime}ms`);
        console.log(`   Memory Usage: ${this.results.memoryUsage.toFixed(2)} MB`);
        console.log(`   Matches/Second: ${(masterData.matches.length / (this.results.processingTime / 1000)).toFixed(1)}`);
        
        console.log('══════════════════════════════════════\n');
    }

    saveErrorState(error) {
        const errorState = {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            results: this.results
        };
        
        try {
            if (!fs.existsSync('./debug')) {
                fs.mkdirSync('./debug', { recursive: true });
            }
            fs.writeFileSync('./debug/phase2-error-state.json', JSON.stringify(errorState, null, 2));
            this.debugLog('ERROR', `Error state saved to debug/phase2-error-state.json`);
        } catch (e) {
            console.log('❌ Could not save error state:', e.message);
        }
    }

    clearCache() {
        this.teamNormalizationCache.clear();
        this.dateCache.clear();
        this.similarityCache.clear();
        
        if (global.gc) {
            global.gc();
        }
    }

    logResults() {
        console.log('\n🏆 ENTERPRISE PROCESSING RESULTS');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
        console.log(`🔄 Total Merged: ${this.results.merged}`);
        console.log(`🎯 Total Individual: ${this.results.individual}`);
        console.log(`⏱️  Processing Time: ${this.results.processingTime}ms`);
        console.log(`💾 Peak Memory: ${this.results.memoryUsage.toFixed(2)} MB`);
        
        console.log('\n📈 SPORT BREAKDOWN:');
        Object.entries(this.results.sportBreakdown)
            .sort((a, b) => b[1] - a[1])
            .forEach(([sport, count]) => {
                const stats = this.results.mergeStatistics[sport];
                const efficiency = stats ? stats.efficiency : 'N/A';
                console.log(`   ${sport}: ${count} matches (${efficiency} compression)`);
            });
        
        console.log('══════════════════════════════════════\n');
    }
}

// 🎯 ENTERPRISE EXECUTION HANDLER
if (require.main === module) {
    const processor = new EnterpriseSportsProcessor();
    
    const shutdown = (signal) => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    processor.processStandardizedData()
        .then(() => {
            console.log('🎉 ENTERPRISE PHASE 2 COMPLETED SUCCESSFULLY!');
            console.log('💾 Master data: master-data.json');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 ENTERPRISE PROCESSING FAILED:', error);
            process.exit(1);
        });
}

module.exports = EnterpriseSportsProcessor;
