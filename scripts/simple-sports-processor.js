const fs = require('fs');
const path = require('path'); // ADD THIS LINE
const supplierConfig = require(path.join(__dirname, '../suppliers/supplier-config'));
const SportsClassifier = require('../modules/sports-classifier.js');

class SimpleSportsProcessor {
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
        this.sportsClassifier = new SportsClassifier();
        
        // Sport-specific configurations
        this.sportConfigs = {
            'Tennis': { mergeThreshold: 0.35, timeWindow: 120 },
            'Football': { mergeThreshold: 0.50, timeWindow: 90 },
            'Basketball': { mergeThreshold: 0.40, timeWindow: 180 },
            'American Football': { mergeThreshold: 0.45, timeWindow: 60 },
            'default': { mergeThreshold: 0.30, timeWindow: 120 }
        };

        // Cache for performance
        this.sportCache = new Map();
        this.teamNormalizationCache = new Map();
    }

    async processAllSports() {
        console.log('🎯 STARTING ENHANCED SPORTS PROCESSOR...\n');
        
        try {
            // Backup current data before processing
            this.backupCurrentData();

            // 1. Load all suppliers with validation
            const allMatches = await this.loadAllSuppliers();
            console.log(`📥 Loaded ${allMatches.length} total matches`);
            
            // Memory usage tracking
            this.results.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`💾 Memory usage: ${this.results.memoryUsage.toFixed(2)} MB`);

            // 2. Classify using existing sport fields
            const sportGroups = this.classifyUsingExistingFields(allMatches);
            console.log(`🏆 Found ${Object.keys(sportGroups).length} sports`);

            // 3. Process each sport with progress tracking
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

            // 4. Save results
            this.saveResults(processedData);
            this.logResults();
            
            this.results.processingTime = Date.now() - this.startTime;
            
            return processedData;
            
        } catch (error) {
            console.error('💥 Processor failed:', error);
            // Try to save partial results if possible
            this.savePartialResults();
            throw error;
        }
    }

    backupCurrentData() {
        const filesToBackup = ['./master-data.json', './sports-results/simple-sports-results.json'];
        
        filesToBackup.forEach(file => {
            if (fs.existsSync(file)) {
                const backupDir = './sports-results/backups';
                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                }
                
                // FIXED: Use path.basename correctly
                const fileName = path.basename(file, '.json');
                const backupFile = `${backupDir}/${fileName}-${Date.now()}.json`;
                fs.copyFileSync(file, backupFile);
                console.log(`💾 Backed up: ${backupFile}`);
            }
        });
    }

    savePartialResults() {
        try {
            const partialResults = {
                error: 'Partial results due to failure',
                processed_at: new Date().toISOString(),
                matches: [] // Empty or partial matches if available
            };
            
            if (!fs.existsSync('./sports-results')) {
                fs.mkdirSync('./sports-results', { recursive: true });
            }
            
            fs.writeFileSync('./sports-results/partial-results.json', JSON.stringify(partialResults, null, 2));
            console.log('💾 Partial results saved due to error');
        } catch (e) {
            console.log('❌ Could not save partial results:', e.message);
        }
    }

   classifyUsingExistingFields(matches) {
    const sportGroups = {};
    const progress = this.createProgressIndicator(matches.length, 'Classifying sports');
    
    matches.forEach(match => {
        // ⭐ USE THE SPORTS CLASSIFIER INSTEAD OF OLD LOGIC ⭐
        let sport = this.sportsClassifier.classifySport(match);
        
        // Initialize sport group
        if (!sportGroups[sport]) {
            sportGroups[sport] = [];
            this.results.sportBreakdown[sport] = 0;
        }
        
        sportGroups[sport].push(match);
        this.results.sportBreakdown[sport]++;
        progress.increment();
    });
    
    return sportGroups;
}



    processSport(sport, matches) {
        console.log(`   🔍 Looking for duplicates in ${sport}...`);
        
        // Use merging instead of individual
        const clusters = this.findAndMergeMatches(matches, sport);
        const processedMatches = [];
        
        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                // Individual match
                processedMatches.push(this.createMatchObject(cluster[0], sport, false));
                this.results.individual++;
            } else {
                // Merged match
                const merged = this.mergeCluster(cluster, sport);
                processedMatches.push(merged);
                this.results.merged++;
                console.log(`   ✅ MERGED ${cluster.length} matches in ${sport}`);
            }
        });
        
        this.results.totalProcessed += processedMatches.length;
        
        return {
            summary: {
                total_matches: matches.length,
                processed_matches: processedMatches.length,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                merge_efficiency: ((matches.length - processedMatches.length) / matches.length * 100).toFixed(1) + '%'
            },
            matches: processedMatches
        };
    }

    findAndMergeMatches(matches, sport) {
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();
        
        const progress = this.createProgressIndicator(matches.length, 'Finding duplicates');
        
        for (let i = 0; i < matches.length; i++) {
            if (processed.has(i)) continue;
            
            const cluster = [matches[i]];
            processed.add(i);
            
            for (let j = i + 1; j < matches.length; j++) {
                if (processed.has(j)) continue;
                
                // Use sport-specific threshold
                const score = this.calculateMatchScore(matches[i], matches[j], sport);
                if (score >= sportConfig.mergeThreshold) {
                    cluster.push(matches[j]);
                    processed.add(j);
                    console.log(`   🎯 ${sport} MERGE: "${matches[i].teams}" ↔ "${matches[j].teams}" (${score.toFixed(2)})`);
                }
            }
            
            clusters.push(cluster);
            progress.increment();
        }
        
        return clusters;
    }

    calculateMatchScore(matchA, matchB, sport) {
        if (matchA.source === matchB.source) return 0;
        
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        
        const textA = (matchA.teams + ' ' + matchA.tournament).toLowerCase();
        const textB = (matchB.teams + ' ' + matchB.tournament).toLowerCase();
        
        const tokensA = textA.split(/[\.\-\/\s]+/).filter(t => t.length > 1);
        const tokensB = textB.split(/[\.\-\/\s]+/).filter(t => t.length > 1);
        
        const common = tokensA.filter(tA => tokensB.some(tB => tA === tB || tA.includes(tB) || tB.includes(tA)));
        
        let score = common.length / Math.max(tokensA.length, tokensB.length);
        
        // Sport-specific boosts
        if (sport === 'Tennis' && this.hasTennisPlayerPattern(matchA) && this.hasTennisPlayerPattern(matchB)) {
            score += 0.15;
        }
        
        return Math.min(1.0, score);
    }

    hasTennisPlayerPattern(match) {
        const text = match.teams || '';
        return /[A-Z]\./.test(text) || /\//.test(text);
    }

    createMatchObject(match, sport, merged) {
        return {
            unix_timestamp: match.timestamp,
            sport: sport,
            tournament: match.tournament || '',
            match: match.teams || match.title,
            channels: match.channels || [],
            sources: [match.source],
            confidence: 1.0,
            merged: merged
        };
    }

    mergeCluster(cluster, sport) {
        const baseMatch = cluster[0];
        const otherMatches = cluster.slice(1);
        
        // Combine all channels
        const allChannels = [...baseMatch.channels];
        otherMatches.forEach(match => {
            match.channels.forEach(channel => {
                if (!allChannels.includes(channel)) {
                    allChannels.push(channel);
                }
            });
        });
        
        // Combine sources
        const sources = [...new Set(cluster.map(m => m.source))];
        
        return {
            unix_timestamp: baseMatch.timestamp,
            sport: sport,
            tournament: baseMatch.tournament || '',
            match: baseMatch.teams || baseMatch.title,
            channels: allChannels,
            sources: sources,
            confidence: 0.8,
            merged: true,
            merged_count: cluster.length
        };
    }

    async loadAllSuppliers() {
        const allMatches = [];
        
        for (const [key, config] of Object.entries(supplierConfig)) {
            try {
                if (!fs.existsSync(config.file)) {
                    console.log(`❌ ${key} data file missing: ${config.file}`);
                    continue;
                }
                
                const data = JSON.parse(fs.readFileSync(config.file, 'utf8'));
                const matches = this.extractMatchesFromSupplier(data, key);
                
                console.log(`✅ ${key}: ${matches.length} matches`);
                allMatches.push(...matches);
                
            } catch (error) {
                console.log(`❌ Failed to load ${key}:`, error.message);
                // Continue with other suppliers even if one fails
            }
        }
        
        return allMatches;
    }

    extractMatchesFromSupplier(data, supplier) {
        if (supplier === 'tom') {
            return this.extractTomMatches(data);
        } else if (supplier === 'sarah') {
            return this.extractSarahMatches(data);
        }
        return [];
    }

    extractTomMatches(tomData) {
        const matches = [];
        if (!tomData.events) return matches;
        
        Object.entries(tomData.events).forEach(([date, dayMatches]) => {
            if (Array.isArray(dayMatches)) {
                dayMatches.forEach(match => {
                    matches.push({
                        source: 'tom',
                        date: date,
                        time: this.unixToTime(match.unix_timestamp),
                        teams: match.match,
                        tournament: match.tournament || '',
                        channels: match.channels || [],
                        raw: match,
                        timestamp: match.unix_timestamp,
                        sport: match.sport
                    });
                });
            }
        });
        
        return matches;
    }

    extractSarahMatches(sarahData) {
        const matches = [];
        if (!sarahData.matches) return matches;
        
        sarahData.matches.forEach(match => {
            matches.push({
                source: 'sarah',
                date: this.msToDate(match.date),
                time: this.msToTime(match.date),
                teams: match.title,
                tournament: '',
                channels: this.generateSarahStreams(match),
                raw: match,
                timestamp: match.date / 1000,
                category: match.category
            });
        });
        
        return matches;
    }

    unixToTime(unixTimestamp) {
        if (!unixTimestamp) return '12:00';
        const date = new Date(unixTimestamp * 1000);
        return date.toTimeString().slice(0, 5);
    }

    msToTime(msTimestamp) {
        if (!msTimestamp) return '12:00';
        const date = new Date(msTimestamp);
        return date.toTimeString().slice(0, 5);
    }

    msToDate(msTimestamp) {
        if (!msTimestamp) return new Date().toISOString().split('T')[0];
        const date = new Date(msTimestamp);
        return date.toISOString().split('T')[0];
    }

    generateSarahStreams(match) {
        if (!match.sources) return [];
        return match.sources.map(source => 
            `https://embedsports.top/embed/${source.source}/${source.id}/1`
        );
    }

    saveResults(processedData) {
        // Convert to site-compatible format
        const siteData = {
            processed_at: new Date().toISOString(),
            processor_version: '2.0',
            summary: {
                total_sports: Object.keys(processedData).length,
                total_matches: this.results.totalProcessed,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                processing_time_ms: this.results.processingTime,
                memory_usage_mb: this.results.memoryUsage
            },
            matches: []
        };
        
        // Flatten all sports into one matches array
        Object.values(processedData).forEach(sportData => {
            siteData.matches.push(...sportData.matches);
        });
        
        // Ensure directory exists
        if (!fs.existsSync('./sports-results')) {
            fs.mkdirSync('./sports-results', { recursive: true });
        }
        
        // Save both formats
        fs.writeFileSync('./sports-results/simple-sports-results.json', JSON.stringify(processedData, null, 2));
        fs.writeFileSync('./master-data.json', JSON.stringify(siteData, null, 2));
    }

    logResults() {
        console.log('\n📊 ENHANCED SPORTS PROCESSOR RESULTS:');
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
        // Clear caches to manage memory
        this.sportCache.clear();
        this.teamNormalizationCache.clear();
        
        if (global.gc) {
            global.gc();
            console.log('   🗑️  Garbage collection triggered');
        }
    }
}

// Main execution
if (require.main === module) {
    const processor = new SimpleSportsProcessor();
    processor.processAllSports()
        .then(() => {
            console.log('💾 Results saved to sports-results/simple-sports-results.json');
            console.log('💾 Master data updated at master-data.json');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Final error:', error);
            process.exit(1);
        });
}

module.exports = SimpleSportsProcessor;
