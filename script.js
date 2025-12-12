// script.js (Full replacement for NEW_ascript.js) - Option A
// 9KILOS MatchScheduler - Master-first + Bulletproof UI
// Replace your existing ascript.js / script.js with this file (keep api-client.js loaded first)

class MatchScheduler {
  constructor() {
    // Data/state
    this.allMatches = [];
    this.verifiedMatches = [];
    this.matchStats = new Map();
    this.currentStreams = new Map();

    // UI state
    this.currentView = 'main';
    this.selectedSource = localStorage.getItem('9kilos-selected-source') || 'tom-0';
    this.cacheKey = '9kilos-matches-cache'; // legacy kept but master uses client cache
    this.cacheTimeout = 5 * 60 * 1000;

    // flags
    this.isDataLoaded = false;
    this.isLoading = false;
    this.preloadedSports = null;
    this.tvChannelsData = null;

    // config
    this.masterUrl = '/master-data.json';
    this.githubMasterUrl = 'https://raw.githubusercontent.com/realfullhouse98-creator/stream-central-analytics/main/master-data.json';

    console.log('🚀 MatchScheduler initialized');
  }

  // -------------------------
  // Initialization
  // -------------------------
  async init() {
    await this.waitForDOMReady();
    this.setupGlobalErrorHandling();
    this.setupEventListeners();
    this.showMainMenu();
    await this.loadTVChannelsData().catch(() => {});
    this.backgroundPreload();
  }

  waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', resolve);
      }
    });
  }

  setupGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.message || e);
      const el = document.getElementById('error-boundary');
      if (el) el.style.display = 'none';
    });
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => this.handleGlobalClick(e));
    // handle keyboard back button in player
    window.addEventListener('popstate', () => {
      if (location.pathname.includes('player.html')) {
        // allow player load
      } else {
        this.showMainMenu();
      }
    });
  }

  // -------------------------
  // DATA LOADING: master-first
  // -------------------------
  async loadMatches() {
    if (this.isDataLoaded) return true;
    this.isLoading = true;

    // 1) If client provides getUnifiedMatches (api-client.js), use it (master-first)
    if (window.getUnifiedMatches && typeof window.getUnifiedMatches === 'function') {
      try {
        console.log('🔎 Loading matches via client getUnifiedMatches() (master-first)');
        const unified = await window.getUnifiedMatches();
        if (Array.isArray(unified) && unified.length) {
          this.applyNormalizedList(unified);
          this.isDataLoaded = true;
          this.isLoading = false;
          console.log('✅ Loaded matches (unified):', this.verifiedMatches.length);
          return true;
        }
      } catch (e) {
        console.warn('getUnifiedMatches() failed:', e);
      }
    }

    // 2) Try direct master GitHub raw fallback
    try {
      console.log('🔎 Attempting to fetch github master file');
      const res = await fetch(this.githubMasterUrl, { cache: 'no-cache' });
      if (res.ok) {
        const master = await res.json();
        if (master && master.matches && master.matches.length) {
          this.convertMasterToAppFormat(master);
          this.isDataLoaded = true;
          this.isLoading = false;
          console.log('✅ Loaded master from GitHub:', this.verifiedMatches.length);
          return true;
        }
      }
    } catch (e) {
      console.warn('GitHub master fetch failed:', e);
    }

    // 3) Fallback to legacy API/proxy logic (tryAllProxies)
    try {
      console.log('🔁 Falling back to earlier proxy & direct API loaders');
      const apiData = await this.tryAllProxies();
      if (apiData) {
        this.organizeMatches(apiData);
        this.cacheData(apiData);
        this.isDataLoaded = true;
        this.isLoading = false;
        return true;
      }
    } catch (e) {
      console.warn('legacy API loading failed:', e);
    }

    // 4) final: fallback dataset to keep app alive
    console.warn('⚠️ No data sources available — using fallback data');
    this.useFallbackData();
    this.isDataLoaded = true;
    this.isLoading = false;
    return false;
  }

  // -------------------------
  // Conversion / Normalization for master items
  // -------------------------
  convertMasterToAppFormat(masterData) {
    if (!masterData || !Array.isArray(masterData.matches)) {
      console.warn('convertMasterToAppFormat: invalid master data');
      return;
    }

    this.allMatches = [];
    this.verifiedMatches = [];

    masterData.matches.forEach((mm) => {
      try {
        // master unix_timestamp can be seconds or ms
        let unixMs = null;
        if (typeof mm.unix_timestamp === 'number') {
          unixMs = mm.unix_timestamp > 1e12 ? mm.unix_timestamp : mm.unix_timestamp * 1000;
        } else if (typeof mm.unix_timestamp === 'string' && /^\d+$/.test(mm.unix_timestamp)) {
          const v = Number(mm.unix_timestamp);
          unixMs = v > 1e12 ? v : v * 1000;
        }

        // fallback detect if mm.unix_timestamp is inconsistent
        if (!unixMs && mm.unix_timestamp === undefined && mm.kickoff) {
          const parsed = Date.parse(mm.kickoff);
          if (!isNaN(parsed)) unixMs = parsed;
        }

        const dt = unixMs ? new Date(unixMs) : null;
        const dateStr = dt ? dt.toISOString().split('T')[0] : (mm.date || null);
        const timeStr = dt ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : (mm.time || null);

        const id = this.generateMatchId(mm);

        // ensure stats exist
        if (!this.matchStats.has(id)) {
          this.matchStats.set(id, {
            views: Math.floor(Math.random() * 6000) + 200,
            likes: Math.floor(Math.random() * 300),
            dislikes: Math.floor(Math.random() * 80),
          });
        }

        const appMatch = {
          id,
          date: dateStr,
          time: timeStr,
          teams: mm.match || mm.title || 'Unknown - Unknown',
          league: mm.tournament || mm.league || 'Sports',
          isLive: this.checkIfLive(mm),
          sport: mm.sport || mm.category || 'Other',
          unixTimestamp: unixMs || Date.now(),
          channels: mm.channels || (mm.sources && [].concat(...Object.values(mm.sources || {}))) || [],
          sources: mm.sources || {},
          stream_sources: mm.stream_sources || {},
          confidence: mm.confidence || mm.quality_score || 1,
          merged: !!mm.merged,
          merged_count: mm.merged_count || 0,
          streamUrl: (mm.channels && mm.channels[0]) || null,
          raw: mm,
        };

        this.allMatches.push(appMatch);
        this.verifiedMatches.push(appMatch);
      } catch (e) {
        console.warn('convertMasterToAppFormat: item failed', e);
      }
    });

    this.verifiedMatches.sort((a, b) => (a.unixTimestamp || 0) - (b.unixTimestamp || 0));
    this.updateAnalytics();
    console.log('Converted master -> app format:', this.verifiedMatches.length);
  }

  // -------------------------
  // Legacy organizeMatches (for tom events shape)
  // -------------------------
  organizeMatches(apiData) {
    // apiData might be { events: {date: [..] } } or array
    if (!apiData) {
      this.useFallbackData();
      return;
    }

    this.extractAndCacheSports(apiData);

    this.allMatches = [];
    this.verifiedMatches = [];

    // handle event grouping shape
    if (apiData.events && typeof apiData.events === 'object') {
      Object.entries(apiData.events).forEach(([date, matches]) => {
        if (!Array.isArray(matches)) return;
        matches.forEach((m) => {
          if (!m || (!m.match && !m.title)) return;
          const id = this.generateMatchId(m);
          if (!this.matchStats.has(id)) {
            this.matchStats.set(id, {
              views: Math.floor(Math.random() * 5000) + 200,
              likes: Math.floor(Math.random() * 300),
              dislikes: Math.floor(Math.random() * 50),
            });
          }
          const unix = this.getUnixFromObj(m);
          const dt = unix ? new Date(unix) : null;
          const teams = m.match || m.title || 'Unknown - Unknown';
          const appMatch = {
            id,
            date: dt ? dt.toISOString().split('T')[0] : (m.date || date),
            time: dt ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : (m.time || ''),
            teams,
            league: m.tournament || m.league || 'Sports',
            isLive: this.checkIfLive(m),
            sport: m.sport || 'Other',
            unixTimestamp: unix || Date.now(),
            channels: m.channels || [],
            sources: m.sources || {},
            stream_sources: m.stream_sources || {},
            raw: m,
          };
          this.allMatches.push(appMatch);
          this.verifiedMatches.push(appMatch);
        });
      });
    } else if (Array.isArray(apiData)) {
      // some endpoints return array
      apiData.forEach((m) => {
        if (!m) return;
        const id = this.generateMatchId(m);
        if (!this.matchStats.has(id)) {
          this.matchStats.set(id, {
            views: Math.floor(Math.random() * 5000) + 200,
            likes: Math.floor(Math.random() * 300),
            dislikes: Math.floor(Math.random() * 50),
          });
        }
        const unix = this.getUnixFromObj(m);
        const dt = unix ? new Date(unix) : null;
        const appMatch = {
          id,
          date: dt ? dt.toISOString().split('T')[0] : (m.date || ''),
          time: dt ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : (m.time || ''),
          teams: m.match || m.title || 'Unknown - Unknown',
          league: m.tournament || m.league || 'Sports',
          isLive: this.checkIfLive(m),
          sport: m.sport || (m.sportCategory || 'Other'),
          unixTimestamp: unix || Date.now(),
          channels: m.channels || (m.streams ? m.streams.map(s => (typeof s === 'string' ? s : s.url)) : []),
          sources: m.sources || {},
          stream_sources: m.stream_sources || {},
          raw: m,
        };
        this.allMatches.push(appMatch);
        this.verifiedMatches.push(appMatch);
      });
    } else {
      // unknown shape
      console.warn('organizeMatches: unknown apiData shape, using fallback');
      this.useFallbackData();
    }

    this.verifiedMatches.sort((a, b) => (a.unixTimestamp || 0) - (b.unixTimestamp || 0));
    this.updateAnalytics();
  }

  // -------------------------
  // Utilities: id, unix parsing
  // -------------------------
  generateMatchId(obj) {
    if (!obj) return 'm-' + Math.random().toString(36).slice(2, 9);
    if (obj.match_id) return obj.match_id;
    if (obj.match) return this.slugify(obj.match + '-' + (obj.unix_timestamp || obj.date || Math.random()));
    if (obj.title) return this.slugify(obj.title + '-' + (obj.kickoff || obj.unix_timestamp || Math.random()));
    return 'm-' + Math.random().toString(36).slice(2, 9);
  }

  slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  getUnixFromObj(m) {
    if (!m) return null;
    if (m.unix_timestamp) {
      const v = Number(m.unix_timestamp);
      return v < 1e12 ? v * 1000 : v;
    }
    if (m.unix) return Number(m.unix);
    if (m.kickoff) {
      const p = Date.parse(m.kickoff);
      if (!isNaN(p)) return p;
    }
    if (m.date && m.time) {
      const p = Date.parse(`${m.date}T${m.time}`);
      if (!isNaN(p)) return p;
    }
    return null;
  }

  checkIfLive(m) {
    if (!m) return false;
    if (typeof m.isLive === 'boolean') return m.isLive;
    const s = (m.status || m.state || '').toString().toLowerCase();
    if (s.includes('live') || s.includes('in-play')) return true;
    // heuristic: if unixTimestamp close to now ± 2 hours and merged flag suggests live source
    const unix = this.getUnixFromObj(m);
    if (!unix) return false;
    const diff = Math.abs(Date.now() - unix);
    if (diff < 1000 * 60 * 60 * 3 && (m.merged || m.quality_score >= 90)) return true;
    return false;
  }

  // -------------------------
  // Caching helpers (legacy)
  // -------------------------
  getCachedData() {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      return (Date.now() - timestamp > this.cacheTimeout) ? null : data;
    } catch (e) {
      return null;
    }
  }

  cacheData(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn('cacheData failed', e);
    }
  }

  // -------------------------
  // Legacy proxy loader (kept)
  // -------------------------
  async tryAllProxies() {
    // decide target by selectedSource
    const targetUrl = this.selectedSource.includes('tom')
      ? 'https://topembed.pw/api.php?format=json'
      : 'https://streamed.pk/api.php?format=json';

    const proxyOptions = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      targetUrl
    ];

    for (const url of proxyOptions) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        clearTimeout(timeout);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('proxy attempt failed', e);
      }
    }

    throw new Error('All proxies failed');
  }

  // -------------------------
  // Fallback demo data
  // -------------------------
  useFallbackData() {
    const now = Math.floor(Date.now() / 1000);
    const demo = {
      events: {
        [new Date().toISOString().split('T')[0]]: [
          {
            match: 'Demo A - Demo B',
            tournament: '9kilos Demo League',
            sport: 'Football',
            unix_timestamp: now + 3600,
            channels: ['https://example.com/stream1']
          }
        ]
      }
    };
    this.organizeMatches(demo);
  }

  // -------------------------
  // SPORTS / TV CHANNELS
  // -------------------------
  async loadTVChannelsData() {
    try {
      const res = await fetch('/tv-channels.json');
      if (!res.ok) throw new Error('tv-channels.json not found');
      this.tvChannelsData = await res.json();
      console.log('TV channels loaded:', Object.keys(this.tvChannelsData).length);
    } catch (e) {
      console.warn('loadTVChannelsData failed, using minimal sample', e);
      this.tvChannelsData = {
        "USA": [{ name: 'ESPN', displayName: 'ESPN', streamUrl: 'https://topembed.pw/channel/ESPN[USA]', country: 'USA', category: 'Multi-sport' }]
      };
    }
  }

  extractAndCacheSports(apiData) {
    try {
      const sports = new Set();
      if (apiData.events) {
        Object.values(apiData.events).forEach(arr => {
          if (!Array.isArray(arr)) return;
          arr.forEach(m => m.sport && sports.add(this.normalizeSport(m.sport)));
        });
      } else if (Array.isArray(apiData)) {
        apiData.forEach(m => m.sport && sports.add(this.normalizeSport(m.sport)));
      }
      this.preloadedSports = Array.from(sports);
    } catch (e) {
      // ignore
    }
  }

  normalizeSport(s) {
    if (!s) return 'Other';
    const map = {
      soccer: 'Football', football: 'Football', basketball: 'Basketball', cricket: 'Cricket',
      rugby: 'Rugby', tennis: 'Tennis', boxing: 'Boxing', mma: 'MMA', hockey: 'Ice Hockey'
    };
    const k = ('' + s).toLowerCase();
    return map[k] || (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
  }

  // -------------------------
  // UI: Main menu & navigation
  // -------------------------
  showMainMenu() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    container.innerHTML = `
      <div class="main-menu">
        <div class="menu-grid">
          <div class="menu-button sports-button" data-action="sports"><div class="button-title">LIVE SPORTS</div></div>
          <div class="menu-button tv-button" data-action="tv"><div class="button-title">TV CHANNELS</div></div>
          <div class="menu-button community"><div class="button-title">COMMUNITY</div></div>
        </div>
      </div>
    `;
    this.currentView = 'main';
  }

  // called by click handler
  async showSportsView() {
    this.showSportsLoadingUI();
    await this.loadMatches();
    this.showSportsDataUI();
  }

  showSportsLoadingUI() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    container.innerHTML = `<div class="content-section"><div class="section-header"><h2>Loading matches…</h2></div></div>`;
    this.currentView = 'sports';
  }

  showSportsDataUI() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;

    if (!this.verifiedMatches || this.verifiedMatches.length === 0) {
      container.innerHTML = `<div class="content-section"><h3>No matches available</h3></div>`;
      return;
    }

    const rows = this.verifiedMatches.map(m => {
      const liveTag = m.isLive ? `<span class="live-badge">LIVE</span>` : '';
      const time = m.time || (m.unixTimestamp ? new Date(m.unixTimestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--');
      return `
        <div class="match-row" data-id="${m.id}">
          <div class="match-time">${time}</div>
          <div class="team-names">${m.teams}</div>
          <div class="league-name">${m.league}</div>
          <div class="actions">${liveTag} <button class="watch-btn" data-id="${m.id}">Watch</button></div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2>Live & Upcoming</h2>
          <p>Tap a match to open player</p>
        </div>
        <div class="matches-table">${rows}</div>
      </div>
    `;
    this.currentView = 'matches';
  }

  // -------------------------
  // Click handling & routing
  // -------------------------
  handleGlobalClick(e) {
    const menu = e.target.closest('.menu-button');
    if (menu) {
      const action = menu.getAttribute('data-action');
      if (action === 'sports') this.showSportsView();
      if (action === 'tv') this.showTVChannels();
      return;
    }

    const watchBtn = e.target.closest('.watch-btn');
    if (watchBtn) {
      const id = watchBtn.getAttribute('data-id');
      if (id) this.showMatchDetails(id);
      return;
    }

    const matchRow = e.target.closest('.match-row');
    if (matchRow) {
      const id = matchRow.getAttribute('data-id');
      if (id) this.showMatchDetails(id);
      return;
    }

    const homeBtn = e.target.closest('.home-button');
    if (homeBtn) this.showMainMenu();
  }

  // -------------------------
  // Match details / Player
  // -------------------------
  async showMatchDetails(matchId) {
    const match = this.verifiedMatches.find(m => m.id === matchId);
    if (!match) {
      console.warn('Match not found:', matchId);
      return;
    }

    // Build sources list using master priority, channels, stream_sources
    const sources = await this.getAllSourcesForMatch(match);

    const container = document.getElementById('dynamic-content');
    if (!container) return;

    const liveBadge = match.isLive ? `<span class="live-badge">LIVE</span>` : '';
    const streamButtons = sources.map((s, idx) => `<button class="source-btn" data-url="${encodeURIComponent(s.url)}">${s.label || 'Stream ' + (idx+1)}</button>`).join('');

    container.innerHTML = `
      <div class="match-details-overlay">
        <div class="match-details-modal">
          <div class="match-header"><button class="back-btn">← Back</button></div>
          <div class="video-container">
            <div class="video-player-wrapper">
              <iframe id="stream-iframe-${matchId}" src="${match.streamUrl || (match.channels && match.channels[0]) || ''}" allow="autoplay; fullscreen" allowfullscreen></iframe>
            </div>
            <div class="video-controls">
              <div class="video-title">${match.teams}</div>
              <div class="video-stats">${match.league} ${liveBadge} • ${match.date || ''}</div>
              <div class="stream-selector">${streamButtons}</div>
              <div class="match-description"><div><strong>Info:</strong> ${match.confidence ? 'Conf: ' + match.confidence : ''}</div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // attach source handlers
    document.querySelectorAll('.source-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = decodeURIComponent(btn.getAttribute('data-url'));
        const iframe = document.getElementById(`stream-iframe-${matchId}`);
        if (iframe) iframe.src = url;
      });
    });

    document.querySelectorAll('.back-btn').forEach(b => b.addEventListener('click', () => this.showSportsView()));
    this.incrementViews(matchId);
    this.currentView = 'match-details';
  }

  // Build source list with priorities
  async getAllSourcesForMatch(match) {
    const sources = [];

    // master stream_sources prioritized
    if (match.stream_sources && typeof match.stream_sources === 'object') {
      Object.keys(match.stream_sources).forEach(provider => {
        (match.stream_sources[provider] || []).forEach((url, idx) => {
          sources.push({ provider, url, label: `${provider} ${idx + 1}` });
        });
      });
    }

    // fallback channels + sources
    if (match.channels && Array.isArray(match.channels)) {
      match.channels.forEach((url, idx) => {
        // try to label by provider pattern
        let provider = 'unknown';
        if (url.includes('topembed')) provider = 'tom';
        if (url.includes('embedsports') || url.includes('spiderembed')) provider = 'sarah';
        sources.push({ provider, url, label: `${provider} ${idx + 1}` });
      });
    }

    // also include raw sources object (tom/sarah/wendy)
    if (match.sources && typeof match.sources === 'object') {
      Object.keys(match.sources).forEach(k => {
        (match.sources[k] || []).forEach((url) => {
          sources.push({ provider: k, url, label: `${k}` });
        });
      });
    }

    // de-dupe by url
    const seen = new Set();
    const uniq = [];
    sources.forEach(s => {
      if (!s || !s.url) return;
      if (!seen.has(s.url)) {
        seen.add(s.url);
        uniq.push(s);
      }
    });
    return uniq;
  }

  // -------------------------
  // TV channels view
  // -------------------------
  showTVChannels() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    const countries = Object.keys(this.tvChannelsData || {});
    const html = countries.map(c => {
      const channels = (this.tvChannelsData[c] || []).map(ch => `<div class="tv-channel"><div>${ch.displayName || ch.name}</div><button data-url="${encodeURIComponent(ch.streamUrl)}" class="tv-watch">Watch</button></div>`).join('');
      return `<div class="country-block"><h3>${c}</h3>${channels}</div>`;
    }).join('');
    container.innerHTML = `<div class="content-section"><div class="section-header"><h2>TV Channels</h2></div>${html}</div>`;

    document.querySelectorAll('.tv-watch').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = decodeURIComponent(btn.getAttribute('data-url'));
        // open in overlay player
        const demoMatch = { id: 'tv-'+Math.random().toString(36).slice(2,8), teams: 'TV Channel', streamUrl: url, date: '', time: '', league: 'TV' };
        this.showPlayerFromUrl(url, demoMatch);
      });
    });
  }

  showPlayerFromUrl(url, match) {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    container.innerHTML = `
      <div class="match-details-overlay">
        <div class="match-details-modal">
          <div class="match-header"><button class="back-btn">← Back</button></div>
          <div class="video-container">
            <iframe id="tv-player" src="${url}" allow="autoplay; fullscreen" allowfullscreen></iframe>
            <div class="video-controls"><div class="video-title">${match.teams}</div></div>
          </div>
        </div>
      </div>
    `;
    document.querySelectorAll('.back-btn').forEach(b => b.addEventListener('click', () => this.showMainMenu()));
  }

  // -------------------------
  // Analytics & UI helpers
  // -------------------------
  updateAnalytics() {
    try {
      const total = this.verifiedMatches.length;
      const liveCount = this.verifiedMatches.filter(m => m.isLive).length;
      const totalViews = Array.from(this.matchStats.values()).reduce((s, v) => s + (v.views || 0), 0);
      document.getElementById('total-streams')?.innerText = String(total);
      document.getElementById('live-viewers')?.innerText = String(Math.floor(totalViews / 100));
      document.getElementById('update-time')?.innerText = new Date().toLocaleTimeString();
    } catch (e) {}
  }

  incrementViews(matchId) {
    const s = this.matchStats.get(matchId) || { views: 0, likes: 0, dislikes: 0 };
    s.views = (s.views || 0) + 1;
    this.matchStats.set(matchId, s);
    this.updateAnalytics();
  }

  handleLike(matchId) {
    const s = this.matchStats.get(matchId) || { likes: 0 };
    s.likes = (s.likes || 0) + 1;
    this.matchStats.set(matchId, s);
  }
  handleDislike(matchId) {
    const s = this.matchStats.get(matchId) || { dislikes: 0 };
    s.dislikes = (s.dislikes || 0) + 1;
    this.matchStats.set(matchId, s);
  }
  handleShare(matchId) {
    alert('Share feature coming soon!');
  }

  formatNumber(n) { return n.toLocaleString(); }
  formatDisplayDate(d) { if (!d) return ''; try { return new Date(d).toDateString(); } catch(e){return d;} }

  // -------------------------
  // Background preload + safety
  // -------------------------
  backgroundPreload() {
    setTimeout(() => {
      this.preloadSportsData().catch(() => {});
    }, 1000);
  }

  async preloadSportsData() {
    if (this.isDataLoaded || this.isLoading) return;
    this.isLoading = true;
    const cached = this.getCachedData();
    if (cached) {
      this.extractAndCacheSports(cached);
      this.isLoading = false;
      return;
    }

    try {
      // prefer client getUnifiedMatches if present
      if (window.getUnifiedMatches) {
        const unified = await window.getUnifiedMatches();
        if (unified && unified.length) {
          this.applyNormalizedList(unified);
          this.cacheData({ events: { 'preload': unified } });
          this.isLoading = false;
          return;
        }
      }

      // fallback: try github master
      const res = await fetch(this.githubMasterUrl);
      if (res.ok) {
        const master = await res.json();
        if (master && master.matches) {
          this.convertMasterToAppFormat(master);
          this.cacheData(master);
        }
      }
    } catch (e) {
      // silent
    } finally {
      this.isLoading = false;
    }
  }

  applyNormalizedList(list) {
    // list is expected as normalized items (id,date,time,teams,channels,isLive,unix)
    this.verifiedMatches = Array.isArray(list) ? list.map(it => ({
      id: it.id,
      date: it.date,
      time: it.time,
      teams: it.teams,
      league: it.league || it.sport,
      isLive: !!it.isLive,
      unixTimestamp: it.unix || it.unixTimestamp || Date.now(),
      channels: it.channels || [],
      stream_sources: it.stream_sources || {},
      sources: it.sources || {},
      confidence: it.confidence || it.quality_score || 0,
      raw: it.raw || it
    })) : [];
    this.verifiedMatches.sort((a,b)=> (a.unixTimestamp||0)-(b.unixTimestamp||0));
    this.updateAnalytics();
  }

  // -------------------------
  // Small helpers for external usage (player page)
  // -------------------------
  getMatchById(id) {
    return this.verifiedMatches.find(m => String(m.id) === String(id));
  }

  // -------------------------
  // Expose for debugging
  // -------------------------
  debugDump() {
    console.log('Matches:', this.verifiedMatches.slice(0,20));
    console.log('Stats:', Array.from(this.matchStats.entries()).slice(0,20));
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.matchScheduler = new MatchScheduler();
    await window.matchScheduler.init();
    console.log('✅ MatchScheduler ready');
  } catch (e) {
    console.error('Initialization error', e);
    const el = document.getElementById('error-boundary');
    if (el) {
      el.style.display = 'block';
      document.getElementById('error-message').textContent = e.message || 'Initialization failed';
    }
  }
});

// If the site includes a player page (player.html) you can add this small loader:
// Place this in your player.html <script> after script.js
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    if (location.pathname.endsWith('/player.html') || location.pathname.endsWith('/player')) {
      // wait for matchScheduler to be ready
      const waitForScheduler = () => new Promise(resolve => {
        const check = setInterval(() => {
          if (window.matchScheduler && window.matchScheduler.isDataLoaded) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      await waitForScheduler();
      // get id from localStorage
      const id = localStorage.getItem('9k-active-match');
      if (!id) return;
      const match = window.matchScheduler.getMatchById(id);
      if (!match) return;
      // fill page elements
      const titleEl = document.getElementById('player-title');
      const iframeEl = document.getElementById('player-frame');
      if (titleEl) titleEl.textContent = match.teams || 'Match';
      if (iframeEl) {
        iframeEl.src = match.channels && match.channels.length ? match.channels[0] : (match.streamUrl || '');
      }
    }
  });
}
