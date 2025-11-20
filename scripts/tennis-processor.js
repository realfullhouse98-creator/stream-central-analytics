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
      confidenceBreakdown: { high: 0, medium: 0, low: 0, veryLow: 0 }
    };
  }

  async processAllSuppliers() {
    console.log('🎾 STARTING TENNIS PROCESSOR...\n');
    
    try {
      // 1. Load all supplier data
      const allMatches = await this.loadAllSuppliers();
      console.log(`📥 Loaded ${allMatches.length} total matches from all suppliers`);
      
      // 2. Extract tennis matches only
      const tennisMatches = this.extractTennisMatches(allMatches);
      console.log(`🎾 Found ${tennisMatches.length} tennis matches`);
      
      // 3. Group by flexible time slots (45 minutes)
      const timeSlots = this.groupByTimeSlots(tennisMatches, 45);
      console.log(`⏰ Created ${Object.keys(timeSlots).length} time slots`);
      
      // 4. Process each time slot
      const processedMatches = this.processTimeSlots(timeSlots);
      
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
        if (match.sport?.toLowerCase().includes('tennis')) {
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
          date: this.msToDate(match.date),
          time: this.msToTime(match.date),
          teams: match.title,
          tournament: '', // Sarah doesn't have tournament
          channels: this.generateSarahStreams(match),
          raw: match,
          timestamp: match.date / 1000 // Convert to Unix
        });
      }
    });
    
    return matches;
  }

  extractTennisMatches(allMatches) {
    return allMatches.filter(match => 
      match.teams && this.isTennisMatch(match)
    );
  }

  isTennisMatch(match) {
    const searchString = (match.teams + ' ' + match.tournament).toLowerCase();
    return searchString.includes('tennis') || 
           / vs | - |\/|[A-Z]\./.test(match.teams);
  }

  groupByTimeSlots(matches, windowMinutes = 45) {
    const slots = {};
    
    matches.forEach(match => {
      const slotKey = this.getTimeSlotKey(match.date, match.time, windowMinutes);
      if (!slots[slotKey]) slots[slotKey] = [];
      slots[slotKey].push(match);
    });
    
    return slots;
  }

  getTimeSlotKey(date, time, windowMinutes) {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      const slot = Math.floor(totalMinutes / windowMinutes);
      return `${date}-${slot}`;
    } catch (error) {
      // Fallback for invalid times
      return `${date}-unknown`;
    }
  }

  processTimeSlots(timeSlots) {
    const processed = [];
    
    Object.values(timeSlots).forEach(slotMatches => {
      if (slotMatches.length === 1) {
        processed.push(this.processSingleMatch(slotMatches[0]));
        this.results.individual++;
      } else {
        const merged = this.mergeSlotMatches(slotMatches);
        processed.push(...merged);
      }
    });
    
    return processed;
  }

  mergeSlotMatches(slotMatches) {
    const clusters = this.findMatchClusters(slotMatches);
    const results = [];
    
    clusters.forEach(cluster => {
      if (cluster.length === 1) {
        results.push(this.processSingleMatch(cluster[0]));
        this.results.individual++;
      } else {
        const merged = this.mergeCluster(cluster);
        results.push(merged);
        this.results.merged++;
        
        // Track confidence
        const confidenceLevel = this.getConfidenceLevel(merged.confidence);
        this.results.confidenceBreakdown[confidenceLevel]++;
      }
    });
    
    return results;
  }

  findMatchClusters(matches) {
    const clusters = [];
    const processed = new Set();
    
    for (let i = 0; i < matches.length; i++) {
      if (processed.has(i)) continue;
      
      const cluster = [matches[i]];
      processed.add(i);
      
      for (let j = i + 1; j < matches.length; j++) {
        if (processed.has(j)) continue;
        
        const score = this.calculateMatchScore(matches[i], matches[j]);
        if (score >= 0.55) { // 55% threshold
          cluster.push(matches[j]);
          processed.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }

  calculateMatchScore(matchA, matchB) {
    if (matchA.source === matchB.source) return 0; // Don't merge same source
    
    const tokensA = this.tokenizeMatch(matchA);
    const tokensB = this.tokenizeMatch(matchB);
    
    const commonTokens = tokensA.filter(tokenA =>
      tokensB.some(tokenB => this.tokensMatch(tokenA, tokenB))
    );
    
    const maxTokens = Math.max(tokensA.length, tokensB.length);
    return maxTokens > 0 ? commonTokens.length / maxTokens : 0;
  }

  tokenizeMatch(match) {
    // Combine teams + tournament for better matching
    const searchString = match.teams + ' ' + match.tournament;
    return searchString
      .toLowerCase()
      .split(/[\.\-\/\s]+/)
      .filter(token => token.length > 1);
  }

  tokensMatch(tokenA, tokenB) {
    // Exact match or substring match
    return tokenA === tokenB || tokenA.includes(tokenB) || tokenB.includes(tokenA);
  }

  mergeCluster(cluster) {
    // Use Tom as base if available, otherwise first match
    const tomMatch = cluster.find(m => m.source === 'tom');
    const baseMatch = tomMatch || cluster[0];
    const otherMatches = cluster.filter(m => m !== baseMatch);
    
    // Calculate average confidence
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    otherMatches.forEach(other => {
      const score = this.calculateMatchScore(baseMatch, other);
      totalConfidence += score;
      confidenceCount++;
    });
    
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 1;
    
    // Merge channels from all matches
    const allChannels = [...baseMatch.channels];
    otherMatches.forEach(match => {
      match.channels.forEach(channel => {
        if (!allChannels.includes(channel)) {
          allChannels.push(channel);
        }
      });
    });
    
    // Get all sources
    const sources = [...new Set(cluster.map(m => m.source))];
    
    return {
      unix_timestamp: baseMatch.timestamp,
      sport: 'Tennis',
      tournament: baseMatch.tournament,
      match: baseMatch.teams.replace(' - ', ' vs '), // Standardize to "vs"
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
      match: match.teams.replace(' - ', ' vs '), // Standardize to "vs"
      channels: match.channels,
      sources: [match.source],
      confidence: 1.0,
      merged: false
    };
  }

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
      matches: processedMatches
    };
  }

  getConfidenceLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.65) return 'medium';
    if (score >= 0.55) return 'low';
    return 'veryLow';
  }

  // Utility methods
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

  logProcessingResults() {
    console.log('\n📊 PROCESSING RESULTS:');
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
    console.log('══════════════════════════════════════\n');
  }
}

// Main execution
if (require.main === module) {
  const processor = new TennisProcessor();
  
  processor.processAllSuppliers()
    .then(output => {
      // Ensure directories exist
      const dirs = ['./tennis-results', './suppliers'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });
      
      // Save results
      fs.writeFileSync(
        './tennis-results/tennis-results.json', 
        JSON.stringify(output, null, 2)
      );
      
      console.log('💾 Tennis results saved to ./tennis-results/tennis-results.json');
      
      // Update master-data.json if this is the main processor
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
      console.error('💥 Final error:', error);
      process.exit(1);
    });
}

module.exports = TennisProcessor;
