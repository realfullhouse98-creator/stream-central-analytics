const fs = require('fs');
const path = require('path');

class Phase2Processor {
    constructor() {
        this.results = {
            totalProcessed: 0,
            merged: 0,
            individual: 0,
            sportBreakdown: {},
            processingTime: 0,
            memoryUsage: 0
        };
        this.startTime = Date.now();
        
        // LOWER MERGE THRESHOLDS (below 30% as requested)
       this.sportConfigs = {
    'Tennis': { mergeThreshold: 0.15, timeWindow: 480 },        // ↓ from 0.25
    'Football': { mergeThreshold: 0.10, timeWindow: 600 },      // ↓ from 0.20
    'Basketball': { mergeThreshold: 0.15, timeWindow: 600 },    // ↓ from 0.25
    'American Football': { mergeThreshold: 0.15, timeWindow: 600 }, // ↓ from 0.25
    'Ice Hockey': { mergeThreshold: 0.15, timeWindow: 600 },    // ↓ from 0.25
    'default': { mergeThreshold: 0.10, timeWindow: 480 }        // ↓ from 0.20
};

        // Cache for performance
        this.teamNormalizationCache = new Map();
    }

    async processStandardizedData() {
        console.log('🚀 STARTING PHASE 2 - ADVANCED PROCESSING\n');
        
        try {
            // Memory usage tracking
            this.results.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`💾 Memory usage: ${this.results.memoryUsage.toFixed(2)} MB`);

            // Step 1: Load standardized data from Phase 1
            const standardizedData = this.loadStandardizedData();
            console.log(`📥 Loaded ${standardizedData.matches.length} standardized matches`);
            
            // Step 2: Group by sport for processing
            const sportGroups = this.groupBySport(standardizedData.matches);
            console.log(`🏆 Found ${Object.keys(sportGroups).length} sports to process`);

            // Step 3: Process each sport with merging
            const processedData = {};
            const sports = Object.entries(sportGroups);
            
            for (let i = 0; i < sports.length; i++) {
                const [sport, matches] = sports[i];
                console.log(`\n🔧 Processing ${sport} (${i + 1}/${sports.length}): ${matches.length} matches`);
                
                processedData[sport] = this.processSport(sport, matches);
                
                // Clear cache periodically to manage memory
                if (i % 5 === 0) {
                    this.clearCache();
                }
            }

            // Step 4: Create final master data
            this.createMasterData(processedData, standardizedData);
            this.logResults();
            
            this.results.processingTime = Date.now() - this.startTime;
            
            return processedData;
            
        } catch (error) {
            console.error('💥 Phase 2 failed:', error);
            throw error;
        }
    }

    loadStandardizedData() {
        const filePath = './standardization-UNIVERSAL.json';
        if (!fs.existsSync(filePath)) {
            throw new Error('Phase 1 output not found. Run universal-standardizer first.');
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    groupBySport(matches) {
        const sportGroups = {};
        
        matches.forEach(match => {
            const sport = match.sport;
            if (!sportGroups[sport]) {
                sportGroups[sport] = [];
                this.results.sportBreakdown[sport] = 0;
            }
            
            sportGroups[sport].push(match);
            this.results.sportBreakdown[sport]++;
        });
        
        return sportGroups;
    }

    processSport(sport, matches) {
        console.log(`   🔍 Looking for duplicates in ${sport}...`);
        
        const clusters = this.findAndMergeMatches(matches, sport);
        const processedMatches = [];
        
        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                processedMatches.push(this.createFinalMatch(cluster[0]));
                this.results.individual++;
            } else {
                const merged = this.mergeCluster(cluster, sport);
                processedMatches.push(merged);
                this.results.merged++;
                console.log(`   ✅ MERGED ${cluster.length} ${sport} matches`);
                
                // Show merge details for first few merges
                if (this.results.merged <= 3) {
                    console.log(`      Example: "${cluster[0].match}"`);
                    console.log(`      Sources: ${Object.keys(merged.sources).join(', ')}`);
                }
            }
        });
        
        this.results.totalProcessed += processedMatches.length;
        
        return {
            summary: {
                input_matches: matches.length,
                output_matches: processedMatches.length,
                merged_clusters: clusters.filter(c => c.length > 1).length,
                individual_matches: clusters.filter(c => c.length === 1).length,
                merge_efficiency: ((matches.length - processedMatches.length) / matches.length * 100).toFixed(1) + '%'
            },
            matches: processedMatches
        };
    }

    // === ALL MERGING LOGIC FROM SIMPLE-SPORTS-PROCESSOR ===
    findAndMergeMatches(matches, sport) {
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();
        
        console.log(`   🎯 Using merge threshold: ${sportConfig.mergeThreshold} for ${sport}`);
        
        const progress = this.createProgressIndicator(matches.length, 'Finding duplicates');
        
        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;
            
            const cluster = [matches[i]];
            processed.add(i);
            
            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                
                const score = this.calculateMatchScore(matches[i], matches[j], sport);
                if (score >= sportConfig.mergeThreshold) {
                    cluster.push(matches[j]);
                    processed.add(j);
                    
                    if (cluster.length === 2) { // Only log first merge
                        console.log(`   🔗 ${sport} MERGE: "${matches[i].match}" ↔ "${matches[j].match}" (${score.toFixed(2)})`);
                    }
                }
            }
            
            clusters.push(cluster);
            progress.increment();
        }
        
        return clusters;
    }

    calculateMatchScore(matchA, matchB, sport) {
        // Allow same-source merges for Wendy (since we want to merge Wendy streams)
        if (matchA.source === matchB.source && matchA.source !== 'wendy') {
            return 0;
        }
        
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;

        // Time window check (commented out like in current processor)
        /*
        const timeDiff = Math.abs(matchA.unix_timestamp - matchB.unix_timestamp);
        if (timeDiff > sportConfig.timeWindow * 60) {
            return 0;
        }
        */
        
        // Normalize team names for comparison
        const normalizeTeams = (teams) => {
            if (this.teamNormalizationCache.has(teams)) {
                return this.teamNormalizationCache.get(teams);
            }
            const normalized = teams.replace(/ vs /g, ' - ').replace(/\s+/g, ' ').trim().toLowerCase();
            this.teamNormalizationCache.set(teams, normalized);
            return normalized;
        };
        
        const textA = normalizeTeams(matchA.match) + ' ' + (matchA.tournament || '');
        const textB = normalizeTeams(matchB.match) + ' ' + (matchB.tournament || '');
        
        // Advanced tokenization
        const tokensA = this.advancedTokenize(textA);
        const tokensB = this.advancedTokenize(textB);
        
        const common = tokensA.filter(tA => 
            tokensB.some(tB => this.tokensMatch(tA, tB))
        );
        
        let score = common.length / Math.max(tokensA.length, tokensB.length);
        
        // Boost score for Wendy matches
        if (matchA.source === 'wendy' || matchB.source === 'wendy') {
            score += 0.1;
        }
        
        if (sport === 'Tennis' && this.hasTennisPlayerPattern(matchA) && this.hasTennisPlayerPattern(matchB)) {
            score += 0.15;
        }

        // Debug for specific matches
        if ((matchA.match && matchA.match.includes('Pyramids')) && 
            (matchB.match && matchB.match.includes('Pyramids'))) {
            console.log(`   🔍 PYRAMIDS DEBUG: "${matchA.match}" (${matchA.source}) vs "${matchB.match}" (${matchB.source})`);
            console.log(`      Score: ${score.toFixed(2)}`);
        }
        
        return Math.min(1.0, score);
    }

    advancedTokenize(text) {
        return text
            .replace(/[^\w\s-]/g, ' ')
            .split(/[\s\-]+/)
            .filter(t => t.length > 2)
            .map(t => t.toLowerCase());
    }

    tokensMatch(tokenA, tokenB) {
        if (tokenA === tokenB) return true;
        if (tokenA.includes(tokenB) || tokenB.includes(tokenA)) return true;
        
        const abbreviations = {
            'fc': 'football club',
            'utd': 'united', 
            'afc': 'association football club',
            'vs': 'versus'
        };
        
        const expandedA = abbreviations[tokenA] || tokenA;
        const expandedB = abbreviations[tokenB] || tokenB;
        
        return expandedA === expandedB || expandedA.includes(expandedB) || expandedB.includes(expandedA);
    }

    hasTennisPlayerPattern(match) {
        const text = match.match || '';
        return /[A-Z]\./.test(text) || /\//.test(text);
    }

    mergeCluster(cluster, sport) {
        const baseMatch = cluster[0];
        
        // Collect all streams from all sources in the cluster
        const allSources = {
            tom: [],
            sarah: [],
            wendy: []
        };
        
        cluster.forEach(match => {
            // Collect Tom streams
            if (match.sources.tom) {
                match.sources.tom.forEach(stream => {
                    if (stream.includes('topembed.pw') && !allSources.tom.includes(stream)) {
                        allSources.tom.push(stream);
                    }
                });
            }
            
            // Collect Sarah streams
            if (match.sources.sarah) {
                match.sources.sarah.forEach(stream => {
                    if (stream.includes('embedsports.top') && !allSources.sarah.includes(stream)) {
                        allSources.sarah.push(stream);
                    }
                });
            }
            
            // Collect Wendy streams
            if (match.sources.wendy) {
                match.sources.wendy.forEach(stream => {
                    if (stream.includes('spiderembed') && !allSources.wendy.includes(stream)) {
                        allSources.wendy.push(stream);
                    }
                });
            }
        });

        // CLEAN STRUCTURE: No channels, no original_sources
        return {
            unix_timestamp: baseMatch.unix_timestamp,
            sport: sport,
            tournament: baseMatch.tournament || '',
            match: baseMatch.match,
            sources: allSources,  // Only sources - no redundant channels
            confidence: 0.8,
            merged: true,
            merged_count: cluster.length
            // No original_sources - we can get this from Object.keys(sources)
        };
    }

    createFinalMatch(match) {
        // CLEAN STRUCTURE: No channels field
        return {
            unix_timestamp: match.unix_timestamp,
            sport: match.sport,
            tournament: match.tournament || '',
            match: match.match,
            sources: match.sources,  // Only sources - no redundant channels
            confidence: 1.0,
            merged: false
        };
    }

    createMasterData(processedData, standardizedData) {
        const masterData = {
            processed_at: new Date().toISOString(),
            processor_version: '2.0-universal-clean',
            phase1_source: standardizedData.created_at,
            summary: {
                total_sports: Object.keys(processedData).length,
                total_matches: this.results.totalProcessed,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                processing_time_ms: this.results.processingTime,
                memory_usage_mb: this.results.memoryUsage,
                original_matches: standardizedData.matches.length,
                compression_ratio: ((standardizedData.matches.length - this.results.totalProcessed) / standardizedData.matches.length * 100).toFixed(1) + '%'
            },
            matches: []
        };
        
        // Combine all matches from all sports
        Object.values(processedData).forEach(sportData => {
            masterData.matches.push(...sportData.matches);
        });

        // Final validation
        console.log('\n🔍 FINAL VALIDATION:');
        const wendySources = masterData.matches.filter(m => 
            m.sources && m.sources.wendy && m.sources.wendy.length > 0
        );
        console.log(`   Matches with Wendy sources: ${wendySources.length}`);

        const sourceCount = { tom: 0, sarah: 0, wendy: 0 };
        masterData.matches.forEach(match => {
            if (match.sources && typeof match.sources === 'object') {
                if (match.sources.tom && match.sources.tom.length > 0) sourceCount.tom++;
                if (match.sources.sarah && match.sources.sarah.length > 0) sourceCount.sarah++;
                if (match.sources.wendy && match.sources.wendy.length > 0) sourceCount.wendy++;
            }
        });
        console.log('   Source distribution:', sourceCount);

        // Save master data
        try {
            const masterDataJson = JSON.stringify(masterData, null, 2);
            JSON.parse(masterDataJson); // Validate
            fs.writeFileSync('./master-data.json', masterDataJson);
            console.log('✅ Clean master data saved successfully');
            
        } catch (error) {
            console.error('❌ JSON validation failed:', error.message);
            throw error;
        }
    }

    createProgressIndicator(total, message) {
        let processed = 0;
        return {
            increment: () => {
                processed++;
                if (processed % 100 === 0 || processed === total) {
                    const percent = Math.round((processed / total) * 100);
                    console.log(`   ${message}: ${processed}/${total} (${percent}%)`);
                }
            },
            getCurrent: () => processed
        };
    }

    clearCache() {
        this.teamNormalizationCache.clear();
        
        if (global.gc) {
            global.gc();
            console.log('   🗑️  Garbage collection triggered');
        }
    }

    logResults() {
        console.log('\n📊 PHASE 2 PROCESSING RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
        console.log(`🔄 Total Merged: ${this.results.merged}`);
        console.log(`🎯 Total Individual: ${this.results.individual}`);
        console.log(`⏱️  Processing Time: ${this.results.processingTime}ms`);
        console.log(`💾 Peak Memory: ${this.results.memoryUsage.toFixed(2)} MB`);
        
        console.log('\n🏆 Sport Breakdown:');
        Object.entries(this.results.sportBreakdown)
            .sort((a, b) => b[1] - a[1])
            .forEach(([sport, count]) => {
                console.log(`   ${sport}: ${count} matches`);
            });
        console.log('══════════════════════════════════════\n');
    }
}

// Main execution
if (require.main === module) {
    const processor = new Phase2Processor();
    processor.processStandardizedData()
        .then(() => {
            console.log('🎉 PHASE 2 COMPLETED!');
            console.log('💾 Clean master data updated at master-data.json');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Phase 2 failed:', error);
            process.exit(1);
        });
}

module.exports = Phase2Processor;
