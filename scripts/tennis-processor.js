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

    // MAIN PROCESSING PIPELINE
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
        
        Object.entries(tomData.events).forEach(([date, dayMatches]) => {
            dayMatches.forEach(match => {
                if (match.sport?.toLowerCase().includes('tennis')) {
                    matches.push({
                        source: 'tom',
                        date: date,
                        time: this.convertUnixToTime(match.unix_timestamp),
                        teams: match.match,
                        tournament: match.tournament,
                        channels: match.channels || [],
                        raw: match
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
                matches.push({
                    source: 'sarah', 
                    date: this.convertMsToDate(match.date),
                    time: this.convertMsToTime(match.date),
                    teams: match.title,
                    tournament: '', // Sarah doesn't have tournament info
                    channels: this.generateSarahStreams(match),
                    raw: match
                });
            }
        });
        
        return matches;
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
        // Group by 30-minute windows
        const [hours, minutes] = time.split(':').map(Number);
        const slot = Math.floor((hours * 60 + minutes) / 30);
        return `${date}-${slot}`;
    }

    // 4. PROCESS TIME SLOTS - CORE MATCHING LOGIC
    processTimeSlots(timeSlots) {
        const processed = [];
        
        Object.values(timeSlots).forEach(slotMatches => {
            if (slotMatches.length === 1) {
                // Single match in time slot
                processed.push(this.processSingleMatch(slotMatches[0]));
            } else {
                // Multiple matches - attempt merging
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

    // 5. CORE MATCHING ALGORITHM
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

    // 6. MERGE LOGIC
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
            raw_sources: [matchA.source, matchB.source]
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
            raw_sources: [match.source]
        };
    }

    // 7. GENERATE FINAL OUTPUT
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

    // UTILITY FUNCTIONS
    convertUnixToTime(unixTimestamp) {
        if (!unixTimestamp) return '00:00';
        const date = new Date(unixTimestamp * 1000);
        return date.toTimeString().slice(0, 5);
    }

    convertMsToTime(msTimestamp) {
        if (!msTimestamp) return '00:00';
        const date = new Date(msTimestamp);
        return date.toTimeString().slice(0, 5);
    }

    convertMsToDate(msTimestamp) {
        if (!msTimestamp) return '2000-01-01';
        return new Date(msTimestamp).toISOString().split('T')[0];
    }

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
}

// Export and run
if (require.main === module) {
    const processor = new TennisProcessor();
    processor.processTennisMatches()
        .then(output => {
            // Save results
            fs.writeFileSync('./output/tennis-results.json', JSON.stringify(output, null, 2));
            console.log('💾 Tennis results saved to ./output/tennis-results.json');
        })
        .catch(error => {
            console.error('💥 Processor failed:', error);
            process.exit(1);
        });
}

module.exports = TennisProcessor;
