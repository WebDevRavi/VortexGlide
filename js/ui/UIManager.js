/**
 * VORTEX GLIDE — UIManager
 * Spec Section 57: Master screen orchestrator, touch input wiring, countdown & damage FX
 */

import { HomeScreen } from './HomeScreen.js';
import { HowToPlayScreen } from './HowToPlayScreen.js';
import { SettingsScreen } from './SettingsScreen.js';
import { LeaderboardScreen } from './LeaderboardScreen.js';
import { PauseScreen } from './PauseScreen.js';
import { GameOverScreen } from './GameOverScreen.js';
import { HUD } from './HUD.js';
import { GameState } from '../core/GameState.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.audio = game.audioManager;
    this.save = game.saveManager;

    // Root UI elements
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownNumber = document.getElementById('countdown-number');
    this.impactFlash = document.getElementById('impact-flash');
    this.fpsCounter = document.getElementById('fps-counter');

    // Instantiate sub-screens
    this.homeScreen = new HomeScreen(
      document.getElementById('home-screen'),
      {
        onPlay: (startLevel) => {
          this.audio.playClick();
          this.game.startCountdown(startLevel);
        },
        onSelectLevel: (lvl) => {
          this.save.setSelectedStartLevel(lvl);
        },
        onSelectSkin: (skinId) => {
          this.audio.playClick();
          this.game.updatePlayerSkin();
        },
        onHowToPlay: () => {
          this.audio.playClick();
          this.game.showHowToPlay();
        },
        onSettings: () => {
          this.audio.playClick();
          this.game.showSettings();
        },
        onLeaderboard: () => {
          this.audio.playClick();
          this.game.showLeaderboard();
        }
      },
      this.game.platformAdapter,
      this.save
    );

    this.howToPlayScreen = new HowToPlayScreen(
      document.getElementById('how-to-play-screen'),
      () => {
        this.audio.playClick();
        this.game.returnToHome();
      }
    );

    this.settingsScreen = new SettingsScreen(
      document.getElementById('settings-screen'),
      this.save,
      this.audio,
      () => {
        this.audio.playClick();
        this.game.returnToHome();
      },
      (show) => this.toggleFpsCounter(show)
    );

    this.leaderboardScreen = new LeaderboardScreen(
      document.getElementById('leaderboard-screen'),
      this.save,
      () => {
        this.audio.playClick();
        this.game.returnToHome();
      },
      this.game.platformAdapter
    );

    this.pauseScreen = new PauseScreen(
      document.getElementById('pause-screen'),
      {
        onResume: () => {
          this.audio.playClick();
          this.game.resume();
        },
        onRestart: () => {
          this.audio.playClick();
          this.game.restart();
        },
        onSettings: () => {
          this.audio.playClick();
          this.game.showSettings();
        },
        onMainMenu: () => {
          this.audio.playClick();
          this.game.returnToHome();
        }
      }
    );

    this.gameOverScreen = new GameOverScreen(
      document.getElementById('game-over-screen'),
      {
        onResumeCheckpoint: () => {
          this.audio.playClick();
          this.game.respawnAtCheckpointInstant();
        },
        onInstantRestart: () => {
          this.audio.playClick();
          this.game.instantRestart(1);
        },
        onRestart: () => {
          this.audio.playClick();
          this.game.instantRestart(1);
        },
        onMainMenu: () => {
          this.audio.playClick();
          this.game.returnToHome();
        }
      }
    );

    this.hud = new HUD(
      document.getElementById('gameplay-hud'),
      () => {
        this.audio.playClick();
        this.game.pause();
      },
      (left, right) => {
        this.game.inputManager.setTouchSteering(left, right);
      },
      () => {
        this.game.inputManager.triggerFlip();
      }
    );

    // Initial check for mobile controls setting
    const mobileOn = this.save.getSetting('mobileControls') !== undefined ? this.save.getSetting('mobileControls') : true;
    const touchRoot = document.getElementById('touch-controls');
    if (touchRoot) {
      touchRoot.style.display = mobileOn ? 'flex' : 'none';
    }

    // Initial check for dev FPS
    this.toggleFpsCounter(this.save.getSetting('showFps') || false);
  }

  hideAllScreens() {
    if (this._countdownTimer) {
      clearTimeout(this._countdownTimer);
      this._countdownTimer = null;
    }
    this.homeScreen.hide();
    this.howToPlayScreen.hide();
    this.settingsScreen.hide();
    this.leaderboardScreen.hide();
    this.pauseScreen.hide();
    this.gameOverScreen.hide();
    this.hud.hide();
    if (this.countdownOverlay) this.countdownOverlay.classList.remove('active');
  }

  showHome(bestDistance, highestLevel = 1, selectedLevel = 1, levelConfigs = []) {
    this.hideAllScreens();
    this.homeScreen.show(bestDistance, highestLevel, selectedLevel, levelConfigs, this.save);
  }

  showHowToPlay() {
    this.hideAllScreens();
    this.howToPlayScreen.show();
  }

  showSettings() {
    this.hideAllScreens();
    this.settingsScreen.show();
  }

  showLeaderboard() {
    this.hideAllScreens();
    this.leaderboardScreen.show();
  }

  showGameplay() {
    this.hideAllScreens();
    this.hud.show();
    this.hud.startDesktopHintFade();
  }

  showPause() {
    this.pauseScreen.show();
  }

  hidePause() {
    this.pauseScreen.hide();
  }

  showGameOver(distance, bestDistance, isNewBest, crystals = 0, checkpointInfo = null, telemetry = null) {
    this.hideAllScreens();
    const totalCrystals = this.save ? this.save.getTotalCrystals() : crystals;
    this.gameOverScreen.show(distance, bestDistance, isNewBest, crystals, checkpointInfo, totalCrystals, telemetry);
  }

  toggleFpsCounter(show) {
    if (this.fpsCounter) {
      this.fpsCounter.style.display = show ? 'block' : 'none';
    }
  }

  updateFps(fps) {
    if (this.fpsCounter && this.fpsCounter.style.display !== 'none') {
      this.fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
    }
  }

  updateHUD(distance, speed, isFlipReady, flipCooldownRatio, multiplier = 1, multiplierRatio = 0, crystals = 0, levelConfig = null, levelProgress = null) {
    this.hud.update(distance, speed, isFlipReady, flipCooldownRatio, multiplier, multiplierRatio, crystals, levelConfig, levelProgress);
  }

  triggerLevelClear(clearedLevel, nextLevel) {
    this.hud.triggerLevelClear(clearedLevel, nextLevel);
  }

  triggerCrystalPickup(multiplier) {
    this.hud.triggerCrystalPickup(multiplier);
  }

  triggerNearMiss(combo = 1) {
    this.hud.triggerNearMiss(combo);
  }

  triggerRecordBreach(bestDistance) {
    this.hud.triggerRecordBreach(bestDistance);
  }

  triggerMilestone(title, subtitle = '') {
    this.hud.triggerMilestone(title, subtitle);
  }

  triggerImpactFlash() {
    if (!this.impactFlash) return;
    this.impactFlash.classList.remove('trigger');
    void this.impactFlash.offsetWidth;
    this.impactFlash.classList.add('trigger');
  }

  /**
   * Runs the 3-2-1-GO arcade countdown animation
   * @param {Function} onComplete
   */
  startCountdown(onComplete) {
    this.hideAllScreens();
    if (!this.countdownOverlay || !this.countdownNumber) {
      if (onComplete) onComplete();
      return;
    }

    this.countdownOverlay.classList.add('active');
    const steps = ['3', '2', '1', 'GO!'];
    let stepIndex = 0;

    const playStep = () => {
      if (stepIndex >= steps.length) {
        this._countdownTimer = null;
        this.countdownOverlay.classList.remove('active');
        if (onComplete) onComplete();
        return;
      }

      const text = steps[stepIndex];
      this.countdownNumber.textContent = text;
      
      // Audio beep
      const isGo = text === 'GO!';
      this.audio.playCountdown(isGo);

      // Re-trigger CSS animation
      this.countdownNumber.style.animation = 'none';
      void this.countdownNumber.offsetWidth;
      this.countdownNumber.style.animation = 'countdownPop 0.55s cubic-bezier(0.1, 0.9, 0.2, 1) forwards';

      stepIndex++;
      this._countdownTimer = setTimeout(playStep, 550);
    };

    playStep();
  }
}
