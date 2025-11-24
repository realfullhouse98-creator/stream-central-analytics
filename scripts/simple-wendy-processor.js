const fs = require('fs');
const path = require('path');

class SimpleWendyProcessor {
    constructor() {
        this.results = {
            totalProcessed: 0,
            processingTime: 0
        };
        this.startTime = Date.now();
    }

    async processWendyOnly() {
        console.log('🎯 STARTING WENDY-ONLY PROCESSOR...\n');
        
        try {
            // 1. Load Wendy data
            const wendyData = this.loadWendyData();
            console.log(`📥 Loaded Wendy data: ${wendyData.matches?.length || 0} matches`);
            
            // 2. Extract Wendy matches
            const wendyMatches = this.extractWendyMatches(wendyData);
            console.log(`🎯 Extracted ${wendyMatches.length} Wendy matches with streams`);
            
            // 3. Create Wendy-only output
            const wendyOutput = {
                processed_at: new Date().toISOString(),
                processor: 'wendy-only',
                summary: {
                    total_matches: wendyMatches.length,
                    matches_with_streams: wendyMatches.length,
                    sports: this.getSportBreakdown(wendyMatches)
                },
                matches: wendyMatches
            };
            
            // 4. Save Wendy-only master file
            this.saveWendyMaster(wendyOutput);
            
            this.results.processingTime = Date.now() - this.startTime;
            this.logResults(wendyOutput);
            
            return wendyOutput;
            
        } catch (error) {
            console.error('💥 Wendy-only processor failed:', error);
            throw error;
        }
    }

    loadWendyData() {
        try {
            const wendyPath = './suppliers/wendy-data.json';
            if (!fs.existsSync(wendyPath)) {
                throw new Error('Wendy data file not found');
            }
            return JSON.parse(fs.readFileSync(wendyPath, 'utf8'));
        } catch (error) {
            console.log('❌ Failed to load Wendy data:', error.message);
            return { matches: [] };
        }
    }

    extractWendyMatches(wendyData) {
        const matches = [];
        if (!wendyData.matches) return matches;
        
        console.log('🔍 Processing Wendy matches...');
        
        wendyData.matches.forEach((match, index) => {
            const hasStreams = match.streams && match.streams.length > 0;
            
            if (hasStreams) {
                // Handle both team structures
                let teams = '';
                if (match.teams) {
                    if (match.teams.event) {
                        teams = match.teams.event;
                    } else if (match.teams.home && match.teams.away) {
                        teams = `${match.teams.home.name || ''} vs ${match.teams.away.name || ''}`.trim();
                    } else {
                        teams = match.title;
                    }
                } else {
                    teams = match.title;
                }
                
                const processedMatch = {
                    source: 'wendy',
                    date: this.msToDate(match.timestamp || Date.now()),
                    time: this.msToTime(match.timestamp || Date.now()),
                    teams: teams,
                    tournament: match.league?.name || '',
                    channels: match.streams.map(stream => stream.url),
                    raw_sport: match.sport,
                    wendy_sport: match.wendySport,
                    timestamp: match.timestamp ? match.timestamp / 1000 : Date.now() / 1000,
                    status: match.status
                };
                
                matches.push(processedMatch);
                
                // Debug first 3 matches
                if (index < 3) {
                    console.log(`   📝 Wendy match ${index + 1}: "${teams}" - ${match.streams.length} streams`);
                }
            }
        });
        
        return matches;
    }

    getSportBreakdown(matches) {
        const sports = {};
        matches.forEach(match => {
            const sport = match.wendy_sport || match.raw_sport || 'unknown';
            sports[sport] = (sports[sport] || 0) + 1;
        });
        return sports;
    }

    saveWendyMaster(wendyOutput) {
        const outputPath = './master-wendy.json';
        fs.writeFileSync(outputPath, JSON.stringify(wendyOutput, null, 2));
        console.log(`💾 Wendy-only master saved to: ${outputPath}`);
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

    logResults(wendyOutput) {
        console.log('\n📊 WENDY-ONLY PROCESSOR RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Processed: ${wendyOutput.summary.total_matches}`);
        console.log(`⏱️  Processing Time: ${this.results.processingTime}ms`);
        console.log(`🏆 Sports:`, wendyOutput.summary.sports);
        console.log('══════════════════════════════════════\n');
        
        // Show sample of Wendy streams
        if (wendyOutput.matches.length > 0) {
            console.log('🔍 SAMPLE WENDY STREAMS:');
            wendyOutput.matches.slice(0, 3).forEach((match, i) => {
                console.log(`   ${i + 1}. ${match.teams}`);
                console.log(`      Sport: ${match.wendy_sport} | Streams: ${match.channels.length}`);
                console.log(`      First stream: ${match.channels[0]?.substring(0, 80)}...`);
            });
        }
    }
}

// Main execution
if (require.main === module) {
    const processor = new SimpleWendyProcessor();
    processor.processWendyOnly()
        .then(() => {
            console.log('🎉 WENDY-ONLY TEST COMPLETED!');
            console.log('💾 Check master-wendy.json for results');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Wendy-only test failed:', error);
            process.exit(1);
        });
}

module.exports = SimpleWendyProcessor;
