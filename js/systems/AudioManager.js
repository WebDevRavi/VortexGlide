/**
 * VORTEX GLIDE — AudioManager
 * Spec Section 58-59, 98: Dual-engine audio architecture
 * - Kenney CC0 Audio Assets (click, hover, switch, countdown, crash, whoosh, ambient)
 * - Procedural Web Audio API synth backup & continuous engine tone
 * - Robust browser autoplay unlock & graceful error tolerance
 */

export class AudioManager {
  constructor(saveManager) {
    this.saveManager = saveManager;
    this.ctx = null;
    this.isUnlocked = false;
    
    // Master Gain nodes
    this.sfxGain = null;
    this.musicGain = null;
    
    // Engine sound loop nodes
    this.engineOsc = null;
    this.engineGain = null;
    
    // Ambient background track
    this.ambientAudio = null;

    // Preloaded audio buffers
    this.buffers = new Map();
    this.audioSources = {
      click: 'assets/audio/click.wav',
      hover: 'assets/audio/hover.wav',
      switch: 'assets/audio/switch.wav',
      countdown: 'assets/audio/countdown.wav',
      crash: 'assets/audio/crash.wav',
      whoosh: 'assets/audio/whoosh.wav',
      ambient: 'assets/audio/ambient.wav'
    };

    this.isPlatformMuted = false;

    this._setupUnlockListeners();
  }

  _setupUnlockListeners() {
    const unlock = () => {
      this._initContext();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    // Official CrazyGames iOS Safari recommendation:
    // Resume AudioContext on any touchend/click if interrupted by iOS backgrounding
    document.addEventListener('touchend', () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    });
    document.addEventListener('click', () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    });
  }

  setPlatformMuted(muted) {
    this.isPlatformMuted = !!muted;
    this.updateSfxVolume();
    this.updateMusicVolume();
    if (this.isPlatformMuted) {
      this.stopEngineSound();
    }
  }

  handleVisibilityChange(isVisible) {
    if (!isVisible) {
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
      if (this.ambientAudio && !this.ambientAudio.paused) {
        this.ambientAudio.pause();
      }
      this.stopEngineSound();
    } else {
      if (this.ctx && this.ctx.state === 'suspended' && !this.isPlatformMuted) {
        this.ctx.resume().catch(() => {});
      }
      if (this.ambientAudio && this.ambientAudio.paused && this.isMusicEffective()) {
        this.ambientAudio.play().catch(() => {});
      }
    }
  }

  isSoundEffective() {
    return !this.isPlatformMuted && this.isSoundEnabled();
  }

  isMusicEffective() {
    return !this.isPlatformMuted && this.isMusicEnabled();
  }

  _initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      
      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.updateSfxVolume();

      // Music / Ambience Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.updateMusicVolume();

      this.isUnlocked = true;

      // Start asynchronous preload of Kenney CC0 audio assets
      this._preloadAssets();

      // Start subtle futuristic engine synthesis
      this._initEngineSynth();

      // Start ambient music if enabled
      this._startAmbientTrack();
    } catch (err) {
      console.warn('[AudioManager] Web Audio not available, gameplay continues:', err);
    }
  }

  async _preloadAssets() {
    if (!this.ctx) return;

    for (const [name, path] of Object.entries(this.audioSources)) {
      if (name === 'ambient') continue; // Ambient handled via HTML5 Audio element for long loop
      try {
        const response = await fetch(path);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(name, decoded);
        }
      } catch {
        // Fallback procedural sounds will be used automatically
      }
    }
  }

  _initEngineSynth() {
    if (!this.ctx) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      
      // Futuristic low-frequency hum (55Hz saw with lowpass filter)
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc.start();
    } catch (err) {
      console.warn('[AudioManager] Engine synth init failed:', err);
    }
  }

  _startAmbientTrack() {
    try {
      this.ambientAudio = new Audio(this.audioSources.ambient);
      this.ambientAudio.loop = true;
      this.ambientAudio.volume = 0.35;
      
      if (this.isMusicEnabled()) {
        const playPromise = this.ambientAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked until further interaction
          });
        }
      }
    } catch {
      // Audio element fallback
    }
  }

  isSoundEnabled() {
    return this.saveManager ? this.saveManager.getSetting('soundEnabled') : true;
  }

  isMusicEnabled() {
    return this.saveManager ? this.saveManager.getSetting('musicEnabled') : true;
  }

  updateSfxVolume() {
    if (!this.sfxGain) return;
    const enabled = this.isSoundEffective();
    const vol = enabled ? ((this.saveManager.getSetting('sfxVolume') ?? 80) / 100) * 0.8 : 0.0;
    this.sfxGain.gain.setValueAtTime(vol, this.ctx ? this.ctx.currentTime : 0);
  }

  updateMusicVolume() {
    const enabled = this.isMusicEffective();
    const vol = enabled ? ((this.saveManager.getSetting('musicVolume') ?? 80) / 100) * 0.4 : 0.0;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    if (this.ambientAudio) {
      if (enabled) {
        this.ambientAudio.volume = Math.max(0, Math.min(1, vol));
        this.ambientAudio.play().catch(() => {});
      } else {
        this.ambientAudio.pause();
      }
    }
  }

  setEngineSpeed(normalizedSpeed) {
    if (!this.engineOsc || !this.engineGain || !this.ctx) return;
    if (!this.isSoundEffective()) {
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      return;
    }

    // Scale engine pitch from 55Hz to 130Hz and volume from 0.04 to 0.12
    const freq = 55 + normalizedSpeed * 75;
    const sfxPct = (this.saveManager.getSetting('sfxVolume') ?? 80) / 100;
    const vol = (0.03 + normalizedSpeed * 0.08) * sfxPct;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
  }

  stopEngineSound() {
    if (!this.engineGain || !this.ctx) return;
    this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
  }

  // PLAY AUDIO BUFFER WITH PROCEDURAL FALLBACK
  playSfx(name, fallbackFreq = 440, fallbackType = 'sine', duration = 0.1) {
    if (!this.isSoundEffective()) return;
    this._initContext();
    if (!this.ctx) return;

    // 1. Check if Kenney CC0 audio buffer is loaded
    if (this.buffers.has(name)) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.get(name);
        source.connect(this.sfxGain);
        source.start();
        return;
      } catch {
        // Fallback to synth below
      }
    }

    // 2. High-speed procedural Web Audio synth fallback
    this._playSynthTone(fallbackFreq, fallbackType, duration);
  }

  _playSynthTone(freq, type = 'sine', duration = 0.1) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Graceful silence
    }
  }

  playClick() {
    this.playSfx('click', 600, 'sine', 0.05);
  }

  playHover() {
    this.playSfx('hover', 440, 'triangle', 0.04);
  }

  playSwitch() {
    this.playSfx('switch', 520, 'square', 0.06);
  }

  playCountdown(isGo = false) {
    if (isGo) {
      this.playSfx('whoosh', 880, 'sine', 0.25);
    } else {
      this.playSfx('countdown', 440, 'sine', 0.12);
    }
  }

  playNearMiss(combo = 1) {
    if (!this.isSoundEffective()) return;
    this._initContext();
    if (!this.ctx) return;

    // If Kenney CC0 whoosh asset is loaded, play with dynamic Doppler pitch scaling
    if (this.buffers.has('whoosh')) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.get('whoosh');
        const pitch = 0.95 + Math.min(0.6, (combo - 1) * 0.14);
        source.playbackRate.setValueAtTime(pitch, this.ctx.currentTime);
        source.connect(this.sfxGain);
        source.start();
        return;
      } catch {
        // Fall through to synth
      }
    }

    // Procedural Doppler resonant pitch dive
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const baseFreq = 520 + Math.min(4, combo - 1) * 110;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.18);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200 + combo * 100, now);
      filter.Q.setValueAtTime(3.2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Graceful silence
    }
  }

  playRecordBreak() {
    if (!this.isSoundEffective()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Triumphant golden fanfare (A4, C#5, E5, A5 arpeggio with bell resonance)
      const freqs = [440.0, 554.37, 659.25, 880.0];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.32, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.6);
      });
    } catch {
      // Graceful fallback
    }
  }

  playPickup(combo = 1) {
    if (!this.isSoundEffective()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Musical pentatonic crystal arpeggio based on combo
      const baseFreq = 523.25; // C5
      const pentatonic = [1, 1.125, 1.25, 1.5, 1.667, 2.0];
      const noteIdx = Math.min(pentatonic.length - 1, Math.max(0, combo - 1));
      const freq = baseFreq * pentatonic[noteIdx];

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.24);
      osc2.stop(now + 0.24);
    } catch {
      // Graceful silence
    }
  }

  playFlip() {
    if (!this.isSoundEffective()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      // Resonant quantum warp pitch sweep
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.22);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.linearRampToValueAtTime(1600, now + 0.22);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Graceful fallback
    }
  }

  playCheckpoint() {
    if (!this.isSoundEffective()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Triumphant multi-voice chord (C5 - E5 - G5 - C6)
      const chordFreqs = [523.25, 659.25, 783.99, 1046.50];

      chordFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.05 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + 0.6);
      });
    } catch {
      // Graceful silence
    }
  }

  playCrash() {
    if (!this.isSoundEffective()) return;
    this._initContext();
    if (!this.ctx) return;

    if (this.buffers.has('crash')) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.get('crash');
        source.connect(this.sfxGain);
        source.start();
        return;
      } catch {
        // Procedural noise explosion
      }
    }

    // Procedural explosion noise
    try {
      const bufferSize = this.ctx.sampleRate * 0.5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start();
    } catch {
      // Graceful silence
    }
  }
}
