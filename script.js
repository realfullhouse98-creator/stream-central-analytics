// 9kilo Stream - YouTube Live Replica
class MatchScheduler {
    constructor() {
        this.allMatches = [];
        this.currentView = 'main';
        this.currentSport = null;
        this.currentDate = null;
        this.verifiedMatches = [];
        this.matchStats = new Map();
        this.currentStreams = new Map();
        this.liveChats = new Map();
        this.livePolls = new Map();
        this.userSettings = {
            username: 'Viewer' + Math.floor(Math.random() * 10000),
            chatColor: '#3ea6ff',
            isSubscribed: false
        };
        
        this.isDataLoaded = false;
        this.isLoading = false;
        this.cacheKey = '9kilos-cache';
        this.init();
    }
    
    async init() {
        this.showMainMenu();
        this.loadUserSettings();
    }
    
    loadUserSettings() {
        const saved = localStorage.getItem('9kilos-settings');
        if (saved) {
            this.userSettings = {...this.userSettings, ...JSON.parse(saved)};
        }
    }
    
    saveUserSettings() {
        localStorage.setItem('9kilos-settings', JSON.stringify(this.userSettings));
    }
    
    async ensureDataLoaded() {
        if (this.isDataLoaded) return true;
        if (this.isLoading) return new Promise(r => {
            const i = setInterval(() => {
                if (this.isDataLoaded) { clearInterval(i); r(true); }
            }, 100);
        });
        
        this.isLoading = true;
        try {
            await this.loadMatches();
            this.isDataLoaded = true;
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadMatches() {
        const cached = this.getCachedData();
        if (cached) { this.organizeMatches(cached); return; }
        
        try {
            const apiData = await this.tryAllProxies();
            this.organizeMatches(apiData);
            this.cacheData(apiData);
        } catch (e) {
            console.warn('API failed:', e);
            this.useFallbackData();
        }
    }
    
    getCachedData() {
        try {
            const c = localStorage.getItem(this.cacheKey);
            if (!c) return null;
            const {data,t} = JSON.parse(c);
            return (Date.now() - t < 300000) ? data : null;
        } catch { return null; }
    }
    
    cacheData(data) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify({
                data: data,
                t: Date.now()
            }));
        } catch {}
    }
    
    async tryAllProxies() {
        const url = 'https://topembed.pw/api.php?format=json';
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            url
        ];
        
        for (const proxy of proxies) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 4000);
                const response = await fetch(proxy, {signal: controller.signal});
                clearTimeout(timeout);
                if (response.ok) return await response.json();
            } catch { continue; }
        }
        throw new Error('All proxies failed');
    }
    
    useFallbackData() {
        const now = Math.floor(Date.now() / 1000);
        this.organizeMatches({
            events: {
                '2024-12-20': [
                    {
                        match: 'Research Team A - Research Team B',
                        tournament: '9kilos Demo League',
                        sport: 'football',
                        unix_timestamp: now + 3600,
                        channels: ['https://example.com/stream1']
                    },
                    {
                        match: 'Demo United - Test City FC',
                        tournament: 'Research Championship', 
                        sport: 'football',
                        unix_timestamp: now - 1800,
                        channels: ['https://example.com/stream2']
                    }
                ]
            }
        });
    }
    
    organizeMatches(data) {
        if (!data?.events) { this.useFallbackData(); return; }
        this.allMatches = []; this.verifiedMatches = [];
        Object.entries(data.events).forEach(([date, matches]) => {
            if (Array.isArray(matches)) matches.forEach(match => {
                if (match?.match) {
                    const id = this.generateMatchId(match);
                    if (!this.matchStats.has(id)) {
                        this.matchStats.set(id, {
                            views: Math.floor(Math.random() * 10000) + 500,
                            likes: Math.floor(Math.random() * 500) + 50,
                            liveViewers: Math.floor(Math.random() * 1000) + 100
                        });
                    }
                    const ch = match.channels || [];
                    if (ch.length > 0 && !this.currentStreams.has(id)) {
                        this.currentStreams.set(id, 0);
                    }
                    this.verifiedMatches.push({
                        id: id, date: date, time: this.convertTime(match.unix_timestamp),
                        teams: match.match, league: match.tournament || match.sport || 'Sports',
                        streamUrl: ch[0] || null, channels: ch,
                        isLive: this.checkIfLive(match), sport: this.classifySport(match),
                        unixTimestamp: match.unix_timestamp
                    });
                }
            });
        });
        if (this.verifiedMatches.length === 0) { this.useFallbackData(); return; }
        this.verifiedMatches.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
        this.updateAnalytics();
        if (this.currentView !== 'main') {
            this[`show${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}View`]();
        }
    }
    
    // ... (keep all the existing classification and utility methods from previous version)
    classifySport(match) {
        const sport = (match.sport || '').toLowerCase();
        const tournament = (match.tournament || '').toLowerCase();
        const map = {
            football: 'football', soccer: 'football', hockey: 'hockey',
            basketball: 'basketball', tennis: 'tennis', cricket: 'cricket',
            baseball: 'baseball', golf: 'golf', other: 'other'
        };
        if (sport && map[sport]) return map[sport];
        for (const [key, value] of Object.entries(map)) {
            if (sport.includes(key) || tournament.includes(key)) return value;
        }
        return 'other';
    }
    
    generateMatchId(match) {
        return `${match.match}-${match.unix_timestamp}-${Math.random().toString(36).substr(2,6)}`;
    }
    
    convertTime(timestamp) {
        if (!timestamp) return 'TBD';
        return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }
    
    checkIfLive(match) {
        if (!match.unix_timestamp) return false;
        const now = Math.floor(Date.now() / 1000);
        return now >= match.unix_timestamp && now <= (match.unix_timestamp + 7200);
    }
    
    formatTeamNames(teamString) { 
        return teamString.replace(/ - /g, ' vs '); 
    }
    
    formatNumber(num) { 
        if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num/1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    // YOUTUBE LIVE MATCH DETAILS
    async showMatchDetails(matchId) {
        await this.ensureDataLoaded();
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (!match) return;
        
        const stats = this.matchStats.get(matchId) || { views: 0, likes: 0, liveViewers: 100 };
        const channels = match.channels || [];
        const currentChannel = this.currentStreams.get(matchId) || 0;
        const streamUrl = channels[currentChannel] || null;
        
        // Initialize chat for this match
        if (!this.liveChats.has(matchId)) {
            this.liveChats.set(matchId, []);
            this.initializeDemoChat(matchId);
        }
        
        this.showInDynamic(`
            <div class="youtube-live-container">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showMatchesView()">←</button>
                </div>
                
                <div class="youtube-live-main">
                    <!-- Left Side - Player -->
                    <div class="youtube-player-section">
                        <div class="player-container">
                            <div class="video-player" id="video-player-${matchId}">
                                ${streamUrl ? 
                                    `<iframe src="${streamUrl}" class="stream-iframe" id="stream-iframe-${matchId}"
                                            allow="autoplay; fullscreen" allowfullscreen></iframe>` :
                                    `<div class="countdown-timer">
                                        <div class="countdown-title">Match Starting In</div>
                                        <div class="countdown-display" id="countdown-${matchId}">${this.getCountdownText(match)}</div>
                                    </div>`
                                }
                            </div>
                            <div class="yt-player-controls">
                                <div class="yt-controls-bar">
                                    <button class="yt-play-btn">▶</button>
                                    <div class="yt-time-display">0:00 / 0:00</div>
                                    <div class="yt-progress-bar">
                                        <div class="yt-progress-fill"></div>
                                    </div>
                                    <div class="yt-controls-right">
                                        <button class="yt-control-btn yt-theater-btn" onclick="matchScheduler.toggleTheaterMode()">⛶</button>
                                        <button class="yt-control-btn" onclick="matchScheduler.toggleFullscreen('${matchId}')">⛶</button>
                                        <button class="yt-control-btn" onclick="matchScheduler.showSettings('${matchId}')">⚙️</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Stream Info -->
                        <div class="stream-info">
                            <div class="stream-title">${this.formatTeamNames(match.teams)} - ${match.league}</div>
                            <div class="stream-meta">
                                <span class="viewer-count">${this.formatNumber(stats.liveViewers)} watching</span>
                                ${match.isLive ? '<span class="live-indicator">LIVE</span>' : '<span class="live-indicator">UPCOMING</span>'}
                                <span>Started ${this.formatDisplayDate(match.date)}</span>
                            </div>
                            <div class="stream-actions">
                                <button class="yt-action-btn subscribe ${this.userSettings.isSubscribed ? 'subscribed' : ''}" 
                                        onclick="matchScheduler.toggleSubscribe()">
                                    ${this.userSettings.isSubscribed ? '✓ Subscribed' : 'Subscribe'}
                                </button>
                                <button class="yt-action-btn" onclick="matchScheduler.likeStream('${matchId}')">
                                    👍 ${this.formatNumber(stats.likes)}
                                </button>
                                <button class="yt-action-btn" onclick="matchScheduler.shareStream('${matchId}')">
                                    📤 Share
                                </button>
                                <button class="yt-action-btn" onclick="matchScheduler.createClip('${matchId}')">
                                    ✂️ Clip
                                </button>
                            </div>
                        </div>
                        
                        <!-- Live Poll -->
                        ${this.renderLivePoll(matchId)}
                    </div>
                    
                    <!-- Right Side - Chat -->
                    <div class="youtube-chat-section">
                        <div class="chat-header">
                            <div class="chat-title">Live Chat</div>
                            <button class="chat-settings" onclick="matchScheduler.showChatSettings('${matchId}')">⚙️</button>
                        </div>
                        <div class="chat-messages" id="chat-messages-${matchId}">
                            ${this.renderChatMessages(matchId)}
                        </div>
                        <div class="chat-input-container">
                            <div class="chat-input-row">
                                <button class="emoji-btn" onclick="matchScheduler.toggleEmojiPicker('${matchId}')">😊</button>
                                <textarea class="chat-input" id="chat-input-${matchId}" placeholder="Chat message..." 
                                         onkeypress="matchScheduler.handleChatInput(event, '${matchId}')"></textarea>
                                <button class="send-btn" onclick="matchScheduler.sendChatMessage('${matchId}')">Send</button>
                            </div>
                            <div class="emoji-picker-container" id="emoji-picker-${matchId}" style="display: none;">
                                <emoji-picker></emoji-picker>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Floating Chat Button -->
                <button class="floating-chat-btn" onclick="matchScheduler.toggleMobileChat()">💬</button>
            </div>
        `);
        
        this.hideStats();
        this.incrementViews(matchId);
        
        // Start countdown if not live
        if (!match.isLive && match.unixTimestamp) {
            this.startCountdown(matchId, match.unixTimestamp);
        }
        
        // Start chat simulation
        this.startChatSimulation(matchId);
    }
    
    getCountdownText(match) {
        if (!match.unixTimestamp) return 'TBD';
        const now = Math.floor(Date.now() / 1000);
        const diff = match.unixTimestamp - now;
        
        if (diff <= 0) return 'LIVE SOON';
        
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else {
            return `${minutes}m ${seconds}s`;
        }
    }
    
    startCountdown(matchId, targetTime) {
        const countdownElement = document.getElementById(`countdown-${matchId}`);
        if (!countdownElement) return;
        
        const updateCountdown = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = targetTime - now;
            
            if (diff <= 0) {
                countdownElement.textContent = 'LIVE NOW';
                countdownElement.style.color = '#ff0000';
                return;
            }
            
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            
            if (hours > 0) {
                countdownElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        };
        
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    }
    
    // LIVE CHAT SYSTEM
    initializeDemoChat(matchId) {
        const demoMessages = [
            {user: 'SportsFan42', text: 'Can\'t wait for this match! 🎉', type: 'normal', time: Date.now() - 120000},
            {user: 'GoalHunter', text: 'Team A looking strong in warmups! ⚽', type: 'normal', time: Date.now() - 90000},
            {user: 'SuperViewer', text: '💰 5.00 - LET\'S GO TEAM B! BRING IT HOME! 🏆', type: 'superchat', amount: 5.00, time: Date.now() - 60000},
            {user: 'MatchMaster', text: 'Prediction: 2-1 for Team A', type: 'normal', time: Date.now() - 30000}
        ];
        
        this.liveChats.set(matchId, demoMessages);
    }
    
    renderChatMessages(matchId) {
        const messages = this.liveChats.get(matchId) || [];
        return messages.map(msg => `
            <div class="chat-message ${msg.type === 'superchat' ? 'superchat-orange' : ''}">
                <span class="message-user" style="color: ${this.getUserColor(msg.user)}">${msg.user}</span>
                ${msg.type === 'superchat' ? `<span class="superchat-amount">$${msg.amount}</span>` : ''}
                <span class="message-text">${msg.text}</span>
                <span class="message-time">${this.formatTime(msg.time)}</span>
            </div>
        `).join('');
    }
    
    getUserColor(username) {
        // Simple hash-based color assignment
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = ['#3ea6ff', '#ff6b6b', '#6bcf7f', '#ffd93d', '#9b59b6', '#3498db'];
        return colors[Math.abs(hash) % colors.length];
    }
    
    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ago`;
    }
    
    sendChatMessage(matchId) {
        const input = document.getElementById(`chat-input-${matchId}`);
        const text = input.value.trim();
        
        if (!text) return;
        
        const message = {
            user: this.userSettings.username,
            text: text,
            type: 'normal',
            time: Date.now()
        };
        
        const messages = this.liveChats.get(matchId) || [];
        messages.push(message);
        this.liveChats.set(matchId, messages);
        
        this.updateChatDisplay(matchId);
        input.value = '';
        
        // Simulate responses
        setTimeout(() => this.simulateChatResponse(matchId), 2000);
    }
    
    simulateChatResponse(matchId) {
        const responses = [
            'Great point! 🎯',
            'I agree! 👏',
            'This match is amazing! 🔥',
            'What a play! 🙌',
            'Team looking strong today! 💪'
        ];
        
        const botUsers = ['ChatBot', 'AutoFan', 'AI_Commentator', 'Bot_3000'];
        const randomUser = botUsers[Math.floor(Math.random() * botUsers.length)];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const message = {
            user: randomUser,
            text: randomResponse,
            type: 'normal',
            time: Date.now()
        };
        
        const messages = this.liveChats.get(matchId) || [];
        messages.push(message);
        this.liveChats.set(matchId, messages);
        
        this.updateChatDisplay(matchId);
    }
    
    updateChatDisplay(matchId) {
        const chatContainer = document.getElementById(`chat-messages-${matchId}`);
        if (chatContainer) {
            chatContainer.innerHTML = this.renderChatMessages(matchId);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    startChatSimulation(matchId) {
        // Add random chat messages every 5-15 seconds
        this.chatInterval = setInterval(() => {
            if (Math.random() > 0.3) { // 70% chance
                this.simulateChatResponse(matchId);
            }
        }, 5000 + Math.random() * 10000);
    }
    
    // POLL SYSTEM
    renderLivePoll(matchId) {
        if (!this.livePolls.has(matchId)) {
            this.livePolls.set(matchId, {
                question: 'Who will win this match?',
                options: [
                    {text: 'Team A', votes: 45, voted: false},
                    {text: 'Team B', votes: 35, voted: false},
                    {text: 'Draw', votes: 20, voted: false}
                ],
                totalVotes: 100
            });
        }
        
        const poll = this.livePolls.get(matchId);
        
        return `
            <div class="live-poll">
                <div class="poll-question">${poll.question}</div>
                <div class="poll-options">
                    ${poll.options.map((option, index) => `
                        <div class="poll-option ${option.voted ? 'selected' : ''}" 
                             onclick="matchScheduler.voteInPoll('${matchId}', ${index})">
                            <div>${option.text}</div>
                            <div class="poll-bar" style="width: ${(option.votes / poll.totalVotes) * 100}%"></div>
                            <div style="font-size: 0.8em; color: var(--text-muted); margin-top: 2px;">
                                ${option.votes} votes (${Math.round((option.votes / poll.totalVotes) * 100)}%)
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    voteInPoll(matchId, optionIndex) {
        const poll = this.livePolls.get(matchId);
        if (!poll || poll.options[optionIndex].voted) return;
        
        poll.options[optionIndex].voted = true;
        poll.options[optionIndex].votes++;
        poll.totalVotes++;
        
        this.livePolls.set(matchId, poll);
        this.updatePollDisplay(matchId);
    }
    
    updatePollDisplay(matchId) {
        // In a real implementation, this would update the poll display
        console.log('Poll updated for match:', matchId);
    }
    
    // YOUTUBE CONTROLS
    toggleTheaterMode() {
        document.querySelector('.youtube-live-container').classList.toggle('theater-mode');
    }
    
    toggleFullscreen(matchId) {
        const player = document.getElementById(`video-player-${matchId}`);
        if (!player) return;
        
        if (!document.fullscreenElement) {
            player.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }
    
    toggleSubscribe() {
        this.userSettings.isSubscribed = !this.userSettings.isSubscribed;
        this.saveUserSettings();
        this.updateSubscribeButton();
    }
    
    updateSubscribeButton() {
        const btn = document.querySelector('.yt-action-btn.subscribe');
        if (btn) {
            btn.textContent = this.userSettings.isSubscribed ? '✓ Subscribed' : 'Subscribe';
            btn.classList.toggle('subscribed', this.userSettings.isSubscribed);
        }
    }
    
    likeStream(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) {
            stats.likes++;
            this.matchStats.set(matchId, stats);
            this.updateLikeButton(matchId);
        }
    }
    
    updateLikeButton(matchId) {
        const stats = this.matchStats.get(matchId);
        const btn = document.querySelector('.yt-action-btn:nth-child(2)');
        if (btn && stats) {
            btn.innerHTML = `👍 ${this.formatNumber(stats.likes)}`;
        }
    }
    
    shareStream(matchId) {
        const match = this.verifiedMatches.find(m => m.id === matchId);
        if (match && navigator.share) {
            navigator.share({
                title: `${this.formatTeamNames(match.teams)} - ${match.league}`,
                text: `Watch ${this.formatTeamNames(match.teams)} live on 9kilos!`,
                url: window.location.href
            });
        } else {
            alert('Share this match: ' + window.location.href);
        }
    }
    
    createClip(matchId) {
        alert('Clip feature coming soon! This would create a 30-second clip of the current stream.');
    }
    
    toggleEmojiPicker(matchId) {
        const picker = document.getElementById(`emoji-picker-${matchId}`);
        if (picker) {
            picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    toggleMobileChat() {
        document.querySelector('.youtube-live-container').classList.toggle('chat-mobile-hidden');
    }
    
    handleChatInput(event, matchId) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendChatMessage(matchId);
        }
    }
    
    // ... (keep all the remaining existing methods for navigation, sports views, etc.)
    showInDynamic(html) {
        document.getElementById('dynamic-content').innerHTML = html;
    }
    
    showStats() { 
        document.querySelector('.analytics-overview').style.display = 'grid'; 
    }
    
    hideStats() { 
        document.querySelector('.analytics-overview').style.display = 'none'; 
    }
    
    preloadSportsData() {
        if (this.isDataLoaded || this.isLoading) return;
        setTimeout(() => { this.loadMatches().catch(() => {}); }, 500);
    }
    
    showMainMenu() {
        this.showInDynamic(`
            <div class="main-menu">
                <div class="menu-grid">
                    <div class="menu-button sports-button" onmouseover="matchScheduler.preloadSportsData()" onclick="matchScheduler.showSportsView()">
                        <div class="button-title">LIVE SPORTS</div>
                        <div class="button-subtitle">Games & schedules</div>
                    </div>
                    <div class="menu-button tv-button" onclick="matchScheduler.showTVChannels()">
                        <div class="button-title">TV CHANNELS</div>
                        <div class="button-subtitle">24/7 live streams</div>
                    </div>
                    <div class="menu-button community" onclick="matchScheduler.showCommunity()">
                        <div class="button-title">COMMUNITY</div>
                        <div class="button-subtitle">Fan discussions</div>
                    </div>
                </div>
            </div>
        `);
        this.showStats(); 
        this.currentView = 'main';
    }
    
    async showSportsView() {
        if (!await this.ensureDataLoaded()) return;
        const sports = ['football','hockey','basketball','tennis','cricket','baseball','golf','other']
            .map(sport => ({
                id: sport, 
                name: sport.charAt(0).toUpperCase() + sport.slice(1), 
                count: this.getMatchesBySport(sport).length
            }))
            .filter(sport => sport.count > 0);
        
        this.showInDynamic(`
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Choose Sport</h2>
                    <p>Select category</p>
                </div>
                <div class="sports-grid">
                    ${sports.map(sport => `
                        <div class="sport-button" onclick="matchScheduler.selectSport('${sport.id}')">
                            <div class="sport-name">${sport.name}</div>
                            <div class="match-count">${sport.count} matches</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
        this.hideStats(); 
        this.currentView = 'sports';
    }
    
    async showDatesView() {
        await this.ensureDataLoaded();
        const matches = this.getMatchesBySport(this.currentSport);
        const dates = [...new Set(matches.map(match => match.date))].sort();
        const sportName = this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1);
        
        this.showInDynamic(`
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showSportsView()">←</button>
                </div>
                <div class="section-header">
                    <h2>${sportName}</h2>
                    <p>Select date</p>
                </div>
                <div class="sports-grid">
                    ${dates.map(date => {
                        const dateMatches = matches.filter(m => m.date === date);
                        const liveCount = dateMatches.filter(m => m.isLive).length;
                        return `
                            <div class="date-button" onclick="matchScheduler.selectDate('${date}')">
                                <div class="date-name">${this.formatDisplayDate(date)}</div>
                                <div class="match-count">${dateMatches.length} match${dateMatches.length !== 1 ? 'es' : ''}${liveCount > 0 ? ` • ${liveCount} live` : ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `);
        this.hideStats(); 
        this.currentView = 'dates';
    }
    
    async showMatchesView() {
        await this.ensureDataLoaded();
        const matches = this.getMatchesBySportAndDate(this.currentSport, this.currentDate);
        const sportName = this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1);
        const displayDate = this.formatDisplayDate(this.currentDate);
        
        this.showInDynamic(`
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                    <button class="top-back-button" onclick="matchScheduler.showDatesView()">←</button>
                </div>
                <div class="section-header">
                    <h2>Schedule</h2>
                    <p>${displayDate}</p>
                </div>
                
                <div class="matches-table">
                    <div class="table-header">
                        <div>Time</div>
                        <div>Match</div>
                        <div>Watch</div>
                    </div>
                    ${matches.length > 0 ? 
                        matches.map(match => this.renderMatchRow(match)).join('') :
                        '<div class="no-matches">No matches found for this date</div>'
                    }
                </div>
            </div>
        `);
        this.hideStats(); 
        this.currentView = 'matches';
    }
    
    renderMatchRow(match) {
        const isLive = match.isLive;
        const teams = this.formatTeamNames(match.teams);
        
        return `
            <div class="match-row ${isLive ? 'live' : ''}">
                <div class="match-time">${match.time}</div>
                <div class="match-details">
                    <div class="team-names">${teams}</div>
                    <div class="league-name">${match.league}</div>
                </div>
                <div class="watch-action">
                    ${match.channels && match.channels.length > 0 ? 
                        `<button class="watch-btn ${isLive ? 'live' : ''}" onclick="matchScheduler.showMatchDetails('${match.id}')">
                            ${isLive ? 'LIVE' : 'WATCH'}
                        </button>` :
                        '<span style="color: var(--text-muted); font-size: 0.8em;">OFFLINE</span>'
                    }
                </div>
            </div>
        `;
    }
    
    selectSport(sport) { 
        this.currentSport = sport; 
        this.showDatesView(); 
    }
    
    selectDate(date) { 
        this.currentDate = date; 
        this.showMatchesView(); 
    }
    
    getMatchesBySport(sport) { 
        return this.verifiedMatches.filter(match => match.sport === sport); 
    }
    
    getMatchesBySportAndDate(sport, date) { 
        return this.getMatchesBySport(sport).filter(match => match.date === date); 
    }
    
    formatDisplayDate(dateString) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    }
    
    updateAnalytics() {
        const liveMatches = this.verifiedMatches.filter(match => match.isLive).length;
        const totalViewers = this.verifiedMatches.reduce((sum, match) => {
            const stats = this.matchStats.get(match.id);
            return sum + (stats ? stats.views : 0);
        }, 0);
        
        document.getElementById('total-streams').textContent = this.verifiedMatches.length;
        document.getElementById('live-viewers').textContent = this.formatNumber(Math.floor(totalViewers / 100));
        document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
    }
    
    showTVChannels() {
        this.showInDynamic(`
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>TV Channels</h2>
                    <p>24/7 live streams</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="alert('Sky Sports - Coming soon!')">
                        <div class="sport-name">Sky Sports</div>
                        <div class="match-count">Sports</div>
                    </div>
                    <div class="sport-button" onclick="alert('ESPN - Coming soon!')">
                        <div class="sport-name">ESPN</div>
                        <div class="match-count">Sports</div>
                    </div>
                </div>
            </div>
        `);
        this.hideStats();
    }
    
    showCommunity() {
        this.showInDynamic(`
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button" onclick="matchScheduler.showMainMenu()">⌂</button>
                </div>
                <div class="section-header">
                    <h2>Community</h2>
                    <p>Fan discussions</p>
                </div>
                <div class="sports-grid">
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Fan Zone</div>
                        <div class="match-count">Live Chat</div>
                    </div>
                    <div class="sport-button" onclick="alert('Coming soon!')">
                        <div class="sport-name">Match Reactions</div>
                        <div class="match-count">Community</div>
                    </div>
                </div>
            </div>
        `);
        this.hideStats();
    }
    
    incrementViews(matchId) {
        const stats = this.matchStats.get(matchId);
        if (stats) stats.views++;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.matchScheduler = new MatchScheduler();
});

// Cleanup intervals when leaving match details
window.addEventListener('beforeunload', () => {
    if (window.matchScheduler) {
        clearInterval(window.matchScheduler.countdownInterval);
        clearInterval(window.matchScheduler.chatInterval);
    }
});
