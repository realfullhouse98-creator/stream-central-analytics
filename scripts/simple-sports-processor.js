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
        // For now, just return all matches as individual
        // We'll add merging logic later
        const processedMatches = matches.map(match => ({
            unix_timestamp: match.timestamp,
            sport: sport,
            tournament: match.tournament || '',
            match: match.teams || match.title,
            channels: match.channels || [],
            sources: [match.source],
            confidence: 1.0,
            merged: false
        }));
        
        this.results.individual += processedMatches.length;
        this.results.totalProcessed += processedMatches.length;
        
        return {
            summary: {
                total_matches: matches.length,
                processed_matches: processedMatches.length
            },
            matches: processedMatches
        };
    }

    // ... (keep your existing loadAllSuppliers, extractTomMatches, extractSarahMatches methods)

    saveResults(processedData) {
        const output = {
            processed_at: new Date().toISOString(),
            summary: {
                total_sports: Object.keys(processedData).length,
                total_matches: this.results.totalProcessed,
                total_individual: this.results.individual
            },
            sport_breakdown: this.results.sportBreakdown,
            sports: processedData
        };
        
        // Ensure directory exists
        if (!fs.existsSync('./sports-results')) {
            fs.mkdirSync('./sports-results', { recursive: true });
        }
        
        fs.writeFileSync('./sports-results/simple-sports-results.json', JSON.stringify(output, null, 2));
        fs.writeFileSync('./master-data.json', JSON.stringify(output, null, 2));
    }

    logResults() {
        console.log('\n📊 SIMPLE SPORTS PROCESSOR RESULTS:');
        console.log('══════════════════════════════════════');
        console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
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
