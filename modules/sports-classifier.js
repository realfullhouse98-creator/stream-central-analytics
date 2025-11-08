// Fixed Sports Classification Module - College Football as separate category
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
            
            // American Football - SEPARATE from College Football
            'american football': 'American Football', 
            'nfl': 'American Football',
            'super bowl': 'American Football',
            
            // College Football - SEPARATE CATEGORY
            'college football': 'College Football',
            'ncaa football': 'College Football',
            
            // Basketball
            'basketball': 'Basketball',
            'nba': 'Basketball',
            'euroleague': 'Basketball',
            
            // Other sports...
        };
        
        // College football detection - now returns "College Football"
        this.collegeFootballIndicators = [
            // Bowl games
            'cotton bowl', 'rose bowl', 'orange bowl', 'sugar bowl',
            'peach bowl', 'fiesta bowl', 'citrus bowl', 'outback bowl',
            'alamo bowl', 'holiday bowl', 'gator bowl', 'sun bowl',
            
            // Conferences
            'big ten', 'sec', 'acc', 'pac-12', 'big 12', 'aac',
            'mountain west', 'mac', 'conference usa', 'sun belt',
            
            // College-specific terms
            'college football', 'ncaa football', 'fbs', 'fcs', 'cfp',
            'college gameday', 'heisman', 'bcs', 'ap poll', 'coaches poll',
            
            // Team names (common college teams)
            'alabama', 'clemson', 'ohio state', 'notre dame', 'oklahoma',
            'georgia', 'florida', 'michigan', 'texas', 'usc', 'penn state',
            'wisconsin', 'oregon', 'auburn', 'lsu', 'florida state', 'miami',
            'tennessee', 'texas a&m', 'ucla', 'washington', 'stanford',
            'west virginia', 'colorado', 'arkansas state', 'southern miss'
        ];
    }

    classifySport(match) {
        if (!match) return 'Other';
        
        // 1. FIRST check for college football - returns "College Football"
        if (this.isCollegeFootball(match)) {
            return 'College Football';
        }
        
        // 2. Try to extract from API data
        const sportFromApi = match.sport || match.league || match.tournament || '';
        const normalizedSport = this.normalizeSportName(sportFromApi);
        
        // 3. If still uncertain, analyze match name
        if ((normalizedSport === 'Other' || normalizedSport === 'Football') && match.match) {
            const inferredSport = this.inferSportFromMatchName(match.match);
            if (inferredSport && inferredSport !== 'Football') {
                return inferredSport;
            }
        }
        
        return normalizedSport;
    }

    isCollegeFootball(match) {
        if (!match?.match) return false;
        
        const searchString = `${match.match} ${match.tournament || ''} ${match.league || ''}`.toLowerCase();
        
        // Strong indicators of college football
        const strongIndicators = [
            'college football', 'ncaa football', 'fbs', 'fcs', 'cfp',
            'cotton bowl', 'rose bowl', 'orange bowl', 'sugar bowl'
        ];
        
        // Check for strong indicators first
        const hasStrongIndicator = strongIndicators.some(indicator => 
            searchString.includes(indicator)
        );
        
        if (hasStrongIndicator) return true;
        
        // Check for conference names
        const hasConference = [
            'big ten', 'sec', 'acc', 'pac-12', 'big 12', 'aac'
        ].some(conf => searchString.includes(conf));
        
        if (hasConference) return true;
        
        // Check for bowl game pattern
        const hasBowlGame = /bowl/i.test(searchString);
        
        return hasBowlGame;
    }

    normalizeSportName(sport) {
        if (!sport || typeof sport !== 'string') return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        
        // Check exact matches first
        if (this.sportMap[sportLower]) {
            return this.sportMap[sportLower];
        }
        
        // Check for partial matches with priority for College Football
        if (sportLower.includes('college football') || sportLower.includes('ncaa football')) {
            return 'College Football';
        }
        
        if (sportLower.includes('american football') || sportLower.includes('nfl')) {
            return 'American Football';
        }
        
        // Then check other sports
        for (const [key, value] of Object.entries(this.sportMap)) {
            if (sportLower.includes(key)) {
                return value;
            }
        }
        
        return 'Other';
    }

    inferSportFromMatchName(matchName) {
        if (!matchName) return null;
        
        const lowerName = matchName.toLowerCase();
        
        // College Football patterns (check these FIRST)
        const collegeFootballPatterns = [
            /college\s+football/i,
            /ncaa\s+football/i,
            /bowl/i,
            /(big ten|sec|acc|pac-12|big 12)\s+.+/i,
            /(alabama|clemson|ohio state|notre dame|oklahoma|georgia)\s+.+/i
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
            /(patriots|chiefs|packers|cowboys|steelers)\s+.+/i
        ];
        
        for (const pattern of americanFootballPatterns) {
            if (pattern.test(lowerName)) {
                return 'American Football';
            }
        }
        
        // Football (soccer) patterns
        const footballPatterns = [
            /\b(fc|cf|real|barca|united|city|fc|cf|dortmund|bayern|psg)\b/i,
            /(premier league|champions league|la liga|serie a|bundesliga)/i
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
            'Volleyball': '🏐'
        };
        
        return icons[sport] || '🏆';
    }

    extractSportsFromData(apiData) {
        if (!apiData?.events) return [];
        
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
}

// Test the updated classifier
if (typeof window !== 'undefined') {
    const classifier = new SportsClassifier();
    
    const testMatches = [
        { match: "Alabama vs Clemson - College Football", tournament: "NCAA Football" },
        { match: "Ohio State vs Michigan", tournament: "Big Ten Conference" },
        { match: "Rose Bowl: USC vs Penn State" },
        { match: "Kansas City Chiefs vs Philadelphia Eagles", tournament: "NFL" },
        { match: "Manchester United vs Liverpool", tournament: "Premier League" },
        { match: "West Virginia vs Colorado", tournament: "NCAA Football" }
    ];
    
    console.log("Testing sports classification - COLLEGE FOOTBALL:");
    testMatches.forEach((match, index) => {
        const sport = classifier.classifySport(match);
        console.log(`${index + 1}. "${match.match}" → ${sport} ${classifier.getSportIcon(sport)}`);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsClassifier;
} else if (typeof window !== 'undefined') {
    window.SportsClassifier = SportsClassifier;
}
