// Utilities Module - Helper functions and formatting utilities
class Utils {
    static formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    static formatTeamNames(teamString) {
        return teamString.replace(/ - /g, ' vs ');
    }

    static formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    }

    static convertUnixToLocalTime(unixTimestamp) {
        if (!unixTimestamp) return 'TBD';
        return new Date(unixTimestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }

    static checkIfLive(match) {
        if (!match.unix_timestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        const matchTime = match.unix_timestamp;
        return now >= matchTime && now <= (matchTime + 10800);
    }

    static generateMatchId(match) {
        return `${match.match}-${match.unix_timestamp}-${Math.random().toString(36).substr(2, 6)}`;
    }

    static getTeamName(teamString, index) {
        const teams = teamString.split(' - ');
        return teams[index] || `Team ${index + 1}`;
    }

    static getCountryFlag(country) {
        const flags = {
            'South Africa': '🇿🇦',
            'USA': '🇺🇸',
            'UK': '🇬🇧',
            'Argentina': '🇦🇷',
            'Australia': '🇦🇺',
            'Belgium': '🇧🇪',
            'Brazil': '🇧🇷',
            'Canada': '🇨🇦',
            'France': '🇫🇷',
            'Germany': '🇩🇪',
            'India': '🇮🇳',
            'Ireland': '🇮🇪',
            'Italy': '🇮🇹',
            'Mexico': '🇲🇽',
            'Netherlands': '🇳🇱',
            'New Zealand': '🇳🇿',
            'Pakistan': '🇵🇰',
            'Poland': '🇵🇱',
            'Portugal': '🇵🇹',
            'Romania': '🇷🇴',
            'Serbia': '🇷🇸',
            'Spain': '🇪🇸'
        };
        return flags[country] || '🌍';
    }

    static setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error caught:', e);
            Utils.showErrorUI('Something went wrong. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e);
            Utils.showErrorUI('Application error occurred.');
        });
    }

    static showErrorUI(message) {
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = message;
            errorBoundary.style.display = 'block';
        }
    }

    static waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('✅ DOM fully loaded and parsed');
                    resolve();
                });
            } else {
                console.log('✅ DOM already ready');
                resolve();
            }
        });
    }

    static registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}
