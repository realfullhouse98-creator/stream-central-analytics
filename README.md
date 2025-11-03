# stream-central-analytics .
Live streaming with analytics



Matches API
The Matches API provides access to sports events data, including match details, team information, and available stream sources.
Match Object Structure
interface APIMatch {
    id: string;               // Unique identifier for the match
    title: string;            // Match title (e.g. "Team A vs Team B")
    category: string;         // Sport category (e.g. "football", "basketball")
    date: number;             // Unix timestamp in milliseconds
    poster?: string;          // URL path to match poster image
    popular: boolean;         // Whether the match is marked as popular
    teams?: {
        home?: {
            name: string;     // Home team name
            badge: string;    // URL path to home team badge
        },
        away?: {
            name: string;     // Away team name
            badge: string;    // URL path to away team badge
        }
    };
    sources: {
        source: string;       // Stream source identifier (e.g. "alpha", "bravo")
        id: string;           // Source-specific match ID
    }[];
}


Available Endpoints
Sport-Specific Matches
Get matches for a specific sport category:
GET /api/matches/[SPORT]
GET /api/matches/[SPORT]/popular
Note: Replace [SPORT] with a sport ID from the Sports API.
All Matches
Get all available matches across all sports:
GET /api/matches/all
GET /api/matches/all/popular


Today's Matches
Get matches scheduled for today:
GET /api/matches/all-today
GET /api/matches/all-today/popular


Live Matches
Get currently live matches:
GET /api/matches/live
GET /api/matches/live/popular


// Example: Get all live matches
fetch('https://streamed.pk/api/matches/live')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(matches => {
    // Process the matches data
    matches.forEach(match => {
      console.log(`Match: ${match.title}, Time: ${new Date(match.date).toLocaleString()}`);
      
      // Access team information if available
      if (match.teams) {
        if (match.teams.home) console.log(`Home: ${match.teams.home.name}`);
        if (match.teams.away) console.log(`Away: ${match.teams.away.name}`);
      }
      
      // Get stream sources
      console.log('Available sources:', match.sources.map(s => s.source).join(', '));
    });
  })
  .catch(error => console.error('Error fetching matches:', error));


To get stream details for a specific match, use the sources from the match object with 
the Streams API.
Response Format
All endpoints return an array of match objects:
// Example response from /api/matches/football
[
  {
    "id": "match_123",
    "title": "Manchester United vs Liverpool",
    "category": "football",
    "date": 1720598400000,
    "poster": "man-utd-liverpool-poster",
    "popular": true,
    "teams": {
      "home": {
        "name": "Manchester United",
        "badge": "man-utd-badge"
      },
      "away": {
        "name": "Liverpool",
        "badge": "liverpool-badge"
      }
    },
    "sources": [
      {
        "source": "alpha",
        "id": "mu-liv-123"
      },
      {
        "source": "bravo",
        "id": "456-mu-liv"
      }
    ]
  },
  // More match objects...
]
Streams API
The Streams API provides access to live streaming sources for sports events. These endpoints return stream details that can be used to embed or access video streams for matches.
Stream Object Structure
interface Stream {
    id: string;        // Unique identifier for the stream
    streamNo: number;  // Stream number/index
    language: string;  // Stream language (e.g., "English", "Spanish")
    hd: boolean;       // Whether the stream is in HD quality
    embedUrl: string;  // URL that can be used to embed the stream
    source: string;    // Source identifier (e.g., "alpha", "bravo")
}
Available Endpoints
Source-Specific Stream Endpoints
Get streams from a specific source for a match:
Source
Endpoint
Alpha
GET /api/stream/alpha/[id]
Bravo
GET /api/stream/bravo/[id]
Charlie
GET /api/stream/charlie/[id]
Delta
GET /api/stream/delta/[id]
Echo
GET /api/stream/echo/[id]
Foxtrot
GET /api/stream/foxtrot/[id]
Golf
GET /api/stream/golf/[id]
Hotel
GET /api/stream/hotel/[id]
Intel
GET /api/stream/intel/[id]

Note: Replace [id] with the source-specific match ID from the match's sources array.
How to Use
To access streams for a match:
First, get a match object from the Matches API
Extract the source and id from the match's sources array
Use these values to request streams from the appropriate endpoint
Usage Example
// First, get match data to find available sources
fetch('https://streamed.pk/api/matches/live')
  .then(response => response.json())
  .then(matches => {
    if (matches.length > 0) {
      // Get the first match
      const match = matches[0];
      console.log(`Found match: ${match.title}`);
      
      // Check if the match has sources
      if (match.sources && match.sources.length > 0) {
        // Get the first source
        const source = match.sources[0];
        console.log(`Using source: ${source.source}, ID: ${source.id}`);
        
        // Request streams for this source
        return fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
      } else {
        throw new Error('No sources available for this match');
      }
    } else {
      throw new Error('No matches found');
    }
  })
  .then(response => response.json())
  .then(streams => {
    // Process the streams
    console.log(`Found ${streams.length} streams`);
    
    streams.forEach(stream => {
      console.log(`Stream #${stream.streamNo}: ${stream.language} (${stream.hd ? 'HD' : 'SD'})`);
      console.log(`Embed URL: ${stream.embedUrl}`);
      
      // Here you would typically use the embedUrl to display the stream
      // For example, in an iframe:
      // document.getElementById('player').src = stream.embedUrl;
    });
  })
  .catch(error => console.error('Error:', error));
Response Format
All endpoints return an array of stream objects:
// Example response from /api/stream/alpha/match123
[
  {
    "id": "stream_456",
    "streamNo": 1,
    "language": "English",
    "hd": true,
    "embedUrl": "https://embed.example.com/watch?v=abcd1234",
    "source": "alpha"
  },
  {
    "id": "stream_457",
    "streamNo": 2,
    "language": "Spanish",
    "hd": false,
    "embedUrl": "https://embed.example.com/watch?v=efgh5678",
    "source": "alpha"
  }
  // More stream objects...
]
Embedding a Stream
To embed a stream in your website, use the embedUrl in an iframe:
// HTML
<iframe 
  id="stream-player" 
  width="640" 
  height="360" 
  frameborder="0" 
  allowfullscreen>
</iframe>


// JavaScript
function loadStream(embedUrl) {
  document.getElementById('stream-player').src = embedUrl;
}
Sports API
The Sports API provides access to all available sport categories on the Streamed platform. These sport IDs are used to filter matches by category in the Matches API.
Sport Object Structure
interface Sport {
    id: string;    // Sport identifier (used in Matches API endpoints)
    name: string;  // Display name of the sport
}
Available Endpoint
Get All Sports
Retrieves all available sport categories:
GET /api/sports
Usage Example
// Get all available sports
fetch('https://streamed.pk/api/sports')
  .then(response => response.json())
  .then(sports => {
    // Create a sport selection dropdown
    const select = document.createElement('select');
    select.id = 'sport-selector';
    
    // Add a default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a sport';
    select.appendChild(defaultOption);
    
    // Add an option for each sport
    sports.forEach(sport => {
      const option = document.createElement('option');
      option.value = sport.id;
      option.textContent = sport.name;
      select.appendChild(option);
    });
    
    // Add event listener to load matches when a sport is selected
    select.addEventListener('change', (event) => {
      const sportId = event.target.value;
      if (sportId) {
        // Fetch matches for the selected sport
        fetch(`https://streamed.pk/api/matches/${sportId}`)
          .then(response => response.json())
          .then(matches => {
            console.log(`Found ${matches.length} matches for ${sportId}`);
            // Process matches...
          })
          .catch(error => console.error('Error fetching matches:', error));
      }
    });
    
    // Add the select element to the page
    document.getElementById('sports-container').appendChild(select);
  })
  .catch(error => console.error('Error fetching sports:', error));
Response Format
The endpoint returns an array of sport objects:
// Example response from /api/sports
[
  {
    "id": "football",
    "name": "Football"
  },
  {
    "id": "basketball",
    "name": "Basketball"
  },
  {
    "id": "tennis",
    "name": "Tennis"
  },
  {
    "id": "hockey",
    "name": "Hockey"
  },
  {
    "id": "baseball",
    "name": "Baseball"
  },
  {
    "id": "mma",
    "name": "MMA"
  },
  {
    "id": "boxing",
    "name": "Boxing"
  }
  // More sport objects...
]
Common Use Cases
Building sport category navigation menus
Filtering match listings by sport
Creating sport-specific pages or sections
Implementing search filters for matches


Images API
The Images API provides access to various visual assets used throughout the Streamed platform, including team badges, match posters, and proxied images. All images are served in WebP format for optimal performance.
Available Endpoints
Team Badges
Get team badge images:
GET /api/images/badge/[id].webp
Note: The [id] value is provided in the team.badge field of the match object.
Match Posters
Get match poster images:
GET /api/images/poster/[badge]/[badge].webp
Note: The [badge] values are typically derived from team badge IDs for the match.
Proxied Images
Access images via proxy (useful for external images):
GET /api/images/proxy/[poster].webp
Note: The [poster] value is provided in the poster field of the match object.
Usage Example
// First, get match data to find image references
fetch('https://streamed.pk/api/matches/football')
  .then(response => response.json())
  .then(matches => {
    if (matches.length > 0) {
      const match = matches[0];
      
      // Create container for match details
      const container = document.createElement('div');
      
      // Add match title
      const title = document.createElement('h2');
      title.textContent = match.title;
      container.appendChild(title);
      
      // Add match date
      const date = document.createElement('p');
      date.textContent = new Date(match.date).toLocaleString();
      container.appendChild(date);
      
      // Add team badges if available
      if (match.teams) {
        const teamsDiv = document.createElement('div');
        teamsDiv.style.display = 'flex';
        teamsDiv.style.alignItems = 'center';
        
        if (match.teams.home && match.teams.home.badge) {
          const homeBadge = document.createElement('img');
          homeBadge.src = `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`;
          homeBadge.alt = match.teams.home.name;
          homeBadge.width = 50;
          homeBadge.height = 50;
          teamsDiv.appendChild(homeBadge);
        }
        
        const vs = document.createElement('span');
        vs.textContent = ' vs ';
        vs.style.margin = '0 10px';
        teamsDiv.appendChild(vs);
        
        if (match.teams.away && match.teams.away.badge) {
          const awayBadge = document.createElement('img');
          awayBadge.src = `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`;
          awayBadge.alt = match.teams.away.name;
          awayBadge.width = 50;
          awayBadge.height = 50;
          teamsDiv.appendChild(awayBadge);
        }
        
        container.appendChild(teamsDiv);
      }
      
      // Add match poster if available
      if (match.poster) {
        const poster = document.createElement('img');
        poster.src = `https://streamed.pk${match.poster}.webp`;
        poster.alt = match.title;
        poster.style.maxWidth = '100%';
        poster.style.marginTop = '20px';
        container.appendChild(poster);
      }
      
      // Add the container to the page
      document.getElementById('match-container').appendChild(container);
    }
  })
  .catch(error => console.error('Error:', error));
HTML Implementation Example
<!-- Team Badge Example -->
<img 
  src="https://streamed.pk/api/images/badge/man-utd-badge.webp" 
  alt="Manchester United" 
  width="50" 
  height="50"
/>


<!-- Match Poster Example -->
<img 
  src="https://streamed.pk/api/images/poster/man-utd-badge/liverpool-badge.webp" 
  alt="Manchester United vs Liverpool" 
  class="match-poster"
/>


<!-- Proxied Image Example -->
<img 
  src="https://streamed.pk/api/images/proxy/custom-event-poster.webp" 
  alt="Special Event" 
  class="event-poster"
/>
Image Optimization Tips
All images are served in WebP format for optimal compression and quality
Use appropriate width/height attributes to prevent layout shifts
Consider using the loading="lazy" attribute for images below the fold
Images can be styled with CSS as needed for responsive design











