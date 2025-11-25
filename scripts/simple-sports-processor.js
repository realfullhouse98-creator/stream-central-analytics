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

    // 🆕 ADD THIS DEBUG METHOD TO CHECK MERGING
    debugMergingLogic() {
        console.log('🔍 DEBUGGING MERGE LOGIC:');
        
        // Sample matches from different sources
        const sampleMatches = [
            { source: 'tom', teams: 'Team A vs Team B', tournament: 'Premier League' },
            { source: 'sarah', teams: 'Team A - Team B', tournament: '' },
            { source: 'wendy', teams: 'Team A vs Team B', tournament: 'Premier League' }
        ];
        
        console.log('   Sample match sources:', sampleMatches.map(m => m.source));
        
        // Test merge scores
        for (let i = 0; i < sampleMatches.length; i++) {
            for (let j = i + 1; j < sampleMatches.length; j++) {
                const score = this.calculateMatchScore(sampleMatches[i], sampleMatches[j], 'Football');
                console.log(`   ${sampleMatches[i].source} ↔ ${sampleMatches[j].source}: ${score.toFixed(2)}`);
            }
        }
    }

    // 🆕 ADD THIS METHOD TO CHECK WENDY MERGING
    debugWendyMerging(sportGroups) {
        console.log('🔍 CHECKING WENDY MERGE POTENTIAL:');
        
        Object.entries(sportGroups).forEach(([sport, matches]) => {
            const wendyMatches = matches.filter(m => m.source === 'wendy');
            const otherMatches = matches.filter(m => m.source !== 'wendy');
            
            if (wendyMatches.length > 0 && otherMatches.length > 0) {
                console.log(`   ${sport}: ${wendyMatches.length} Wendy vs ${otherMatches.length} others`);
                
                // Check first Wendy match against first other match
                if (wendyMatches[0] && otherMatches[0]) {
                    const score = this.calculateMatchScore(wendyMatches[0], otherMatches[0], sport);
                    console.log(`      Sample merge score: ${score.toFixed(2)}`);
                }
            }
        });
    }

    async processAllSports() {
        console.log('🎯 STARTING ENHANCED SPORTS PROCESSOR...\n');
        
        try {
            // 🆕 DEBUG MERGING LOGIC
            this.debugMergingLogic();
            
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

            // 🆕 DEBUG WENDY MERGING
            this.debugWendyMerging(sportGroups);

            // 3. Process each sport with progress tracking
            let processedData = {};
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

            // 5. Save results
            this.saveResults(processedData);
            this.logResults();
            
            this.results.processingTime = Date.now() - this.startTime;
            
            return processedData;
            
        } catch (error) {
            console.error('💥 Processor failed:', error);
            this.savePartialResults();
            throw error;
        }
    }

    async fetchAndMergeSarahStreams() {
        console.log('🔄 Fetching Sarah streams for merging...');
        
        try {
            const sarahMatches = await this.fetchSarahMatches();
            console.log('📦 Sarah matches found:', sarahMatches.length);
            
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
            // 🆕 TEMPORARY FIX: PROCESS ALL WENDY MATCHES
            // Remove the stream/channel filter completely
            
            let teams = match.teams || match.title || '';
            const tournament = match.league?.name || '';
            
            const channels = match.streams ? 
                match.streams.map(stream => stream.url) : 
                (match.channels || []);
            
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
                console.log(`   📝 Wendy match ${index + 1}:`);
                console.log(`      Teams: "${processedMatch.teams}"`);
                console.log(`      Channels: ${processedMatch.channels.length}`);
                console.log(`      Source: ${processedMatch.source}`);
            }
        });
        
        console.log(`✅ Wendy extraction: ${matches.length} matches processed`);
        console.log(`   Total input matches: ${wendyData.matches.length}`);
        
        return matches;
    }

    classifyWendySport(match) {
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
        
        const league = match.league?.name?.toLowerCase() || '';
        const title = match.title?.toLowerCase() || '';
        
        if (league.includes('nfl') || title.includes('nfl')) return 'American Football';
        if (league.includes('nba') || title.includes('nba')) return 'Basketball'; 
        if (league.includes('mlb') || title.includes('mlb')) return 'Baseball';
        if (league.includes('nhl') || title.includes('nhl')) return 'Ice Hockey';
        if (league.includes('rugby') || title.includes('rugby')) return 'Rugby';
        if (league.includes('tennis') || title.includes('tennis')) return 'Tennis';
        
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
    // 🆕 FIX: Only prevent same-source merges if they're NOT Wendy
    if (matchA.source === matchB.source && matchA.source !== 'wendy') {
        return 0;
    }
    
    const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
    
    // 🆕 ADD TEAM NAME NORMALIZATION
    const normalizeTeams = (teams) => {
        return teams.replace(/ vs /g, ' - ').replace(/\s+/g, ' ').trim().toLowerCase();
    };
    
    const textA = normalizeTeams(matchA.teams) + ' ' + (matchA.tournament || '');
    const textB = normalizeTeams(matchB.teams) + ' ' + (matchB.tournament || '');
    
    // 🆕 IMPROVE TOKENIZATION FOR BETTER MATCHING
    const tokensA = this.advancedTokenize(textA);
    const tokensB = this.advancedTokenize(textB);
    
    const common = tokensA.filter(tA => 
        tokensB.some(tB => this.tokensMatch(tA, tB))
    );
    
    let score = common.length / Math.max(tokensA.length, tokensB.length);
    
    // 🆕 BOOST SCORE FOR WENDY MATCHES
    if (matchA.source === 'wendy' || matchB.source === 'wendy') {
        score += 0.1;
    }
    
    if (sport === 'Tennis' && this.hasTennisPlayerPattern(matchA) && this.hasTennisPlayerPattern(matchB)) {
        score += 0.15;
    }

        // 🆕 DEBUG FOR PYRAMIDS MATCH
if (matchA.teams.includes('Pyramids') && matchB.teams.includes('Pyramids')) {
    console.log(`   🔍 PYRAMIDS DEBUG: "${matchA.teams}" (${matchA.source}) vs "${matchB.teams}" (${matchB.source})`);
    console.log(`      TextA: "${textA}"`);
    console.log(`      TextB: "${textB}"`);
    console.log(`      TokensA:`, tokensA);
    console.log(`      TokensB:`, tokensB);
    console.log(`      Common:`, common);
    console.log(`      Score: ${score.toFixed(2)}`);
    console.log(`      Sport: ${sport}, Threshold: ${sportConfig.mergeThreshold}`);
}
    return Math.min(1.0, score);
}

    // 🆕 ADD THESE HELPER METHODS
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
        const text = match.teams || '';
        return /[A-Z]\./.test(text) || /\//.test(text);
    }

    createMatchObject(match, sport, merged, sarahStreamsMap) {
        const sarahStreams = this.getSarahStreamsForMatch(match, sarahStreamsMap);
        const tomStreams = match.channels || [];
        
        const correctTomStreams = tomStreams.filter(channel => 
            channel.includes('topembed.pw') && !channel.includes('embedsports.top')
        );
        
        const correctSarahStreams = [
            ...sarahStreams,
            ...tomStreams.filter(channel => channel.includes('embedsports.top'))
        ];
        
        // 🆕 FIX: Extract Wendy streams
        const wendyStreams = match.source === 'wendy' ? match.channels || [] : [];
        
        const allChannels = [...correctTomStreams, ...correctSarahStreams, ...wendyStreams];
        
        // 🆕 FIX: Create sources as object, not array
        const sources = {
            tom: correctTomStreams,
            sarah: correctSarahStreams,
            wendy: wendyStreams
        };
        
        return {
            unix_timestamp: match.timestamp,
            sport: sport,
            tournament: match.tournament || '',
            match: match.teams || match.title,
            channels: allChannels,
            sources: sources, // 🆕 FIX: This is now an object
            confidence: 1.0,
            merged: merged
        };
    }

    getSarahStreamsForMatch(match, sarahStreamsMap) {
        if (!match.teams) {
            return [];
        }
        
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

            // 🆕 ADD DEBUG HERE
    console.log(`🔄 MERGING CLUSTER for ${sport}:`);
    cluster.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.source}: "${match.teams}" - ${match.channels?.length} streams`);
        if (match.source === 'wendy') {
            console.log(`      Wendy streams:`, match.channels?.slice(0, 2)); // Show first 2 streams
        }
    });

        
        const baseMatch = cluster[0];
        
        const allTomStreams = [];
        const allWendyStreams = [];
        
        cluster.forEach(match => {
            const tomStreams = match.channels || [];
            tomStreams.forEach(stream => {
                if (stream.includes('topembed.pw') && !stream.includes('embedsports.top')) {
                    if (!allTomStreams.includes(stream)) {
                        allTomStreams.push(stream);
                    }
                }
            });
            
            // 🆕 FIX: Collect Wendy streams
            if (match.source === 'wendy') {
                const wendyStreams = match.channels || [];
                wendyStreams.forEach(stream => {
                    if (stream.includes('spiderembed') && !allWendyStreams.includes(stream)) {
                        allWendyStreams.push(stream);
                    }
                });
            }
        });

        // 🆕 ADD DEBUG TO SEE COLLECTED STREAMS
    console.log(`   Collected streams - Tom: ${allTomStreams.length}, Wendy: ${allWendyStreams.length}`);
        
        const sarahStreams = this.getSarahStreamsForMatch(baseMatch, sarahStreamsMap);
        
        cluster.forEach(match => {
            const tomStreams = match.channels || [];
            tomStreams.forEach(stream => {
                if (stream.includes('embedsports.top') && !sarahStreams.includes(stream)) {
                    sarahStreams.push(stream);
                }
            });
        });
        
        const allChannels = [...allTomStreams, ...sarahStreams, ...allWendyStreams];
        
        // 🆕 FIX: Create sources as object
        const sources = {
            tom: allTomStreams,
            sarah: sarahStreams,
            wendy: allWendyStreams
        };

        // 🆕 FINAL DEBUG
    console.log(`   Final sources - Tom: ${sources.tom.length}, Sarah: ${sources.sarah.length}, Wendy: ${sources.wendy.length}`);
    
        
        return {
            unix_timestamp: baseMatch.timestamp,
            sport: sport,
            tournament: baseMatch.tournament || '',
            match: baseMatch.teams || baseMatch.title,
            channels: allChannels,
            sources: sources, // 🆕 FIX: This is now an object
            confidence: 0.8,
            merged: true,
            merged_count: cluster.length
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

        // 🆕 FIXED WENDY DEBUG - uses object format
        console.log('WENDY FINAL CHECK:');
        const wendySources = siteData.matches.filter(m => 
            m.sources && m.sources.wendy && m.sources.wendy.length > 0
        );
        console.log(`   Matches with Wendy source: ${wendySources.length}`);

        const wendyStreams = siteData.matches.filter(m => 
            m.channels && m.channels.some(ch => ch.includes('spiderembed'))
        );
        console.log(`   Matches with Wendy streams: ${wendyStreams.length}`);

        // Show sample of Wendy matches
        if (wendySources.length > 0) {
            console.log('   Sample Wendy matches:');
            wendySources.slice(0, 3).forEach((match, i) => {
                console.log(`      ${i+1}. ${match.match} - Wendy streams: ${match.sources.wendy.length}`);
            });
        } else {
            console.log('   No Wendy sources found in final output');
        }

        // 🆕 FIXED SOURCE COUNT - uses object format
        console.log('FINAL CHECK - SOURCES IN MASTER DATA:');
        const sourceCount = { tom: 0, sarah: 0, wendy: 0 };
        siteData.matches.forEach(match => {
            if (match.sources && typeof match.sources === 'object') {
                if (match.sources.tom && match.sources.tom.length > 0) sourceCount.tom++;
                if (match.sources.sarah && match.sources.sarah.length > 0) sourceCount.sarah++;
                if (match.sources.wendy && match.sources.wendy.length > 0) sourceCount.wendy++;
            }
        });
        console.log('   Source distribution:', sourceCount);
        
        if (!fs.existsSync('./sports-results')) {
            fs.mkdirSync('./sports-results', { recursive: true });
        }
        // 🆕 ADD JSON VALIDATION AND ERROR HANDLING
try {
    console.log('💾 Validating JSON before saving...');
    
    // First save sports-results
    const sportsResultsJson = JSON.stringify(processedData, null, 2);
    JSON.parse(sportsResultsJson); // Validate
    fs.writeFileSync('./sports-results/simple-sports-results.json', sportsResultsJson);
    console.log('✅ Sports results saved successfully');
    
    // Then save master-data with validation
    const masterDataJson = JSON.stringify(siteData, null, 2);
    
    // Double validation
    JSON.parse(masterDataJson);
    console.log('✅ JSON validation passed');
    
    // Write the file
    fs.writeFileSync('./master-data.json', masterDataJson);
    console.log('✅ Master data saved successfully');
    
    // Final verification
    const fileStats = fs.statSync('./master-data.json');
    console.log(`✅ File verification: ${fileStats.size} bytes written`);
    
} catch (error) {
    console.error('❌ JSON validation failed:', error.message);
    
    // Create emergency backup with minimal valid data
    const emergencyData = {
        error: 'JSON validation failed - emergency backup',
        error_details: error.message,
        processed_at: new Date().toISOString(),
        total_matches: siteData.matches.length,
        matches: [] // Empty matches to ensure valid JSON
    };
    
    try {
        const emergencyJson = JSON.stringify(emergencyData, null, 2);
        fs.writeFileSync('./master-data.json', emergencyJson);
        console.log('⚠️  Emergency backup created');
    } catch (backupError) {
        console.error('💥 Critical: Could not create emergency backup:', backupError.message);
        // Last resort - create absolutely minimal valid JSON
        fs.writeFileSync('./master-data.json', '{"error": "complete_failure", "matches": []}');
    }
    
    throw new Error(`JSON validation failed: ${error.message}`);
}
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
