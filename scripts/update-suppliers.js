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
        // Wendy returns array of matches directly
        if (!Array.isArray(data)) {
            errors.push('Wendy should return direct array of matches');
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
    if (supplierName === 'wendy') {
        maxRetries = 2; // Wendy is less reliable, fewer retries
    }
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), supplierName === 'wendy' ? 15000 : 10000);
            
            console.log(`   🔄 Attempt ${attempt}/${maxRetries}: ${new URL(url).hostname}`);
            
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

// 🎯 WENDY HELPER FUNCTIONS
async function fetchWendySports() {
    try {
        const url = 'https://api.watchfooty.st/api/v1/sports';
        console.log(`   🔄 Fetching Wendy sports list from: ${new URL(url).hostname}`);
        
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const sports = await response.json();
        
        // Filter to popular sports only
        const popularSports = ['football', 'basketball', 'tennis', 'hockey', 'baseball', 'rugby'];
        return sports.filter(sport => 
            popularSports.includes(sport.name) || 
            sport.displayName?.toLowerCase().includes('football')
        ).slice(0, 3); // Limit to 3 sports
        
    } catch (error) {
        console.log(`   ❌ Failed to fetch Wendy sports: ${error.message}`);
        
        // Return minimal fallback sports
        return [
            { name: 'football', displayName: 'Football' },
            { name: 'basketball', displayName: 'Basketball' }
        ];
    }
}

async function fetchWendyMatchesForSport(sport) {
    try {
        const url = `https://api.watchfooty.st/api/v1/matches/${sport}`;
        console.log(`   🔄 Fetching Wendy ${sport} matches`);
        
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const matches = await response.json();
        
        if (!Array.isArray(matches)) {
            return [];
        }
        
        // Enhance matches with source info
        return matches.map(match => ({
            ...match,
            source: 'wendy',
            sportCategory: sport
        }));
        
    } catch (error) {
        console.log(`   ❌ Failed to fetch Wendy ${sport} matches: ${error.message}`);
        return [];
    }
}

async function fetchWendyAllMatches() {
    try {
        // Get sports list
        const sports = await fetchWendySports();
        
        if (sports.length === 0) {
            throw new Error('No sports available from Wendy');
        }
        
        console.log(`   Found ${sports.length} sports: ${sports.map(s => s.displayName).join(', ')}`);
        
        // Fetch matches for each sport in parallel
        const matchPromises = sports.map(sport => 
            fetchWendyMatchesForSport(sport.name)
        );
        
        const results = await Promise.allSettled(matchPromises);
        
        // Combine all matches
        const allMatches = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);
        
        console.log(`   ✅ Total Wendy matches: ${allMatches.length}`);
        return allMatches;
        
    } catch (error) {
        console.log(`   ❌ Wendy all matches failed: ${error.message}`);
        throw error;
    }
}

// 🎯 SUPPLIER CONFIGURATION - UPDATED FOR NEW WENDY API
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
            // Direct Wendy API endpoints
            'https://api.watchfooty.st/api/v1/sports',
            'https://corsproxy.io/?https://api.watchfooty.st/api/v1/sports'
        ],
        processor: async (data) => {
            try {
                // Wendy returns sports list, we need to fetch matches for each sport
                let sports = data;
                
                if (!Array.isArray(sports) || sports.length === 0) {
                    // If no sports returned, use fallback
                    sports = [
                        { name: 'football', displayName: 'Football' },
                        { name: 'basketball', displayName: 'Basketball' }
                    ];
                }
                
                // Limit to 3 sports for performance
                const sportsToFetch = sports.slice(0, 3);
                
                const allMatches = [];
                
                for (const sport of sportsToFetch) {
                    try {
                        const matchesUrl = `https://api.watchfooty.st/api/v1/matches/${sport.name}`;
                        const response = await fetch(matchesUrl, {
                            signal: AbortSignal.timeout(8000)
                        });
                        
                        if (response.ok) {
                            const matches = await response.json();
                            
                            if (Array.isArray(matches)) {
                                matches.forEach(match => {
                                    match.sportCategory = sport.name;
                                    match.source = 'wendy';
                                });
                                allMatches.push(...matches);
                                console.log(`   ✅ Wendy ${sport.displayName}: ${matches.length} matches`);
                            }
                        }
                    } catch (sportError) {
                        console.log(`   ❌ Wendy ${sport.displayName}: ${sportError.message}`);
                    }
                }
                
                const checksum = crypto.createHash('md5').update(JSON.stringify(allMatches)).digest('hex');
                
                return {
                    matches: allMatches,
                    _metadata: {
                        supplier: 'wendy',
                        lastUpdated: new Date().toISOString(),
                        matchCount: allMatches.length,
                        sportsFetched: sportsToFetch.length,
                        dataHash: checksum,
                        professional: true
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

    // 🎯 PROCESS SUPPLIERS SEQUENTIALLY (better error handling)
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
            
            // 🎯 ATTEMPT TO FETCH FRESH DATA
            for (const url of supplier.urls) {
                try {
                    const rawData = await fetchWithProfessionalRetry(url, supplier.name);
                    
                    // 🎯 PROCESS DATA (special handling for Wendy async processor)
                    let processedData;
                    if (supplier.name === 'wendy' && typeof supplier.processor === 'function') {
                        // Wendy processor is async
                        processedData = await supplier.processor(rawData);
                    } else {
                        // Tom and Sarah have sync processors
                        processedData = supplier.processor(rawData);
                    }
                    
                    // 🎯 VALIDATE DATA
                    const validation = validateSupplierData(
                        supplier.name === 'wendy' ? processedData.matches : processedData, 
                        supplier.name
                    );
                    
                    if (!validation.valid) {
                        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
                    }
                    
                    // 🎯 ATOMIC WRITE
                    const tempPath = `./suppliers/${supplier.name}-data.json.tmp`;
                    const finalPath = `./suppliers/${supplier.name}-data.json`;
                    
                    fs.writeFileSync(tempPath, JSON.stringify(processedData, null, 2));
                    fs.renameSync(tempPath, finalPath);
                    
                    console.log(`   ✅ ${supplier.name}: ${validation.matchCount} matches`);
                    
                    results.updated.push(supplier.name);
                    results.details[supplier.name] = {
                        success: true,
                        matchCount: validation.matchCount,
                        source: new URL(url).hostname,
                        dataHash: processedData._metadata?.dataHash || 'N/A',
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
        
        // Small delay between suppliers to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

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
    console.log(`📈 Success Rate: ${results.integrity.totalAttempted > 0 ? 
        ((results.integrity.successful / results.integrity.totalAttempted) * 100).toFixed(1) : 0}%`);
    
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

module.exports = { 
    updateAllSuppliers, 
    ProfessionalCircuitBreaker,
    fetchWendyAllMatches,
    fetchWendySports
};
