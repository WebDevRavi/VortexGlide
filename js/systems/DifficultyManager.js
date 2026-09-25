/**
 * VORTEX GLIDE — DifficultyManager
 * Spec Section 20, 23: Smooth logarithmic/exponential speed & obstacle parameter scaling
 */

export class DifficultyManager {
  constructor() {
    this.baseSpeed = 38.0;       // Accessible launch speed (m/s)
    this.maxSpeed = 98.0;        // Hypersonic thrill ceiling (m/s)
    this.growthRate = 4500.0;    // Meters to reach ~63% speed delta (smooth, continuous acceleration)
    
    this.currentSpeed = this.baseSpeed;
    this.currentTier = 1;        // 1 to 5
    this.obstacleSpacing = 48.0; // Distance between obstacle spawns in world units
    this.gapMultiplier = 1.0;    // Multiplier on safe gap width
  }

  reset(startingDistance = 0.0) {
    this.currentSpeed = this.baseSpeed;
    this.currentTier = 1;
    this.obstacleSpacing = 48.0;
    this.gapMultiplier = 1.0;
    if (startingDistance > 0) {
      this.update(startingDistance);
    }
  }

  update(distance) {
    // Engaging asymptotic speed curve: accelerates smoothly over distance
    const progress = 1.0 - Math.exp(-distance / this.growthRate);
    this.currentSpeed = this.baseSpeed + (this.maxSpeed - this.baseSpeed) * progress;

    // Obstacle spacing scales with speed to preserve ~1.55s down to 0.95s fair human reaction time
    const targetReactionTime = Math.max(0.95, 1.55 - progress * 0.45);
    this.obstacleSpacing = Math.max(42.0, this.currentSpeed * targetReactionTime);

    // Determine obstacle tier based on new sector distances
    if (distance < 1200) {
      this.currentTier = 1; // Basic horizontal/vertical blocks with wide gaps (135°)
      this.gapMultiplier = 1.0;
    } else if (distance < 3000) {
      this.currentTier = 2; // Alternating gates & diagonal wedges
      this.gapMultiplier = 0.90;
    } else if (distance < 6000) {
      this.currentTier = 3; // Segmented multi-hazard gates
      this.gapMultiplier = 0.82;
    } else if (distance < 10000) {
      this.currentTier = 4; // Slow rotating gates
      this.gapMultiplier = 0.75;
    } else {
      this.currentTier = 5; // Rapid rotating & shifting gates
      this.gapMultiplier = 0.68;
    }
  }

  getSpeed() {
    return this.currentSpeed;
  }

  getNormalizedSpeed() {
    return (this.currentSpeed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
  }

  getTier() {
    return this.currentTier;
  }

  getSpacing() {
    return this.obstacleSpacing;
  }

  getGapMultiplier() {
    return this.gapMultiplier;
  }
}
