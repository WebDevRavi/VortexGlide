/**
 * VORTEX GLIDE — SaveManager
 * Dual-tier persistence: local storage + CrazyGames SDK v3 Cloud Data synchronization
 */

const STORAGE_KEY = 'vortex_glide_save_data';

export const SHIP_SKINS = [
  { id: 'cyan', name: 'DELTA CYAN', cost: 0, hullColor: 0x050c18, edgeColor: 0x00f3ff, lightColor: 0x00f3ff, emissive: 0x02162b, desc: 'Factory Standard Interceptor' },
  { id: 'gold', name: 'SOLAR GOLD', cost: 60, hullColor: 0x1c1404, edgeColor: 0xffb700, lightColor: 0xffd000, emissive: 0x2b1c02, desc: 'Ion Plated Solar Chassis' },
  { id: 'violet', name: 'NEBULA VIOLET', cost: 150, hullColor: 0x14041a, edgeColor: 0xbd00ff, lightColor: 0xd946ef, emissive: 0x24022b, desc: 'Quantum Shift Singularity' },
  { id: 'emerald', name: 'CYBER EMERALD', cost: 300, hullColor: 0x031a0e, edgeColor: 0x00ff88, lightColor: 0x10b981, emissive: 0x022b16, desc: 'High-Flux Tachyon Core' },
  { id: 'crimson', name: 'CRIMSON PHANTOM', cost: 500, hullColor: 0x1c0408, edgeColor: 0xff0044, lightColor: 0xff1744, emissive: 0x2b020a, desc: 'Stealth Angular Interceptor' },
  { id: 'quantum', name: 'QUANTUM GHOST', cost: 800, hullColor: 0x141824, edgeColor: 0xe0e7ff, lightColor: 0xa5b4fc, emissive: 0x1e293b, desc: 'Chromatic Super-Conductor' }
];

const DEFAULT_SETTINGS = {
  bestDistance: 0.0,
  highestLevelUnlocked: 1,
  lastCheckpointDistance: 0.0,
  selectedStartLevel: 1,
  totalCrystals: 0,
  selectedSkin: 'cyan',
  unlockedSkins: ['cyan'],
  soundEnabled: true,
  musicEnabled: true,
  musicVolume: 80,
  sfxVolume: 80,
  reducedEffects: false,
  steeringSensitivity: 'normal', // 'normal' | 'fast'
  mobileControls: true,
  showFps: false
};

export class SaveManager {
  constructor(platformAdapter = null) {
    this.platformAdapter = platformAdapter;
    this.data = { ...DEFAULT_SETTINGS };
    this.isStorageAvailable = this._checkStorage();
    this.load();
  }

  setPlatformAdapter(adapter) {
    this.platformAdapter = adapter;
    this.syncCloud();
  }

  _checkStorage() {
    try {
      const testKey = '__vg_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  load() {
    if (!this.isStorageAvailable) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this._mergeData(parsed);
      }
    } catch (err) {
      console.warn('[SaveManager] Failed to load local data, using defaults:', err);
    }
  }

  async syncCloud() {
    if (!this.platformAdapter) return;

    try {
      // If CrazyGames SDK data module is available, fetch cloud data
      const cloudRaw = await this.platformAdapter.getItem(STORAGE_KEY);
      if (cloudRaw) {
        const parsed = typeof cloudRaw === 'string' ? JSON.parse(cloudRaw) : cloudRaw;
        this._mergeData(parsed);
        // Persist merged data locally
        if (this.isStorageAvailable) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        }
        console.log('[SaveManager] Cloud data synchronized successfully.');
      } else {
        // Upload initial local data to cloud
        await this.platformAdapter.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (err) {
      console.warn('[SaveManager] Cloud sync notice:', err);
    }
  }

  _mergeData(incoming) {
    if (typeof incoming !== 'object' || incoming === null) return;

    if (typeof incoming.bestDistance === 'number' && !isNaN(incoming.bestDistance)) {
      this.data.bestDistance = Math.max(this.data.bestDistance, incoming.bestDistance);
    }
    if (typeof incoming.highestLevelUnlocked === 'number' && !isNaN(incoming.highestLevelUnlocked)) {
      this.data.highestLevelUnlocked = Math.max(this.data.highestLevelUnlocked, incoming.highestLevelUnlocked);
    }
    if (typeof incoming.lastCheckpointDistance === 'number' && !isNaN(incoming.lastCheckpointDistance)) {
      this.data.lastCheckpointDistance = Math.max(this.data.lastCheckpointDistance, incoming.lastCheckpointDistance);
    }
    if (typeof incoming.selectedStartLevel === 'number' && !isNaN(incoming.selectedStartLevel)) {
      this.data.selectedStartLevel = Math.min(this.data.highestLevelUnlocked, Math.max(1, incoming.selectedStartLevel));
    }
    if (typeof incoming.soundEnabled === 'boolean') {
      this.data.soundEnabled = incoming.soundEnabled;
    }
    if (typeof incoming.musicEnabled === 'boolean') {
      this.data.musicEnabled = incoming.musicEnabled;
    }
    if (typeof incoming.musicVolume === 'number') {
      this.data.musicVolume = Math.max(0, Math.min(100, incoming.musicVolume));
    }
    if (typeof incoming.sfxVolume === 'number') {
      this.data.sfxVolume = Math.max(0, Math.min(100, incoming.sfxVolume));
    }
    if (typeof incoming.reducedEffects === 'boolean') {
      this.data.reducedEffects = incoming.reducedEffects;
    }
    if (incoming.steeringSensitivity === 'normal' || incoming.steeringSensitivity === 'fast') {
      this.data.steeringSensitivity = incoming.steeringSensitivity;
    }
    if (typeof incoming.mobileControls === 'boolean') {
      this.data.mobileControls = incoming.mobileControls;
    }
    if (typeof incoming.showFps === 'boolean') {
      this.data.showFps = incoming.showFps;
    }
    if (typeof incoming.totalCrystals === 'number' && !isNaN(incoming.totalCrystals)) {
      this.data.totalCrystals = Math.max(this.data.totalCrystals || 0, incoming.totalCrystals);
    }
    if (typeof incoming.selectedSkin === 'string') {
      this.data.selectedSkin = incoming.selectedSkin;
    }
    if (Array.isArray(incoming.unlockedSkins)) {
      const merged = new Set([...(this.data.unlockedSkins || ['cyan']), ...incoming.unlockedSkins]);
      this.data.unlockedSkins = Array.from(merged);
    }
  }

  save() {
    // 1. Local storage save
    if (this.isStorageAvailable) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.warn('[SaveManager] Failed to save local data:', err);
      }
    }

    // 2. CrazyGames cloud save
    if (this.platformAdapter) {
      this.platformAdapter.setItem(STORAGE_KEY, JSON.stringify(this.data)).catch(() => {});
    }
  }

  getBestDistance() {
    return this.data.bestDistance;
  }

  setBestDistance(distance) {
    if (distance > this.data.bestDistance) {
      this.data.bestDistance = parseFloat(distance.toFixed(1));
      this.save();
      return true; // Indicates new record
    }
    return false;
  }

  getHighestLevel() {
    return this.data.highestLevelUnlocked || 1;
  }

  getLastCheckpoint() {
    return this.data.lastCheckpointDistance || 0.0;
  }

  unlockLevel(levelNum, checkpointDistance) {
    let changed = false;
    if (levelNum > (this.data.highestLevelUnlocked || 1)) {
      this.data.highestLevelUnlocked = levelNum;
      changed = true;
    }
    if (checkpointDistance > (this.data.lastCheckpointDistance || 0)) {
      this.data.lastCheckpointDistance = checkpointDistance;
      changed = true;
    }
    if (changed) {
      this.save();
    }
    return changed;
  }

  getSelectedStartLevel() {
    return this.data.selectedStartLevel || 1;
  }

  setSelectedStartLevel(levelNum) {
    this.data.selectedStartLevel = Math.max(1, Math.min(this.getHighestLevel(), levelNum));
    this.save();
  }

  getSetting(key) {
    return this.data[key];
  }

  setSetting(key, value) {
    this.data[key] = value;
    this.save();
  }

  /* =========================================================================
     QUANTUM CRYSTAL WALLET & SHIP HANGAR SKINS
     ========================================================================= */

  getTotalCrystals() {
    return this.data.totalCrystals || 0;
  }

  addCrystals(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return this.getTotalCrystals();
    this.data.totalCrystals = (this.data.totalCrystals || 0) + Math.round(amount);
    this.save();
    return this.data.totalCrystals;
  }

  spendCrystals(amount) {
    if (this.getTotalCrystals() >= amount) {
      this.data.totalCrystals -= amount;
      this.save();
      return true;
    }
    return false;
  }

  getSelectedSkin() {
    return this.data.selectedSkin || 'cyan';
  }

  setSelectedSkin(skinId) {
    if (this.isSkinUnlocked(skinId)) {
      this.data.selectedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  getUnlockedSkins() {
    return Array.isArray(this.data.unlockedSkins) ? this.data.unlockedSkins : ['cyan'];
  }

  isSkinUnlocked(skinId) {
    if (skinId === 'cyan') return true;
    return this.getUnlockedSkins().includes(skinId);
  }

  unlockSkin(skinId) {
    const skin = SHIP_SKINS.find(s => s.id === skinId);
    if (!skin) return false;
    if (this.isSkinUnlocked(skinId)) return true;

    if (this.spendCrystals(skin.cost)) {
      const list = this.getUnlockedSkins();
      if (!list.includes(skinId)) {
        list.push(skinId);
        this.data.unlockedSkins = list;
        this.data.selectedSkin = skinId;
        this.save();
      }
      return true;
    }
    return false;
  }
}
