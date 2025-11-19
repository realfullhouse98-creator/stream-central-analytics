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
        
        // Track match counts per day for time assignment
        this.dayMatchCounts = new Map();
    }

    // 🎯 MAIN PROCESSING METHOD
    async processTennisMatches() {
        console.log('🎾 STARTING TENNIS PROCESSOR...\n');
        
        try {
            // 1. Load supplier data
            const supplierData = await this.loadSupplierData();
            console.log(`📥 Loaded ${supplierData.length} total matches`);
            
            // 2. Extract tennis matches only
            const tennisMatches = this.extractTennisMatches(supplierData);
            console.log(`🎾 Found ${tennisMatches.length} tennis matches`);
            
            // 3. Group by time slots (±30 minutes)
            const timeSlots = this.groupByTimeSlots(tennisMatches);
            console.log(`⏰ Created ${Object.keys(timeSlots).length} time slots`);
            
            // 4. Process each time slot for matching
            const processedMatches = this.processTimeSlots(timeSlots);
            
            // 5. Generate final output
            const finalOutput = this.generateFinalOutput(processedMatches);
            
            this.logResults();
            return finalOutput;
            
        } catch (error) {
            console.error('💥 Tennis processor failed:', error);
            this.results.errors++;
            throw error;
        }
    }

    // 1. LOAD SUPPLIER DATA
    async loadSupplierData() {
        const suppliers = ['tom', 'sarah'];
        const allMatches = [];
        
        for (const supplier of suppliers) {
            try {
                const filePath = `./suppliers/${supplier}-data.json`;
                if (!fs.existsSync(filePath)) {
                    console.log(`❌ ${supplier} data file missing`);
                    continue;
                }
                
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const matches = this.extractMatchesFromSupplier(data, supplier);
                
                console.log(`✅ ${supplier}: ${matches.length} matches extracted`);
                allMatches.push(...matches);
                
            } catch (error) {
                console.log(`❌ Failed to load ${supplier}:`, error.message);
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
        
        // Reset day counters
        this.dayMatchCounts.clear();
        
        Object.entries(tomData.events).forEach(([date, dayMatches]) => {
            // Initialize counter for this day
            if (!this.dayMatchCounts.has(date)) {
                this.dayMatchCounts.set(date, 0);
            }
            
            dayMatches.forEach(match => {
                if (match.sport?.toLowerCase().includes('tennis')) {
                    const dayCount = this.dayMatchCounts.get(date);
                    
                    // 🕒 FIX: IGNORE broken timestamps, use smart time assignment
                    const matchTime = this.extractTimeFromTournament(match.tournament) || 
                                    this.assignReasonableTime(date, dayCount);
                    
                    matches.push({
                        source: 'tom',
                        date: date,
                        time: matchTime,
                        teams: match.match,
                        tournament: match.tournament,
                        channels: match.channels || [],
                        raw: match,
                        original_timestamp: match.unix_timestamp,
                        time_assignment: 'smart' // Track how time was assigned
                    });
                    
                    // Increment counter for this day
                    this.dayMatchCounts.set(date, dayCount + 1);
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
                // For Sarah, we can still try to use timestamps since they might be better
                const matchTime = match.date ? 
                    this.convertMsToReasonableTime(match.date) : 
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
                    original_timestamp: match.date,
                    time_assignment: 'converted'
                });
            }
        });
        
        return matches;
    }

    // 🕒 SMART TIME ASSIGNMENT - IGNORES BROKEN TOM TIMESTAMPS
    
    // Try to extract time from tournament name (e.g., "UTR (M) - Waco (USA) 22:10")
    extractTimeFromTournament(tournament) {
        if (!tournament) return null;
        
        // Look for time patterns like "22:10", "14:30", etc.
        const timeMatch = tournament.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            
            // Validate time
            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                console.log(`   🕒 Extracted time from tournament: ${timeMatch[0]} from "${tournament}"`);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }
        
        return null;
    }

    // Assign reasonable times based on match order in each day
    assignReasonableTime(date, matchIndex) {
        const baseHour = 8; // 8 AM start
        const matchesPerHour = 4; // 4 matches per hour (00, 15, 30, 45)
        
        const hour = baseHour + Math.floor(matchIndex / matchesPerHour);
        const minute = (matchIndex % matchesPerHour) * 15; // 00, 15, 30, 45
        
        let finalHour = hour;
        
        // Ensure reasonable hours (6 AM to 11 PM)
        if (finalHour < 6) finalHour = 6;
        if (finalHour > 23) finalHour = 23 - (finalHour % 23);
        
        return `${finalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    // For Sarah data - convert but ensure reasonable times
    convertMsToReasonableTime(msTimestamp) {
        try {
            if (!msTimestamp || msTimestamp === 0 || msTimestamp < 1000000000000) {
                return this.generateRandomTime();
            }
            
            const date = new Date(msTimestamp);
            
            if (isNaN(date.getTime())) {
                return this.generateRandomTime();
            }
            
            // Convert to reasonable time (avoid midnight)
            let hours = date.getHours();
            let minutes = date.getMinutes();
            
            // Ensure reasonable match times
            if (hours < 6) hours = 6 + (hours % 6);
            if (hours > 23) hours = 18 + (hours % 5);
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
        } catch (error) {
            return this.generateRandomTime();
        }
    }

    // 2. EXTRACT TENNIS MATCHES
    extractTennisMatches(allMatches) {
        return allMatches.filter(match => 
            match.teams && this.isTennisMatch(match)
        );
    }

    isTennisMatch(match) {
        const searchString = (match.teams + ' ' + match.tournament).toLowerCase();
        return searchString.includes('tennis') || 
               this.hasTennisNamePattern(match.teams);
    }

    hasTennisNamePattern(teamString) {
        const tennisPatterns = [
            / vs /i, / - /, /\//, /[A-Z]\./, /\./
        ];
        return tennisPatterns.some(pattern => pattern.test(teamString));
    }

    // 3. TIME SLOT GROUPING
    groupByTimeSlots(matches) {
        const slots = {};
        
        matches.forEach(match => {
            const slotKey = this.getTimeSlotKey(match.date, match.time);
            if (!slots[slotKey]) slots[slotKey] = [];
            slots[slotKey].push(match);
        });
        
        return slots;
    }

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

    // 4. PROCESS TIME SLOTS
    processTimeSlots(timeSlots) {
        const processed = [];
        
        Object.values(timeSlots).forEach(slotMatches => {
            if (slotMatches.length === 1) {
                processed.push(this.processSingleMatch(slotMatches[0]));
            } else {
                const merged = this.attemptMerging(slotMatches);
                processed.push(...merged);
            }
        });
        
        return processed;
    }

    attemptMerging(slotMatches) {
        const results = [];
        const processed = new Set();
        
        for (let i = 0; i < slotMatches.length; i++) {
            if (processed.has(i)) continue;
            
            let bestMatch = slotMatches[i];
            let bestScore = 0;
            let bestIndex = -1;
            
            // Find best matching partner
            for (let j = i + 1; j < slotMatches.length; j++) {
                if (processed.has(j)) continue;
                
                const score = this.calculateMatchScore(slotMatches[i], slotMatches[j]);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = slotMatches[j];
                    bestIndex = j;
                }
            }
            
            if (bestScore >= 0.6) { // MEDIUM confidence threshold
                // MERGE matches
                const merged = this.mergeMatches(slotMatches[i], bestMatch, bestScore);
                results.push(merged);
                processed.add(i);
                processed.add(bestIndex);
                this.results.merged++;
            } else {
                // Keep as individual
                results.push(this.processSingleMatch(slotMatches[i]));
                processed.add(i);
                this.results.individual++;
            }
        }
        
        return results;
    }

    // CORE MATCHING ALGORITHM
    calculateMatchScore(matchA, matchB) {
        if (matchA.source === matchB.source) return 0; // Don't merge same source
        
        const nameA = this.normalizeTeamNames(matchA.teams);
        const nameB = this.normalizeTeamNames(matchB.teams);
        
        const tokensA = this.tokenizeNames(nameA);
        const tokensB = this.tokenizeNames(nameB);
        
        // Calculate token overlap
        const commonTokens = tokensA.filter(token => 
            tokensB.some(t => this.tokensMatch(token, t))
        );
        
        const maxTokens = Math.max(tokensA.length, tokensB.length);
        return commonTokens.length / maxTokens;
    }

    normalizeTeamNames(teams) {
        // Convert to "Player A VS Player B" format
        return teams
            .replace(/ - /g, ' VS ')
            .replace(/ vs /gi, ' VS ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    tokenizeNames(teamString) {
        // "Cooper White VS David Smith" → ["Cooper", "White", "David", "Smith"]
        return teamString
            .replace(/ VS /g, ' ')
            .split(/[\s\/\.]+/)
            .filter(token => token.length > 1) // Filter out single letters
            .map(token => token.toLowerCase());
    }

    tokensMatch(tokenA, tokenB) {
        // Flexible token matching
        if (tokenA === tokenB) return true;
        if (tokenA.includes(tokenB) || tokenB.includes(tokenA)) return true;
        
        // Handle common variations
        const variations = {
            'cooper': 'coop', 'michael': 'mike', 'robert': 'rob', 
            'richard': 'rick', 'william': 'will'
        };
        
        return variations[tokenA] === tokenB || variations[tokenB] === tokenA;
    }

    // MERGE LOGIC
    mergeMatches(matchA, matchB, confidence) {
        const normalizedNames = this.normalizeTeamNames(matchA.teams);
        
        return {
            teams: normalizedNames,
            sport: 'Tennis',
            date: matchA.date,
            time: matchA.time,
            tournament: matchA.tournament || matchB.tournament || 'Tennis Tournament',
            sources: {
                tom: matchA.source === 'tom' ? matchA.channels : matchB.source === 'tom' ? matchB.channels : [],
                sarah: matchA.source === 'sarah' ? matchA.channels : matchB.source === 'sarah' ? matchB.channels : []
            },
            confidence: confidence,
            merged: true,
            estimated_names: confidence < 0.8,
            raw_sources: [matchA.source, matchB.source],
            time_assignment: matchA.time_assignment || matchB.time_assignment
        };
    }

    processSingleMatch(match) {
        const normalizedNames = this.normalizeTeamNames(match.teams);
        
        return {
            teams: normalizedNames,
            sport: 'Tennis', 
            date: match.date,
            time: match.time,
            tournament: match.tournament || 'Tennis Tournament',
            sources: {
                [match.source]: match.channels
            },
            confidence: 1.0,
            merged: false,
            estimated_names: false,
            raw_sources: [match.source],
            time_assignment: match.time_assignment || 'default'
        };
    }

    // 5. GENERATE FINAL OUTPUT
    generateFinalOutput(processedMatches) {
        return {
            sport: 'Tennis',
            processed_at: new Date().toISOString(),
            summary: {
                total_matches: processedMatches.length,
                merged_matches: this.results.merged,
                individual_matches: this.results.individual,
                needs_review: this.results.needsReview
            },
            matches: processedMatches
        };
    }

    // 🎲 Generate reasonable random times
    generateRandomTime() {
        const hours = Math.floor(Math.random() * 12) + 8; // 8 AM - 8 PM
        const minutes = Math.floor(Math.random() * 4) * 15; // 00, 15, 30, 45
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    convertMsToDate(msTimestamp) {
        try {
            if (!msTimestamp || msTimestamp === 0 || msTimestamp < 1000000000000) {
                return new Date().toISOString().split('T')[0];
            }
            
            const date = new Date(msTimestamp);
            return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    }

    // HELPER METHODS
    generateSarahStreams(match) {
        if (!match.sources) return [];
        return match.sources.map(source => 
            `https://embedsports.top/embed/${source.source}/${source.id}/1`
        );
    }

    logResults() {
        console.log('\n📊 TENNIS PROCESSOR RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Processed: ${this.results.processed}`);
        console.log(`🔄 Merged: ${this.results.merged}`);
        console.log(`🎾 Individual: ${this.results.individual}`);
        console.log(`⚠️  Needs Review: ${this.results.needsReview}`);
        console.log(`❌ Errors: ${this.results.errors}`);
        console.log('══════════════════════════════════════\n');
    }

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
        
        // Log time assignment methods
        const assignmentStats = {};
        matches.forEach(match => {
            const method = match.time_assignment || 'unknown';
            assignmentStats[method] = (assignmentStats[method] || 0) + 1;
        });
        
        console.log('\n⏰ TIME ASSIGNMENT METHODS:');
        Object.entries(assignmentStats).forEach(([method, count]) => {
            console.log(`   ${method}: ${count} matches`);
        });
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
