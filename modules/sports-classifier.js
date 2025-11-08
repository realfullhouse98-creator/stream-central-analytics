// ==================== CLEAN SPORTS CLASSIFICATION ====================
class SportsClassifier {
    constructor() {
        // Simple sport mapping
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
            'table tennis': 'Table Tennis'
        };
    }

    classifySport(match) {
        if (!match) return 'Other';
        
        // STEP 1: Check for College Football FIRST
        if (this.isCollegeFootball(match)) {
            return 'College Football'; // SEPARATE category
        }
        
        // STEP 2: Check for NFL/American Football
        if (this.isAmericanFootball(match)) {
            return 'American Football'; // SEPARATE category  
        }
        
        // STEP 3: Use API sport value
        const sportFromApi = match.sport || 'Other';
        return this.normalizeSportName(sportFromApi);
    }

    isCollegeFootball(match) {
        if (!match?.match) return false;
        
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        // College Football indicators
        const collegeIndicators = [
            'college football', 'ncaa football', 'fbs', 'fcs',
            'rose bowl', 'orange bowl', 'sugar bowl', 'cotton bowl',
            'peach bowl', 'fiesta bowl', 'bowl game',
            'big ten', 'sec', 'acc', 'pac-12', 'big 12'
        ];
        
        return collegeIndicators.some(indicator => 
            searchString.includes(indicator)
        );
    }

    isAmericanFootball(match) {
        if (!match?.match) return false;
        
        const searchString = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        // NFL/American Football indicators
        const nflIndicators = [
            'nfl', 'super bowl', 'pro bowl',
            'chiefs', 'eagles', 'patriots', 'packers', 'cowboys'
        ];
        
        return nflIndicators.some(indicator => 
            searchString.includes(indicator)
        );
    }

    normalizeSportName(sport) {
        if (!sport) return 'Other';
        
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
            'Tennis': '🎾'
        };
        return icons[sport] || '🏆';
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

// ==================== BULLETPROOF FILTER SYSTEM ====================
class MatchFilter {
    constructor() {
        this.showLiveOnly = false;
        this.currentSport = 'all';
    }

    setFilter(type) {
        try {
            this.showLiveOnly = (type === 'live');
            this.renderMatches();
        } catch (error) {
            console.log('Filter error - resetting');
            this.showLiveOnly = false;
            this.renderMatches();
        }
    }

    setSportFilter(sport) {
        this.currentSport = sport;
        this.renderMatches();
    }

    filterMatches(matches) {
        let filtered = matches;
        
        // Filter by sport
        if (this.currentSport !== 'all') {
            filtered = filtered.filter(match => {
                const sport = this.classifySport(match);
                return sport === this.currentSport;
            });
        }
        
        // Filter by live status
        if (this.showLiveOnly) {
            filtered = filtered.filter(match => match.status === 'live');
        }
        
        return filtered;
    }

    renderMatches() {
        // Your existing match rendering logic here
        const filteredMatches = this.filterMatches(this.allMatches);
        this.displayMatches(filteredMatches);
    }
}

// ==================== USAGE EXAMPLE ====================
// Initialize
const sportsClassifier = new SportsClassifier();
const matchFilter = new MatchFilter();

// Process your matches
function processMatches(matches) {
    return matches.map(match => {
        const sport = sportsClassifier.classifySport(match);
        const icon = sportsClassifier.getSportIcon(sport);
        
        return {
            ...match,
            displaySport: sport,
            sportIcon: icon
        };
    });
}

// Get available sports for filter buttons
function getAvailableSports(apiData) {
    return sportsClassifier.extractSportsFromData(apiData);
}

// Example usage:
// const matches = processMatches(rawMatches);
// const sports = getAvailableSports(apiData);
// matchFilter.allMatches = matches;

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SportsClassifier, MatchFilter };
} else {
    window.SportsClassifier = SportsClassifier;
    window.MatchFilter = MatchFilter;
}
