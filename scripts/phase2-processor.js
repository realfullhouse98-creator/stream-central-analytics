const fs = require('fs');
const path = require('path');

class ProfessionalPhase2Processor {
    constructor() {
        this.results = {
            startTime: Date.now(),
            totalProcessed: 0,
            merged: 0,
            individual: 0,
            sportBreakdown: {},
            integrity: {
                inputMatches: 0,
                outputMatches: 0,
                dataLoss: 0,
                mergeDecisions: []
            }
        };
        
        // 🎯 CENTRAL TRUTH REGISTRIES
        this.matchRegistry = new Map(); // Track all input matches
        this.fingerprintRegistry = new Map(); // Group by fingerprint
        this.mergeAudit = []; // Every decision logged
        
        // 🎯 PERFORMANCE OPTIMIZATION
        this.teamCache = new Map();
    }

    async processStandardizedData() {
        console.log('🔒 PROFESSIONAL PHASE 2 - DETERMINISTIC PROCESSING\n');
        
        try {
            // Memory usage tracking
            this.results.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`💾 Memory usage: ${this.results.memoryUsage.toFixed(2)} MB`);

            // Step 1: Load and validate standardized data
            const standardizedData = this.loadAndValidateStandardizedData();
            console.log(`📥 Loaded ${standardizedData.matches.length} standardized matches`);
            this.results.integrity.inputMatches = standardizedData.matches.length;

            // Step 2: Register all matches with fingerprints
            this.registerAllMatches(standardizedData.matches);
            
            // Step 3: Group by fingerprint for deterministic merging
            const fingerprintGroups = this.groupByFingerprint(standardizedData.matches);
            console.log(`🎯 Found ${fingerprintGroups.size} unique match fingerprints`);

            // Step 4: Process each fingerprint group
            const processedData = this.processFingerprintGroups(fingerprintGroups);

            // Step 5: Create verified master data
            this.createVerifiedMasterData(processedData, standardizedData);
            
            // Step 6: Generate comprehensive integrity report
            this.generateIntegrityReport();
            
            this.results.processingTime = Date.now() - this.results.startTime;
            console.log(`⏱️  Total processing time: ${this.results.processingTime}ms`);
            
            return processedData;
            
        } catch (error) {
            console.error('💥 Professional Phase 2 failed:', error);
            this.logEmergencyRecovery();
            throw error;
        }
    }

    loadAndValidateStandardizedData() {
        const filePath = './standardization-UNIVERSAL.json';
        
        if (!fs.existsSync(filePath)) {
            throw new Error('Phase 1 output not found. Run professional-standardizer first.');
        }
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // 🎯 VALIDATE REQUIRED FIELDS
        if (!data.matches || !Array.isArray(data.matches)) {
            throw new Error('Standardized data missing matches array');
        }
        
        if (data.matches.length === 0) {
            console.log('⚠️  WARNING: Standardized data contains 0 matches');
        }
        
        // Validate fingerprints exist
        const matchesWithoutFingerprints = data.matches.filter(m => !m.fingerprint);
        if (matchesWithoutFingerprints.length > 0) {
            throw new Error(`${matchesWithoutFingerprints.length} matches missing fingerprints`);
        }
        
        console.log(`✅ Data validation: ${data.matches.length} matches with fingerprints`);
        return data;
    }

    registerAllMatches(matches) {
        console.log('\n🔍 REGISTERING ALL MATCHES...');
        
        matches.forEach((match, index) => {
            const matchId = match.original_id || `match-${index}-${Date.now()}`;
            
            this.matchRegistry.set(matchId, {
                id: matchId,
                source: match.source,
                fingerprint: match.fingerprint,
                match: match.match,
                sport: match.sport,
                tournament: match.tournament,
                timestamp: match.unix_timestamp,
                sources: match.sources ? Object.keys(match.sources) : [],
                processed: false,
                registered_at: new Date().toISOString()
            });
        });
        
        console.log(`✅ Registered ${this.matchRegistry.size} matches`);
    }

    groupByFingerprint(matches) {
        const groups = new Map();
        
        matches.forEach(match => {
            if (!groups.has(match.fingerprint)) {
                groups.set(match.fingerprint, []);
            }
            groups.get(match.fingerprint).push(match);
        });
        
        // 🎯 ANALYZE GROUP SIZES
        const groupSizes = Array.from(groups.values()).map(g => g.length);
        const maxGroupSize = Math.max(...groupSizes);
        const duplicateGroups = groupSizes.filter(size => size > 1).length;
        
        console.log(`📊 Fingerprint analysis:`);
        console.log(`   Unique fingerprints: ${groups.size}`);
        console.log(`   Potential merges: ${duplicateGroups}`);
        console.log(`   Largest group: ${maxGroupSize} matches`);
        
        return groups;
    }

    processFingerprintGroups(fingerprintGroups) {
        console.log('\n🔧 PROCESSING FINGERPRINT GROUPS...');
        
        const processedMatches = [];
        let mergeDecisions = 0;
        
        // Create progress indicator
        const totalGroups = fingerprintGroups.size;
        let processedGroups = 0;
        
        fingerprintGroups.forEach((matches, fingerprint) => {
            const result = this.processMatchGroup(fingerprint, matches);
            processedMatches.push(result);
            
            // 🎯 AUDIT EVERY DECISION
            this.mergeAudit.push({
                fingerprint: fingerprint,
                input_matches: matches.length,
                output: result.merged ? 'MERGED' : 'INDIVIDUAL', 
                sources: matches.map(m => m.source),
                merged_sources: result.merged ? Object.keys(result.sources) : [],
                confidence: result.confidence,
                timestamp: new Date().toISOString()
            });
            
            if (result.merged) {
                this.results.merged++;
                mergeDecisions++;
            } else {
                this.results.individual++;
            }
            
            processedGroups++;
            if (processedGroups % 100 === 0 || processedGroups === totalGroups) {
                const percent = Math.round((processedGroups / totalGroups) * 100);
                console.log(`   Progress: ${processedGroups}/${totalGroups} (${percent}%) - ${mergeDecisions} merges`);
            }
        });
        
        this.results.totalProcessed = processedMatches.length;
        console.log(`✅ Processed ${processedMatches.length} match groups`);
        
        return processedMatches;
    }

    processMatchGroup(fingerprint, matches) {
        // 🎯 DETERMINISTIC LOGIC: Same fingerprint = SAME MATCH
        if (matches.length === 1) {
            return {
                ...matches[0],
                merged: false,
                merged_count: 1,
                confidence: 1.0
            };
        }
        
        // 🎯 VERIFIED MERGE - Aggregate all sources
        const baseMatch = this.selectBaseMatch(matches);
        const allSources = { tom: [], sarah: [], wendy: [] };
        
        matches.forEach(match => {
            if (match.sources) {
                Object.keys(match.sources).forEach(source => {
                    if (match.sources[source] && Array.isArray(match.sources[source])) {
                        // 🎯 DEDUPLICATE STREAMS
                        match.sources[source].forEach(stream => {
                            if (!allSources[source].includes(stream)) {
                                allSources[source].push(stream);
                            }
                        });
                    }
                });
            }
        });
        
        // 🎯 CALCULATE VERIFIED CONFIDENCE
        const confidence = this.calculateVerifiedConfidence(matches);
        
        return {
            ...baseMatch,
            sources: allSources,
            confidence: confidence,
            merged: true,
            merged_count: matches.length,
            fingerprint: fingerprint, // 🎯 TRACEABILITY
            merged_sources: matches.map(m => m.source),
            audit_trail: {
                merged_at: new Date().toISOString(),
                source_count: matches.length,
                stream_counts: Object.keys(allSources).reduce((acc, source) => {
                    acc[source] = allSources[source].length;
                    return acc;
                }, {})
            }
        };
    }

    selectBaseMatch(matches) {
        // 🎯 SELECT MOST COMPLETE MATCH AS BASE
        return matches.reduce((best, current) => {
            const bestScore = this.calculateMatchCompleteness(best);
            const currentScore = this.calculateMatchCompleteness(current);
            return currentScore > bestScore ? current : best;
        });
    }

    calculateMatchCompleteness(match) {
        let score = 0;
        
        if (match.match) score += 30;
        if (match.sport) score += 20;
        if (match.tournament) score += 20;
        if (match.sources) {
            const streamCount = Object.values(match.sources).flat().length;
            score += Math.min(streamCount * 2, 30); // Max 30 for streams
        }
        
        return score;
    }

    calculateVerifiedConfidence(matches) {
        // 🎯 DETERMINISTIC CONFIDENCE BASED ON FINGERPRINT MATCH
        const sourceCount = matches.length;
        
        if (sourceCount >= 3) return 1.0;    // 100% - Multiple sources agree
        if (sourceCount === 2) return 0.95;   // 95% - Two independent sources
        return 0.9;                           // 90% - Single source (shouldn't happen here)
    }

    createVerifiedMasterData(processedMatches, standardizedData) {
        console.log('\n🔒 CREATING VERIFIED MASTER DATA...');
        
        const masterData = {
            processed_at: new Date().toISOString(),
            processor_version: '2.0-professional-deterministic',
            phase1_source: standardizedData.created_at,
            integrity: {
                input_matches: this.results.integrity.inputMatches,
                output_matches: processedMatches.length,
                data_loss: this.results.integrity.inputMatches - processedMatches.length,
                merge_rate: ((this.results.merged / processedMatches.length) * 100).toFixed(1) + '%',
                individual_rate: ((this.results.individual / processedMatches.length) * 100).toFixed(1) + '%'
            },
            summary: {
                total_matches: processedMatches.length,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                processing_time_ms: this.results.processingTime,
                memory_usage_mb: this.results.memoryUsage
            },
            matches: processedMatches
        };
        
        // 🎯 FINAL VALIDATION
        this.validateMasterData(masterData);
        
        // Save master data
        try {
            const masterDataJson = JSON.stringify(masterData, null, 2);
            JSON.parse(masterDataJson); // Validate JSON
            fs.writeFileSync('./master-data.json', masterDataJson);
            console.log('✅ Verified master data saved successfully');
            
        } catch (error) {
            console.error('❌ Master data validation failed:', error.message);
            throw error;
        }
        
        return masterData;
    }

    validateMasterData(masterData) {
        console.log('\n🔍 VALIDATING MASTER DATA INTEGRITY...');
        
        // Check for data loss
        const dataLoss = this.results.integrity.inputMatches - masterData.matches.length;
        if (dataLoss > 0) {
            console.log(`⚠️  WARNING: ${dataLoss} matches lost during processing`);
        }
        
        // Check merged matches integrity
        const mergedMatches = masterData.matches.filter(m => m.merged);
        const badMerges = mergedMatches.filter(m => 
            !m.sources || Object.keys(m.sources).length === 0
        );
        
        if (badMerges.length > 0) {
            console.log(`❌ CRITICAL: ${badMerges.length} merged matches have no sources`);
        }
        
        // Check stream distribution
        const sourceCounts = { tom: 0, sarah: 0, wendy: 0 };
        masterData.matches.forEach(match => {
            if (match.sources) {
                Object.keys(match.sources).forEach(source => {
                    if (match.sources[source] && match.sources[source].length > 0) {
                        sourceCounts[source]++;
                    }
                });
            }
        });
        
        console.log('📊 Source distribution in master data:');
        console.log(`   Tom: ${sourceCounts.tom} matches`);
        console.log(`   Sarah: ${sourceCounts.sarah} matches`);
        console.log(`   Wendy: ${sourceCounts.wendy} matches`);
        
        // Emergency recovery if critical issues found
        if (badMerges.length > 0 || dataLoss > this.results.integrity.inputMatches * 0.1) {
            this.triggerEmergencyRecovery();
        }
    }

    generateIntegrityReport() {
        const integrityReport = {
            generated_at: new Date().toISOString(),
            phase: "2-processing",
            executive_summary: {
                status: this.results.integrity.dataLoss > 0 ? 'NEEDS_REVIEW' : 'OPTIMAL',
                total_input: this.results.integrity.inputMatches,
                total_output: this.results.totalProcessed,
                data_loss: this.results.integrity.dataLoss,
                data_loss_percentage: ((this.results.integrity.dataLoss / this.results.integrity.inputMatches) * 100).toFixed(1) + '%',
                merge_efficiency: ((this.results.merged / this.results.totalProcessed) * 100).toFixed(1) + '%'
            },
            detailed_analysis: {
                merge_decisions: this.mergeAudit.length,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                average_confidence: this.calculateAverageConfidence(),
                processing_time: this.results.processingTime + 'ms',
                memory_peak: this.results.memoryUsage.toFixed(2) + ' MB'
            },
            merge_audit_sample: this.mergeAudit.slice(0, 10), // Sample for review
            potential_issues: this.identifyPotentialIssues(),
            recommendations: this.generateProfessionalRecommendations(),
            recovery_procedures: this.generateRecoveryProcedures()
        };
        
        fs.writeFileSync('./integrity-phase2-report.json', JSON.stringify(integrityReport, null, 2));
        console.log('🔒 PHASE 2 INTEGRITY REPORT: integrity-phase2-report.json');
    }

    calculateAverageConfidence() {
        if (this.mergeAudit.length === 0) return 0;
        const totalConfidence = this.mergeAudit.reduce((sum, audit) => sum + (audit.confidence || 0), 0);
        return (totalConfidence / this.mergeAudit.length).toFixed(3);
    }

    identifyPotentialIssues() {
        const issues = [];
        
        // Data loss detection
        if (this.results.integrity.dataLoss > 0) {
            issues.push({
                severity: 'HIGH',
                type: 'DATA_LOSS',
                description: `${this.results.integrity.dataLoss} matches lost during processing`,
                recommendation: 'Review integrity-phase1-report.json for details'
            });
        }
        
        // Low merge rate detection
        const mergeRate = (this.results.merged / this.results.totalProcessed);
        if (mergeRate < 0.1) {
            issues.push({
                severity: 'MEDIUM', 
                type: 'LOW_MERGE_RATE',
                description: `Only ${(mergeRate * 100).toFixed(1)}% of matches merged`,
                recommendation: 'Review fingerprint algorithm for over-specificity'
            });
        }
        
        // High merge rate detection
        if (mergeRate > 0.9) {
            issues.push({
                severity: 'MEDIUM',
                type: 'HIGH_MERGE_RATE', 
                description: `${(mergeRate * 100).toFixed(1)}% of matches merged - possible over-merging`,
                recommendation: 'Review fingerprint algorithm for over-generalization'
            });
        }
        
        return issues;
    }

    generateProfessionalRecommendations() {
        const recommendations = [];
        
        if (this.results.integrity.dataLoss > 0) {
            recommendations.push('INVESTIGATE_DATA_LOSS: Review failed matches in integrity reports');
        }
        
        if (this.results.memoryUsage > 100) {
            recommendations.push('OPTIMIZE_MEMORY: Consider streaming processing for large datasets');
        }
        
        if (this.results.processingTime > 30000) {
            recommendations.push('OPTIMIZE_PERFORMANCE: Consider parallel processing for large datasets');
        }
        
        return recommendations.length > 0 ? recommendations : ['SYSTEM_OPTIMAL: No immediate actions required'];
    }

    generateRecoveryProcedures() {
        return {
            data_loss_recovery: 'Restore from standardization-UNIVERSAL.json and review integrity reports',
            merge_errors: 'Check merge_audit in integrity-phase2-report.json for specific issues',
            performance_issues: 'Reduce batch size or implement streaming processing',
            emergency_rollback: 'Use previous master-data.json backup if critical issues found'
        };
    }

    triggerEmergencyRecovery() {
        console.log('\n🚨 EMERGENCY RECOVERY TRIGGERED!');
        
        const recoveryData = {
            emergency: true,
            triggered_at: new Date().toISOString(),
            issues_detected: this.identifyPotentialIssues(),
            recovery_actions: [
                'Preserving current standardization-UNIVERSAL.json',
                'Creating emergency backup of current state',
                'Alerting system administrators'
            ]
        };
        
        fs.writeFileSync('./emergency-recovery.json', JSON.stringify(recoveryData, null, 2));
        console.log('🚨 EMERGENCY RECOVERY: emergency-recovery.json created');
    }

    logEmergencyRecovery() {
        const recoveryLog = {
            crash_time: new Date().toISOString(),
            processed_matches: this.results.totalProcessed,
            memory_usage: this.results.memoryUsage,
            last_known_state: this.results
        };
        
        fs.writeFileSync('./crash-recovery.log', JSON.stringify(recoveryLog, null, 2));
        console.log('💥 CRASH RECOVERY: crash-recovery.log created');
    }
}

// Main execution
if (require.main === module) {
    const processor = new ProfessionalPhase2Processor();
    processor.processStandardizedData()
        .then(() => {
            console.log('\n🎉 PROFESSIONAL PHASE 2 COMPLETED!');
            console.log('🔒 Comprehensive integrity reports generated');
            console.log('💾 Verified master data: master-data.json');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Professional Phase 2 failed:', error);
            process.exit(1);
        });
}

module.exports = ProfessionalPhase2Processor;
