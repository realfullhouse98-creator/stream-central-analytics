// scripts/simple-sports-processor.js
const fs = require('fs');
const supplierConfig = require('../suppliers/supplier-config');

class SimpleSportsProcessor {
    constructor() {
        this.results = {
            totalProcessed: 0,
            merged: 0,
            individual: 0,
            sportBreakdown: {}
        };
        
        // Sport-specific configurations
        this.sportConfigs = {
            'Tennis': { mergeThreshold: 0.35, timeWindow: 120 },
            'Football': { mergeThreshold: 0.50, timeWindow: 90 },
            'Basketball': { mergeThreshold: 0.40, timeWindow: 180 },
            'American Football': { mergeThreshold: 0.45, timeWindow: 60 },
            'default': { mergeThreshold: 0.30, timeWindow: 120 }
        };
    }

    async processAllSports() {
        console.log('🎯 STARTING SIMPLE SPORTS PROCESSOR...\n');
        
        try {
            // 1. Load all matches
            const allMatches = await this.loadAllSuppliers();
            console.log(`📥 Loaded ${allMatches.length} total matches`);
            
            // 2. Classify using existing sport fields
            const sportGroups = this.classifyUsingExistingFields(allMatches);
            console.log(`🏆 Found ${Object.keys(sportGroups).length} sports`);
            
            // 3. Process each sport
            const processedData = {};
            for (const [sport, matches] of Object.entries(sportGroups)) {
                console.log(`\n🔧 Processing ${sport}: ${matches.length} matches`);
                processedData[sport] = this.processSport(sport, matches);
            }
            
            // 4. Save results
            this.saveResults(processedData);
            this.logResults();
            
            return processedData;
            
        } catch (error) {
            console.error('💥 Processor failed:', error);
            throw error;
        }
    }

    classifyUsingExistingFields(matches) {
        const sportGroups = {};
        
        matches.forEach(match => {
            let sport = 'Other';
            
            // Use Tom's sport field first
            if (match.sport && match.sport !== 'Other') {
                sport = match.sport;
            }
            // Use Sarah's category field
            else if (match.category && match.category !== 'other') {
                sport = this.normalizeSarahCategory(match.category);
            }
            
            // Initialize sport group
            if (!sportGroups[sport]) {
                sportGroups[sport] = [];
                this.results.sportBreakdown[sport] = 0;
            }
            
            sportGroups[sport].push(match);
            this.results.sportBreakdown[sport]++;
        });
        
        return sportGroups;
    }

    normalizeSarahCategory(category) {
        const categoryMap = {
            'american-football': 'American Football',
            'motor-sports': 'Motorsport',
            'fight': 'Fighting',
            'afl': 'Aussie rules',
            'football': 'Football',
            'tennis': 'Tennis',
            'basketball': 'Basketball',
            'baseball': 'Baseball',
            'hockey': 'Ice Hockey'
        };
        
        return categoryMap[category] || 
               category.charAt(0).toUpperCase() + category.slice(1);
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
                individual_matches: this.results.individual
            },
            matches: processedMatches
        };
    }

    findAndMergeMatches(matches, sport) {
        const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
        const clusters = [];
        const processed = new Set();
        
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
        console.log('\n📊 SIMPLE SPORTS PROCESSOR RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
        console.log(`🔄 Total Merged: ${this.results.merged}`);
        console.log(`🎯 Total Individual: ${this.results.individual}`);
        
        console.log('\n🏆 Sport Breakdown:');
        Object.entries(this.results.sportBreakdown).forEach(([sport, count]) => {
            console.log(`   ${sport}: ${count} matches`);
        });
        console.log('══════════════════════════════════════\n');
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
