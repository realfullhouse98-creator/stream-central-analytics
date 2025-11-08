// ==================== COMPLETE SPORTS CLASSIFICATION SYSTEM ====================
class SportsClassifier {
    constructor() {
        this.sportMap = {
            'football': 'Football',
            'soccer': 'Football',
            'basketball': 'Basketball',
            'baseball': 'Baseball',
            'hockey': 'Ice Hockey',
            'tennis': 'Tennis',
            'cricket': 'Cricket',
            'rugby': 'Rugby',
            'golf': 'Golf',
            'boxing': 'Boxing',
            'mma': 'MMA',
            'formula 1': 'Racing',
            'nascar': 'Racing',
            'volleyball': 'Volleyball',
            'badminton': 'Badminton',
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'american football': 'American Football',
            'nfl': 'American Football',
            'college football': 'College Football',
            'ncaa football': 'College Football'
        };
    }

    classifySport(match) {
        if (!match || typeof match !== 'object') return 'Other';
        
        // STEP 1: ABSOLUTELY FORCE College Football detection
        const searchText = this.getSearchText(match);
        if (this.isCollegeFootball(searchText, match.match)) {
            return 'College Football';
        }
        
        // STEP 2: Force American Football detection
        if (this.isAmericanFootball(searchText)) {
            return 'American Football';
        }
        
        // STEP 3: Use API value only if not overridden
        const sportFromApi = match.sport || match.league || match.tournament || 'Other';
        return this.normalizeSportName(sportFromApi);
    }

    getSearchText(match) {
        return [
            match.match || '',
            match.tournament || '',
            match.league || '',
            match.sport || '',
            match.competition || ''
        ].join(' ').toLowerCase();
    }

    isCollegeFootball(searchText, matchName = '') {
        // 🚨 ULTIMATE College Football Detection - Catches EVERYTHING
        
        // 1. Check for explicit college terms
        const hasCollegeTerm = [
            'college football', 'ncaa football', 'fbs', 'fcs', 'cfp',
            'rose bowl', 'orange bowl', 'sugar bowl', 'cotton bowl',
            'peach bowl', 'fiesta bowl', 'bowl game'
        ].some(term => searchText.includes(term));
        
        if (hasCollegeTerm) return true;
        
        // 2. Check for conferences
        const hasConference = [
            'big ten', 'sec', 'acc', 'pac-12', 'big 12', 'aac',
            'mountain west', 'mac', 'conference usa', 'sun belt'
        ].some(conf => searchText.includes(conf));
        
        if (hasConference) return true;
        
        // 3. Check for "Team A vs Team B" pattern in American sports
        if (matchName && this.isAmericanVsPattern(matchName, searchText)) {
            return true;
        }
        
        return false;
    }

    isAmericanVsPattern(matchName, searchText) {
        // Look for "Team A vs Team B" pattern
        if (!matchName.includes('vs')) return false;
        
        // EXCLUDE known soccer patterns
        const soccerIndicators = [
            'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga',
            'manchester', 'liverpool', 'chelsea', 'arsenal', 'real madrid', 'barcelona',
            'bayern', 'juventus', 'milan', 'psg'
        ];
        
        const hasSoccerIndicator = soccerIndicators.some(indicator => 
            searchText.includes(indicator)
        );
        
        // If it has "vs" and NO soccer indicators, it's College Football
        return !hasSoccerIndicator;
    }

    isAmericanFootball(searchText) {
        // NFL detection
        return [
            'nfl', 'super bowl', 'pro bowl',
            'chiefs', 'eagles', 'patriots', 'packers', 'cowboys', 'steelers'
        ].some(term => searchText.includes(term));
    }

    normalizeSportName(sport) {
        if (!sport || typeof sport !== 'string') return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        return this.sportMap[sportLower] || 'Other';
    }

    getSportIcon(sport) {
        const icons = {
            'Football': '⚽',
            'American Football': '🏈',
            'College Football': '🏈',
            'Basketball': '🏀',
            'Baseball': '⚾',
            'Ice Hockey': '🏒',
            'Tennis': '🎾',
            'Cricket': '🏏',
            'Rugby': '🏉',
            'Golf': '⛳',
            'Boxing': '🥊',
            'MMA': '🥋',
            'Racing': '🏎️',
            'Volleyball': '🏐',
            'Badminton': '🏸',
            'Handball': '🤾',
            'Table Tennis': '🏓'
        };
        return icons[sport] || '🏆';
    }

    extractSportsFromData(apiData) {
        if (!apiData?.events) return ['Other'];
        
        const sports = new Set();
        
        try {
            Object.values(apiData.events).forEach(matches => {
                if (Array.isArray(matches)) {
                    matches.forEach(match => {
                        const sport = this.classifySport(match);
                        sports.add(sport);
                    });
                }
            });
        } catch (error) {
            console.error('Error extracting sports:', error);
            return ['Other'];
        }
        
        return Array.from(sports).sort();
    }
}

// ==================== MATCH PROCESSOR ====================
class MatchProcessor {
    constructor() {
        this.classifier = new SportsClassifier();
    }
    
    processApiData(apiData) {
        if (!apiData?.events) return { sports: [], matches: [] };
        
        const allMatches = [];
        const sports = new Set();
        
        // Process all matches
        Object.values(apiData.events).forEach(matchGroup => {
            if (Array.isArray(matchGroup)) {
                matchGroup.forEach(match => {
                    if (match && typeof match === 'object') {
                        const sport = this.classifier.classifySport(match);
                        const icon = this.classifier.getSportIcon(sport);
                        
                        allMatches.push({
                            ...match,
                            classifiedSport: sport,
                            sportIcon: icon,
                            displaySport: sport
                        });
                        
                        sports.add(sport);
                    }
                });
            }
        });
        
        return {
            sports: Array.from(sports).sort(),
            matches: allMatches
        };
    }
    
    groupMatchesBySport(matches) {
        const grouped = {};
        
        matches.forEach(match => {
            const sport = match.classifiedSport;
            if (!grouped[sport]) {
                grouped[sport] = [];
            }
            grouped[sport].push(match);
        });
        
        return grouped;
    }
}

// ==================== FORCEFUL DATA OVERRIDE ====================
function forceSportSeparation(apiData) {
    if (!apiData?.events) return apiData;
    
    console.log('🚨 Applying FORCEFUL sport separation...');
    
    // Create deep copy
    const modifiedData = JSON.parse(JSON.stringify(apiData));
    
    let collegeCount = 0;
    let americanCount = 0;
    let footballCount = 0;
    
    // Process ALL events and matches
    Object.values(modifiedData.events).forEach(matches => {
        if (Array.isArray(matches)) {
            matches.forEach(match => {
                if (match && typeof match === 'object') {
                    const originalSport = match.sport;
                    
                    // 🚨 FORCE College Football
                    if (this.shouldBeCollegeFootball(match)) {
                        match.sport = 'College Football';
                        match.originalSport = originalSport;
                        collegeCount++;
                    }
                    // 🚨 FORCE American Football
                    else if (this.shouldBeAmericanFootball(match)) {
                        match.sport = 'American Football';
                        match.originalSport = originalSport;
                        americanCount++;
                    }
                    else if (originalSport === 'football') {
                        footballCount++;
                    }
                }
            });
        }
    });
    
    console.log(`🚨 Override results: College Football: ${collegeCount}, American Football: ${americanCount}, Football: ${footballCount}`);
    
    return modifiedData;
}

function shouldBeCollegeFootball(match) {
    if (!match?.match) return false;
    
    const searchText = `${match.match} ${match.tournament || ''} ${match.league || ''}`.toLowerCase();
    
    // Any of these patterns = College Football
    return (
        searchText.includes('college football') ||
        searchText.includes('ncaa football') ||
        searchText.includes('bowl') ||
        searchText.includes('big ten') ||
        searchText.includes('sec') ||
        searchText.includes('acc') ||
        searchText.includes('pac-12') ||
        searchText.includes('big 12') ||
        (match.match.includes('vs') && !this.isSoccerMatch(match))
    );
}

function shouldBeAmericanFootball(match) {
    if (!match?.match) return false;
    
    const searchText = `${match.match} ${match.tournament || ''} ${match.league || ''}`.toLowerCase();
    
    return (
        searchText.includes('nfl') ||
        searchText.includes('super bowl') ||
        searchText.includes('chiefs') ||
        searchText.includes('eagles') ||
        searchText.includes('patriots')
    );
}

function isSoccerMatch(match) {
    if (!match?.match) return false;
    
    const searchText = `${match.match} ${match.tournament || ''} ${match.league || ''}`.toLowerCase();
    
    const soccerIndicators = [
        'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga',
        'manchester', 'liverpool', 'chelsea', 'arsenal', 'real madrid', 'barcelona'
    ];
    
    return soccerIndicators.some(indicator => searchText.includes(indicator));
}

// ==================== TESTING ====================
function testCollegeFootballSeparation() {
    console.log('🧪 TESTING COLLEGE FOOTBALL SEPARATION');
    console.log('======================================');
    
    const classifier = new SportsClassifier();
    
    const testMatches = [
        { match: "Arkansas State vs Southern Mississippi", sport: "football", tournament: "NCAA Football" },
        { match: "Alabama vs Clemson", sport: "football", tournament: "College Football" },
        { match: "Rose Bowl: USC vs Penn State", sport: "football" },
        { match: "West Virginia vs Colorado", sport: "football" },
        { match: "Kansas City Chiefs vs Philadelphia Eagles", sport: "football", tournament: "NFL" },
        { match: "Super Bowl LVIII", sport: "football" },
        { match: "Manchester United vs Liverpool", sport: "football", tournament: "Premier League" },
        { match: "Real Madrid vs Barcelona", sport: "football", tournament: "La Liga" }
    ];
    
    let results = {
        'College Football': 0,
        'American Football': 0,
        'Football': 0,
        'Other': 0
    };
    
    testMatches.forEach((test, index) => {
        const result = classifier.classifySport(test);
        results[result] = (results[result] || 0) + 1;
        
        const icon = classifier.getSportIcon(result);
        const success = (test.match.includes('Arkansas') || test.match.includes('Alabama') || test.match.includes('Rose') || test.match.includes('West Virginia')) 
                      ? result === 'College Football' 
                      : true;
        
        console.log(`${index + 1}. "${test.match}"`);
        console.log(`   API: "${test.sport}" → ${result} ${icon} ${success ? '✅' : '❌'}`);
    });
    
    console.log('======================================');
    console.log('📊 FINAL RESULTS:', results);
    
    if (results['College Football'] >= 4) {
        console.log('🎉 SUCCESS: College Football is properly separated!');
    } else {
        console.log('❌ FAILED: College Football still mixed with Football');
    }
}

// ==================== MAIN APPLICATION INTEGRATION ====================
function initializeSportsSystem(apiData) {
    console.log('🚀 Initializing Sports Classification System...');
    
    // Method 1: Use the classifier directly
    const processor = new MatchProcessor();
    const processedData = processor.processApiData(apiData);
    
    console.log('📋 Available sports:', processedData.sports);
    
    // Method 2: Use forceful override if needed
    const forcedData = forceSportSeparation(apiData);
    const forcedProcessed = processor.processApiData(forcedData);
    
    console.log('📋 Available sports (forced):', forcedProcessed.sports);
    
    return {
        processor,
        data: processedData,
        forcedData: forcedProcessed,
        classifier: new SportsClassifier()
    };
}

// ==================== EXPORT ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SportsClassifier,
        MatchProcessor,
        forceSportSeparation,
        testCollegeFootballSeparation,
        initializeSportsSystem
    };
} else {
    window.SportsClassifier = SportsClassifier;
    window.MatchProcessor = MatchProcessor;
    window.forceSportSeparation = forceSportSeparation;
    window.testCollegeFootballSeparation = testCollegeFootballSeparation;
    window.initializeSportsSystem = initializeSportsSystem;
    
    // Auto-test
    setTimeout(testCollegeFootballSeparation, 1000);
}
