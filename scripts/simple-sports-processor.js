const fs = require('fs');
const path = require('path');
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
            // 🆕 WENDY STREAMS ANALYSIS
            this.debugWendyStreamMatches();
            
            // Backup current data before processing
            this.backupCurrentData();

            // 1. Load all suppliers with validation
            const allMatches = await this.loadAllSuppliers();
            console.log(`📥 Loaded ${allMatches.length} total matches`);

            // 🆕 NEW: Fetch Sarah streams for merging
            const sarahStreamsMap = await this.fetchAndMergeSarahStreams();
            
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
                
                processedData[sport] = this.processSport(sport, matches, sarahStreamsMap);
                
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

    // 🆕 ADD THIS DEBUG METHOD
    debugWendyStreamMatches() {
        try {
            const wendyData = JSON.parse(fs.readFileSync('./suppliers/wendy-data.json', 'utf8'));
            console.log('🔍 WENDY STREAMS ANALYSIS:');
            
            if (wendyData.matches) {
                const matchesWithStreams = wendyData.matches.filter(m => m.streams && m.streams.length > 0);
                console.log(`📊 ${matchesWithStreams.length} matches have streams out of ${wendyData.matches.length}`);
                
                // Count by sport
                const sportCounts = {};
                wendyData.matches.forEach(match => {
                    const sport = match.sportCategory || match.sport || match.wendySport || 'unknown';
                    sportCounts[sport] = (sportCounts[sport] || 0) + 1;
                });
                
                console.log('🏆 Wendy sport breakdown:', sportCounts);
                
                matchesWithStreams.slice(0, 3).forEach(match => {
                    console.log(`🎯 MATCH WITH STREAMS:`);
                    console.log(`   Title: ${match.title}`);
                    console.log(`   Sport: ${match.sportCategory || match.sport || match.wendySport}`);
                    console.log(`   Status: ${match.status}`);
                    console.log(`   Streams: ${match.streams.length}`);
                    console.log(`   First stream: ${match.streams[0]?.url}`);
                });
            }
        } catch (error) {
            console.log('❌ Wendy streams analysis failed:', error.message);
        }
    }

    // 🆕 ADD THIS METHOD TO YOUR SimpleSportsProcessor class
    async fetchAndMergeSarahStreams() {
        console.log('🔄 Fetching Sarah streams for merging...');
        
        try {
            const sarahMatches = await this.fetchSarahMatches();
            console.log('📦 Sarah matches found:', sarahMatches.length);
            
            // Create a map for quick Sarah stream lookup
            const sarahStreamsMap = new Map();
            
            sarahMatches.forEach(sarahMatch => {
                if (sarahMatch.title && sarahMatch.sources) {
                    const key = sarahMatch.title.toLowerCase().replace(/ vs /g, ' - ');
                    sarahStreamsMap.set(key, sarahMatch.sources);
                }
            });
            
            return sarahStreamsMap;
        } catch (error) {
            console.log('❌ Sarah streams fetch failed:', error);
            return new Map();
        }
    }

    // 🆕 ADD THIS HELPER METHOD TOO
    async fetchSarahMatches() {
        try {
            const response = await fetch('https://streamed.pk/api/matches/all');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Sarah API failed');
        }
        return [];
    }

    backupCurrentData() {
        const filesToBackup = ['./master-data.json', './sports-results/simple-sports-results.json'];
        
        filesToBackup.forEach(file => {
            if (fs.existsSync(file)) {
                const backupDir = './sports-results/backups';
                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                }
                
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
                matches: []
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

    async loadAllSuppliers() {

        console.log('🔧 SUPPLIER CONFIG CHECK:');
    console.log('   Available suppliers:', Object.keys(supplierConfig));
    console.log('   Wendy config:', supplierConfig.wendy);
    console.log('   Wendy file path:', supplierConfig.wendy?.file);
    console.log('   Wendy file exists:', fs.existsSync(supplierConfig.wendy?.file));
        
        const allMatches = [];
        
        console.log('🔧 DEBUG: Starting supplier loading...');
        console.log('🔧 DEBUG: Current directory:', process.cwd());
        
        const suppliers = Object.values(supplierConfig);
        
        for (const supplier of suppliers) {
            try {
                console.log(`\n🔧 DEBUG: Loading ${supplier.name}...`);
                
                if (!fs.existsSync(supplier.file)) {
                    console.log(`❌ DEBUG: File not found: ${supplier.file}`);
                    continue;
                }
                
                const data = JSON.parse(fs.readFileSync(supplier.file, 'utf8'));
                console.log(`✅ DEBUG: ${supplier.name} loaded - ${data.matches?.length || 0} matches`);
                
                const matches = this.extractMatchesFromSupplier(data, supplier.name);
                console.log(`🎯 DEBUG: ${supplier.name} extracted ${matches.length} matches`);
                
                allMatches.push(...matches);
                
            } catch (error) {
                console.log(`💥 DEBUG: Failed to load ${supplier.name}:`, error.message);
            }
        }
        
        console.log(`\n🔧 DEBUG: Total matches loaded: ${allMatches.length}`);
        return allMatches;
    }

    extractMatchesFromSupplier(data, supplier) {
        if (supplier === 'tom') {
            return this.extractTomMatches(data);
        } else if (supplier === 'sarah') {
            return this.extractSarahMatches(data);
        } else if (supplier === 'wendy') {
            return this.extractWendyMatches(data);
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

    // 🆕 UPDATED WENDY EXTRACTION WITH DEBUG
   // 🆕 FIXED WENDY EXTRACTION - HANDLES BOTH TEAM STRUCTURES
extractWendyMatches(wendyData) {
    console.log('🔍 EXTRACT WENDY MATCHES DEBUG:');
    console.log('   Input data type:', typeof wendyData);
    console.log('   Has matches property:', !!wendyData.matches);
    console.log('   Matches array length:', wendyData.matches?.length || 0);
    
    const matches = [];
    if (!wendyData.matches) {
        console.log('❌ No matches array in Wendy data');
        return matches;
    }
    
    console.log('🎯 Processing Wendy matches...');
    
    wendyData.matches.forEach((match, index) => {
        // 🆕 ONLY PROCESS MATCHES THAT HAVE STREAMS
        const hasStreams = match.streams && match.streams.length > 0;
        
        if (hasStreams) {
            // 🆕 FIX: Handle both team structures
            let teams = '';
            if (match.teams) {
                if (match.teams.event) {
                    // Structure A: Fighting/Boxing with "event" field
                    teams = match.teams.event;
                } else if (match.teams.home && match.teams.away) {
                    // Structure B: Regular sports with home/away
                    teams = `${match.teams.home.name || ''} vs ${match.teams.away.name || ''}`.trim();
                } else {
                    // Fallback to title
                    teams = match.title;
                }
            } else {
                teams = match.title;
            }
            
            const tournament = match.league?.name || '';
            
            // Use actual Wendy streams
            const channels = match.streams.map(stream => stream.url);
            
            const processedMatch = {
                source: 'wendy',
                date: this.msToDate(match.timestamp || Date.now()),
                time: this.msToTime(match.timestamp || Date.now()),
                teams: teams,
                tournament: tournament,
                channels: channels,
                raw: match,
                timestamp: match.timestamp ? match.timestamp / 1000 : Date.now() / 1000,
                sport: this.classifyWendySport(match)
            };
            
            matches.push(processedMatch);
            
            // Debug first few matches
            if (index < 3) {
                console.log(`   📝 Processed match ${index + 1}:`);
                console.log(`      Teams: "${processedMatch.teams}"`);
                console.log(`      Sport: ${processedMatch.sport}`);
                console.log(`      Channels: ${processedMatch.channels.length}`);
                console.log(`      Source: ${processedMatch.source}`);
                console.log(`      Team structure: ${match.teams?.event ? 'EVENT' : 'HOME/AWAY'}`);
            }
        }
    });
    
    console.log(`✅ Wendy extraction: ${matches.length} matches with streams processed`);
    console.log(`   Total input matches: ${wendyData.matches.length}`);
    console.log(`   Matches with streams: ${matches.length}`);
    
    return matches;
}

    // 🆕 UPDATED WENDY SPORT CLASSIFIER
    classifyWendySport(match) {
        // 🆕 PRIORITIZE wendySport field from our enhanced data
        if (match.wendySport) {
            const sportMap = {
                'football': 'Football',
                'tennis': 'Tennis', 
                'basketball': 'Basketball',
                'hockey': 'Ice Hockey',
                'baseball': 'Baseball',
                'american-football': 'American Football',
                'rugby': 'Rugby',
                'cricket': 'Cricket',
                'volleyball': 'Volleyball',
                'fighting': 'Fight',
                'darts': 'Darts',
                'golf': 'Golf',
                'racing': 'Motor-sports',
                'australian-football': 'Australian Football'
            };
            return sportMap[match.wendySport] || match.wendySport;
        }
        
        // Fallback to original classification
        const league = match.league?.name?.toLowerCase() || '';
        const title = match.title?.toLowerCase() || '';
        
        if (league.includes('nfl') || title.includes('nfl')) return 'American Football';
        if (league.includes('nba') || title.includes('nba')) return 'Basketball'; 
        if (league.includes('mlb') || title.includes('mlb')) return 'Baseball';
        if (league.includes('nhl') || title.includes('nhl')) return 'Ice Hockey';
        if (league.includes('rugby') || title.includes('rugby')) return 'Rugby';
        if (league.includes('tennis') || title.includes('tennis')) return 'Tennis';
        
        // Default to football
        return 'Football';
    }

    classifyUsingExistingFields(matches) {
        const sportGroups = {};
        const progress = this.createProgressIndicator(matches.length, 'Classifying sports');
        
        matches.forEach(match => {
            let sport = this.sportsClassifier.classifySport(match);
            
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

    processSport(sport, matches, sarahStreamsMap) {
        console.log(`   🔍 Looking for duplicates in ${sport}...`);
        
        const clusters = this.findAndMergeMatches(matches, sport);
        const processedMatches = [];
        
        clusters.forEach(cluster => {
            if (cluster.length === 1) {
                processedMatches.push(this.createMatchObject(cluster[0], sport, false, sarahStreamsMap));
                this.results.individual++;
            } else {
                const merged = this.mergeCluster(cluster, sport, sarahStreamsMap);
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
        
        if (sport === 'Tennis' && this.hasTennisPlayerPattern(matchA) && this.hasTennisPlayerPattern(matchB)) {
            score += 0.15;
        }
        
        return Math.min(1.0, score);
    }

    hasTennisPlayerPattern(match) {
        const text = match.teams || '';
        return /[A-Z]\./.test(text) || /\//.test(text);
    }

    createMatchObject(match, sport, merged, sarahStreamsMap) {
        const sarahStreams = this.getSarahStreamsForMatch(match, sarahStreamsMap);
        const tomStreams = match.channels || [];
        
        // 🎯 CORRECT CLASSIFICATION: Filter streams by URL pattern
        const correctTomStreams = tomStreams.filter(channel => 
            channel.includes('topembed.pw') && !channel.includes('embedsports.top')
        );
        
        const correctSarahStreams = [
            ...sarahStreams,
            ...tomStreams.filter(channel => channel.includes('embedsports.top'))
        ];
        
        const allChannels = [...correctTomStreams, ...correctSarahStreams];
        
        return {
            unix_timestamp: match.timestamp,
            sport: sport,
            tournament: match.tournament || '',
            match: match.teams || match.title,
            channels: allChannels,
            sources: [match.source],
            confidence: 1.0,
            merged: merged,
            // 🎯 CORRECT STREAM CLASSIFICATION
            sources: {
                tom: correctTomStreams,    // Only real Tom streams
                sarah: correctSarahStreams // Only real Sarah streams
            }
        };
    }

    // 🆕 ADD THIS HELPER METHOD
    getSarahStreamsForMatch(match, sarahStreamsMap) {
        const matchKey = match.teams.toLowerCase();
        const sarahSources = sarahStreamsMap.get(matchKey);
        
        if (!sarahSources) return [];
        
        const sarahStreams = [];
        sarahSources.forEach((source) => {
            for (let i = 1; i <= 3; i++) {
                sarahStreams.push(`https://embedsports.top/embed/${source.source}/${source.id}/${i}`);
            }
        });
        
        return sarahStreams;
    }

    mergeCluster(cluster, sport, sarahStreamsMap) {
        const baseMatch = cluster[0];
        
        // 🎯 CORRECTLY COLLECT TOM STREAMS (only topembed.pw)
        const allTomStreams = [];
        cluster.forEach(match => {
            const tomStreams = match.channels || [];
            tomStreams.forEach(stream => {
                if (stream.includes('topembed.pw') && !stream.includes('embedsports.top')) {
                    if (!allTomStreams.includes(stream)) {
                        allTomStreams.push(stream);
                    }
                }
            });
        });
        
        // Get Sarah streams
        const sarahStreams = this.getSarahStreamsForMatch(baseMatch, sarahStreamsMap);
        
        // 🎯 ALSO INCLUDE embedsports.top STREAMS FROM TOM'S DATA
        cluster.forEach(match => {
            const tomStreams = match.channels || [];
            tomStreams.forEach(stream => {
                if (stream.includes('embedsports.top') && !sarahStreams.includes(stream)) {
                    sarahStreams.push(stream);
                }
            });
        });
        
        const allChannels = [...allTomStreams, ...sarahStreams];
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
            merged_count: cluster.length,
            // 🎯 CORRECT STREAM CLASSIFICATION FOR MERGED MATCHES
            sources: {
                tom: allTomStreams,
                sarah: sarahStreams
            }
        };
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
        
        Object.values(processedData).forEach(sportData => {
            siteData.matches.push(...sportData.matches);
        });

          
    // 🆕 ADD THIS FINAL CHECK BEFORE SAVING
    console.log('🔍 FINAL CHECK - SOURCES IN MASTER DATA:');
    const sourceCount = {};
    siteData.matches.forEach(match => {
        if (match.sources && Array.isArray(match.sources)) {
            match.sources.forEach(source => {
                sourceCount[source] = (sourceCount[source] || 0) + 1;
            });
        }
    });
    console.log('   Source distribution:', sourceCount);
    
    // Check for Wendy streams specifically
    const wendyStreams = siteData.matches.filter(m => 
        m.channels && m.channels.some(ch => ch.includes('spiderembed'))
    );
    console.log(`   Matches with Wendy streams: ${wendyStreams.length}`);
    
    if (wendyStreams.length > 0) {
        console.log('   Sample Wendy match:', {
            teams: wendyStreams[0].teams,
            sources: wendyStreams[0].sources,
            channels: wendyStreams[0].channels?.length
        });
    }
    
        
        if (!fs.existsSync('./sports-results')) {
            fs.mkdirSync('./sports-results', { recursive: true });
        }
        
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
