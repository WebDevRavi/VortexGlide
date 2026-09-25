/**
 * VORTEX GLIDE — GameOverScreen
 * Panel 5: GAME OVER! banner, large distance readout, and circular Restart / Main Menu action buttons
 */

export class GameOverScreen {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.distEl = null;

    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="scifi-card gameover-card">
        <h2 class="scifi-title gameover-title">GAME OVER!</h2>
        <div class="scifi-subtitle">YOU TRAVELLED</div>

        <div class="gameover-distance" id="go-distance-val">
          0 m
        </div>

        <div class="gameover-badge-record" id="go-record-badge" style="display: none;">
          ★ NEW RECORD! ★
        </div>

        <div class="gameover-stats-grid">
          <div class="go-stat-box">
            <span class="go-stat-label">BEST RECORD</span>
            <span class="go-stat-value" id="go-best-val">0 m</span>
          </div>
          <div class="go-stat-box">
            <span class="go-stat-label">CRYSTALS</span>
            <span class="go-stat-value" id="go-crystals-val">💎 0</span>
          </div>
        </div>

        <!-- Diagnostic Telemetry Readout -->
        <div class="go-telemetry-badge" id="go-telemetry-badge" style="display: none;">
          COLLIDED WITH HAZARD
        </div>

        <!-- Checkpoint Respawn Option -->
        <button class="btn-pill-primary btn-respawn-checkpoint" id="btn-go-checkpoint" style="display: none; margin: 0 auto 16px; width: 90%; max-width: 320px; font-size: 0.92rem; padding: 12px 18px;">
          ⚡ RESPAWN AT CHECKPOINT
        </button>

        <div class="gameover-actions">
          <!-- Restart Button -->
          <button class="btn-circle-action" id="btn-go-restart" aria-label="Restart Run from Level 1" title="Restart from Level 1">
            <div class="circle-icon-wrapper">
              <svg viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6 0 2.97-2.17 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93 0-4.42-3.58-8-8-8zm-6 8c0-1.65.67-3.15 1.76-4.24L6.34 7.34C4.9 8.78 4 10.79 4 13c0 4.08 3.05 7.44 7 7.93v-2.02c-2.83-.48-5-2.94-5-5.91z"/>
              </svg>
            </div>
            <span class="circle-action-label">RESTART LVL 1</span>
          </button>

          <!-- Main Menu Button -->
          <button class="btn-circle-action" id="btn-go-menu" aria-label="Main Menu" title="Main Menu">
            <div class="circle-icon-wrapper">
              <svg viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <span class="circle-action-label">MAIN MENU</span>
          </button>
        </div>

        <!-- Quick Instant Retry Prompt -->
        <div class="go-quick-retry-prompt">
          PRESS <span class="key-pill">SPACE</span> OR <span class="key-pill">ENTER</span> FOR INSTANT RETRY
        </div>
      </div>
    `;

    this.distEl = this.container.querySelector('#go-distance-val');
    this.recordBadge = this.container.querySelector('#go-record-badge');
    this.bestEl = this.container.querySelector('#go-best-val');
    this.crystalsEl = this.container.querySelector('#go-crystals-val');
    this.telemetryEl = this.container.querySelector('#go-telemetry-badge');
    this.checkpointBtn = this.container.querySelector('#btn-go-checkpoint');
    this.restartLabel = this.container.querySelector('#btn-go-restart .circle-action-label');

    if (this.checkpointBtn) {
      this.checkpointBtn.addEventListener('click', () => {
        if (this.callbacks.onResumeCheckpoint) this.callbacks.onResumeCheckpoint();
      });
    }

    this.container.querySelector('#btn-go-restart').addEventListener('click', () => {
      if (this.callbacks.onInstantRestart) {
        this.callbacks.onInstantRestart();
      } else if (this.callbacks.onRestart) {
        this.callbacks.onRestart();
      }
    });

    this.container.querySelector('#btn-go-menu').addEventListener('click', () => {
      if (this.callbacks.onMainMenu) this.callbacks.onMainMenu();
    });
  }

  show(distance, bestDistance, isNewBest = false, crystals = 0, checkpointInfo = null, totalCrystals = null, telemetry = null) {
    if (this.distEl) {
      this.distEl.textContent = `${Math.round(distance)} m`;
    }
    if (this.recordBadge) {
      this.recordBadge.style.display = isNewBest ? 'inline-block' : 'none';
    }
    if (this.bestEl) {
      this.bestEl.textContent = `${Math.round(bestDistance)} m`;
    }
    if (this.telemetryEl) {
      if (telemetry) {
        this.telemetryEl.textContent = telemetry;
        this.telemetryEl.style.display = 'block';
      } else {
        this.telemetryEl.style.display = 'none';
      }
    }
    if (this.crystalsEl) {
      if (totalCrystals !== null && totalCrystals !== undefined) {
        this.crystalsEl.textContent = `💎 +${crystals} (${totalCrystals})`;
      } else {
        this.crystalsEl.textContent = `💎 ${crystals}`;
      }
    }

    if (this.restartLabel) {
      this.restartLabel.textContent = (checkpointInfo && checkpointInfo.distance > 0) ? 'RESTART LVL 1' : 'PLAY AGAIN';
    }

    if (this.checkpointBtn) {
      if (checkpointInfo && checkpointInfo.distance > 0) {
        this.checkpointBtn.textContent = `⚡ RESPAWN: ${checkpointInfo.shortName} (${checkpointInfo.distance}m)`;
        this.checkpointBtn.style.display = 'block';
      } else {
        this.checkpointBtn.style.display = 'none';
      }
    }
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }
}
