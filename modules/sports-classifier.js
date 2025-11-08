// Sports Classification Module - Complete Version
class SportsClassifier {
    constructor() {
        this.sportMap = {
            // Football/Soccer
            'football': 'Football',
            'soccer': 'Football',
            'premier league': 'Football',
            'champions league': 'Football',
            'la liga': 'Football',
            'serie a': 'Football',
            'bundesliga': 'Football',
            'ligue 1': 'Football',
            'europa league': 'Football',
            'fa cup': 'Football',
            'copa del rey': 'Football',
            'world cup': 'Football',
            
            // American Football
            'american football': 'American Football', 
            'nfl': 'American Football',
            'super bowl': 'American Football',
            'pro bowl': 'American Football',
            
            // College Football - SEPARATE CATEGORY
            'college football': 'College Football',
            'ncaa football': 'College Football',
            'college bowl': 'College Football',
            
            // Basketball
            'basketball': 'Basketball',
            'nba': 'Basketball',
            'euroleague': 'Basketball',
            'wnba': 'Basketball',
            'march madness': 'Basketball',
            
            // Baseball
            'baseball': 'Baseball',
            'mlb': 'Baseball',
            'world series': 'Baseball',
            
            // Hockey
            'hockey': 'Ice Hockey',
            'ice hockey': 'Ice Hockey',
            'nhl': 'Ice Hockey',
            
            // Tennis
            'tennis': 'Tennis',
            'wimbledon': 'Tennis',
            'us open': 'Tennis',
            'australian open': 'Tennis',
            'french open': 'Tennis',
            
            // Cricket
            'cricket': 'Cricket',
            'test cricket': 'Cricket',
            'odi': 'Cricket',
            't20': 'Cricket',
            'ipl': 'Cricket',
            
            // Rugby
            'rugby': 'Rugby',
            'rugby union': 'Rugby',
            'rugby league': 'Rugby',
            'six nations': 'Rugby',
            
            // Motorsports
            'formula 1': 'Racing',
            'f1': 'Racing',
            'nascar': 'Racing',
            'motogp': 'Racing',
            'indycar': 'Racing',
            
            // Combat Sports
            'boxing': 'Boxing',
            'mma': 'MMA',
            'ufc': 'MMA',
            'wwe': 'Wrestling',
            
            // Other Sports
            'golf': 'Golf',
            'pga': 'Golf',
            'volleyball': 'Volleyball',
            'beach volleyball': 'Beach Volleyball',
            'australian football': 'Australian Football',
            'afl': 'Australian Football',
            'badminton': 'Badminton',
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'snooker': 'Snooker',
            'darts': 'Darts',
            'cycling': 'Cycling',
            'tour de france': 'Cycling',
            'swimming': 'Swimming',
            'athletics': 'Athletics'
        };
        
        // Comprehensive college football detection
        this.collegeFootballIndicators = [
            // Conferences
            'big ten', 'sec', 'acc', 'pac-12', 'big 12', 'aac', 
            'mountain west', 'mac', 'conference usa', 'sun belt', 'c-usa',
            
            // Bowl games (ALL bowl games)
            'rose bowl', 'orange bowl', 'sugar bowl', 'cotton bowl', 'peach bowl', 
            'fiesta bowl', 'citrus bowl', 'outback bowl', 'alamo bowl', 'holiday bowl', 
            'gator bowl', 'sun bowl', 'liberty bowl', 'music city bowl', 'texas bowl',
            'military bowl', 'pinstripe bowl', 'las vegas bowl', 'arizona bowl',
            'boca raton bowl', 'cure bowl', 'new mexico bowl', 'camellia bowl',
            'new orleans bowl', 'miami beach bowl', 'bahamas bowl', 'potato bowl',
            'poinsettia bowl', 'armed forces bowl', 'heart of dallas bowl',
            'st petersburg bowl', 'quick lane bowl', 'independence bowl',
            'birmingham bowl', 'gasparilla bowl', 'frisco bowl', 'first responder bowl',
            
            // College-specific terms
            'college football', 'ncaa football', 'fbs', 'fcs', 'cfp', 'college playoff',
            'heisman', 'ap poll', 'coaches poll', 'bcs', 'college gameday',
            'ncaa division i', 'division i-a', 'division i-aa',
            
            // ALL Division I Football Teams
            'alabama', 'clemson', 'ohio state', 'notre dame', 'oklahoma', 'georgia',
            'michigan', 'texas', 'usc', 'penn state', 'florida', 'lsu', 'auburn',
            'tennessee', 'wisconsin', 'oregon', 'florida state', 'miami', 'texas a&m',
            'ucla', 'washington', 'stanford', 'west virginia', 'colorado', 'arkansas state',
            'southern miss', 'mississippi state', 'kentucky', 'south carolina', 'missouri',
            'arkansas', 'iowa', 'michigan state', 'north carolina', 'virginia tech',
            'oklahoma state', 'texas tech', 'baylor', 'tcu', 'kansas state', 'iowa state',
            'kansas', 'purdue', 'illinois', 'northwestern', 'minnesota', 'nebraska',
            'rutgers', 'maryland', 'indiana', 'duke', 'georgia tech', 'pittsburgh',
            'syracuse', 'louisville', 'virginia', 'boston college', 'wake forest',
            'utah', 'arizona state', 'arizona', 'colorado state', 'boise state',
            'san diego state', 'fresno state', 'hawaii', 'nevada', 'utah state',
            'byu', 'houston', 'memphis', 'ucf', 'cincinnati', 'smu', 'tulsa',
            'tulane', 'east carolina', 'navy', 'army', 'air force', 'troy',
            'appalachian state', 'georgia southern', 'coastal carolina', 'louisiana',
            'louisiana-monroe', 'south alabama', 'texas state', 'georgia state',
            'ball state', 'bowling green', 'buffalo', 'kent state', 'miami (ohio)',
            'northern illinois', 'ohio', 'toledo', 'western michigan', 'eastern michigan',
            'central michigan', 'akron', 'massachusetts', 'connecticut', 'liberty',
            'new mexico state', 'old dominion', 'charlotte', 'florida atlantic',
            'florida international', 'middle tennessee', 'western kentucky',
            'marshall', 'rice', 'north texas', 'utsa', 'southern methodist'
        ];

        // College team patterns for more accurate detection
        this.collegeTeamPatterns = [
            /(university|college|state)$/i,
            /(bears|lions|tigers|bulldogs|wildcats|hawks|eagles|sooners|buckeyes|crimson tide|wolverines|fighting irish)/i
        ];
    }

    classifySport(match) {
        if (!match || typeof match !== 'object') return 'Other';
        
        // STEP 1: ABSOLUTE PRIORITY - College Football Detection
        // This overrides ANY other sport value from the API
        if (this.isCollegeFootball(match)) {
            return 'College Football';
        }
        
        // STEP 2: Normal classification for non-college sports
        const sportFromApi = match.sport || match.league || match.tournament || match.competition || '';
        const normalizedSport = this.normalizeSportName(sportFromApi);
        
        // STEP 3: Final fallback - analyze match name
        if ((normalizedSport === 'Other' || normalizedSport === 'Football') && match.match) {
            const inferredSport = this.inferSportFromMatchName(match.match);
            if (inferredSport) return inferredSport;
        }
        
        return normalizedSport;
    }

    isCollegeFootball(match) {
        if (!match) return false;
        
        // Combine ALL possible text fields for maximum detection
        const searchText = [
            match.match || '',
            match.tournament || '', 
            match.league || '',
            match.sport || '',
            match.competition || '',
            match.name || '',
            match.title || ''
        ].join(' ').toLowerCase();
        
        // Method 1: Direct indicator matching
        const hasDirectIndicator = this.collegeFootballIndicators.some(indicator => 
            searchText.includes(indicator.toLowerCase())
        );
        
        if (hasDirectIndicator) return true;
        
        // Method 2: Team pattern matching
        const hasCollegeTeam = this.collegeTeamPatterns.some(pattern => 
            pattern.test(searchText)
        );
        
        // Method 3: Bowl game pattern
        const hasBowlGame = /bowl/i.test(searchText);
        
        // Method 4: Conference pattern
        const hasConference = /(big ten|sec|acc|pac-12|big 12|aac|mountain west|mac)/i.test(searchText);
        
        // If ANY of these methods return true, it's college football
        return hasCollegeTeam || hasBowlGame || hasConference;
    }

    normalizeSportName(sport) {
        if (!sport || typeof sport !== 'string') return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        
        // Exact match first
        if (this.sportMap[sportLower]) {
            return this.sportMap[sportLower];
        }
        
        // Partial matching for better coverage
        for (const [key, value] of Object.entries(this.sportMap)) {
            if (sportLower.includes(key)) {
                return value;
            }
        }
        
        // Capitalize if no match found
        return sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
    }

    inferSportFromMatchName(matchName) {
        if (!matchName || typeof matchName !== 'string') return null;
        
        const lowerName = matchName.toLowerCase();
        
        // College Football patterns (HIGHEST PRIORITY)
        const collegeFootballPatterns = [
            /college\s+football/i,
            /ncaa\s+football/i,
            /(rose|orange|sugar|cotton|peach|fiesta)\s+bowl/i,
            /(big ten|sec|acc|pac-12|big 12)\s+.+/i,
            /(alabama|clemson|ohio state|notre dame|michigan|georgia)\s+.+/i,
            /\bvs\b.*\b(college|university|state)\b/i
        ];
        
        for (const pattern of collegeFootballPatterns) {
            if (pattern.test(lowerName)) {
                return 'College Football';
            }
        }
        
        // American Football patterns (NFL)
        const americanFootballPatterns = [
            /nfl/i,
            /super bowl/i,
            /(chiefs|eagles|patriots|packers|cowboys|steelers|49ers)\s+.+/i
        ];
        
        for (const pattern of americanFootballPatterns) {
            if (pattern.test(lowerName)) {
                return 'American Football';
            }
        }
        
        // Football (soccer) patterns
        const footballPatterns = [
            /\b(fc|cf|real|barca|united|city|dortmund|bayern|psg|juve|inter|milan)\b/i,
            /(premier league|champions league|la liga|serie a|bundesliga|ligue 1)/i,
            /(manchester|liverpool|chelsea|arsenal|tottenham|barcelona|real madrid)/i
        ];
        
        for (const pattern of footballPatterns) {
            if (pattern.test(lowerName)) {
                return 'Football';
            }
        }
        
        return null;
    }

    getSportIcon(sport) {
        const icons = {
            'Football': '⚽',
            'American Football': '🏈', 
            'College Football': '🏈', // Same icon but different category
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
            'Australian Football': '🏉',
            'Badminton': '🏸',
            'Handball': '🤾',
            'Table Tennis': '🏓',
            'Beach Volleyball': '🏐',
            'Cycling': '🚴',
            'Snooker': '🎱',
            'Darts': '🎯',
            'Wrestling': '🤼',
            'Swimming': '🏊',
            'Athletics': '🏃'
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
                        if (match && typeof match === 'object') {
                            const sport = this.classifySport(match);
                            sports.add(sport);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error extracting sports from data:', error);
            return ['Other'];
        }
        
        const sortedSports = Array.from(sports).sort();
        return sortedSports.length > 0 ? sortedSports : ['Other'];
    }

    // Utility method to process and categorize matches
    categorizeMatchesBySport(matches) {
        if (!Array.isArray(matches)) return {};
        
        const categorized = {};
        
        matches.forEach(match => {
            if (match && typeof match === 'object') {
                const sport = this.classifySport(match);
                if (!categorized[sport]) {
                    categorized[sport] = [];
                }
                categorized[sport].push(match);
            }
        });
        
        return categorized;
    }
}

// Test function to verify College Football separation
function testCollegeFootballSeparation() {
    console.log('🧪 TESTING COLLEGE FOOTBALL SEPARATION');
    console.log('=====================================');
    
    const classifier = new SportsClassifier();
    
    const testMatches = [
        // College Football cases (should return "College Football")
        { match: "Alabama vs Clemson", sport: "football", tournament: "NCAA Football" },
        { match: "Ohio State vs Michigan", sport: "football", tournament: "Big Ten Conference" },
        { match: "Rose Bowl: USC vs Penn State", sport: "football" },
        { match: "West Virginia vs Colorado", sport: "football" },
        { match: "Florida State vs Miami", sport: "football" },
        { match: "Cotton Bowl Classic", sport: "football" },
        { match: "SEC Championship", sport: "football" },
        
        // NFL cases (should return "American Football")  
        { match: "Kansas City Chiefs vs Philadelphia Eagles", sport: "american football", tournament: "NFL" },
        { match: "Super Bowl LVIII", sport: "american football" },
        { match: "Green Bay Packers vs Chicago Bears", sport: "american football", tournament: "NFL" },
        
        // Soccer cases (should return "Football")
        { match: "Manchester United vs Liverpool", sport: "football", tournament: "Premier League" },
        { match: "Real Madrid vs Barcelona", sport: "football", tournament: "La Liga" },
        { match: "Champions League Final", sport: "football" }
    ];
    
    let collegeCount = 0;
    let americanCount = 0;
    let soccerCount = 0;
    
    testMatches.forEach((match, index) => {
        const sport = classifier.classifySport(match);
        const icon = classifier.getSportIcon(sport);
        
        console.log(`${index + 1}. "${match.match}"`);
        console.log(`   API Sport: "${match.sport}" → Classified As: ${sport} ${icon}`);
        
        if (sport === 'College Football') collegeCount++;
        if (sport === 'American Football') americanCount++;
        if (sport === 'Football') soccerCount++;
    });
    
    console.log('=====================================');
    console.log(`📊 RESULTS: College Football: ${collegeCount}, American Football: ${americanCount}, Football (Soccer): ${soccerCount}`);
    console.log('✅ College Football should be SEPARATE from Football section!');
}

// Run tests automatically in browser environment
if (typeof window !== 'undefined') {
    setTimeout(testCollegeFootballSeparation, 1000);
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsClassifier;
} else if (typeof window !== 'undefined') {
    window.SportsClassifier = SportsClassifier;
    window.testCollegeFootballSeparation = testCollegeFootballSeparation;
}

// Usage example:
/*
// 1. Import and initialize
const classifier = new SportsClassifier();

// 2. Classify individual match
const sport = classifier.classifySport(matchData);

// 3. Get all sports from API data  
const availableSports = classifier.extractSportsFromData(apiData);

// 4. Categorize matches by sport
const categorized = classifier.categorizeMatchesBySport(matches);

// 5. Get sport icon for UI
const icon = classifier.getSportIcon(sport);
*/
