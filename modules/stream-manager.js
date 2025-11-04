// Stream Manager Module - Handles stream personalities and channel management
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

    generateChannelSelector(channels, matchId, currentChannelIndex) {
        if (channels.length === 0) {
            return '';
        }
        
        if (channels.length <= 4) {
            return `
                <div class="channel-buttons-inline">
                    ${channels.map((channel, index) => {
                        const sourceType = this.detectSourceType(channel);
                        const personalityLabel = this.generatePersonalityLabel(sourceType, index);
                        return `
                            <button class="channel-btn-inline ${index === currentChannelIndex ? 'active' : ''}" 
                                    onclick="matchScheduler.switchChannel('${matchId}', ${index})"
                                    style="border-left: 3px solid ${this.getSourceColor(sourceType)}">
                                ${personalityLabel}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        return `
            <div class="channel-dropdown-inline">
                <button class="channel-dropdown-btn-inline" onclick="matchScheduler.toggleDropdown('${matchId}')">
                    Source ${currentChannelIndex + 1} of ${channels.length}
                </button>
                <div class="channel-dropdown-content-inline" id="dropdown-${matchId}">
                    ${channels.map((channel, index) => {
                        const sourceType = this.detectSourceType(channel);
                        const personalityLabel = this.generatePersonalityLabel(sourceType, index);
                        return `
                            <div class="channel-dropdown-item-inline ${index === currentChannelIndex ? 'active' : ''}" 
                                 onclick="matchScheduler.switchChannel('${matchId}', ${index})"
                                 style="border-left: 3px solid ${this.getSourceColor(sourceType)}">
                                ${personalityLabel}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    switchChannel(matchId, channelIndex) {
        this.currentStreams.set(matchId, channelIndex);
        return channelIndex;
    }

    getCurrentChannelIndex(matchId) {
        return this.currentStreams.get(matchId) || 0;
    }

    toggleDropdown(matchId) {
        try {
            const dropdown = document.getElementById(`dropdown-${matchId}`);
            
            if (!dropdown) {
                console.error('❌ Dropdown not found for:', matchId);
                return;
            }
            
            const button = dropdown.previousElementSibling;
            
            if (!button) {
                console.error('❌ Button not found for dropdown:', matchId);
                return;
            }
            
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                button.classList.remove('open');
            } else {
                document.querySelectorAll('.channel-dropdown-content-inline.show').forEach(dd => {
                    dd.classList.remove('show');
                    if (dd.previousElementSibling) {
                        dd.previousElementSibling.classList.remove('open');
                    }
                });
                
                dropdown.classList.add('show');
                button.classList.add('open');
            }
        } catch (error) {
            console.error('❌ toggleDropdown crashed:', error);
        }
    }

    refreshCurrentStream(matchId) {
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
                
                const refreshBtn = document.querySelector('.player-control-btn.refresh');
                const originalText = refreshBtn.innerHTML;
                refreshBtn.innerHTML = 'Refreshing...';
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                }, 1000);
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
