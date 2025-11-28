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

        this.teamNormalizationCache = new Map();
    }

    async processStandardizedData() {
        console.log('🚀 PHASE 2 - ADVANCED PROCESSING\n');
        
        try {
            this.results.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`💾 Memory usage: ${this.results.memoryUsage.toFixed(2)} MB`);

            const standardizedData = this.loadStandardizedData();
            console.log(`📥 Loaded ${standardizedData.matches.length} standardized matches`);
            
            const sportGroups = this.groupBySport(standardizedData.matches);
            console.log(`🏆 Found ${Object.keys(sportGroups).length} sports to process`);

            const processedData = {};
            const sports = Object.entries(sportGroups);
            
            for (let i = 0; i < sports.length; i++) {
                const [sport, matches] = sports[i];
                console.log(`\n🔧 Processing ${sport} (${i + 1}/${sports.length}): ${matches.length} matches`);
                
                processedData[sport] = this.processSport(sport, matches);
                
                if (i % 5 === 0) {
                    this.clearCache();
                }
            }

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
                
                if (this.results.merged <= 3) {
                    console.log(`   ✅ MERGED ${cluster.length} ${sport} matches`);
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

    findAndMergeMatches(matches, sport) {
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();
        
        console.log(`   🎯 Using merge threshold: ${sportConfig.mergeThreshold} for ${sport}`);
        
        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;
            
            const cluster = [matches[i]];
            processed.add(i);
            
            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                
                const score = this.calculateMatchScore(matches[i], matches[j], sport);
                
                if (score >= sportConfig.mergeThreshold) {
                    console.log(`   🔗 MERGING: "${matches[i].match}" ↔ "${matches[j].match}" (${score.toFixed(3)})`);
                    cluster.push(matches[j]);
                    processed.add(j);
                }
            }
            
            clusters.push(cluster);
            
            if (cluster.length > 1) {
                console.log(`   ✅ CREATED CLUSTER: ${cluster.length} matches for "${matches[i].match}"`);
            }
        }
        
        console.log(`   📊 Created ${clusters.length} clusters for ${sport}`);
        return clusters;
    }

    calculateMatchScore(matchA, matchB, sport) {
        if (matchA.source === matchB.source && matchA.source !== 'wendy' && sport !== 'Tennis') {
            return 0;
        }
        
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;

        const textA = matchA.match.toLowerCase().trim();
        const textB = matchB.match.toLowerCase().trim();
        
        console.log(`🔍 COMPARING [${sport}]: "${textA}" ↔ "${textB}"`);
        
        if (sport === 'Tennis') {
            const playersA = this.extractPlayers(textA);
            const playersB = this.extractPlayers(textB);
            
            const playerMatch = playersA.length === playersB.length && 
                               playersA.every((player, idx) => this.playersMatch(player, playersB[idx]));
            
            if (playerMatch) {
                console.log(`🎾 TENNIS EXACT MATCH: ${matchA.source} ↔ ${matchB.source} = 1.000`);
                return 1.0;
            }
        }
        
        const tokensA = this.advancedTokenize(textA);
        const tokensB = this.advancedTokenize(textB);
        
        const common = tokensA.filter(tA => 
            tokensB.some(tB => this.tokensMatch(tA, tB))
        );
        
        let score = common.length / Math.max(tokensA.length, tokensB.length);
        
        if (score > 0.7) {
            score = Math.min(1.0, score + 0.3);
        }
        
        console.log(`   Score: ${score.toFixed(3)}`);
        return score;
    }

    extractPlayers(matchText) {
        if (!matchText.includes(' vs ')) {
            return [matchText.split(' ')];
        }
        return matchText.split(' vs ').map(player => 
            player.trim().toLowerCase().split(' ').filter(t => t.length > 1)
        );
    }

    playersMatch(playerA, playerB) {
        if (playerA.length !== playerB.length) return false;
        return playerA.every((token, idx) => this.tokensMatch(token, playerB[idx]));
    }

    calculateSimilarity(matchA, matchB) {
        const textA = matchA.match.toLowerCase();
        const textB = matchB.match.toLowerCase();
        
        if (textA === textB) return 1.0;
        
        const tokensA = textA.split(/\s+/);
        const tokensB = textB.split(/\s+/);
        
        const common = tokensA.filter(tA => tokensB.includes(tA));
        return common.length / Math.max(tokensA.length, tokensB.length);
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
        
        const allSources = {
            tom: [],
            sarah: [],
            wendy: []
        };
        
        console.log(`🔍 MERGING CLUSTER: "${baseMatch.match}" with ${cluster.length} matches`);
        
        cluster.forEach(match => {
            const isSameFixture = this.calculateSimilarity(baseMatch, match) >= 0.8;
            
            if (!isSameFixture) {
                console.log(`🚨 SKIPPING WRONG MATCH IN CLUSTER: "${match.match}" vs "${baseMatch.match}"`);
                return;
            }
            
            if (match.sources.tom) {
                match.sources.tom.forEach(stream => {
                    if (stream.includes('topembed.pw') && !allSources.tom.includes(stream)) {
                        allSources.tom.push(stream);
                    }
                });
            }
            
            if (match.sources.sarah) {
                match.sources.sarah.forEach(stream => {
                    if (stream.includes('embedsports.top') && !allSources.sarah.includes(stream)) {
                        allSources.sarah.push(stream);
                    }
                });
            }
            
            if (match.sources.wendy) {
                match.sources.wendy.forEach(stream => {
                    if (this.isValidWendyStreamForMatch(stream, baseMatch.match) && !allSources.wendy.includes(stream)) {
                        allSources.wendy.push(stream);
                    }
                });
            }
        });

        console.log(`✅ MERGED CLUSTER: "${baseMatch.match}"`);
        console.log(`   Sources: tom=${allSources.tom.length}, sarah=${allSources.sarah.length}, wendy=${allSources.wendy.length}`);

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

    isValidWendyStreamForMatch(streamUrl, matchText) {
        const url = streamUrl.toLowerCase();
        const match = matchText.toLowerCase();
        
        console.log(`🔍 VALIDATING WENDY STREAM: "${matchText}" ↔ "${streamUrl}"`);
        
        const players = match.split(' vs ');
        
        for (let player of players) {
            const nameParts = player.trim().split(' ');
            for (let namePart of nameParts) {
                if (namePart.length > 3 && url.includes(namePart)) {
                    console.log(`   ✅ VALID: Found "${namePart}" in URL`);
                    return true;
                }
            }
        }
        
        console.log(`🚨 INVALID WENDY STREAM: No player names from "${matchText}" found in "${streamUrl}"`);
        return false;
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
            processor_version: '2.0',
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
        
        Object.values(processedData).forEach(sportData => {
            masterData.matches.push(...sportData.matches);
        });

        console.log('\n🔍 FINAL VALIDATION:');
        const wendySources = masterData.matches.filter(m => 
            m.sources && m.sources.wendy && m.sources.wendy.length > 0
        );
        console.log(`   Matches with Wendy sources: ${wendySources.length}`);

        try {
            const masterDataJson = JSON.stringify(masterData, null, 2);
            JSON.parse(masterDataJson);
            fs.writeFileSync('./master-data.json', masterDataJson);
            console.log('✅ Master data saved successfully');
            
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
        }
    }

    logResults() {
        console.log('\n📊 PHASE 2 RESULTS:');
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

if (require.main === module) {
    const processor = new Phase2Processor();
    processor.processStandardizedData()
        .then(() => {
            console.log('🎉 PHASE 2 COMPLETED!');
            console.log('💾 Master data: master-data.json');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Phase 2 failed:', error);
            process.exit(1);
        });
}

module.exports = Phase2Processor;
