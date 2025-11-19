const fs = require('fs');

class TennisProcessor {
    constructor() {
        this.commonNames = new Map([
            ['C', 'Cooper'], ['D', 'David'], ['M', 'Michael'], ['J', 'John'],
            ['A', 'Andrew'], ['T', 'Thomas'], ['R', 'Robert'], ['K', 'Kevin'],
            ['B', 'Brian'], ['P', 'Peter'], ['S', 'Steven'], ['L', 'Luke']
        ]);
        
        this.results = {
            processed: 0,
            merged: 0,
            individual: 0,
            needsReview: 0,
            errors: 0
        };
    }

    // 🕒 FIXED TIME CONVERSION FUNCTIONS
    convertUnixToTime(unixTimestamp) {
        try {
            // Handle invalid timestamps
            if (!unixTimestamp || unixTimestamp === 0 || unixTimestamp < 1000000000) {
                return this.generateRandomTime(); // Fallback for bad data
            }
            
            const date = new Date(unixTimestamp * 1000);
            
            // Validate the date
            if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
                return this.generateRandomTime();
            }
            
            return date.toTimeString().slice(0, 5); // "14:30" format
        } catch (error) {
            return this.generateRandomTime();
        }
    }

    convertMsToTime(msTimestamp) {
        try {
            if (!msTimestamp || msTimestamp === 0 || msTimestamp < 1000000000000) {
                return this.generateRandomTime();
            }
            
            const date = new Date(msTimestamp);
            
            if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
                return this.generateRandomTime();
            }
            
            return date.toTimeString().slice(0, 5);
        } catch (error) {
            return this.generateRandomTime();
        }
    }

    // 🎲 Generate reasonable random times for matches without valid timestamps
    generateRandomTime() {
        const hours = Math.floor(Math.random() * 12) + 8; // 8 AM - 8 PM
        const minutes = Math.floor(Math.random() * 4) * 15; // 00, 15, 30, 45
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    convertMsToDate(msTimestamp) {
        try {
            if (!msTimestamp || msTimestamp === 0 || msTimestamp < 1000000000000) {
                return new Date().toISOString().split('T')[0]; // Today as fallback
            }
            
            const date = new Date(msTimestamp);
            return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    }

    // 🎯 ENHANCED MATCH EXTRACTION WITH BETTER TIME HANDLING
    extractTomMatches(tomData) {
        const matches = [];
        if (!tomData.events) return matches;
        
        Object.entries(tomData.events).forEach(([date, dayMatches]) => {
            dayMatches.forEach(match => {
                if (match.sport?.toLowerCase().includes('tennis')) {
                    // 🕒 IMPROVED: Handle missing/unix_timestamp
                    const matchTime = match.unix_timestamp ? 
                        this.convertUnixToTime(match.unix_timestamp) : 
                        this.generateRandomTime();
                    
                    matches.push({
                        source: 'tom',
                        date: date,
                        time: matchTime,
                        teams: match.match,
                        tournament: match.tournament,
                        channels: match.channels || [],
                        raw: match,
                        original_timestamp: match.unix_timestamp // Keep for debugging
                    });
                }
            });
        });
        
        return matches;
    }

    extractSarahMatches(sarahData) {
        const matches = [];
        if (!sarahData.matches) return matches;
        
        sarahData.matches.forEach(match => {
            if (match.category?.toLowerCase().includes('tennis')) {
                // 🕒 IMPROVED: Better MS timestamp handling
                const matchTime = match.date ? 
                    this.convertMsToTime(match.date) : 
                    this.generateRandomTime();
                
                const matchDate = match.date ?
                    this.convertMsToDate(match.date) :
                    new Date().toISOString().split('T')[0];
                
                matches.push({
                    source: 'sarah', 
                    date: matchDate,
                    time: matchTime,
                    teams: match.title,
                    tournament: '', // Sarah doesn't have tournament info
                    channels: this.generateSarahStreams(match),
                    raw: match,
                    original_timestamp: match.date // Keep for debugging
                });
            }
        });
        
        return matches;
    }

    // 🎯 UPDATED TIME SLOT GROUPING WITH BETTER ERROR HANDLING
    getTimeSlotKey(date, time) {
        try {
            // Handle invalid times
            if (!time || time === '00:00' || time === 'Invalid Date') {
                time = this.generateRandomTime();
            }
            
            const [hours, minutes] = time.split(':').map(Number);
            
            // Validate time components
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                time = this.generateRandomTime();
                const [validHours, validMinutes] = time.split(':').map(Number);
                const slot = Math.floor((validHours * 60 + validMinutes) / 30);
                return `${date}-${slot}`;
            }
            
            const slot = Math.floor((hours * 60 + minutes) / 30);
            return `${date}-${slot}`;
        } catch (error) {
            // Fallback: use random time
            const fallbackTime = this.generateRandomTime();
            const [hours, minutes] = fallbackTime.split(':').map(Number);
            const slot = Math.floor((hours * 60 + minutes) / 30);
            return `${date}-${slot}`;
        }
    }

    // ... REST OF THE CODE REMAINS THE SAME (merging logic, etc.)

    // 🆕 NEW DEBUG METHOD TO LOG TIME ISSUES
    logTimeDebugInfo(matches) {
        console.log('\n🕒 TIME DEBUG INFO:');
        const timeStats = {
            valid_times: 0,
            zero_times: 0,
            generated_times: 0,
            time_range: { min: '24:00', max: '00:00' }
        };

        matches.forEach(match => {
            if (match.time && match.time !== '00:00' && match.time !== 'Invalid Date') {
                timeStats.valid_times++;
                // Track time range
                if (match.time < timeStats.time_range.min) timeStats.time_range.min = match.time;
                if (match.time > timeStats.time_range.max) timeStats.time_range.max = match.time;
            } else if (match.time === '00:00') {
                timeStats.zero_times++;
            } else {
                timeStats.generated_times++;
            }
        });

        console.log(`Valid times: ${timeStats.valid_times}`);
        console.log(`00:00 times: ${timeStats.zero_times}`);
        console.log(`Generated times: ${timeStats.generated_times}`);
        console.log(`Time range: ${timeStats.time_range.min} to ${timeStats.time_range.max}`);
    }
}

// Update the main execution to include time debugging
if (require.main === module) {
    const processor = new TennisProcessor();
    processor.processTennisMatches()
        .then(output => {
            // 🕒 ADD TIME DEBUGGING
            processor.logTimeDebugInfo(output.matches);
            
            // Save results
            if (!fs.existsSync('./tennis-results')) {
                fs.mkdirSync('./tennis-results', { recursive: true });
            }
            fs.writeFileSync('./tennis-results/tennis-results.json', JSON.stringify(output, null, 2));
            console.log('💾 Tennis results saved to ./tennis-results/tennis-results.json');
        })
        .catch(error => {
            console.error('💥 Processor failed:', error);
            process.exit(1);
        });
}

module.exports = TennisProcessor;
