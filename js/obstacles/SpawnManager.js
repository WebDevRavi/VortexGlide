/**
 * VORTEX GLIDE — SpawnManager
 * Manages face-mounted obstacle pool, distance-based spawning, and recycling
 */

import * as THREE from '../vendor/three.module.js';
import { ObstacleFactory } from './ObstacleFactory.js';
import { PatternGenerator } from './PatternGenerator.js';

export class SpawnManager {
  constructor(parentGroup, tunnelRadius = 4.8) {
    this.parentGroup = parentGroup;
    this.tunnelRadius = tunnelRadius;

    this.factory = new ObstacleFactory(tunnelRadius, 8);
    this.patternGen = new PatternGenerator(Date.now(), 8);

    this.group = new THREE.Group();
    this.parentGroup.add(this.group);

    this.activeObstacles = [];
    this.pool = [];
    this.spawnDistanceAccumulator = 0;
    this.spawnZ = -140.0; // Visible approach distance calibrated for 36-88 m/s
    this.recycleZ = 10.0;
    this.onWaveSpawned = null;

    this._prewarmPool();
  }

  _prewarmPool() {
    // Pre-create 12 reusable obstacle waves
    for (let i = 0; i < 12; i++) {
      const obs = this.factory.createObstacleWave('gap', { blockedFaces: [1, 2, 3, 4, 5] });
      obs.group.visible = false;
      this.group.add(obs.group);
      this.pool.push(obs);
    }
  }

  reset(seed = Date.now()) {
    this.patternGen.setSeed(seed);
    this.patternGen.reset();

    for (let i = 0; i < this.activeObstacles.length; i++) {
      const obs = this.activeObstacles[i];
      obs.recycle();
      this.pool.push(obs);
    }
    this.activeObstacles = [];
    this.spawnDistanceAccumulator = 0;
    this.nextSpawnDistance = 56.0; // Clear runway at run start (~1.55s before wave 1 at 36 m/s)
  }

  update(speed, dt, distance, difficulty) {
    const moveDist = speed * dt;

    // 1. Move active obstacles toward player
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      obs.update(moveDist, dt);

      if (obs.z > this.recycleZ) {
        obs.recycle();
        this.activeObstacles.splice(i, 1);
        this.pool.push(obs);
      }
    }

    // 2. Spawn next obstacle
    this.spawnDistanceAccumulator += moveDist;
    const spacing = difficulty.getSpacing();

    if (this.spawnDistanceAccumulator >= this.nextSpawnDistance) {
      this.spawnDistanceAccumulator = 0;
      this.nextSpawnDistance = spacing;

      this._spawnWave(difficulty, speed, spacing);
    }
  }

  _spawnWave(difficulty, speed, spacing) {
    const tier = difficulty.getTier();
    const config = this.patternGen.nextWave(tier, speed, spacing);

    // Get an obstacle from pool or create new
    let obs = this.pool.pop();
    if (!obs) {
      obs = this.factory.createObstacleWave(config.type, config);
      this.group.add(obs.group);
    } else {
      // Re-configure children meshes if blockedFaces changed
      this._reconfigureObstacle(obs, config);
    }

    obs.reset(this.spawnZ, config);
    this.activeObstacles.push(obs);

    if (this.onWaveSpawned) {
      this.onWaveSpawned(config, this.spawnZ);
    }
  }

  _reconfigureObstacle(obs, config) {
    obs.blockedFaces = config.blockedFaces || [];
    obs.rotationSpeed = config.rotationSpeed || 0;
    obs.applyBlockedFaces();
  }

  getActiveObstacles() {
    return this.activeObstacles;
  }
}
