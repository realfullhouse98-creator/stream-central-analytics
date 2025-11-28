const fs = require('fs');
const path = require('path');

/**
 * 🏆 OPTIMIZED UNIVERSAL STANDARDIZER - PHASE 1
 * Features: Supplier normalization, timestamp verification, tournament-aware, stream validation
 * Version: 1.0-optimized
 */
class OptimizedUniversalStandardizer {
    constructor() {
        this.suppliers = ['tom', 'sarah', 'wendy'];
        this.results = {
            totalMatches: 0,
            missingTimestamps: 0,
            missingTournaments: 0,
            exactDuplicatesRemoved: 0,
            perSupplierCounts: {},
            processedTime: 0
        };
        this.teamNormalizationCache = new Map();
        this.tournamentNormalizationCache = new Map();
        this.startTime = Date.now();
        this.debugEnabled = true;
    }

    debugLog(category, message, data = null) {
        if (!this.debugEnabled) return;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`🔍 [${timestamp}] ${category}: ${message}`);
        if (data) console.log('   📊', data);
    }

    loadSupplierData() {
        const allMatches = [];
        for (let supplier of this.suppliers) {
            const filePath = path.join('./supplier', `${supplier}-data.json`);
            if (!fs.existsSync(filePath)) {
                this.debugLog('WARNING', `Supplier file missing: ${filePath}`);
                this.results.perSupplierCounts[supplier] = 0;
                continue;
            }
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.results.perSupplierCounts[supplier] = data.matches?.length || 0;
            const enriched = (data.matches || []).map(match => ({
                ...match,
                supplier,
            }));
            allMatches.push(...enriched);
        }
        return allMatches;
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

    normalizeTournament(tournament) {
        if (!tournament) return '';
        if (this.tournamentNormalizationCache.has(tournament)) return this.tournamentNormalizationCache.get(tournament);

        const normalized = tournament
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/champions league|ucl/, 'uefa champions league')
            .replace(/premier league|epl/, 'english premier league');

        this.tournamentNormalizationCache.set(tournament, normalized);
        return normalized;
    }

    validateTimestamp(unix_timestamp) {
        if (!unix_timestamp || isNaN(unix_timestamp)) return false;
        const date = new Date(unix_timestamp * 1000);
        return !isNaN(date.getTime());
    }

    extractTeams(matchText) {
        if (!matchText || typeof matchText !== 'string') return [];
        if (!matchText.includes(' vs ')) return [this.normalizeTeamName(matchText)];
        const [teamA, teamB] = matchText.split(' vs ');
        return [
            this.normalizeTeamName(teamA),
            this.normalizeTeamName(teamB)
        ];
    }

    extractPlayers(matchText) {
        if (!matchText.includes(' vs ')) return [matchText.split(' ')];
        return matchText.split(' vs ').map(player =>
            player.trim().toLowerCase().split(' ').filter(t => t.length > 1)
        );
    }

    validateStreams(match) {
        const sources = ['tom', 'sarah', 'wendy'];
        let totalStreams = 0;

        const cleanSources = {};
        for (let source of sources) {
            cleanSources[source] = [];
            if (!match.sources?.[source]) continue;
            for (let stream of match.sources[source]) {
                if (typeof stream === 'string' && stream.length > 5) {
                    cleanSources[source].push(stream);
                    totalStreams++;
                }
            }
        }
        match.sources = cleanSources;
        match.stream_count = totalStreams;
    }

    removeExactDuplicates(matches) {
        const seen = new Set();
        const filtered = [];
        for (let match of matches) {
            const key = `${match.match}|${match.tournament}|${match.unix_timestamp}`;
            if (!seen.has(key)) {
                seen.add(key);
                filtered.push(match);
            } else {
                this.results.exactDuplicatesRemoved++;
            }
        }
        return filtered;
    }

    enrichMatch(match) {
        // Teams
        match.teams = this.extractTeams(match.match);

        // Players (tennis/mma)
        match.players = this.extractPlayers(match.match);

        // Tournament
        match.tournament = this.normalizeTournament(match.tournament);
        if (!match.tournament) this.results.missingTournaments++;

        // Timestamp
        match.timestamp_missing = !this.validateTimestamp(match.unix_timestamp);
        if (match.timestamp_missing) this.results.missingTimestamps++;

        // Streams
        this.validateStreams(match);

        // Team normalization applied
        match.team_normalization_applied = match.teams.length > 0;

        return match;
    }

    async run() {
        const pipelineStart = Date.now();
        let matches = this.loadSupplierData();

        this.debugLog('LOAD', `Loaded total matches: ${matches.length}`);

        // Remove exact duplicates
        matches = this.removeExactDuplicates(matches);

        this.debugLog('DEDUP', `Matches after deduplication: ${matches.length}`);

        // Enrich all matches
        matches = matches.map(m => this.enrichMatch(m));

        // Save standardized JSON
        const output = {
            created_at: new Date().toISOString(),
            matches
        };
        fs.writeFileSync('./standardization-UNIVERSAL.json', JSON.stringify(output, null, 2));

        this.results.totalMatches = matches.length;
        this.results.processedTime = Date.now() - pipelineStart;

        this.logResults();
        return output;
    }

    logResults() {
        console.log('\n🏆 UNIVERSAL STANDARDIZER RESULTS');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Matches Processed: ${this.results.totalMatches}`);
        console.log(`🔢 Missing Timestamps: ${this.results.missingTimestamps}`);
        console.log(`🏆 Missing Tournaments: ${this.results.missingTournaments}`);
        console.log(`🗑 Exact Duplicates Removed: ${this.results.exactDuplicatesRemoved}`);
        console.log(`⏱ Processing Time: ${this.results.processedTime} ms`);
        console.log('📊 Supplier Counts:', this.results.perSupplierCounts);
        console.log('══════════════════════════════════════\n');
    }
}

// 🎯 EXECUTION HANDLER
if (require.main === module) {
    const standardizer = new OptimizedUniversalStandardizer();
    standardizer.run()
        .then(() => console.log('🎉 PHASE 1 COMPLETED - Data ready for Phase 2'))
        .catch(err => console.error('💥 PHASE 1 FAILED:', err));
}

module.exports = OptimizedUniversalStandardizer;
