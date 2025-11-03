// modules/stream-manager.js
export class StreamManager {
    constructor() {
        this.streamPersonalities = {
            'topembed': { name: 'Tom', color: '#3498db', emoji: '🔵' },
            'streamed': { name: 'Sarah', color: '#e74c3c', emoji: '🔴' },
            'unknown': { name: 'Mystery', color: '#9b59b6', emoji: '🟣' }
        };
        this.currentStreams = new Map();
    }

    detectSourceType(streamUrl) {
        if (!streamUrl) return 'unknown';
        if (streamUrl.includes('topembed')) return 'topembed';
        if (streamUrl.includes('streamed.pk')) return 'streamed';
        return 'unknown';
    }

    generatePersonalityLabel(sourceType, index) {
        const personality = this.streamPersonalities[sourceType] || this.streamPersonalities['unknown'];
        return `${personality.emoji} ${personality.name} ${index + 1}`;
    }

    getSourceColor(sourceType) {
        const personality = this.streamPersonalities[sourceType] || this.streamPersonalities['unknown'];
        return personality.color;
    }

    switchChannel(matchId, channelIndex) {
        this.currentStreams.set(matchId, channelIndex);
    }
}
