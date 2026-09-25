/**
 * VORTEX GLIDE — LevelManager
 * Manages continuous Level/Sector progression, checkpoint boundaries, and progression metrics
 */

export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: 'SECTOR 1: SOLAR RING',
    shortName: 'SECTOR 1',
    startDistance: 0,
    clearDistance: 1200,
    themeIndex: 0,
    accentColor: '#00f3ff'
  },
  {
    level: 2,
    name: 'SECTOR 2: ASTEROID BELT',
    shortName: 'SECTOR 2',
    startDistance: 1200,
    clearDistance: 3000,
    themeIndex: 1,
    accentColor: '#ff007b'
  },
  {
    level: 3,
    name: 'SECTOR 3: NEBULA STORM',
    shortName: 'SECTOR 3',
    startDistance: 3000,
    clearDistance: 6000,
    themeIndex: 2,
    accentColor: '#8b2be2'
  },
  {
    level: 4,
    name: 'SECTOR 4: QUANTUM VOID',
    shortName: 'SECTOR 4',
    startDistance: 6000,
    clearDistance: 10000,
    themeIndex: 3,
    accentColor: '#00ff88'
  },
  {
    level: 5,
    name: 'SECTOR 5: EVENT HORIZON',
    shortName: 'SECTOR 5',
    startDistance: 10000,
    clearDistance: 999999,
    themeIndex: 4,
    accentColor: '#ffe600'
  }
];

export class LevelManager {
  constructor() {
    this.levels = LEVEL_CONFIGS;
    this.clearedCheckpoints = new Set();
  }

  reset() {
    this.clearedCheckpoints.clear();
  }

  getAllLevels() {
    return this.levels;
  }

  getLevel(levelNum) {
    const found = this.levels.find(l => l.level === levelNum);
    return found || this.levels[0];
  }

  getCurrentLevel(distance) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (distance >= this.levels[i].startDistance) {
        return this.levels[i];
      }
    }
    return this.levels[0];
  }

  getNextCheckpoint(distance) {
    for (let i = 0; i < this.levels.length; i++) {
      if (distance < this.levels[i].clearDistance && this.levels[i].clearDistance < 900000) {
        return this.levels[i].clearDistance;
      }
    }
    return null;
  }

  getLevelProgress(distance) {
    const current = this.getCurrentLevel(distance);
    if (current.clearDistance >= 900000) {
      return {
        progressMeters: distance - current.startDistance,
        targetMeters: 1000,
        ratio: 1.0,
        isInfinite: true
      };
    }

    const span = current.clearDistance - current.startDistance;
    const progress = Math.max(0, distance - current.startDistance);
    const ratio = Math.min(1.0, progress / span);

    return {
      progressMeters: progress,
      targetMeters: span,
      ratio: ratio,
      isInfinite: false
    };
  }

  /**
   * Checks if distance crossed a checkpoint boundary during the last frame
   * @param {number} prevDist
   * @param {number} currDist
   * @returns {Object|null} Cleared level config if checkpoint boundary was crossed
   */
  checkCheckpointCrossed(prevDist, currDist) {
    for (let i = 0; i < this.levels.length; i++) {
      const clearDist = this.levels[i].clearDistance;
      if (clearDist < 900000 && prevDist < clearDist && currDist >= clearDist) {
        if (!this.clearedCheckpoints.has(clearDist)) {
          this.clearedCheckpoints.add(clearDist);
          const nextLevel = this.getLevel(this.levels[i].level + 1);
          return {
            clearedLevel: this.levels[i],
            nextLevel: nextLevel,
            checkpointDistance: clearDist
          };
        }
      }
    }
    return null;
  }
}
