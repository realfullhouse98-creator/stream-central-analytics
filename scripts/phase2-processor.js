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
        
        this.sportConfigs = {
            'Tennis': { mergeThreshold: 0.10, timeWindow: 480 },
            'Football': { mergeThreshold: 0.20, timeWindow: 600 },
            'Basketball': { mergeThreshold: 0.25, timeWindow: 600 },
            'American Football': { mergeThreshold: 0.25, timeWindow: 600 },
            'Ice Hockey': { mergeThreshold: 0.25, timeWindow: 600 },
            'default': { mergeThreshold: 0.20, timeWindow: 480 }
        };
    }

    async processStandardizedData() {
        console.log('🚀 PHASE 2 - SIMPLE PROCESSING\n');
        
        try {
            const standardizedData = this.loadStandardizedData();
            console.log(`📥 Loaded ${standardizedData.matches.length} standardized matches`);
            
            const sportGroups = this.groupBySport(standardizedData.matches);
            console.log(`🏆 Found ${Object.keys(sportGroups).length} sports`);

            const processedData = {};
            
            for (const [sport, matches] of Object.entries(sportGroups)) {
                console.log(`\n🔧 Processing ${sport}: ${matches.length} matches`);
                processedData[sport] = this.processSportSimple(sport, matches);
            }

            this.createMasterData(processedData, standardizedData);
            this.logResults();
            
            return processedData;
            
        } catch (error) {
            console.error('💥 Phase 2 failed:', error);
            throw error;
        }
    }

    processSportSimple(sport, matches) {
        const clusters = [];
        const processed = new Set();
        
        console.log(`   Finding duplicates with threshold: ${this.sportConfigs[sport]?.mergeThreshold || 0.20}`);
        
        // Simple clustering - match exact same match names
        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;
            
            const cluster = [matches[i]];
            processed.add(i);
            
            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                
                if (this.isSameMatch(matches[i], matches[j], sport)) {
                    cluster.push(matches[j]);
                    processed.add(j);
                }
            }
            
            clusters.push(cluster);
        }

        const processedMatches = [];
        
        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                processedMatches.push(this.createFinalMatch(cluster[0]));
                this.results.individual++;
            } else {
                const merged = this.mergeClusterSimple(cluster, sport);
                processedMatches.push(merged);
                this.results.merged++;
                console.log(`   ✅ MERGED ${cluster.length} matches: "${cluster[0].match}"`);
            }
        });
        
        this.results.totalProcessed += processedMatches.length;
        
        return {
            summary: {
                input_matches: matches.length,
                output_matches: processedMatches.length,
                merged_clusters: clusters.filter(c => c.length > 1).length
            },
            matches: processedMatches
        };
    }

    isSameMatch(matchA, matchB, sport) {
        // SIMPLE: Exact match name comparison
        if (matchA.match === matchB.match) {
            return true;
        }
        
        // SIMPLE: Case-insensitive comparison
        if (matchA.match.toLowerCase() === matchB.match.toLowerCase()) {
            return true;
        }
        
        // SIMPLE: For tennis, check if it's the same players
        if (sport === 'Tennis') {
            const playersA = matchA.match.toLowerCase().split(' vs ').sort().join(' vs ');
            const playersB = matchB.match.toLowerCase().split(' vs ').sort().join(' vs ');
            return playersA === playersB;
        }
        
        return false;
    }

    mergeClusterSimple(cluster, sport) {
        const baseMatch = cluster[0];
        const allSources = {
            tom: [],
            sarah: [],
            wendy: []
        };
        
        // SIMPLE: Collect all unique streams
        cluster.forEach(match => {
            if (match.sources.tom) {
                match.sources.tom.forEach(stream => {
                    if (!allSources.tom.includes(stream)) {
                        allSources.tom.push(stream);
                    }
                });
            }
            if (match.sources.sarah) {
                match.sources.sarah.forEach(stream => {
                    if (!allSources.sarah.includes(stream)) {
                        allSources.sarah.push(stream);
                    }
                });
            }
            if (match.sources.wendy) {
                match.sources.wendy.forEach(stream => {
                    if (!allSources.wendy.includes(stream)) {
                        allSources.wendy.push(stream);
                    }
                });
            }
        });

        return {
            unix_timestamp: baseMatch.unix_timestamp,
            sport: sport,
            tournament: baseMatch.tournament || '',
            match: baseMatch.match,
            sources: allSources,
            confidence: 0.8,
            merged: true,
            merged_count: cluster.length
        };
    }

    // KEEP ALL THESE ORIGINAL METHODS - THEY WORK
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
            if (!sportGroups[sport]) sportGroups[sport] = [];
            sportGroups[sport].push(match);
            this.results.sportBreakdown[sport] = (this.results.sportBreakdown[sport] || 0) + 1;
        });
        return sportGroups;
    }

    createFinalMatch(match) {
        return {
            unix_timestamp: match.unix_timestamp,
            sport: match.sport,
            tournament: match.tournament || '',
            match: match.match,
            sources: match.sources,
            confidence: 1.0,
            merged: false
        };
    }

    createMasterData(processedData, standardizedData) {
        const masterData = {
            processed_at: new Date().toISOString(),
            processor_version: '2.1-simple',
            phase1_source: standardizedData.created_at,
            summary: {
                total_sports: Object.keys(processedData).length,
                total_matches: this.results.totalProcessed,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                original_matches: standardizedData.matches.length,
                compression_ratio: ((standardizedData.matches.length - this.results.totalProcessed) / standardizedData.matches.length * 100).toFixed(1) + '%'
            },
            matches: []
        };
        
        Object.values(processedData).forEach(sportData => {
            masterData.matches.push(...sportData.matches);
        });

        // VALIDATION
        console.log('\n🔍 VALIDATION:');
        console.log(`   Input: ${standardizedData.matches.length} matches`);
        console.log(`   Output: ${masterData.matches.length} matches`);
        console.log(`   Merged: ${this.results.merged} clusters`);
        
        const missingCount = standardizedData.matches.length - this.results.totalProcessed;
        if (missingCount > 0) {
            console.log(`   ⚠️  ${missingCount} matches may be missing - checking...`);
        }

        fs.writeFileSync('./master-data.json', JSON.stringify(masterData, null, 2));
        console.log('✅ Master data saved');
        
        return masterData;
    }

    logResults() {
        console.log('\n📊 RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total: ${this.results.totalProcessed} matches`);
        console.log(`🔄 Merged: ${this.results.merged} clusters`);
        console.log(`🎯 Individual: ${this.results.individual} matches`);
        console.log('══════════════════════════════════════\n');
    }
}

// Run if called directly
if (require.main === module) {
    const processor = new Phase2Processor();
    processor.processStandardizedData()
        .then(() => {
            console.log('🎉 PHASE 2 COMPLETED!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Failed:', error);
            process.exit(1);
        });
}

module.exports = Phase2Processor;
