// modules/utils.js
export const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export const formatDisplayDate = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    });
};

export const formatTeamNames = (teamString) => {
    return teamString.replace(/ - /g, ' vs ');
};
