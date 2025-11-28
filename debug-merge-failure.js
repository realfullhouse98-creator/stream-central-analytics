// debug-merge-failure.js
const fs = require('fs');

class MergeDebugger {
    constructor() {
        try {
            this.standardizedData = JSON.parse(fs.readFileSync('./standardization-UNIVERSAL.json', 'utf8'));
            this.masterData = JSON.parse(fs.readFileSync('./master-data.json', 'utf8'));
            console.log('✅ Loaded data files successfully');
        } catch (error) {
            console.log('❌ Error loading files:', error.message);
        }
    }

    findMergeFailure(targetPlayer1 = "Elias Ymer", targetPlayer2 = "Mert Alkaya") {
        console.log(`\n🔍 INVESTIGATING: "${targetPlayer1} vs ${targetPlayer2}"\n`);
        
        // Find all versions of this match in standardized data
        const allVersions = this.standardizedData.matches.filter(m => 
            m.match.includes(targetPlayer1) && m.match.includes(targetPlayer2)
        );
        
        console.log(`📦 Found ${allVersions.length} versions in standardized data:`);
        allVersions.forEach((match, i) => {
            console.log(`\n   Version ${i+1}:`);
            console.log(`   Source: ${match.source}`);
            console.log(`   Tournament: "${match.tournament}"`);
            console.log(`   Time: ${new Date(match.unix_timestamp * 1000).toISOString()}`);
            console.log(`   Streams: ${Object.values(match.sources).flat().length}`);
        });

        // Check if merged in master data
        const mergedVersion = this.masterData.matches.find(m => 
            m.match.includes(targetPlayer1) && m.match.includes(targetPlayer2)
        );
        
        console.log(`\n🎯 MASTER DATA STATUS:`);
        if (mergedVersion) {
            console.log(`   ✅ MERGED: ${mergedVersion.merged ? 'Yes' : 'No'}`);
            console.log(`   Sources: ${Object.keys(mergedVersion.sources).join(', ')}`);
            console.log(`   Merged Count: ${mergedVersion.merged_count || 1}`);
            console.log(`   Confidence: ${mergedVersion.confidence}`);
        } else {
            console.log(`   ❌ NOT FOUND IN MASTER DATA - MERGE FAILED`);
        }

        // Calculate similarity scores between versions
        console.log(`\n🔬 SIMILARITY ANALYSIS:`);
        for (let i = 0; i < allVersions.length; i++) {
            for (let j = i + 1; j < allVersions.length; j++) {
                const score = this.calculateSimilarity(allVersions[i], allVersions[j]);
                const shouldMerge = score >= 0.25; // Current threshold
                console.log(`   ${allVersions[i].source} ↔ ${allVersions[j].source}: ${score.toFixed(3)} ${shouldMerge ? '✅ SHOULD MERGE' : '❌ BELOW THRESHOLD'}`);
            }
        }

        return { allVersions, mergedVersion };
    }

    calculateSimilarity(matchA, matchB) {
        const textA = matchA.match.toLowerCase();
        const textB = matchB.match.toLowerCase();
        
        const tokensA = textA.split(/[\s\-]+/).filter(t => t.length > 2);
        const tokensB = textB.split(/[\s\-]+/).filter(t => t.length > 2);
        
        const common = tokensA.filter(tA => 
            tokensB.some(tB => tA === tB || tA.includes(tB) || tB.includes(tA))
        );
        
        return common.length / Math.max(tokensA.length, tokensB.length);
    }

    // 🎯 NEW: Check ALL tennis matches for merge failures
    findTennisMergeFailures() {
        console.log('\n\n🎾 CHECKING ALL TENNIS MATCHES FOR MERGE FAILURES:');
        const tennisMatches = this.standardizedData.matches.filter(m => m.sport === 'Tennis');
        
        // Group by player combinations
        const playerGroups = {};
        tennisMatches.forEach(match => {
            const players = match.match.split(' vs ');
            const key = players.map(p => p.trim().toLowerCase()).sort().join('|');
            if (!playerGroups[key]) playerGroups[key] = [];
            playerGroups[key].push(match);
        });

        let failures = 0;
        Object.entries(playerGroups)
            .filter(([key, matches]) => matches.length > 1) // Only groups with multiple versions
            .forEach(([key, matches]) => {
                const firstMatch = matches[0];
                const merged = this.masterData.matches.find(m => 
                    m.sport === 'Tennis' && 
                    m.match.toLowerCase().includes(firstMatch.match.split(' vs ')[0].toLowerCase().split(' ')[0])
                );
                
                if (!merged || !merged.merged || merged.merged_count < matches.length) {
                    console.log(`\n⚠️  POTENTIAL MISSED MERGE: ${firstMatch.match}`);
                    console.log(`   Sources: ${matches.map(m => m.source).join(', ')}`);
                    console.log(`   Tournaments: ${matches.map(m => m.tournament).join(' | ')}`);
                    
                    // Calculate similarity between all pairs
                    matches.forEach((matchA, i) => {
                        matches.forEach((matchB, j) => {
                            if (i < j) {
                                const score = this.calculateSimilarity(matchA, matchB);
                                console.log(`   ${matchA.source} ↔ ${matchB.source}: ${score.toFixed(3)}`);
                            }
                        });
                    });
                    
                    failures++;
                }
            });

        console.log(`\n📊 SUMMARY: Found ${failures} potential tennis merge failures`);
    }
}

// 🎯 RUN THE DEBUGGER
console.log('🚀 TENNIS MERGE FAILURE INVESTIGATION');
console.log('========================================\n');

const debugger = new MergeDebugger();

// 1. Check the specific match we know is failing
debugger.findMergeFailure("Elias Ymer", "Mert Alkaya");

// 2. Check ALL tennis matches for merge issues
debugger.findTennisMergeFailures();

console.log('\n========================================');
console.log('✅ Debugging complete. Check output above.');
