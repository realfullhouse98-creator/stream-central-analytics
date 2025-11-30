const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NormalizationMap = require('../modules/normalization-map.js');
const supplierConfig = require('../suppliers/supplier-config.js');

// 1. Enhanced Field Mapping (No Tournament)
class EnhancedFieldMapperNoTournament {
  constructor() {
    this.fieldMappings = {
      'tom': {
        'match': ['name', 'title', 'event_name'],
        'sport': ['sport', 'category', 'type'],
        'unix_timestamp': ['timestamp', 'start_time', 'time'],
        'streams': ['streams', 'channels', 'links']
      },
      'sarah': {
        'match': ['name', 'title', 'teams'],
        'sport': ['sport', 'category'], 
        'unix_timestamp': ['timestamp', 'start_time'],
        'streams': ['streams', 'links']
      },
      'wendy': {
        'match': ['name', 'title', 'event'],
        'sport': ['sport', 'type'],
        'unix_timestamp': ['timestamp', 'time'],
        'streams': ['streams', 'urls']
      }
    };
    
    this.requiredFields = ['match', 'sport', 'unix_timestamp'];
  }

  standardizeMatch(rawMatch, supplier) {
    const standardized = {
      source: supplier,
      sources: { tom: [], sarah: [], wendy: [] },
      unix_timestamp: null,
      sport: 'Unknown',
      match: '',
      match_id: this.generateMatchId(rawMatch)
    };

    // Map basic fields without tournament
    const mapping = this.fieldMappings[supplier];
    
    // Extract match name
    standardized.match = this.extractField(rawMatch, mapping.match) || 'Unknown Match';
    
    // Extract sport
    standardized.sport = this.extractField(rawMatch, mapping.sport) || 'Unknown';
    
    // Extract timestamp
    standardized.unix_timestamp = this.extractTimestamp(rawMatch, mapping.unix_timestamp);
    
    // Extract streams
    const streams = this.extractStreams(rawMatch, mapping.streams, supplier);
    standardized.sources[supplier] = streams;
    
    return standardized;
  }

  extractField(rawMatch, possibleFields) {
    for (const field of possibleFields) {
      if (rawMatch[field] !== undefined && rawMatch[field] !== null) {
        return String(rawMatch[field]).trim();
      }
    }
    return null;
  }

  extractTimestamp(rawMatch, possibleFields) {
    for (const field of possibleFields) {
      if (rawMatch[field]) {
        const timestamp = parseInt(rawMatch[field]);
        if (!isNaN(timestamp) && timestamp > 0) {
          return timestamp;
        }
        
        // Try to parse date strings
        if (typeof rawMatch[field] === 'string') {
          const date = new Date(rawMatch[field]);
          if (!isNaN(date.getTime())) {
            return Math.floor(date.getTime() / 1000);
          }
        }
      }
    }
    return Math.floor(Date.now() / 1000); // Fallback to current time
  }

  extractStreams(rawMatch, possibleFields, supplier) {
    for (const field of possibleFields) {
      if (rawMatch[field]) {
        if (Array.isArray(rawMatch[field])) {
          return rawMatch[field].filter(stream => stream && typeof stream === 'string');
        } else if (typeof rawMatch[field] === 'string') {
          return [rawMatch[field]];
        }
      }
    }
    return [];
  }

  generateMatchId(rawMatch) {
    const hash = crypto.createHash('sha1');
    hash.update(JSON.stringify(rawMatch));
    return hash.digest('hex').substring(0, 16);
  }
}

// 2. Enhanced Data Quality Scoring (No Tournament)
class EnhancedDataQualityScoringNoTournament {
  calculateDataQualityScore(match) {
    let score = 100;
    
    // Required field penalties
    if (!match.match || match.match === 'Unknown Match') score -= 40;
    if (!match.sport || match.sport === 'Unknown') score -= 30;
    if (!match.unix_timestamp) score -= 30;
    
    // Match name quality
    if (match.match) {
      const teams = this.extractTeams(match.match);
      
      // Penalize if no clear team structure
      if (teams.length === 0) score -= 20;
      if (teams.length === 1) score -= 10;
      
      // Penalize very short/long names
      if (match.match.length < 5) score -= 15;
      if (match.match.length > 100) score -= 10;
      
      // Bonus for proper " vs " format
      if (match.match.includes(' vs ')) score += 10;
    }
    
    // Sport classification quality
    if (match.sport && this.isCommonSport(match.sport)) score += 10;
    
    // Timestamp quality
    if (match.unix_timestamp) {
      const now = Date.now() / 1000;
      const isReasonable = match.unix_timestamp > (now - 31536000) && // Within 1 year past
                          match.unix_timestamp < (now + 604800);     // Within 1 week future
      if (!isReasonable) score -= 20;
    }
    
    // Stream quality
    const totalStreams = Object.values(match.sources || {}).flat().length;
    if (totalStreams === 0) score -= 10;
    if (totalStreams > 5) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  extractTeams(matchText) {
    if (!matchText || !matchText.includes(' vs ')) return [];
    const [teamA, teamB] = matchText.split(' vs ');
    return [teamA.trim(), teamB.trim()];
  }

  isCommonSport(sport) {
    const commonSports = [
      'football', 'basketball', 'tennis', 'american football', 
      'ice hockey', 'baseball', 'rugby', 'cricket', 'volleyball'
    ];
    return commonSports.includes(sport.toLowerCase());
  }
}

// 3. Enhanced Sport Classification (No Tournament)
class EnhancedSportClassifierNoTournament {
  constructor() {
    this.sportKeywords = {
      'Football': ['football', 'soccer', 'premier league', 'la liga', 'champions league'],
      'Basketball': ['basketball', 'nba', 'wnba', 'euroleague'],
      'Tennis': ['tennis', 'wimbledon', 'us open', 'atp', 'wta'],
      'American Football': ['nfl', 'football', 'super bowl', 'touchdown'],
      'Ice Hockey': ['hockey', 'nhl', 'ice hockey', 'puck'],
      'Baseball': ['baseball', 'mlb', 'yankees', 'dodgers'],
      'Rugby': ['rugby', 'six nations', 'all blacks'],
      'Cricket': ['cricket', 'test match', 't20', 'ipl'],
      'Volleyball': ['volleyball', 'beach volleyball']
    };
  }

  classifySportFromMatch(matchName, originalSport) {
    // If original sport is already good, use it
    if (this.isValidSport(originalSport)) {
      return originalSport;
    }
    
    // Classify from match name
    const matchLower = matchName.toLowerCase();
    
    for (const [sport, keywords] of Object.entries(this.sportKeywords)) {
      for (const keyword of keywords) {
        if (matchLower.includes(keyword)) {
          return sport;
        }
      }
    }
    
    // Fallback: detect from team patterns
    return this.detectSportFromTeamPatterns(matchName);
  }

  detectSportFromTeamPatterns(matchName) {
    const teams = this.extractTeams(matchName);
    
    if (teams.length === 2) {
      // Check for sport-specific team name patterns
      if (this.hasFootballTeamPatterns(teams)) return 'Football';
      if (this.hasBasketballTeamPatterns(teams)) return 'Basketball';
      if (this.hasAmericanFootballTeamPatterns(teams)) return 'American Football';
    }
    
    return 'Other';
  }

  extractTeams(matchText) {
    if (!matchText || !matchText.includes(' vs ')) return [];
    const [teamA, teamB] = matchText.split(' vs ');
    return [teamA.trim().toLowerCase(), teamB.trim().toLowerCase()];
  }

  hasFootballTeamPatterns(teams) {
    const footballIndicators = ['united', 'city', 'fc', 'real', 'athletic', 'rovers'];
    return teams.some(team => 
      footballIndicators.some(indicator => team.includes(indicator))
    );
  }

  hasBasketballTeamPatterns(teams) {
    const basketballIndicators = ['lakers', 'celtics', 'warriors', 'bulls', 'raptors'];
    return teams.some(team =>
      basketballIndicators.some(indicator => team.includes(indicator))
    );
  }

  hasAmericanFootballTeamPatterns(teams) {
    const nflIndicators = ['49ers', 'patriots', 'packers', 'cowboys', 'steelers'];
    return teams.some(team =>
      nflIndicators.some(indicator => team.includes(indicator))
    );
  }

  isValidSport(sport) {
    return sport && sport !== 'Unknown' && Object.keys(this.sportKeywords).includes(sport);
  }
}

// 4. Enhanced Error Recovery (No Tournament)
class EnhancedErrorRecoveryNoTournament {
  applyErrorRecovery(match, supplier) {
    let recoveredMatch = { ...match };
    const recoveries = [];
    
    // Recover missing timestamp
    if (!recoveredMatch.unix_timestamp) {
      recoveredMatch.unix_timestamp = this.recoverTimestamp(recoveredMatch, supplier);
      recoveries.push('timestamp_recovered');
    }
    
    // Recover invalid sport
    if (!recoveredMatch.sport || recoveredMatch.sport === 'Unknown') {
      recoveredMatch.sport = this.recoverSport(recoveredMatch, supplier);
      recoveries.push('sport_reclassified');
    }
    
    // Recover malformed match name
    if (!recoveredMatch.match || recoveredMatch.match === 'Unknown Match') {
      recoveredMatch.match = this.recoverMatchName(recoveredMatch, supplier);
      recoveries.push('match_name_recovered');
    }
    
    // Clean up match name (remove any tournament-like phrases)
    recoveredMatch.match = this.cleanMatchName(recoveredMatch.match);
    
    return {
      match: recoveredMatch,
      recoveries_applied: recoveries,
      recovery_confidence: this.calculateRecoveryConfidence(recoveries)
    };
  }

  cleanMatchName(matchName) {
    if (!matchName) return matchName;
    
    // Remove common tournament/league phrases that might interfere with team matching
    return matchName
      .replace(/\b(premier league|la liga|serie a|bundesliga|nba|nfl|mlb|nhl)\b/gi, '')
      .replace(/\b(champions league|europa league|world cup|olympics|euro)\b/gi, '')
      .replace(/\b(round of 16|quarter final|semi final|final)\b/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+vs\.?\s+/gi, ' vs ')
      .trim();
  }

  recoverTimestamp(match, supplier) {
    // Fallback to current time with future prediction
    const now = Math.floor(Date.now() / 1000);
    return now + 3600; // 1 hour in future as default
  }

  recoverSport(match, supplier) {
    // Simple sport recovery based on common patterns
    if (match.match && match.match.toLowerCase().includes(' vs ')) {
      return 'Football'; // Most common case
    }
    return 'Other';
  }

  recoverMatchName(match, supplier) {
    // Try to extract from available data
    if (match.rawData) {
      if (match.rawData.name) return this.cleanMatchName(match.rawData.name);
      if (match.rawData.title) return this.cleanMatchName(match.rawData.title);
    }
    
    // Last resort
    return `Recovered Match from ${supplier}`;
  }

  calculateRecoveryConfidence(recoveries) {
    if (recoveries.length === 0) return 1.0;
    if (recoveries.length === 1) return 0.7;
    if (recoveries.length === 2) return 0.5;
    return 0.3; // Multiple recoveries = lower confidence
  }
}

// 5. Simplified Transformation Pipeline
class SimplifiedTransformationPipeline {
  constructor() {
    this.sportClassifier = new EnhancedSportClassifierNoTournament();
  }

  async processMatch(rawMatch, supplier) {
    // This is a simplified version - most logic is now in the main class
    const processed = { ...rawMatch };
    
    // Clean match name
    processed.match = this.cleanMatchName(processed.match);
    
    // Ensure sport classification
    if (!processed.sport || processed.sport === 'Unknown') {
      processed.sport = this.sportClassifier.classifySportFromMatch(processed.match, processed.sport);
    }
    
    return processed;
  }

  cleanMatchName(matchName) {
    if (!matchName) return matchName;
    return matchName
      .replace(/\s+/g, ' ')
      .replace(/\s+vs\.?\s+/gi, ' vs ')
      .trim();
  }
}

// Main UniversalStandardizer Class
class UniversalStandardizer {
  constructor() {
    this.normalizationMap = new NormalizationMap();
    this.results = {
      startTime: new Date().toISOString(),
      suppliers: {},
      fieldMappingReport: {}
    };
    this.allSuppliers = Object.keys(supplierConfig);
    this.fieldMapper = new EnhancedFieldMapperNoTournament();
    this.dataQualityScorer = new EnhancedDataQualityScoringNoTournament();
    this.sportClassifier = new EnhancedSportClassifierNoTournament();
    this.errorRecovery = new EnhancedErrorRecoveryNoTournament();
    this.transformationPipeline = new SimplifiedTransformationPipeline();
  }

  async standardizeAllData() {
    console.log('🚀 UNIVERSAL STANDARDIZER - PHASE 1 (NO TOURNAMENT)\n');
    
    try {
      // Step 1: Count raw data before processing
      const beforeCounts = this.countRawData();
      this.logBeforeProcessing(beforeCounts);

      // Step 2: Process each supplier
      const allMatches = [];

      for (const supplier of this.allSuppliers) {
        const supplierMatches = await this.processSupplier(supplier);
        allMatches.push(...supplierMatches);
      }

      // Step 3: Create final output
      const standardizedData = {
        phase: "1-universal-standardization-no-tournament",
        created_at: new Date().toISOString(),
        summary: {
          total_matches: allMatches.length,
          suppliers_processed: this.allSuppliers,
          supplier_breakdown: this.results.suppliers,
          before_processing: beforeCounts,
          after_processing: this.getAfterProcessingCounts(allMatches)
        },
        matches: allMatches
      };

      // Step 4: Calculate data loss
      standardizedData.summary.data_loss = this.calculateDataLoss(
        beforeCounts,
        standardizedData.summary.after_processing
      );

      // Step 5: Save and log results
      this.saveStandardizedData(standardizedData);
      this.logResults(standardizedData);

      return standardizedData;

    } catch (error) {
      console.error('💥 Universal standardizer failed:', error);
      throw error;
    }
  }

  countRawData() {
    const counts = {};
    this.allSuppliers.forEach(s => counts[s] = 0);

    for (const supplier of this.allSuppliers) {
      try {
        const config = supplierConfig[supplier];
        if (!config || !fs.existsSync(config.file)) {
          counts[supplier] = 'ERROR';
          continue;
        }

        const rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
        let rawMatches = [];

        if (supplier === 'tom' && rawData.events) {
          Object.values(rawData.events).forEach(dayMatches => {
            if (Array.isArray(dayMatches)) rawMatches.push(...dayMatches);
          });
        } else if ((supplier === 'sarah' || supplier === 'wendy') && rawData.matches) {
          rawMatches = rawData.matches;
        } else if (Array.isArray(rawData)) {
          rawMatches = rawData;
        }

        counts[supplier] = rawMatches.length;

      } catch (e) {
        counts[supplier] = 'ERROR';
        console.log(`❌ Error counting ${supplier} data:`, e.message);
      }
    }

    return counts;
  }

  async processSupplier(supplierName) {
    console.log(`\n🔧 PROCESSING ${supplierName.toUpperCase()}...`);
    
    const matches = [];

    try {
      const config = supplierConfig[supplierName];
      if (!config || !fs.existsSync(config.file)) {
        console.log(`❌ ${supplierName} config or file not found`);
        return matches;
      }

      const rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
      let rawMatches = [];

      // Extract matches array based on supplier structure
      if (supplierName === 'tom' && rawData.events) {
        Object.values(rawData.events).forEach(dayMatches => {
          if (Array.isArray(dayMatches)) rawMatches.push(...dayMatches);
        });
      } else if ((supplierName === 'sarah' || supplierName === 'wendy') && rawData.matches) {
        rawMatches = rawData.matches;
      } else if (Array.isArray(rawData)) {
        rawMatches = rawData;
      } else {
        console.log(`❌ Unknown data structure for ${supplierName}`);
        return matches;
      }

      console.log(`📦 Found ${rawMatches.length} raw matches`);

      // Process each match with universal normalization
      let processedCount = 0;

      for (const rawMatch of rawMatches) {
        try {
          // Store raw data for potential recovery
          const matchWithRawData = { ...rawMatch, rawData: rawMatch };
          
          // Apply the simplified field mapping
          const standardized = this.fieldMapper.standardizeMatch(matchWithRawData, supplierName);

          // Apply the data quality score
          standardized.quality_score = this.dataQualityScorer.calculateDataQualityScore(standardized);

          // Classify sport if needed
          standardized.sport = this.sportClassifier.classifySportFromMatch(standardized.match, standardized.sport);

          // Apply error recovery if needed
          const recoveryResult = this.errorRecovery.applyErrorRecovery(standardized, supplierName);
          const recoveredMatch = recoveryResult.match;
          
          // Add recovery metadata
          recoveredMatch.recovery_applied = recoveryResult.recoveries_applied;
          recoveredMatch.recovery_confidence = recoveryResult.recovery_confidence;

          // Remove rawData from final output
          delete recoveredMatch.rawData;

          // Add to matches
          matches.push(recoveredMatch);
          processedCount++;

          if (processedCount <= 3) {
            console.log(`   ✅ ${supplierName} match: "${recoveredMatch.match}"`);
            console.log(`      Sport: ${recoveredMatch.sport} | Quality: ${recoveredMatch.quality_score}/100`);
          }

        } catch (matchError) {
          console.log(`   ❌ Failed to process ${supplierName} match:`, matchError.message);
        }
      }

      this.results.suppliers[supplierName] = processedCount;
      console.log(`✅ ${supplierName}: ${processedCount}/${rawMatches.length} matches standardized`);

    } catch (error) {
      console.log(`❌ ${supplierName} processing failed:`, error.message);
    }

    return matches;
  }

  getAfterProcessingCounts(allMatches) {
    const after = {};
    this.allSuppliers.forEach(s => {
      after[s] = allMatches.filter(m => m.sources[s] && m.sources[s].length > 0).length;
    });
    after.total = allMatches.length;
    return after;
  }

  calculateDataLoss(before, after) {
    const loss = {};
    let totalRaw = 0;
    let totalAfter = 0;

    this.allSuppliers.forEach(s => {
      if (before[s] === 'ERROR' || after[s] === 'ERROR') {
        loss[s + '_loss'] = 'ERROR';
      } else {
        loss[s + '_loss'] = before[s] - after[s];
        totalRaw += before[s];
        totalAfter += after[s];
      }
    });

    loss.total_loss = totalRaw - totalAfter;
    return loss;
  }

  logBeforeProcessing(counts) {
    console.log('📊 RAW DATA COUNT (BEFORE PROCESSING):');
    console.log('══════════════════════════════════════');
    this.allSuppliers.forEach(s => console.log(`📦 ${this.capitalize(s)}: ${counts[s]} matches`));
    const total = this.allSuppliers.reduce((acc, s) => acc + (counts[s] === 'ERROR' ? 0 : counts[s]), 0);
    console.log(`📦 Total: ${total} matches`);
    console.log('══════════════════════════════════════\n');
  }

  logResults(data) {
    console.log('\n📊 UNIVERSAL STANDARDIZER RESULTS:');
    console.log('══════════════════════════════════════');
    console.log(`✅ Total Matches: ${data.summary.after_processing.total}`);
    this.allSuppliers.forEach(s => {
      console.log(`🔧 ${this.capitalize(s)}: ${data.summary.after_processing[s]} matches`);
    });

    console.log('\n📉 DATA LOSS REPORT:');
    this.allSuppliers.forEach(s => {
      console.log(`📦 ${this.capitalize(s)}: ${data.summary.data_loss[s + '_loss']}`);
    });
    console.log(`📦 Total: ${data.summary.data_loss.total_loss}`);
    console.log('══════════════════════════════════════\n');
    console.log('🎯 TOURNAMENT-FREE PROCESSING COMPLETE!');
    console.log('💾 Output: standardization-UNIVERSAL.json');
  }

  saveStandardizedData(data) {
    const outputPath = './standardization-UNIVERSAL.json';
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 Universal standardized data saved to: ${outputPath}`);
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Run if called directly
if (require.main === module) {
  const standardizer = new UniversalStandardizer();
  standardizer.standardizeAllData()
    .then(() => {
      console.log('🎉 UNIVERSAL STANDARDIZER COMPLETED!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Universal standardizer failed:', error);
      process.exit(1);
    });
}

module.exports = UniversalStandardizer;
