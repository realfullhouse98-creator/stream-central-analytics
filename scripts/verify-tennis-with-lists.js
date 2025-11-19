const fs = require('fs');

async function verifyTennisWithLists() {
    console.log('🔍 VERIFYING TENNIS MATCHES WITH EXPORT LISTS\n');
    
    try {
        // Load data
        const processedResults = JSON.parse(fs.readFileSync('./tennis-results/tennis-results.json', 'utf8'));
        const tomData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
        const sarahData = JSON.parse(fs.readFileSync('./suppliers/sarah-data.json', 'utf8'));
        
        // Create verification directory
        const verifyDir = './tennis-verification';
        if (!fs.existsSync(verifyDir)) {
            fs.mkdirSync(verifyDir, { recursive: true });
        }

        // 1. LIST OF ALL 00:00 TIME MATCHES (POTENTIAL DATA ISSUES)
        console.log('1. 📋 GENERATING LIST OF 00:00 TIME MATCHES...');
        const zeroTimeMatches = processedResults.matches.filter(m => m.time === '00:00');
        
        fs.writeFileSync(
            `${verifyDir}/00-zero-time-matches.json`,
            JSON.stringify({
                count: zeroTimeMatches.length,
                matches: zeroTimeMatches.map(match => ({
                    teams: match.teams,
                    time: match.time,
                    sources: match.raw_sources,
                    tournament: match.tournament,
                    merged: match.merged,
                    confidence: match.confidence
                }))
            }, null, 2)
        );
        console.log(`   💾 Saved ${zeroTimeMatches.length} zero-time matches to ${verifyDir}/00-zero-time-matches.json`);

        // 2. LIST OF SUCCESSFULLY MERGED MATCHES
        console.log('2. 📋 GENERATING LIST OF SUCCESSFULLY MERGED MATCHES...');
        const mergedMatches = processedResults.matches.filter(m => m.merged);
        
        fs.writeFileSync(
            `${verifyDir}/01-successfully-merged.json`,
            JSON.stringify({
                count: mergedMatches.length,
                matches: mergedMatches.map(match => ({
                    teams: match.teams,
                    time: match.time,
                    sources: match.raw_sources,
                    tom_streams: match.sources.tom?.length || 0,
                    sarah_streams: match.sources.sarah?.length || 0,
                    confidence: match.confidence,
                    tournament: match.tournament
                }))
            }, null, 2)
        );
        console.log(`   💾 Saved ${mergedMatches.length} merged matches to ${verifyDir}/01-successfully-merged.json`);

        // 3. LIST OF INDIVIDUAL MATCHES (NOT MERGED)
        console.log('3. 📋 GENERATING LIST OF INDIVIDUAL MATCHES...');
        const individualMatches = processedResults.matches.filter(m => !m.merged);
        
        fs.writeFileSync(
            `${verifyDir}/02-individual-matches.json`,
            JSON.stringify({
                count: individualMatches.length,
                matches: individualMatches.map(match => ({
                    teams: match.teams,
                    time: match.time,
                    source: match.raw_sources[0],
                    streams: match.sources[match.raw_sources[0]]?.length || 0,
                    tournament: match.tournament
                }))
            }, null, 2)
        );
        console.log(`   💾 Saved ${individualMatches.length} individual matches to ${verifyDir}/02-individual-matches.json`);

        // 4. LIST OF HIGH CONFIDENCE MERGES (FOR VALIDATION)
        console.log('4. 📋 GENERATING LIST OF HIGH CONFIDENCE MERGES...');
        const highConfidenceMerges = mergedMatches.filter(m => m.confidence >= 0.8);
        
        fs.writeFileSync(
            `${verifyDir}/03-high-confidence-merges.json`,
            JSON.stringify({
                count: highConfidenceMerges.length,
                matches: highConfidenceMerges.map(match => ({
                    teams: match.teams,
                    time: match.time,
                    confidence: match.confidence,
                    sources: match.raw_sources,
                    tournament: match.tournament
                }))
            }, null, 2)
        );
        console.log(`   💾 Saved ${highConfidenceMerges.length} high-confidence merges to ${verifyDir}/03-high-confidence-merges.json`);

        // 5. RAW DATA SAMPLES FOR COMPARISON
        console.log('5. 📋 GENERATING RAW DATA SAMPLES...');
        
        // Sample of Tom's raw tennis data
        const tomTennisSamples = [];
        Object.entries(tomData.events || {}).forEach(([date, matches]) => {
            matches.slice(0, 3).forEach(match => { // First 3 matches from each day
                if (match.sport?.toLowerCase().includes('tennis')) {
                    tomTennisSamples.push({
                        date: date,
                        match: match.match,
                        timestamp: match.unix_timestamp,
                        tournament: match.tournament,
                        channels: match.channels?.length || 0
                    });
                }
            });
        });

        // Sample of Sarah's raw tennis data
        const sarahTennisSamples = (sarahData.matches || [])
            .filter(m => m.category?.toLowerCase().includes('tennis'))
            .slice(0, 20) // First 20 tennis matches
            .map(match => ({
                title: match.title,
                date: match.date,
                category: match.category,
                sources: match.sources?.length || 0
            }));

        fs.writeFileSync(
            `${verifyDir}/04-raw-data-samples.json`,
            JSON.stringify({
                tom_samples: {
                    count: tomTennisSamples.length,
                    matches: tomTennisSamples
                },
                sarah_samples: {
                    count: sarahTennisSamples.length,
                    matches: sarahTennisSamples
                }
            }, null, 2)
        );
        console.log(`   💾 Saved raw data samples to ${verifyDir}/04-raw-data-samples.json`);

        // 6. SUMMARY REPORT
        console.log('6. 📊 GENERATING SUMMARY REPORT...');
        const summary = {
            verification_date: new Date().toISOString(),
            overall_stats: {
                total_processed_matches: processedResults.matches.length,
                merged_matches: mergedMatches.length,
                individual_matches: individualMatches.length,
                merge_success_rate: `${((mergedMatches.length / processedResults.matches.length) * 100).toFixed(1)}%`,
                zero_time_matches: zeroTimeMatches.length,
                high_confidence_merges: highConfidenceMerges.length
            },
            source_breakdown: {
                tom_only: processedResults.matches.filter(m => m.raw_sources.length === 1 && m.raw_sources[0] === 'tom').length,
                sarah_only: processedResults.matches.filter(m => m.raw_sources.length === 1 && m.raw_sources[0] === 'sarah').length,
                both_sources: processedResults.matches.filter(m => m.raw_sources.length === 2).length
            },
            time_analysis: {
                matches_with_valid_times: processedResults.matches.filter(m => m.time !== '00:00').length,
                matches_with_zero_times: zeroTimeMatches.length,
                time_range: {
                    earliest: processedResults.matches.reduce((min, m) => m.time < min ? m.time : min, '23:59'),
                    latest: processedResults.matches.reduce((max, m) => m.time > max ? m.time : max, '00:00')
                }
            },
            files_generated: [
                '00-zero-time-matches.json - Matches with 00:00 times (check for data issues)',
                '01-successfully-merged.json - Matches successfully merged from Tom + Sarah',
                '02-individual-matches.json - Matches from single source only',
                '03-high-confidence-merges.json - High confidence merged matches',
                '04-raw-data-samples.json - Samples of raw supplier data for comparison'
            ]
        };

        fs.writeFileSync(
            `${verifyDir}/05-summary-report.json`,
            JSON.stringify(summary, null, 2)
        );
        console.log(`   💾 Saved summary report to ${verifyDir}/05-summary-report.json`);

        console.log('\n🎯 VERIFICATION COMPLETE!');
        console.log('📁 Check the ./tennis-verification/ folder for these files:');
        console.log('   00-zero-time-matches.json    - Potential data issues');
        console.log('   01-successfully-merged.json  - Working merged matches');
        console.log('   02-individual-matches.json   - Single-source matches');
        console.log('   03-high-confidence-merges.json - Best quality merges');
        console.log('   04-raw-data-samples.json     - Raw data for comparison');
        console.log('   05-summary-report.json       - Overall statistics');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

// Run verification
if (require.main === module) {
    verifyTennisWithLists();
}

module.exports = verifyTennisWithLists;
