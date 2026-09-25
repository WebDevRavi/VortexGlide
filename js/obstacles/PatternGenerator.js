/**
 * VORTEX GLIDE — PatternGenerator
 * Generates fair, reachable face-based obstacle waves with seeded PRNG
 */

export class PatternGenerator {
  constructor(seed = Date.now(), sides = 8) {
    this.seed = seed;
    this._prngState = seed;
    this.sides = sides;
    this.lastOpenFace = 0; // Starts at bottom face 0
    this.waveCount = 0;
  }

  setSeed(seed) {
    this.seed = seed;
    this._prngState = seed;
    this.lastOpenFace = 0;
    this.waveCount = 0;
  }

  random() {
    let t = (this._prngState += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  reset() {
    this.lastOpenFace = 0;
    this.waveCount = 0;
  }

  /**
   * Generates a fair obstacle wave definition
   * @param {number} tier - 1 to 5
   * @param {number} currentSpeed - m/s
   * @param {number} spacing - meters to next spawn
   */
  nextWave(tier, currentSpeed = 50.0, spacing = 36.0) {
    this.waveCount++;
    const travelTime = spacing / Math.max(30.0, currentSpeed);
    const rollSpeed = 3.6; // rad/s
    const maxRollReachRad = rollSpeed * Math.max(0.18, travelTime - 0.18);
    const faceAngleStep = (Math.PI * 2) / this.sides;
    const maxFaceStep = Math.max(1, Math.floor(maxRollReachRad / faceAngleStep));

    const roll = this.random();
    let openFaces = [];
    let rotationSpeed = 0;

    if (this.waveCount === 1) {
      // Wave 1: Gentle initial hazard requiring 1-face steer or Spacebar 180° flip
      // Face 0 is blocked, while adjacent faces [1, 2, 3] or [5, 6, 7] are wide open
      const goRight = this.random() < 0.5;
      this.lastOpenFace = goRight ? 2 : 6;
      openFaces = goRight ? [1, 2, 3] : [5, 6, 7];
    } else if (this.waveCount === 2) {
      // Wave 2: 3 adjacent open faces within easy reach of lastOpenFace
      const step = (this.random() < 0.5 ? 1 : -1);
      const targetFace = ((this.lastOpenFace + step) % this.sides + this.sides) % this.sides;
      this.lastOpenFace = targetFace;
      const prev = (targetFace - 1 + this.sides) % this.sides;
      const next = (targetFace + 1) % this.sides;
      openFaces = [prev, targetFace, next];
    } else if (tier === 1) {
      // Tier 1: 3 adjacent open faces (generous 135° gap, fair reachable transition)
      const step = (this.random() < 0.5 ? 1 : -1) * Math.min(maxFaceStep, 2);
      const targetFace = ((this.lastOpenFace + step) % this.sides + this.sides) % this.sides;
      this.lastOpenFace = targetFace;

      const prev = (targetFace - 1 + this.sides) % this.sides;
      const next = (targetFace + 1) % this.sides;
      openFaces = [prev, targetFace, next];

    } else if (tier === 2) {
      // Tier 2: 2 to 3 adjacent open faces (standard fair gap)
      const step = (this.random() < 0.5 ? 1 : -1) * Math.min(maxFaceStep, 2);
      const targetFace = ((this.lastOpenFace + step) % this.sides + this.sides) % this.sides;
      this.lastOpenFace = targetFace;

      const neighbor = (targetFace + 1) % this.sides;
      const neighbor2 = (targetFace - 1 + this.sides) % this.sides;
      openFaces = this.random() < 0.35 ? [neighbor2, targetFace, neighbor] : [targetFace, neighbor];
    } else if (tier === 3) {
      // Tier 3: Alternating left/right gates or center block
      if (roll < 0.4) {
        // Center block: Faces 0 & 4 blocked, others open
        openFaces = [1, 2, 3, 5, 6, 7];
        this.lastOpenFace = this.random() < 0.5 ? 1 : 7;
      } else {
        // 2 open faces
        const step = (this.random() < 0.5 ? 2 : -2);
        const targetFace = ((this.lastOpenFace + step) % this.sides + this.sides) % this.sides;
        this.lastOpenFace = targetFace;
        openFaces = [targetFace, (targetFace + 1) % this.sides];
      }

    } else if (tier === 4) {
      // Tier 4: Rotating 2-blade hazard gate or 1 open face
      if (roll < 0.45) {
        // Rotating propeller
        rotationSpeed = (roll < 0.22 ? 1 : -1) * 0.95;
        // Blocks faces [0, 4] continuously rotating
        const blocked = [0, 4];
        return {
          type: 'rotating',
          blockedFaces: blocked,
          rotationSpeed: rotationSpeed,
          openFaces: [1, 2, 3, 5, 6, 7]
        };
      } else {
        // 1 open face
        const step = (this.random() < 0.5 ? 1 : -1) * Math.min(maxFaceStep, 2);
        const targetFace = ((this.lastOpenFace + step) % this.sides + this.sides) % this.sides;
        this.lastOpenFace = targetFace;
        openFaces = [targetFace];
      }

    } else {
      // Tier 5: Faster rotating blades or tight alternating single gates
      if (roll < 0.5) {
        rotationSpeed = (roll < 0.25 ? 1 : -1) * 1.35;
        return {
          type: 'rotating',
          blockedFaces: [0, 2, 4, 6],
          rotationSpeed: rotationSpeed,
          openFaces: [1, 3, 5, 7]
        };
      } else {
        const step = (this.random() < 0.5 ? 2 : -2);
        const targetFace = ((this.lastOpenFace + step) % this.sides + this.sides) % this.sides;
        this.lastOpenFace = targetFace;
        openFaces = [targetFace];
      }
    }

    // Invert openFaces to blockedFaces
    const blockedFaces = [];
    for (let f = 0; f < this.sides; f++) {
      if (!openFaces.includes(f)) {
        blockedFaces.push(f);
      }
    }

    return {
      type: 'gap',
      blockedFaces: blockedFaces,
      rotationSpeed: rotationSpeed,
      openFaces: openFaces
    };
  }
}
