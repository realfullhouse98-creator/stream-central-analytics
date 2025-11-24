// Test Suppliers

const fs = require('fs');

async function testSportsProcessor() {
    console.log('🧪 TESTING ENHANCED SPORTS PROCESSOR...\n');
    
    const testStartTime = Date.now();
    let testResults = {
        test_start: new Date().toISOString(),
        stages: {},
        success: false,
        duration: 0
    };
    
    try {
        // Stage 1: Check required files
        console.log('📋 STAGE 1: Checking required files...');
        testResults.stages.file_check = await checkRequiredFiles();
        
        // Stage 2: Run sports processor
        console.log('\n🚀 STAGE 2: Starting sports processor...');
        testResults.stages.processor = await runSportsProcessor();
        
        // Stage 3: Validate output
        console.log('\n✅ STAGE 3: Validating output...');
        testResults.stages.validation = await validateOutput();
        
        testResults.success = true;
        testResults.duration = Date.now() - testStartTime;
        
        console.log('\n🎯 ENHANCED TEST COMPLETED SUCCESSFULLY!');
        console.log(`⏱️  Total test duration: ${testResults.duration}ms`);
        
        return testResults;
        
    } catch (error) {
        testResults.success = false;
        testResults.error = error.message;
        testResults.duration = Date.now() - testStartTime;
        
        console.error('\n❌ ENHANCED TEST FAILED:', error);
        throw error;
    }
}

async function checkRequiredFiles() {
    const requiredFiles = [
        './suppliers/tom-data.json',
        './suppliers/sarah-data.json',
        './suppliers/supplier-config.js',
        './scripts/simple-sports-processor.js'
    ];
    
    const results = {
        missing: [],
        valid: [],
        total: requiredFiles.length
    };
    
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            try {
                // Basic file validation
                if (file.endsWith('.json')) {
                    const content = fs.readFileSync(file, 'utf8');
                    JSON.parse(content); // Validate JSON
                }
                results.valid.push(file);
                console.log(`   ✅ ${file}`);
            } catch (error) {
                results.missing.push(`${file} (invalid JSON)`);
                console.log(`   ❌ ${file} - invalid format`);
            }
        } else {
            results.missing.push(file);
            console.log(`   ❌ ${file} - not found`);
        }
    }
    
    if (results.missing.length > 0) {
        throw new Error(`Missing or invalid files: ${results.missing.join(', ')}`);
    }
    
    return results;
}

async function runSportsProcessor() {
    const { spawnSync } = require('child_process');
    
    const result = spawnSync('node', ['scripts/simple-sports-processor.js'], {
        stdio: 'inherit',
        encoding: 'utf-8',
        timeout: 120000 // 2 minute timeout
    });
    
    if (result.status !== 0) {
        throw new Error(`Sports processor failed with exit code: ${result.status}`);
    }
    
    console.log('✅ Sports processor execution completed');
    return { exit_code: result.status, signal: result.signal };
}

async function validateOutput() {
    const resultsPath = './master-data.json';
    if (!fs.existsSync(resultsPath)) {
        throw new Error('Master data file was not generated');
    }
    
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const validation = {
        file_exists: true,
        has_required_fields: true,
        match_count: results.matches?.length || 0,
        data_quality: {}
    };
    
    // Check required fields
    const requiredFields = ['processed_at', 'matches'];
    requiredFields.forEach(field => {
        if (!(field in results)) {
            validation.has_required_fields = false;
            throw new Error(`Missing required field: ${field}`);
        }
    });
    
    // Basic data quality checks
    if (results.matches) {
        validation.data_quality.total_matches = results.matches.length;
        validation.data_quality.matches_with_sport = results.matches.filter(m => m.sport).length;
        validation.data_quality.matches_with_timestamp = results.matches.filter(m => m.unix_timestamp).length;
        validation.data_quality.merged_matches = results.matches.filter(m => m.merged).length;
        
        // Check for obvious data issues
        const emptyMatches = results.matches.filter(m => !m.match || m.match.trim() === '');
        if (emptyMatches.length > 0) {
            console.log(`   ⚠️  Found ${emptyMatches.length} matches with empty team names`);
        }
    }
    
    console.log('🔍 OUTPUT VALIDATION:');
    console.log(`   📊 Total matches: ${validation.match_count}`);
    console.log(`   🏆 Matches with sport: ${validation.data_quality.matches_with_sport}`);
    console.log(`   ⏱️  Matches with timestamp: ${validation.data_quality.matches_with_timestamp}`);
    console.log(`   🔄 Merged matches: ${validation.data_quality.merged_matches}`);
    
    // Show sample of processed data
    console.log('\n🔍 SAMPLE PROCESSED MATCHES:');
    if (results.matches && results.matches.length > 0) {
        results.matches.slice(0, 3).forEach((match, index) => {
            console.log(`   ${index + 1}. ${match.sport}: ${match.match}`);
            console.log(`      Sources: ${match.sources?.join(', ')}`);
            console.log(`      Merged: ${match.merged} | Channels: ${match.channels?.length}`);
        });
    }
    
    return validation;
}

// Only run if called directly
if (require.main === module) {
    testSportsProcessor()
        .then(results => {
            // Save test results
            if (!fs.existsSync('./sports-results')) {
                fs.mkdirSync('./sports-results', { recursive: true });
            }
            fs.writeFileSync('./sports-results/test-results.json', JSON.stringify(results, null, 2));
            console.log('💾 Test results saved to sports-results/test-results.json');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Enhanced test runner failed:', error);
            process.exit(1);
        });
}

module.exports = testSportsProcessor;
