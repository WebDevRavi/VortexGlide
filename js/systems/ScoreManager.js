/**
 * VORTEX GLIDE — ScoreManager
 * Spec Section 21-22: Distance accumulation, high score persistence & records
 */

export class ScoreManager {
  constructor(saveManager) {
    this.saveManager = saveManager;
    this.currentDistance = 0.0;
    this.totalScore = 0;
    this.crystals = 0;
    this.multiplier = 1;
    this.multiplierTimer = 0.0;
    this.maxMultiplier = 5;
    this.multiplierDuration = 4.2; // Seconds before multiplier decays by 1 level

    this.bestDistance = this.saveManager.getBestDistance();
    this.initialBestDistance = this.bestDistance;
    this.hasCelebratedRecordBreach = false;
    this.isNewBest = false;
    this.nearMissCombo = 0;
    this.nearMissComboTimer = 0.0;
  }

  reset(startingDistance = 0.0) {
    this.currentDistance = startingDistance;
    this.totalScore = Math.round(startingDistance);
    this.crystals = 0;
    this.multiplier = 1;
    this.multiplierTimer = 0.0;
    this.bestDistance = this.saveManager.getBestDistance();
    this.initialBestDistance = this.bestDistance;
    this.hasCelebratedRecordBreach = false;
    this.isNewBest = false;
    this.nearMissCombo = 0;
    this.nearMissComboTimer = 0.0;
  }

  setMultiplier(val) {
    this.multiplier = Math.min(this.maxMultiplier, Math.max(1, val));
    this.multiplierTimer = this.multiplierDuration;
  }

  update(distanceDelta, dt = 0.016) {
    this.currentDistance += distanceDelta;
    this.totalScore += Math.round(distanceDelta * this.multiplier);

    // Multiplier decay timer
    if (this.multiplier > 1) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) {
        this.multiplier = Math.max(1, this.multiplier - 1);
        this.multiplierTimer = this.multiplier > 1 ? this.multiplierDuration : 0;
      }
    }

    // Slipstream combo timer
    if (this.nearMissComboTimer > 0) {
      this.nearMissComboTimer -= dt;
      if (this.nearMissComboTimer <= 0) {
        this.nearMissCombo = 0;
      }
    }

    if (this.currentDistance > this.bestDistance) {
      this.bestDistance = this.currentDistance;
      this.isNewBest = true;
    }
  }

  checkRecordBreach() {
    if (!this.hasCelebratedRecordBreach && this.initialBestDistance > 80 && this.currentDistance >= this.initialBestDistance) {
      this.hasCelebratedRecordBreach = true;
      return true;
    }
    return false;
  }

  addCrystal() {
    this.crystals++;
    this.totalScore += 50 * this.multiplier;
    if (this.multiplier < this.maxMultiplier) {
      this.multiplier++;
    }
    this.multiplierTimer = this.multiplierDuration;
    return this.multiplier;
  }

  addNearMiss() {
    this.currentDistance += 15.0; // Bonus meters
    this.totalScore += 100 * this.multiplier;
    if (this.multiplier < this.maxMultiplier) {
      this.multiplier = Math.min(this.maxMultiplier, this.multiplier + 1);
    }
    this.multiplierTimer = this.multiplierDuration;

    this.nearMissCombo = Math.min(5, this.nearMissCombo + 1);
    this.nearMissComboTimer = 3.8;
    return { multiplier: this.multiplier, combo: this.nearMissCombo };
  }

  finalizeRun() {
    const finalDist = parseFloat(this.currentDistance.toFixed(1));
    const isRecord = this.saveManager.setBestDistance(finalDist);
    if (isRecord) {
      this.isNewBest = true;
      this.bestDistance = finalDist;
    }
    // Bank collected crystals into persistent wallet
    if (this.crystals > 0) {
      this.saveManager.addCrystals(this.crystals);
    }
    return {
      distance: finalDist,
      score: this.totalScore,
      crystals: this.crystals,
      totalCrystals: this.saveManager.getTotalCrystals(),
      multiplier: this.multiplier,
      bestDistance: this.bestDistance,
      isNewBest: this.isNewBest
    };
  }

  getDistance() {
    return this.currentDistance;
  }

  getMultiplier() {
    return this.multiplier;
  }

  getMultiplierRatio() {
    return this.multiplier > 1 ? (this.multiplierTimer / this.multiplierDuration) : 0;
  }

  getCrystals() {
    return this.crystals;
  }

  getScore() {
    return this.totalScore;
  }

  getFormattedDistance() {
    return `${this.currentDistance.toFixed(1)} m`;
  }

  getFormattedBestDistance() {
    return `${this.bestDistance.toFixed(1)} m`;
  }
}
