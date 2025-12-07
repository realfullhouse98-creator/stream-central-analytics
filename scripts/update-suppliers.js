const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 🎯 PROFESSIONAL CIRCUIT BREAKER
class ProfessionalCircuitBreaker {
    constructor(supplierName, failureThreshold = 3, resetTimeout = 300000) {
        this.supplierName = supplierName;
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
        this.failures = 0;
        this.state = 'CLOSED';
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
        }
    }

    getStatus() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
        };
    }
}

// 🎯 INITIALIZE CIRCUIT BREAKERS
const circuitBreakers = {
    tom: new ProfessionalCircuitBreaker('tom'),
    sarah: new ProfessionalCircuitBreaker('sarah'),
    wendy: new ProfessionalCircuitBreaker('wendy')
};

// 🎯 PROFESSIONAL BACKUP SYSTEM
function createVerifiedBackup(supplierName) {
    const filePath = `./suppliers/${supplierName}-data.json`;
    const backupDir = './suppliers/backups';
    
    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️ No existing data to backup for ${supplierName}`);
        return null;
    }

    try {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const sourceData = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(sourceData);
        const checksum = crypto.createHash('md5').update(sourceData).digest('hex');
        
        let hasContent = false;
        let matchCount = 0;
        
        if (supplierName === 'tom' && parsedData.events) {
            matchCount = Object.values(parsedData.events).flat().length;
            hasContent = matchCount > 0;
        } else if (supplierName === 'sarah' && Array.isArray(parsedData)) {
            matchCount = parsedData.length;
            hasContent = parsedData.length > 0;
        } else if (supplierName === 'wendy') {
    // 🎯 FIX: Check both array formats
    if (Array.isArray(parsedData)) {
        matchCount = parsedData.length;
        hasContent = parsedData.length > 0;
    } else if (parsedData.matches) {
        matchCount = parsedData.matches.length;
        hasContent = parsedData.matches.length > 0;
    }
}
        
        if (!hasContent) {
            console.log(`   ⚠️ Skipping backup - ${supplierName} data appears empty`);
            return null;
        }
        
        const timestamp = Date.now();
        const backupPath = path.join(backupDir, `${supplierName}-data-${timestamp}.json`);
        
        fs.writeFileSync(backupPath, sourceData);
        
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const backupChecksum = crypto.createHash('md5').update(backupContent).digest('hex');
        
        if (backupChecksum !== checksum) {
            throw new Error('Backup checksum mismatch');
        }
        
        const stats = fs.statSync(backupPath);
        console.log(`   💾 Backup created: ${path.basename(backupPath)} (${matchCount} matches)`);
        
        return { path: backupPath, checksum: checksum, matchCount: matchCount };
        
    } catch (error) {
        console.log(`   ❌ Backup failed for ${supplierName}: ${error.message}`);
        return null;
    }
}

// 🎯 PROFESSIONAL RECOVERY SYSTEM
function restoreFromBackup(supplierName) {
    const backupDir = './suppliers/backups';
    if (!fs.existsSync(backupDir)) {
        return { recovered: false, error: 'No backup directory' };
    }
    
    try {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(`${supplierName}-data-`) && f.endsWith('.json'))
            .map(file => ({
                name: file,
                path: path.join(backupDir, file),
                time: fs.statSync(path.join(backupDir, file)).mtimeMs
            }))
            .sort((a, b) => b.time - a.time);
        
        if (files.length === 0) {
            return { recovered: false, error: 'No backups found' };
        }
        
        for (const backup of files) {
            try {
                console.log(`   🔄 Attempting recovery from: ${backup.name}`);
                
                const backupContent = fs.readFileSync(backup.path, 'utf8');
                const backupData = JSON.parse(backupContent);
                
                if (!validateSupplierData(backupData, supplierName).valid) {
                    continue;
                }
                
                const currentFile = `./suppliers/${supplierName}-data.json`;
                const tempFile = `${currentFile}.tmp`;
                
                fs.writeFileSync(tempFile, backupContent);
                fs.renameSync(tempFile, currentFile);
                
                console.log(`   ✅ Successfully restored ${supplierName} from backup`);
                return {
                    recovered: true,
                    backupFile: backup.name,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                console.log(`   ❌ Backup restoration failed: ${error.message}`);
                continue;
            }
        }
        
        return { recovered: false, error: 'All backup restoration attempts failed' };
        
    } catch (error) {
        return { recovered: false, error: error.message };
    }
}

// 🎯 DATA VALIDATION
function validateSupplierData(data, supplier) {
    const errors = [];
    let matchCount = 0;
    
    if (!data) {
        errors.push('No data received');
        return { valid: false, errors, matchCount };
    }
    
    if (supplier === 'tom') {
        if (!data.events && !data.matches) {
            errors.push('Invalid Tom API format');
        }
        if (data.events) {
            matchCount = Object.values(data.events).reduce((sum, dayMatches) => {
                return sum + (Array.isArray(dayMatches) ? dayMatches.length : 0);
            }, 0);
            if (matchCount === 0) {
                errors.push('Tom data has events but no matches');
            }
        }
    } else if (supplier === 'sarah') {
        if (!Array.isArray(data)) {
            errors.push('Invalid Sarah API format - expected array');
        }
        matchCount = data.length;
    } else if (supplier === 'wendy') {
    // 🎯 FIX: Wendy returns DIRECT ARRAY, not {matches: []}
    if (!Array.isArray(data)) {
        errors.push('Wendy should return direct array');
    }
    matchCount = Array.isArray(data) ? data.length : 0;
}
    
    return {
        valid: errors.length === 0,
        errors: errors,
        matchCount: matchCount
    };
}

// 🎯 PROFESSIONAL FETCH WITH RETRY
async function fetchWithProfessionalRetry(url, supplierName, maxRetries = 3) {
    if (supplierName === 'wendy' && url.includes('workers.dev')) {
        maxRetries = 1;
    }
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            console.log(`   🔄 Attempt ${attempt}/${maxRetries}: ${new URL(url).hostname}`);
            
            // 🎯 FIXED HEADERS FOR WENDY WORKER
            const headers = {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };
            
            if (supplierName === 'wendy' && url.includes('workers.dev')) {
                headers['Origin'] = 'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev';
                headers['Referer'] = 'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/';
            }
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: headers
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Success on attempt ${attempt}`);
                return data;
            } else {
                lastError = new Error(`HTTP ${response.status}`);
                console.log(`   ❌ HTTP ${response.status} on attempt ${attempt}`);
            }
            
        } catch (error) {
            lastError = error;
            console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    throw lastError;
}

// 🎯 CLEANUP OLD BACKUPS
function cleanupOldBackups() {
    const backupDir = './suppliers/backups';
    if (!fs.existsSync(backupDir)) return;
    
    const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            time: fs.statSync(path.join(backupDir, file)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);
    
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    const backupsToKeep = new Set();
    files.slice(0, 3).forEach(backup => backupsToKeep.add(backup.name));
    files.forEach(backup => {
        if (now - backup.time < (6 * 60 * 60 * 1000)) {
            backupsToKeep.add(backup.name);
        }
    });
    
    let deletedCount = 0;
    files.forEach(backup => {
        if (!backupsToKeep.has(backup.name)) {
            try {
                fs.unlinkSync(backup.path);
                deletedCount++;
            } catch (error) {
                console.log(`   ❌ Could not delete ${backup.name}: ${error.message}`);
            }
        }
    });
    
    if (deletedCount > 0) {
        console.log(`🗑️ Cleanup complete: ${deletedCount} old backups deleted`);
    }
}

// 🎯 SUPPLIER CONFIGURATION
const suppliers = [
    {
        name: 'tom',
        urls: [
            'https://corsproxy.io/?https://topembed.pw/api.php?format=json',
            'https://api.allorigins.win/raw?url=https://topembed.pw/api.php?format=json'
        ],
        processor: (data) => {
            const events = data.events || {};
            const matchCount = data.events ? Object.values(data.events).flat().length : 0;
            const checksum = crypto.createHash('md5').update(JSON.stringify(events)).digest('hex');
            
            return {
                events: events,
                _metadata: {
                    supplier: 'tom',
                    lastUpdated: new Date().toISOString(),
                    matchCount: matchCount,
                    dataHash: checksum,
                    professional: true
                }
            };
        }
    },
    {
        name: 'sarah', 
        urls: [
            'https://corsproxy.io/?https://streamed.pk/api/matches/all',
            'https://api.allorigins.win/raw?url=https://streamed.pk/api/matches/all'
        ],
        processor: (data) => {
            const matches = Array.isArray(data) ? data : [];
            const checksum = crypto.createHash('md5').update(JSON.stringify(matches)).digest('hex');
            
            return {
                matches: matches,
                _metadata: {
                    supplier: 'sarah',
                    lastUpdated: new Date().toISOString(), 
                    matchCount: matches.length,
                    dataHash: checksum,
                    professional: true
                }
            };
        }
    },
    {
  name: 'wendy',
  urls: [
    // Try these endpoints (one should work):
    'https://watchfooty.st/api/v1/all-matches',
    'https://watchfooty.st/matches',
    'https://watchfooty.st/api/matches/all',
    // With CORS proxies as fallback:
    'https://corsproxy.io/?https://watchfooty.st/api/v1/all-matches',
    'https://api.allorigins.win/raw?url=https://watchfooty.st/api/v1/all-matches'
  ],
  processor: (data) => {
    console.log('🔍 WENDY - Processing data');
    
    // Wendy might return direct array or {matches: []}
    const matches = Array.isArray(data) ? data : 
                   (data && data.matches ? data.matches : []);
    
    console.log(`   Got ${matches.length} Wendy matches`);
    
    // If matches are empty but data has another structure, check
    if (matches.length === 0 && data) {
      console.log('   Data structure:', Object.keys(data));
    }
    
    return {
      matches: matches,
      _metadata: {
        supplier: 'wendy',
        lastUpdated: new Date().toISOString(),
        matchCount: matches.length,
        dataHash: require('crypto').createHash('md5').update(JSON.stringify(matches)).digest('hex'),
        professional: true
      }
    };
  }
}
];
// 🎯 MAIN UPDATE FUNCTION
async function updateAllSuppliers() {
    console.log('🔒 PROFESSIONAL SUPPLIER UPDATE - STARTING\n');
    console.log('⏰', new Date().toISOString(), '\n');
    
    const results = {
        startTime: new Date().toISOString(),
        professional: true,
        updated: [],
        failed: [],
        skipped: [],
        details: {},
        circuitBreakers: {},
        integrity: {
            totalAttempted: 0,
            successful: 0,
            failed: 0,
            recovered: 0
        }
    };

    // 🎯 ENSURE DIRECTORY STRUCTURE
    if (!fs.existsSync('./suppliers')) {
        fs.mkdirSync('./suppliers', { recursive: true });
    }
    if (!fs.existsSync('./suppliers/backups')) {
        fs.mkdirSync('./suppliers/backups', { recursive: true });
    }

    // 🎯 LOG CIRCUIT BREAKER STATUS
    console.log('🔌 CIRCUIT BREAKER STATUS:');
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
        const status = breaker.state === 'OPEN' ? '🔴 OPEN' : '🟢 CLOSED';
        console.log(`   ${name}: ${status} (failures: ${breaker.failures})`);
        results.circuitBreakers[name] = breaker.getStatus();
    });
    console.log('');

    // 🎯 PROCESS SUPPLIERS
    await Promise.all(suppliers.map(async (supplier) => {
        results.integrity.totalAttempted++;
        
        try {
            const circuitBreaker = circuitBreakers[supplier.name];
            
            console.log(`🔧 UPDATING ${supplier.name.toUpperCase()}...`);
            
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

            // 🎯 CREATE BACKUP BEFORE UPDATE
            const backupResult = createVerifiedBackup(supplier.name);
            
            let success = false;
            let restored = false;
            let lastError = null;
            
            // 🎯 ATTEMPT TO FETCH FRESH DATA
            for (const url of supplier.urls) {
                try {
                    const rawData = await fetchWithProfessionalRetry(url, supplier.name);
                    
                    // 🎯 VALIDATE DATA
                    const validation = validateSupplierData(rawData, supplier.name);
                    if (!validation.valid) {
                        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
                    }
                    
                    const processedData = supplier.processor(rawData);
                    
                    // 🎯 ATOMIC WRITE
                    const tempPath = `./suppliers/${supplier.name}-data.json.tmp`;
                    const finalPath = `./suppliers/${supplier.name}-data.json`;
                    
                    fs.writeFileSync(tempPath, JSON.stringify(processedData, null, 2));
                    fs.renameSync(tempPath, finalPath);
                    
                    console.log(`   ✅ ${supplier.name}: ${processedData._metadata.matchCount} matches`);
                    
                    results.updated.push(supplier.name);
                    results.details[supplier.name] = {
                        success: true,
                        matchCount: processedData._metadata.matchCount,
                        source: new URL(url).hostname,
                        dataHash: processedData._metadata.dataHash,
                        backup: backupResult ? path.basename(backupResult.path) : null
                    };
                    
                    circuitBreaker.recordSuccess();
                    results.integrity.successful++;
                    success = true;
                    break;
                    
                } catch (error) {
                    lastError = error;
                    console.log(`   ❌ ${new URL(url).hostname}: ${error.message}`);
                }
            }
            
            // 🎯 HANDLE FAILURE WITH RECOVERY
            if (!success) {
                console.log(`   🚨 All URLs failed for ${supplier.name}`);
                circuitBreaker.recordFailure();
                
                const recoveryResult = restoreFromBackup(supplier.name);
                restored = recoveryResult.recovered;
                
                if (restored) {
                    results.integrity.recovered++;
                    console.log(`   ✅ Recovery successful for ${supplier.name}`);
                } else {
                    results.integrity.failed++;
                    console.log(`   💥 Recovery failed for ${supplier.name}`);
                }
                
                results.failed.push(supplier.name);
                results.details[supplier.name] = {
                    success: false,
                    error: lastError?.message || 'All URLs failed',
                    restored: restored,
                    recoveryDetails: restored ? recoveryResult : null,
                    circuitBreaker: circuitBreaker.getStatus()
                };
            }
            
        } catch (supplierError) {
            console.log(`💥 UNEXPECTED ERROR: ${supplier.name} - ${supplierError.message}`);
            results.failed.push(supplier.name);
            results.integrity.failed++;
            results.details[supplier.name] = {
                success: false,
                error: `Unexpected error: ${supplierError.message}`
            };
        }
    }));

    // 🎯 GENERATE SUMMARY
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime) - new Date(results.startTime);
    
    console.log('\n📊 UPDATE SUMMARY:');
    console.log('══════════════════════════════════════');
    console.log(`✅ Updated: ${results.updated.length > 0 ? results.updated.join(', ') : 'None'}`);
    console.log(`⚡ Skipped: ${results.skipped.length > 0 ? results.skipped.join(', ') : 'None'}`);
    console.log(`❌ Failed: ${results.failed.length > 0 ? results.failed.join(', ') : 'None'}`);
    console.log(`🔄 Recovered: ${results.integrity.recovered}`);
    console.log(`⏱️  Duration: ${results.duration}ms`);
    console.log(`📈 Success Rate: ${((results.integrity.successful / results.integrity.totalAttempted) * 100).toFixed(1)}%`);
    
    console.log('\n🔍 DETAILS:');
    Object.entries(results.details).forEach(([supplier, detail]) => {
        if (detail.success) {
            console.log(`   ${supplier}: ${detail.matchCount} matches via ${detail.source}`);
        } else if (detail.skipped) {
            console.log(`   ${supplier}: SKIPPED (circuit breaker)`);
        } else if (detail.restored) {
            console.log(`   ${supplier}: RECOVERED from backup`);
        } else {
            console.log(`   ${supplier}: FAILED - ${detail.error}`);
        }
    });
    
    console.log('══════════════════════════════════════\n');
    
    // 🎯 WRITE RESULTS AND CLEANUP
    fs.writeFileSync('./suppliers/update-results.json', JSON.stringify(results, null, 2));
    cleanupOldBackups();
    
    return results;
}

// 🎯 RUN IF CALLED DIRECTLY
if (require.main === module) {
    updateAllSuppliers().catch(error => {
        console.error('💥 UPDATE FAILED:', error);
        process.exit(1);
    });
}

module.exports = { updateAllSuppliers, ProfessionalCircuitBreaker };
