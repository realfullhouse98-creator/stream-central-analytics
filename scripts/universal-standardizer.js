const fs = require('fs');
const path = require('path');
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
    }

    async standardizeAllData() {
        console.log('🚀 UNIVERSAL STANDARDIZER - PHASE 1\n');
        
        try {
            // Step 1: Count raw data before processing
            const beforeCounts = this.countRawData();
            this.logBeforeProcessing(beforeCounts);
            
            // Step 2: Process each supplier
            const allMatches = [];
            const suppliers = Object.keys(supplierConfig);

            for (const supplier of suppliers) {
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
                    suppliers_processed: suppliers,
                    supplier_breakdown: this.results.suppliers,
                    before_processing: beforeCounts,
                    after_processing: {
                        total: allMatches.length,
                        tom: this.results.suppliers.tom || 0,
                        sarah: this.results.suppliers.sarah || 0,
                        wendy: this.results.suppliers.wendy || 0
                    }
                },
                field_mapping_report: this.results.fieldMappingReport,
                matches: allMatches
            };

            // Step 4: Calculate data loss
            standardizedData.summary.data_loss = this.calculateDataLoss(beforeCounts, standardizedData.summary.after_processing);

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
        const counts = { tom: 0, sarah: 0, wendy: 0 };
        
        try {
            // Count Tom matches
            const tomData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
            if (tomData.events) {
                Object.values(tomData.events).forEach(dayMatches => {
                    if (Array.isArray(dayMatches)) counts.tom += dayMatches.length;
                });
            }
        } catch (e) { 
            counts.tom = 'ERROR'; 
            console.log('❌ Error counting Tom data:', e.message);
        }
        
        try {
            // Count Sarah matches
            const sarahData = JSON.parse(fs.readFileSync('./suppliers/sarah-data.json', 'utf8'));
            if (sarahData.matches && Array.isArray(sarahData.matches)) {
                counts.sarah = sarahData.matches.length;
            } else if (Array.isArray(sarahData)) {
                counts.sarah = sarahData.length;
            }
        } catch (e) { 
            counts.sarah = 'ERROR'; 
            console.log('❌ Error counting Sarah data:', e.message);
        }
        
        try {
            // Count Wendy matches
            const wendyData = JSON.parse(fs.readFileSync('./suppliers/wendy-data.json', 'utf8'));
            counts.wendy = (wendyData.matches && Array.isArray(wendyData.matches)) ? wendyData.matches.length : 0;
        } catch (e) { 
            counts.wendy = 'ERROR'; 
            console.log('❌ Error counting Wendy data:', e.message);
        }
        
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

            // Extract matches array based on supplier structure
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

            // Process each match with universal normalization
            let processedCount = 0;
            rawMatches.forEach((rawMatch, index) => {
                try {
                    const standardized = this.normalizationMap.standardizeMatch(rawMatch, supplierName);
                    matches.push(standardized);
                    processedCount++;

                    // Log first 3 matches to show it's working
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
        console.log('📊 RAW DATA COUNT (BEFORE PROCESSING):');
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
        console.log(`💾 Universal standardized data saved to: ${outputPath}`);
    }

    logResults(data) {
        console.log('\n📊 UNIVERSAL STANDARDIZER RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Matches: ${data.summary.after_processing.total}`);
        console.log(`🔧 Tom: ${data.summary.after_processing.tom} matches`);
        console.log(`🔧 Sarah: ${data.summary.after_processing.sarah} matches`);
        console.log(`🔧 Wendy: ${data.summary.after_processing.wendy} matches`);
        
        console.log('\n📉 DATA LOSS REPORT:');
        console.log(`📦 Tom: ${data.summary.data_loss.tom_loss}`);
        console.log(`📦 Sarah: ${data.summary.data_loss.sarah_loss}`);
        console.log(`📦 Wendy: ${data.summary.data_loss.wendy_loss}`);
        console.log(`📦 Total: ${data.summary.data_loss.total_loss}`);
        
        console.log('══════════════════════════════════════\n');
        console.log('🎯 READY FOR 20+ SUPPLIERS!');
        console.log('💾 Output: standardization-UNIVERSAL.json');
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
