// scripts/unified-sports-processor.js
const fs = require('fs');
const path = require('path');
const supplierConfig = require('../suppliers/supplier-config');
const SportsClassifier = require('../modules/sports-classifier');

class UnifiedSportsProcessor {
  constructor() {
    this.classifier = new SportsClassifier();
    this.results = {
      totalProcessed: 0,
      merged: 0,
      individual: 0,
      failed: 0,
      sportBreakdown: {},
      confidenceBreakdown: { high: 0, medium: 0, low: 0, veryLow: 0 }
    };
    
    this.sportConfigs = this.buildSportConfigs();
  }

  buildSportConfigs() {
  return {
    'Tennis': {
      mergeThreshold: 0.35,  // 🚨 CHANGED from 0.55 to 0.35
      timeWindow: 120,
      tokenWeights: { players: 0.8, tournament: 0.4 },
      usePlayerCanonicalization: true,
      maxTimeDifference: 120
    },
    'American Football': {
      mergeThreshold: 0.45,  // 🚨 CHANGED from 0.70 to 0.45
      timeWindow: 60,
      tokenWeights: { teams: 0.9, competition: 0.3 },
      useTeamNormalization: true,
      maxTimeDifference: 60
    },
    'Football': {
      mergeThreshold: 0.50,  // 🚨 CHANGED from 0.75 to 0.50
      timeWindow: 90,
      tokenWeights: { teams: 0.9, league: 0.4 },
      useTeamNormalization: true,
      maxTimeDifference: 90
    },
    'Basketball': {
      mergeThreshold: 0.40,  // 🚨 CHANGED from 0.65 to 0.40
      timeWindow: 180,
      tokenWeights: { teams: 0.8, players: 0.6 },
      useTeamNormalization: true,
      maxTimeDifference: 180
    },
    'default': {
      mergeThreshold: 0.30,  // 🚨 CHANGED from 0.60 to 0.30
      timeWindow: 120,
      tokenWeights: { competitors: 0.7, context: 0.3 },
      maxTimeDifference: 120
    }
  };
}

  async processAllSports() {
    console.log('🎯 STARTING UNIFIED SPORTS PROCESSOR...\n');
    
    try {
      // 1. Load all supplier data
      const allMatches = await this.loadAllSuppliers();
      console.log(`📥 Loaded ${allMatches.length} total matches from all suppliers`);
      
      // 2. Classify and group by sport
      const sportGroups = this.classifyAndGroupBySport(allMatches);
      console.log(`🏆 Found ${Object.keys(sportGroups).length} sports`);
      
      // 3. Process each sport group
      const allProcessedMatches = {};
      
      for (const [sport, matches] of Object.entries(sportGroups)) {
        console.log(`\n🔧 Processing ${sport}: ${matches.length} matches`);
        allProcessedMatches[sport] = await this.processSport(sport, matches);
      }
      
      // 4. Generate final unified output
      const finalOutput = this.generateUnifiedOutput(allProcessedMatches);
      
      // 5. Log comprehensive results
      this.logUnifiedResults();
      
      return finalOutput;
      
    } catch (error) {
      console.error('💥 Unified processor failed:', error);
      this.results.failed++;
      throw error;
    }
  }

  classifyAndGroupBySport(allMatches) {
    const sportGroups = {};
    
    allMatches.forEach(match => {
      try {
        const sport = this.classifier.classifySport(match);
        
        // Initialize sport in results
        if (!this.results.sportBreakdown[sport]) {
          this.results.sportBreakdown[sport] = {
            total: 0,
            merged: 0,
            individual: 0
          };
        }
        this.results.sportBreakdown[sport].total++;
        
        // Group by sport
        if (!sportGroups[sport]) sportGroups[sport] = [];
        sportGroups[sport].push(match);
        
      } catch (error) {
        console.log(`❌ Failed to classify match: ${match.teams || match.title}`);
      }
    });
    
    return sportGroups;
  }

  async processSport(sport, matches) {
    const sportConfig = this.sportConfigs[sport] || this.sportConfigs.default;
    
    // 1. Group by date for this sport
    const dateGroups = this.groupByDate(matches);
    
    // 2. Process each date group with sport-specific matching
    const processedMatches = [];
    
    Object.values(dateGroups).forEach(dateMatches => {
      const merged = this.findAndMergeSportMatches(dateMatches, sport, sportConfig);
      processedMatches.push(...merged);
    });
    
    // Update sport-specific results
    this.results.sportBreakdown[sport].merged = this.results.sportBreakdown[sport].merged || 0;
    this.results.sportBreakdown[sport].individual = this.results.sportBreakdown[sport].individual || 0;
    
    return {
      sport: sport,
      config: sportConfig,
      summary: {
        total_matches: matches.length,
        processed_matches: processedMatches.length,
        merged_matches: this.results.sportBreakdown[sport].merged,
        individual_matches: this.results.sportBreakdown[sport].individual
      },
      matches: processedMatches
    };
  }

  findAndMergeSportMatches(dateMatches, sport, sportConfig) {
    const clusters = [];
    const processed = new Set();
    
    for (let i = 0; i < dateMatches.length; i++) {
      if (processed.has(i)) continue;
      
      const cluster = [dateMatches[i]];
      processed.add(i);
      
      for (let j = i + 1; j < dateMatches.length; j++) {
        if (processed.has(j)) continue;
        
        // Sport-specific matching
        const score = this.calculateSportMatchScore(dateMatches[i], dateMatches[j], sport, sportConfig);
        
        if (score >= sportConfig.mergeThreshold) {
          // Sport-specific time validation
          const timeDiff = this.calculateTimeDifference(
            dateMatches[i].time, 
            dateMatches[j].time
          );
          
          if (timeDiff <= sportConfig.maxTimeDifference) {
            cluster.push(dateMatches[j]);
            processed.add(j);
            console.log(`   🎯 ${sport} MATCH: "${dateMatches[i].teams || dateMatches[i].title}" ↔ "${dateMatches[j].teams || dateMatches[j].title}"`);
            console.log(`        Score: ${score} | Time Diff: ${timeDiff}min | Threshold: ${sportConfig.mergeThreshold}`);
          }
        }
      }
      
      clusters.push(cluster);
    }
    
    // Process clusters
    const results = [];
    clusters.forEach(cluster => {
      if (cluster.length === 1) {
        results.push(this.processSingleMatch(cluster[0], sport));
        this.results.individual++;
        this.results.sportBreakdown[sport].individual++;
      } else {
        const merged = this.mergeSportCluster(cluster, sport, sportConfig);
        results.push(merged);
        this.results.merged++;
        this.results.sportBreakdown[sport].merged++;
        
        // Track confidence
        const confidenceLevel = this.getConfidenceLevel(merged.confidence);
        this.results.confidenceBreakdown[confidenceLevel]++;
      }
    });
    
    return results;
  }

  calculateSportMatchScore(matchA, matchB, sport, sportConfig) {
    if (matchA.source === matchB.source) return 0;

    // Extract competitors using classifier
    const competitorsA = this.classifier.extractCompetitors(matchA, sport);
    const competitorsB = this.classifier.extractCompetitors(matchB, sport);
    
    // Base token score
    let score = this.calculateTokenScore(competitorsA, competitorsB, sportConfig);
    
    // Sport-specific enhancements
    score = this.applySportSpecificBoosts(score, matchA, matchB, sport, sportConfig);
    
     // 🚨 ADD DEBUG LOGGING:
  if (score > 0.2) { // Only log potential matches
    console.log(`   🔍 ${sport} SCORE: ${score.toFixed(2)} | "${competitorsA.competitor1}" ↔ "${competitorsB.competitor1}"`);
  }
    
    return Math.min(1.0, score);
  }

  calculateTokenScore(competitorsA, competitorsB, sportConfig) {
    const textA = `${competitorsA.competitor1} ${competitorsA.competitor2}`.toLowerCase();
    const textB = `${competitorsB.competitor1} ${competitorsB.competitor2}`.toLowerCase();
    
    const tokensA = this.tokenizeString(textA);
    const tokensB = this.tokenizeString(textB);
    
    const commonTokens = tokensA.filter(tokenA =>
      tokensB.some(tokenB => this.tokensMatch(tokenA, tokenB))
    );
    
    return commonTokens.length / Math.max(tokensA.length, tokensB.length);
  }

  applySportSpecificBoosts(score, matchA, matchB, sport, sportConfig) {
    let boostedScore = score;
    
    // Tournament/League similarity boost
    const tournamentBoost = this.calculateTournamentSimilarity(matchA.tournament, matchB.tournament, sport);
    if (tournamentBoost > 0.7) {
      boostedScore += 0.2;
    } else if (tournamentBoost > 0.5) {
      boostedScore += 0.1;
    }
    
    // Sport-specific pattern recognition
    switch(sport) {
      case 'Tennis':
        // Boost for same player patterns
        if (this.hasTennisPlayerPattern(matchA) && this.hasTennisPlayerPattern(matchB)) {
          boostedScore += 0.15;
        }
        break;
        
      case 'American Football':
      case 'Football':
      case 'Basketball':
        // Boost for team name consistency
        if (this.hasTeamConsistency(matchA, matchB)) {
          boostedScore += 0.1;
        }
        break;
    }
    
    return Math.min(1.0, boostedScore);
  }

  calculateTournamentSimilarity(tournamentA, tournamentB, sport) {
    if (!tournamentA || !tournamentB) return 0;
    
    const tA = tournamentA.toLowerCase();
    const tB = tournamentB.toLowerCase();
    
    if (tA === tB) return 1.0;
    if (tA.includes(tB) || tB.includes(tA)) return 0.8;
    
    // Sport-specific tournament matching
    const sportKeywords = {
      'Tennis': ['atp', 'wta', 'itf', 'challenger', 'open'],
      'American Football': ['ncaa', 'college', 'bowl', 'conference'],
      'Football': ['premier', 'la liga', 'serie', 'champions', 'europa'],
      'Basketball': ['nba', 'euroleague', 'playoffs', 'finals']
    };
    
    const keywords = sportKeywords[sport] || [];
    const commonKeywords = keywords.filter(keyword => 
      tA.includes(keyword) && tB.includes(keyword)
    );
    
    return commonKeywords.length > 0 ? 0.6 : 0;
  }

  hasTennisPlayerPattern(match) {
    const text = match.teams || match.title || '';
    return /[A-Z]\./.test(text) || /\//.test(text) || / vs /.test(text);
  }

  hasTeamConsistency(matchA, matchB) {
    const textA = (matchA.teams || matchA.title || '').toLowerCase();
    const textB = (matchB.teams || matchB.title || '').toLowerCase();
    
    const teamIndicators = ['fc', 'united', 'city', 'club', 'athletic', 'real'];
    return teamIndicators.some(indicator => 
      textA.includes(indicator) && textB.includes(indicator)
    );
  }

  mergeSportCluster(cluster, sport, sportConfig) {
    const tomMatch = cluster.find(m => m.source === 'tom');
    const baseMatch = tomMatch || cluster[0];
    const otherMatches = cluster.filter(m => m !== baseMatch);
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    otherMatches.forEach(other => {
      const score = this.calculateSportMatchScore(baseMatch, other, sport, sportConfig);
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
      sport: sport,
      tournament: baseMatch.tournament,
      match: this.standardizeMatchFormat(baseMatch.teams || baseMatch.title, sport),
      channels: allChannels,
      sources: sources,
      confidence: Math.round(avgConfidence * 100) / 100,
      merged: true,
      merged_count: cluster.length,
      competitors: this.classifier.extractCompetitors(baseMatch, sport)
    };
  }

  standardizeMatchFormat(matchText, sport) {
    // Standardize separators based on sport
    switch(sport) {
      case 'Tennis':
        return matchText.replace(' - ', ' vs ');
      case 'American Football':
      case 'Football':
      case 'Basketball':
        return matchText.replace(' vs ', ' - ').replace(' - ', ' vs ');
      default:
        return matchText.replace(' - ', ' vs ');
    }
  }

  processSingleMatch(match, sport) {
    return {
      unix_timestamp: match.timestamp,
      sport: sport,
      tournament: match.tournament,
      match: this.standardizeMatchFormat(match.teams || match.title, sport),
      channels: match.channels,
      sources: [match.source],
      confidence: 1.0,
      merged: false,
      competitors: this.classifier.extractCompetitors(match, sport)
    };
  }

  // Utility methods
  groupByDate(matches) {
    const groups = {};
    matches.forEach(match => {
      if (!groups[match.date]) groups[match.date] = [];
      groups[match.date].push(match);
    });
    return groups;
  }

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

  tokenizeString(str) {
    return str
      .toLowerCase()
      .split(/[\.\-\/\s]+/)
      .filter(token => token.length > 1);
  }

  tokensMatch(tokenA, tokenB) {
    return tokenA === tokenB || tokenA.includes(tokenB) || tokenB.includes(tokenA);
  }

  getConfidenceLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.65) return 'medium';
    if (score >= 0.55) return 'low';
    return 'veryLow';
  }

  // Existing load methods (same as before)
  async loadAllSuppliers() {
    const allMatches = [];
    
    for (const [key, config] of Object.entries(supplierConfig)) {
      try {
        if (!fs.existsSync(config.file)) {
          console.log(`❌ ${key} data file missing: ${config.file}`);
          continue;
        }
        
        const data = JSON.parse(fs.readFileSync(config.file, 'utf8'));
        const matches = this.extractMatchesFromSupplier(data, key);
        
        console.log(`✅ ${key}: ${matches.length} matches`);
        allMatches.push(...matches);
        
      } catch (error) {
        console.log(`❌ Failed to load ${key}:`, error.message);
        this.results.failed++;
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
        matches.push({
          source: 'tom',
          date: date,
          time: this.unixToTime(match.unix_timestamp),
          teams: match.match,
          tournament: match.tournament || '',
          channels: match.channels || [],
          raw: match,
          timestamp: match.unix_timestamp
        });
      });
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
        timestamp: match.date / 1000
      });
    });
    
    return matches;
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

  generateUnifiedOutput(allProcessedMatches) {
    this.results.totalProcessed = Object.values(allProcessedMatches)
      .reduce((total, sportData) => total + sportData.summary.processed_matches, 0);
    
    return {
      processed_at: new Date().toISOString(),
      summary: {
        total_sports: Object.keys(allProcessedMatches).length,
        total_matches: this.results.totalProcessed,
        total_merged: this.results.merged,
        total_individual: this.results.individual,
        total_failed: this.results.failed
      },
      sport_breakdown: this.results.sportBreakdown,
      confidence_breakdown: this.results.confidenceBreakdown,
      sports: allProcessedMatches
    };
  }

  logUnifiedResults() {
    console.log('\n📊 UNIFIED SPORTS PROCESSOR RESULTS:');
    console.log('══════════════════════════════════════════════════════');
    console.log(`✅ Total Processed: ${this.results.totalProcessed}`);
    console.log(`🔄 Total Merged: ${this.results.merged}`);
    console.log(`🎯 Total Individual: ${this.results.individual}`);
    console.log(`❌ Total Failed: ${this.results.failed}`);
    
    console.log('\n🎯 Confidence Breakdown:');
    Object.entries(this.results.confidenceBreakdown).forEach(([level, count]) => {
      console.log(`   ${level}: ${count}`);
    });
    
    console.log('\n🏆 Sport Breakdown:');
    Object.entries(this.results.sportBreakdown).forEach(([sport, stats]) => {
      console.log(`   ${sport}: ${stats.total} total, ${stats.merged || 0} merged, ${stats.individual || 0} individual`);
    });
    console.log('══════════════════════════════════════════════════════\n');
  }
}

// Main execution
if (require.main === module) {
  const processor = new UnifiedSportsProcessor();
  
  processor.processAllSports()
    .then(output => {
      // Ensure directories exist
      const dirs = ['./sports-results', './suppliers'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });
      
      // Save detailed results
      fs.writeFileSync(
        './sports-results/unified-sports-results.json', 
        JSON.stringify(output, null, 2)
      );
      
      console.log('💾 Unified sports results saved to ./sports-results/unified-sports-results.json');
      
      // Update master-data.json with unified format
      const masterData = {
        ...output,
        last_updated: new Date().toISOString()
      };
      
      fs.writeFileSync(
        './master-data.json', 
        JSON.stringify(masterData, null, 2)
      );
      
      console.log('💾 Master data updated at ./master-data.json');
      
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Unified processor failed:', error);
      process.exit(1);
    });
}

module.exports = UnifiedSportsProcessor;
