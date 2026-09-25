/**
 * VORTEX GLIDE — LeaderboardScreen
 * Panel 9: Global arcade pilot rankings with personal best record
 * Integrated with CrazyGames user profile (Single-player arcade focus)
 */

export class LeaderboardScreen {
  constructor(container, saveManager, onBack, platformAdapter = null) {
    this.container = container;
    this.saveManager = saveManager;
    this.onBack = onBack;
    this.platformAdapter = platformAdapter;

    this.topPilots = [
      { rank: 1, name: '👑 SHADOW_RIDER', score: 9820, tag: 'LEGEND' },
      { rank: 2, name: '⚡ NEON_WOLF', score: 8764, tag: 'MASTER' },
      { rank: 3, name: '🚀 PIXEL_RUNNER', score: 7420, tag: 'ACE' },
      { rank: 4, name: '⭐ TURBO_GLIDE', score: 6891, tag: 'VETERAN' },
      { rank: 5, name: '🌀 CYBER_PULSE', score: 6120, tag: 'PRO' }
    ];

    this._build();
  }

  setPlatformAdapter(adapter) {
    this.platformAdapter = adapter;
  }

  _build() {
    this.container.innerHTML = `
      <div class="scifi-card">
        <button class="scifi-card-close" id="btn-leaderboard-close" aria-label="Close">✕</button>
        <h2 class="scifi-title">PILOT RANKINGS</h2>
        <div class="scifi-subtitle">GLOBAL HALL OF GLIDERS</div>

        <div class="leaderboard-table" id="leaderboard-rows"></div>

        <div class="leaderboard-footer-actions">
          <button class="btn-pill-secondary" id="btn-leaderboard-auth" style="max-width: 220px; display: none;">
            SYNC ACCOUNT
          </button>
          <button class="btn-pill-secondary" id="btn-leaderboard-back" style="max-width: 220px;">
            BACK
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-leaderboard-close').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    this.container.querySelector('#btn-leaderboard-back').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    const authBtn = this.container.querySelector('#btn-leaderboard-auth');
    authBtn.addEventListener('click', async () => {
      if (this.platformAdapter && typeof this.platformAdapter.showAuthPrompt === 'function') {
        const user = await this.platformAdapter.showAuthPrompt();
        if (user) {
          this.renderRows();
        }
      }
    });

    this.renderRows();
  }

  renderRows() {
    const best = Math.round(this.saveManager.getBestDistance());
    const table = this.container.querySelector('#leaderboard-rows');
    const authBtn = this.container.querySelector('#btn-leaderboard-auth');

    let userName = 'YOU (GUEST)';
    let isLogged = false;

    if (this.platformAdapter && this.platformAdapter.getUser()) {
      const user = this.platformAdapter.getUser();
      userName = `YOU (${user.username.toUpperCase()})`;
      isLogged = true;
    }

    if (authBtn) {
      authBtn.style.display = isLogged ? 'none' : 'inline-flex';
    }

    let html = this.topPilots.map((item) => `
      <div class="leaderboard-row">
        <div class="leaderboard-rank-name">
          <span class="leaderboard-rank">${item.rank}</span>
          <span class="leaderboard-name">${item.name}</span>
          <span class="leaderboard-tag">${item.tag}</span>
        </div>
        <span class="leaderboard-score">${item.score} m</span>
      </div>
    `).join('');

    // Highlight user's personal best record
    html += `
      <div class="leaderboard-row user-row">
        <div class="leaderboard-rank-name">
          <span class="leaderboard-rank">★</span>
          <span class="leaderboard-name">${userName}</span>
          <span class="leaderboard-tag user-tag">YOUR BEST</span>
        </div>
        <span class="leaderboard-score">${best} m</span>
      </div>
    `;

    table.innerHTML = html;
  }

  show() {
    this.renderRows();
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }
}
