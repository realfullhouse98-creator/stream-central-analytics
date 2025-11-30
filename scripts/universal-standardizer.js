const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NormalizationMap = require('../modules/normalization-map.js');
const supplierConfig = require('../suppliers/supplier-config.js');

class UniversalStandardizer {
    constructor() {
        this.normalizationMap = new NormalizationMap();
        this.results = {
            startTime: new Date().toISOString(),
            suppliers: {},
            fieldMappingReport: {}
        };
        this.allSuppliers = Object.keys(supplierConfig);
    }

    async standardizeAllData() {
        console.log('🚀 UNIVERSAL STANDARDIZER - PHASE 1\n');
        
        try {
            // Step 1: Count raw data before processing
            const beforeCounts = this.countRawData();
            this.logBeforeProcessing(beforeCounts);

            // Step 2: Process each supplier
            const allMatches = [];

            for (const supplier of this.allSuppliers) {
                const supplierMatches = await this.processSupplier(supplier);
                allMatches.push(...supplierMatches);
            }

            // Step 3: Create final output
            const standardizedData = {
                phase: "1-universal-standardization",
                created_at: new Date().toISOString(),
                normalization_map: this.normalizationMap.getAllFieldNames(),
                summary: {
                    total_matches: allMatches.length,
                    suppliers_processed: this.allSuppliers,
                    supplier_breakdown: this.results.suppliers,
                    before_processing: beforeCounts,
                    after_processing: this.getAfterProcessingCounts(allMatches)
                },
                field_mapping_report: this.results.fieldMappingReport,
                matches: allMatches
            };

            // Step 4: Calculate data loss
            standardizedData.summary.data_loss = this.calculateDataLoss(
                beforeCounts,
                standardizedData.summary.after_processing
            );

            // Step 5: Save and log results
            this.saveStandardizedData(standardizedData);
            this.logResults(standardizedData);

            return standardizedData;

        } catch (error) {
            console.error('💥 Universal standardizer failed:', error);
            throw error;
        }
    }

    countRawData() {
        const counts = {};
        this.allSuppliers.forEach(s => counts[s] = 0);

        for (const supplier of this.allSuppliers) {
            try {
                const config = supplierConfig[supplier];
                if (!config || !fs.existsSync(config.file)) {
                    counts[supplier] = 'ERROR';
                    continue;
                }

                const rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
                let rawMatches = [];

                if (supplier === 'tom' && rawData.events) {
                    Object.values(rawData.events).forEach(dayMatches => {
                        if (Array.isArray(dayMatches)) rawMatches.push(...dayMatches);
                    });
                } else if ((supplier === 'sarah' || supplier === 'wendy') && rawData.matches) {
                    rawMatches = rawData.matches;
                } else if (Array.isArray(rawData)) {
                    rawMatches = rawData;
                }

                counts[supplier] = rawMatches.length;

            } catch (e) {
                counts[supplier] = 'ERROR';
                console.log(`❌ Error counting ${supplier} data:`, e.message);
            }
        }

        return counts;
    }

    async processSupplier(supplierName) {
        console.log(`\n🔧 PROCESSING ${supplierName.toUpperCase()}...`);
        
        const matches = [];

        try {
            const config = supplierConfig[supplierName];
            if (!config || !fs.existsSync(config.file)) {
                console.log(`❌ ${supplierName} config or file not found`);
                return matches;
            }

            const rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
            let rawMatches = [];

            // Extract matches array based on supplier structure
            if (supplierName === 'tom' && rawData.events) {
                Object.values(rawData.events).forEach(dayMatches => {
                    if (Array.isArray(dayMatches)) rawMatches.push(...dayMatches);
                });
            } else if ((supplierName === 'sarah' || supplierName === 'wendy') && rawData.matches) {
                rawMatches = rawData.matches;
            } else if (Array.isArray(rawData)) {
                rawMatches = rawData;
            } else {
                console.log(`❌ Unknown data structure for ${supplierName}`);
                return matches;
            }

            console.log(`📦 Found ${rawMatches.length} raw matches`);

            // Process each match with universal normalization
            let processedCount = 0;

            rawMatches.forEach((rawMatch, index) => {
                try {
                    let standardized = this.normalizationMap.standardizeMatch(rawMatch, supplierName);

                    // Ensure unix_timestamp exists
                    standardized.unix_timestamp = this.getUnixTimestamp(standardized);

                    // Ensure sources object includes all suppliers
                    standardized.sources = standardized.sources || {};
                    this.allSuppliers.forEach(s => {
                        if (!standardized.sources[s]) standardized.sources[s] = [];
                    });

                    // Optional unique match ID
                    standardized.match_id = this.generateMatchId(standardized);

                    matches.push(standardized);
                    processedCount++;

                    if (index < 3) {
                        console.log(`   ✅ ${supplierName} match: "${standardized.match}"`);
                        console.log(`      Sport: ${standardized.sport} | Streams: ${Object.values(standardized.sources).flat().length}`);
                    }

                } catch (matchError) {
                    console.log(`   ❌ Failed to process ${supplierName} match ${index}:`, matchError.message);
                }
            });

            this.results.suppliers[supplierName] = processedCount;
            console.log(`✅ ${supplierName}: ${processedCount}/${rawMatches.length} matches standardized`);

        } catch (error) {
            console.log(`❌ ${supplierName} processing failed:`, error.message);
        }

        return matches;
    }

    getUnixTimestamp(match) {
        if (match.unix_timestamp) return match.unix_timestamp;

        if (match.start_time) return Math.floor(new Date(match.start_time).getTime() / 1000);
        if (match.date) return Math.floor(new Date(match.date).getTime() / 1000);

        return Math.floor(Date.now() / 1000); // fallback to now
    }

    generateMatchId(match) {
        const hash = crypto.createHash('sha1');
        hash.update(`${match.match}-${match.sport}-${match.tournament}-${match.unix_timestamp}`);
        return hash.digest('hex');
    }

    getAfterProcessingCounts(allMatches) {
        const after = {};
        this.allSuppliers.forEach(s => {
            after[s] = allMatches.filter(m => m.sources[s] && m.sources[s].length > 0).length;
        });
        after.total = allMatches.length;
        return after;
    }

    calculateDataLoss(before, after) {
        const loss = {};
        let totalRaw = 0;
        let totalAfter = 0;

        this.allSuppliers.forEach(s => {
            if (before[s] === 'ERROR' || after[s] === 'ERROR') {
                loss[s + '_loss'] = 'ERROR';
            } else {
                loss[s + '_loss'] = before[s] - after[s];
                totalRaw += before[s];
                totalAfter += after[s];
            }
        });

        loss.total_loss = totalRaw - totalAfter;
        return loss;
    }

    logBeforeProcessing(counts) {
        console.log('📊 RAW DATA COUNT (BEFORE PROCESSING):');
        console.log('══════════════════════════════════════');
        this.allSuppliers.forEach(s => console.log(`📦 ${this.capitalize(s)}: ${counts[s]} matches`));
        const total = this.allSuppliers.reduce((acc, s) => acc + (counts[s] === 'ERROR' ? 0 : counts[s]), 0);
        console.log(`📦 Total: ${total} matches`);
        console.log('══════════════════════════════════════\n');
    }

    logResults(data) {
        console.log('\n📊 UNIVERSAL STANDARDIZER RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Matches: ${data.summary.after_processing.total}`);
        this.allSuppliers.forEach(s => {
            console.log(`🔧 ${this.capitalize(s)}: ${data.summary.after_processing[s]} matches`);
        });

        console.log('\n📉 DATA LOSS REPORT:');
        this.allSuppliers.forEach(s => {
            console.log(`📦 ${this.capitalize(s)}: ${data.summary.data_loss[s + '_loss']}`);
        });
        console.log(`📦 Total: ${data.summary.data_loss.total_loss}`);
        console.log('══════════════════════════════════════\n');
        console.log('🎯 READY FOR 20+ SUPPLIERS!');
        console.log('💾 Output: standardization-UNIVERSAL.json');
    }

    saveStandardizedData(data) {
        const outputPath = './standardization-UNIVERSAL.json';
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 Universal standardized data saved to: ${outputPath}`);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Run if called directly
if (require.main === module) {
    const standardizer = new UniversalStandardizer();
    standardizer.standardizeAllData()
        .then(() => {
            console.log('🎉 UNIVERSAL STANDARDIZER COMPLETED!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Universal standardizer failed:', error);
            process.exit(1);
        });
}

module.exports = UniversalStandardizer;
