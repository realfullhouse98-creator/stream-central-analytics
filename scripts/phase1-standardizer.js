const fs = require('fs');
const path = require('path');
const SportsClassifier = require('../modules/sports-classifier.js');

class Phase1Standardizer {
    constructor() {
        this.sportsClassifier = new SportsClassifier();
        this.results = {
            totalMatches: 0,
            suppliers: {},
            startTime: new Date().toISOString()
        };
    }

    async standardizeAllData() {
        console.log('🚀 STARTING PHASE 1 - DATA STANDARDIZATION\n');
        
        try {
            // Step 1: Process each supplier
            const tomMatches = this.processTomData();
            const sarahMatches = this.processSarahData();
            const wendyMatches = this.processWendyData();

            // Step 2: Combine all matches
            const allMatches = [...tomMatches, ...sarahMatches, ...wendyMatches];
            this.results.totalMatches = allMatches.length;

            // Step 3: Create standardized output
            const standardizedData = {
                phase: "1-standardization",
                created_at: new Date().toISOString(),
                summary: {
                    total_matches: allMatches.length,
                    tom_matches: tomMatches.length,
                    sarah_matches: sarahMatches.length,
                    wendy_matches: wendyMatches.length,
                    suppliers_processed: ['tom', 'sarah', 'wendy']
                },
                matches: allMatches
            };

            // Step 4: Save to file
            this.saveStandardizedData(standardizedData);
            
            // Step 5: Show results
            this.logResults(standardizedData);
            
            return standardizedData;

        } catch (error) {
            console.error('💥 PHASE 1 FAILED:', error);
            throw error;
        }
    }

    processTomData() {
        console.log('🔧 PROCESSING TOM DATA...');
        
        try {
            const tomPath = './suppliers/tom-data.json';
            if (!fs.existsSync(tomPath)) {
                console.log('❌ Tom data file not found');
                return [];
            }

            const tomData = JSON.parse(fs.readFileSync(tomPath, 'utf8'));
            const matches = [];

            // Tom data has events by date
            if (tomData.events) {
                Object.entries(tomData.events).forEach(([date, dayMatches]) => {
                    if (Array.isArray(dayMatches)) {
                        dayMatches.forEach(match => {
                            // Fix: Change "-" to " vs " in team names
                            const fixedMatchName = match.match.replace(/ - /g, ' vs ');
                            
                            const standardizedMatch = {
                                source: 'tom',
                                unix_timestamp: match.unix_timestamp,
                                sport: this.sportsClassifier.classifySport(match),
                                tournament: match.tournament || '',
                                match: fixedMatchName, // Now uses "vs"
                                sources: {
                                    tom: match.channels || []
                                }
                            };
                            
                            matches.push(standardizedMatch);
                        });
                    }
                });
            }

            console.log(`✅ Tom: ${matches.length} matches processed`);
            this.results.suppliers.tom = matches.length;
            return matches;

        } catch (error) {
            console.log('❌ Tom processing failed:', error.message);
            return [];
        }
    }

   processSarahData() {
    console.log('🔧 PROCESSING SARAH DATA...');
    
    try {
        const sarahPath = './suppliers/sarah-data.json';
        const sarahData = JSON.parse(fs.readFileSync(sarahPath, 'utf8'));
        
        // FORCE: Try different possible structures
        let matchesArray = sarahData;
        
        if (sarahData.matches && Array.isArray(sarahData.matches)) {
            matchesArray = sarahData.matches;
            console.log(`📦 Found ${matchesArray.length} matches in .matches`);
        } else if (Array.isArray(sarahData)) {
            matchesArray = sarahData;
            console.log(`📦 Found ${matchesArray.length} matches in root array`);
        } else {
            console.log('❌ Cannot find Sarah matches array');
            return [];
        }

        const matches = [];
        matchesArray.forEach((match, index) => {
            const standardizedMatch = {
                source: 'sarah',
                unix_timestamp: match.date ? Math.floor(match.date / 1000) : 0,
                sport: this.sportsClassifier.classifySport(match),
                tournament: '',
                match: match.title,
                sources: {
                    sarah: match.sources ? match.sources.map(s => 
                        `https://embedsports.top/embed/${s.source}/${s.id}/1`
                    ) : []
                }
            };
            matches.push(standardizedMatch);
            
            if (index < 2) {
                console.log(`   ✅ "${match.title}" → ${standardizedMatch.sport}`);
            }
        });

        console.log(`✅ Sarah: ${matches.length} matches processed`);
        return matches;

    } catch (error) {
        console.log('❌ Sarah failed:', error.message);
        return [];
    }
}

    processWendyData() {
        console.log('🔧 PROCESSING WENDY DATA...');
        
        try {
            const wendyPath = './suppliers/wendy-data.json';
            if (!fs.existsSync(wendyPath)) {
                console.log('❌ Wendy data file not found');
                return [];
            }

            const wendyData = JSON.parse(fs.readFileSync(wendyPath, 'utf8'));
            const matches = [];

            if (wendyData.matches && Array.isArray(wendyData.matches)) {
                wendyData.matches.forEach(match => {
                    // Only process matches with streams
                    if (match.streams && match.streams.length > 0) {
                        // Convert timestamp to unix_timestamp (divide by 1000)
                        const unixTimestamp = match.timestamp ? Math.floor(match.timestamp / 1000) : 0;
                        
                        // Create team name from home/away
                        let teamName = match.title; // Fallback to title
                        if (match.teams && match.teams.home && match.teams.away) {
                            teamName = `${match.teams.home.name} vs ${match.teams.away.name}`;
                        }
                        
                        // Get Wendy streams
                        const wendyStreams = match.streams.map(stream => stream.url);

                        const standardizedMatch = {
                            source: 'wendy',
                            unix_timestamp: unixTimestamp,
                            sport: this.sportsClassifier.classifySport(match),
                            tournament: match.league?.name || '',
                            match: teamName, // Uses "vs"
                            sources: {
                                wendy: wendyStreams
                            }
                        };
                        
                        matches.push(standardizedMatch);
                    }
                });
            }

            console.log(`✅ Wendy: ${matches.length} matches with streams processed`);
            this.results.suppliers.wendy = matches.length;
            return matches;

        } catch (error) {
            console.log('❌ Wendy processing failed:', error.message);
            return [];
        }
    }

    saveStandardizedData(data) {
        const outputPath = './standardization-TEST.json';
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 Standardized data saved to: ${outputPath}`);
    }

    logResults(data) {
        console.log('\n📊 PHASE 1 RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Matches: ${data.summary.total_matches}`);
        console.log(`🔧 Tom: ${data.summary.tom_matches} matches`);
        console.log(`🔧 Sarah: ${data.summary.sarah_matches} matches`);
        console.log(`🔧 Wendy: ${data.summary.wendy_matches} matches`);
        console.log('══════════════════════════════════════\n');

        // Show sample matches
        console.log('🔍 SAMPLE MATCHES:');
        data.matches.slice(0, 3).forEach((match, i) => {
            console.log(`   ${i + 1}. ${match.match}`);
            console.log(`      Sport: ${match.sport} | Source: ${match.source}`);
            console.log(`      Tom streams: ${match.sources.tom?.length || 0}`);
            console.log(`      Sarah streams: ${match.sources.sarah?.length || 0}`);
            console.log(`      Wendy streams: ${match.sources.wendy?.length || 0}`);
        });
    }
}

// Run if called directly
if (require.main === module) {
    const standardizer = new Phase1Standardizer();
    standardizer.standardizeAllData()
        .then(() => {
            console.log('🎉 PHASE 1 COMPLETED!');
            console.log('💾 Check standardization-TEST.json for results');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Phase 1 failed:', error);
            process.exit(1);
        });
}

module.exports = Phase1Standardizer;
