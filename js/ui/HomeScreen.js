import { SHIP_SKINS } from '../systems/SaveManager.js';

export class HomeScreen {
  constructor(container, callbacks = {}, platformAdapter = null, saveManager = null) {
    this.container = container;
    this.callbacks = callbacks;
    this.platformAdapter = platformAdapter;
    this.saveManager = saveManager;
    this.userProfileEl = null;

    this.currentSkinIndex = 0;
    if (this.saveManager) {
      const equipped = this.saveManager.getSelectedSkin();
      const idx = SHIP_SKINS.findIndex(s => s.id === equipped);
      if (idx !== -1) this.currentSkinIndex = idx;
    }

    this._build();
  }

  setPlatformAdapter(adapter) {
    this.platformAdapter = adapter;
    this.updateUserDisplay();
  }

  _build() {
    this.container.innerHTML = `
      <!-- Top Bar: User Profile, Banked Crystals & Best Distance -->
      <div class="home-top-bar">
        <div class="home-user-badge" id="home-user-badge">
          <span class="user-avatar-icon">👤</span>
          <span class="user-name-text" id="user-name-display">GUEST PILOT</span>
        </div>
        <div class="home-top-stats" style="display: flex; gap: 10px; align-items: center;">
          <div class="home-crystal-pill" id="home-crystal-pill" title="Banked Quantum Crystals">
            <span class="crystal-icon">💎</span>
            <span class="crystal-val" id="home-crystal-val">0</span>
          </div>
          <div class="home-best-pill" id="home-best-pill">
            <span class="best-pill-label">RECORD</span>
            <span class="best-pill-val" id="home-best-val">0 m</span>
          </div>
        </div>
      </div>

      <div class="home-center-content">
        <!-- Official Vector / 3D Logo Badge -->
        <img src="logo.svg" onerror="this.onerror=null;this.src='assets/icons/logo.svg'" class="hero-logo-img" alt="VORTEX GLIDE">

        <!-- Sector / Checkpoint Level Selector -->
        <div class="home-level-selector" id="home-level-selector">
          <button class="level-select-btn" id="btn-prev-level" aria-label="Previous Sector">‹</button>
          <div class="level-select-display">
            <span class="level-select-tag" id="level-select-tag">START SECTOR</span>
            <span class="level-select-name" id="level-select-name">SECTOR 1: SOLAR RING</span>
          </div>
          <button class="level-select-btn" id="btn-next-level" aria-label="Next Sector">›</button>
        </div>

        <!-- Ship Hangar Skin Selector -->
        <div class="home-level-selector hangar-selector" id="home-hangar-selector" style="margin-top: 6px; margin-bottom: 12px;">
          <button class="level-select-btn" id="btn-prev-skin" aria-label="Previous Ship Skin">‹</button>
          <div class="level-select-display hangar-display" id="skin-select-box" style="cursor: pointer;" title="Click to Equip or Unlock Skin">
            <span class="level-select-tag" id="skin-select-tag">HANGAR CHASSIS</span>
            <span class="level-select-name" id="skin-select-name">DELTA CYAN (EQUIPPED)</span>
          </div>
          <button class="level-select-btn" id="btn-next-skin" aria-label="Next Ship Skin">›</button>
        </div>

        <!-- Big Glowing PLAY Pill Button -->
        <button class="btn-pill-primary" id="btn-play">
          ▶ PLAY <span class="play-key-cue">[SPACE]</span>
        </button>

        <!-- Official Author Credit (Compliant with CrazyGames: No external hyperlinks) -->
        <div class="home-author-credit">
          Created by Ravi Solanki
        </div>
      </div>

      <!-- Bottom Navigation Bar Matching Panel 1 -->
      <div class="home-bottom-bar">
        <button class="btn-bottom-nav" id="btn-how-to-play">
          <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
          HOW TO PLAY
        </button>

        <button class="btn-bottom-nav" id="btn-settings">
          <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
          SETTINGS
        </button>

        <button class="btn-bottom-nav" id="btn-leaderboard">
          <svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
          LEADERBOARD
        </button>
      </div>
    `;

    // Elements
    this.prevLevelBtn = this.container.querySelector('#btn-prev-level');
    this.nextLevelBtn = this.container.querySelector('#btn-next-level');
    this.levelNameEl = this.container.querySelector('#level-select-name');
    this.levelTagEl = this.container.querySelector('#level-select-tag');
    this.playBtn = this.container.querySelector('#btn-play');

    this.prevSkinBtn = this.container.querySelector('#btn-prev-skin');
    this.nextSkinBtn = this.container.querySelector('#btn-next-skin');
    this.skinNameEl = this.container.querySelector('#skin-select-name');
    this.skinTagEl = this.container.querySelector('#skin-select-tag');
    this.skinBoxEl = this.container.querySelector('#skin-select-box');
    this.crystalValEl = this.container.querySelector('#home-crystal-val');

    this.selectedLevel = 1;
    this.highestLevel = 1;
    this.levelConfigs = [];

    // Wire Level Selector arrows
    if (this.prevLevelBtn) {
      this.prevLevelBtn.addEventListener('click', () => {
        if (this.selectedLevel > 1) {
          this.selectedLevel--;
          this._updateLevelSelectorDisplay();
          if (this.callbacks.onSelectLevel) {
            this.callbacks.onSelectLevel(this.selectedLevel);
          }
        }
      });
    }

    if (this.nextLevelBtn) {
      this.nextLevelBtn.addEventListener('click', () => {
        if (this.selectedLevel < this.highestLevel) {
          this.selectedLevel++;
          this._updateLevelSelectorDisplay();
          if (this.callbacks.onSelectLevel) {
            this.callbacks.onSelectLevel(this.selectedLevel);
          }
        }
      });
    }

    // Wire Hangar Skin Selector
    if (this.prevSkinBtn) {
      this.prevSkinBtn.addEventListener('click', () => {
        this.currentSkinIndex = (this.currentSkinIndex - 1 + SHIP_SKINS.length) % SHIP_SKINS.length;
        this._handleSkinChange();
      });
    }

    if (this.nextSkinBtn) {
      this.nextSkinBtn.addEventListener('click', () => {
        this.currentSkinIndex = (this.currentSkinIndex + 1) % SHIP_SKINS.length;
        this._handleSkinChange();
      });
    }

    if (this.skinBoxEl) {
      this.skinBoxEl.addEventListener('click', () => {
        const skin = SHIP_SKINS[this.currentSkinIndex];
        if (!skin || !this.saveManager) return;
        if (this.saveManager.isSkinUnlocked(skin.id)) {
          this.saveManager.setSelectedSkin(skin.id);
          if (this.callbacks.onSelectSkin) this.callbacks.onSelectSkin(skin.id);
        } else {
          // Attempt purchase
          if (this.saveManager.unlockSkin(skin.id)) {
            if (this.callbacks.onSelectSkin) this.callbacks.onSelectSkin(skin.id);
          } else {
            if (this.skinNameEl) {
              const currentText = this.skinNameEl.textContent;
              this.skinNameEl.textContent = `NEED 💎 ${skin.cost} (HAVE ${this.saveManager.getTotalCrystals()})`;
              setTimeout(() => this._updateSkinSelectorDisplay(), 1400);
            }
          }
        }
        this._updateSkinSelectorDisplay();
      });
    }

    // Wire callbacks
    this.playBtn.addEventListener('click', () => {
      // Try orientation lock to landscape on mobile user gesture
      if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
      if (this.callbacks.onPlay) this.callbacks.onPlay(this.selectedLevel);
    });

    this.container.querySelector('#btn-how-to-play').addEventListener('click', () => {
      if (this.callbacks.onHowToPlay) this.callbacks.onHowToPlay();
    });

    this.container.querySelector('#btn-settings').addEventListener('click', () => {
      if (this.callbacks.onSettings) this.callbacks.onSettings();
    });

    this.container.querySelector('#btn-leaderboard').addEventListener('click', () => {
      if (this.callbacks.onLeaderboard) this.callbacks.onLeaderboard();
    });

    // Sign in prompt if user clicks guest badge
    this.container.querySelector('#home-user-badge').addEventListener('click', async () => {
      if (this.platformAdapter && typeof this.platformAdapter.showAuthPrompt === 'function') {
        const user = await this.platformAdapter.showAuthPrompt();
        if (user) {
          this.updateUserDisplay();
        }
      }
    });

    this.updateUserDisplay();
    this._updateSkinSelectorDisplay();
  }

  setLevelData(highestLevel = 1, selectedLevel = 1, levelConfigs = []) {
    this.highestLevel = Math.max(1, highestLevel);
    this.selectedLevel = Math.min(this.highestLevel, Math.max(1, selectedLevel));
    this.levelConfigs = levelConfigs;
    this._updateLevelSelectorDisplay();
  }

  _updateLevelSelectorDisplay() {
    if (!this.levelNameEl) return;

    const currentCfg = this.levelConfigs.find(l => l.level === this.selectedLevel);
    if (currentCfg) {
      const distInfo = currentCfg.startDistance > 0 ? ` (${currentCfg.startDistance}m)` : '';
      this.levelNameEl.textContent = `${currentCfg.name}${distInfo}`;
      if (currentCfg.accentColor) {
        this.levelNameEl.style.color = currentCfg.accentColor;
      }
    } else {
      this.levelNameEl.textContent = `SECTOR ${this.selectedLevel}`;
      this.levelNameEl.style.color = '#ffffff';
    }

    if (this.prevLevelBtn) {
      this.prevLevelBtn.disabled = this.selectedLevel <= 1;
    }
    if (this.nextLevelBtn) {
      this.nextLevelBtn.disabled = this.selectedLevel >= this.highestLevel;
    }

    if (this.playBtn) {
      if (this.selectedLevel > 1) {
        this.playBtn.innerHTML = `▶ LAUNCH SECTOR ${this.selectedLevel} <span class="play-key-cue">[SPACE]</span>`;
      } else {
        this.playBtn.innerHTML = `▶ PLAY <span class="play-key-cue">[SPACE]</span>`;
      }
    }
  }

  updateUserDisplay() {
    const nameEl = this.container.querySelector('#user-name-display');
    const avatarEl = this.container.querySelector('.user-avatar-icon');
    if (!nameEl) return;

    if (this.platformAdapter && this.platformAdapter.getUser()) {
      const user = this.platformAdapter.getUser();
      nameEl.textContent = user.username.toUpperCase();
      if (user.profilePictureUrl && avatarEl) {
        avatarEl.innerHTML = `<img src="${user.profilePictureUrl}" class="avatar-img" alt="avatar">`;
      }
    } else {
      nameEl.textContent = 'GUEST PILOT';
    }
  }

  _handleSkinChange() {
    const skin = SHIP_SKINS[this.currentSkinIndex];
    if (this.saveManager && skin && this.saveManager.isSkinUnlocked(skin.id)) {
      this.saveManager.setSelectedSkin(skin.id);
      if (this.callbacks.onSelectSkin) this.callbacks.onSelectSkin(skin.id);
    }
    this._updateSkinSelectorDisplay();
  }

  _updateSkinSelectorDisplay() {
    if (!this.skinNameEl) return;
    const skin = SHIP_SKINS[this.currentSkinIndex] || SHIP_SKINS[0];
    const isUnlocked = this.saveManager ? this.saveManager.isSkinUnlocked(skin.id) : (skin.cost === 0);
    const isEquipped = this.saveManager ? (this.saveManager.getSelectedSkin() === skin.id) : (skin.id === 'cyan');

    if (isEquipped) {
      this.skinNameEl.textContent = `${skin.name} (EQUIPPED)`;
      this.skinNameEl.style.color = '#00f3ff';
      if (this.skinTagEl) this.skinTagEl.textContent = 'ACTIVE CHASSIS';
    } else if (isUnlocked) {
      this.skinNameEl.textContent = `${skin.name} (CLICK TO EQUIP)`;
      this.skinNameEl.style.color = '#ffffff';
      if (this.skinTagEl) this.skinTagEl.textContent = 'HANGAR CHASSIS';
    } else {
      this.skinNameEl.textContent = `${skin.name} — UNLOCK 💎 ${skin.cost}`;
      this.skinNameEl.style.color = '#ffe600';
      if (this.skinTagEl) this.skinTagEl.textContent = 'LOCKED CHASSIS';
    }

    if (this.crystalValEl && this.saveManager) {
      this.crystalValEl.textContent = `${this.saveManager.getTotalCrystals()}`;
    }
  }

  show(bestDistance = 0, highestLevel = 1, selectedLevel = 1, levelConfigs = [], saveManager = null) {
    if (saveManager) this.saveManager = saveManager;
    const bestValEl = this.container.querySelector('#home-best-val');
    if (bestValEl) {
      bestValEl.textContent = `${Math.round(bestDistance)} m`;
    }
    if (levelConfigs && levelConfigs.length > 0) {
      this.setLevelData(highestLevel, selectedLevel, levelConfigs);
    }
    this.updateUserDisplay();
    this._updateSkinSelectorDisplay();
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }
}
