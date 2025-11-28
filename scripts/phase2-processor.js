const fs = require('fs');

/**
 * 🏆 ENTERPRISE SPORTS DATA PROCESSOR - PHASE 2 (TOURNAMENTS IGNORED)
 * Version: 4.1-enterprise
 */
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

        this.sportConfigs = {
            'Football': { mergeThreshold: 0.50, timeWindow: 600 },
            'Basketball': { mergeThreshold: 0.50, timeWindow: 600 },
            'Tennis': { mergeThreshold: 0.50, timeWindow: 480 },
            'default': { mergeThreshold: 0.50, timeWindow: 480 }
        };

        // 🎯 PERFORMANCE CACHES
        this.teamNormalizationCache = new Map();
        this.dateCache = new Map();
        this.similarityCache = new Map();
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
        const cached = this.dateCache.get(unixTimestamp);
        if (cached) return cached;
        if (!unixTimestamp) {
            this.results.missingTimestamps++;
            return null;
        }
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
            .replace(/^spurs$/, 'tottenham');

        this.teamNormalizationCache.set(teamName, normalized);
        return normalized;
    }

    extractTeams(matchText) {
        if (!matchText.includes(' vs ')) return [this.normalizeTeamName(matchText)];
        const [teamA, teamB] = matchText.split(' vs ');
        return [this.normalizeTeamName(teamA), this.normalizeTeamName(teamB)];
    }

    hasSameTeams(matchA, matchB) {
        const cacheKey = `${matchA.match}|${matchB.match}`;
        if (this.similarityCache.has(cacheKey)) return this.similarityCache.get(cacheKey);

        const teamsA = this.extractTeams(matchA.match);
        const teamsB = this.extractTeams(matchB.match);

        let result = false;
        if (teamsA.length === 2 && teamsB.length === 2) {
            result = (teamsA[0] === teamsB[0] && teamsA[1] === teamsB[1]) ||
                     (teamsA[0] === teamsB[1] && teamsA[1] === teamsB[0]);
        } else {
            result = teamsA.every(t => teamsB.includes(t)) && teamsB.every(t => teamsA.includes(t));
        }

        this.similarityCache.set(cacheKey, result);
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
        return false;
    }

    calculateMatchScore(matchA, matchB, sport) {
        if (matchA.source === matchB.source && matchA.source !== 'wendy') return 0;

        const dateA = this.getMatchDate(matchA.unix_timestamp);
        const dateB = this.getMatchDate(matchB.unix_timestamp);
        const sameDate = dateA && dateB && dateA === dateB;
        const sameTeams = this.hasSameTeams(matchA, matchB);

        if (sameDate && sameTeams) return 1.0; // Auto-merge by date+teams

        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const tokensA = this.advancedTokenize(matchA.match);
        const tokensB = this.advancedTokenize(matchB.match);
        const common = tokensA.filter(tA => tokensB.some(tB => this.tokensMatch(tA, tB)));
        let score = common.length / Math.max(tokensA.length, tokensB.length);

        if (matchA.source === 'wendy' || matchB.source === 'wendy') score += 0.1;

        return Math.min(1.0, score);
    }

    findAndMergeMatches(matches, sport) {
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();

        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;

            const cluster = [matches[i]];
            processed.add(i);

            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                const score = this.calculateMatchScore(matches[i], matches[j], sport);
                if (score >= sportConfig.mergeThreshold) {
                    cluster.push(matches[j]);
                    processed.add(j);
                }
            }

            clusters.push(cluster);
        }
        return clusters;
    }

    mergeCluster(cluster, sport) {
        const baseMatch = cluster[0];
        const allSources = { tom: [], sarah: [], wendy: [] };

        cluster.forEach(match => {
            ['tom', 'sarah', 'wendy'].forEach(source => {
                if (match.sources[source]) {
                    match.sources[source].forEach(stream => {
                        if (!allSources[source].includes(stream)) allSources[source].push(stream);
                    });
                }
            });
        });

        return {
            unix_timestamp: baseMatch.unix_timestamp,
            sport: sport,
            match: baseMatch.match,
            sources: allSources,
            confidence: 0.8,
            merged: cluster.length > 1,
            merged_count: cluster.length
        };
    }

    processSport(sport, matches) {
        const clusters = this.findAndMergeMatches(matches, sport);
        const processedMatches = [];

        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                processedMatches.push({ ...cluster[0], merged: false });
                this.results.individual++;
            } else {
                processedMatches.push(this.mergeCluster(cluster, sport));
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

        return {
            summary: this.results.mergeStatistics[sport],
            matches: processedMatches
        };
    }

    loadStandardizedData() {
        const filePath = './standardization-UNIVERSAL.json';
        if (!fs.existsSync(filePath)) throw new Error('Phase 1 output not found.');
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    groupBySport(matches) {
        const sportGroups = {};
        matches.forEach(match => {
            const sport = match.sport || 'Unknown';
            if (!sportGroups[sport]) sportGroups[sport] = [];
            sportGroups[sport].push(match);
            this.results.sportBreakdown[sport] = (this.results.sportBreakdown[sport] || 0) + 1;
        });
        return sportGroups;
    }

    async processStandardizedData() {
        const pipelineStart = Date.now();
        const standardizedData = this.loadStandardizedData();
        const sportGroups = this.groupBySport(standardizedData.matches);

        const processedData = {};
        for (const [sport, matches] of Object.entries(sportGroups)) {
            processedData[sport] = this.processSport(sport, matches);
        }

        // 🎯 CREATE FINAL OUTPUT
        const masterData = {
            processed_at: new Date().toISOString(),
            processor_version: '4.1-enterprise-no-tournament',
            summary: {
                total_sports: Object.keys(processedData).length,
                total_matches: this.results.totalProcessed,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                processing_time_ms: Date.now() - this.startTime,
                merge_statistics: this.results.mergeStatistics
            },
            matches: []
        };

        Object.values(processedData).forEach(sportData => {
            masterData.matches.push(...sportData.matches);
        });

        fs.writeFileSync('./master-data.json', JSON.stringify(masterData, null, 2));
        console.log(`🎉 Phase 2 completed! Master data saved as master-data.json`);
    }
}

if (require.main === module) {
    const processor = new EnterpriseSportsProcessorNoTournament();
    processor.processStandardizedData().catch(console.error);
}

module.exports = EnterpriseSportsProcessorNoTournament;
