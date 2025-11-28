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

            // 🎯 NEW: OPTIMIZATION PIPELINE
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
                // 🎯 NEW: OPTIMIZATION DATA FOR PHASE 2
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

    // 🎯 NEW: OPTIMIZATION PIPELINE
    optimizeForPhase2(matches) {
        console.log('   🎯 Starting Phase 2 optimization...');
        const startCount = matches.length;

        // 🎯 STAGE 1: SAFE PRE-FILTERING (Remove only obvious garbage)
        const filteredMatches = this.safePreFiltering(matches);
        console.log(`   ✅ Stage 1 - Safe filtering: ${startCount} → ${filteredMatches.length} matches`);

        // 🎯 STAGE 2: GENERATE FINGERPRINTS
        const matchesWithFingerprints = this.generateFingerprints(filteredMatches);
        console.log(`   ✅ Stage 2 - Fingerprints: ${this.results.optimization.fingerprintsGenerated} generated`);

        // 🎯 STAGE 3: CREATE OPTIMIZATION GROUPS
        const optimizationData = this.createOptimizationGroups(matchesWithFingerprints);
        console.log(`   ✅ Stage 3 - Optimization: ${this.results.optimization.groupsCreated} groups created`);

        return {
            matches: matchesWithFingerprints,
            optimization: optimizationData
        };
    }

    // 🎯 SAFE PRE-FILTERING - Only remove obvious garbage
    safePreFiltering(matches) {
        return matches.filter(match => {
            // ❌ REMOVE: Matches without basic required data
            if (!match.match || match.match.length < 3) {
                this.results.optimization.preFiltered++;
                return false;
            }

            if (!match.sport || match.sport.length < 2) {
                this.results.optimization.preFiltered++;
                return false;
            }

            // ✅ KEEP: Matches with valid timestamp (or reasonable default)
            if (!match.unix_timestamp) {
                match.unix_timestamp = Math.floor(Date.now() / 1000); // Safe default
            }

            // ✅ KEEP: Even matches with empty streams (Wendy data is valuable)
            return true;
        });
    }

    // 🎯 GENERATE MATCH FINGERPRINTS
    generateFingerprints(matches) {
        return matches.map(match => {
            // 🎯 FINGERPRINT COMPONENTS
            const fingerprint = {
                date: this.getMatchDate(match.unix_timestamp),
                sport: match.sport,
                normalizedTeams: this.safeNormalizeTeams(match.match),
                source: match.source,
                // 🎯 DATA QUALITY SCORES (for Phase 2 prioritization)
                data_quality: {
                    has_tournament: !!match.tournament && match.tournament.length > 0,
                    stream_count: Object.values(match.sources || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0),
                    time_accuracy: match.unix_timestamp ? 1.0 : 0.5,
                    team_completeness: match.match.includes(' vs ') ? 1.0 : 0.7
                }
            };

            // 🎯 FINGERPRINT HASH (for quick comparison)
            match._fingerprint = this.generateFingerprintHash(fingerprint);
            match._optimization = fingerprint;
            
            this.results.optimization.fingerprintsGenerated++;
            return match;
        });
    }

    // 🎯 SAFE TEAM NORMALIZATION (Conservative)
    safeNormalizeTeams(matchText) {
        if (!matchText.includes(' vs ')) {
            return [this.safeNormalizeTeamName(matchText)];
        }
        
        const [teamA, teamB] = matchText.split(' vs ');
        return [
            this.safeNormalizeTeamName(teamA),
            this.safeNormalizeTeamName(teamB)
        ].sort().join('|'); // Sort for team order independence
    }

    // 🎯 CONSERVATIVE TEAM NAME NORMALIZATION
    safeNormalizeTeamName(teamName) {
        const safeNormalizations = {
            // 🎯 ONLY NORMALIZE OBVIOUS CASES
            'korea': 'south korea',
            'north korea': 'korea dpr', 
            'dpr korea': 'korea dpr',
            'usa': 'united states',
            'u.s.a.': 'united states',
            'uk': 'united kingdom',
            'u.k.': 'united kingdom',
            'man utd': 'manchester united',
            'man city': 'manchester city'
            // ❌ DON'T normalize ambiguous cases like "FC Seoul", "Spurs", etc.
        };

        const normalized = teamName.toLowerCase().trim();
        return safeNormalizations[normalized] || normalized;
    }

    // 🎯 GENERATE FINGERPRINT HASH
    generateFingerprintHash(fingerprint) {
        const key = `${fingerprint.date}|${fingerprint.sport}|${fingerprint.normalizedTeams}`;
        // Simple hash for performance
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    // 🎯 GET MATCH DATE (YYYY-MM-DD)
    getMatchDate(unixTimestamp) {
        return new Date(unixTimestamp * 1000).toISOString().split('T')[0];
    }

    // 🎯 CREATE OPTIMIZATION GROUPS FOR PHASE 2
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
            
            // 🎯 GROUP 1: Date + Sport (Safe grouping)
            const dateSportKey = `${date}|${sport}`;
            if (!groups.by_date_sport[dateSportKey]) {
                groups.by_date_sport[dateSportKey] = [];
                this.results.optimization.groupsCreated++;
            }
            groups.by_date_sport[dateSportKey].push(match._fingerprint);

            // 🎯 GROUP 2: Fingerprint groups (Potential duplicates)
            if (!groups.by_fingerprint[match._fingerprint]) {
                groups.by_fingerprint[match._fingerprint] = [];
            }
            groups.by_fingerprint[match._fingerprint].push(match._fingerprint);

            // 🎯 TRACK UNIQUE VALUES
            groups.performance_metrics.unique_dates.add(date);
            groups.performance_metrics.unique_sports.add(sport);
        });

        // 🎯 IDENTIFY HIGH-CONFIDENCE MERGE CANDIDATES
        Object.entries(groups.by_fingerprint).forEach(([fingerprint, matches]) => {
            if (matches.length > 1) {
                groups.high_confidence_merges.push({
                    fingerprint: fingerprint,
                    match_count: matches.length,
                    reason: 'exact_fingerprint_match'
                });
            }
        });

        // 🎯 CONVERT SETS TO ARRAYS FOR JSON
        groups.performance_metrics.unique_dates = Array.from(groups.performance_metrics.unique_dates);
        groups.performance_metrics.unique_sports = Array.from(groups.performance_metrics.unique_sports);

        return groups;
    }

    // 🎯 EXISTING METHODS (Keep your working logic)
    countRawData() {
        const counts = { tom: 0, sarah: 0, wendy: 0 };
        
        try {
            const tomData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
            if (tomData.events) {
                Object.values(tomData.events).forEach(dayMatches => {
                    if (Array.isArray(dayMatches)) counts.tom += dayMatches.length;
                });
            }
        } catch (e) { counts.tom = 'ERROR'; }
        
        try {
            const sarahData = JSON.parse(fs.readFileSync('./suppliers/sarah-data.json', 'utf8'));
            if (sarahData.matches && Array.isArray(sarahData.matches)) {
                counts.sarah = sarahData.matches.length;
            } else if (Array.isArray(sarahData)) {
                counts.sarah = sarahData.length;
            }
        } catch (e) { counts.sarah = 'ERROR'; }
        
        try {
            const wendyData = JSON.parse(fs.readFileSync('./suppliers/wendy-data.json', 'utf8'));
            counts.wendy = (wendyData.matches && Array.isArray(wendyData.matches)) ? wendyData.matches.length : 0;
        } catch (e) { counts.wendy = 'ERROR'; }
        
        return counts;
    }

    async processSupplier(supplierName) {
        console.log(`\n🔧 PROCESSING ${supplierName.toUpperCase()}...`);
        
        try {
            const config = supplierConfig[supplierName];
            if (!config || !fs.existsSync(config.file)) {
                console.log(`❌ ${supplierName} config or file not found`);
                return [];
            }

            const rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
            const matches = [];
            let rawMatches = [];

            if (supplierName === 'tom' && rawData.events) {
                Object.values(rawData.events).forEach(dayMatches => {
                    if (Array.isArray(dayMatches)) rawMatches.push(...dayMatches);
                });
            }
            else if ((supplierName === 'sarah' || supplierName === 'wendy') && rawData.matches) {
                rawMatches = rawData.matches;
            }
            else if (Array.isArray(rawData)) {
                rawMatches = rawData;
            } else {
                console.log(`❌ Unknown data structure for ${supplierName}`);
                return [];
            }

            console.log(`📦 Found ${rawMatches.length} raw matches`);

            let processedCount = 0;
            rawMatches.forEach((rawMatch, index) => {
                try {
                    const standardized = this.normalizationMap.standardizeMatch(rawMatch, supplierName);
                    matches.push(standardized);
                    processedCount++;

                    if (index < 2) {
                        console.log(`   ✅ ${supplierName} match: "${standardized.match}"`);
                    }
                } catch (matchError) {
                    console.log(`   ❌ Failed to process ${supplierName} match ${index}:`, matchError.message);
                }
            });

            this.results.suppliers[supplierName] = processedCount;
            console.log(`✅ ${supplierName}: ${processedCount}/${rawMatches.length} matches standardized`);
            return matches;

        } catch (error) {
            console.log(`❌ ${supplierName} processing failed:`, error.message);
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
        console.log('══════════════════════════════════════');
        console.log(`📦 Tom: ${counts.tom} matches`);
        console.log(`📦 Sarah: ${counts.sarah} matches`);
        console.log(`📦 Wendy: ${counts.wendy} matches`);
        console.log(`📦 Total: ${
            (counts.tom === 'ERROR' ? 0 : counts.tom) + 
            (counts.sarah === 'ERROR' ? 0 : counts.sarah) + 
            (counts.wendy === 'ERROR' ? 0 : counts.wendy)
        } matches`);
        console.log('══════════════════════════════════════\n');
    }

    saveStandardizedData(data) {
        const outputPath = './standardization-UNIVERSAL.json';
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 Optimized standardized data saved to: ${outputPath}`);
    }

    logResults(data) {
        console.log('\n📊 OPTIMIZED STANDARDIZER RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Matches: ${data.summary.after_processing.total}`);
        console.log(`🔧 Tom: ${data.summary.after_processing.tom} matches`);
        console.log(`🔧 Sarah: ${data.summary.after_processing.sarah} matches`);
        console.log(`🔧 Wendy: ${data.summary.after_processing.wendy} matches`);
        
        console.log('\n⚡ OPTIMIZATION REPORT:');
        console.log(`   Pre-filtered: ${data.summary.optimization_report.preFiltered} matches`);
        console.log(`   Fingerprints: ${data.summary.optimization_report.fingerprintsGenerated} generated`);
        console.log(`   Groups: ${data.summary.optimization_report.groupsCreated} created`);
        
        console.log('\n📉 DATA LOSS:');
        console.log(`📦 Tom: ${data.summary.data_loss.tom_loss}`);
        console.log(`📦 Sarah: ${data.summary.data_loss.sarah_loss}`);
        console.log(`📦 Wendy: ${data.summary.data_loss.wendy_loss}`);
        console.log(`📦 Total: ${data.summary.data_loss.total_loss}`);
        
        console.log('══════════════════════════════════════\n');
    }
}

// Run if called directly
if (require.main === module) {
    const standardizer = new OptimizedUniversalStandardizer();
    standardizer.standardizeAllData()
        .then(() => {
            console.log('🎉 OPTIMIZED UNIVERSAL STANDARDIZER COMPLETED!');
            console.log('💾 Phase 2 ready: standardization-UNIVERSAL.json');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Optimized standardizer failed:', error);
            process.exit(1);
        });
}

module.exports = OptimizedUniversalStandardizer;
