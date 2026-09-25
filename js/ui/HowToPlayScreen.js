/**
 * VORTEX GLIDE — HowToPlayScreen
 * Panel 4: 4-Card Mission Briefing (Identify, Move, Pass, Repeat) with Close Button
 */

export class HowToPlayScreen {
  constructor(container, onBack) {
    this.container = container;
    this.onBack = onBack;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="scifi-card htp-scifi-card">
        <button class="scifi-card-close" id="btn-htp-close" aria-label="Close">✕</button>

        <h2 class="scifi-title">HOW TO PLAY</h2>
        <div class="scifi-subtitle">FIND THE GAP • MOVE LEFT OR RIGHT • SURVIVE</div>

        <!-- 4-Step Core Mission -->
        <div class="how-to-play-grid">
          <!-- Step 1 -->
          <div class="htp-card">
            <div class="htp-card-icon">
              <svg viewBox="0 0 24 24" fill="#00f3ff">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <div class="htp-card-title">1. IDENTIFY</div>
            <div class="htp-card-desc">Spot the safe opening in oncoming rings</div>
          </div>

          <!-- Step 2 -->
          <div class="htp-card">
            <div class="htp-card-icon">
              <svg viewBox="0 0 24 24" fill="#00f3ff">
                <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
              </svg>
            </div>
            <div class="htp-card-title">2. STEER</div>
            <div class="htp-card-desc">A/D, Arrows, or Touch to rotate the tunnel</div>
          </div>

          <!-- Step 3 -->
          <div class="htp-card">
            <div class="htp-card-icon">
              <svg viewBox="0 0 24 24" fill="#00f3ff">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
            <div class="htp-card-title">3. PASS</div>
            <div class="htp-card-desc">Glide cleanly through the open corridor</div>
          </div>

          <!-- Step 4 -->
          <div class="htp-card">
            <div class="htp-card-icon">
              <svg viewBox="0 0 24 24" fill="#ffe600">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </div>
            <div class="htp-card-title">4. RECORD</div>
            <div class="htp-card-desc">Survive hypersonic speeds & set top scores</div>
          </div>
        </div>

        <!-- 3 Tactical Features -->
        <div class="htp-tactics-grid">
          <div class="htp-tactic-box">
            <div class="tactic-header">
              <span class="tactic-badge badge-cyan">SPECIAL MANEUVER</span>
              <span class="tactic-title">⚡ 180° FLIP [SPACE]</span>
            </div>
            <div class="tactic-desc">Tap <strong>SPACE</strong> or <strong>180°</strong> button to instantly invert to the opposite face with brief invulnerability!</div>
          </div>

          <div class="htp-tactic-box">
            <div class="tactic-header">
              <span class="tactic-badge badge-yellow">BONUS MULTIPLIER</span>
              <span class="tactic-title">💎 CRYSTALS [5x]</span>
            </div>
            <div class="tactic-desc">Fly through safe paths to collect crystals (+50 pts) and build score multipliers up to <strong>5x</strong>. Near-misses refresh the timer!</div>
          </div>

          <div class="htp-tactic-box">
            <div class="tactic-header">
              <span class="tactic-badge badge-pink">SECTOR GATES</span>
              <span class="tactic-title">🏁 CHECKPOINTS</span>
            </div>
            <div class="tactic-desc">Pass through holographic portal gates to unlock new starting sectors and trigger an instant <strong>5x Multiplier Boost</strong>!</div>
          </div>
        </div>

        <button class="btn-pill-primary" id="btn-htp-got-it" style="max-width: 220px; margin-top: 10px;">
          GOT IT!
        </button>
      </div>
    `;

    this.container.querySelector('#btn-htp-close').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    this.container.querySelector('#btn-htp-got-it').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });
  }

  show() {
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }
}
