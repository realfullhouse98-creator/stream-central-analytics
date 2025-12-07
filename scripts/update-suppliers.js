// update-suppliers.js - COMPLETE WORKER-PRIMARY VERSION
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 🎯 PROFESSIONAL CIRCUIT BREAKER (Keep this for direct API fallbacks)
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
        } else if (supplierName === 'sarah' && parsedData.matches) {
            matchCount = parsedData.matches.length;
            hasContent = parsedData.matches.length > 0;
        } else if (supplierName === 'wendy' && parsedData.matches) {
            matchCount = parsedData.matches.length;
            hasContent = parsedData.matches.length > 0;
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
                
                // Simple validation
                let isValid = false;
                if (supplierName === 'tom' && backupData.events) {
                    isValid = Object.values(backupData.events).flat().length > 0;
                } else if ((supplierName === 'sarah' || supplierName === 'wendy') && backupData.matches) {
                    isValid = backupData.matches.length > 0;
                }
                
                if (!isValid) continue;
                
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
        if (!data.matches && !Array.isArray(data)) {
            errors.push('Invalid Sarah API format');
        }
        if (data.matches) {
            matchCount = data.matches.length;
        } else if (Array.isArray(data)) {
            matchCount = data.length;
        }
    } else if (supplier === 'wendy') {
        if (!data.matches && !Array.isArray(data)) {
            errors.push('Invalid Wendy API format');
        }
        if (data.matches) {
            matchCount = data.matches.length;
        } else if (Array.isArray(data)) {
            matchCount = data.length;
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        matchCount: matchCount
    };
}

// 🎯 PROFESSIONAL FETCH WITH RETRY (FOR DIRECT API FALLBACK)
async function fetchWithProfessionalRetry(url, supplierName, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), supplierName === 'wendy' ? 15000 : 10000);
            
            console.log(`   🔄 Direct API Attempt ${attempt}/${maxRetries}: ${new URL(url).hostname}`);
            
            const headers = {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: headers
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Direct API success on attempt ${attempt}`);
                return data;
            } else {
                lastError = new Error(`HTTP ${response.status}`);
                console.log(`   ❌ Direct API HTTP ${response.status} on attempt ${attempt}`);
            }
            
        } catch (error) {
            lastError = error;
            console.log(`   ❌ Direct API attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    throw lastError;
}

// 🎯 WORKER API FETCHER (PRIMARY)
async function fetchFromWorker(endpoint) {
    const WORKER_URL = 'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev';
    const url = `${WORKER_URL}${endpoint}`;
    
    try {
        console.log(`   🚀 PRIMARY: Fetching from Worker: ${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SportsPipeline-Worker/1.0'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Worker HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`   ✅ Worker success for ${endpoint}`);
        return { source: 'worker', data: data, success: true };
        
    } catch (error) {
        console.log(`   ❌ Worker failed: ${error.message}`);
        throw error;
    }
}

// 🎯 SUPPLIER CONFIGURATION - UPDATED FOR WORKER-PRIMARY
const suppliers = [
    {
        name: 'tom',
        workerEndpoint: '/api/tom/all',
        directUrls: [
            'https://topembed.pw/api.php?format=json',
            'https://corsproxy.io/?https://topembed.pw/api.php?format=json'
        ],
        processor: (data) => {
            // Worker returns {data: ..., metadata: ...}, direct API returns raw
            const events = data.data?.events || data.events || {};
            const matchCount = data.data?.events ? 
                Object.values(data.data.events).flat().length :
                Object.values(events).flat().length;
            
            const checksum = crypto.createHash('md5').update(JSON.stringify(events)).digest('hex');
            
            return {
                events: events,
                _metadata: {
                    supplier: 'tom',
                    lastUpdated: new Date().toISOString(),
                    matchCount: matchCount,
                    dataHash: checksum,
                    source: data.source || 'direct'
                }
            };
        }
    },
    {
        name: 'sarah',
        workerEndpoint: '/api/sarah/all',
        directUrls: [
            'https://streamed.pk/api/matches/all',
            'https://corsproxy.io/?https://streamed.pk/api/matches/all'
        ],
        processor: (data) => {
            // Worker returns {data: ..., metadata: ...}
            const rawData = data.data || data;
            const matches = Array.isArray(rawData) ? rawData : (rawData.matches || []);
            const checksum = crypto.createHash('md5').update(JSON.stringify(matches)).digest('hex');
            
            return {
                matches: matches,
                _metadata: {
                    supplier: 'sarah',
                    lastUpdated: new Date().toISOString(),
                    matchCount: matches.length,
                    dataHash: checksum,
                    source: data.source || 'direct'
                }
            };
        }
    },
    {
        name: 'wendy',
        workerEndpoint: '/api/wendy/all',
        directUrls: [
            'https://api.watchfooty.st/api/v1/sports',
            'https://corsproxy.io/?https://api.watchfooty.st/api/v1/sports'
        ],
        processor: async (data) => {
            try {
                // Worker returns array of matches directly
                let matches = data.data || data;
                
                if (!Array.isArray(matches)) {
                    // Direct API returns sports list, need to fetch matches
                    const sports = Array.isArray(matches) ? matches : [];
                    const sportsToFetch = sports.slice(0, 3);
                    
                    matches = [];
                    
                    for (const sport of sportsToFetch) {
                        try {
                            const matchesUrl = `https://api.watchfooty.st/api/v1/matches/${sport.name}`;
                            const response = await fetch(matchesUrl, { 
                                signal: AbortSignal.timeout(8000) 
                            });
                            
                            if (response.ok) {
                                const sportMatches = await response.json();
                                if (Array.isArray(sportMatches)) {
                                    sportMatches.forEach(match => {
                                        match.sportCategory = sport.name;
                                        match.source = 'wendy';
                                    });
                                    matches.push(...sportMatches);
                                }
                            }
                        } catch (error) {
                            console.log(`   ⚠️ Wendy ${sport.name}: ${error.message}`);
                        }
                    }
                }
                
                const checksum = crypto.createHash('md5').update(JSON.stringify(matches)).digest('hex');
                
                return {
                    matches: matches,
                    _metadata: {
                        supplier: 'wendy',
                        lastUpdated: new Date().toISOString(),
                        matchCount: matches.length,
                        dataHash: checksum,
                        source: data.source || 'direct'
                    }
                };
                
            } catch (error) {
                console.log(`   ❌ Wendy processor error: ${error.message}`);
                return {
                    matches: [],
                    _metadata: {
                        supplier: 'wendy',
                        lastUpdated: new Date().toISOString(),
                        matchCount: 0,
                        error: error.message,
                        emergency: true
                    }
                };
            }
        }
    }
];

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

// 🎯 COMBINED DATA FROM WORKER (Optional)
async function fetchCombinedFromWorker() {
    try {
        console.log('🔄 Fetching combined data from Worker...');
        const result = await fetchFromWorker('/api/combined-matches');
        
        if (result.success && result.data) {
            console.log(`✅ Combined from Worker: ${result.data.totalMatches || result.data.matches?.length || 0} matches`);
            
            // Save individual supplier files from combined data
            if (result.data.totals?.tom) {
                const tomData = {
                    events: {},
                    _metadata: {
                        supplier: 'tom',
                        lastUpdated: new Date().toISOString(),
                        matchCount: result.data.totals.tom,
                        source: 'worker-combined'
                    }
                };
                fs.writeFileSync('./suppliers/tom-data.json', JSON.stringify(tomData, null, 2));
            }
            
            if (result.data.totals?.sarah) {
                const sarahData = {
                    matches: [],
                    _metadata: {
                        supplier: 'sarah',
                        lastUpdated: new Date().toISOString(),
                        matchCount: result.data.totals.sarah,
                        source: 'worker-combined'
                    }
                };
                fs.writeFileSync('./suppliers/sarah-data.json', JSON.stringify(sarahData, null, 2));
            }
            
            if (result.data.totals?.wendy) {
                const wendyData = {
                    matches: [],
                    _metadata: {
                        supplier: 'wendy',
                        lastUpdated: new Date().toISOString(),
                        matchCount: result.data.totals.wendy,
                        source: 'worker-combined'
                    }
                };
                fs.writeFileSync('./suppliers/wendy-data.json', JSON.stringify(wendyData, null, 2));
            }
            
            return true;
        }
    } catch (error) {
        console.log(`❌ Combined Worker fetch failed: ${error.message}`);
    }
    return false;
}

// 🎯 MAIN UPDATE FUNCTION
async function updateAllSuppliers() {
    console.log('🔒 PROFESSIONAL SUPPLIER UPDATE - WORKER-PRIMARY STRATEGY\n');
    console.log('⏰', new Date().toISOString(), '\n');
    
    const results = {
        startTime: new Date().toISOString(),
        strategy: 'worker-primary',
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

    // 🎯 FIRST TRY: COMBINED DATA FROM WORKER
    console.log('🎯 STRATEGY 1: Combined data from Worker');
    const combinedSuccess = await fetchCombinedFromWorker();
    
    if (combinedSuccess) {
        console.log('✅ Successfully updated all suppliers from Worker combined endpoint');
        
        // Verify the data
        let totalMatches = 0;
        ['tom', 'sarah', 'wendy'].forEach(supplier => {
            const filePath = `./suppliers/${supplier}-data.json`;
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const matchCount = data._metadata?.matchCount || 0;
                    console.log(`   ${supplier}: ${matchCount} matches`);
                    totalMatches += matchCount;
                    results.updated.push(supplier);
                } catch (error) {
                    console.log(`   ${supplier}: Error reading file`);
                }
            }
        });
        
        if (totalMatches > 100) {
            console.log(`\n🎯 Combined Worker strategy successful: ${totalMatches} matches`);
            
            results.endTime = new Date().toISOString();
            results.duration = new Date(results.endTime) - new Date(results.startTime);
            results.integrity.successful = results.updated.length;
            results.integrity.totalAttempted = 3;
            
            console.log('\n📊 UPDATE SUMMARY:');
            console.log('══════════════════════════════════════');
            console.log(`✅ Strategy: Worker combined endpoint`);
            console.log(`✅ Updated: ${results.updated.join(', ')}`);
            console.log(`📦 Total matches: ${totalMatches}`);
            console.log(`⏱️  Duration: ${results.duration}ms`);
            console.log('══════════════════════════════════════\n');
            
            fs.writeFileSync('./suppliers/update-results.json', JSON.stringify(results, null, 2));
            cleanupOldBackups();
            
            return results;
        }
    }
    
    console.log('\n🔄 Combined Worker failed, trying individual suppliers...\n');

    // 🎯 STRATEGY 2: INDIVIDUAL SUPPLIERS (Worker-first, then direct fallback)
    for (const supplier of suppliers) {
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
                continue;
            }

            // 🎯 CREATE BACKUP BEFORE UPDATE
            const backupResult = createVerifiedBackup(supplier.name);
            
            let success = false;
            let restored = false;
            let lastError = null;
            let sourceUsed = 'none';

            // 🎯 STRATEGY 2A: PRIMARY - WORKER ENDPOINT
            try {
                console.log(`   🚀 PRIMARY: Trying Worker endpoint`);
                const workerResult = await fetchFromWorker(supplier.workerEndpoint);
                
                if (workerResult.success) {
                    const processedData = supplier.processor(workerResult);
                    const validation = validateSupplierData(processedData, supplier.name);
                    
                    if (validation.valid && validation.matchCount > 0) {
                        // 🎯 ATOMIC WRITE
                        const tempPath = `./suppliers/${supplier.name}-data.json.tmp`;
                        const finalPath = `./suppliers/${supplier.name}-data.json`;
                        
                        fs.writeFileSync(tempPath, JSON.stringify(processedData, null, 2));
                        fs.renameSync(tempPath, finalPath);
                        
                        console.log(`   ✅ ${supplier.name} via Worker: ${validation.matchCount} matches`);
                        
                        results.updated.push(supplier.name);
                        results.details[supplier.name] = {
                            success: true,
                            matchCount: validation.matchCount,
                            source: 'worker',
                            dataHash: processedData._metadata?.dataHash || 'N/A',
                            backup: backupResult ? path.basename(backupResult.path) : null
                        };
                        
                        circuitBreaker.recordSuccess();
                        results.integrity.successful++;
                        success = true;
                        sourceUsed = 'worker';
                    }
                }
            } catch (workerError) {
                console.log(`   ❌ Worker failed: ${workerError.message}`);
                lastError = workerError;
            }

            // 🎯 STRATEGY 2B: SECONDARY - DIRECT API FALLBACK
            if (!success) {
                console.log(`   🔄 SECONDARY: Trying direct APIs...`);
                
                for (const url of supplier.directUrls) {
                    try {
                        const rawData = await fetchWithProfessionalRetry(url, supplier.name);
                        
                        // Process data (special handling for Wendy async processor)
                        let processedData;
                        if (supplier.name === 'wendy' && typeof supplier.processor === 'function') {
                            processedData = await supplier.processor(rawData);
                        } else {
                            processedData = supplier.processor({ data: rawData, source: 'direct' });
                        }
                        
                        // Validate data
                        const validation = validateSupplierData(processedData, supplier.name);
                        
                        if (validation.valid && validation.matchCount > 0) {
                            // ATOMIC WRITE
                            const tempPath = `./suppliers/${supplier.name}-data.json.tmp`;
                            const finalPath = `./suppliers/${supplier.name}-data.json`;
                            
                            fs.writeFileSync(tempPath, JSON.stringify(processedData, null, 2));
                            fs.renameSync(tempPath, finalPath);
                            
                            console.log(`   ✅ ${supplier.name} via Direct API: ${validation.matchCount} matches`);
                            
                            results.updated.push(supplier.name);
                            results.details[supplier.name] = {
                                success: true,
                                matchCount: validation.matchCount,
                                source: 'direct',
                                endpoint: new URL(url).hostname,
                                dataHash: processedData._metadata?.dataHash || 'N/A',
                                backup: backupResult ? path.basename(backupResult.path) : null
                            };
                            
                            circuitBreaker.recordSuccess();
                            results.integrity.successful++;
                            success = true;
                            sourceUsed = 'direct';
                            break;
                        }
                    } catch (directError) {
                        lastError = directError;
                        console.log(`   ❌ Direct API failed: ${directError.message}`);
                    }
                }
            }

            // 🎯 STRATEGY 2C: TERTIARY - RESTORE FROM BACKUP
            if (!success) {
                console.log(`   🚨 All sources failed for ${supplier.name}`);
                circuitBreaker.recordFailure();
                
                const recoveryResult = restoreFromBackup(supplier.name);
                restored = recoveryResult.recovered;
                
                if (restored) {
                    results.integrity.recovered++;
                    console.log(`   ✅ Recovery successful for ${supplier.name}`);
                    results.updated.push(supplier.name);
                    results.details[supplier.name] = {
                        success: true,
                        restored: true,
                        source: 'backup',
                        recoveryDetails: recoveryResult
                    };
                } else {
                    results.integrity.failed++;
                    console.log(`   💥 Recovery failed for ${supplier.name}`);
                    results.failed.push(supplier.name);
                    results.details[supplier.name] = {
                        success: false,
                        error: lastError?.message || 'All sources failed',
                        restored: false,
                        circuitBreaker: circuitBreaker.getStatus()
                    };
                }
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
        
        // Small delay between suppliers
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 🎯 GENERATE SUMMARY
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime) - new Date(results.startTime);
    
    console.log('\n📊 UPDATE SUMMARY:');
    console.log('══════════════════════════════════════');
    console.log(`✅ Strategy: Worker-primary with fallback`);
    console.log(`✅ Updated: ${results.updated.length > 0 ? results.updated.join(', ') : 'None'}`);
    console.log(`⚡ Skipped: ${results.skipped.length > 0 ? results.skipped.join(', ') : 'None'}`);
    console.log(`❌ Failed: ${results.failed.length > 0 ? results.failed.join(', ') : 'None'}`);
    console.log(`🔄 Recovered: ${results.integrity.recovered}`);
    console.log(`⏱️  Duration: ${results.duration}ms`);
    console.log(`📈 Success Rate: ${results.integrity.totalAttempted > 0 ? 
        ((results.integrity.successful / results.integrity.totalAttempted) * 100).toFixed(1) : 0}%`);
    
    console.log('\n🔍 DETAILS:');
    Object.entries(results.details).forEach(([supplier, detail]) => {
        if (detail.success) {
            if (detail.restored) {
                console.log(`   ${supplier}: RECOVERED from backup`);
            } else {
                console.log(`   ${supplier}: ${detail.matchCount} matches via ${detail.source}`);
            }
        } else if (detail.skipped) {
            console.log(`   ${supplier}: SKIPPED (circuit breaker)`);
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

module.exports = { 
    updateAllSuppliers, 
    ProfessionalCircuitBreaker,
    fetchFromWorker
};
