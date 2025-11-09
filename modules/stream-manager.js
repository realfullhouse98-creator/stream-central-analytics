// Stream Manager Module - SIMPLIFIED WITH CLEAN DROPDOWN
class StreamManager {
    constructor() {
        this.streamPersonalities = {
            'topembed': { 
                name: 'Tom', 
                color: '#3498db', 
                emoji: '🔵',
                fullName: 'TopEmbed'
            },
            'streamed': { 
                name: 'Sarah', 
                color: '#e74c3c', 
                emoji: '🔴',
                fullName: 'Streamed' 
            },
            'unknown': {
                name: 'Mystery',
                color: '#9b59b6',
                emoji: '🟣', 
                fullName: 'Unknown Source'
            }
        };
        
        this.currentStreams = new Map();
    }

    detectSourceType(streamUrl) {
        if (!streamUrl) return 'unknown';
        if (streamUrl.includes('topembed')) return 'topembed';
        if (streamUrl.includes('streamed.pk') || streamUrl.includes('embedsports.top')) return 'streamed';
        return 'unknown';
    }

    getPersonality(sourceType, index) {
        const personality = this.streamPersonalities[sourceType] || this.streamPersonalities['unknown'];
        return {
            ...personality,
            label: `${personality.emoji} ${personality.name} ${index + 1}`
        };
    }

    async getActualStreamUrl(streamUrl) {
        console.log('🔄 Transforming URL:', streamUrl);
        
        // If it's a Streamed API URL, transform it to real stream
        if (streamUrl.includes('streamed.pk/api/stream')) {
            const actualUrl = await this.getStreamUrlFromStreamed(streamUrl);
            console.log('✅ Transformed to:', actualUrl);
            return actualUrl;
        }
        
        // If it's already a direct URL, use it as is
        console.log('✅ Using direct URL:', streamUrl);
        return streamUrl;
    }

    async getStreamUrlFromStreamed(streamApiUrl) {
        try {
            console.log('🔄 Getting actual stream URL from:', streamApiUrl);
            const response = await fetch(streamApiUrl);
            const streamData = await response.json();
            console.log('📦 Stream data received:', streamData);
            
            if (streamData && streamData.length > 0 && streamData[0].embedUrl) {
                console.log('✅ Found embed URL:', streamData[0].embedUrl);
                return streamData[0].embedUrl;
            }
            return null;
        } catch (error) {
            console.warn('❌ Failed to get stream from Streamed:', error);
            return null;
        }
    }

    generateSourceDropdown(channels, matchId, currentChannelIndex) {
        if (channels.length === 0) {
            return '';
        }
        
        console.log('🔍 GENERATING DROPDOWN OPTIONS:');
        channels.forEach((channel, index) => {
            const sourceType = this.detectSourceType(channel);
            const personality = this.getPersonality(sourceType, index);
            console.log(`   ${index}: ${channel} -> ${personality.label}`);
        });
        
        return `
            <div class="source-selector">
                <select class="source-dropdown" onchange="window.matchScheduler.switchChannel('${matchId}', this.value)">
                    ${channels.map((channel, index) => {
                        const sourceType = this.detectSourceType(channel);
                        const personality = this.getPersonality(sourceType, index);
                        return `
                            <option value="${index}" ${index === currentChannelIndex ? 'selected' : ''}>
                                ${personality.label}
                            </option>
                        `;
                    }).join('')}
                </select>
            </div>
        `;
    }

    switchChannel(matchId, channelIndex) {
        this.currentStreams.set(matchId, parseInt(channelIndex));
        return parseInt(channelIndex);
    }

    getCurrentChannelIndex(matchId) {
        return this.currentStreams.get(matchId) || 0;
    }

    refreshCurrentStream(matchId) {
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
                
                const refreshBtn = document.querySelector('.player-control-btn.refresh');
                if (refreshBtn) {
                    const originalText = refreshBtn.innerHTML;
                    refreshBtn.innerHTML = 'Refreshing...';
                    setTimeout(() => {
                        refreshBtn.innerHTML = originalText;
                    }, 1000);
                }
            }, 500);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamManager;
} else {
    window.StreamManager = StreamManager;
}
