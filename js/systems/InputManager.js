/**
 * VORTEX GLIDE — InputManager
 * Spec Section 7-9, 55-56: State-aware multi-input coordinator (Keyboard & Touch)
 */

export class InputManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    
    // Raw inputs
    this.keyLeft = false;
    this.keyRight = false;
    this.touchLeft = false;
    this.touchRight = false;
    
    // Callbacks
    this.onPauseRequested = null;
    this.onFlipRequested = null;
    this.onPlayRequested = null;
    this.onRestartRequested = null;
    
    // Bound listeners for cleanup
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);

    this.init();
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('visibilitychange', this._onVisibilityChange);
    window.addEventListener('blur', () => this.resetInputs());
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
  }

  resetInputs() {
    this.keyLeft = false;
    this.keyRight = false;
    this.touchLeft = false;
    this.touchRight = false;
  }

  _onKeyDown(e) {
    // If playing, listen for pause (P key and Escape)
    // NOTE: Do NOT preventDefault on Escape — CrazyGames requires it to exit fullscreen
    if (e.code === 'Escape') {
      if (this.onPauseRequested) {
        this.onPauseRequested();
      }
      return;
    }
    if (e.code === 'KeyP') {
      e.preventDefault();
      if (this.onPauseRequested) {
        this.onPauseRequested();
      }
      return;
    }

    // Prevent iframe scrolling on gameplay arrow keys / space / enter
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter'].includes(e.code)) {
      e.preventDefault();
    }

    // Context-sensitive Space & Enter actions based on GameState
    if (e.code === 'Space' || e.code === 'Enter') {
      if (e.repeat) return;

      if (this.stateManager) {
        if (this.stateManager.isGameOver()) {
          if (this.onRestartRequested) {
            this.onRestartRequested();
          }
          return;
        } else if (this.stateManager.isHome()) {
          if (this.onPlayRequested) {
            this.onPlayRequested();
          }
          return;
        } else if (this.stateManager.isPlaying()) {
          // 180° Inversion Flip on Spacebar during flight
          if (e.code === 'Space' && this.onFlipRequested) {
            this.onFlipRequested();
          }
          return;
        }
      }
    }

    // Movement keys: QWERTY (A/D), AZERTY (Q/D), and Arrow keys
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
      this.keyLeft = true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keyRight = true;
    }
  }

  triggerFlip() {
    if (this.onFlipRequested) {
      this.onFlipRequested();
    }
  }

  _onKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
      this.keyLeft = false;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keyRight = false;
    }
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this.resetInputs();
      // Auto pause if playing (Spec Section 76)
      if (this.stateManager && this.stateManager.isPlaying() && this.onPauseRequested) {
        this.onPauseRequested();
      }
    }
  }

  setTouchSteering(left, right) {
    this.touchLeft = left;
    this.touchRight = right;
  }

  /**
   * Returns current lateral steering demand from -1.0 (full left) to +1.0 (full right).
   * Automatically isolates input: returns 0 if not actively interactive.
   */
  getSteering() {
    if (!this.stateManager || !this.stateManager.isInteractive()) {
      return 0.0;
    }

    const left = this.keyLeft || this.touchLeft;
    const right = this.keyRight || this.touchRight;

    if (left && !right) return -1.0;
    if (right && !left) return 1.0;
    return 0.0;
  }
}
