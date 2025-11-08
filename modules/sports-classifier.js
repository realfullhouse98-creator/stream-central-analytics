// Complete Sports Classification Module - Scalable Pattern-Based
class SportsClassifier {
    constructor() {
        this.sportMap = {
            'football': 'Football',
            'soccer': 'Football',
            'american football': 'American Football', 
            'nfl': 'American Football',
            'college football': 'College Football',
            'ncaa football': 'College Football',
            'basketball': 'Basketball',
            'baseball': 'Baseball',
            'hockey': 'Ice Hockey',
            'tennis': 'Tennis',
            'cricket': 'Cricket',
            'rugby': 'Rugby',
            'golf': 'Golf',
            'boxing': 'Boxing',
            'mma': 'MMA'
        };

        // Soccer patterns (known leagues and teams)
        this.soccerPatterns = {
            leagues: [
                'premier league', 'champions league', 'europa league', 'la liga',
                'serie a', 'bundesliga', 'ligue 1', 'fa cup', 'copa del rey',
                'eredivisie', 'primeira liga', 'mls', 'world cup'
            ],
            teams: [
                'manchester', 'liverpool', 'chelsea', 'arsenal', 'tottenham',
                'real madrid', 'barcelona', 'atletico', 'sevilla', 'valencia',
                'bayern', 'dortmund', 'schalke', 'leverkusen', 'juventus',
                'milan', 'inter', 'roma', 'napoli', 'psg', 'lyon', 'marseille'
            ],
            terms: ['fc', 'cf', 'united', 'city', 'cf']
        };

        // College Football patterns
        this.collegePatterns = {
            conferences: [
                'big ten', 'sec', 'acc', 'pac-12', 'big 12', 'aac',
                'mountain west', 'mac', 'conference usa', 'sun belt'
            ],
            bowls: [
                'rose bowl', 'orange bowl', 'sugar bowl', 'cotton bowl',
                'peach bowl', 'fiesta bowl', 'bowl game', 'college bowl'
            ],
            terms: [
                'college football', 'ncaa football', 'fbs', 'fcs', 'cfp',
                'heisman', 'ap poll', 'coaches poll'
            ]
        };

        // NFL patterns
        this.nflPatterns = {
            teams: [
                'chiefs', 'eagles', 'patriots', 'packers', 'cowboys', 'steelers',
                '49ers', 'ravens', 'bills', 'dolphins', 'jets', 'bengals',
                'browns', 'texans', 'colts', 'jaguars', 'titans', 'broncos',
                'raiders', 'chargers', 'rams', 'seahawks', 'cardinals',
                'falcons', 'panthers', 'saints', 'buccaneers', 'vikings',
                'bears', 'lions', 'giants', 'commanders'
            ],
            terms: ['nfl', 'super bowl', 'pro bowl']
        };
    }

    classifySport(match) {
        if (!match || typeof match !== 'object') return 'Other';
        
        const searchText = this.getSearchText(match);
        
        // STEP 1: Detect specific sports by patterns
        const detectedSport = this.detectSportByPatterns(searchText, match.match);
        if (detectedSport) return detectedSport;
        
        // STEP 2: Use API sport value as fallback
        const apiSport = match.sport || match.league || match.tournament || '';
        return this.normalizeSportName(apiSport);
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

    detectSportByPatterns(searchText, matchName = '') {
        // 1. Check for SOCCER first (most specific patterns)
        if (this.isSoccer(searchText)) {
            return 'Football';
        }
        
        // 2. Check for NFL (specific teams and terms)
        if (this.isNFL(searchText)) {
            return 'American Football';
        }
        
        // 3. Check for COLLEGE FOOTBALL (conferences, bowls, terms)
        if (this.isCollegeFootball(searchText)) {
            return 'College Football';
        }
        
        // 4. Generic "vs" pattern for American sports
        if (this.isGenericAmericanSport(matchName, searchText)) {
            return 'College Football'; // Default American sport with "vs"
        }
        
        return null;
    }

    isSoccer(searchText) {
        // Check for known soccer leagues
        const hasSoccerLeague = this.soccerPatterns.leagues.some(league => 
            searchText.includes(league)
        );
        if (hasSoccerLeague) return true;
        
        // Check for known soccer teams
        const hasSoccerTeam = this.soccerPatterns.teams.some(team => 
            searchText.includes(team)
        );
        if (hasSoccerTeam) return true;
        
        // Check for soccer terms
        const hasSoccerTerm = this.soccerPatterns.terms.some(term => 
            searchText.includes(term)
        );
        
        return hasSoccerTerm;
    }

    isNFL(searchText) {
        // Check for NFL terms
        const hasNFLTerm = this.nflPatterns.terms.some(term => 
            searchText.includes(term)
        );
        if (hasNFLTerm) return true;
        
        // Check for NFL teams
        const hasNFLTeam = this.nflPatterns.teams.some(team => 
            searchText.includes(team)
        );
        
        return hasNFLTeam;
    }

    isCollegeFootball(searchText) {
        // Check for college conferences
        const hasConference = this.collegePatterns.conferences.some(conf => 
            searchText.includes(conf)
        );
        if (hasConference) return true;
        
        // Check for bowl games
        const hasBowl = this.collegePatterns.bowls.some(bowl => 
            searchText.includes(bowl)
        );
        if (hasBowl) return true;
        
        // Check for college terms
        const hasCollegeTerm = this.collegePatterns.terms.some(term => 
            searchText.includes(term)
        );
        
        return hasCollegeTerm;
    }

    isGenericAmericanSport(matchName, searchText) {
        if (!matchName) return false;
        
        // Look for "Team A vs Team B" pattern
        const hasVsPattern = /.+\s+vs\s+.+/i.test(matchName);
        if (!hasVsPattern) return false;
        
        // EXCLUDE if it has soccer indicators
        const hasSoccerIndicator = this.soccerPatterns.leagues.some(league => 
            searchText.includes(league)
        ) || this.soccerPatterns.teams.some(team => 
            searchText.includes(team)
        );
        
        // If it has "vs" and NO soccer indicators, it's likely American sport
        return !hasSoccerIndicator;
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
            'MMA': '🥋'
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

    // Process and categorize all matches
    processMatches(matches) {
        if (!Array.isArray(matches)) return [];
        
        return matches.map(match => {
            const sport = this.classifySport(match);
            const icon = this.getSportIcon(sport);
            
            return {
                ...match,
                classifiedSport: sport,
                sportIcon: icon,
                displaySport: sport
            };
        });
    }

    // Get matches by sport category
    getMatchesBySport(matches, sport) {
        const processed = this.processMatches(matches);
        return processed.filter(match => match.classifiedSport === sport);
    }
}

// Match Processor - Use this in your main application
class MatchProcessor {
    constructor() {
        this.classifier = new SportsClassifier();
    }
    
    processApiData(apiData) {
        if (!apiData?.events) return { sports: [], matches: [] };
        
        const allMatches = [];
        const sports = new Set();
        
        // Flatten all matches from events
        Object.values(apiData.events).forEach(matchGroup => {
            if (Array.isArray(matchGroup)) {
                matchGroup.forEach(match => {
                    if (match && typeof match === 'object') {
                        const processedMatch = this.classifier.classifySport(match);
                        allMatches.push({
                            original: match,
                            classifiedSport: processedMatch,
                            sportIcon: this.classifier.getSportIcon(processedMatch)
                        });
                        sports.add(processedMatch);
                    }
                });
            }
        });
        
        return {
            sports: Array.from(sports).sort(),
            matches: allMatches
        };
    }
    
    // Group matches by sport for display
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

// TEST FUNCTION - Verify it works with your matches
function testClassifier() {
    console.log('🧪 TESTING SPORTS CLASSIFIER');
    console.log('============================');
    
    const classifier = new SportsClassifier();
    
    const testCases = [
        // College Football cases
        { match: "Arkansas State vs Southern Mississippi", sport: "football" },
        { match: "Alabama vs Clemson", sport: "football" },
        { match: "Rose Bowl: USC vs Penn State", sport: "football" },
        { match: "SEC Championship", sport: "football" },
        
        // NFL cases
        { match: "Kansas City Chiefs vs Philadelphia Eagles", sport: "american football" },
        { match: "Super Bowl LVIII", sport: "american football" },
        
        // Soccer cases
        { match: "Manchester United vs Liverpool", sport: "football", tournament: "Premier League" },
        { match: "Real Madrid vs Barcelona", sport: "football" },
        
        // Unknown "vs" matches (should default to College Football)
        { match: "Unknown Team A vs Unknown Team B", sport: "football" },
        { match: "State University vs College Tigers", sport: "football" }
    ];
    
    let results = {
        'College Football': 0,
        'American Football': 0,
        'Football': 0,
        'Other': 0
    };
    
    testCases.forEach((test, index) => {
        const result = classifier.classifySport(test);
        results[result] = (results[result] || 0) + 1;
        
        console.log(`${index + 1}. "${test.match}"`);
        console.log(`   API: "${test.sport}" → Classified: ${result} ${classifier.getSportIcon(result)}`);
    });
    
    console.log('============================');
    console.log('📊 RESULTS:', results);
    console.log('✅ Arkansas State vs Southern Mississippi should be College Football!');
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SportsClassifier, MatchProcessor, testClassifier };
} else {
    window.SportsClassifier = SportsClassifier;
    window.MatchProcessor = MatchProcessor;
    window.testClassifier = testClassifier;
}

// Auto-test in browser
if (typeof window !== 'undefined') {
    setTimeout(testClassifier, 500);
}
