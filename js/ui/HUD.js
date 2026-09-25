/**
 * VORTEX GLIDE — HUD
 * Distance card, Speed card, Progress milestone bar, Circular touch controls + 180° Flip button,
 * 180° Flip Status indicator, Near Miss alerts, Milestone banners, and Desktop control hint
 */

export class HUD {
  constructor(container, onPauseClick, onSteerTouch, onFlipClick) {
    this.container = container;
    this.onPauseClick = onPauseClick;
    this.onSteerTouch = onSteerTouch;
    this.onFlipClick = onFlipClick;

    this.distEl = null;
    this.speedEl = null;
    this.progressFill = null;
    this.nearMissBanner = null;
    this.milestoneBanner = null;
    this.milestoneTitle = null;
    this.milestoneSub = null;
    this.desktopHint = null;
    this.flipBadge = null;
    this.touchFlipBtn = null;
    this.warpFlash = null;

    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="hud-top-container">
        <!-- Top Left: Distance Card + Pause Button below -->
        <div class="hud-left-group">
          <div class="hud-panel-card">
            <span class="hud-label">DISTANCE</span>
            <span class="hud-val" id="hud-distance-val">0.0 m</span>
          </div>

          <button class="hud-pause-square-btn" id="hud-pause-btn" aria-label="Pause" title="Pause (P or Esc)">
            <div class="hud-pause-bars">
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        <!-- Top Center: Level Pill, Checkpoint Progress Bar & 180° Flip Ready Badge -->
        <div class="hud-center-group">
          <div class="hud-level-pill" id="hud-level-pill">
            <span class="level-badge" id="hud-level-badge">LVL 1</span>
            <span class="level-name" id="hud-level-name">SECTOR 1</span>
          </div>

          <div class="hud-progress-wrapper" title="Checkpoint Progress">
            <div class="hud-progress-fill" id="hud-progress-fill"></div>
            <div class="hud-checkpoint-pip" style="left: 0%;"></div>
            <div class="hud-checkpoint-pip" style="left: 50%;"></div>
            <div class="hud-checkpoint-pip" style="left: 100%;"></div>
          </div>

          <div class="hud-flip-badge ready" id="hud-flip-badge" title="180° Inversion Flip (Press Space)">
            <span class="flip-key-pill">SPACE</span>
            <span class="flip-text">180° FLIP READY</span>
          </div>
        </div>

        <!-- Top Right: Speed Card + Multiplier & Crystal Badges -->
        <div class="hud-right-group">
          <div class="hud-panel-card">
            <span class="hud-label">SPEED</span>
            <span class="hud-val speed-val" id="hud-speed-val">28.0 m/s</span>
          </div>

          <div class="hud-sub-stats">
            <div class="hud-multiplier-pill" id="hud-multiplier-pill" title="Score Multiplier">
              <span class="mult-val" id="hud-mult-val">1x</span>
              <div class="mult-meter-track">
                <div class="mult-meter-fill" id="hud-mult-meter"></div>
              </div>
            </div>

            <div class="hud-crystal-pill" id="hud-crystal-pill" title="Quantum Crystals Collected">
              <span class="crystal-icon">💎</span>
              <span class="crystal-count" id="hud-crystal-count">0</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Controls Overlay Hint (fades out during run) -->
      <div class="desktop-controls-hint" id="desktop-controls-hint">
        STEER: <strong>A / D</strong> OR <strong>ARROWS</strong> (<strong>Q/D</strong> AZERTY) • 180° FLIP: <strong>SPACE</strong> • PAUSE: <strong>P</strong>
      </div>

      <!-- Bottom: Touch Controls (Steer Left, 180° Inversion Flip, Steer Right) -->
      <div id="touch-controls">
        <button class="btn-touch-arrow" id="touch-btn-left" aria-label="Steer Left">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>

        <button class="btn-touch-flip ready" id="touch-btn-flip" aria-label="180 Degree Flip" title="180° Flip to Opposite Side">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
          <span class="touch-flip-label">180° FLIP</span>
        </button>

        <button class="btn-touch-arrow" id="touch-btn-right" aria-label="Steer Right">
          <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
      </div>

      <!-- Crystal Pickup Alert -->
      <div class="crystal-pickup-banner" id="crystal-pickup-banner">
        💎 +50 PTS • 2x BOOST
      </div>

      <!-- Near Miss Popup Alert -->
      <div class="near-miss-banner" id="near-miss-banner">
        ⚡ NEAR MISS +15m
      </div>

      <!-- Level Clear Celebration Banner -->
      <div class="level-clear-banner" id="level-clear-banner">
        <div class="level-clear-badge">★ CHECKPOINT SAVED ★</div>
        <div class="level-clear-title" id="level-clear-title">SECTOR 1 CLEARED!</div>
        <div class="level-clear-sub" id="level-clear-sub">ENTERING SECTOR 2 • 5x MULTIPLIER BOOST</div>
      </div>

      <!-- Milestone Popup Banner -->
      <div class="milestone-banner" id="milestone-banner">
        <div class="milestone-icon">★</div>
        <div class="milestone-text-group">
          <span class="milestone-title" id="milestone-title">TIER 2 REACHED</span>
          <span class="milestone-subtitle" id="milestone-subtitle">WARP ACCELERATION ACTIVE</span>
        </div>
      </div>

      <!-- Full-screen Quantum Warp Flash on 180° Flip -->
      <div class="flip-warp-flash" id="flip-warp-flash"></div>

      <!-- Near Miss Radial Edge Vignette -->
      <div class="near-miss-vignette" id="near-miss-vignette"></div>

      <!-- Full-Screen Split Touch Steering Zones (Left 44% / Right 44%) -->
      <div id="touch-zone-left" class="fullscreen-touch-zone touch-zone-left" aria-hidden="true"></div>
      <div id="touch-zone-right" class="fullscreen-touch-zone touch-zone-right" aria-hidden="true"></div>
    `;

    this.distEl = this.container.querySelector('#hud-distance-val');
    this.speedEl = this.container.querySelector('#hud-speed-val');
    this.levelPill = this.container.querySelector('#hud-level-pill');
    this.levelBadge = this.container.querySelector('#hud-level-badge');
    this.levelName = this.container.querySelector('#hud-level-name');
    this.progressFill = this.container.querySelector('#hud-progress-fill');
    this.levelClearBanner = this.container.querySelector('#level-clear-banner');
    this.levelClearTitle = this.container.querySelector('#level-clear-title');
    this.levelClearSub = this.container.querySelector('#level-clear-sub');
    this.multPill = this.container.querySelector('#hud-multiplier-pill');
    this.multVal = this.container.querySelector('#hud-mult-val');
    this.multMeter = this.container.querySelector('#hud-mult-meter');
    this.crystalCount = this.container.querySelector('#hud-crystal-count');
    this.crystalBanner = this.container.querySelector('#crystal-pickup-banner');
    this.nearMissBanner = this.container.querySelector('#near-miss-banner');
    this.nearMissVignette = this.container.querySelector('#near-miss-vignette');
    this.touchZoneLeft = this.container.querySelector('#touch-zone-left');
    this.touchZoneRight = this.container.querySelector('#touch-zone-right');
    this.milestoneBanner = this.container.querySelector('#milestone-banner');
    this.milestoneTitle = this.container.querySelector('#milestone-title');
    this.milestoneSub = this.container.querySelector('#milestone-subtitle');
    this.desktopHint = this.container.querySelector('#desktop-controls-hint');
    this.flipBadge = this.container.querySelector('#hud-flip-badge');
    this.touchFlipBtn = this.container.querySelector('#touch-btn-flip');
    this.warpFlash = this.container.querySelector('#flip-warp-flash');

    this.container.querySelector('#hud-pause-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onPauseClick) this.onPauseClick();
    });

    if (this.flipBadge) {
      this.flipBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onFlipClick) this.onFlipClick();
      });
    }

    this._setupTouchEvents();
  }

  _setupTouchEvents() {
    const leftBtn = this.container.querySelector('#touch-btn-left');
    const rightBtn = this.container.querySelector('#touch-btn-right');
    const flipBtn = this.container.querySelector('#touch-btn-flip');

    let leftDown = false;
    let rightDown = false;

    const emit = () => {
      if (this.onSteerTouch) {
        this.onSteerTouch(leftDown, rightDown);
      }
      leftBtn.classList.toggle('active', leftDown);
      rightBtn.classList.toggle('active', rightDown);
    };

    const addSteerListeners = (btn, isLeft) => {
      const down = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLeft) leftDown = true;
        else rightDown = true;
        emit();
      };
      const up = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLeft) leftDown = false;
        else rightDown = false;
        emit();
      };

      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
    };

    addSteerListeners(leftBtn, true);
    addSteerListeners(rightBtn, false);

    if (this.touchZoneLeft) addSteerListeners(this.touchZoneLeft, true);
    if (this.touchZoneRight) addSteerListeners(this.touchZoneRight, false);

    if (flipBtn) {
      flipBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onFlipClick) this.onFlipClick();
      });
    }
  }

  show() {
    this.container.classList.add('active');

    // Show desktop hint initially, then fade out after 5 seconds
    if (this.desktopHint) {
      this.desktopHint.classList.remove('fade-out');
      this.desktopHint.style.display = 'block';
      setTimeout(() => {
        if (this.desktopHint) this.desktopHint.classList.add('fade-out');
      }, 5000);
    }
  }

  hide() {
    this.container.classList.remove('active');
  }

  update(distance, speed, isFlipReady = true, flipCooldownRatio = 0, multiplier = 1, multiplierRatio = 0, crystals = 0, levelConfig = null, levelProgress = null) {
    if (this.distEl) {
      this.distEl.textContent = `${distance.toFixed(1)} m`;
    }
    if (this.speedEl) {
      this.speedEl.textContent = `${speed.toFixed(1)} m/s`;
    }

    // Update Level Pill & Checkpoint Progress Fill
    if (levelConfig) {
      if (this.levelBadge) {
        this.levelBadge.textContent = `LVL ${levelConfig.level}`;
      }
      if (this.levelName) {
        this.levelName.textContent = levelConfig.shortName || levelConfig.name;
      }
    }

    if (this.progressFill) {
      if (levelProgress) {
        this.progressFill.style.width = `${Math.min(100, Math.max(5, levelProgress.ratio * 100))}%`;
      } else {
        const cycleProgress = ((distance % 500) / 500) * 100;
        this.progressFill.style.width = `${Math.min(100, Math.max(5, cycleProgress))}%`;
      }
    }

    // Update 180° Flip Badges & Buttons
    if (this.flipBadge) {
      if (isFlipReady) {
        this.flipBadge.classList.remove('cooldown');
        this.flipBadge.classList.add('ready');
        this.flipBadge.querySelector('.flip-text').textContent = '180° FLIP READY';
      } else {
        this.flipBadge.classList.remove('ready');
        this.flipBadge.classList.add('cooldown');
        const pct = Math.round((1.0 - flipCooldownRatio) * 100);
        this.flipBadge.querySelector('.flip-text').textContent = `RECHARGING ${pct}%`;
      }
    }

    if (this.touchFlipBtn) {
      if (isFlipReady) {
        this.touchFlipBtn.classList.remove('cooldown');
        this.touchFlipBtn.classList.add('ready');
      } else {
        this.touchFlipBtn.classList.remove('ready');
        this.touchFlipBtn.classList.add('cooldown');
      }
    }

    // Update Multiplier and Crystals
    if (this.multVal) {
      this.multVal.textContent = `${multiplier}x`;
    }
    if (this.multPill) {
      this.multPill.classList.toggle('boosted', multiplier > 1);
    }
    if (this.multMeter) {
      this.multMeter.style.width = `${Math.max(0, Math.min(100, multiplierRatio * 100))}%`;
    }
    if (this.crystalCount) {
      this.crystalCount.textContent = `${crystals}`;
    }
  }

  triggerLevelClear(clearedLevel, nextLevel) {
    if (this.levelClearBanner) {
      if (this.levelClearTitle) {
        this.levelClearTitle.textContent = `${clearedLevel.shortName} CLEARED!`;
      }
      if (this.levelClearSub) {
        this.levelClearSub.textContent = `CHECKPOINT SAVED • ENTERING ${nextLevel.shortName} • 5x BOOST`;
      }
      this.levelClearBanner.classList.remove('show');
      void this.levelClearBanner.offsetWidth;
      this.levelClearBanner.classList.add('show');

      setTimeout(() => {
        if (this.levelClearBanner) this.levelClearBanner.classList.remove('show');
      }, 3500);
    }
  }

  triggerCrystalPickup(multiplier) {
    if (this.crystalBanner) {
      this.crystalBanner.textContent = `💎 +50 PTS • ${multiplier}x BOOST`;
      this.crystalBanner.classList.remove('show');
      void this.crystalBanner.offsetWidth;
      this.crystalBanner.classList.add('show');
    }

    if (this.multPill) {
      this.multPill.classList.remove('pulse');
      void this.multPill.offsetWidth;
      this.multPill.classList.add('pulse');
    }
  }

  triggerFlipFlash() {
    if (!this.warpFlash) return;
    this.warpFlash.classList.remove('active');
    void this.warpFlash.offsetWidth;
    this.warpFlash.classList.add('active');
  }

  triggerNearMiss(combo = 1) {
    if (this.nearMissVignette) {
      this.nearMissVignette.classList.remove('active');
      void this.nearMissVignette.offsetWidth;
      this.nearMissVignette.classList.add('active');
      setTimeout(() => {
        if (this.nearMissVignette) this.nearMissVignette.classList.remove('active');
      }, 240);
    }
    if (!this.nearMissBanner) return;

    if (combo > 1) {
      this.nearMissBanner.textContent = `⚡ SLIPSTREAM x${combo} • +15m SURGE`;
      this.nearMissBanner.classList.add('combo');
    } else {
      this.nearMissBanner.textContent = `⚡ NEAR MISS +15m`;
      this.nearMissBanner.classList.remove('combo');
    }

    this.nearMissBanner.classList.remove('show');
    void this.nearMissBanner.offsetWidth;
    this.nearMissBanner.classList.add('show');
  }

  triggerRecordBreach(bestDistance) {
    if (this.distEl) {
      this.distEl.classList.remove('record-gold-glow');
      void this.distEl.offsetWidth;
      this.distEl.classList.add('record-gold-glow');
    }
    this.triggerMilestone('★ NEW ALL-TIME RECORD! ★', `SURPASSED ${Math.round(bestDistance)}m — KEEP GLIDING!`);
  }

  triggerPerfectInversion() {
    this.triggerFlipFlash();
    this.triggerMilestone('⚡ PERFECT INVERSION', '+250 PTS • QUANTUM FLOW');
  }

  startDesktopHintFade() {
    if (this.desktopHint) {
      this.desktopHint.style.opacity = '1';
      setTimeout(() => {
        if (this.desktopHint) {
          this.desktopHint.style.transition = 'opacity 1.2s ease';
          this.desktopHint.style.opacity = '0';
        }
      }, 6000);
    }
  }

  triggerMilestone(title, subtitle = '') {
    if (!this.milestoneBanner) return;
    if (this.milestoneTitle) this.milestoneTitle.textContent = title;
    if (this.milestoneSub) this.milestoneSub.textContent = subtitle;

    this.milestoneBanner.classList.remove('show');
    void this.milestoneBanner.offsetWidth;
    this.milestoneBanner.classList.add('show');

    setTimeout(() => {
      if (this.milestoneBanner) this.milestoneBanner.classList.remove('show');
    }, 2800);
  }
}
