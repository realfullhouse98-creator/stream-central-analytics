// scripts/debug-sports.js
const fs = require('fs');

async function debugSports() {
    console.log('🎯 CHECKING WHAT SPORTS EXIST IN DATA...\n');
    
    try {
        // Check Tom's sports
        const tomData = JSON.parse(fs.readFileSync('./suppliers/tom-data.json', 'utf8'));
        const tomSports = new Set();

        Object.values(tomData.events || {}).forEach(dayMatches => {
            dayMatches.forEach(match => {
                if (match.sport) tomSports.add(match.sport);
            });
        });

        console.log('🏆 TOM SPORTS:');
        console.log(Array.from(tomSports).sort());

        // Check Sarah's categories  
        const sarahData = JSON.parse(fs.readFileSync('./suppliers/sarah-data.json', 'utf8'));
        const sarahCategories = new Set();

        (sarahData.matches || []).forEach(match => {
            if (match.category) sarahCategories.add(match.category);
        });

        console.log('\n🏆 SARAH CATEGORIES:');
        console.log(Array.from(sarahCategories).sort());
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    debugSports();
}

module.exports = debugSports;
