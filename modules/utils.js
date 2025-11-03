// modules/utils.js - COMPLETE VERSION
export const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export const formatDisplayDate = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', 
        month: 'short', 
        day: 'numeric'
    });
};

export const formatTeamNames = (teamString) => {
    return teamString.replace(/ - /g, ' vs ');
};

export const convertUnixToLocalTime = (unixTimestamp) => {
    if (!unixTimestamp) return 'TBD';
    return new Date(unixTimestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false
    });
};

export const checkIfLive = (match) => {
    if (!match.unix_timestamp) return false;
    const now = Math.floor(Date.now() / 1000);
    const matchTime = match.unix_timestamp;
    return now >= matchTime && now <= (matchTime + 10800); // 3 hour window
};

export const generateMatchId = (match) => {
    return `${match.match}-${match.unix_timestamp}-${Math.random().toString(36).substr(2, 6)}`;
};

export const getTeamName = (teamString, index) => {
    const teams = teamString.split(' - ');
    return teams[index] || `Team ${index + 1}`;
};

export const normalizeTeamNamesForComparison = (teamString) => {
    if (!teamString) return '';
    
    return teamString
        .toLowerCase()
        .replace(/\s*vs\.?\s*/g, ' - ')
        .replace(/\s*-\s*/g, ' - ')
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s-]/g, '')
        .trim();
};

export const setupGlobalErrorHandling = () => {
    window.addEventListener('error', (e) => {
        console.error('Global error caught:', e);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e);
    });
};

export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

export const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
};

export const capitalizeFirst = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const sanitizeHTML = (str) => {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getTimeRemaining = (endTime) => {
    const total = Date.parse(endTime) - Date.parse(new Date());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return {
        total,
        days,
        hours,
        minutes,
        seconds
    };
};
