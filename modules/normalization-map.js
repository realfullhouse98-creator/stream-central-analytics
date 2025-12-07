const fs = require('fs');
const path = require('path');

class NormalizationMap {
    constructor() {
        // EXPANDED sport map with more variations
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
            'rugby union': 'Rugby',
            'rugby league': 'Rugby',
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
            'beach volleyball': 'Beach Volleyball',
            'australian football': 'Australian Football',
            'afl': 'Australian Football',
            'badminton': 'Badminton',
            'american football': 'American Football',
            'college football': 'American Football',
            'ncaa football': 'American Football',
            'nfl': 'American Football',
            'handball': 'Handball',
            'table tennis': 'Table Tennis',
            'ping pong': 'Table Tennis',
            'snooker': 'Snooker',
            'pool': 'Snooker',
            'billiards': 'Snooker',
            'darts': 'Darts',
            'cycling': 'Cycling',
            'tour de france': 'Cycling',
            'athletics': 'Athletics',
            'track and field': 'Athletics',
            'swimming': 'Swimming',
            'water polo': 'Water Polo',
            'wrestling': 'Wrestling',
            'track & field': 'Athletics',
            'track and field': 'Athletics',
            'motor vs sports': 'Motorsport',
            'motorsport': 'Motorsport',
            'fight': 'Fighting',
            'fighting': 'Fighting',
            'feature race': 'Racing',
            'golf challenge': 'Golf',
            'dp world tour': 'Golf',
            'wwe': 'Wrestling'
        };
        
        // COMPREHENSIVE College Football Teams Database
        this.collegeFootballTeams = new Set([
            // Power 5 Conferences
            'alabama', 'ohio state', 'georgia', 'michigan', 'texas',
            'oklahoma', 'lsu', 'usc', 'oregon', 'penn state',
            'notre dame', 'florida state', 'clemson', 'tennessee',
            'auburn', 'florida', 'miami', 'texas a&m', 'wisconsin',
            'michigan state', 'iowa', 'ucla', 'washington', 'utah',
            
            // Group of 5 & Notable Programs
            'ucf', 'cincinnati', 'houston', 'byu', 'boise state',
            'san diego state', 'fresno state', 'appalachian state',
            'coastal carolina', 'liberty', 'memphis', 'smu',
            
            // Common in your data
            'middle tennessee', 'jacksonville state', 'western kentucky',
            'florida atlantic', 'charlotte', 'utsa', 'north texas',

            // ACC
            "boston college", "clemson", "duke", "florida state", 
            "georgia tech", "louisville", "miami", "nc state",
            "north carolina", "pittsburgh", "smu", "stanford",
            "syracuse", "virginia", "virginia tech", "wake forest",
          
            // American 
            "army", "charlotte", "east carolina", "florida atlantic",
            "memphis", "navy", "north texas", "rice", "south florida",
            "temple", "tulane", "tulsa", "uab", "utsa",

            // Big 12
            "arizona state", "arizona", "byu", "baylor", "cincinnati",
            "colorado", "houston", "iowa state", "kansas", "kansas state",
            "oklahoma state", "tcu", "texas tech", "ucf", "utah", "west virginia",

            // Big 10
            "illinois", "indiana", "iowa", "maryland", "michigan state",
            "michigan", "minnesota", "nebraska", "northwestern", "ohio state",
            "oregon", "penn state", "purdue", "rutgers", "ucla", "usc",
            "washington", "wisconsin",

            // Conference USA
            "delaware", "florida international", "jacksonville state",
            "kennesaw state", "liberty", "louisiana tech", "middle tennessee",
            "missouri state", "new mexico state", "sam houston", "utep", 
            "western kentucky",

            // FBS Independents
            "notre dame", "uconn",

            // Mid-American (MAC)
            "akron", "ball state", "bowling green", "buffalo", 
            "central michigan", "eastern michigan", "kent state", 
            "massachusetts", "miami (oh)", "northern illinois", 
            "ohio", "toledo", "western michigan",

            // Mountain West
            "air force", "boise state", "colorado state", "fresno state",
            "hawaii", "nevada", "new mexico", "san diego state",
            "san jose state", "unlv", "utah state", "wyoming",

            // Pac-12
            "oregon state", "washington state",

            // SEC
            "alabama", "arkansas", "auburn", "florida", "georgia",
            "kentucky", "lsu", "mississippi state", "missouri",
            "oklahoma", "ole miss", "south carolina", "tennessee",
            "texas a&m", "texas", "vanderbilt",

            // Sun Belt
            "app state", "arkansas state", "coastal carolina", 
            "georgia southern", "georgia state", "james madison",
            "louisiana", "marshall", "old dominion", "south alabama",
            "southern miss", "texas state", "troy", "ul monroe"
        ]);

        // College Football Tournament/Conference Indicators
        this.collegeFootballIndicators = [
            'college football', 'ncaa football', 'fbs', 'fcs', 'bowl game',
            'cotton bowl', 'rose bowl', 'orange bowl', 'sugar bowl',
            'peach bowl', 'fiesta bowl', 'citrus bowl', 'outback bowl',
            'acc', 'big ten', 'sec', 'big 12', 'pac-12', 'aac',
            'mountain west', 'mac', 'conference usa', 'sun belt'
        ];

        // TENNIS PATTERN RECOGNITION
        this.tennisPatterns = {
            tomSingle: /^([A-Z][a-z]+ [A-Z][a-z]+) - ([A-Z][a-z]+ [A-Z][a-z]+)$/,
            sarahDoubles: /^([A-Z]\.[A-Za-z]+\/[A-Z]\.[A-Za-z]+) - ([A-Z]\.[A-Za-z]+\/[A-Z]\.[A-Za-z]+)$/,
            initialLast: /^([A-Z]\. [A-Za-z]+) - ([A-Z]\. [A-Za-z]+)$/,
            lastOnly: /^([A-Za-z]+) - ([A-Za-z]+)$/
        };

        // SPORT-SPECIFIC VALIDATION RULES
        this.sportValidation = {
            'Tennis': {
                teamCount: 2,
                hasPlayers: true,
                maxNameLength: 50
            },
            'American Football': {
                teamCount: 2, 
                hasTeams: true,
                minNameLength: 3
            },
            'Basketball': {
                teamCount: 2,
                hasTeams: true
            }
        };

        // FIELD MAPPINGS
        this.fieldMappings = this.createFieldMappings();
    }

    // === ALL SPORTS CLASSIFIER METHODS ===
    classifySport(match) {
        // 1. Check Sarah's data first
        if (match.category === 'american-football' || match.sport === 'college football') {
            return 'American Football';
        }
        
        // 2. Check Tom's tournament field
        if (match.tournament && match.tournament.toLowerCase().includes('college football')) {
            return 'American Football';
        }
        
        // 3. Check for college teams in match text
        const searchText = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        const hasCollegeTeam = Array.from(this.collegeFootballTeams).some(team => 
            searchText.includes(team.toLowerCase())
        );
        
        if (hasCollegeTeam && searchText.includes('football')) {
            return 'American Football';
        }
        
        // 4. Fallback to original sport
        return this.normalizeSportName(match.sport || match.category || 'Other');
    }

    isCollegeFootball(match) {
        const searchString = (match.match + ' ' + (match.tournament || '') + ' ' + (match.teams || '')).toLowerCase();
        
        const footballIndicators = [
            'college football', 'ncaa football', 'fbs', 'fcs', 'bowl game',
            'cotton bowl', 'rose bowl', 'orange bowl', 'sugar bowl', 'playoff'
        ];
        
        const hasFootballIndicator = footballIndicators.some(indicator => 
            searchString.includes(indicator)
        );
        
        if (hasFootballIndicator) {
            return true;
        }
        
        const hasCollegeTeam = Array.from(this.collegeFootballTeams).some(team => 
            searchString.includes(team.toLowerCase())
        );
        
        if (hasCollegeTeam) {
            const isLikelyFootball = 
                searchString.includes('football') ||
                !searchString.includes('soccer') && 
                !searchString.includes('basketball') && 
                !searchString.includes('volleyball');
                
            return isLikelyFootball;
        }
        
        return false;
    }

    normalizeSarahSport(match) {
        let rawSport = match.category || match.sport || '';
        
        const sarahCategoryMap = {
            'football': 'Football',
            'basketball': 'Basketball', 
            'tennis': 'Tennis',
            'hockey': 'Ice Hockey',
            'american-football': 'American Football',
            'volleyball': 'Volleyball'
        };
        
        if (sarahCategoryMap[rawSport.toLowerCase()]) {
            return sarahCategoryMap[rawSport.toLowerCase()];
        }
        
        return this.normalizeSportName(rawSport);
    }

    extractCompetitors(match, sport) {
        switch(sport) {
            case 'Tennis':
                return this.extractTennisPlayers(match);
            case 'American Football':
            case 'Basketball':
            case 'Football':
                return this.extractTeams(match);
            default:
                return this.extractGenericCompetitors(match);
        }
    }

    extractTennisPlayers(match) {
        const matchText = match.match || match.title || '';
        
        for (const [patternName, pattern] of Object.entries(this.tennisPatterns)) {
            const matchResult = matchText.match(pattern);
            if (matchResult) {
                return {
                    competitor1: matchResult[1],
                    competitor2: matchResult[2],
                    pattern: patternName
                };
            }
        }
        
        const separators = [' - ', ' vs ', ' / '];
        for (const separator of separators) {
            if (matchText.includes(separator)) {
                const [comp1, comp2] = matchText.split(separator);
                return {
                    competitor1: comp1.trim(),
                    competitor2: comp2.trim(), 
                    pattern: 'fallback'
                };
            }
        }
        
        return { competitor1: matchText, competitor2: '', pattern: 'unknown' };
    }

    extractTeams(match) {
        if (match.teams && match.teams.home && match.teams.away) {
            return {
                competitor1: match.teams.home.name,
                competitor2: match.teams.away.name,
                pattern: 'teams_object'
            };
        }
        
        const matchText = match.match || match.title || '';
        if (matchText.includes(' - ')) {
            const [team1, team2] = matchText.split(' - ');
            return {
                competitor1: team1.trim(),
                competitor2: team2.trim(),
                pattern: 'dash_separated'
            };
        }
        
        return { competitor1: matchText, competitor2: '', pattern: 'unknown' };
    }

    extractGenericCompetitors(match) {
        const matchText = match.match || match.title || '';
        
        const separators = [' - ', ' vs ', ' / ', ' @ '];
        for (const separator of separators) {
            if (matchText.includes(separator)) {
                const [comp1, comp2] = matchText.split(separator);
                return {
                    competitor1: comp1.trim(),
                    competitor2: comp2.trim(), 
                    pattern: 'generic'
                };
            }
        }
        
        return { 
            competitor1: matchText, 
            competitor2: '', 
            pattern: 'unknown' 
        };
    }

    isSarahData(match) {
        return match.category || (match.title && !match.match);
    }

    normalizeSportName(sport) {
        if (!sport || sport === 'Other') return 'Other';
        const sportLower = sport.toLowerCase().trim();
        
        return this.sportMap[sportLower] || 
               sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
    }

    titleCase(str) {
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    isMalformedSport(sport) {
        return !sport || sport === '' || sport === 'null' || sport === 'undefined' || sport === 'Other';
    }

    getAllKnownSports() {
        return Array.from(new Object.values(this.sportMap)).sort();
    }

    addSportMapping(variations, canonicalName) {
        variations.forEach(variation => {
            this.sportMap[variation.toLowerCase()] = canonicalName;
        });
    }

    isFootballSoccer(match) {
        const text = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        const footballTeams = [
            'manchester city', 'chelsea', 'barcelona', 'arsenal', 'liverpool',
            'real madrid', 'bayern', 'psg', 'juventus', 'tottenham',
            'dortmund', 'atletico', 'inter', 'ac milan'
        ];
        
        return footballTeams.some(team => text.includes(team));
    }

    isBasketball(match) {
        const text = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        const basketballWords = [
            'nba', 'basketball', 'kentucky', 'duke', 'north carolina',
            'kansas', 'ucla', 'march madness', 'ncaa tournament'
        ];
        
        return basketballWords.some(word => text.includes(word));
    }

    isRacing(match) {
        const text = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        return text.includes('formula 1') || text.includes('f1') || text.includes('grand prix');
    }

    // === FIELD NORMALIZATION METHODS ===
    createFieldMappings() {
        return {
            unix_timestamp: {
                field_names: ['unix_timestamp', 'timestamp', 'date', 'time', 'datetime'],
                converter: (value, rawData, supplier) => {
                    if (!value) return Math.floor(Date.now() / 1000);
                    if (typeof value === 'string') return Math.floor(Date.parse(value) / 1000);
                    if (value > 1000000000000) return Math.floor(value / 1000);
                    return value;
                }
            },
            
            sport: {
                field_names: ['sport', 'category', 'sportCategory', 'sports', '_sport', 'type'],
                converter: (value, rawData, supplier) => {
                    return this.classifySport(rawData);
                }
            },
            
            tournament: {
                field_names: ['tournament', 'league', 'competition', 'event', 'series', 'league.name'],
                converter: (value, rawData, supplier) => {
                    return value || '';
                }
            },
            
            match: {
                field_names: ['match', 'title', 'teams', 'event', 'game', 'fixture'],
                converter: (value, rawData, supplier) => {
                    if (rawData.teams && rawData.teams.home && rawData.teams.away) {
                        return `${rawData.teams.home.name || ''} vs ${rawData.teams.away.name || ''}`.trim();
                    }
                    if (rawData.teams && rawData.teams.event) {
                        return rawData.teams.event;
                    }
                    if (value && value.includes(' - ')) {
                        return value.replace(/ - /g, ' vs ');
                    }
                    return value || 'Unknown Match';
                }
            },
            
            sources: {
                field_names: ['channels', 'streams', 'sources', 'urls', 'links'],
                converter: (value, rawData, supplier) => {
                    const sources = {};
                    
                    if (supplier === 'tom' && Array.isArray(value)) {
                        sources.tom = value;
                    }
                    else if (supplier === 'sarah' && Array.isArray(value)) {
                        sources.sarah = value.map(source => 
                            `https://embedsports.top/embed/${source.source}/${source.id}/1`
                        );
                    }
                    else if (supplier === 'wendy' && Array.isArray(value)) {
                        sources.wendy = value.map(stream => stream.url);
                    }
                    else if (Array.isArray(value)) {
                        sources[supplier] = value;
                    } else {
                        sources[supplier] = [];
                    }
                    
                    return sources;
                }
            }
        };
    }

    findFieldValue(rawData, possibleNames) {
        for (const fieldName of possibleNames) {
            if (fieldName.includes('.')) {
                const value = this.getNestedValue(rawData, fieldName);
                if (value !== undefined && value !== null) return value;
            }
            else if (rawData[fieldName] !== undefined && rawData[fieldName] !== null) {
                return rawData[fieldName];
            }
        }
        return null;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    standardizeMatch(rawData, supplierName) {
        const standardized = {
            source: supplierName,
            sources: {}
        };

        for (const [field, mapping] of Object.entries(this.fieldMappings)) {
            const foundValue = this.findFieldValue(rawData, mapping.field_names);
            const convertedValue = mapping.converter(foundValue, rawData, supplierName);
            
            if (field === 'sources') {
                Object.assign(standardized.sources, convertedValue);
            } else {
                standardized[field] = convertedValue;
            }
        }

        return standardized;
    }

    getAllFieldNames() {
        const allNames = {};
        for (const [field, mapping] of Object.entries(this.fieldMappings)) {
            allNames[field] = mapping.field_names;
        }
        return allNames;
    }
}

module.exports = NormalizationMap;
