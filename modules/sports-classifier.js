// modules/sports-classifier.js
export class SportsClassifier {
    constructor() {
        this.sportMap = this.initializeSportMap();
    }

    initializeSportMap() {
        return {
            // Football variations
            'football': 'Football',
            'soccer': 'Football',
            'association football': 'Football',
            
            // Basketball variations
            'basketball': 'Basketball',
            'basket-ball': 'Basketball',
            
            // Baseball variations
            'baseball': 'Baseball',
            'base-ball': 'Baseball',
            
            // Ice Hockey variations
            'hockey': 'Ice Hockey',
            'ice hockey': 'Ice Hockey',
            'ice-hockey': 'Ice Hockey',
            'nhl': 'Ice Hockey',
            
            // Tennis variations
            'tennis': 'Tennis',
            'tennis atp': 'Tennis',
            'tennis wta': 'Tennis',
            
            // Cricket variations
            'cricket': 'Cricket',
            'cricket test': 'Cricket',
            'cricket odi': 'Cricket',
            'cricket t20': 'Cricket',
            
            // Rugby variations
            'rugby': 'Rugby',
            'rugby union': 'Rugby',
            'rugby league': 'Rugby',
            
            // Golf variations
            'golf': 'Golf',
            'golf pga': 'Golf',
            
            // Combat sports
            'boxing': 'Boxing',
            'mma': 'MMA',
            'ufc': 'MMA',
            'mixed martial arts': 'MMA',
            
            // Motorsports consolidation
            'formula 1': 'Motorsports',
            'f1': 'Motorsports',
            'nascar': 'Motorsports',
            'motogp': 'Motorsports',
            'motor-sports': 'Motorsports',
            'motorsports': 'Motorsports',
            'racing': 'Motorsports',
            'formula1': 'Motorsports',
            
            // Volleyball variations
            'volleyball': 'Volleyball',
            'beach volleyball': 'Beach Volleyball',
            'beach-volleyball': 'Beach Volleyball',
            
            // American Football consolidation
            'american football': 'American Football',
            'american-football': 'American Football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            'nfl': 'American Football',
            
            // Australian Football
            'australian football': 'Australian Football',
            'afl': 'Australian Football',
            
            // Racquet sports
            'badminton': 'Badminton',
            'table tennis': 'Table Tennis',
            'table-tennis': 'Table Tennis',
            'ping pong': 'Table Tennis',
            
            // Handball
            'handball': 'Handball',
            
            // Winter sports
            'wintersports': 'Winter Sports',
            'winter sports': 'Winter Sports',
            'winter-sports': 'Winter Sports',
            'skiing': 'Winter Sports',
            'snowboarding': 'Winter Sports',
            
            // Equestrian
            'equestrian sports': 'Equestrian',
            'equestrian': 'Equestrian',
            'horse racing': 'Equestrian',
            
            // Water sports
            'swimming': 'Water Sports',
            'diving': 'Water Sports',
            'water polo': 'Water Sports',
            
            // Other sports
            'athletics': 'Athletics',
            'track and field': 'Athletics',
            'cycling': 'Cycling',
            'darts': 'Darts',
            'snooker': 'Snooker',
            'esports': 'Esports',
            'e-sports': 'Esports'
        };
    }

    classifySport(match) {
        // First check for college football
        if (this.isCollegeFootball(match)) {
            return 'American Football';
        }
        
        // Get sport from API data with better fallbacks
        const sportFromApi = match.sport || match.tournament || 'Other';
        const normalizedSport = this.normalizeSportName(sportFromApi);
        
        // Additional context-based classification
        return this.contextBasedSportClassification(normalizedSport, match);
    }

    normalizeSportName(sport) {
        if (!sport) return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        
        // Direct mapping for known sports
        if (this.sportMap[sportLower]) {
            return this.sportMap[sportLower];
        }
        
        // Handle partial matches for better coverage
        for (const [key, value] of Object.entries(this.sportMap)) {
            if (sportLower.includes(key) && key.length > 3) {
                console.log(`🔍 Partial match: "${sportLower}" → "${value}" via "${key}"`);
                return value;
            }
        }
        
        // Handle completely unknown or unusual sports
        return this.handleUnknownSport(sport, sportLower);
    }

    handleUnknownSport(sport, sportLower) {
        // Common mispellings and typos
        const commonTypos = {
            'footbal': 'Football',
            'baskteball': 'Basketball',
            'basebal': 'Baseball',
            'hocky': 'Ice Hockey',
            'tenis': 'Tennis',
            'crikcet': 'Cricket',
            'rugbi': 'Rugby',
            'vollleyball': 'Volleyball',
            'amercian football': 'American Football'
        };
        
        if (commonTypos[sportLower]) {
            console.log(`✏️ Fixed typo: "${sport}" → "${commonTypos[sportLower]}"`);
            return commonTypos[sportLower];
        }
        
        // Check for sports that might be in other languages
        const internationalNames = {
            'futbol': 'Football',
            'fútbol': 'Football',
            'baloncesto': 'Basketball',
            'béisbol': 'Baseball',
            'hockey sobre hielo': 'Ice Hockey',
            'tenis': 'Tennis',
            'críquet': 'Cricket',
            'rugby': 'Rugby',
            'golf': 'Golf',
            'boxeo': 'Boxing'
        };
        
        if (internationalNames[sportLower]) {
            console.log(`🌍 International name: "${sport}" → "${internationalNames[sportLower]}"`);
            return internationalNames[sportLower];
        }
        
        // Check for unusual formats or concatenated names
        const unusualPatterns = [
            { pattern: /[0-9]/, replacement: 'Other' },
            { pattern: /[^a-zA-Z0-9\s-]/, replacement: 'Other' },
            { pattern: /^[A-Z]+$/, replacement: 'Other' },
            { pattern: /stream|live|hd|free|online/, replacement: 'Other' },
        ];
        
        for (const { pattern, replacement } of unusualPatterns) {
            if (pattern.test(sport)) {
                console.log(`⚠️ Unusual pattern: "${sport}" → "${replacement}"`);
                return replacement;
            }
        }
        
        // Check if it's a tournament name masquerading as a sport
        const tournamentKeywords = [
            'championship', 'cup', 'league', 'tournament', 'series', 
            'premier', 'world cup', 'olympics', 'games'
        ];
        
        if (tournamentKeywords.some(keyword => sportLower.includes(keyword))) {
            console.log(`🏆 Tournament name detected: "${sport}" → "Other"`);
            return 'Other';
        }
        
        // If it's a very short or very long name, likely misclassified
        if (sport.length <= 2 || sport.length > 50) {
            console.log(`📏 Suspicious length: "${sport}" → "Other"`);
            return 'Other';
        }
        
        // Default: try to intelligently capitalize and return
        const cleanedSport = this.cleanAndCapitalizeSport(sport);
        console.log(`❓ Unknown sport: "${sport}" → "${cleanedSport}"`);
        
        return cleanedSport;
    }

    cleanAndCapitalizeSport(sport) {
        // Remove common prefixes/suffixes that might be confusing
        let cleaned = sport
            .replace(/\b(live|stream|hd|free|online|watch|tv|channel)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (!cleaned) return 'Other';
        
        // Capitalize first letter of each word, but handle acronyms properly
        return cleaned.replace(/\w\S*/g, (word) => {
            // If it's an acronym (all caps), keep it as is
            if (word === word.toUpperCase() && word.length <= 4) {
                return word;
            }
            // Otherwise capitalize normally
            return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
        });
    }

    contextBasedSportClassification(sport, match) {
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        // Context-based overrides for better classification
        const contextOverrides = [
            { keywords: ['nfl', 'super bowl', 'touchdown', 'quarterback'], sport: 'American Football' },
            { keywords: ['nhl', 'puck', 'goalie', 'power play'], sport: 'Ice Hockey' },
            { keywords: ['mlb', 'home run', 'inning', 'pitcher'], sport: 'Baseball' },
            { keywords: ['nba', 'dunk', 'three pointer', 'free throw'], sport: 'Basketball' },
            { keywords: ['premier league', 'champions league', 'world cup'], sport: 'Football' },
            { keywords: ['wimbledon', 'grand slam', 'roland garros'], sport: 'Tennis' },
            { keywords: ['ashes', 'test match', 'twenty20'], sport: 'Cricket' },
            { keywords: ['six nations', 'super rugby', 'british lions'], sport: 'Rugby' }
        ];
        
        for (const override of contextOverrides) {
            if (override.keywords.some(keyword => searchString.includes(keyword))) {
                console.log(`🎯 Context override: "${sport}" → "${override.sport}"`);
                return override.sport;
            }
        }
        
        return sport;
    }

    isCollegeFootball(match) {
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        const collegeFootballIndicators = [
            'middle tennessee', 'jacksonville state', 'college football', 
            'ncaa football', 'fbs', 'fcs', 'bowl game', 'cotton bowl',
            'rose bowl', 'orange bowl', 'sugar bowl', 'college gameday',
            'ncaaf', 'college bowl', 'cfp', 'college playoff'
        ];
        
        return collegeFootballIndicators.some(indicator => 
            searchString.includes(indicator)
        );
    }
}
