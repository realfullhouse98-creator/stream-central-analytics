const fs = require('fs');
const path = require('path');
const NormalizationMap = require('../modules/normalization-map.js');
const supplierConfig = require('../suppliers/supplier-config.js');

class OptimizedUniversalStandardizer {
    constructor() {
        this.normalizationMap = new NormalizationMap();
        this.results = {
            startTime: new Date().toISOString(),
            suppliers: {},
            optimization: {
                preFiltered: 0,
                groupsCreated: 0,
                fingerprintsGenerated: 0
            },
            fieldMappingReport: {}
        };
    }

    async standardizeAllData() {
        console.log('🚀 OPTIMIZED UNIVERSAL STANDARDIZER - PHASE 1\n');
        
        try {
            const beforeCounts = this.countRawData();
            this.logBeforeProcessing(beforeCounts);
            
            const allMatches = [];
            const suppliers = Object.keys(supplierConfig);

            for (const supplier of suppliers) {
                const supplierMatches = await this.processSupplier(supplier);
                allMatches.push(...supplierMatches);
            }

            console.log('\n🔧 RUNNING OPTIMIZATION PIPELINE...');
            const optimizedData = this.optimizeForPhase2(allMatches);

            const standardizedData = {
                phase: "1-optimized-standardization",
                created_at: new Date().toISOString(),
                summary: {
                    total_matches: optimizedData.matches.length,
                    suppliers_processed: suppliers,
                    supplier_breakdown: this.results.suppliers,
                    optimization_report: this.results.optimization,
                    before_processing: beforeCounts,
                    after_processing: {
                        total: optimizedData.matches.length,
                        tom: this.results.suppliers.tom || 0,
                        sarah: this.results.suppliers.sarah || 0,
                        wendy: this.results.suppliers.wendy || 0
                    }
                },
                optimization: optimizedData.optimization,
                matches: optimizedData.matches
            };

            standardizedData.summary.data_loss = this.calculateDataLoss(beforeCounts, standardizedData.summary.after_processing);

            this.saveStandardizedData(standardizedData);
            this.logResults(standardizedData);
            
            return standardizedData;

        } catch (error) {
            console.error('💥 Optimized standardizer failed:', error);
            throw error;
        }
    }

    optimizeForPhase2(matches) {
        console.log('   🎯 Starting Phase 2 optimization...');
        const startCount = matches.length;

        const filteredMatches = this.safePreFiltering(matches);
        console.log(`   ✅ Stage 1 - Safe filtering: ${startCount} → ${filteredMatches.length} matches`);

        const matchesWithFingerprints = this.generateFingerprints(filteredMatches);
        console.log(`   ✅ Stage 2 - Fingerprints: ${this.results.optimization.fingerprintsGenerated} generated`);

        const optimizationData = this.createOptimizationGroups(matchesWithFingerprints);
        console.log(`   ✅ Stage 3 - Optimization: ${this.results.optimization.groupsCreated} groups created`);

        return {
            matches: matchesWithFingerprints,
            optimization: optimizationData
        };
    }

    safePreFiltering(matches) {
        return matches.filter(match => {
            if (!match.match || match.match.length < 3) {
                this.results.optimization.preFiltered++;
                return false;
            }

            if (!match.sport || match.sport.length < 2) {
                this.results.optimization.preFiltered++;
                return false;
            }

            // 🎯 REMOVED: No fake timestamps
            match._data_quality = {
                timestamp_missing: !match.unix_timestamp,
                timestamp_source: match.unix_timestamp ? 'original' : 'missing',
                streams_count: Object.values(match.sources || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0),
                tournament_missing: !match.tournament || match.tournament.length === 0
            };

            return true;
        });
    }

    generateFingerprints(matches) {
        return matches.map(match => {
            const ts = match.unix_timestamp || null;
            const date = ts ? new Date(ts * 1000).toISOString().split('T')[0] : 'unknown';
            const normalizedTeams = this.safeNormalizeTeams(match.match);
            const tournamentSafe = match.tournament ? match.tournament.toLowerCase().trim() : '';

            const fingerprint = {
                date,
                sport: match.sport,
                normalizedTeams,
                tournament: tournamentSafe,
                source: match.source,
                data_quality: {
                    has_tournament: !!match.tournament && match.tournament.length > 0,
                    stream_count: Object.values(match.sources || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0),
                    time_accuracy: ts ? 1.0 : 0.5,
                    team_completeness: match.match.includes(' vs ') ? 1.0 : 0.7,
                    timestamp_missing: !ts
                }
            };

            match._fingerprint = this.generateFingerprintHash(
                `${fingerprint.date}|${fingerprint.sport}|${fingerprint.normalizedTeams}|${fingerprint.tournament}`
            );

            match._optimization = fingerprint;
            this.results.optimization.fingerprintsGenerated++;
            return match;
        });
    }

    safeNormalizeTeams(matchText) {
        if (!matchText.includes(' vs ')) {
            return [this.safeNormalizeTeamName(matchText)];
        }
        const [teamA, teamB] = matchText.split(' vs ');
        return [
            this.safeNormalizeTeamName(teamA),
            this.safeNormalizeTeamName(teamB)
        ].sort().join('|');
    }

    safeNormalizeTeamName(teamName) {
        const safeNormalizations = {
            'korea': 'south korea',
            'north korea': 'korea dpr', 
            'dpr korea': 'korea dpr',
            'usa': 'united states',
            'u.s.a.': 'united states',
            'uk': 'united kingdom',
            'u.k.': 'united kingdom',
            'man utd': 'manchester united',
            'man city': 'manchester city'
        };

        const normalized = teamName.toLowerCase().trim();
        return safeNormalizations[normalized] || normalized;
    }

    generateFingerprintHash(keyString) {
        let hash = 0;
        for (let i = 0; i < keyString.length; i++) {
            const char = keyString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    createOptimizationGroups(matches) {
        const groups = {
            by_date_sport: {},
            by_fingerprint: {},
            high_confidence_merges: [],
            performance_metrics: {
                total_matches: matches.length,
                unique_dates: new Set(),
                unique_sports: new Set()
            }
        };

        matches.forEach(match => {
            const date = match._optimization.date;
            const sport = match._optimization.sport;
            
            const dateSportKey = `${date}|${sport}`;
            if (!groups.by_date_sport[dateSportKey]) {
                groups.by_date_sport[dateSportKey] = [];
                this.results.optimization.groupsCreated++;
            }
            groups.by_date_sport[dateSportKey].push(match._fingerprint);

            if (!groups.by_fingerprint[match._fingerprint]) {
                groups.by_fingerprint[match._fingerprint] = [];
            }
            groups.by_fingerprint[match._fingerprint].push(match._fingerprint);

            groups.performance_metrics.unique_dates.add(date);
            groups.performance_metrics.unique_sports.add(sport);
        });

        Object.entries(groups.by_fingerprint).forEach(([fingerprint, matches]) => {
            if (matches.length > 1) {
                groups.high_confidence_merges.push({
                    fingerprint,
                    match_count: matches.length,
                    reason: 'exact_fingerprint_match'
                });
            }
        });

        groups.performance_metrics.unique_dates = Array.from(groups.performance_metrics.unique_dates);
        groups.performance_metrics.unique_sports = Array.from(groups.performance_metrics.unique_sports);

        return groups;
    }

    countRawData() {
        const counts = { tom: 0, sarah: 0, wendy: 0 };
        try { 
            const tomData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
            if (tomData.events) Object.values(tomData.events).forEach(day => { if (Array.isArray(day)) counts.tom += day.length; });
        } catch (e) { counts.tom = 'ERROR'; }
        try { 
            const sarahData = JSON.parse(fs.readFileSync('./suppliers/sarah-data.json', 'utf8'));
            counts.sarah = Array.isArray(sarahData.matches) ? sarahData.matches.length : Array.isArray(sarahData) ? sarahData.length : 0;
        } catch (e) { counts.sarah = 'ERROR'; }
        try {
            const wendyData = JSON.parse(fs.readFileSync('./suppliers/wendy-data.json', 'utf8'));
            counts.wendy = Array.isArray(wendyData.matches) ? wendyData.matches.length : 0;
        } catch (e) { counts.wendy = 'ERROR'; }
        return counts;
    }

    async processSupplier(supplierName) {
        console.log(`\n🔧 PROCESSING ${supplierName.toUpperCase()}...`);
        try {
            const config = supplierConfig[supplierName];
            if (!config || !fs.existsSync(config.file)) return [];
            const rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
            const matches = [];
            let rawMatches = [];

            if (supplierName === 'tom' && rawData.events) Object.values(rawData.events).forEach(day => { if (Array.isArray(day)) rawMatches.push(...day); });
            else if ((supplierName === 'sarah' || supplierName === 'wendy') && rawData.matches) rawMatches = rawData.matches;
            else if (Array.isArray(rawData)) rawMatches = rawData;
            else return [];

            rawMatches.forEach((rawMatch, index) => {
                try {
                    const standardized = this.normalizationMap.standardizeMatch(rawMatch, supplierName);
                    matches.push(standardized);
                } catch {}
            });

            this.results.suppliers[supplierName] = matches.length;
            return matches;
        } catch {
            return [];
        }
    }

    calculateDataLoss(before, after) {
        return {
            tom_loss: (before.tom === 'ERROR' || after.tom === 'ERROR') ? 'ERROR' : before.tom - after.tom,
            sarah_loss: (before.sarah === 'ERROR' || after.sarah === 'ERROR') ? 'ERROR' : before.sarah - after.sarah,
            wendy_loss: (before.wendy === 'ERROR' || after.wendy === 'ERROR') ? 'ERROR' : before.wendy - after.wendy,
            total_loss: (
                (before.tom === 'ERROR' ? 0 : before.tom) + 
                (before.sarah === 'ERROR' ? 0 : before.sarah) + 
                (before.wendy === 'ERROR' ? 0 : before.wendy)
            ) - after.total
        };
    }

    logBeforeProcessing(counts) {
        console.log('📊 RAW DATA COUNT:');
        console.log(`📦 Tom: ${counts.tom} matches`);
        console.log(`📦 Sarah: ${counts.sarah} matches`);
        console.log(`📦 Wendy: ${counts.wendy} matches`);
        console.log(`📦 Total: ${
            (counts.tom === 'ERROR' ? 0 : counts.tom) + 
            (counts.sarah === 'ERROR' ? 0 : counts.sarah) + 
            (counts.wendy === 'ERROR' ? 0 : counts.wendy)
        } matches`);
    }

    saveStandardizedData(data) {
        const outputPath = './standardization-UNIVERSAL.json';
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 Optimized standardized data saved to: ${outputPath}`);
    }

    logResults(data) {
        console.log('\n📊 OPTIMIZED STANDARDIZER RESULTS:');
        console.log(`✅ Total Matches: ${data.summary.after_processing.total}`);
        console.log(`🔧 Tom: ${data.summary.after_processing.tom}`);
        console.log(`🔧 Sarah: ${data.summary.after_processing.sarah}`);
        console.log(`🔧 Wendy: ${data.summary.after_processing.wendy}`);
        console.log('\n⚡ OPTIMIZATION REPORT:');
        console.log(`   Pre-filtered: ${data.summary.optimization_report.preFiltered}`);
        console.log(`   Fingerprints: ${data.summary.optimization_report.fingerprintsGenerated}`);
        console.log(`   Groups: ${data.summary.optimization_report.groupsCreated}`);
        console.log('\n📉 DATA LOSS:');
        console.log(`📦 Tom: ${data.summary.data_loss.tom_loss}`);
        console.log(`📦 Sarah: ${data.summary.data_loss.sarah_loss}`);
        console.log(`📦 Wendy: ${data.summary.data_loss.wendy_loss}`);
        console.log(`📦 Total: ${data.summary.data_loss.total_loss}`);
    }
}

if (require.main === module) {
    const standardizer = new OptimizedUniversalStandardizer();
    standardizer.standardizeAllData()
        .then(() => console.log('🎉 OPTIMIZED UNIVERSAL STANDARDIZER COMPLETED!'))
        .catch(error => console.error('💥 Optimized standardizer failed:', error));
}

module.exports = OptimizedUniversalStandardizer;
