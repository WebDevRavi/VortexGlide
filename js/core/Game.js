/**
 * VORTEX GLIDE — Master Game Coordinator
 * Engine initialization, CrazyGames SDK v3 lifecycle, state transitions, and main update loop
 */

import * as THREE from '../vendor/three.module.js';
import { GameState, StateManager } from './GameState.js';
import { GameLoop } from './GameLoop.js';
import { WorldManager } from '../world/WorldManager.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { SpawnManager } from '../obstacles/SpawnManager.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { InputManager } from '../systems/InputManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { SaveManager, SHIP_SKINS } from '../systems/SaveManager.js';
import { UIManager } from '../ui/UIManager.js';
import { CrazyGamesAdapter } from '../platform/CrazyGamesAdapter.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { CollectibleManager } from '../world/CollectibleManager.js';
import { LevelManager } from '../systems/LevelManager.js';
import { CheckpointGate } from '../world/CheckpointGate.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('game-container');

    // 1. Platform Adapter (SDK init is async; lifecycle events deferred to start())
    this.platformAdapter = new CrazyGamesAdapter();

    // 2. Core Systems & Managers
    this.stateManager = new StateManager(GameState.BOOT);
    this.saveManager = new SaveManager(this.platformAdapter);
    this.audioManager = new AudioManager(this.saveManager);
    this.difficultyManager = new DifficultyManager();
    this.scoreManager = new ScoreManager(this.saveManager);
    this.inputManager = new InputManager(this.stateManager);
    this.collisionSystem = new CollisionSystem();
    this.levelManager = new LevelManager();
    this.fps = 60;

    this.previousTier = 1;
    this.nextMilestone = 500;
    this.prevDistance = 0.0;
    this.timeDilationTimer = 0.0;

    // Connect CrazyGames Platform callbacks
    this.platformAdapter.setMuteChangeCallback((isMuted) => {
      this.audioManager.setPlatformMuted(isMuted);
    });

    this.platformAdapter.setUserChangeCallback((user) => {
      if (this.uiManager) {
        if (this.uiManager.homeScreen) this.uiManager.homeScreen.updateUserDisplay();
        if (this.uiManager.leaderboardScreen) this.uiManager.leaderboardScreen.renderRows();
      }
    });

    // 3. Three.js Core
    this._initThree();

    // 4. World, Player, Obstacles, and Checkpoints
    this.worldManager = new WorldManager(this.scene, this.camera);
    this.checkpointGate = new CheckpointGate(this.worldManager.worldGroup, this.worldManager.tunnel.getRadius());
    this.spawnManager = new SpawnManager(this.worldManager.worldGroup, this.worldManager.tunnel.getRadius());
    this.collectibleManager = new CollectibleManager(this.worldManager.worldGroup, this.worldManager.tunnel.getRadius());
    this.player = new Player(this.scene, this.worldManager.tunnel.getRadius());
    this.playerController = new PlayerController(this.player, this.inputManager, this.saveManager);
    this.updatePlayerSkin();

    // 5. UI Manager
    this.uiManager = new UIManager(this);
    this.particleSystem = new ParticleSystem(this.scene);

    // 6. Hook Collectibles & Wave Spawning
    this.collectibleManager.onCollected = (crystal) => {
      const mult = this.scoreManager.addCrystal();
      this.audioManager.playPickup(mult);
      const craftPos = this.player.getWorldPosition();
      this.particleSystem.emit(craftPos, 22);
      this.uiManager.triggerCrystalPickup(mult);
    };

    this.spawnManager.onWaveSpawned = (config, spawnZ) => {
      if ((!config.rotationSpeed || config.rotationSpeed === 0) && config.openFaces && config.openFaces.length > 0) {
        // 65% spawn chance in safe gap corridor
        if (Math.random() < 0.65) {
          this.collectibleManager.spawnInGap(config.openFaces, spawnZ);
        }
      }
    };

    // 7. Game Loop (single authoritative RAF loop)
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (dt) => this.render(dt)
    );

    // 8. Setup collision callbacks
    this._setupCollisionEvents();

    // 8. Setup flip and pause key triggers
    this.inputManager.onPauseRequested = () => {
      if (this.stateManager.isPlaying()) {
        this.pause();
      } else if (this.stateManager.isPaused()) {
        this.resume();
      }
    };

    this.inputManager.onFlipRequested = () => {
      if (this.stateManager.isPlaying()) {
        const didFlip = this.playerController.triggerFlip();
        if (didFlip) {
          this.audioManager.playFlip();
          this.worldManager.triggerImpactShake(0.35); // Subtle kinetic feedback
          const craftPos = this.player.getWorldPosition();
          this.particleSystem.emit(craftPos, 24);

          // Check if flipping in close proximity to an active obstacle (<14m)
          const activeObstacles = this.spawnManager.getActiveObstacles();
          const isClutch = activeObstacles.some(obs => obs.isActive && obs.z < 0 && obs.z > -14.0);
          if (isClutch && this.uiManager && this.uiManager.hud) {
            this.scoreManager.totalScore += 250 * this.scoreManager.getMultiplier();
            this.uiManager.hud.triggerPerfectInversion();
            this.worldManager.triggerSlipstreamSurge();
          } else if (this.uiManager && this.uiManager.hud) {
            this.uiManager.hud.triggerFlipFlash();
          }
        }
      }
    };

    this.inputManager.onPlayRequested = () => {
      if (this.stateManager.isHome()) {
        this.audioManager.playClick();
        this.startCountdown();
      }
    };

    this.inputManager.onRestartRequested = () => {
      if (this.stateManager.isGameOver()) {
        this.audioManager.playClick();
        this.instantRestart(1);
      }
    };

    // 9. Handle window resize and mobile orientation change
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 150);
    });
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', () => {
        setTimeout(() => this.onResize(), 150);
      });
    }

    // 10. CrazyGames QA Requirement: Auto-pause & mute audio on tab switch or window blur
    document.addEventListener('visibilitychange', () => {
      const isVisible = !document.hidden;
      this.audioManager.handleVisibilityChange(isVisible);
      if (!isVisible && this.stateManager.isPlaying()) {
        this.pause();
      }
    });

    window.addEventListener('blur', () => {
      this.audioManager.handleVisibilityChange(false);
      if (this.stateManager.isPlaying()) {
        this.pause();
      }
    });

    window.addEventListener('focus', () => {
      if (!document.hidden) {
        this.audioManager.handleVisibilityChange(true);
      }
    });
  }

  _initThree() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0)); // Cap for 60fps performance
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060710);
    this.scene.fog = new THREE.FogExp2(0x060710, 0.011); // Cleared fog depth for far obstacle telegraphing

    // Camera (Perspective, FOV 65)
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
    dirLight.position.set(0, 5, 2);
    this.scene.add(dirLight);
  }

  _setupCollisionEvents() {
    this.collisionSystem.onCollision = (obstacle, hitResult) => {
      this.handleCollision(obstacle, hitResult);
    };

    this.collisionSystem.onNearMiss = (obstacle) => {
      this.handleNearMiss(obstacle);
    };
  }

  async start() {
    // Ensure SDK is fully initialized before firing lifecycle events
    try {
      await this.platformAdapter.initPromise;
    } catch { /* standalone mode */ }

    this.platformAdapter.loadingStart();

    // Loading complete
    this.platformAdapter.loadingStop();

    this.stateManager.changeState(GameState.HOME);
    const highestLevel = this.saveManager.getHighestLevel();
    const selectedStart = this.saveManager.getSelectedStartLevel();
    this.uiManager.showHome(
      this.saveManager.getBestDistance(),
      highestLevel,
      selectedStart,
      this.levelManager.getAllLevels()
    );
    this.gameLoop.start();
  }

  lockOrientationLandscape() {
    if (window.screen?.orientation?.lock) {
      window.screen.orientation.lock('landscape').catch(() => {});
    }
  }

  startCountdown(startLevel = null) {
    this.lockOrientationLandscape();
    const targetLevel = startLevel !== null ? startLevel : this.saveManager.getSelectedStartLevel();
    const levelConfig = this.levelManager.getLevel(targetLevel);
    const startDist = levelConfig ? levelConfig.startDistance : 0.0;

    this.stateManager.changeState(GameState.COUNTDOWN);
    this.uiManager.startCountdown(() => {
      this.startRun(startDist, targetLevel);
      if (typeof document !== 'undefined' && document.hidden) {
        this.pause();
      }
    });
  }

  startRun(startingDistance = 0.0, startingLevelNum = 1) {
    this.lockOrientationLandscape();

    const targetLevel = startingLevelNum || 1;
    const levelConfig = this.levelManager.getLevel(targetLevel);
    const startDist = Math.max(startingDistance, levelConfig ? levelConfig.startDistance : 0.0);
    const themeIndex = levelConfig ? levelConfig.themeIndex : 0;

    // Reset all gameplay systems to checkpoint / start position
    this.scoreManager.reset(startDist);
    this.difficultyManager.reset(startDist);
    this.worldManager.reset(themeIndex);
    this.playerController.reset();
    this.updatePlayerSkin();
    this.spawnManager.reset(Date.now());
    this.collectibleManager.reset();
    this.collisionSystem.reset();
    this.checkpointGate.reset();
    this.levelManager.reset();
    this.timeDilationTimer = 0.0;

    // Mark any prior checkpoints as cleared so they don't immediately trigger
    for (const lvl of this.levelManager.getAllLevels()) {
      if (lvl.clearDistance <= startDist) {
        this.levelManager.clearedCheckpoints.add(lvl.clearDistance);
      }
    }

    this.gameLoop.resetTiming();
    this.prevDistance = startDist;

    this.previousTier = this.difficultyManager.getTier();
    this.nextMilestone = Math.floor(startDist / 2000) * 2000 + 2000;

    this.stateManager.changeState(GameState.PLAYING);
    this.uiManager.showGameplay();
    this.platformAdapter.gameplayStart();
  }

  respawnAtCheckpoint() {
    const highestLevel = this.saveManager.getHighestLevel();
    const levelCfg = this.levelManager.getLevel(highestLevel);
    const checkpointDist = levelCfg ? levelCfg.startDistance : this.saveManager.getLastCheckpoint();
    this.startRun(checkpointDist, highestLevel);
  }

  pause() {
    if (!this.stateManager.isPlaying()) return;
    this.stateManager.changeState(GameState.PAUSED);
    this.audioManager.stopEngineSound();
    this.uiManager.showPause();
    this.platformAdapter.gameplayStop();
  }

  resume() {
    if (!this.stateManager.isPaused()) return;
    this.lockOrientationLandscape();
    this.gameLoop.resetTiming(); // Avoid delta spike
    this.stateManager.changeState(GameState.PLAYING);
    this.uiManager.hidePause();
    this.platformAdapter.gameplayStart();
  }

  instantRestart(startLevel = 1) {
    this.lockOrientationLandscape();
    const targetLevel = startLevel !== null ? startLevel : 1;
    const levelConfig = this.levelManager.getLevel(targetLevel);
    const startDist = levelConfig ? levelConfig.startDistance : 0.0;

    if (this.uiManager && this.uiManager.gameOverScreen) {
      this.uiManager.gameOverScreen.hide();
    }
    this.startRun(startDist, targetLevel);
    if (this.uiManager && this.uiManager.hud) {
      this.uiManager.hud.triggerMilestone('WARP DRIVE ENGAGED', 'READY — GO!');
    }
  }

  respawnAtCheckpointInstant() {
    this.lockOrientationLandscape();
    const highestLevel = this.saveManager.getHighestLevel();
    const levelCfg = this.levelManager.getLevel(highestLevel);
    const checkpointDist = levelCfg ? levelCfg.startDistance : this.saveManager.getLastCheckpoint();

    if (this.uiManager && this.uiManager.gameOverScreen) {
      this.uiManager.gameOverScreen.hide();
    }
    this.startRun(checkpointDist, highestLevel);
    if (this.uiManager && this.uiManager.hud) {
      this.uiManager.hud.triggerMilestone('CHECKPOINT RESTORED', levelCfg ? levelCfg.shortName : 'SECTOR');
    }
  }

  updatePlayerSkin() {
    if (!this.player || !this.saveManager) return;
    const skinId = this.saveManager.getSelectedSkin();
    const skinConfig = SHIP_SKINS.find(s => s.id === skinId) || SHIP_SKINS[0];
    this.player.applySkin(skinConfig);
  }

  restart() {
    this.instantRestart(1);
  }

  returnToHome() {
    this.stateManager.changeState(GameState.HOME);
    this.audioManager.stopEngineSound();
    this.worldManager.reset();
    this.playerController.reset();
    this.spawnManager.reset();
    this.collectibleManager.reset();
    this.checkpointGate.reset();
    const highestLevel = this.saveManager.getHighestLevel();
    const selectedStart = this.saveManager.getSelectedStartLevel();
    this.uiManager.showHome(
      this.saveManager.getBestDistance(),
      highestLevel,
      selectedStart,
      this.levelManager.getAllLevels()
    );
    this.platformAdapter.gameplayStop();
  }

  showHowToPlay() {
    this.stateManager.changeState(GameState.HOW_TO_PLAY);
    this.uiManager.showHowToPlay();
  }

  showSettings() {
    this.stateManager.changeState(GameState.SETTINGS);
    this.uiManager.showSettings();
  }

  showLeaderboard() {
    this.stateManager.changeState(GameState.LEADERBOARD);
    this.uiManager.showLeaderboard();
  }

  handleCollision(obstacle, hitResult) {
    this.stateManager.changeState(GameState.GAME_OVER);
    this.platformAdapter.gameplayStop();

    // Kinetic player ship fracture
    this.player.triggerCrash();

    // Visual & audio feedback
    this.worldManager.triggerImpactShake(1.4);
    this.uiManager.triggerImpactFlash();
    this.particleSystem.emit(obstacle.group.position, 60);
    this.audioManager.playCrash();
    this.audioManager.stopEngineSound();

    // Finalize score & high score check
    const results = this.scoreManager.finalizeRun();
    if (results.isNewBest) {
      this.platformAdapter.happyTime();
    }

    // Checkpoint info for Respawn option
    const highestLevel = this.saveManager.getHighestLevel();
    let checkpointInfo = null;
    if (highestLevel > 1) {
      const levelCfg = this.levelManager.getLevel(highestLevel);
      checkpointInfo = {
        level: highestLevel,
        name: levelCfg.name,
        shortName: levelCfg.shortName,
        distance: levelCfg.startDistance
      };
    }

    // Diagnostic Telemetry for player growth
    const currentDistance = this.scoreManager.getDistance();
    const currentLevel = this.levelManager.getCurrentLevel(currentDistance);
    const nextLevel = this.levelManager.getLevel(currentLevel.level + 1);
    const speedAtCrash = Math.round(this.difficultyManager.getSpeed());
    const metersToNext = (nextLevel && nextLevel.startDistance > currentDistance && nextLevel.startDistance < 900000)
      ? Math.round(nextLevel.startDistance - currentDistance)
      : null;

    let obstacleName = 'HAZARD GATE';
    if (obstacle && obstacle.type === 'rotating') obstacleName = 'ROTATING GATE';
    else if (obstacle && obstacle.type === 'alternating') obstacleName = 'SLALOM GATE';
    else if (obstacle && obstacle.type === 'center') obstacleName = 'ORBITAL DEBRIS';
    else if (obstacle && obstacle.type === 'gap') obstacleName = 'ASTEROID CLUSTER';

    let telemetry = `COLLIDED WITH ${obstacleName} IN ${currentLevel.shortName} AT ${speedAtCrash} m/s`;
    if (metersToNext && metersToNext > 0) {
      telemetry += ` • ${metersToNext}m SHORT OF ${nextLevel.shortName}`;
    }

    // Trigger Game Over Screen immediately (100% ad-free for CrazyGames Basic Launch)
    this.uiManager.showGameOver(results.distance, results.bestDistance, results.isNewBest, results.crystals, checkpointInfo, telemetry);
  }

  handleNearMiss(obstacle) {
    const { multiplier, combo } = this.scoreManager.addNearMiss();
    this.uiManager.triggerNearMiss(combo);
    this.audioManager.playNearMiss(combo);
    this.worldManager.triggerSlipstreamSurge();
    const craftPos = this.player.getWorldPosition();
    this.particleSystem.emit(craftPos, 16);
  }

  update(dt) {
    const isPlaying = this.stateManager.isPlaying();

    // Update FPS meter
    if (dt > 0) {
      const instantFps = 1.0 / dt;
      this.fps = this.fps * 0.92 + instantFps * 0.08;
      this.uiManager.updateFps(this.fps);
    }

    // Always update kinetic debris if active
    this.player.updateDebris(dt);

    // Bullet-time time dilation on sector checkpoint clear
    let effectiveDt = dt;
    if (this.timeDilationTimer > 0) {
      this.timeDilationTimer = Math.max(0, this.timeDilationTimer - dt);
      const factor = 0.52 + 0.48 * (1.0 - (this.timeDilationTimer / 0.28));
      effectiveDt *= factor;
    }

    // Menu idle animation speed vs active gameplay speed
    const idleSpeed = 18.0;
    const speed = isPlaying ? this.difficultyManager.getSpeed() : idleSpeed;
    const tier = isPlaying ? this.difficultyManager.getTier() : 1;
    const normSpeed = isPlaying ? this.difficultyManager.getNormalizedSpeed() : 0.0;

    // 1. Update Player & World Roll
    if (isPlaying) {
      this.playerController.update(effectiveDt, normSpeed);
      const worldRoll = this.playerController.getWorldRoll();
      const bankRatio = this.playerController.getSteerAmount();
      this.worldManager.setWorldRoll(worldRoll, bankRatio);
    } else {
      // Gentle idle sway in menu
      const time = performance.now() * 0.001;
      const idleRoll = Math.sin(time * 0.8) * 0.15;
      this.worldManager.setWorldRoll(idleRoll, 0.0);
      this.player.setBanking(0.0, 0.0);
    }

    // 2. Update Tunnel & Visuals (with dynamic FOV based on speed)
    this.worldManager.update(speed, effectiveDt, tier, normSpeed);
    this.particleSystem.update(effectiveDt);

    // 3. Gameplay specific updates
    if (isPlaying) {
      // Update audio engine pitch/volume
      this.audioManager.setEngineSpeed(normSpeed);

      // Update distance, score, and multiplier decay
      const distanceDelta = speed * effectiveDt;
      this.scoreManager.update(distanceDelta, effectiveDt);
      const currentDistance = this.scoreManager.getDistance();
      this.difficultyManager.update(currentDistance);

      // Real-time in-run High Score Record Breach celebration
      if (this.scoreManager.checkRecordBreach()) {
        const bestDist = this.scoreManager.bestDistance;
        this.uiManager.triggerRecordBreach(bestDist);
        this.audioManager.playRecordBreak();
        const craftPos = this.player.getWorldPosition();
        this.particleSystem.emit(craftPos, 45);
        this.worldManager.triggerSlipstreamSurge();
        this.platformAdapter.happyTime();
      }

      // Checkpoint Gate spawning & pass-through updates
      const nextCheckpointDist = this.levelManager.getNextCheckpoint(currentDistance);
      if (nextCheckpointDist !== null) {
        const distToGate = nextCheckpointDist - currentDistance;
        if (distToGate > 0 && distToGate <= 155 && !this.checkpointGate.isGateActive()) {
          const currentLvl = this.levelManager.getCurrentLevel(currentDistance);
          const nextLvl = this.levelManager.getLevel(currentLvl.level + 1);
          this.checkpointGate.spawn(nextLvl, -distToGate);
        }
      }

      this.checkpointGate.update(distanceDelta, effectiveDt, (clearedConfig) => {
        // Subtle kinetic feedback when passing through holographic portal ring
        const craftPos = this.player.getWorldPosition();
        this.particleSystem.emit(craftPos, 45);
        this.worldManager.triggerImpactShake(0.4);
      });

      // Check if player crossed a sector checkpoint boundary
      const checkpointEvent = this.levelManager.checkCheckpointCrossed(this.prevDistance, currentDistance);
      if (checkpointEvent) {
        const { clearedLevel, nextLevel, checkpointDistance } = checkpointEvent;
        // 1. Checkpoint fanfare sound
        this.audioManager.playCheckpoint();
        // 2. Unlock level in save storage & cloud
        this.saveManager.unlockLevel(nextLevel.level, checkpointDistance);
        // 3. Platform celebration
        this.platformAdapter.happyTime();
        // 4. Boost score multiplier to 5x for sector clear
        this.scoreManager.setMultiplier(5);
        // 5. Trigger HUD level clear banner
        this.uiManager.triggerLevelClear(clearedLevel, nextLevel);
        // 6. Seamlessly transition tunnel palette to next sector
        this.worldManager.tunnel.setTheme(nextLevel.themeIndex);
        // 7. Time dilation and slipstream burst
        this.timeDilationTimer = 0.28;
        this.worldManager.triggerSlipstreamSurge();
        // 8. Clear runway around the gate to prevent unfair immediate obstacle collision
        this.spawnManager.nextSpawnDistance = Math.max(this.spawnManager.nextSpawnDistance, 55.0);
        for (const obs of this.spawnManager.getActiveObstacles()) {
          if (obs.z < 0 && obs.z > -28.0) {
            obs.recycle();
          }
        }
      }
      this.prevDistance = currentDistance;

      // Update collectible crystals
      const worldRoll = this.playerController.getWorldRoll();
      this.collectibleManager.update(distanceDelta, dt, worldRoll, 0.0);

      // Milestone & Tier check
      if (tier > this.previousTier) {
        this.previousTier = tier;
        this.uiManager.triggerMilestone(`TIER ${tier} UNLOCKED`, 'VELOCITY BOOST ACTIVE');
        this.audioManager.playNearMiss();
      }

      if (currentDistance >= this.nextMilestone) {
        this.uiManager.triggerMilestone(`${this.nextMilestone}m SURVIVED`, 'NEW DISTANCE MILESTONE');
        if (this.nextMilestone >= 5000) {
          this.platformAdapter.happyTime();
        }
        this.nextMilestone += 2000;
      }

      // Update obstacles & spawning
      this.spawnManager.update(speed, dt, currentDistance, this.difficultyManager);

      // Check collision using active worldRoll and invincibility status during flip
      const isInvincible = this.playerController.isInvincible();
      this.collisionSystem.checkCollisions(worldRoll, this.spawnManager.getActiveObstacles(), isInvincible);

      // Update HUD with distance, speed, flip readiness, multiplier, crystals, and level progression
      const currentLevel = this.levelManager.getCurrentLevel(currentDistance);
      const levelProgress = this.levelManager.getLevelProgress(currentDistance);
      this.uiManager.updateHUD(
        currentDistance,
        speed,
        this.playerController.isFlipReady(),
        this.playerController.getFlipCooldownRatio(),
        this.scoreManager.getMultiplier(),
        this.scoreManager.getMultiplierRatio(),
        this.scoreManager.getCrystals(),
        currentLevel,
        levelProgress
      );
    }
  }

  render(dt) {
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
  }
}
