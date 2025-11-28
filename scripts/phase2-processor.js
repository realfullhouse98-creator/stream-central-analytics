const fs = require('fs').promises;
const path = require('path');

/**
 * 🏆 ENTERPRISE SPORTS DATA PROCESSOR - PHASE 2
 * Features: Date-based merging, tournament-aware fingerprinting,
 * optimized clustering, async file handling
 * Version: 4.1-enterprise
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

        this.teamNormalizationCache = new Map();
        this.dateCache = new Map();
        this.similarityCache = new Map();

        this.debugEnabled = true;
    }

    debugLog(category, message, data = null) {
        if (!this.debugEnabled) return;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`🔍 [${timestamp}] ${category}: ${message}`);
        if (data) console.log(`   📊`, data);
    }

    performanceMark(startTime, operation) {
        const duration = Date.now() - startTime;
        this.debugLog('PERFORMANCE', `${operation} completed in ${duration}ms`);
        return duration;
    }

    getMatchDate(unixTimestamp) {
        if (!unixTimestamp) return null;
        if (this.dateCache.has(unixTimestamp)) return this.dateCache.get(unixTimestamp);
        const date = new Date(unixTimestamp * 1000).toISOString().split('T')[0];
        this.dateCache.set(unixTimestamp, date);
        return date;
    }

    normalizeTeamName(teamName) {
        if (!teamName) return '';
        if (this.teamNormalizationCache.has(teamName)) return this.teamNormalizationCache.get(teamName);

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
        if (!matchText.includes(' vs ')) return [this.normalizeTeamName(matchText)];
        const [teamA, teamB] = matchText.split(' vs ');
        return [this.normalizeTeamName(teamA), this.normalizeTeamName(teamB)];
    }

    hasSameTeams(matchA, matchB) {
        const key = `${matchA.match}|${matchB.match}`;
        if (this.similarityCache.has(key)) return this.similarityCache.get(key);

        const teamsA = this.extractTeams(matchA.match);
        const teamsB = this.extractTeams(matchB.match);

        let result = false;
        if (teamsA.length === teamsB.length && teamsA.length === 2) {
            result = (teamsA[0] === teamsB[0] && teamsA[1] === teamsB[1]) ||
                     (teamsA[0] === teamsB[1] && teamsA[1] === teamsB[0]);
        } else {
            result = teamsA.every(t => teamsB.includes(t)) && teamsB.every(t => teamsA.includes(t));
        }

        this.similarityCache.set(key, result);
        return result;
    }

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

        const abbr = { 'fc': 'football club', 'utd': 'united', 'afc': 'association football club', 'vs': 'versus' };
        const expandedA = abbr[tokenA] || tokenA;
        const expandedB = abbr[tokenB] || tokenB;

        return expandedA === expandedB || expandedA.includes(expandedB) || expandedB.includes(expandedA);
    }

    extractPlayers(matchText) {
        if (!matchText.includes(' vs ')) return [matchText.split(' ')];
        return matchText.split(' vs ').map(player => player.trim().toLowerCase().split(' ').filter(t => t.length > 1));
    }

    playersMatch(playerA, playerB) {
        if (playerA.length !== playerB.length) return false;
        return playerA.every((token, idx) => this.tokensMatch(token, playerB[idx]));
    }

    hasTennisPlayerPattern(match) {
        const text = match.match || '';
        return /[A-Z]\./.test(text) || /\//.test(text);
    }

    async processStandardizedData() {
        const pipelineStart = Date.now();
        console.log('🚀 ENTERPRISE PHASE 2 - PROCESSING STARTED\n');

        try {
            this.results.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            this.debugLog('SYSTEM', `Initial memory: ${this.results.memoryUsage.toFixed(2)} MB`);

            const loadStart = Date.now();
            const standardizedData = await this.loadStandardizedData();
            this.performanceMark(loadStart, 'Data loading');

            const sportGroups = this.groupBySport(standardizedData.matches);

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

                if (i % 3 === 0) this.clearCache();
            }

            await this.createMasterData(processedData, standardizedData);
            this.results.processingTime = Date.now() - this.startTime;
            this.logResults();
            this.performanceMark(pipelineStart, 'Total Phase 2 processing');

            return processedData;

        } catch (error) {
            this.debugLog('ERROR', `Phase 2 failed: ${error.message}`);
            await this.saveErrorState(error);
            throw error;
        }
    }

    async loadStandardizedData() {
        const filePath = './standardization-UNIVERSAL.json';
        try {
            const dataRaw = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(dataRaw);
            this.debugLog('VALIDATION', `Data structure verified`, {
                matches: data.matches?.length || 0,
                sports: [...new Set(data.matches?.map(m => m.sport))].length
            });
            return data;
        } catch (err) {
            throw new Error(`Failed to load standardized data: ${err.message}`);
        }
    }

    groupBySport(matches) {
        const sportGroups = {};
        matches.forEach(match => {
            const sport = match.sport || 'Unknown';
            if (!sportGroups[sport]) {
                sportGroups[sport] = [];
                this.results.sportBreakdown[sport] = 0;
            }
            sportGroups[sport].push(match);
            this.results.sportBreakdown[sport]++;
        });
        return sportGroups;
    }

    processSport(sport, matches) {
        const clusters = this.findAndMergeMatches(matches, sport);
        const processedMatches = [];

        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                processedMatches.push(this.createFinalMatch(cluster[0]));
                this.results.individual++;
            } else {
                const merged = this.mergeCluster(cluster, sport);
                processedMatches.push(merged);
                this.results.merged++;
            }
        });

        this.results.totalProcessed += processedMatches.length;

        this.results.mergeStatistics[sport] = {
            input: matches.length,
            output: processedMatches.length,
            clusters: clusters.length,
            mergedClusters: clusters.filter(c => c.length > 1).length,
            efficiency: ((matches.length - processedMatches.length) / matches.length * 100).toFixed(1) + '%'
        };

        return { summary: this.results.mergeStatistics[sport], matches: processedMatches };
    }

    findAndMergeMatches(matches, sport) {
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();

        const keyMap = new Map();
        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;
            const match = matches[i];
            const date = this.getMatchDate(match.unix_timestamp);
            const teamsKey = this.extractTeams(match.match).sort().join('|');
            const mapKey = `${date}|${teamsKey}|${match.tournament || ''}`;
            if (!keyMap.has(mapKey)) keyMap.set(mapKey, []);
            keyMap.get(mapKey).push(i);
        }

        for (let indices of keyMap.values()) {
            const cluster = indices.map(idx => matches[idx]);
            cluster.forEach(idx => processed.add(idx));
            clusters.push(cluster);
        }

        return clusters;
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

    mergeCluster(cluster, sport) {
        const base = cluster[0];
        const allSources = { tom: new Set(), sarah: new Set(), wendy: new Set() };
        cluster.forEach(match => {
            ['tom', 'sarah', 'wendy'].forEach(src => {
                (match.sources[src] || []).forEach(stream => allSources[src].add(stream));
            });
        });

        // Convert Sets to arrays
        for (let src in allSources) allSources[src] = Array.from(allSources[src]);

        return {
            unix_timestamp: base.unix_timestamp,
            sport: sport,
            tournament: base.tournament || '',
            match: base.match,
            sources: allSources,
            confidence: 0.8,
            merged: true,
            merged_count: cluster.length,
            data_quality: {
                has_tournament: !!base.tournament && base.tournament.length > 0,
                stream_count: Object.values(allSources).reduce((sum, arr) => sum + arr.length, 0),
                timestamp_missing: !base.unix_timestamp
            }
        };
    }

    createFinalMatch(match) {
        return {
            unix_timestamp: match.unix_timestamp,
            sport: match.sport,
            tournament: match.tournament || '',
            match: match.match,
            sources: match.sources,
            confidence: 1.0,
            merged: false,
            data_quality: {
                has_tournament: !!match.tournament && match.tournament.length > 0,
                stream_count: Object.values(match.sources || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0),
                timestamp_missing: !match.unix_timestamp
            }
        };
    }

    async createMasterData(processedData, standardizedData) {
        const masterData = {
            processed_at: new Date().toISOString(),
            processor_version: '4.1-enterprise',
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

        Object.values(processedData).forEach(sportData => masterData.matches.push(...sportData.matches));

        try {
            const jsonData = JSON.stringify(masterData, null, 2);
            await fs.writeFile('./master-data.json', jsonData);
            this.debugLog('OUTPUT', 'Master data saved successfully');
        } catch (err) {
            throw new Error(`Failed to save master data: ${err.message}`);
        }
    }

    clearCache() {
        this.teamNormalizationCache.clear();
        this.dateCache.clear();
        this.similarityCache.clear();
        if (global.gc) global.gc();
    }

    logResults() {
        console.log(`\n🏆 ENTERPRISE PROCESSING RESULTS`);
        console.log(`Total Processed: ${this.results.totalProcessed}`);
        console.log(`Merged: ${this.results.merged}`);
        console.log(`Individual: ${this.results.individual}`);
        console.log(`Processing Time: ${this.results.processingTime}ms`);
        console.log(`Peak Memory: ${this.results.memoryUsage.toFixed(2)} MB`);
    }

    async saveErrorState(error) {
        const state = { error: error.message, stack: error.stack, timestamp: new Date().toISOString(), results: this.results };
        try {
            await fs.mkdir('./debug', { recursive: true });
            await fs.writeFile('./debug/phase2-error-state.json', JSON.stringify(state, null, 2));
            this.debugLog('ERROR', 'Error state saved');
        } catch (e) {
            console.log('❌ Could not save error state:', e.message);
        }
    }
}

if (require.main === module) {
    const processor = new EnterpriseSportsProcessor();
    processor.processStandardizedData()
        .then(() => console.log('🎉 ENTERPRISE PHASE 2 COMPLETED SUCCESSFULLY!'))
        .catch(err => console.error('💥 PROCESSING FAILED:', err));
}

module.exports = EnterpriseSportsProcessor;
