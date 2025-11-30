const fs = require('fs');

/**
 * 🏆 ENTERPRISE SPORTS DATA PROCESSOR - PHASE 2 (NO TOURNAMENT)
 * Version: 4.2-enterprise-clean
 */
class EnterpriseSportsProcessorNoTournament {
    constructor() {
        this.results = {
            totalProcessed: 0,
            merged: 0,
            individual: 0,
            processingTime: 0,
            mergeStatistics: {},
            missingTimestamps: 0
        };
        this.startTime = Date.now();

        this.teamNormalizationCache = new Map();
        this.dateCache = new Map();
        this.similarityCache = new Map();

        this.sportConfigs = {
            Football: { mergeThreshold: 0.5 },
            Basketball: { mergeThreshold: 0.5 },
            Tennis: { mergeThreshold: 0.5 },
            default: { mergeThreshold: 0.5 }
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
        if (!unixTimestamp) {
            this.results.missingTimestamps++;
            return null;
        }
        if (this.dateCache.has(unixTimestamp)) return this.dateCache.get(unixTimestamp);
        const date = new Date(unixTimestamp * 1000).toISOString().split('T')[0];
        this.dateCache.set(unixTimestamp, date);
        return date;
    }

    normalizeTeamName(teamName) {
        if (!teamName) return '';
        if (this.teamNormalizationCache.has(teamName)) return this.teamNormalizationCache.get(teamName);
        const normalized = teamName.toLowerCase().trim();
        this.teamNormalizationCache.set(teamName, normalized);
        return normalized;
    }

    extractTeams(matchText) {
        if (!matchText.includes(' vs ') && !matchText.includes(' - ')) return [this.normalizeTeamName(matchText)];
        const separator = matchText.includes(' vs ') ? ' vs ' : ' - ';
        const [teamA, teamB] = matchText.split(separator);
        return [this.normalizeTeamName(teamA), this.normalizeTeamName(teamB)];
    }

    hasSameTeams(matchA, matchB) {
        const key = `${matchA.match}|${matchB.match}`;
        if (this.similarityCache.has(key)) return this.similarityCache.get(key);

        const teamsA = this.extractTeams(matchA.match);
        const teamsB = this.extractTeams(matchB.match);

        const result = teamsA.length === 2 && teamsB.length === 2
            ? (teamsA[0] === teamsB[0] && teamsA[1] === teamsB[1]) || (teamsA[0] === teamsB[1] && teamsA[1] === teamsB[0])
            : teamsA.every(t => teamsB.includes(t)) && teamsB.every(t => teamsA.includes(t));

        this.similarityCache.set(key, result);
        return result;
    }

    calculateMatchScore(matchA, matchB, sport) {
        if (matchA.source === matchB.source && matchA.source !== 'wendy') return 0;
        const dateA = this.getMatchDate(matchA.unix_timestamp);
        const dateB = this.getMatchDate(matchB.unix_timestamp);
        const sameDate = dateA && dateB && dateA === dateB;
        const sameTeams = this.hasSameTeams(matchA, matchB);

        if (sameDate && sameTeams) return 1.0;

        return sameDate && sameTeams ? 1.0 : 0.5;
    }

    findAndMergeMatches(matches, sport) {
        const threshold = (this.sportConfigs[sport] || this.sportConfigs.default).mergeThreshold;
        const clusters = [];
        const processed = new Set();

        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;
            const cluster = [matches[i]];
            processed.add(i);

            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                const score = this.calculateMatchScore(matches[i], matches[j], sport);
                if (score >= threshold) {
                    cluster.push(matches[j]);
                    processed.add(j);
                }
            }

            clusters.push(cluster);
        }
        return clusters;
    }

    mergeCluster(cluster, sport) {
        const base = cluster[0];
        const sources = { tom: [], sarah: [], wendy: [] };
        cluster.forEach(match => {
            ['tom', 'sarah', 'wendy'].forEach(src => {
                if (match.sources[src]) match.sources[src].forEach(s => { if (!sources[src].includes(s)) sources[src].push(s); });
            });
        });

        return {
            date: this.getMatchDate(base.unix_timestamp),
            match: base.match,
            sport: base.sport,
            tournament: base.tournament || '',
            sources,
            confidence: 0.8,
            merged: cluster.length > 1,
            merged_count: cluster.length
        };
    }

    loadStandardizedData() {
        const filePath = './standardization-UNIVERSAL.json';
        if (!fs.existsSync(filePath)) throw new Error('Phase 1 output not found.');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return data.matches || [];
    }

    groupBySport(matches) {
        const grouped = {};
        matches.forEach(match => {
            const sport = match.sport || 'Unknown';
            if (!grouped[sport]) grouped[sport] = [];
            grouped[sport].push(match);
        });
        return grouped;
    }

    async processStandardizedData() {
        const standardized = this.loadStandardizedData();
        const sportGroups = this.groupBySport(standardized);

        const masterMatches = [];

        Object.entries(sportGroups).forEach(([sport, matches]) => {
            const clusters = this.findAndMergeMatches(matches, sport);
            clusters.forEach(cluster => {
                masterMatches.push(this.mergeCluster(cluster, sport));
            });
        });

        const masterData = {
            processed_at: new Date().toISOString(),
            processor_version: '4.2-enterprise-clean',
            total_matches: masterMatches.length,
            merged_matches: masterMatches.filter(m => m.merged).length,
            individual_matches: masterMatches.filter(m => !m.merged).length,
            matches: masterMatches
        };

        fs.writeFileSync('./master-data.json', JSON.stringify(masterData, null, 2));
        console.log(`🎉 Phase 2 completed! Master data saved as master-data.json`);
    }
}

// 🎯 EXECUTION
if (require.main === module) {
    const processor = new EnterpriseSportsProcessorNoTournament();
    processor.processStandardizedData().catch(console.error);
}

module.exports = EnterpriseSportsProcessorNoTournament;
