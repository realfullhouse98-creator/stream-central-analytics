// Fixed Sports Classification Module
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
            
            // American Football - MUST come before general football
            'american football': 'American Football', 
            'nfl': 'American Football',
            'super bowl': 'American Football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            
            // Basketball
            'basketball': 'Basketball',
            'nba': 'Basketball',
            'euroleague': 'Basketball',
            
            // Baseball
            'baseball': 'Baseball',
            'mlb': 'Baseball',
            
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
            
            // Other sports...
        };
        
        // Enhanced college football detection - HIGH PRIORITY
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
        
        this.collegeTeamPatterns = [
            /(university|college|state)$/i,
            /^(alabama|clemson|ohio state|notre dame|oklahoma|georgia|florida|michigan|texas|usc)/i
        ];
    }

    classifySport(match) {
        if (!match) return 'Other';
        
        // 1. FIRST check for college football - highest priority
        if (this.isCollegeFootball(match)) {
            return 'American Football';
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
        
        // Check for college team patterns
        const hasCollegeTeam = this.collegeTeamPatterns.some(pattern => 
            pattern.test(searchString)
        );
        
        // Check for bowl game pattern
        const hasBowlGame = /bowl/i.test(searchString);
        
        return hasCollegeTeam || hasBowlGame;
    }

    normalizeSportName(sport) {
        if (!sport || typeof sport !== 'string') return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        
        // Check exact matches first
        if (this.sportMap[sportLower]) {
            return this.sportMap[sportLower];
        }
        
        // Check for partial matches with priority for American Football
        if (sportLower.includes('college football') || sportLower.includes('ncaa football')) {
            return 'American Football';
        }
        
        if (sportLower.includes('american football') || sportLower.includes('nfl')) {
            return 'American Football';
        }
        
        // Then check other sports
        for (const [key, value] of Object.entries(this.sportMap)) {
            if (sportLower.includes(key) && value !== 'American Football') {
                return value;
            }
        }
        
        return 'Other';
    }

    inferSportFromMatchName(matchName) {
        if (!matchName) return null;
        
        const lowerName = matchName.toLowerCase();
        
        // American Football patterns (check these FIRST)
        const americanFootballPatterns = [
            /vs\s+.+\s+football/i,
            /bowl/i,
            /college\s+football/i,
            /ncaa\s+football/i,
            /(alabama|clemson|ohio state|notre dame|oklahoma|georgia)\s+.+/i,
            /(big ten|sec|acc|pac-12|big 12)\s+.+/i
        ];
        
        for (const pattern of americanFootballPatterns) {
            if (pattern.test(lowerName)) {
                return 'American Football';
            }
        }
        
        // Football (soccer) patterns
        const footballPatterns = [
            /\b(fc|cf|real|barca|united|city|fc|cf|dortmund|bayern|psg)\b/i,
            /(premier league|champions league|la liga|serie a|bundesliga)/i,
            /(manchester|liverpool|chelsea|arsenal|tottenham)/i
        ];
        
        for (const pattern of footballPatterns) {
            if (pattern.test(lowerName)) {
                return 'Football';
            }
        }
        
        return null;
    }

    // Enhanced extraction with better college football detection
    extractSportsFromData(apiData) {
        if (!apiData?.events) return [];
        
        const sports = new Map(); // Use Map to track counts
        
        try {
            Object.values(apiData.events).forEach(matches => {
                if (Array.isArray(matches)) {
                    matches.forEach(match => {
                        if (match && typeof match === 'object') {
                            const sport = this.classifySport(match);
                            sports.set(sport, (sports.get(sport) || 0) + 1);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error extracting sports from data:', error);
            return ['Other'];
        }
        
        // Sort by count (most common first), then alphabetically
        const sortedSports = Array.from(sports.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(entry => entry[0]);
            
        return sortedSports.length > 0 ? sortedSports : ['Other'];
    }

    getSportIcon(sport) {
        const icons = {
            'Football': '⚽',
            'American Football': '🏈',
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
            'Wrestling': '🤼'
        };
        
        return icons[sport] || '🏆';
    }
}

// Test the classifier
if (typeof window !== 'undefined') {
    // Test cases
    const classifier = new SportsClassifier();
    
    const testMatches = [
        { match: "Alabama vs Clemson - College Football", tournament: "NCAA Football" },
        { match: "Ohio State vs Michigan", tournament: "Big Ten Conference" },
        { match: "Rose Bowl: USC vs Penn State", tournament: "College Football" },
        { match: "Manchester United vs Liverpool", tournament: "Premier League" },
        { match: "Real Madrid vs Barcelona", tournament: "La Liga" },
        { match: "West Virginia vs Colorado", tournament: "NCAA Football" }
    ];
    
    console.log("Testing sports classification:");
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
