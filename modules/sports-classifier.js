// Sports Classification Module - ENHANCED FOR SARAH'S DATA
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
            'formula 1': 'Racing',
            'f1': 'Racing',
            'nascar': 'Racing',
            'motogp': 'Racing',
            'motorsport': 'Motorsport',
            'moto-sports': 'Motorsport',
            'moto sports': 'Motorsport',
            'volleyball': 'Volleyball',
            'australian football': 'Australian Football',
            'afl': 'Australian Football',
            'badminton': 'Badminton',
            'american football': 'American Football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            'nfl': 'American Football',
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'beach volleyball': 'Beach Volleyball'
        };
        
        this.collegeFootballIndicators = [
            'middle tennessee', 'jacksonville state', 'college football', 
            'ncaa football', 'fbs', 'fcs', 'bowl game', 'cotton bowl',
            'rose bowl', 'orange bowl', 'sugar bowl'
        ];
    }

    classifySport(match) {
        // Handle Sarah's data specifically
        if (this.isSarahData(match)) {
            return this.normalizeSarahSport(match);
        }
        
        if (this.isCollegeFootball(match)) {
            return 'American Football';
        }
        
        const sportFromApi = match.sport || 'Other';
        return this.normalizeSportName(sportFromApi);
    }

    isSarahData(match) {
        return match.streamedMatch || 
               (match.channels && match.channels.some(ch => ch.includes('streamed.pk') || ch.includes('embedsports.top')));
    }

    normalizeSarahSport(match) {
        // Handle Sarah's specific inconsistencies
        const rawSport = match.sport || match.tournament || match.category || 'Other';
        return this.normalizeSportName(rawSport);
    }

    isCollegeFootball(match) {
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        return this.collegeFootballIndicators.some(indicator => 
            searchString.includes(indicator)
        );
    }

    normalizeSportName(sport) {
        if (!sport || sport === 'Other') return 'Other';
        
        const sportLower = sport.toLowerCase().trim();
        return this.sportMap[sportLower] || sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
    }

    isMalformedSport(sport) {
        return !sport || sport === '' || sport === 'null' || sport === 'undefined' || sport === 'Other';
    }

    extractSportsFromData(apiData) {
        if (!apiData?.events) return [];
        
        const sports = new Set();
        Object.values(apiData.events).forEach(matches => {
            matches.forEach(match => {
                const sport = this.classifySport(match);
                sports.add(sport);
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
