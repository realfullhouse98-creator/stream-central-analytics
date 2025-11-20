class SportsClassifier {
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

            // ACC.  
            "Boston College Eagles",
    "California Golden Bears",
    "Clemson Tigers",
    "Duke Blue Devils",
    "Florida State Seminoles",
    "Georgia Tech Yellow Jackets",
    "Louisville Cardinals",
    "Miami Hurricanes",
    "NC State Wolfpack",
    "North Carolina Tar Heels",
    "Pittsburgh Panthers",
    "SMU Mustangs",
    "Stanford Cardinal",
    "Syracuse Orange",
    "Virginia Cavaliers",
    "Virginia Tech Hokies",
    "Wake Forest Demon Deacons",
          
           // American 
           "Army Black Knights",
    "Charlotte 49ers",
    "East Carolina Pirates",
    "Florida Atlantic Owls",
    "Memphis Tigers",
    "Navy Midshipmen",
    "North Texas Mean Green",
    "Rice Owls",
    "South Florida Bulls",
    "Temple Owls",
    "Tulane Green Wave",
    "Tulsa Golden Hurricane",
    "UAB Blazers",
    "UTSA Roadrunners",

           // Big 12
           "Arizona State Sun Devils",
    "Arizona Wildcats",
    "BYU Cougars",
    "Baylor Bears",
    "Cincinnati Bearcats",
    "Colorado Buffaloes",
    "Houston Cougars",
    "Iowa State Cyclones",
    "Kansas Jayhawks",
    "Kansas State Wildcats",
    "Oklahoma State Cowboys",
    "TCU Horned Frogs",
    "Texas Tech Red Raiders",
    "UCF Knights",
    "Utah Utes",
    "West Virginia Mountaineers",

            // Big 10
            "Illinois Fighting Illini",
    "Indiana Hoosiers",
    "Iowa Hawkeyes",
    "Maryland Terrapins",
    "Michigan State Spartans",
    "Michigan Wolverines",
    "Minnesota Golden Gophers",
    "Nebraska Cornhuskers",
    "Northwestern Wildcats",
    "Ohio State Buckeyes",
    "Oregon Ducks",
    "Penn State Nittany Lions",
    "Purdue Boilermakers",
    "Rutgers Scarlet Knights",
    "UCLA Bruins",
    "USC Trojans",
    "Washington Huskies",
    "Wisconsin Badgers",

            // Conference USA
        "Delaware Blue Hens",
    "Florida International Panthers",
    "Jacksonville State Gamecocks",
    "Kennesaw State Owls",
    "Liberty Flames",
    "Louisiana Tech Bulldogs",
    "Middle Tennessee Blue Raiders",
    "Missouri State Bears",
    "New Mexico State Aggies",
    "Sam Houston Bearkats",
    "UTEP Miners",
    "Western Kentucky Hilltoppers",

            // FBS Independents
         "Notre Dame Fighting Irish",
    "UConn Huskies",

            // Mid-American (MAC)
         "Akron Zips",
    "Ball State Cardinals",
    "Bowling Green Falcons",
    "Buffalo Bulls",
    "Central Michigan Chippewas",
    "Eastern Michigan Eagles",
    "Kent State Golden Flashes",
    "Massachusetts Minutemen",
    "Miami (OH) RedHawks",
    "Northern Illinois Huskies",
    "Ohio Bobcats",
    "Toledo Rockets",
    "Western Michigan Broncos",

            // Mountain West
        "Air Force Falcons",
    "Boise State Broncos",
    "Colorado State Rams",
    "Fresno State Bulldogs",
    "Hawai'i Rainbow Warriors",
    "Nevada Wolf Pack",
    "New Mexico Lobos",
    "San Diego State Aztecs",
    "San José State Spartans",
    "UNLV Rebels",
    "Utah State Aggies",
    "Wyoming Cowboys",

            // Mountain West
        "Oregon State Beavers",
    "Washington State Cougars",

            // SEC
        "Alabama Crimson Tide",
    "Arkansas Razorbacks",
    "Auburn Tigers",
    "Florida Gators",
    "Georgia Bulldogs",
    "Kentucky Wildcats",
    "LSU Tigers",
    "Mississippi State Bulldogs",
    "Missouri Tigers",
    "Oklahoma Sooners",
    "Ole Miss Rebels",
    "South Carolina Gamecocks",
    "Tennessee Volunteers",
    "Texas A&M Aggies",
    "Texas Longhorns",
    "Vanderbilt Commodores",

            // Sun Belt
        "App State Mountaineers",
    "Arkansas State Red Wolves",
    "Coastal Carolina Chanticleers",
    "Georgia Southern Eagles",
    "Georgia State Panthers",
    "James Madison Dukes",
    "Louisiana Ragin' Cajuns",
    "Marshall Thundering Herd",
    "Old Dominion Monarchs",
    "South Alabama Jaguars",
    "Southern Miss Golden Eagles",
    "Texas State Bobcats",
    "Troy Trojans",
    "UL Monroe Warhawks"


        ]);

        // College Football Tournament/Conference Indicators
        this.collegeFootballIndicators = [
            'college football', 'ncaa football', 'fbs', 'fcs', 'bowl game',
            'cotton bowl', 'rose bowl', 'orange bowl', 'sugar bowl',
            'peach bowl', 'fiesta bowl', 'citrus bowl', 'outback bowl',
            'acc', 'big ten', 'sec', 'big 12', 'pac-12', 'aac',
            'mountain west', 'mac', 'conference usa', 'sun belt'
        ];

        // TENNIS PATTERN RECOGNITION - Handle different name formats
        this.tennisPatterns = {
            // Tom format: "Cooper White - Marvin Buytaert"
            tomSingle: /^([A-Z][a-z]+ [A-Z][a-z]+) - ([A-Z][a-z]+ [A-Z][a-z]+)$/,
            
            // Sarah format: "T.Handel/B.Steudter - J.Schlageter/A.Yazdani"  
            sarahDoubles: /^([A-Z]\.[A-Za-z]+\/[A-Z]\.[A-Za-z]+) - ([A-Z]\.[A-Za-z]+\/[A-Z]\.[A-Za-z]+)$/,
            
            // Mixed formats we might encounter
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
    }

    classifySport(match) {
    // 1. Use Tom's sport field (always correct)
    if (match.sport && match.sport !== 'Other') {
        return this.normalizeSportName(match.sport);
    }
    
    // 2. Use Sarah's category field  
    if (match.category) {
        return this.normalizeSportName(match.category);
    }
    
    // 3. College football detection for edge cases
    if (this.isCollegeFootball(match)) {
        return 'American Football';
    }
    
    return 'Other';
}

    // ENHANCED College Football Detection
    isCollegeFootball(match) {
        const searchString = (match.match + ' ' + (match.tournament || '') + ' ' + (match.teams || '')).toLowerCase();
        
        // Check for team names in our database
        const hasCollegeTeam = Array.from(this.collegeFootballTeams).some(team => 
            searchString.includes(team)
        );
        
        // Check for tournament/conference indicators
        const hasCollegeIndicator = this.collegeFootballIndicators.some(indicator => 
            searchString.includes(indicator)
        );
        
        return hasCollegeTeam || hasCollegeIndicator;
    }
  

    // ENHANCED Sarah Data Handling
    normalizeSarahSport(match) {
        let rawSport = match.category || match.sport || '';
        
        // Handle Sarah's inconsistent category names
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

    // NEW: Extract and normalize player/team names for matching
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
        
        // Try different tennis name patterns
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
        
        // Fallback: split by common separators
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
        // Handle Sarah's teams object
        if (match.teams && match.teams.home && match.teams.away) {
            return {
                competitor1: match.teams.home.name,
                competitor2: match.teams.away.name,
                pattern: 'teams_object'
            };
        }
        
        // Handle Tom's format: "Team A - Team B"
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
// ADD THIS METHOD TO YOUR SportsClassifier class:

extractGenericCompetitors(match) {
    const matchText = match.match || match.title || '';
    
    // Try common separators
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
    
    // Fallback: return the whole text as competitor1
    return { 
        competitor1: matchText, 
        competitor2: '', 
        pattern: 'unknown' 
    };
}
    // Keep existing methods
    isSarahData(match) {
        return match.category || (match.title && !match.match);
    }

   normalizeSportName(sport) {
    if (!sport || sport === 'Other') return 'Other';
    const sportLower = sport.toLowerCase().trim();
    
    // Make sure these are in your sportMap:
    return this.sportMap[sportLower] || 
           sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase();
}

    titleCase(str) {
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    isMalformedSport(sport) {
        return !sport || sport === '' || sport === 'null' || sport === 'undefined' || sport === 'Other';
    }

    // NEW: Get all known sports for reference
    getAllKnownSports() {
        return Array.from(new Object.values(this.sportMap)).sort();
    }

    // NEW: Add custom sport mappings
    addSportMapping(variations, canonicalName) {
        variations.forEach(variation => {
            this.sportMap[variation.toLowerCase()] = canonicalName;
        });
    }

      // 🚨 ADD THESE 3 NEW METHODS RIGHT HERE:

    // NEW: Football/Soccer detection
    isFootballSoccer(match) {
        const text = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        const footballTeams = [
            'manchester city', 'chelsea', 'barcelona', 'arsenal', 'liverpool',
            'real madrid', 'bayern', 'psg', 'juventus', 'tottenham',
            'dortmund', 'atletico', 'inter', 'ac milan'
        ];
        
        return footballTeams.some(team => text.includes(team));
    }

    // NEW: Basketball detection  
    isBasketball(match) {
        const text = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        
        const basketballWords = [
            'nba', 'basketball', 'kentucky', 'duke', 'north carolina',
            'kansas', 'ucla', 'march madness', 'ncaa tournament'
        ];
        
        return basketballWords.some(word => text.includes(word));
    }

    // NEW: Racing detection
    isRacing(match) {
        const text = (match.match + ' ' + (match.tournament || '')).toLowerCase();
        return text.includes('formula 1') || text.includes('f1') || text.includes('grand prix');
    }
}
module.exports = SportsClassifier;
