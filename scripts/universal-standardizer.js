const fs = require('fs');
const path = require('path');

/**
 * 🏆 OPTIMIZED UNIVERSAL STANDARDIZER - PHASE 1
 * Purpose: Standardize supplier data (Tom, Sarah, Wendy) into a unified format
 * Version: 2.0-optimized
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

        // 🎯 PERFORMANCE CACHES
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
        if (!matchText.includes(' vs ')) return [this.normalizeTeamName(matchText)];
        const [teamA, teamB] = matchText.split(' vs ');
        return [this.normalizeTeamName(teamA), this.normalizeTeamName(teamB)];
    }

    standardizeMatch(rawMatch) {
        if (!rawMatch || !rawMatch.match) {
            this.results.invalidMatches++;
            return null;
        }

        // 🎯 Normalize match text
        const matchText = rawMatch.match.trim();
        const teams = this.extractTeams(matchText);

        // 🎯 Validate timestamp
        let timestamp = rawMatch.unix_timestamp;
        if (!timestamp) this.results.missingTimestamps++;

        // 🎯 Aggregate sources
        const sources = { tom: [], sarah: [], wendy: [] };
        if (rawMatch.source && rawMatch.streams) {
            if (sources[rawMatch.source]) {
                sources[rawMatch.source] = rawMatch.streams.filter(Boolean);
                this.results.sourceDistribution[rawMatch.source] += sources[rawMatch.source].length;
            }
        }

        return {
            match: matchText,
            sport: rawMatch.sport || 'Unknown',
            unix_timestamp: timestamp || null,
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
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (Array.isArray(data.matches)) {
                    allMatches.push(...data.matches.map(m => ({
                        ...m,
                        source: file.split('-')[0]
                    })));
                }
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

        const standardizedMatches = rawMatches
            .map(m => this.standardizeMatch(m))
            .filter(Boolean);

        this.results.totalProcessed = standardizedMatches.length;

        // 🎯 Save standardized data
        const output = {
            created_at: new Date().toISOString(),
            matches: standardizedMatches
        };

        try {
            fs.writeFileSync('./standardization-UNIVERSAL.json', JSON.stringify(output, null, 2));
            this.debugLog('OUTPUT', `Standardized data saved`, { total: standardizedMatches.length });
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

// 🎯 EXECUTION HANDLER
if (require.main === module) {
    const processor = new OptimizedUniversalStandardizer();
    processor.processAll();
}

module.exports = OptimizedUniversalStandardizer;
