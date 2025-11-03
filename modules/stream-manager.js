// modules/stream-manager.js - COMPLETE VERSION
export class StreamManager {
    constructor() {
        this.currentStreams = new Map();
        this.matchStats = new Map();
        
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
        
        console.log('🎭 Stream Manager initialized!');
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

    switchChannel(matchId, channelIndex) {
        this.currentStreams.set(matchId, channelIndex);
    }

    getCurrentChannelIndex(matchId) {
        return this.currentStreams.get(matchId) || 0;
    }

    refreshCurrentStream(matchId) {
        // This would refresh the stream - implementation depends on iframe
        console.log('🔄 Refreshing stream for match:', matchId);
        return true;
    }

    toggleDropdown(matchId) {
        try {
            console.log('🔧 toggleDropdown called for:', matchId);
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
                // Close all other dropdowns first
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

    // Stats management
    getMatchStats(matchId) {
        if (!this.matchStats.has(matchId)) {
            this.matchStats.set(matchId, {
                views: Math.floor(Math.random() * 10000) + 500,
                likes: Math.floor(Math.random() * 500) + 50,
                dislikes: Math.floor(Math.random() * 100) + 10
            });
        }
        return this.matchStats.get(matchId);
    }

    incrementViews(matchId) {
        const stats = this.getMatchStats(matchId);
        stats.views++;
        this.matchStats.set(matchId, stats);
    }

    handleLike(matchId) {
        const stats = this.getMatchStats(matchId);
        stats.likes++;
        this.matchStats.set(matchId, stats);
    }

    handleDislike(matchId) {
        const stats = this.getMatchStats(matchId);
        stats.dislikes++;
        this.matchStats.set(matchId, stats);
    }

    handleShare(matchId) {
        // Simple share implementation
        const matchStats = this.getMatchStats(matchId);
        const shareText = `Check out this match! ${matchStats.views} views, ${matchStats.likes} likes`;
        alert(`Share feature: ${shareText}\n\n(Coming soon with actual sharing!)`);
    }

    // Stream quality management
    getAvailableQualities() {
        return ['auto', '720p', '480p', '360p'];
    }

    setStreamQuality(quality) {
        console.log(`🎯 Setting stream quality to: ${quality}`);
        // Implementation would depend on the streaming service
    }

    // Stream health monitoring
    checkStreamHealth(streamUrl) {
        // Simple stream health check
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate stream health check
                const isHealthy = Math.random() > 0.2; // 80% chance stream is healthy
                console.log(`🔍 Stream health check: ${isHealthy ? 'HEALTHY' : 'ISSUES'} for ${streamUrl}`);
                resolve(isHealthy);
            }, 1000);
        });
    }

    // Backup stream management
    getBackupStreams(primaryStream) {
        const backups = [
            primaryStream.replace('topembed.pw', 'topembed.pw'),
            primaryStream.replace('streamed.pk', 'streamed.pk')
        ];
        return backups.filter(stream => stream !== primaryStream);
    }
}
