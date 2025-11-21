const fs = require('fs');

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
                return {
                    events: data.events || {},
                    _metadata: {
                        supplier: 'tom',
                        lastUpdated: new Date().toISOString(),
                        matchCount: data.events ? Object.values(data.events).flat().length : 0,
                        days: data.events ? Object.keys(data.events).length : 0
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
                return {
                    matches: matches,
                    _metadata: {
                        supplier: 'sarah',
                        lastUpdated: new Date().toISOString(), 
                        matchCount: matches.length,
                        liveMatches: matches.filter(m => m.status === 'live').length
                    }
                };
            }
        }
    ];

    const results = {
        startTime: new Date().toISOString(),
        updated: [],
        skipped: [], // ADD THIS LINE
        failed: [],
        details: {}
    };

    // Ensure suppliers directory exists
    if (!fs.existsSync('./suppliers')) {
        fs.mkdirSync('./suppliers', { recursive: true });
    }

    // Process suppliers in parallel
    await Promise.all(suppliers.map(async (supplier) => {
        console.log(`🔍 Updating ${supplier.name.toUpperCase()}...`);
        
        let lastError = null;
        
        for (const [index, url] of supplier.urls.entries()) {
            try {
                console.log(`   Trying proxy ${index + 1}/${supplier.urls.length}: ${new URL(url).hostname}`);
                
                const response = await fetchWithTimeout(url);
                
                if (response.ok) {
                    const rawData = await response.json();
                    const processedData = supplier.processor(rawData);
                    
                    // SMART CHECK: Only update if data actually changed
                    const filePath = `./suppliers/${supplier.name}-data.json`;
                    const oldData = fs.existsSync(filePath) ? 
                        JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;

                    // Compare the IMPORTANT parts, not metadata like timestamps
                    const shouldUpdate = !oldData || 
                        oldData._metadata?.matchCount !== processedData._metadata?.matchCount ||
                        JSON.stringify(oldData.events || oldData.matches) !== 
                        JSON.stringify(processedData.events || processedData.matches);

                    if (shouldUpdate) {
                        fs.writeFileSync(filePath, JSON.stringify(processedData, null, 2));
                        console.log(`   ✅ UPDATED: ${supplier.name} (changes detected)`);
                        console.log(`   📊 Matches: ${processedData._metadata.matchCount}`);
                        
                        results.updated.push(supplier.name);
                        results.details[supplier.name] = {
                            matchCount: processedData._metadata.matchCount,
                            source: new URL(url).hostname,
                            success: true,
                            changed: true
                        };
                    } else {
                        console.log(`   ⚡ SKIPPED: ${supplier.name} (no changes)`);
                        results.skipped.push(supplier.name);
                        results.details[supplier.name] = {
                            matchCount: processedData._metadata.matchCount,
                            source: new URL(url).hostname,
                            success: true,
                            changed: false
                        };
                    }
                    
                    return; // Success - exit proxy loop
                    
                } else {
                    console.log(`   ❌ HTTP ${response.status} from ${new URL(url).hostname}`);
                }
                
            } catch (error) {
                lastError = error;
                console.log(`   ❌ Proxy failed: ${error.message}`);
                continue; // Try next proxy
            }
        }
        
        // All proxies failed
        console.log(`   🚨 ALL PROXIES FAILED for ${supplier.name}`);
        results.failed.push(supplier.name);
        results.details[supplier.name] = {
            success: false,
            error: lastError?.message || 'All proxies failed'
        };
    }));

    // Generate summary
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime) - new Date(results.startTime);
    
    console.log('\n📊 UPDATE SUMMARY:');
    console.log('══════════════════════════════════════');
    console.log(`✅ Updated: ${results.updated.length > 0 ? results.updated.join(', ') : 'None'}`);
    console.log(`⚡ Skipped: ${results.skipped.length > 0 ? results.skipped.join(', ') : 'None'}`);
    console.log(`❌ Failed: ${results.failed.length > 0 ? results.failed.join(', ') : 'None'}`);
    console.log(`⏱️  Duration: ${results.duration}ms`);
    
    Object.entries(results.details).forEach(([supplier, detail]) => {
        if (detail.success) {
            const changeStatus = detail.changed ? 'UPDATED' : 'SKIPPED (no changes)';
            console.log(`   ${supplier}: ${detail.matchCount} matches via ${detail.source} - ${changeStatus}`);
        } else {
            console.log(`   ${supplier}: FAILED - ${detail.error}`);
        }
    });
    
    console.log('══════════════════════════════════════\n');
    
    // Write results to file for GitHub Actions
    fs.writeFileSync('./suppliers/update-results.json', JSON.stringify(results, null, 2));
    
    return results;
}

// Run if called directly
if (require.main === module) {
    updateAllSuppliers().catch(error => {
        console.error('💥 CRITICAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { updateAllSuppliers };
