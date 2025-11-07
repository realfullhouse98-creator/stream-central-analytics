const API_CONFIG = {
    STREAMED: {
        BASE_URL: 'https://streamed.pk/api',
        ENDPOINTS: {
            // Matches endpoints
            ALL_MATCHES: '/matches/all',
            LIVE_MATCHES: '/matches/live',
            TODAY_MATCHES: '/matches/all-today',
            SPORT_MATCHES: '/matches/{sport}',
            // Streams endpoints
            STREAMS: '/stream/{source}/{id}',
            // Sports endpoint
            SPORTS: '/sports'
        }
    },
    
    TOPEMBED: {
        BASE_URL: 'https://topembed.pw',
        ENDPOINTS: {
            ALL_MATCHES: '/api.php?format=json'
        }
    },

    EMILY: {
        BASE_URL: 'https://embednow.top',
        ENDPOINTS: {
            STREAMS: '/api/streams'
        },
        CONFIG: {
            cacheTime: 60000, // Respect their 1min polling advice
            requiresTransform: true, // Needs special data transformation
            enabled: true
        }
    }
};

window.API_CONFIG = API_CONFIG;
