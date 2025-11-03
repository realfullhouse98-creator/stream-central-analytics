const API_CONFIG = {
    EMBEDSPORTS: {
        BASE_URL: 'https://streamed.pk/api',
        ENDPOINTS: {
            MATCHES: '/matches/{sport}',
            STREAMS: '/stream/{source}/{id}'
        }
    },
    TOPEMBED: {
        BASE_URL: 'https://topembed.pw',
        ENDPOINTS: {
            ALL_MATCHES: '/api.php?format=json'
        }
    }
};
window.API_CONFIG = API_CONFIG;
