// Update Suppliers

const fs = require('fs');

// Circuit Breaker for supplier resilience
class SupplierCircuitBreaker {
    constructor(supplierName, failureThreshold = 5, resetTimeout = 60000) {
        this.supplierName = supplierName;
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
        this.failures = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.lastFailureTime = null;
    }

    canExecute() {
        if (this.state === 'OPEN') {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                return true;
            }
            return false;
        }
        return true;
    }

    recordSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
        this.lastFailureTime = null;
    }

    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            console.log(`   🔌 Circuit breaker OPEN for ${this.supplierName}`);
        }
    }
}

// Initialize circuit breakers
// Initialize circuit breakers
const circuitBreakers = {
    tom: new SupplierCircuitBreaker('tom'),
    sarah: new SupplierCircuitBreaker('sarah'),
    wendy: new SupplierCircuitBreaker('wendy') // ← NEW LINE
};

async function fetchWithTimeout(url, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 
                'User-Agent': '9kilos-research/1.0',
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Data validation
function validateSupplierData(data, supplier) {
    if (!data) {
        throw new Error('No data received from supplier');
    }
    
    if (supplier === 'tom') {
        if (!data.events && !data.matches) {
            throw new Error('Invalid Tom API format - missing events/matches');
        }
    } else if (supplier === 'sarah') {
        if (!Array.isArray(data)) {
            throw new Error('Invalid Sarah API format - expected array');
        }
    }
    
    return true;
}

// Backup current data
function backupSupplierData(supplierName) {
    const filePath = `./suppliers/${supplierName}-data.json`;
    const backupPath = `./suppliers/backups/${supplierName}-data-${Date.now()}.json`;
    
    if (fs.existsSync(filePath)) {
        // Ensure backups directory exists
        if (!fs.existsSync('./suppliers/backups')) {
            fs.mkdirSync('./suppliers/backups', { recursive: true });
        }
        
        fs.copyFileSync(filePath, backupPath);
        console.log(`   💾 Backup created: ${backupPath}`);
    }
}

// Progress indicator
function createProgressIndicator(total, message) {
    let processed = 0;
    return {
        increment: () => {
            processed++;
            if (processed % 50 === 0 || processed === total) {
                const percent = Math.round((processed / total) * 100);
                console.log(`   ${message}: ${processed}/${total} (${percent}%)`);
            }
        },
        getCurrent: () => processed
    };
}

async function updateAllSuppliers() {
    console.log('🚀 Starting combined supplier update...');
    console.log('⏰', new Date().toISOString(), '\n');
    
    const suppliers = [
        {
            name: 'tom',
            urls: [
                'https://corsproxy.io/?https://topembed.pw/api.php?format=json',
                'https://api.allorigins.win/raw?url=https://topembed.pw/api.php?format=json',
                'https://topembed.pw/api.php?format=json'
            ],
            processor: (data) => {
                const events = data.events || {};
                const matchCount = data.events ? Object.values(data.events).flat().length : 0;
                
                return {
                    events: events,
                    _metadata: {
                        supplier: 'tom',
                        lastUpdated: new Date().toISOString(),
                        matchCount: matchCount,
                        days: data.events ? Object.keys(data.events).length : 0,
                        dataHash: require('crypto').createHash('md5').update(JSON.stringify(events)).digest('hex')
                    }
                };
            }
        },
        {
            name: 'sarah', 
            urls: [
                'https://corsproxy.io/?https://streamed.pk/api/matches/all',
                'https://api.allorigins.win/raw?url=https://streamed.pk/api/matches/all', 
                'https://streamed.pk/api/matches/all'
            ],
            processor: (data) => {
                const matches = Array.isArray(data) ? data : [];
                const liveMatches = matches.filter(m => m.status === 'live').length;
                
                return {
                    matches: matches,
                    _metadata: {
                        supplier: 'sarah',
                        lastUpdated: new Date().toISOString(), 
                        matchCount: matches.length,
                        liveMatches: liveMatches,
                        dataHash: require('crypto').createHash('md5').update(JSON.stringify(matches)).digest('hex')
                    }
                };
            }
        },
        // In update-suppliers.js - Add to suppliers array:
{
  name: 'wendy',  // ---------------WENDY HAS 14-SPORTS GENRE ADD MORE--------------
  urls: [
      'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/all'
  //  'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/tennis',
  //   'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/football', 
 //    'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/hockey',
//     'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/baseball',
 //    'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/fighting',
//     'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/golf',
//     'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/american-football',
  //   'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/darts',
 //    'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/rugby',
 //    'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/volleyball',
  //   'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/racing',
 //    'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/australian-football',
 //    'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/basketball',
 //    'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/wendy/cricket'
  ],
  processor: (data) => {
    const matches = Array.isArray(data) ? data : [];
    const matchesWithStreams = matches.filter(m => m.streams && m.streams.length > 0).length;
    
    console.log(`🔍 WENDY ALL SPORTS: ${matches.length} total matches, ${matchesWithStreams} with streams`);
    
    // Count by sport for debugging
    const sportCounts = {};
    matches.forEach(match => {
      const sport = match.sportCategory || match.sport || match.wendySport || 'unknown';
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });
    
    console.log('🏆 Wendy sport breakdown:', sportCounts);
    
    // Show sample of matches with streams
    const matchesWithStreamsSample = matches.filter(m => m.streams && m.streams.length > 0).slice(0, 3);
    if (matchesWithStreamsSample.length > 0) {
      console.log('📺 Sample matches with streams:');
      matchesWithStreamsSample.forEach(match => {
        console.log(`   ${match.sportCategory}: ${match.title} - ${match.streams.length} streams`);
      });
    }
    
    return {
      matches: matches,
      _metadata: {
        supplier: 'wendy',
        lastUpdated: new Date().toISOString(),
        matchCount: matches.length,
        matchesWithStreams: matchesWithStreams,
        totalStreams: matches.reduce((sum, m) => sum + (m.streams ? m.streams.length : 0), 0),
        dataHash: require('crypto').createHash('md5').update(JSON.stringify(matches)).digest('hex')
      }
    };
  }
}
    ];

    const results = {
        startTime: new Date().toISOString(),
        updated: [],
        failed: [],
        skipped: [],
        details: {}
    };

    // Ensure suppliers directory exists
    if (!fs.existsSync('./suppliers')) {
        fs.mkdirSync('./suppliers', { recursive: true });
    }

   await Promise.all(suppliers.map(async (supplier) => {
    const circuitBreaker = circuitBreakers[supplier.name];
    
    // 🆕 ADDED DEBUG LINE
    console.log(`🔧 ${supplier.name} circuit breaker state:`, circuitBreaker.state);
    
    // Check circuit breaker
    if (!circuitBreaker.canExecute()) {
        console.log(`   ⚡ Circuit breaker active - skipping ${supplier.name}`);
        results.skipped.push(supplier.name);
        results.details[supplier.name] = {
            success: false,
            error: 'Circuit breaker open',
            skipped: true
        };
        return;
    }

    console.log(`🔍 Updating ${supplier.name.toUpperCase()}...`);
        
        let lastError = null;
        let success = false;
        
        for (const [index, url] of supplier.urls.entries()) {
            try {
                console.log(`   Trying proxy ${index + 1}/${supplier.urls.length}: ${new URL(url).hostname}`);
                
                const response = await fetchWithTimeout(url);
                
                if (response.ok) {
                    const rawData = await response.json();
                    
                    // Validate data before processing
                    validateSupplierData(rawData, supplier.name);
                    
                    const processedData = supplier.processor(rawData);
                    
                    // Create backup before updating
                    backupSupplierData(supplier.name);
                    
                    // SIMPLE REPLACEMENT: Always save fresh API data
                    fs.writeFileSync(
                        `./suppliers/${supplier.name}-data.json`, 
                        JSON.stringify(processedData, null, 2)
                    );
                    
                    console.log(`   ✅ UPDATED: ${supplier.name}`);
                    console.log(`   📊 Matches: ${processedData._metadata.matchCount}`);
                    
                    results.updated.push(supplier.name);
                    results.details[supplier.name] = {
                        matchCount: processedData._metadata.matchCount,
                        source: new URL(url).hostname,
                        success: true,
                        dataHash: processedData._metadata.dataHash
                    };
                    
                    circuitBreaker.recordSuccess();
                    success = true;
                    return; // Success - exit proxy loop
                    
                } else {
                    console.log(`   ❌ HTTP ${response.status} from ${new URL(url).hostname}`);
                    lastError = new Error(`HTTP ${response.status}`);
                }
                
            } catch (error) {
                lastError = error;
                console.log(`   ❌ Proxy failed: ${error.message}`);
                continue; // Try next proxy
            }
        }
        
        // All proxies failed
        if (!success) {
            console.log(`   🚨 ALL PROXIES FAILED for ${supplier.name}`);
            circuitBreaker.recordFailure();
            results.failed.push(supplier.name);
            results.details[supplier.name] = {
                success: false,
                error: lastError?.message || 'All proxies failed',
                circuitBreakerState: circuitBreaker.state
            };
        }
    }));

    // Generate enhanced summary
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime) - new Date(results.startTime);
    
    console.log('\n📊 ENHANCED UPDATE SUMMARY:');
    console.log('══════════════════════════════════════');
    console.log(`✅ Updated: ${results.updated.length > 0 ? results.updated.join(', ') : 'None'}`);
    console.log(`⚡ Skipped: ${results.skipped.length > 0 ? results.skipped.join(', ') : 'None'}`);
    console.log(`❌ Failed: ${results.failed.length > 0 ? results.failed.join(', ') : 'None'}`);
    console.log(`⏱️  Duration: ${results.duration}ms`);
    
    // Circuit breaker status
    console.log('\n🔌 CIRCUIT BREAKER STATUS:');
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
        console.log(`   ${name}: ${breaker.state} (failures: ${breaker.failures})`);
    });
    
    // Detailed results
    console.log('\n🔍 DETAILED RESULTS:');
    Object.entries(results.details).forEach(([supplier, detail]) => {
        if (detail.success) {
            console.log(`   ${supplier}: ${detail.matchCount} matches via ${detail.source}`);
            console.log(`        Data Hash: ${detail.dataHash?.substring(0, 16)}...`);
        } else if (detail.skipped) {
            console.log(`   ${supplier}: SKIPPED (circuit breaker)`);
        } else {
            console.log(`   ${supplier}: FAILED - ${detail.error}`);
            console.log(`        Circuit State: ${detail.circuitBreakerState}`);
        }
    });
    
    console.log('══════════════════════════════════════\n');
    
    // Alert on significant data changes
    alertOnDataAnomalies(results);
    
    // Write enhanced results to file
    fs.writeFileSync('./suppliers/update-results.json', JSON.stringify(results, null, 2));
    
    return results;
}

// Alerting function
function alertOnDataAnomalies(results) {
    const previousResults = getPreviousResults();
    
    Object.entries(results.details).forEach(([supplier, detail]) => {
        if (detail.success && previousResults.details?.[supplier]?.success) {
            const previousCount = previousResults.details[supplier].matchCount;
            const currentCount = detail.matchCount;
            const change = Math.abs(currentCount - previousCount);
            const changePercent = (change / previousCount) * 100;
            
            if (changePercent > 50) { // 50% change threshold
                console.log(`🚨 ALERT: ${supplier} match count changed by ${changePercent.toFixed(1)}%`);
                console.log(`   Was: ${previousCount}, Now: ${currentCount}`);
            }
        }
    });
}

function getPreviousResults() {
    try {
        if (fs.existsSync('./suppliers/update-results.json')) {
            return JSON.parse(fs.readFileSync('./suppliers/update-results.json', 'utf8'));
        }
    } catch (error) {
        // Ignore errors reading previous results
    }
    return { details: {} };
}

// Run if called directly
if (require.main === module) {
    updateAllSuppliers().catch(error => {
        console.error('💥 CRITICAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { updateAllSuppliers, SupplierCircuitBreaker };
