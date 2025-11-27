const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // 🎯 ADDED FOR CHECKSUMS

// 🎯 ENHANCED: Professional Circuit Breaker with Recovery Tracking
class ProfessionalCircuitBreaker {
    constructor(supplierName, failureThreshold = 3, resetTimeout = 300000) { // 5 minutes
        this.supplierName = supplierName;
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
        this.failures = 0;
        this.state = 'CLOSED';
        this.lastFailureTime = null;
        this.recoveryAttempts = 0;
        this.lastSuccessTime = null;
    }

    canExecute() {
        if (this.state === 'OPEN') {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                this.recoveryAttempts++;
                console.log(`   🔄 Circuit breaker HALF_OPEN for ${this.supplierName} (attempt ${this.recoveryAttempts})`);
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
        this.lastSuccessTime = Date.now();
        this.recoveryAttempts = 0;
    }

    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            console.log(`   🔌 Circuit breaker OPEN for ${this.supplierName} (${this.failures} failures)`);
        }
    }

    getStatus() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
            lastSuccess: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
            recoveryAttempts: this.recoveryAttempts
        };
    }
}

// 🎯 ENHANCED: Initialize professional circuit breakers
const circuitBreakers = {
    tom: new ProfessionalCircuitBreaker('tom'),
    sarah: new ProfessionalCircuitBreaker('sarah'),
    wendy: new ProfessionalCircuitBreaker('wendy')
};

// 🎯 ENHANCED: Professional Backup with Checksum Verification
function createVerifiedBackup(supplierName) {
    const filePath = `./suppliers/${supplierName}-data.json`;
    const backupDir = './suppliers/backups';
    
    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️ No existing data to backup for ${supplierName}`);
        return null;
    }

    try {
        // Ensure backups directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // 🎯 READ AND VALIDATE SOURCE DATA
        const sourceData = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(sourceData);
        
        // 🎯 CALCULATE CHECKSUM
        const checksum = crypto.createHash('md5').update(sourceData).digest('hex');
        
        // Check if source data has meaningful content
        let hasContent = false;
        let matchCount = 0;
        
        if (supplierName === 'tom' && parsedData.events) {
            matchCount = Object.values(parsedData.events).flat().length;
            hasContent = matchCount > 0;
        } else if (supplierName === 'sarah' && Array.isArray(parsedData)) {
            matchCount = parsedData.length;
            hasContent = parsedData.length > 0;
        } else if (supplierName === 'wendy' && parsedData.matches) {
            matchCount = parsedData.matches.length;
            hasContent = parsedData.matches.length > 0;
        }
        
        if (!hasContent) {
            console.log(`   ⚠️ Skipping backup - ${supplierName} data appears empty`);
            return null;
        }
        
        // 🎯 CREATE BACKUP WITH TIMESTAMP AND CHECKSUM
        const timestamp = Date.now();
        const backupPath = path.join(backupDir, `${supplierName}-data-${timestamp}.json`);
        
        fs.writeFileSync(backupPath, sourceData);
        
        // 🎯 VERIFY BACKUP INTEGRITY
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const backupChecksum = crypto.createHash('md5').update(backupContent).digest('hex');
        
        if (backupChecksum !== checksum) {
            throw new Error('Backup checksum mismatch - backup corrupted');
        }
        
        const stats = fs.statSync(backupPath);
        console.log(`   💾 Backup created and verified: ${path.basename(backupPath)} (${matchCount} matches, ${stats.size} bytes)`);
        
        return {
            path: backupPath,
            checksum: checksum,
            matchCount: matchCount,
            timestamp: timestamp
        };
        
    } catch (error) {
        console.log(`   ❌ Backup failed for ${supplierName}: ${error.message}`);
        return null;
    }
}

// 🎯 ENHANCED: Professional Recovery with Validation
function restoreFromBackup(supplierName) {
    const backupDir = './suppliers/backups';
    if (!fs.existsSync(backupDir)) {
        console.log(`   ❌ No backup directory for ${supplierName}`);
        return { recovered: false, error: 'No backup directory' };
    }
    
    try {
        // 🎯 FIND MOST RECENT VALID BACKUP
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(`${supplierName}-data-`) && f.endsWith('.json'))
            .map(file => ({
                name: file,
                path: path.join(backupDir, file),
                time: fs.statSync(path.join(backupDir, file)).mtimeMs
            }))
            .sort((a, b) => b.time - a.time); // Most recent first
        
        if (files.length === 0) {
            console.log(`   ❌ No backups found for ${supplierName}`);
            return { recovered: false, error: 'No backups found' };
        }
        
        // 🎯 TRY BACKUPS IN ORDER UNTIL WE FIND A VALID ONE
        for (const backup of files) {
            try {
                console.log(`   🔄 Attempting recovery from: ${backup.name}`);
                
                const backupContent = fs.readFileSync(backup.path, 'utf8');
                const backupData = JSON.parse(backupContent);
                
                // 🎯 VALIDATE BACKUP DATA
                const validation = validateSupplierData(backupData, supplierName);
                if (!validation.valid) {
                    console.log(`   ❌ Backup validation failed: ${validation.errors.join(', ')}`);
                    continue; // Try next backup
                }
                
                // 🎯 CALCULATE CHECKSUM FOR INTEGRITY
                const checksum = crypto.createHash('md5').update(backupContent).digest('hex');
                
                // 🎯 ATOMIC WRITE: Write to temporary file first
                const currentFile = `./suppliers/${supplierName}-data.json`;
                const tempFile = `${currentFile}.tmp`;
                
                fs.writeFileSync(tempFile, backupContent);
                
                // 🎯 VERIFY TEMPORARY FILE
                const tempContent = fs.readFileSync(tempFile, 'utf8');
                const tempChecksum = crypto.createHash('md5').update(tempContent).digest('hex');
                
                if (tempChecksum !== checksum) {
                    throw new Error('Temporary file checksum mismatch');
                }
                
                // 🎯 ATOMIC RENAME
                fs.renameSync(tempFile, currentFile);
                
                console.log(`   ✅ Successfully restored ${supplierName} from backup: ${backup.name}`);
                console.log(`   🔒 Backup checksum: ${checksum.substring(0, 16)}...`);
                
                return {
                    recovered: true,
                    backupFile: backup.name,
                    checksum: checksum,
                    matchCount: validation.matchCount,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                console.log(`   ❌ Backup restoration failed: ${error.message}`);
                continue; // Try next backup
            }
        }
        
        console.log(`   💥 All backup attempts failed for ${supplierName}`);
        return { recovered: false, error: 'All backup restoration attempts failed' };
        
    } catch (error) {
        console.log(`   💥 Recovery process failed: ${error.message}`);
        return { recovered: false, error: error.message };
    }
}

// 🎯 ENHANCED: Professional Data Validation
function validateSupplierData(data, supplier) {
    const errors = [];
    let matchCount = 0;
    
    if (!data) {
        errors.push('No data received');
        return { valid: false, errors, matchCount };
    }
    
    // Supplier-specific validation
    if (supplier === 'tom') {
        if (!data.events && !data.matches) {
            errors.push('Invalid Tom API format - missing events/matches');
        }
        if (data.events && Object.keys(data.events).length === 0) {
            errors.push('Tom data empty - possible API issue');
        }
        // Check if events contain actual matches
        if (data.events) {
            matchCount = Object.values(data.events).reduce((sum, dayMatches) => {
                return sum + (Array.isArray(dayMatches) ? dayMatches.length : 0);
            }, 0);
            if (matchCount === 0) {
                errors.push('Tom data has events but no matches');
            }
        }
    } 
    else if (supplier === 'sarah') {
        if (!Array.isArray(data)) {
            errors.push('Invalid Sarah API format - expected array');
        }
        if (data.length === 0) {
            errors.push('Sarah data empty - no matches found');
        }
        // Check first few items have expected structure
        const sample = data[0];
        if (sample && (!sample.title || !sample.date)) {
            errors.push('Sarah data structure changed - missing title/date fields');
        }
        if (data.length > 1000) {
            console.log(`   ⚠️ Warning: Sarah returned ${data.length} matches (unusually high)`);
        }
        matchCount = data.length;
    }
    else if (supplier === 'wendy') {
        if (!data.matches || !Array.isArray(data.matches)) {
            errors.push('Invalid Wendy API format - missing matches array');
        }
        if (data.matches.length === 0) {
            errors.push('Wendy data empty - no matches found');
        }
        // Check sample match structure
        const sample = data.matches[0];
        if (sample && !sample.title && !sample.teams) {
            errors.push('Wendy data structure changed - missing title/teams');
        }
        matchCount = data.matches.length;
    }
    
    // General data quality checks
    if (typeof data !== 'object') {
        errors.push('Invalid data format - expected object');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        matchCount: matchCount
    };
}

// 🎯 ENHANCED: Professional Cleanup with Size Limits
function cleanupOldBackups() {
    const backupDir = './suppliers/backups';
    if (!fs.existsSync(backupDir)) return;
    
    console.log('🗑️ Cleaning up old backups...');
    
    const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            time: fs.statSync(path.join(backupDir, file)).mtimeMs,
            size: fs.statSync(path.join(backupDir, file)).size
        }))
        .sort((a, b) => b.time - a.time); // Most recent first
    
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // 🎯 KEEP: Most recent 3 backups + any from last 6 hours
    const backupsToKeep = new Set();
    
    // Always keep 3 most recent backups
    files.slice(0, 3).forEach(backup => backupsToKeep.add(backup.name));
    
    // Keep backups from last 6 hours
    files.forEach(backup => {
        if (now - backup.time < (6 * 60 * 60 * 1000)) {
            backupsToKeep.add(backup.name);
        }
    });
    
    let deletedCount = 0;
    let freedSpace = 0;
    
    files.forEach(backup => {
        if (!backupsToKeep.has(backup.name)) {
            try {
                freedSpace += backup.size;
                fs.unlinkSync(backup.path);
                console.log(`   🗑️ Deleted: ${backup.name} (${(backup.size / 1024 / 1024).toFixed(2)} MB)`);
                deletedCount++;
            } catch (error) {
                console.log(`   ❌ Could not delete ${backup.name}: ${error.message}`);
            }
        }
    });
    
    if (deletedCount > 0) {
        console.log(`✅ Cleanup complete: ${deletedCount} old backups deleted, ${(freedSpace / 1024 / 1024).toFixed(2)} MB freed`);
    } else {
        console.log('✅ Cleanup complete: No old backups to delete');
    }
}

// 🎯 ENHANCED: Professional Fetch with Retry Logic
async function fetchWithProfessionalRetry(url, supplierName, maxRetries = 3) {

    // 🎯 WENDY FIX: No retries needed for worker URLs
    if (supplierName === 'wendy' && url.includes('workers.dev')) {
        maxRetries = 1; // Worker either works or doesn't
        console.log(`   🎯 Wendy worker - single attempt`);
    }


    
    let lastError;
    
    // 🎯 WENDY FIX: No retries for Wendy worker URLs
    if (supplierName === 'wendy' && url.includes('workers.dev')) {
        maxRetries = 1; // Wendy worker should work or fail fast
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), supplierName === 'wendy' ? 15000 : 10000);
            
            console.log(`   🔄 Attempt ${attempt}/${maxRetries}: ${new URL(url).hostname}`);
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 
                    'User-Agent': 'Professional-Sports-Pipeline/2.0',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
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
            
            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(`   ⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    throw lastError;
}

// 🎯 ENHANCED: Professional Atomic File Write
function atomicWriteFile(filePath, data) {
    const tempPath = filePath + '.tmp';
    const dataJson = JSON.stringify(data, null, 2);
    
    try {
        // Write to temporary file
        fs.writeFileSync(tempPath, dataJson);
        
        // Verify temporary file
        const tempContent = fs.readFileSync(tempPath, 'utf8');
        if (tempContent !== dataJson) {
            throw new Error('Temporary file content mismatch');
        }
        
        // Atomic rename
        fs.renameSync(tempPath, filePath);
        
        // Verify final file
        const finalContent = fs.readFileSync(filePath, 'utf8');
        if (finalContent !== dataJson) {
            throw new Error('Final file content mismatch');
        }
        
        return true;
    } catch (error) {
        // Clean up temporary file on error
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        throw error;
    }
}

// 🎯 TEMPORARY DEBUG FUNCTION FOR WENDY
async function testWendyWorker() {
    console.log('🧪 TESTING WENDY WORKER DIRECTLY...');
    try {
        const response = await fetch('https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/api/wendy/all');
        console.log(`   HTTP Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
            console.log(`   Data keys: ${Object.keys(data)}`);
            
            if (Array.isArray(data)) {
                console.log(`   Array length: ${data.length}`);
                if (data.length > 0) {
                    console.log('   First item keys:', Object.keys(data[0]));
                    console.log('   First item sample:', {
                        title: data[0].title,
                        sport: data[0].sportCategory,
                        streams: data[0].streams ? data[0].streams.length : 0
                    });
                }
            } else if (data.matches) {
                console.log(`   Matches length: ${data.matches.length}`);
                if (data.matches.length > 0) {
                    console.log('   First match keys:', Object.keys(data.matches[0]));
                }
            } else if (data.data) {
                console.log(`   Data array length: ${data.data.length}`);
            }
            
            // Show full response structure for debugging
            console.log('   Full response sample:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
        } else {
            console.log(`   ❌ Worker returned HTTP ${response.status}`);
        }
    } catch (error) {
        console.log(`   💥 Worker test failed: ${error.message}`);
    }
}
// 🎯 ENHANCED: Main update function with professional features
async function updateAllSuppliers() {
    console.log('🔒 PROFESSIONAL SUPPLIER UPDATE - STARTING\n');
    console.log('⏰', new Date().toISOString(), '\n');

       // 🎯 TEMPORARY: Test Wendy worker before proceeding
   // await testWendyWorker();
   // console.log('\n'); // Add space after test
    
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
                const checksum = crypto.createHash('md5').update(JSON.stringify(events)).digest('hex');
                
                return {
                    events: events,
                    _metadata: {
                        supplier: 'tom',
                        lastUpdated: new Date().toISOString(),
                        matchCount: matchCount,
                        days: data.events ? Object.keys(data.events).length : 0,
                        dataHash: checksum,
                        professional: true,
                        version: '2.0'
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
                const checksum = crypto.createHash('md5').update(JSON.stringify(matches)).digest('hex');
                
                return {
                    matches: matches,
                    _metadata: {
                        supplier: 'sarah',
                        lastUpdated: new Date().toISOString(), 
                        matchCount: matches.length,
                        liveMatches: liveMatches,
                        dataHash: checksum,
                        professional: true,
                        version: '2.0'
                    }
                };
            }
        },
{
    name: 'wendy',
    urls: [
        'https://9kilos-proxy.mandiyandiyakhonyana.workers.dev/api/wendy/all'
    ],
    processor: (data) => {
        console.log('🔍 WENDY DATA RECEIVED - Format: Direct Array');
        console.log(`   Raw data length: ${Array.isArray(data) ? data.length : 'Not array'}`);
        
        // 🎯 WENDY IS RETURNING DIRECT ARRAY - NO NEED FOR COMPLEX EXTRACTION
        const matches = Array.isArray(data) ? data : [];
        
        console.log(`   Processing ${matches.length} matches`);
        
        if (matches.length > 0) {
            console.log('   First match sample:', {
                title: matches[0].title,
                sport: matches[0].sport,
                streams: matches[0].streams ? matches[0].streams.length : 0,
                date: matches[0].date
            });
        }
        
        const matchesWithStreams = matches.filter(m => m.streams && m.streams.length > 0).length;
        const checksum = crypto.createHash('md5').update(JSON.stringify(matches)).digest('hex');
        
        return {
            matches: matches,
            _metadata: {
                supplier: 'wendy',
                lastUpdated: new Date().toISOString(),
                matchCount: matches.length,
                matchesWithStreams: matchesWithStreams,
                totalStreams: matches.reduce((sum, m) => sum + (m.streams ? m.streams.length : 0), 0),
                dataHash: checksum,
                professional: true,
                version: '2.0'
            }
        };
    }
}
        ];

const results = {
    startTime: new Date().toISOString(),
    professional: true,
    version: '2.0',
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
    console.log('🔌 PROFESSIONAL CIRCUIT BREAKER STATUS:');
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
        const status = breaker.state === 'OPEN' ? '🔴 OPEN' : '🟢 CLOSED';
        console.log(`   ${name}: ${status} (failures: ${breaker.failures})`);
        results.circuitBreakers[name] = breaker.getStatus();
    });
    console.log('');

    // 🎯 PROCESS SUPPLIERS WITH PROFESSIONAL ERROR HANDLING
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
                    skipped: true,
                    circuitBreaker: circuitBreaker.getStatus()
                };
                return;
            }

            // 🎯 CREATE VERIFIED BACKUP BEFORE UPDATE
            const backupResult = createVerifiedBackup(supplier.name);
            
            let success = false;
            let restored = false;
            let lastError = null;
            
            // 🎯 ATTEMPT TO FETCH FRESH DATA
            for (const [index, url] of supplier.urls.entries()) {
                try {
                    const rawData = await fetchWithProfessionalRetry(url, supplier.name);
                    
                    // 🎯 VALIDATE DATA BEFORE PROCESSING
                    const validation = validateSupplierData(rawData, supplier.name);
                    if (!validation.valid) {
                        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
                    }
                    
                    const processedData = supplier.processor(rawData);
                    
                    // 🎯 ATOMIC WRITE OF NEW DATA
                    atomicWriteFile(
                        `./suppliers/${supplier.name}-data.json`, 
                        processedData
                    );
                    
                    console.log(`   ✅ PROFESSIONAL UPDATE: ${supplier.name}`);
                    console.log(`   📊 Matches: ${processedData._metadata.matchCount}`);
                    console.log(`   🔒 Checksum: ${processedData._metadata.dataHash.substring(0, 16)}...`);
                    
                    results.updated.push(supplier.name);
                    results.details[supplier.name] = {
                        success: true,
                        matchCount: processedData._metadata.matchCount,
                        source: new URL(url).hostname,
                        dataHash: processedData._metadata.dataHash,
                        backup: backupResult ? path.basename(backupResult.path) : null,
                        professional: true
                    };
                    
                    circuitBreaker.recordSuccess();
                    results.integrity.successful++;
                    success = true;
                    break; // Success - exit proxy loop
                    
                } catch (error) {
                    lastError = error;
                    console.log(`   ❌ Proxy failed: ${error.message}`);
                    continue; // Try next proxy
                }
            }
            
            // 🎯 HANDLE FAILURE WITH PROFESSIONAL RECOVERY
            if (!success) {
                console.log(`   🚨 ALL PROXIES FAILED for ${supplier.name}`);
                circuitBreaker.recordFailure();
                
                const recoveryResult = restoreFromBackup(supplier.name);
                restored = recoveryResult.recovered;
                
                if (restored) {
                    results.integrity.recovered++;
                    console.log(`   ✅ Professional recovery successful for ${supplier.name}`);
                } else {
                    results.integrity.failed++;
                    console.log(`   💥 Professional recovery failed for ${supplier.name}`);
                }
                
                results.failed.push(supplier.name);
                results.details[supplier.name] = {
                    success: false,
                    error: lastError?.message || 'All proxies failed',
                    restored: restored,
                    recoveryDetails: restored ? recoveryResult : null,
                    circuitBreaker: circuitBreaker.getStatus(),
                    backupAttempted: !!backupResult
                };
            }
            
        } catch (supplierError) {
            console.log(`💥 UNEXPECTED ERROR processing ${supplier.name}:`, supplierError.message);
            results.failed.push(supplier.name);
            results.integrity.failed++;
            results.details[supplier.name] = {
                success: false,
                error: `Unexpected error: ${supplierError.message}`,
                circuitBreaker: 'UNKNOWN'
            };
        }
    }));

    // 🎯 GENERATE PROFESSIONAL SUMMARY
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime) - new Date(results.startTime);
    
    console.log('\n📊 PROFESSIONAL UPDATE SUMMARY:');
    console.log('══════════════════════════════════════');
    console.log(`✅ Updated: ${results.updated.length > 0 ? results.updated.join(', ') : 'None'}`);
    console.log(`⚡ Skipped: ${results.skipped.length > 0 ? results.skipped.join(', ') : 'None'}`);
    console.log(`❌ Failed: ${results.failed.length > 0 ? results.failed.join(', ') : 'None'}`);
    console.log(`🔄 Recovered: ${results.integrity.recovered}`);
    console.log(`⏱️  Duration: ${results.duration}ms`);
    console.log(`📈 Success Rate: ${((results.integrity.successful / results.integrity.totalAttempted) * 100).toFixed(1)}%`);
    
    // 🎯 CIRCUIT BREAKER STATUS
    console.log('\n🔌 FINAL CIRCUIT BREAKER STATUS:');
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
        const status = breaker.state === 'OPEN' ? '🔴 OPEN' : '🟢 CLOSED';
        console.log(`   ${name}: ${status} (failures: ${breaker.failures}, recoveries: ${breaker.recoveryAttempts})`);
    });
    
    // 🎯 DETAILED RESULTS
    console.log('\n🔍 PROFESSIONAL DETAILS:');
    Object.entries(results.details).forEach(([supplier, detail]) => {
        if (detail.success) {
            console.log(`   ${supplier}: ${detail.matchCount} matches via ${detail.source}`);
            console.log(`        Checksum: ${detail.dataHash?.substring(0, 16)}...`);
            console.log(`        Backup: ${detail.backup || 'None'}`);
        } else if (detail.skipped) {
            console.log(`   ${supplier}: SKIPPED (circuit breaker)`);
        } else if (detail.restored) {
            console.log(`   ${supplier}: RECOVERED from backup`);
            console.log(`        Backup: ${detail.recoveryDetails.backupFile}`);
        } else {
            console.log(`   ${supplier}: FAILED - ${detail.error}`);
        }
    });
    
    console.log('══════════════════════════════════════\n');
    
    // 🎯 ALERT ON DATA ANOMALIES
    alertOnDataAnomalies(results);
    
    // 🎯 WRITE PROFESSIONAL RESULTS
    fs.writeFileSync('./suppliers/update-results.json', JSON.stringify(results, null, 2));
    
    // 🎯 CLEANUP OLD BACKUPS
    cleanupOldBackups();
    
    return results;
}

// 🎯 KEEP YOUR EXISTING alertOnDataAnomalies AND getPreviousResults FUNCTIONS
function alertOnDataAnomalies(results) {
    const previousResults = getPreviousResults();
    
    Object.entries(results.details).forEach(([supplier, detail]) => {
        if (detail.success && previousResults.details?.[supplier]?.success) {
            const previousCount = previousResults.details[supplier].matchCount;
            const currentCount = detail.matchCount;
            const change = Math.abs(currentCount - previousCount);
            const changePercent = (change / previousCount) * 100;
            
            if (changePercent > 50) {
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
// Run if called directly
if (require.main === module) {
    updateAllSuppliers().catch(error => {
        console.error('💥 PROFESSIONAL UPDATE FAILED:', error);
        process.exit(1);
    });
}

module.exports = { updateAllSuppliers, ProfessionalCircuitBreaker };
