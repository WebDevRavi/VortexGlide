/**
 * VORTEX GLIDE — CrazyGamesAdapter
 * Fully compliant CrazyGames SDK v3 Adapter
 * 
 * Basic Launch Mode:
 * - ADS ARE STRICTLY DISABLED (rejection prevention)
 * - Full Game Lifecycle (loadingStart, loadingStop, gameplayStart, gameplayStop, happytime)
 * - Mute audio support via addSettingsChangeListener
 * - User Module integration (getUser, showAuthPrompt, auth listeners)
 * - Data Module cloud save integration (setItem, getItem, removeItem, clear)
 * - Analytics order tracking stub
 */

export class CrazyGamesAdapter {
  constructor() {
    this.isAvailable = false;
    this.sdk = null;
    this.user = null;
    this.isPlatformMuted = false;
    this.onMuteChangeCallback = null;
    this.onUserChangeCallback = null;

    // Check URL parameters for muteAudio (supports CrazyGames QA test harness: ?muteAudio=true)
    if (typeof window !== 'undefined' && window.location) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('muteAudio') === 'true') {
          this.isPlatformMuted = true;
        }
      } catch {}
    }

    // Basic Launch Compliance: Ads are strictly not used or requested.
    this.initPromise = this.init();
  }

  async init() {
    // Check if CrazyGames SDK v3 global is present
    if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
      try {
        this.sdk = window.CrazyGames.SDK;
        if (typeof this.sdk.init === 'function') {
          await this.sdk.init();
        }
        this.isAvailable = true;
        console.log('[CrazyGamesAdapter] CrazyGames SDK v3 initialized successfully.');

        // Initialize Audio Settings Listener
        this._initAudioSettingsListener();

        // Check for authenticated user
        await this._checkUser();

        // Listen for authentication changes
        this._initAuthListener();

        return true;
      } catch (err) {
        console.warn('[CrazyGamesAdapter] SDK init failed, falling back to standalone mode:', err);
      }
    } else {
      console.log('[CrazyGamesAdapter] Standalone mode active (SDK not detected or running locally).');
    }
    return false;
  }

  /* =========================================================================
     GAME MODULE (Lifecycle, Happytime, Mute Audio)
     ========================================================================= */

  /**
   * Tracks game loading start.
   * Call when assets start preloading.
   */
  loadingStart() {
    if (!this.isAvailable || !this.sdk?.game) return;
    try {
      if (typeof this.sdk.game.loadingStart === 'function') {
        this.sdk.game.loadingStart();
        console.log('[CrazyGamesAdapter] loadingStart reported');
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] loadingStart error:', err);
    }
  }

  /**
   * Tracks game loading stop.
   * Call once initial loading completes and game is interactive.
   */
  loadingStop() {
    if (!this.isAvailable || !this.sdk?.game) return;
    try {
      if (typeof this.sdk.game.loadingStop === 'function') {
        this.sdk.game.loadingStop();
        console.log('[CrazyGamesAdapter] loadingStop reported');
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] loadingStop error:', err);
    }
  }

  /**
   * Tracks active gameplay start.
   * Called when player enters playable game state.
   */
  gameplayStart() {
    if (!this.isAvailable || !this.sdk?.game) return;
    try {
      if (typeof this.sdk.game.gameplayStart === 'function') {
        this.sdk.game.gameplayStart();
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] gameplayStart error:', err);
    }
  }

  /**
   * Tracks gameplay stop.
   * Called on pause, game over, or return to home menu.
   */
  gameplayStop() {
    if (!this.isAvailable || !this.sdk?.game) return;
    try {
      if (typeof this.sdk.game.gameplayStop === 'function') {
        this.sdk.game.gameplayStop();
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] gameplayStop error:', err);
    }
  }

  /**
   * Celebratory event (e.g. confetti) on significant achievements like high scores.
   */
  happyTime() {
    if (!this.isAvailable || !this.sdk?.game) return;
    try {
      if (typeof this.sdk.game.happytime === 'function') {
        this.sdk.game.happytime();
        console.log('[CrazyGamesAdapter] happytime triggered');
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] happytime error:', err);
    }
  }

  /**
   * Listens to CrazyGames platform settings changes (like muteAudio).
   */
  _initAudioSettingsListener() {
    if (!this.isAvailable || !this.sdk?.game) return;

    try {
      // Check initial muteAudio state
      if (this.sdk.game.settings && typeof this.sdk.game.settings.muteAudio === 'boolean') {
        this.isPlatformMuted = this.sdk.game.settings.muteAudio;
      }

      // Add change listener
      if (typeof this.sdk.game.addSettingsChangeListener === 'function') {
        this.sdk.game.addSettingsChangeListener((settings) => {
          if (settings && typeof settings.muteAudio === 'boolean') {
            this.isPlatformMuted = settings.muteAudio;
            console.log(`[CrazyGamesAdapter] Platform audio mute updated: ${this.isPlatformMuted}`);
            if (this.onMuteChangeCallback) {
              this.onMuteChangeCallback(this.isPlatformMuted);
            }
          }
        });
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] Audio settings listener init error:', err);
    }
  }

  setMuteChangeCallback(callback) {
    this.onMuteChangeCallback = callback;
    if (this.isPlatformMuted && callback) {
      callback(this.isPlatformMuted);
    }
  }

  /* =========================================================================
     USER MODULE (Account, Profile, Auth Prompts)
     ========================================================================= */

  async _checkUser() {
    if (!this.isAvailable || !this.sdk?.user) return null;
    try {
      if (typeof this.sdk.user.getUser === 'function') {
        this.user = await this.sdk.user.getUser();
        if (this.user) {
          console.log(`[CrazyGamesAdapter] Logged in as: ${this.user.username}`);
          if (this.onUserChangeCallback) {
            this.onUserChangeCallback(this.user);
          }
        }
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] getUser error:', err);
    }
    return this.user;
  }

  _initAuthListener() {
    if (!this.isAvailable || !this.sdk?.user) return;
    try {
      if (typeof this.sdk.user.addAuthListener === 'function') {
        this.sdk.user.addAuthListener(async (user) => {
          this.user = user;
          console.log('[CrazyGamesAdapter] Auth state changed:', user?.username || 'Logged out');
          if (this.onUserChangeCallback) {
            this.onUserChangeCallback(this.user);
          }
        });
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] addAuthListener error:', err);
    }
  }

  setUserChangeCallback(callback) {
    this.onUserChangeCallback = callback;
    if (this.user && callback) {
      callback(this.user);
    }
  }

  getUser() {
    return this.user;
  }

  isUserAccountAvailable() {
    if (!this.isAvailable || !this.sdk?.user) return false;
    return !!this.sdk.user.isUserAccountAvailable;
  }

  async showAuthPrompt() {
    if (!this.isAvailable || !this.sdk?.user) return null;
    try {
      if (typeof this.sdk.user.showAuthPrompt === 'function') {
        await this.sdk.user.showAuthPrompt();
        return await this._checkUser();
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] showAuthPrompt error:', err);
    }
    return null;
  }

  async showAccountLinkPrompt() {
    if (!this.isAvailable || !this.sdk?.user) return null;
    try {
      if (typeof this.sdk.user.showAccountLinkPrompt === 'function') {
        return await this.sdk.user.showAccountLinkPrompt();
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] showAccountLinkPrompt error:', err);
    }
    return null;
  }

  async getUserToken() {
    if (!this.isAvailable || !this.sdk?.user) return null;
    try {
      if (typeof this.sdk.user.getUserToken === 'function') {
        return await this.sdk.user.getUserToken();
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] getUserToken error:', err);
    }
    return null;
  }

  async getXsollaUserToken() {
    if (!this.isAvailable || !this.sdk?.user) return null;
    try {
      if (typeof this.sdk.user.getXsollaUserToken === 'function') {
        return await this.sdk.user.getXsollaUserToken();
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] getXsollaUserToken error:', err);
    }
    return null;
  }

  /* =========================================================================
     DATA MODULE (Cloud Save Synchronization)
     ========================================================================= */

  async setItem(key, value) {
    if (!this.isAvailable || !this.sdk?.data) return false;
    try {
      if (typeof this.sdk.data.setItem === 'function') {
        const valStr = typeof value === 'string' ? value : JSON.stringify(value);
        await this.sdk.data.setItem(key, valStr);
        return true;
      }
    } catch (err) {
      console.warn(`[CrazyGamesAdapter] data.setItem failed for key "${key}":`, err);
    }
    return false;
  }

  async getItem(key) {
    if (!this.isAvailable || !this.sdk?.data) return null;
    try {
      if (typeof this.sdk.data.getItem === 'function') {
        return await this.sdk.data.getItem(key);
      }
    } catch (err) {
      console.warn(`[CrazyGamesAdapter] data.getItem failed for key "${key}":`, err);
    }
    return null;
  }

  async removeItem(key) {
    if (!this.isAvailable || !this.sdk?.data) return false;
    try {
      if (typeof this.sdk.data.removeItem === 'function') {
        await this.sdk.data.removeItem(key);
        return true;
      }
    } catch (err) {
      console.warn(`[CrazyGamesAdapter] data.removeItem failed for key "${key}":`, err);
    }
    return false;
  }

  async clearData() {
    if (!this.isAvailable || !this.sdk?.data) return false;
    try {
      if (typeof this.sdk.data.clear === 'function') {
        await this.sdk.data.clear();
        return true;
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] data.clear failed:', err);
    }
    return false;
  }

  /* =========================================================================
     ANALYTICS MODULE (Order Tracking)
     ========================================================================= */

  trackOrder(provider, order) {
    if (!this.isAvailable || !this.sdk?.analytics) return;
    try {
      if (typeof this.sdk.analytics.trackOrder === 'function') {
        this.sdk.analytics.trackOrder(provider, order);
      }
    } catch (err) {
      console.warn('[CrazyGamesAdapter] trackOrder error:', err);
    }
  }

  /* =========================================================================
     CRAZYGAMES BASIC LAUNCH COMPLIANCE:
     CrazyGames strictly prohibits ad requests in Basic Launch submissions.
     All ad & banner methods are safe no-ops and never touch the ad SDK.
     ========================================================================= */

  requestGameOverAd(onFinishedCallback) {
    if (onFinishedCallback) onFinishedCallback();
  }

  async requestAd(adType = 'midgame') {
    return { hasAdPlayed: false, error: 'Basic Launch: Ads disabled' };
  }

  async requestRewardedAd() {
    return { hasAdPlayed: false, error: 'Basic Launch: Ads disabled' };
  }

  async requestBanner() {
    return false;
  }

  async requestResponsiveBanner() {
    return false;
  }

  clearBanner() {
    return true;
  }

  clearAllBanners() {
    return true;
  }
}
