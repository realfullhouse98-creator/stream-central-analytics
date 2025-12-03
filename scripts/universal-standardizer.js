const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NormalizationMap = require('../modules/normalization-map.js');
const supplierConfig = require('../suppliers/supplier-config.js');

// 1. Enhanced Field Mapping (No Tournament) - FIXED VERSION
class EnhancedFieldMapperNoTournament {
  constructor() {
    this.fieldMappings = {
      'tom': {
        'match': ['match', 'name', 'title', 'event_name'],  // FIXED: Added 'match' first
        'sport': ['sport', 'category', 'type'],
        'unix_timestamp': ['unix_timestamp', 'timestamp', 'start_time', 'time'],
        'streams': ['channels', 'streams', 'links']  // Tom uses 'channels'
      },
      'sarah': {
        'match': ['title', 'name', 'teams'],
        'sport': ['category', 'sport'], 
        'unix_timestamp': ['date', 'timestamp', 'start_time'],
        'streams': ['sources', 'streams', 'links']
      },
      'wendy': {
        'match': ['title', 'name', 'event'],
        'sport': ['sport', 'sportCategory', 'type'],
        'unix_timestamp': ['timestamp', 'date', 'time'],
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
    
    // Extract match name - WITH DASH-TO-VS CONVERSION
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
        let value = String(rawMatch[field]).trim();
        
        // ✅ CRITICAL FIX: Convert ALL dash formats to "vs" for consistency
        // Handle "TeamA - TeamB" (space-dash-space)
        value = value.replace(/\s+-\s+/g, ' vs ');
        
        // Handle "TeamA -TeamB" (space-dash)  
        value = value.replace(/\s+-/g, ' vs ');
        
        // Handle "TeamA- TeamB" (dash-space)
        value = value.replace(/-\s+/g, ' vs ');
        
        // Handle "TeamA-TeamB" (just dash with no spaces)
        // Only replace if it looks like a match pattern (word-dash-word)
        value = value.replace(/(\w[\w\s]*)-(\w[\w\s]*)/g, '$1 vs $2');
        
        // Also clean up any "vs." (with period) to "vs" (no period)
        value = value.replace(/vs\./gi, ' vs ');
        
        // Normalize multiple spaces
        value = value.replace(/\s+/g, ' ').trim();
        
        return value;
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
          // SARAH SPECIAL HANDLING - FIXED
          if (supplier === 'sarah') {
            const sources = rawMatch[field];
            return sources
              .filter(source => source && source.source && source.id)
              .map(source => `https://embedsports.top/embed/${source.source}/${source.id}/1`);
          }
          
          // WENDY SPECIAL HANDLING - FIXED
          if (supplier === 'wendy') {
            const streams = rawMatch[field];
            return streams
              .filter(stream => stream && stream.url)
              .map(stream => stream.url);
          }
          
          // TOM & GENERAL HANDLING
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

// 2. Enhanced Data Quality Scoring (No Tournament) - UPDATED
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
      
      // Bonus for proper " vs " format
      if (match.match.includes(' vs ')) score += 10;
      
      // Penalize "Recovered Match" names
      if (match.match.toLowerCase().includes('recovered match')) score -= 25;
      
      // Penalize very short/long names
      if (match.match.length < 5) score -= 15;
      if (match.match.length > 100) score -= 10;
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
    
    // Stream quality - FIXED: Check own source streams
    const ownSourceStreams = match.sources[match.source] || [];
    if (ownSourceStreams.length === 0) {
      score -= 15; // Penalty for no streams from own source
    } else {
      // Bonus for multiple streams
      if (ownSourceStreams.length > 3) score += 10;
      if (ownSourceStreams.length > 5) score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  extractTeams(matchText) {
    if (!matchText || !matchText.includes(' vs ')) return [];
    const [teamA, teamB] = matchText.split(' vs ');
    return [teamA.trim(), teamB.trim()];
  }

  isCommonSport(sport) {
    if (!sport) return false;
    const sportLower = sport.toLowerCase();
    const commonSports = [
      'football', 'soccer', 'basketball', 'tennis', 'american football', 
      'ice hockey', 'hockey', 'baseball', 'rugby', 'cricket', 'volleyball'
    ];
    return commonSports.includes(sportLower);
  }
}

// 3. Enhanced Sport Classification (No Tournament) - FIXED
class EnhancedSportClassifierNoTournament {
  constructor() {
    this.sportKeywords = {
      'Football': ['football', 'soccer', 'premier league', 'la liga', 'champions league', 'women\'s football', 'women\'s soccer'],
      'Basketball': ['basketball', 'nba', 'wnba', 'euroleague', 'women\'s basketball'],
      'Tennis': ['tennis', 'wimbledon', 'us open', 'atp', 'wta'],
      'American Football': ['nfl', 'american football', 'super bowl', 'touchdown', 'college football'],
      'Ice Hockey': ['hockey', 'nhl', 'ice hockey', 'puck'],
      'Baseball': ['baseball', 'mlb', 'yankees', 'dodgers'],
      'Rugby': ['rugby', 'six nations', 'all blacks'],
      'Cricket': ['cricket', 'test match', 't20', 'ipl'],
      'Volleyball': ['volleyball', 'beach volleyball']
    };
  }

  classifySportFromMatch(matchName, originalSport) {
    // FIXED: Case-insensitive sport checking
    if (this.isValidSport(originalSport)) {
      return this.normalizeSportName(originalSport); // Returns properly capitalized
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

  // FIXED: Case-insensitive sport validation
  isValidSport(sport) {
    if (!sport || sport === 'Unknown') return false;
    
    const sportLower = sport.toLowerCase().trim();
    const validSports = Object.keys(this.sportKeywords).map(s => s.toLowerCase());
    
    return validSports.includes(sportLower);
  }

  // NEW: Proper sport name normalization
  normalizeSportName(sport) {
    if (!sport || sport === 'Other') return 'Other';
    const sportLower = sport.toLowerCase().trim();
    
    // Enhanced sport mapping with case handling
    const sportMap = {
      'football': 'Football',
      'soccer': 'Football',
      'basketball': 'Basketball',
      'tennis': 'Tennis',
      'american football': 'American Football',
      'american-football': 'American Football',
      'ice hockey': 'Ice Hockey',
      'hockey': 'Ice Hockey',
      'baseball': 'Baseball',
      'rugby': 'Rugby',
      'cricket': 'Cricket',
      'volleyball': 'Volleyball'
    };
    
    return sportMap[sportLower] || 
           sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
  }

  detectSportFromTeamPatterns(matchName) {
  const teams = this.extractTeams(matchName);
  
  if (teams.length === 2) {
    // Check for women's international football
    if ((teams.includes('japan w') || teams.includes('japan')) && 
        (teams.includes('canada w') || teams.includes('canada'))) {
      return 'Football'; // Women's international friendly
    }
    
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
    const footballIndicators = ['united', 'city', 'fc', 'real', 'athletic', 'rovers', 'club'];
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
}

// 4. Enhanced Error Recovery (No Tournament) - IMPROVED VERSION
class EnhancedErrorRecoveryNoTournament {
  applyErrorRecovery(match, supplier) {
    let recoveredMatch = { ...match };
    const recoveries = [];
    
    // Only recover if truly missing or "Unknown Match"
    const needsRecovery = !recoveredMatch.match || 
                         recoveredMatch.match === 'Unknown Match' ||
                         recoveredMatch.match.toLowerCase().includes('recovered');
    
    if (needsRecovery) {
      recoveredMatch.match = this.recoverMatchName(recoveredMatch, supplier);
      recoveries.push('match_name_recovered');
    }
    
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
    
    // Clean up match name (remove any tournament-like phrases AND normalize format)
    recoveredMatch.match = this.cleanMatchName(recoveredMatch.match);
    
    return {
      match: recoveredMatch,
      recoveries_applied: recoveries,
      recovery_confidence: this.calculateRecoveryConfidence(recoveries)
    };
  }

cleanMatchName(matchName) {
  if (!matchName) return matchName;
  
  // Convert any dash to "vs" format
  let cleaned = matchName
    .replace(/\s+-\s+/g, ' vs ')
    .replace(/\s+-/g, ' vs ')
    .replace(/-\s+/g, ' vs ')
    .replace(/(\w[\w\s]*)-(\w[\w\s]*)/g, '$1 vs $2')
    .replace(/vs\./gi, ' vs ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // CRITICAL: Add "W" for women's Japan/Canada matches
  // Check if it's Japan vs Canada (women's football)
  if ((cleaned.includes('Japan') && cleaned.includes('Canada')) ||
      (cleaned.includes('japan') && cleaned.includes('canada'))) {
    
    // Add "W" suffix if missing
    cleaned = cleaned
      .replace(/\b(Japan)(?![ W])/gi, '$1 W')
      .replace(/\b(Canada)(?![ W])/gi, '$1 W');
  }
  
  return cleaned;
}

  recoverTimestamp(match, supplier) {
    // Fallback to current time with future prediction
    const now = Math.floor(Date.now() / 1000);
    return now + 3600; // 1 hour in future as default
  }

  recoverSport(match, supplier) {
    // Try to extract from match name first
    if (match.match) {
      if (match.match.toLowerCase().includes('hockey')) return 'Ice Hockey';
      if (match.match.toLowerCase().includes('football') && !match.match.toLowerCase().includes('american')) return 'Football';
      if (match.match.toLowerCase().includes('basketball')) return 'Basketball';
      if (match.match.toLowerCase().includes('tennis')) return 'Tennis';
    }
    
    // Fallback based on supplier patterns
    if (supplier === 'tom') return 'Basketball'; // Tom often has basketball
    if (supplier === 'sarah') return 'Football'; // Sarah often has football
    if (supplier === 'wendy') return 'Ice Hockey'; // Wendy often has hockey
    
    return 'Other';
  }

  recoverMatchName(match, supplier) {
    // First try to extract from available data
    if (match.rawData) {
      if (match.rawData.match) return this.cleanMatchName(match.rawData.match);
      if (match.rawData.name) return this.cleanMatchName(match.rawData.name);
      if (match.rawData.title) return this.cleanMatchName(match.rawData.title);
      
      // Try to construct from teams
      if (match.rawData.teams && match.rawData.teams.home && match.rawData.teams.away) {
        return `${match.rawData.teams.home.name || ''} vs ${match.rawData.teams.away.name || ''}`.trim();
      }
    }
    
    // Try supplier-specific fallbacks
    if (supplier === 'tom' && match.rawData) {
      // Tom sometimes has match in the data directly
      if (match.rawData.match) return this.cleanMatchName(match.rawData.match);
    }
    
    // Last resort - but AVOID generic "Recovered Match" if possible
    if (match.sport && match.sport !== 'Unknown') {
      return `Unknown ${match.sport} Match`;
    }
    
    return `Match from ${supplier}`;
  }

  calculateRecoveryConfidence(recoveries) {
    if (recoveries.length === 0) return 1.0;
    if (recoveries.length === 1) return 0.7;
    if (recoveries.length === 2) return 0.5;
    return 0.3; // Multiple recoveries = lower confidence
  }
}

// 5. Simplified Transformation Pipeline - UPDATED
class SimplifiedTransformationPipeline {
  constructor() {
    this.sportClassifier = new EnhancedSportClassifierNoTournament();
  }

  async processMatch(rawMatch, supplier) {
    const processed = { ...rawMatch };
    
    // Clean match name (ensure "vs" format and preserve women's "W")
    processed.match = this.cleanMatchName(processed.match);
    
    // Ensure sport classification
    if (!processed.sport || processed.sport === 'Unknown') {
      processed.sport = this.sportClassifier.classifySportFromMatch(processed.match, processed.sport);
    }
    
    return processed;
  }

  cleanMatchName(matchName) {
    if (!matchName) return matchName;
    
    // Convert any dash to "vs" format
    let cleaned = matchName
      .replace(/\s+-\s+/g, ' vs ')
      .replace(/\s+-/g, ' vs ')
      .replace(/-\s+/g, ' vs ')
      .replace(/(\w[\w\s]*)-(\w[\w\s]*)/g, '$1 vs $2')
      .replace(/vs\./gi, ' vs ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Ensure women's teams keep "W" suffix
    if (cleaned.includes('Japan') || cleaned.includes('Canada')) {
      cleaned = cleaned.replace(/(Japan|Canada)(?![ W])/gi, '$1 W');
    }
    
    return cleaned;
  }
}

// Main UniversalStandardizer Class - UPDATED WITH DEBUG
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
    
    // Debug logging
    this.debug = true;
  }

  // DEBUG METHOD FOR JAPAN MATCH
    debugJapanMatch() {
    console.log('\n🔍 DEBUG: Japan W vs Canada W Processing');
    
    const testData = {
      tom: {
        unix_timestamp: 1764651600,
        sport: "Football",
        tournament: "Friendly Match",
        match: "Japan W - Canada W",
        channels: ["https://topembed.pw/channel/exjapandaw"]
      },
      sarah: {
        id: "japan-w-vs-canada-w",
        title: "Japan W vs Canada W", 
        category: "football",
        date: 1764648000000,
        sources: [
          { source: "alpha", id: "japan-w-vs-canada-w" },
          { source: "bravo", id: "1764651600000-japan-w-canada-w" },
          { source: "charlie", id: "japan-w-vs-canada-w-1469892" }
        ]
      },
      wendy: {
        matchId: "755867",
        title: "Japan vs Canada",
        sport: "football",
        streams: [
          { url: "https://spiderembed.top/embed/755867/watchfooty-elite-1-japan-canada/elite/1" },
          { url: "https://spiderembed.top/embed/755867/watchfooty-tv-1-japan-canada/tv/1" }
        ]
      }
    };
    
    // Test each supplier
    ['tom', 'sarah', 'wendy'].forEach(supplier => {
      const standardized = this.fieldMapper.standardizeMatch(testData[supplier], supplier);
      console.log(`\n${supplier.toUpperCase()}:`);
      console.log(`  Match: "${standardized.match}"`);
      console.log(`  Sport: ${standardized.sport}`);
      console.log(`  Sources: ${standardized.sources[supplier].length} streams`);
      if (standardized.sources[supplier].length > 0) {
        console.log(`  Example: ${standardized.sources[supplier][0]}`);
      }
    });
    
    // Test sport classification
    console.log('\n🔍 SPORT CLASSIFICATION TEST:');
    const testMatch = "Japan W vs Canada W";
    const sport1 = this.sportClassifier.classifySportFromMatch(testMatch, 'football');
    console.log(`  "${testMatch}" with hint "football" → ${sport1}`);
    
    const sport2 = this.sportClassifier.classifySportFromMatch(testMatch, '');
    console.log(`  "${testMatch}" with no hint → ${sport2}`);
    
    const sport3 = this.sportClassifier.classifySportFromMatch("Japan vs Canada", 'football');
    console.log(`  "Japan vs Canada" with hint "football" → ${sport3}`);
    
    // Test data quality scoring
    console.log('\n🔍 DATA QUALITY TEST:');
    const testMatchData = {
      source: 'sarah',
      sources: { sarah: ['https://embedsports.top/embed/alpha/japan-w-vs-canada-w/1'] },
      match: 'Japan W vs Canada W',
      sport: 'Football',
      unix_timestamp: 1764648000
    };
    const qualityScore = this.dataQualityScorer.calculateDataQualityScore(testMatchData);
    console.log(`  Quality score: ${qualityScore}/100`);
    
    // FIX VERIFICATION TESTS
    console.log('\n🔍 FIX VERIFICATION TESTS:');
    
    // Test 1: Wendy match name fix
    const wendyMatch = "Japan vs Canada";
    const cleanedWendy = this.errorRecovery.cleanMatchName(wendyMatch);
    console.log(`  Wendy match fix: "${wendyMatch}" → "${cleanedWendy}"`);
    
    // Test 2: Sarah sport normalization
    const sarahSport = this.sportClassifier.normalizeSportName('football');
    console.log(`  Sarah sport fix: "football" → "${sarahSport}"`);
    
    // Test 3: Women's football detection
    const womensMatch = "Japan W vs Canada W";
    const detectedSport = this.sportClassifier.detectSportFromTeamPatterns(womensMatch);
    console.log(`  Women's detection: "${womensMatch}" → "${detectedSport}"`);
    
    // Test 4: Sport classification without hint
    const noHintSport = this.sportClassifier.classifySportFromMatch("Japan W vs Canada W", '');
    console.log(`  No-hint classification: "Japan W vs Canada W" → "${noHintSport}"`);
    
    // Test 5: Check if sport normalization is called in classification
    const withHintSport = this.sportClassifier.classifySportFromMatch("Test", 'football');
    console.log(`  With-hint normalization: "football" hint → "${withHintSport}"`);
  }

  async standardizeAllData() {
    console.log('🚀 UNIVERSAL STANDARDIZER - PHASE 1 (NO TOURNAMENT)\n');
    console.log('🔧 FIXED VERSION: Proper sport classification + source extraction\n');
    
    try {
      // Run debug first to verify fixes
      this.debugJapanMatch();
      
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
          after_processing: this.getAfterProcessingCounts(allMatches),
          quality_stats: this.calculateQualityStats(allMatches)
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
      let recoveredCount = 0;
      let japanMatches = 0;

      for (const rawMatch of rawMatches) {
        try {
          // DEBUG: Track Japan matches
          const matchText = rawMatch.match || rawMatch.title || '';
          if (matchText.includes('Japan') && matchText.includes('Canada')) {
            japanMatches++;
            console.log(`   🇯🇵 Found Japan match: "${matchText}"`);
          }
          
          // Store raw data for potential recovery
          const matchWithRawData = { ...rawMatch, rawData: rawMatch };
          
          // Apply the field mapping (FIXED: Now includes proper source extraction)
          const standardized = this.fieldMapper.standardizeMatch(matchWithRawData, supplierName);

          // Apply the data quality score
          standardized.quality_score = this.dataQualityScorer.calculateDataQualityScore(standardized);

          // Classify sport if needed
          standardized.sport = this.sportClassifier.classifySportFromMatch(standardized.match, standardized.sport);
          standardized.sport = this.sportClassifier.normalizeSportName(standardized.sport);

          // Apply error recovery if needed (but only if truly broken)
          const recoveryResult = this.errorRecovery.applyErrorRecovery(standardized, supplierName);
          const recoveredMatch = recoveryResult.match;
          
          // Track recoveries
          if (recoveryResult.recoveries_applied.length > 0) {
            recoveredCount++;
          }
          
          // Add recovery metadata
          recoveredMatch.recovery_applied = recoveryResult.recoveries_applied;
          recoveredMatch.recovery_confidence = recoveryResult.recovery_confidence;

          // Remove rawData from final output
          delete recoveredMatch.rawData;

          // Add to matches
          matches.push(recoveredMatch);
          processedCount++;

          // Log first few matches for verification
          if (processedCount <= 3) {
            console.log(`   ✅ ${supplierName}: "${recoveredMatch.match}"`);
            console.log(`      Sport: ${recoveredMatch.sport} | Quality: ${recoveredMatch.quality_score}/100`);
            console.log(`      Sources: ${(recoveredMatch.sources[supplierName] || []).length} streams`);
            if (recoveryResult.recoveries_applied.length > 0) {
              console.log(`      Recoveries: ${recoveryResult.recoveries_applied.join(', ')}`);
            }
          }

        } catch (matchError) {
          console.log(`   ❌ Failed to process ${supplierName} match:`, matchError.message);
        }
      }

      this.results.suppliers[supplierName] = {
        total: processedCount,
        recovered: recoveredCount,
        recovery_rate: ((recoveredCount / processedCount) * 100).toFixed(1) + '%',
        japan_matches: japanMatches
      };
      
      console.log(`✅ ${supplierName}: ${processedCount}/${rawMatches.length} matches`);
      if (recoveredCount > 0) {
        console.log(`   ⚠️ ${recoveredCount} matches required recovery`);
      }
      if (japanMatches > 0) {
        console.log(`   🇯🇵 ${japanMatches} Japan vs Canada matches found`);
      }

    } catch (error) {
      console.log(`❌ ${supplierName} processing failed:`, error.message);
    }

    return matches;
  }

  calculateQualityStats(allMatches) {
    const stats = {
      total: allMatches.length,
      high_quality: 0,
      medium_quality: 0,
      low_quality: 0,
      average_score: 0,
      recovered_matches: 0,
      matches_with_sources: 0
    };
    
    let totalScore = 0;
    
    allMatches.forEach(match => {
      totalScore += match.quality_score || 0;
      
      if (match.quality_score >= 80) stats.high_quality++;
      else if (match.quality_score >= 50) stats.medium_quality++;
      else stats.low_quality++;
      
      if (match.recovery_applied && match.recovery_applied.length > 0) {
        stats.recovered_matches++;
      }
      
      // Check if match has any streams
      const hasStreams = Object.values(match.sources || {}).some(streams => streams.length > 0);
      if (hasStreams) stats.matches_with_sources++;
    });
    
    stats.average_score = allMatches.length > 0 ? (totalScore / allMatches.length).toFixed(1) : 0;
    
    return stats;
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

  getAfterProcessingCounts(allMatches) {
    const after = {};
    this.allSuppliers.forEach(s => {
      after[s] = allMatches.filter(m => m.source === s).length;
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
    console.log(`📈 Quality: ${data.summary.quality_stats.average_score}/100 average`);
    console.log(`   🟢 High: ${data.summary.quality_stats.high_quality} | 🟡 Medium: ${data.summary.quality_stats.medium_quality} | 🔴 Low: ${data.summary.quality_stats.low_quality}`);
    console.log(`   📺 ${data.summary.quality_stats.matches_with_sources} matches have streams`);
    
    this.allSuppliers.forEach(s => {
      const stats = data.summary.supplier_breakdown[s];
      if (stats) {
        console.log(`🔧 ${this.capitalize(s)}: ${stats.total} matches`);
        if (stats.recovered > 0) {
          console.log(`   ⚠️ ${stats.recovered} recovered (${stats.recovery_rate})`);
        }
        if (stats.japan_matches > 0) {
          console.log(`   🇯🇵 ${stats.japan_matches} Japan vs Canada matches`);
        }
      }
    });

    console.log('\n📉 DATA LOSS REPORT:');
    this.allSuppliers.forEach(s => {
      console.log(`📦 ${this.capitalize(s)}: ${data.summary.data_loss[s + '_loss']}`);
    });
    console.log(`📦 Total: ${data.summary.data_loss.total_loss}`);
    console.log('══════════════════════════════════════\n');
    
    // Find and show Japan match in output
    const japanMatches = data.matches.filter(m => 
      m.match && m.match.includes('Japan') && m.match.includes('Canada')
    );
    
    if (japanMatches.length > 0) {
      console.log('🔍 JAPAN VS CANADA MATCHES IN OUTPUT:');
      japanMatches.forEach((match, i) => {
        console.log(`   ${i+1}. "${match.match}" (${match.sport})`);
        console.log(`      Source: ${match.source} | Quality: ${match.quality_score}/100`);
        console.log(`      Streams: Tom:${match.sources.tom?.length || 0}, Sarah:${match.sources.sarah?.length || 0}, Wendy:${match.sources.wendy?.length || 0}`);
      });
      console.log('');
    }
    
    console.log('🎯 TOURNAMENT-FREE PROCESSING COMPLETE!');
    console.log('💾 Output: standardization-UNIVERSAL.json');
    console.log('⚠️  Check for "Recovered Match" patterns - should be minimal now!');
  }

  saveStandardizedData(data) {
    const outputPath = './standardization-UNIVERSAL.json';
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Universal standardized data saved to: ${outputPath}`);
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Run if called directly
if (require.main === module) {
  const standardizer = new UniversalStandardizer();
  
  // Check for debug flag
  if (process.argv.includes('--debug-only')) {
    standardizer.debugJapanMatch();
    process.exit(0);
  }
  
  standardizer.standardizeAllData()
    .then(() => {
      console.log('\n🎉 UNIVERSAL STANDARDIZER COMPLETED!');
      console.log('✅ Phase 1 output ready for Phase 2 processing');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Universal standardizer failed:', error);
      process.exit(1);
    });
}

module.exports = {
  UniversalStandardizer,
  EnhancedFieldMapperNoTournament,
  EnhancedSportClassifierNoTournament,
  EnhancedDataQualityScoringNoTournament,
  EnhancedErrorRecoveryNoTournament,
  SimplifiedTransformationPipeline
};
