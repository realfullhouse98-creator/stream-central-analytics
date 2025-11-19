const fs = require('fs');

async function updateAllSuppliers() {
    console.log('🔄 Updating ALL suppliers...');
    
    const suppliers = [
        {
            name: 'tom',
            urls: [
                'https://corsproxy.io/?https://topembed.pw/api.php?format=json',
                'https://api.allorigins.win/raw?url=https://topembed.pw/api.php?format=json',
                'https://topembed.pw/api.php?format=json'
            ]
        },
        {
            name: 'sarah', 
            urls: [
                'https://corsproxy.io/?https://streamed.pk/api/matches/all',
                'https://api.allorigins.win/raw?url=https://streamed.pk/api/matches/all',
                'https://streamed.pk/api/matches/all'
            ]
        }
    ];

    let results = {
        updated: [],
        failed: []
    };

    // Update all suppliers in parallel for speed
    await Promise.all(suppliers.map(async (supplier) => {
        try {
            console.log(`\n📡 Updating ${supplier.name}...`);
            
            for (const url of supplier.urls) {
                try {
                    const response = await fetch(url, {
                        headers: { 'User-Agent': '9kilos-research/1.0' },
                        timeout: 8000
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        const enhancedData = {
                            ...data,
                            _metadata: {
                                supplier: supplier.name,
                                lastUpdated: new Date().toISOString(),
                                source: url,
                                matchCount: supplier.name === 'tom' 
                                    ? (data.events ? Object.values(data.events).flat().length : 0)
                                    : (Array.isArray(data) ? data.length : 0)
                            }
                        };
                        
                        fs.writeFileSync(`./suppliers/${supplier.name}-data.json`, JSON.stringify(enhancedData, null, 2));
                        
                        console.log(`✅ ${supplier.name} updated via ${new URL(url).hostname}`);
                        console.log(`📊 ${supplier.name} matches: ${enhancedData._metadata.matchCount}`);
                        
                        results.updated.push(supplier.name);
                        break; // Success - move to next supplier
                    }
                } catch (error) {
                    console.log(`❌ ${supplier.name} proxy failed: ${url}`);
                    continue; // Try next proxy
                }
            }
            
            // If we get here, all proxies failed
            results.failed.push(supplier.name);
            console.log(`🚨 All ${supplier.name} proxies failed`);
            
        } catch (error) {
            console.log(`🚨 ${supplier.name} update error:`, error.message);
            results.failed.push(supplier.name);
        }
    }));

    // Summary
    console.log('\n📊 UPDATE SUMMARY:');
    console.log(`✅ Updated: ${results.updated.join(', ') || 'None'}`);
    console.log(`❌ Failed: ${results.failed.join(', ') || 'None'}`);
    
    return results;
}

updateAllSuppliers();
