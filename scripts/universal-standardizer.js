const fs = require('fs');
const path = require('path');
const NormalizationMap = require('../modules/normalization-map.js');
const supplierConfig = require('../suppliers/supplier-config.js');

class ProfessionalStandardizer {
    constructor() {
        this.normalizationMap = new NormalizationMap();
        this.results = {
            startTime: new Date().toISOString(),
            suppliers: {},
            integrity: {
                totalInput: 0,
                totalOutput: 0,
                dataLoss: 0,
                failedMatches: []
            }
        };
        this.matchRegistry = new Map(); // 🎯 Track every match
    }

    async standardizeAllData() {
        console.log('🔒 PROFESSIONAL UNIVERSAL STANDARDIZER\n');
        
        try {
            // Step 1: Count and validate raw data
            const beforeCounts = this.countAndValidateRawData();
            this.logBeforeProcessing(beforeCounts);

            // Step 2: Process each supplier with integrity tracking
            const allMatches = [];
            const suppliers = Object.keys(supplierConfig);

            for (const supplier of suppliers) {
                const supplierMatches = await this.processSupplierWithIntegrity(supplier);
                allMatches.push(...supplierMatches);
            }

            // Step 3: Create verified output
            const standardizedData = this.createVerifiedOutput(allMatches, beforeCounts);

            // Step 4: Save and validate
            this.saveAndValidateStandardizedData(standardizedData);
            this.generateIntegrityReport(standardizedData);
            
            return standardizedData;

        } catch (error) {
            console.error('💥 Professional standardizer failed:', error);
            this.results.integrity.failedMatches.push({
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async processSupplierWithIntegrity(supplierName) {
        console.log(`\n🔧 PROCESSING ${supplierName.toUpperCase()} WITH INTEGRITY...`);
        
        try {
            const config = supplierConfig[supplierName];
            if (!config || !fs.existsSync(config.file)) {
                throw new Error(`${supplierName} config or file not found`);
            }

            const rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
            const rawMatches = this.extractRawMatches(rawData, supplierName);
            
            console.log(`📦 Found ${rawMatches.length} raw matches`);
            this.results.integrity.totalInput += rawMatches.length;

            const matches = [];
            let failedCount = 0;

            // Process each match with fingerprint creation
            rawMatches.forEach((rawMatch, index) => {
                try {
                    const standardized = this.normalizationMap.standardizeMatch(rawMatch, supplierName);
                    
                    // 🎯 CREATE UNIQUE FINGERPRINT
                    const fingerprint = this.createMatchFingerprint(standardized);
                    standardized.fingerprint = fingerprint;
                    standardized.original_id = `${supplierName}-${index}-${Date.now()}`;
                    
                    // 🎯 REGISTER MATCH
                    this.matchRegistry.set(standardized.original_id, {
                        source: supplierName,
                        fingerprint: fingerprint,
                        raw_data: rawMatch, // Keep original for debugging
                        processed: true,
                        timestamp: new Date().toISOString()
                    });

                    matches.push(standardized);
                    
                    // Log first 3 matches for verification
                    if (index < 3) {
                        console.log(`   ✅ ${supplierName}: "${standardized.match}"`);
                        console.log(`      Fingerprint: ${fingerprint}`);
                    }
                } catch (matchError) {
                    failedCount++;
                    console.log(`   ❌ Failed ${supplierName} match ${index}:`, matchError.message);
                    this.results.integrity.failedMatches.push({
                        supplier: supplierName,
                        index: index,
                        error: matchError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            this.results.suppliers[supplierName] = {
                processed: matches.length,
                failed: failedCount,
                successRate: ((matches.length / rawMatches.length) * 100).toFixed(1) + '%'
            };

            console.log(`✅ ${supplierName}: ${matches.length}/${rawMatches.length} matches (${failedCount} failed)`);
            return matches;

        } catch (error) {
            console.log(`❌ ${supplierName} processing failed:`, error.message);
            this.results.integrity.failedMatches.push({
                supplier: supplierName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return [];
        }
    }

    createMatchFingerprint(match) {
        // 🎯 DETERMINISTIC FINGERPRINT: Sport + Normalized Teams + Date
        const teams = this.extractAndNormalizeTeams(match.match);
        const date = this.normalizeDate(match.unix_timestamp);
        
        const fingerprint = [
            match.sport.toLowerCase().replace(/[^a-z0-9]/g, ''),
            teams.team1.toLowerCase().replace(/[^a-z0-9]/g, ''),
            teams.team2.toLowerCase().replace(/[^a-z0-9]/g, ''),
            date
        ].join('|');
        
        return fingerprint;
    }

    extractAndNormalizeTeams(matchText) {
        if (!matchText) return { team1: '', team2: '' };
        
        // Handle multiple separators
        const separators = [' vs ', ' - ', ' @ ', ' v '];
        let separator = ' vs ';
        let separatorIndex = -1;
        
        for (const sep of separators) {
            const index = matchText.indexOf(sep);
            if (index > -1) {
                separator = sep;
                separatorIndex = index;
                break;
            }
        }
        
        if (separatorIndex === -1) {
            return { team1: matchText.trim(), team2: '' };
        }
        
        return {
            team1: matchText.substring(0, separatorIndex).trim(),
            team2: matchText.substring(separatorIndex + separator.length).trim()
        };
    }

    normalizeDate(unixTimestamp) {
        if (!unixTimestamp) return 'unknown';
        
        try {
            const date = unixTimestamp > 1000000000000 ? 
                new Date(unixTimestamp) : 
                new Date(unixTimestamp * 1000);
            
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } catch (error) {
            return 'unknown';
        }
    }

    extractRawMatches(rawData, supplierName) {
        let rawMatches = [];
        
        try {
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
            }
        } catch (error) {
            console.log(`❌ Error extracting ${supplierName} matches:`, error.message);
        }
        
        return rawMatches;
    }

    countAndValidateRawData() {
        const counts = { tom: 0, sarah: 0, wendy: 0 };
        
        ['tom', 'sarah', 'wendy'].forEach(supplier => {
            try {
                const config = supplierConfig[supplier];
                if (config && fs.existsSync(config.file)) {
                    const data = JSON.parse(fs.readFileSync(config.file, 'utf8'));
                    const matches = this.extractRawMatches(data, supplier);
                    counts[supplier] = matches.length;
                }
            } catch (e) {
                counts[supplier] = 'ERROR';
                console.log(`❌ Error counting ${supplier} data:`, e.message);
            }
        });
        
        return counts;
    }

    createVerifiedOutput(allMatches, beforeCounts) {
        this.results.integrity.totalOutput = allMatches.length;
        this.results.integrity.dataLoss = this.results.integrity.totalInput - allMatches.length;

        return {
            phase: "1-professional-standardization",
            created_at: new Date().toISOString(),
            integrity: {
                input_counts: beforeCounts,
                output_count: allMatches.length,
                data_loss: this.results.integrity.dataLoss,
                failed_matches: this.results.integrity.failedMatches.length,
                match_registry_size: this.matchRegistry.size
            },
            fingerprint_system: {
                algorithm: "sport|team1|team2|date",
                examples: allMatches.slice(0, 3).map(m => ({
                    match: m.match,
                    fingerprint: m.fingerprint
                }))
            },
            summary: {
                total_matches: allMatches.length,
                suppliers_processed: Object.keys(supplierConfig),
                supplier_breakdown: this.results.suppliers
            },
            matches: allMatches
        };
    }

    saveAndValidateStandardizedData(data) {
        const outputPath = './standardization-UNIVERSAL.json';
        
        // Validate before saving
        this.validateOutputData(data);
        
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 Professional standardized data saved to: ${outputPath}`);
        
        // Verify file was written correctly
        const fileStats = fs.statSync(outputPath);
        if (fileStats.size === 0) {
            throw new Error('Output file is empty!');
        }
        
        console.log(`✅ File verification: ${fileStats.size} bytes`);
    }

    validateOutputData(data) {
        if (!data.matches || !Array.isArray(data.matches)) {
            throw new Error('Output data missing matches array');
        }
        
        if (data.matches.length === 0) {
            console.log('⚠️  WARNING: Output contains 0 matches');
        }
        
        // Check for required fields in first few matches
        const sampleMatches = data.matches.slice(0, 5);
        sampleMatches.forEach((match, index) => {
            if (!match.fingerprint) {
                throw new Error(`Match ${index} missing fingerprint`);
            }
            if (!match.sport) {
                throw new Error(`Match ${index} missing sport`);
            }
            if (!match.match) {
                throw new Error(`Match ${index} missing match field`);
            }
        });
    }

    generateIntegrityReport(standardizedData) {
        const integrityReport = {
            generated_at: new Date().toISOString(),
            phase: "1-standardization",
            summary: {
                total_input: this.results.integrity.totalInput,
                total_output: standardizedData.matches.length,
                data_loss: this.results.integrity.dataLoss,
                success_rate: ((standardizedData.matches.length / this.results.integrity.totalInput) * 100).toFixed(1) + '%'
            },
            suppliers: this.results.suppliers,
            failed_matches: this.results.integrity.failedMatches,
            fingerprint_analysis: this.analyzeFingerprints(standardizedData.matches),
            recommendations: this.generateRecommendations()
        };
        
        fs.writeFileSync('./integrity-phase1-report.json', JSON.stringify(integrityReport, null, 2));
        console.log('🔒 PHASE 1 INTEGRITY REPORT: integrity-phase1-report.json');
    }

    analyzeFingerprints(matches) {
        const fingerprintCounts = new Map();
        
        matches.forEach(match => {
            const count = fingerprintCounts.get(match.fingerprint) || 0;
            fingerprintCounts.set(match.fingerprint, count + 1);
        });
        
        const duplicates = Array.from(fingerprintCounts.entries())
            .filter(([_, count]) => count > 1)
            .map(([fingerprint, count]) => ({ fingerprint, count }));
            
        return {
            total_unique_fingerprints: fingerprintCounts.size,
            potential_merges: duplicates.length,
            duplicate_examples: duplicates.slice(0, 5)
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.integrity.dataLoss > 0) {
            recommendations.push(`Investigate ${this.results.integrity.dataLoss} matches lost during processing`);
        }
        
        if (this.results.integrity.failedMatches.length > 0) {
            recommendations.push(`Review ${this.results.integrity.failedMatches.length} failed matches`);
        }
        
        return recommendations.length > 0 ? recommendations : ['All systems optimal'];
    }

    logBeforeProcessing(counts) {
        console.log('🔍 RAW DATA VALIDATION:');
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
}

// Run if called directly
if (require.main === module) {
    const standardizer = new ProfessionalStandardizer();
    standardizer.standardizeAllData()
        .then(() => {
            console.log('\n🎉 PROFESSIONAL STANDARDIZER COMPLETED!');
            console.log('🔒 Integrity reports generated');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Professional standardizer failed:', error);
            process.exit(1);
        });
}

module.exports = ProfessionalStandardizer;
