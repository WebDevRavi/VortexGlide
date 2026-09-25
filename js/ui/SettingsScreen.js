/**
 * VORTEX GLIDE — SettingsScreen
 * Panel 6: Sliders for Music & SFX % and Toggles for Fullscreen, Mobile Controls, Dev FPS
 */

export class SettingsScreen {
  constructor(container, saveManager, audioManager, onBack, onFpsToggle) {
    this.container = container;
    this.saveManager = saveManager;
    this.audioManager = audioManager;
    this.onBack = onBack;
    this.onFpsToggle = onFpsToggle;

    this._build();
  }

  _build() {
    const musicVol = this.saveManager.getSetting('musicVolume') !== undefined ? this.saveManager.getSetting('musicVolume') : 80;
    const sfxVol = this.saveManager.getSetting('sfxVolume') !== undefined ? this.saveManager.getSetting('sfxVolume') : 80;
    const mobileOn = this.saveManager.getSetting('mobileControls') !== undefined ? this.saveManager.getSetting('mobileControls') : true;
    const fpsOn = this.saveManager.getSetting('showFps') || false;

    this.container.innerHTML = `
      <div class="scifi-card">
        <button class="scifi-card-close" id="btn-settings-close" aria-label="Close">✕</button>

        <h2 class="scifi-title">SETTINGS</h2>
        <div class="scifi-subtitle">AUDIO & DISPLAY CONFIGURATION</div>

        <div class="settings-items-list">
          <!-- Music Slider -->
          <div class="settings-row">
            <span class="settings-label">
              <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              MUSIC
            </span>
            <div class="scifi-slider-container">
              <input type="range" class="scifi-slider" id="slider-music" min="0" max="100" value="${musicVol}">
              <span class="scifi-slider-val" id="val-music">${musicVol}%</span>
            </div>
          </div>

          <!-- SFX Slider -->
          <div class="settings-row">
            <span class="settings-label">
              <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              SFX
            </span>
            <div class="scifi-slider-container">
              <input type="range" class="scifi-slider" id="slider-sfx" min="0" max="100" value="${sfxVol}">
              <span class="scifi-slider-val" id="val-sfx">${sfxVol}%</span>
            </div>
          </div>

          <!-- Fullscreen Toggle -->
          <div class="settings-row">
            <span class="settings-label">
              <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              FULLSCREEN
            </span>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-fullscreen">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- Mobile Controls Toggle -->
          <div class="settings-row">
            <span class="settings-label">
              <svg viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
              MOBILE CONTROLS
            </span>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-mobile" ${mobileOn ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- Dev FPS Toggle -->
          <div class="settings-row">
            <span class="settings-label">
              <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
              SHOW FPS (DEV)
            </span>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-fps" ${fpsOn ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <button class="btn-pill-primary" id="btn-settings-back" style="max-width: 240px;">
          APPLY & CLOSE
        </button>
      </div>
    `;

    // Music slider
    const sMusic = this.container.querySelector('#slider-music');
    const vMusic = this.container.querySelector('#val-music');
    sMusic.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      vMusic.textContent = `${val}%`;
      this.saveManager.setSetting('musicVolume', val);
      this.saveManager.setSetting('musicEnabled', val > 0);
      this.audioManager.updateMusicVolume();
    });

    // SFX slider
    const sSfx = this.container.querySelector('#slider-sfx');
    const vSfx = this.container.querySelector('#val-sfx');
    sSfx.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      vSfx.textContent = `${val}%`;
      this.saveManager.setSetting('sfxVolume', val);
      this.saveManager.setSetting('soundEnabled', val > 0);
      this.audioManager.updateSfxVolume();
      this.audioManager.playSwitch();
    });

    // Fullscreen toggle
    const tFull = this.container.querySelector('#toggle-fullscreen');
    tFull.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    });

    // Mobile controls toggle
    const tMobile = this.container.querySelector('#toggle-mobile');
    tMobile.addEventListener('change', (e) => {
      this.saveManager.setSetting('mobileControls', e.target.checked);
      const touchRoot = document.getElementById('touch-controls');
      if (touchRoot) {
        touchRoot.style.display = e.target.checked ? 'flex' : 'none';
      }
    });

    // Show FPS toggle
    const tFps = this.container.querySelector('#toggle-fps');
    tFps.addEventListener('change', (e) => {
      this.saveManager.setSetting('showFps', e.target.checked);
      if (this.onFpsToggle) this.onFpsToggle(e.target.checked);
    });

    // Close buttons
    this.container.querySelector('#btn-settings-close').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });
    this.container.querySelector('#btn-settings-back').addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });
  }

  show() {
    // Sync fullscreen toggle to actual state (user may have exited via Escape key)
    const tFull = this.container.querySelector('#toggle-fullscreen');
    if (tFull) {
      tFull.checked = !!document.fullscreenElement;
    }
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }
}
