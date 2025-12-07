const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NormalizationMap = require('../modules/normalization-map.js'); // ✅ USING PROVEN CLASSIFIER
const supplierConfig = require('../suppliers/supplier-config.js');

// 1. Enhanced Field Mapping (No Tournament) - FIXED VERSION
class EnhancedFieldMapperNoTournament {
  constructor() {
    this.fieldMappings = {
      'tom': {
        'match': ['match', 'name', 'title', 'event_name'],
        'sport': ['sport', 'category', 'type'],
        'unix_timestamp': ['unix_timestamp', 'timestamp', 'start_time', 'time'],
        'streams': ['channels', 'streams', 'links']
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
    
    // Extract sport (will be reclassified using NormalizationMap)
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
        
        // ✅ Convert ALL dash formats to "vs" for consistency
        value = value.replace(/\s+-\s+/g, ' vs ');
        value = value.replace(/\s+-/g, ' vs ');
        value = value.replace(/-\s+/g, ' vs ');
        value = value.replace(/(\w[\w\s]*)-(\w[\w\s]*)/g, '$1 vs $2');
        value = value.replace(/vs\./gi, ' vs ');
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
          // SARAH SPECIAL HANDLING
          if (supplier === 'sarah') {
            const sources = rawMatch[field];
            return sources
              .filter(source => source && source.source && source.id)
              .map(source => `https://embedsports.top/embed/${source.source}/${source.id}/1`);
          }
          
          // WENDY SPECIAL HANDLING
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

// 2. Enhanced Data Quality Scoring (No Tournament) - KEEP THIS
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
      
      if (teams.length === 0) score -= 20;
      if (teams.length === 1) score -= 10;
      
      if (match.match.includes(' vs ')) score += 10;
      
      if (match.match.toLowerCase().includes('recovered match')) score -= 25;
      
      if (match.match.length < 5) score -= 15;
      if (match.match.length > 100) score -= 10;
    }
    
    // Sport classification quality
    if (match.sport && this.isCommonSport(match.sport)) score += 10;
    
    // Timestamp quality
    if (match.unix_timestamp) {
      const now = Date.now() / 1000;
      const isReasonable = match.unix_timestamp > (now - 31536000) &&
                          match.unix_timestamp < (now + 604800);
      if (!isReasonable) score -= 20;
    }
    
    // Stream quality
    const ownSourceStreams = match.sources[match.source] || [];
    if (ownSourceStreams.length === 0) {
      score -= 15;
    } else {
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

// 3. Enhanced Error Recovery (No Tournament) - KEEP THIS
class EnhancedErrorRecoveryNoTournament {
  applyErrorRecovery(match, supplier) {
    let recoveredMatch = { ...match };
    const recoveries = [];
    
    const needsRecovery = !recoveredMatch.match || 
                         recoveredMatch.match === 'Unknown Match' ||
                         recoveredMatch.match.toLowerCase().includes('recovered');
    
    if (needsRecovery) {
      recoveredMatch.match = this.recoverMatchName(recoveredMatch, supplier);
      recoveries.push('match_name_recovered');
    }
    
    if (!recoveredMatch.unix_timestamp) {
      recoveredMatch.unix_timestamp = this.recoverTimestamp(recoveredMatch, supplier);
      recoveries.push('timestamp_recovered');
    }
    
    if (!recoveredMatch.sport || recoveredMatch.sport === 'Unknown') {
      recoveredMatch.sport = this.recoverSport(recoveredMatch, supplier);
      recoveries.push('sport_reclassified');
    }
    
    recoveredMatch.match = this.cleanMatchName(recoveredMatch.match);
    
    return {
      match: recoveredMatch,
      recoveries_applied: recoveries,
      recovery_confidence: this.calculateRecoveryConfidence(recoveries)
    };
  }

  cleanMatchName(matchName) {
    if (!matchName) return matchName;
    
    let cleaned = matchName
      .replace(/\s+-\s+/g, ' vs ')
      .replace(/\s+-/g, ' vs ')
      .replace(/-\s+/g, ' vs ')
      .replace(/(\w[\w\s]*)-(\w[\w\s]*)/g, '$1 vs $2')
      .replace(/vs\./gi, ' vs ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Add "W" for women's Japan/Canada matches
    if ((cleaned.includes('Japan') && cleaned.includes('Canada')) ||
        (cleaned.includes('japan') && cleaned.includes('canada'))) {
      cleaned = cleaned
        .replace(/\b(Japan)(?![ W])/gi, '$1 W')
        .replace(/\b(Canada)(?![ W])/gi, '$1 W');
    }
    
    return cleaned;
  }

  recoverTimestamp(match, supplier) {
    const now = Math.floor(Date.now() / 1000);
    return now + 3600;
  }

  recoverSport(match, supplier) {
    if (match.match) {
      if (match.match.toLowerCase().includes('hockey')) return 'Ice Hockey';
      if (match.match.toLowerCase().includes('football') && !match.match.toLowerCase().includes('american')) return 'Football';
      if (match.match.toLowerCase().includes('basketball')) return 'Basketball';
      if (match.match.toLowerCase().includes('tennis')) return 'Tennis';
    }
    
    if (supplier === 'tom') return 'Basketball';
    if (supplier === 'sarah') return 'Football';
    if (supplier === 'wendy') return 'Ice Hockey';
    
    return 'Other';
  }

  recoverMatchName(match, supplier) {
    if (match.rawData) {
      if (match.rawData.match) return this.cleanMatchName(match.rawData.match);
      if (match.rawData.name) return this.cleanMatchName(match.rawData.name);
      if (match.rawData.title) return this.cleanMatchName(match.rawData.title);
      
      if (match.rawData.teams && match.rawData.teams.home && match.rawData.teams.away) {
        return `${match.rawData.teams.home.name || ''} vs ${match.rawData.teams.away.name || ''}`.trim();
      }
    }
    
    if (supplier === 'tom' && match.rawData) {
      if (match.rawData.match) return this.cleanMatchName(match.rawData.match);
    }
    
    if (match.sport && match.sport !== 'Unknown') {
      return `Unknown ${match.sport} Match`;
    }
    
    return `Match from ${supplier}`;
  }

  calculateRecoveryConfidence(recoveries) {
    if (recoveries.length === 0) return 1.0;
    if (recoveries.length === 1) return 0.7;
    if (recoveries.length === 2) return 0.5;
    return 0.3;
  }
}

// 4. Simplified Transformation Pipeline - UPDATED TO USE NORMALIZATIONMAP
class SimplifiedTransformationPipeline {
  constructor() {
    this.normalizationMap = new NormalizationMap(); // ✅ USING PROVEN CLASSIFIER
  }

  async processMatch(rawMatch, supplier) {
    const processed = { ...rawMatch };
    
    // Clean match name
    processed.match = this.cleanMatchName(processed.match);
    
    // ✅ CRITICAL FIX: Use NormalizationMap for sport classification
    // Create a mock match object for the normalizationMap
    const mockMatchForClassification = {
      match: processed.match,
      sport: processed.sport,
      category: processed.sport,
      tournament: '',
      teams: { home: { name: '' }, away: { name: '' } }
    };
    
    // Use NormalizationMap to classify sport
    processed.sport = this.normalizationMap.classifySport(mockMatchForClassification);
    
    // Fallback if still unknown
    if (!processed.sport || processed.sport === 'Unknown' || processed.sport === 'Other') {
      processed.sport = this.normalizationMap.normalizeSportName(processed.sport);
    }
    
    return processed;
  }

  cleanMatchName(matchName) {
    if (!matchName) return matchName;
    
    let cleaned = matchName
      .replace(/\s+-\s+/g, ' vs ')
      .replace(/\s+-/g, ' vs ')
      .replace(/-\s+/g, ' vs ')
      .replace(/(\w[\w\s]*)-(\w[\w\s]*)/g, '$1 vs $2')
      .replace(/vs\./gi, ' vs ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned.includes('Japan') || cleaned.includes('Canada')) {
      cleaned = cleaned.replace(/(Japan|Canada)(?![ W])/gi, '$1 W');
    }
    
    return cleaned;
  }
}

// Main UniversalStandardizer Class - FIXED VERSION
class UniversalStandardizer {
  constructor() {
    this.normalizationMap = new NormalizationMap(); // ✅ USING PROVEN CLASSIFIER
    this.results = {
      startTime: new Date().toISOString(),
      suppliers: {},
      fieldMappingReport: {}
    };
    this.allSuppliers = Object.keys(supplierConfig);
    this.fieldMapper = new EnhancedFieldMapperNoTournament();
    this.dataQualityScorer = new EnhancedDataQualityScoringNoTournament();
    this.errorRecovery = new EnhancedErrorRecoveryNoTournament();
    this.transformationPipeline = new SimplifiedTransformationPipeline();
    
    // Performance monitoring
    this.performanceData = {
      sportClassification: { success: 0, fallback: 0, unknown: 0 },
      processingTimes: []
    };
  }

  async standardizeAllData() {
    console.log('🚀 UNIVERSAL STANDARDIZER - PHASE 1 (FIXED VERSION)\n');
    console.log('✅ FIXED: Using NormalizationMap for sport classification\n');
    
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
        phase: "1-universal-standardization-fixed",
        created_at: new Date().toISOString(),
        summary: {
          total_matches: allMatches.length,
          suppliers_processed: this.allSuppliers,
          supplier_breakdown: this.results.suppliers,
          before_processing: beforeCounts,
          after_processing: this.getAfterProcessingCounts(allMatches),
          quality_stats: this.calculateQualityStats(allMatches),
          classification_stats: this.performanceData.sportClassification
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

      let processedCount = 0;
      let recoveredCount = 0;
      let classificationSuccess = 0;
      let classificationFallback = 0;
      let classificationUnknown = 0;

      for (const rawMatch of rawMatches) {
        try {
          // Store raw data for potential recovery
          const matchWithRawData = { ...rawMatch, rawData: rawMatch };
          
          // Apply field mapping
          const standardized = this.fieldMapper.standardizeMatch(matchWithRawData, supplierName);

          // Apply data quality score
          standardized.quality_score = this.dataQualityScorer.calculateDataQualityScore(standardized);

          // ✅ CRITICAL FIX: Use NormalizationMap for sport classification
          const classificationResult = this.classifySportWithNormalizationMap(standardized, rawMatch, supplierName);
          standardized.sport = classificationResult.sport;
          
          // Track classification stats
          if (classificationResult.method === 'normalizationMap') {
            classificationSuccess++;
          } else if (classificationResult.method === 'fallback') {
            classificationFallback++;
          } else {
            classificationUnknown++;
          }

          // Apply error recovery if needed
          const recoveryResult = this.errorRecovery.applyErrorRecovery(standardized, supplierName);
          const recoveredMatch = recoveryResult.match;
          
          if (recoveryResult.recoveries_applied.length > 0) {
            recoveredCount++;
          }
          
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
        classification: {
          success: classificationSuccess,
          fallback: classificationFallback,
          unknown: classificationUnknown
        }
      };
      
      // Update global stats
      this.performanceData.sportClassification.success += classificationSuccess;
      this.performanceData.sportClassification.fallback += classificationFallback;
      this.performanceData.sportClassification.unknown += classificationUnknown;
      
      console.log(`✅ ${supplierName}: ${processedCount}/${rawMatches.length} matches`);
      console.log(`   🏆 Classification: ${classificationSuccess} success, ${classificationFallback} fallback, ${classificationUnknown} unknown`);
      if (recoveredCount > 0) {
        console.log(`   ⚠️ ${recoveredCount} matches required recovery`);
      }

    } catch (error) {
      console.log(`❌ ${supplierName} processing failed:`, error.message);
    }

    return matches;
  }

  // ✅ NEW METHOD: Use NormalizationMap for sport classification
  classifySportWithNormalizationMap(standardizedMatch, rawMatch, supplierName) {
    try {
      // Create a proper match object for NormalizationMap
      const matchForClassification = {
        match: standardizedMatch.match,
        sport: standardizedMatch.sport,
        category: rawMatch.category || standardizedMatch.sport,
        tournament: rawMatch.tournament || '',
        teams: rawMatch.teams || { home: { name: '' }, away: { name: '' } }
      };
      
      // Try NormalizationMap first
      let sport = this.normalizationMap.classifySport(matchForClassification);
      
      // If NormalizationMap returns 'Other' or 'Unknown', try Sarah normalization
      if (sport === 'Other' || sport === 'Unknown') {
        if (supplierName === 'sarah' && rawMatch.category) {
          sport = this.normalizationMap.normalizeSarahSport(matchForClassification);
        }
      }
      
      // Final normalization
      sport = this.normalizationMap.normalizeSportName(sport);
      
      // Check if we got a valid sport
      if (sport && sport !== 'Other' && sport !== 'Unknown') {
        return { sport, method: 'normalizationMap' };
      }
      
      // Fallback: Use the transformation pipeline
      const processed = this.transformationPipeline.processMatch(standardizedMatch, supplierName);
      if (processed.sport && processed.sport !== 'Unknown') {
        return { sport: processed.sport, method: 'fallback' };
      }
      
      return { sport: 'Other', method: 'unknown' };
      
    } catch (error) {
      console.log(`   ⚠️ Sport classification failed: ${error.message}`);
      return { sport: 'Other', method: 'error' };
    }
  }

  calculateQualityStats(allMatches) {
    const stats = {
      total: allMatches.length,
      high_quality: 0,
      medium_quality: 0,
      low_quality: 0,
      average_score: 0,
      recovered_matches: 0,
      matches_with_sources: 0,
      sport_distribution: {}
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
      
      const hasStreams = Object.values(match.sources || {}).some(streams => streams.length > 0);
      if (hasStreams) stats.matches_with_sources++;
      
      // Track sport distribution
      if (match.sport) {
        stats.sport_distribution[match.sport] = (stats.sport_distribution[match.sport] || 0) + 1;
      }
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
    console.log('\n📊 UNIVERSAL STANDARDIZER RESULTS (FIXED VERSION):');
    console.log('══════════════════════════════════════');
    console.log(`✅ Total Matches: ${data.summary.after_processing.total}`);
    console.log(`📈 Quality: ${data.summary.quality_stats.average_score}/100 average`);
    console.log(`   🟢 High: ${data.summary.quality_stats.high_quality} | 🟡 Medium: ${data.summary.quality_stats.medium_quality} | 🔴 Low: ${data.summary.quality_stats.low_quality}`);
    console.log(`   📺 ${data.summary.quality_stats.matches_with_sources} matches have streams`);
    
    console.log('\n🏆 SPORT DISTRIBUTION:');
    Object.entries(data.summary.quality_stats.sport_distribution || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([sport, count]) => {
        console.log(`   ${sport}: ${count} matches`);
      });
    
    console.log('\n🔬 CLASSIFICATION STATS:');
    console.log(`   ✅ NormalizationMap: ${data.summary.classification_stats.success}`);
    console.log(`   🔄 Fallback: ${data.summary.classification_stats.fallback}`);
    console.log(`   ❓ Unknown: ${data.summary.classification_stats.unknown}`);
    
    this.allSuppliers.forEach(s => {
      const stats = data.summary.supplier_breakdown[s];
      if (stats) {
        console.log(`\n🔧 ${this.capitalize(s)}: ${stats.total} matches`);
        console.log(`   Classification: ${stats.classification.success}✓ ${stats.classification.fallback}↻ ${stats.classification.unknown}?`);
        if (stats.recovered > 0) {
          console.log(`   ⚠️ ${stats.recovered} recovered (${stats.recovery_rate})`);
        }
      }
    });

    console.log('\n📉 DATA LOSS REPORT:');
    this.allSuppliers.forEach(s => {
      console.log(`📦 ${this.capitalize(s)}: ${data.summary.data_loss[s + '_loss']}`);
    });
    console.log(`📦 Total: ${data.summary.data_loss.total_loss}`);
    console.log('══════════════════════════════════════\n');
    
    console.log('🎯 FIXED SPORT CLASSIFICATION COMPLETE!');
    console.log('💾 Output: standardization-UNIVERSAL.json');
    console.log('✅ Using NormalizationMap for reliable sport classification');
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
  
  standardizer.standardizeAllData()
    .then(() => {
      console.log('\n🎉 UNIVERSAL STANDARDIZER (FIXED) COMPLETED!');
      console.log('✅ Sport classification now uses NormalizationMap');
      console.log('✅ Phase 1 output ready for Phase 2 processing');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fixed universal standardizer failed:', error);
      process.exit(1);
    });
}

module.exports = {
  UniversalStandardizer,
  EnhancedFieldMapperNoTournament,
  EnhancedDataQualityScoringNoTournament,
  EnhancedErrorRecoveryNoTournament,
  SimplifiedTransformationPipeline
};
