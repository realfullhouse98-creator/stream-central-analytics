// scripts/tennis-processor.js
const fs = require('fs');
const path = require('path');
const supplierConfig = require('../suppliers/supplier-config');

class TennisProcessor {
  constructor() {
    this.results = {
      totalProcessed: 0,
      merged: 0,
      individual: 0,
      failed: 0,
      confidenceBreakdown: { high: 0, medium: 0, low: 0, veryLow: 0 },
      sportBreakdown: { tennis: 0, football: 0, basketball: 0, other: 0 }
    };
    
    // Tennis-specific enhancements
    this.playerNameMap = this.buildPlayerNameMap();
    this.tournamentSimilarity = this.buildTournamentSimilarity();
  }

  // 🎯 ENHANCEMENT 1: SPORT CLASSIFICATION
  classifySport(match) {
    const searchString = (match.teams + ' ' + match.tournament).toLowerCase();
    
    // Strong football indicators (prevent misclassification)
    const footballIndicators = [
      /(manchester united|manchester city|barcelona|real madrid|chelsea|arsenal)/i,
      /(premier league|la liga|serie a|bundesliga|champions league|europa league)/i,
      /(fc|cf|united|city| athletic| real| de)/i,
      /\d+\s*-\s*\d+/, // Score lines like "2-1"
      /(halftime|fulltime|penalty|corner|goal)/i
    ];
    
    if (footballIndicators.some(pattern => pattern.test(searchString))) {
      return 'football';
    }
    
    // Strong basketball indicators
    const basketballIndicators = [
      /(nba|euroleague|basketball|b-ball|ncaa)/i,
      /(lakers|warriors|celtics|bulls|knicks)/i,
      /(quarter|halftime|three-pointer|dunk|rebound)/i
    ];
    
    if (basketballIndicators.some(pattern => pattern.test(searchString))) {
      return 'basketball';
    }
    
    // Tennis indicators (our target)
    const tennisIndicators = [
      /tennis/i,
      /(atp|wta|itf|challenger|grand slam|open|doubles|singles)/i,
      /vs.*[A-Z]\..*[A-Z]\./, // Initials like "R. Federer vs N. Djokovic"
      /[A-Z]\.[A-Za-z]+.*vs.*[A-Z]\.[A-Za-z]+/, // Initials pattern
      /\w+\/\w+.*vs.*\w+\/\w+/, // Doubles pattern "A/B vs C/D"
    ];
    
    if (tennisIndicators.some(pattern => pattern.test(searchString))) {
      return 'tennis';
    }
    
    return match.raw?.sport?.toLowerCase() || 'other';
  }

  // 🎯 ENHANCEMENT 2: PLAYER NAME CANONICALIZATION
  buildPlayerNameMap() {
    // Common tennis player name variations
    return {
      'r federer': 'roger federer',
      'rafael nadal': 'rafael nadal', 
      'n djokovic': 'novak djokovic',
      'novak djokovic': 'novak djokovic',
      'a murray': 'andy murray',
      'andy murray': 'andy murray',
      // Add more as we discover patterns
    };
  }

  canonicalizePlayerName(name) {
    const cleanName = name.toLowerCase().trim();
    return this.playerNameMap[cleanName] || name;
  }

  // 🎯 ENHANCEMENT 3: TOURNAMENT SIMILARITY
  buildTournamentSimilarity() {
    return {
      'atp': ['atp tour', 'atp world tour', 'atp masters'],
      'wta': ['wta tour', 'wta championships'],
      'itf': ['itf world tennis', 'itf tour'],
      'wimbledon': ['the championships', 'wimbledon championships'],
      'us open': ['us open tennis', 'u.s. open'],
      'french open': ['roland garros', 'french open'],
      'australian open': ['aus open', 'australian open']
    };
  }

  calculateTournamentSimilarity(tournamentA, tournamentB) {
    if (!tournamentA || !tournamentB) return 0;
    
    const tA = tournamentA.toLowerCase();
    const tB = tournamentB.toLowerCase();
    
    // Exact match
    if (tA === tB) return 1.0;
    
    // One is substring of another
    if (tA.includes(tB) || tB.includes(tA)) return 0.8;
    
    // Check similarity groups
    for (const [key, variations] of Object.entries(this.tournamentSimilarity)) {
      if (variations.includes(tA) && variations.includes(tB)) {
        return 0.9;
      }
      if (variations.includes(tA) && tB.includes(key)) return 0.7;
      if (variations.includes(tB) && tA.includes(key)) return 0.7;
    }
    
    return 0;
  }

  async processAllSuppliers() {
    console.log('🎾 STARTING ENHANCED TENNIS PROCESSOR...\n');
    
    try {
      // 1. Load all supplier data
      const allMatches = await this.loadAllSuppliers();
      console.log(`📥 Loaded ${allMatches.length} total matches from all suppliers`);
      
      // 2. 🎯 ENHANCEMENT: Sport classification + tennis filtering
      const tennisMatches = this.filterTennisMatches(allMatches);
      console.log(`🎾 Found ${tennisMatches.length} tennis matches (after sport filtering)`);
      
      // 3. Group by date only
      const dateGroups = this.groupByDate(tennisMatches);
      console.log(`📅 Created ${Object.keys(dateGroups).length} date groups`);
      
      // 4. Process each date group with enhanced matching
      const processedMatches = this.processDateGroups(dateGroups);
      
      // 5. Generate final output
      const finalOutput = this.generateFinalOutput(processedMatches);
      
      // 6. Log results
      this.logProcessingResults();
      
      return finalOutput;
      
    } catch (error) {
      console.error('💥 Processor failed:', error);
      this.results.failed++;
      throw error;
    }
  }

  // 🎯 ENHANCEMENT: Better tennis filtering with sport classification
  filterTennisMatches(allMatches) {
    const tennisMatches = [];
    
    allMatches.forEach(match => {
      const sport = this.classifySport(match);
      this.results.sportBreakdown[sport] = (this.results.sportBreakdown[sport] || 0) + 1;
      
      if (sport === 'tennis') {
        tennisMatches.push(match);
      } else {
        console.log(`   🏷️ Filtered out: ${match.teams} → ${sport}`);
      }
    });
    
    return tennisMatches;
  }

  groupByDate(matches) {
    const groups = {};
    matches.forEach(match => {
      if (!groups[match.date]) groups[match.date] = [];
      groups[match.date].push(match);
    });
    return groups;
  }

  processDateGroups(dateGroups) {
    const processed = [];
    
    Object.values(dateGroups).forEach(dateMatches => {
      const merged = this.findAndMergeMatches(dateMatches);
      processed.push(...merged);
    });
    
    return processed;
  }

  // 🎯 ENHANCEMENT 4: TENNIS-OPTIMIZED MATCHING
  findAndMergeMatches(dateMatches) {
    const clusters = [];
    const processed = new Set();
    
    for (let i = 0; i < dateMatches.length; i++) {
      if (processed.has(i)) continue;
      
      const cluster = [dateMatches[i]];
      processed.add(i);
      
      for (let j = i + 1; j < dateMatches.length; j++) {
        if (processed.has(j)) continue;
        
        // 🎯 ENHANCED: Tennis-optimized scoring
        const score = this.calculateTennisMatchScore(dateMatches[i], dateMatches[j]);
        
        if (score >= 0.55) {
          const timeDiff = this.calculateTimeDifference(
            dateMatches[i].time, 
            dateMatches[j].time
          );
          
          if (timeDiff <= 120) { // 2 hours
            cluster.push(dateMatches[j]);
            processed.add(j);
            console.log(`   🎯 TENNIS MATCH: "${dateMatches[i].teams}" ↔ "${dateMatches[j].teams}"`);
            console.log(`        Score: ${score} | Time Diff: ${timeDiff}min`);
          }
        }
      }
      
      clusters.push(cluster);
    }
    
    const results = [];
    clusters.forEach(cluster => {
      if (cluster.length === 1) {
        results.push(this.processSingleMatch(cluster[0]));
        this.results.individual++;
      } else {
        const merged = this.mergeCluster(cluster);
        results.push(merged);
        this.results.merged++;
        
        const confidenceLevel = this.getConfidenceLevel(merged.confidence);
        this.results.confidenceBreakdown[confidenceLevel]++;
      }
    });
    
    return results;
  }

  // 🎯 ENHANCEMENT 5: TENNIS-OPTIMIZED SCORING
  calculateTennisMatchScore(matchA, matchB) {
    if (matchA.source === matchB.source) return 0;

    // Base token score (our core engine)
    let score = this.calculateTokenScore(matchA, matchB);
    
    // 🎯 TENNIS ENHANCEMENTS:
    
    // 1. Player name canonicalization boost
    const canonicalScore = this.calculateCanonicalSimilarity(matchA.teams, matchB.teams);
    if (canonicalScore >= 0.8) {
      score = Math.max(score, 0.8);
    }
    
    // 2. Tournament similarity boost
    const tournamentBoost = this.calculateTournamentSimilarity(matchA.tournament, matchB.tournament);
    if (tournamentBoost > 0.7) {
      score += 0.2; // Significant boost for same tournament
    } else if (tournamentBoost > 0.5) {
      score += 0.1; // Moderate boost
    }
    
    // 3. Doubles pattern consistency boost
    if (this.isDoublesMatch(matchA) === this.isDoublesMatch(matchB)) {
      score += 0.05; // Small boost for same match type
    }
    
    return Math.min(1.0, score); // Cap at 1.0
  }

  calculateTokenScore(matchA, matchB) {
    const tokensA = this.tokenizeMatch(matchA);
    const tokensB = this.tokenizeMatch(matchB);
    
    const commonTokens = tokensA.filter(tokenA =>
      tokensB.some(tokenB => this.tokensMatch(tokenA, tokenB))
    );
    
    return commonTokens.length / Math.max(tokensA.length, tokensB.length);
  }

  // 🎯 ENHANCEMENT 6: CANONICAL SIMILARITY
  calculateCanonicalSimilarity(teamsA, teamsB) {
    const canonicalA = this.canonicalizeTeamString(teamsA);
    const canonicalB = this.canonicalizeTeamString(teamsB);
    
    return this.calculateTokenScore(
      { teams: canonicalA, tournament: '' },
      { teams: canonicalB, tournament: '' }
    );
  }

  canonicalizeTeamString(teamString) {
    // Convert "R. Federer vs N. Djokovic" → "Roger Federer vs Novak Djokovic"
    return teamString
      .split(/ vs | - /)
      .map(player => this.canonicalizePlayerName(player))
      .join(' vs ');
  }

  isDoublesMatch(match) {
    return match.teams.includes('/') || match.tournament.toLowerCase().includes('double');
  }

  // ... (keep all your existing utility methods: tokenizeMatch, tokensMatch, calculateTimeDifference, etc.)

  calculateTimeDifference(timeA, timeB) {
    try {
      const [hoursA, minutesA] = timeA.split(':').map(Number);
      const [hoursB, minutesB] = timeB.split(':').map(Number);
      
      const totalMinutesA = hoursA * 60 + minutesA;
      const totalMinutesB = hoursB * 60 + minutesB;
      
      return Math.abs(totalMinutesA - totalMinutesB);
    } catch (error) {
      return 999;
    }
  }

  tokenizeMatch(match) {
    const searchString = match.teams + ' ' + match.tournament;
    return this.tokenizeString(searchString);
  }

  tokenizeString(str) {
    return str
      .toLowerCase()
      .split(/[\.\-\/\s]+/)
      .filter(token => token.length > 1);
  }

  tokensMatch(tokenA, tokenB) {
    return tokenA === tokenB || tokenA.includes(tokenB) || tokenB.includes(tokenA);
  }

  mergeCluster(cluster) {
    const tomMatch = cluster.find(m => m.source === 'tom');
    const baseMatch = tomMatch || cluster[0];
    const otherMatches = cluster.filter(m => m !== baseMatch);
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    otherMatches.forEach(other => {
      const score = this.calculateTennisMatchScore(baseMatch, other);
      totalConfidence += score;
      confidenceCount++;
    });
    
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 1;
    
    const allChannels = [...baseMatch.channels];
    otherMatches.forEach(match => {
      match.channels.forEach(channel => {
        if (!allChannels.includes(channel)) {
          allChannels.push(channel);
        }
      });
    });
    
    const sources = [...new Set(cluster.map(m => m.source))];
    
    return {
      unix_timestamp: baseMatch.timestamp,
      sport: 'Tennis',
      tournament: baseMatch.tournament,
      match: baseMatch.teams.replace(' - ', ' vs '),
      channels: allChannels,
      sources: sources,
      confidence: Math.round(avgConfidence * 100) / 100,
      merged: true,
      merged_count: cluster.length
    };
  }

  processSingleMatch(match) {
    return {
      unix_timestamp: match.timestamp,
      sport: 'Tennis',
      tournament: match.tournament,
      match: match.teams.replace(' - ', ' vs '),
      channels: match.channels,
      sources: [match.source],
      confidence: 1.0,
      merged: false
    };
  }

  // ... (keep all your existing load methods: loadAllSuppliers, extractTomMatches, extractSarahMatches)

  generateFinalOutput(processedMatches) {
    this.results.totalProcessed = processedMatches.length;
    
    return {
      sport: 'Tennis',
      processed_at: new Date().toISOString(),
      summary: {
        total_matches: processedMatches.length,
        merged_matches: this.results.merged,
        individual_matches: this.results.individual,
        failed_processing: this.results.failed
      },
      confidence_breakdown: this.results.confidenceBreakdown,
      sport_breakdown: this.results.sportBreakdown,
      matches: processedMatches
    };
  }

  getConfidenceLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.65) return 'medium';
    if (score >= 0.55) return 'low';
    return 'veryLow';
  }

  logProcessingResults() {
    console.log('\n📊 ENHANCED PROCESSING RESULTS:');
    console.log('══════════════════════════════════════');
    console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
    console.log(`🔄 Merged Matches: ${this.results.merged}`);
    console.log(`🎾 Individual Matches: ${this.results.individual}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    console.log('\n🎯 Confidence Breakdown:');
    console.log(`   High (≥0.8): ${this.results.confidenceBreakdown.high}`);
    console.log(`   Medium (0.65-0.79): ${this.results.confidenceBreakdown.medium}`);
    console.log(`   Low (0.55-0.64): ${this.results.confidenceBreakdown.low}`);
    console.log(`   Very Low (<0.55): ${this.results.confidenceBreakdown.veryLow}`);
    
    console.log('\n🏆 Sport Classification:');
    Object.entries(this.results.sportBreakdown).forEach(([sport, count]) => {
      console.log(`   ${sport}: ${count}`);
    });
    console.log('══════════════════════════════════════\n');
  }
}

// Main execution (same as before)
if (require.main === module) {
  const processor = new TennisProcessor();
  
  processor.processAllSuppliers()
    .then(output => {
      const dirs = ['./tennis-results', './suppliers'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });
      
      fs.writeFileSync('./tennis-results/tennis-results.json', JSON.stringify(output, null, 2));
      console.log('💾 Tennis results saved to ./tennis-results/tennis-results.json');
      
      const masterData = { ...output, last_updated: new Date().toISOString() };
      fs.writeFileSync('./master-data.json', JSON.stringify(masterData, null, 2));
      console.log('💾 Master data updated at ./master-data.json');
      
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Final error:', error);
      process.exit(1);
    });
}

module.exports = TennisProcessor;
