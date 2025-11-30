const fs = require('fs');
const path = require('path');

/**
 * 🏆 OPTIMIZED UNIVERSAL STANDARDIZER - PHASE 1
 * Purpose: Standardize supplier data (Tom, Sarah, Wendy) into a unified format
 * Version: 2.1-optimized
 */
class OptimizedUniversalStandardizer {
    constructor() {
        this.results = {
            totalProcessed: 0,
            missingTimestamps: 0,
            invalidMatches: 0,
            sourceDistribution: { tom: 0, sarah: 0, wendy: 0 }
        };
        this.startTime = Date.now();
        this.debugEnabled = true;

        this.teamNormalizationCache = new Map();
        this.dateCache = new Map();
    }

    debugLog(category, message, data = null) {
        if (!this.debugEnabled) return;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`🔍 [${timestamp}] ${category}: ${message}`);
        if (data) console.log('   📊', data);
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
        if (!matchText.includes(' vs ') && !matchText.includes(' - ')) {
            return [this.normalizeTeamName(matchText)];
        }
        const separator = matchText.includes(' vs ') ? ' vs ' : ' - ';
        const [teamA, teamB] = matchText.split(separator);
        return [this.normalizeTeamName(teamA), this.normalizeTeamName(teamB)];
    }

    standardizeMatch(rawMatch, supplier) {
        if (!rawMatch || (!rawMatch.match && !rawMatch.title)) {
            this.results.invalidMatches++;
            return null;
        }

        let matchText = rawMatch.match || rawMatch.title;
        matchText = matchText.trim();

        const teams = this.extractTeams(matchText);

        // Handle timestamp
        let unixTimestamp = rawMatch.unix_timestamp || Math.floor((rawMatch.date || 0) / 1000);
        if (!unixTimestamp) this.results.missingTimestamps++;

        // Aggregate sources
        const sources = { tom: [], sarah: [], wendy: [] };
        if (supplier === 'tom') sources.tom = rawMatch.channels || [];
        if (supplier === 'sarah') sources.sarah = (rawMatch.sources || []).map(s => s.id);
        if (supplier === 'wendy') sources.wendy = (rawMatch.sources || []).map(s => s.id) || rawMatch.channels || [];

        // Detect tournament
        const tournament = rawMatch.tournament || rawMatch.category || null;

        return {
            match: matchText,
            sport: rawMatch.sport || rawMatch.category || 'Unknown',
            tournament: tournament,
            unix_timestamp: unixTimestamp || null,
            sources,
            confidence: 1.0
        };
    }

    loadSupplierData() {
        const folder = path.resolve(__dirname, './supplier');
        const files = ['tom-data.json', 'sarah-data.json', 'wendy-data.json'];
        let allMatches = [];

        files.forEach(file => {
            const filePath = path.join(folder, file);
            if (!fs.existsSync(filePath)) {
                this.debugLog('WARNING', `File not found: ${file}`);
                return;
            }
            try {
                const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let mappedMatches = [];

                if (file.startsWith('tom') && raw.events) {
                    Object.values(raw.events).forEach(events => {
                        events.forEach(ev => {
                            mappedMatches.push(this.standardizeMatch(ev, 'tom'));
                        });
                    });
                } else if (file.startsWith('sarah') && Array.isArray(raw.matches)) {
                    raw.matches.forEach(ev => {
                        mappedMatches.push(this.standardizeMatch(ev, 'sarah'));
                    });
                } else if (file.startsWith('wendy') && Array.isArray(raw.matches)) {
                    raw.matches.forEach(ev => {
                        mappedMatches.push(this.standardizeMatch(ev, 'wendy'));
                    });
                }

                allMatches.push(...mappedMatches.filter(Boolean));

            } catch (err) {
                this.debugLog('ERROR', `Failed to parse ${file}`, err.message);
            }
        });

        this.debugLog('LOAD', `Total raw matches loaded`, { count: allMatches.length });
        return allMatches;
    }

    processAll() {
        const start = Date.now();
        const rawMatches = this.loadSupplierData();

        this.results.totalProcessed = rawMatches.length;

        const output = {
            created_at: new Date().toISOString(),
            matches: rawMatches
        };

        try {
            fs.writeFileSync('./standardization-UNIVERSAL.json', JSON.stringify(output, null, 2));
            this.debugLog('OUTPUT', `Standardized data saved`, { total: rawMatches.length });
        } catch (err) {
            console.error('❌ Failed to save standardized data:', err.message);
        }

        const duration = Date.now() - start;
        console.log(`\n🏆 Phase 1 completed in ${duration}ms`);
        console.log(`✅ Total standardized matches: ${this.results.totalProcessed}`);
        console.log(`⚠️  Missing timestamps: ${this.results.missingTimestamps}`);
        console.log(`❌ Invalid matches skipped: ${this.results.invalidMatches}`);
        console.log(`📊 Source distribution:`, this.results.sourceDistribution);
    }
}

// 🎯 EXECUTION
if (require.main === module) {
    const processor = new OptimizedUniversalStandardizer();
    processor.processAll();
}

module.exports = OptimizedUniversalStandardizer;
