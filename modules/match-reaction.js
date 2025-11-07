// Match Reaction Module - Independent Live Comments
class MatchReaction {
    constructor(communityManager) {
        this.communityManager = communityManager;
        this.isInitialized = false;
        this.liveComments = [];
        this.selectedMatch = null;
    }

    async init() {
        if (this.isInitialized) return true;
        
        console.log('💬 Initializing Match Reaction...');
        
        try {
            // Load initial comments
            await this.loadSampleComments();
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('Match Reaction init failed:', error);
            throw new Error('Failed to initialize Match Reaction');
        }
    }

    async loadSampleComments() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 400));
        
        this.liveComments = [
            {
                id: 1,
                user: "SportsFanatic",
                message: "What a goal! Absolutely incredible! 🚀",
                timestamp: "2 min ago",
                match: "Manchester United vs Liverpool",
                likes: 12
            },
            {
                id: 2,
                user: "TacticalExpert", 
                message: "The formation change is really working well for the home team",
                timestamp: "5 min ago",
                match: "Manchester United vs Liverpool",
                likes: 8
            },
            {
                id: 3,
                user: "CasualViewer",
                message: "First time watching this team, they play beautiful football!",
                timestamp: "8 min ago", 
                match: "Manchester United vs Liverpool",
                likes: 5
            },
            {
                id: 4,
                user: "StatsGeek",
                message: "75% possession but only 2 shots on target. Need to be more clinical!",
                timestamp: "12 min ago",
                match: "Barcelona vs Real Madrid", 
                likes: 15
            }
        ];
    }

    show() {
        const container = document.getElementById('dynamic-content');
        if (!container) return;

        const liveMatches = this.communityManager.getLiveMatches();
        
        container.innerHTML = `
            <div class="content-section">
                <div class="navigation-buttons">
                    <button class="home-button">⌂</button>
                    <button class="top-back-button">←</button>
                </div>
                
                <div class="section-header">
                    <h2>💬 Match Reaction</h2>
                    <p>Live comments and fan reactions</p>
                </div>

                <!-- Match Selection -->
                <div class="match-selection" style="margin-bottom: 25px;">
                    <h3 style="color: var(--accent-gold); margin-bottom: 15px;">🎯 Select Match</h3>
                    <div class="matches-grid" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${this.generateMatchSelectionHTML(liveMatches)}
                    </div>
                </div>

                <!-- Live Comments -->
                <div class="comments-section">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: var(--accent-blue); margin: 0;">💬 Live Comments</h3>
                        <button class="refresh-comments-btn" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-light); padding: 8px 12px; border-radius: 6px; color: var(--text-primary); cursor: pointer;">
                            🔄 Refresh
                        </button>
                    </div>
                    
                    <div class="comments-container" style="max-height: 500px; overflow-y: auto;">
                        ${this.generateCommentsHTML()}
                    </div>

                    <!-- Comment Input -->
                    <div class="comment-input" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-light);">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" placeholder="Add your comment..." style="flex: 1; background: rgba(255,255,255,0.1); border: 1px solid var(--border-light); padding: 12px; border-radius: 8px; color: var(--text-primary);">
                            <button class="send-comment-btn" style="background: var(--accent-gold); color: black; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Research Note -->
                <div style="text-align: center; margin-top: 30px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                    <div style="color: var(--text-muted); font-size: 0.9em;">
                        🎯 <strong>Independent Module</strong><br>
                        Match Reaction operates separately from Fan Zone
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.attachNavigationListeners();
    }

    generateMatchSelectionHTML(liveMatches) {
        if (liveMatches.length === 0) {
            return `<div style="text-align: center; color: var(--text-muted); padding: 20px; width: 100%;">
                No live matches for reactions
            </div>`;
        }

        // Add sample matches if no live ones
        const matchesToShow = liveMatches.length > 0 ? liveMatches : [
            { id: 'sample1', teams: 'Manchester United vs Liverpool', isLive: true },
            { id: 'sample2', teams: 'Barcelona vs Real Madrid', isLive: true }
        ];

        return matchesToShow.map(match => `
            <div class="match-option" data-match-id="${match.id}" style="background: rgba(255,255,255,0.05); padding: 12px 15px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.3s ease; min-width: 200px;">
                <div style="font-weight: bold; margin-bottom: 5px;">${this.communityManager.matchScheduler.formatTeamNames(match.teams)}</div>
                <div style="color: var(--accent-red); font-size: 0.8em;">🔴 LIVE</div>
            </div>
        `).join('');
    }

    generateCommentsHTML() {
        if (this.liveComments.length === 0) {
            return `<div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
                <div>No comments yet</div>
                <div style="font-size: 0.9em; margin-top: 10px;">Be the first to comment!</div>
            </div>`;
        }

        return this.liveComments.map(comment => `
            <div class="comment-item" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--accent-blue);">
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: var(--accent-gold);">${comment.user}</div>
                    <div style="color: var(--text-muted); font-size: 0.8em;">${comment.timestamp}</div>
                </div>
                <div style="margin-bottom: 8px;">${comment.message}</div>
                <div style="display: flex; justify-content: between; align-items: center;">
                    <div style="color: var(--text-muted); font-size: 0.8em;">${comment.match}</div>
                    <button class="like-comment-btn" data-comment-id="${comment.id}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        👍 ${comment.likes}
                    </button>
                </div>
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Match selection
        const matchOptions = document.querySelectorAll('.match-option');
        matchOptions.forEach(option => {
            option.onclick = () => this.selectMatch(option);
        });

        // Refresh comments
        const refreshBtn = document.querySelector('.refresh-comments-btn');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.refreshComments();
        }

        // Like comments
        const likeBtns = document.querySelectorAll('.like-comment-btn');
        likeBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.likeComment(e.target);
            };
        });

        // Send comment
        const sendBtn = document.querySelector('.send-comment-btn');
        const commentInput = document.querySelector('.comment-input input');
        if (sendBtn && commentInput) {
            sendBtn.onclick = () => this.sendComment(commentInput);
            commentInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendComment(commentInput);
            };
        }
    }

    attachNavigationListeners() {
        const homeBtn = document.querySelector('.home-button');
        if (homeBtn) {
            homeBtn.onclick = () => this.communityManager.matchScheduler.uiManager.showMainMenu();
        }

        const backBtn = document.querySelector('.top-back-button');
        if (backBtn) {
            backBtn.onclick = () => this.communityManager.showMainMenu();
        }
    }

    selectMatch(option) {
        // Reset previous selection
        document.querySelectorAll('.match-option').forEach(opt => {
            opt.style.borderColor = 'transparent';
            opt.style.background = 'rgba(255,255,255,0.05)';
        });

        // Highlight selected
        option.style.borderColor = 'var(--accent-gold)';
        option.style.background = 'rgba(255, 217, 61, 0.1)';

        const matchId = option.getAttribute('data-match-id');
        this.selectedMatch = matchId;
        
        console.log('🎯 Selected match:', matchId);
        // In full implementation, would load match-specific comments
    }

    refreshComments() {
        const refreshBtn = document.querySelector('.refresh-comments-btn');
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Loading...';
            refreshBtn.disabled = true;
        }

        // Simulate API call
        setTimeout(() => {
            this.show();
            alert('🎯 Research: Comments refreshed - new data loaded');
        }, 1000);
    }

    likeComment(button) {
        const currentLikes = parseInt(button.textContent.split(' ')[1]);
        button.textContent = `👍 ${currentLikes + 1}`;
        button.style.color = 'var(--accent-gold)';
    }

    sendComment(input) {
        const message = input.value.trim();
        if (!message) return;

        // Add new comment
        this.liveComments.unshift({
            id: Date.now(),
            user: "You",
            message: message,
            timestamp: "Just now",
            match: this.selectedMatch ? "Selected Match" : "General",
            likes: 0
        });

        // Clear input
        input.value = '';

        // Refresh comments display
        this.show();
        
        alert('🎯 Research: Comment posted - would appear live in full implementation');
    }
}
