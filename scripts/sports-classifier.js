// Sports Classification Module
class SportsClassifier {
    constructor() {
        this.sportMap = {
            'football': 'Football',
            'soccer': 'Football',
            'basketball': 'Basketball',
            'baseball': 'Baseball',
            'hockey': 'Ice Hockey',
            'ice hockey': 'Ice Hockey',
            'tennis': 'Tennis',
            'cricket': 'Cricket',
            'rugby': 'Rugby',
            'golf': 'Golf',
            'boxing': 'Boxing',
            'mma': 'MMA',
            'ufc': 'MMA',
            'ufc 322': 'MMA',
            'formula 1': 'Racing',
            'motorsport': 'Motosport',
            'moto-sport': 'Motosport,
            'motor-sport': 'Motosport',
            'f1': 'Racing',
            'nascar': 'Racing',
            'motogp': 'Racing',
            'volleyball': 'Volleyball',
            'australian football': 'Australian Football',
            'afl': 'Australian Football',
            'badminton': 'Badminton',
            'american football': 'American Football',
            'american-football': 'american-football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            'nfl': 'American Football',
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'beach volleyball': 'Beach Volleyball'
        };
        // ADD TEAM NAME MAPPINGS HERE:
        this.teamMap = {
            'tara galilor': 'wales',
            'wales': 'wales',
            'côte d\'ivoire': 'ivory coast',
            'bosnia & herzegovina': 'bosnia herzegovina', 
            'czech republic': 'czechia',
            'man united': 'manchester united',
            'man city': 'manchester city',
            'spurs': 'tottenham',
            'inter miami cf': 'inter miami',
            'la galaxy': 'los angeles galaxy'
            // Add more as you find them!
        };
        this.collegeFootballIndicators = [
            'middle tennessee', 'jacksonville state', 'college football', 
            'ncaa football', 'fbs', 'fcs', 'bowl game', 'cotton bowl',
            'rose bowl', 'orange bowl', 'sugar bowl'
        ];
    }

    classifySport(match) {
        if (this.isCollegeFootball(match)) {
            return 'American Football';
        }
        
        const sportFromApi = match.sport || 'Other';
        return this.normalizeSportName(sportFromApi);
    }

    isCollegeFootball(match) {
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        return this.collegeFootballIndicators.some(indicator => 
            searchString.includes(indicator)
        );
    }

    normalizeSportName(sport) {
        if (!sport) return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        return this.sportMap[sportLower] || sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
    }

    extractSportsFromData(apiData) {
        if (!apiData?.events) return [];
        
        const sports = new Set();
        Object.values(apiData.events).forEach(matches => {
            matches.forEach(match => {
                if (match?.sport) {
                    const sport = this.classifySport(match);
                    sports.add(sport);
                }
            });
        });
        
        return Array.from(sports).sort();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsClassifier;
} else {
    window.SportsClassifier = SportsClassifier;
}
