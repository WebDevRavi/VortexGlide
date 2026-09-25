/**
 * VORTEX GLIDE — GameState
 * Spec Section 29-30: Strict single-state machine
 */

export const GameState = Object.freeze({
  BOOT: 'BOOT',
  LOADING: 'LOADING',
  HOME: 'HOME',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
  SETTINGS: 'SETTINGS',
  LEADERBOARD: 'LEADERBOARD',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
});

export class StateManager {
  constructor(initialState = GameState.BOOT) {
    this._currentState = initialState;
    this._listeners = new Set();
  }

  get current() {
    return this._currentState;
  }

  get currentState() {
    return this._currentState;
  }

  getState() {
    return this._currentState;
  }

  isPlaying() {
    return this._currentState === GameState.PLAYING;
  }

  isPaused() {
    return this._currentState === GameState.PAUSED;
  }

  isGameOver() {
    return this._currentState === GameState.GAME_OVER;
  }

  isHome() {
    return this._currentState === GameState.HOME;
  }

  isInteractive() {
    // Only in PLAYING does gameplay input move the craft
    return this._currentState === GameState.PLAYING;
  }

  changeState(newState, context = {}) {
    if (this._currentState === newState) return;
    
    // Validate state existence
    if (!GameState[newState]) {
      console.error(`[StateManager] Invalid state transition target: ${newState}`);
      return;
    }

    const previousState = this._currentState;
    this._currentState = newState;

    // Notify listeners
    for (const listener of this._listeners) {
      try {
        listener(newState, previousState, context);
      } catch (err) {
        console.error('[StateManager] Listener error:', err);
      }
    }
  }

  addListener(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}
