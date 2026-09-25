/**
 * VORTEX GLIDE — PlayerController
 * Tunnel-Rolling Model: Steering rotates the entire tunnel world while craft stays centered
 */

export class PlayerController {
  constructor(player, inputManager, saveManager) {
    this.player = player;
    this.inputManager = inputManager;
    this.saveManager = saveManager;

    // Angular roll velocity parameters (rad/s)
    this.baseRollSpeed = 3.6;
    this.fastRollSpeed = 4.6;
    
    this.worldRoll = 0.0;          // Accumulated world roll angle (radians)
    this.angularVelocity = 0.0;    // Current roll velocity
    this.currentBank = 0.0;        // Craft lean (-1 to 1)

    this.acceleration = 26.0;
    this.damping = 18.0;

    // 180° Inversion Flip Mechanics
    this.isFlipping = false;
    this.flipProgress = 0.0;
    this.flipDuration = 0.22;        // 220ms acrobatic transition
    this.flipStartRoll = 0.0;
    this.flipTargetRoll = 0.0;
    this.flipDirection = 1.0;
    this.flipCooldownTimer = 0.0;
    this.flipCooldownDuration = 0.65; // 650ms tactical cooldown
  }

  reset() {
    this.worldRoll = 0.0;
    this.angularVelocity = 0.0;
    this.currentBank = 0.0;
    this.isFlipping = false;
    this.flipProgress = 0.0;
    this.flipCooldownTimer = 0.0;
    this.player.reset();
  }

  /**
   * Triggers acrobatic 180-degree flip to opposite tunnel face
   * @returns {boolean} Whether flip successfully executed
   */
  triggerFlip() {
    if (this.isFlipping || this.flipCooldownTimer > 0) return false;

    this.isFlipping = true;
    this.flipProgress = 0.0;
    this.flipStartRoll = this.worldRoll;

    const steer = this.inputManager.getSteering();
    this.flipDirection = steer < 0 ? -1.0 : 1.0;
    this.flipTargetRoll = this.worldRoll + this.flipDirection * Math.PI;
    this.flipCooldownTimer = this.flipCooldownDuration;
    this.angularVelocity = 0.0;
    return true;
  }

  update(dt, normalizedSpeed = 0) {
    // 0. Update cooldown
    if (this.flipCooldownTimer > 0) {
      this.flipCooldownTimer = Math.max(0, this.flipCooldownTimer - dt);
    }

    // Handle 180° flip acrobatic state
    if (this.isFlipping) {
      this.flipProgress += dt / this.flipDuration;

      if (this.flipProgress >= 1.0) {
        this.flipProgress = 1.0;
        this.isFlipping = false;
        this.worldRoll = this.flipTargetRoll;

        while (this.worldRoll > Math.PI) this.worldRoll -= Math.PI * 2;
        while (this.worldRoll < -Math.PI) this.worldRoll += Math.PI * 2;

        this.player.setFlipAnimation(0.0);
      } else {
        // Smooth sinusoidal ease-in-out
        const ease = 0.5 - 0.5 * Math.cos(this.flipProgress * Math.PI);
        this.worldRoll = this.flipStartRoll + (this.flipTargetRoll - this.flipStartRoll) * ease;

        while (this.worldRoll > Math.PI) this.worldRoll -= Math.PI * 2;
        while (this.worldRoll < -Math.PI) this.worldRoll += Math.PI * 2;

        this.player.setFlipAnimation(this.flipProgress, this.flipDirection);
      }
      return;
    }

    // 1. Read input (-1 = Left, +1 = Right, 0 = Neutral)
    const steerInput = this.inputManager.getSteering();

    // Check sensitivity
    const isFast = this.saveManager.getSetting('steeringSensitivity') === 'fast';
    const targetSpeed = (isFast ? this.fastRollSpeed : this.baseRollSpeed) * steerInput;

    // 2. Smooth acceleration / damping
    if (steerInput !== 0) {
      this.angularVelocity += (targetSpeed - this.angularVelocity) * Math.min(1.0, this.acceleration * dt);
    } else {
      this.angularVelocity += (0.0 - this.angularVelocity) * Math.min(1.0, this.damping * dt);
    }

    // 3. Integrate World Roll (Left input rolls world positive/clockwise)
    this.worldRoll += this.angularVelocity * dt;

    // Keep angle normalized to [-PI, PI]
    while (this.worldRoll > Math.PI) this.worldRoll -= Math.PI * 2;
    while (this.worldRoll < -Math.PI) this.worldRoll += Math.PI * 2;

    // 4. Update Craft Banking Lean with dynamic speed scaling
    this.currentBank += (steerInput - this.currentBank) * Math.min(1.0, 16.0 * dt);
    this.player.setBanking(this.currentBank, normalizedSpeed);
  }

  isInvincible() {
    return this.isFlipping;
  }

  isFlipReady() {
    return !this.isFlipping && this.flipCooldownTimer <= 0;
  }

  getFlipCooldownRatio() {
    return this.flipCooldownTimer / this.flipCooldownDuration;
  }

  getWorldRoll() {
    return this.worldRoll;
  }

  getSteerAmount() {
    return this.currentBank;
  }
}
