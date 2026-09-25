/**
 * VORTEX GLIDE — PauseScreen
 * Panel 3: Chamfered card with Resume, Restart, Settings, Main Menu
 */

export class PauseScreen {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="scifi-card">
        <h2 class="scifi-title">PAUSED</h2>
        <div class="scifi-subtitle">TAKE A BREATH. THE TUNNEL WAITS.</div>

        <div class="pause-actions">
          <button class="btn-pill-primary" id="btn-pause-resume" style="width: 100%;">
            ▶ RESUME
          </button>

          <button class="btn-pill-secondary" id="btn-pause-restart">
            🔄 RESTART
          </button>

          <button class="btn-pill-secondary" id="btn-pause-settings">
            ⚙ SETTINGS
          </button>

          <button class="btn-pill-secondary" id="btn-pause-menu">
            ⌂ MAIN MENU
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-pause-resume').addEventListener('click', () => {
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    this.container.querySelector('#btn-pause-restart').addEventListener('click', () => {
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    this.container.querySelector('#btn-pause-settings').addEventListener('click', () => {
      if (this.callbacks.onSettings) this.callbacks.onSettings();
    });

    this.container.querySelector('#btn-pause-menu').addEventListener('click', () => {
      if (this.callbacks.onMainMenu) this.callbacks.onMainMenu();
    });
  }

  show() {
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }
}
