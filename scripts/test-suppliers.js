const fs = require('fs');

function testSuppliers() {
    console.log('🧪 TESTING SUPPLIER FILES...\n');
    
    const suppliers = ['tom', 'sarah'];
    let allValid = true;
    
    suppliers.forEach(supplier => {
        try {
            const filePath = `./suppliers/${supplier}-data.json`;
            if (!fs.existsSync(filePath)) {
                console.log(`❌ ${supplier}: File missing`);
                allValid = false;
                return;
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const metadata = data._metadata;
            
            if (metadata) {
                console.log(`✅ ${supplier.toUpperCase()}:`);
                console.log(`   📅 Updated: ${metadata.lastUpdated}`);
                console.log(`   🔢 Matches: ${metadata.matchCount}`);
                if (metadata.days) console.log(`   📅 Days: ${metadata.days}`);
                if (metadata.liveMatches) console.log(`   🔴 Live: ${metadata.liveMatches}`);
            } else {
                console.log(`⚠️  ${supplier}: No metadata found`);
            }
            
        } catch (error) {
            console.log(`❌ ${supplier}: Invalid JSON - ${error.message}`);
            allValid = false;
        }
    });
    
    console.log(`\n${allValid ? '🎉 ALL SUPPLIERS VALID' : '❌ SOME SUPPLIERS INVALID'}`);
    return allValid;
}

if (require.main === module) {
    testSuppliers();
}

module.exports = { testSuppliers };
