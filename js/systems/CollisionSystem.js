/**
 * VORTEX GLIDE — CollisionSystem
 * Deterministic collision & near-miss detection for tunnel-rolling model
 */

export class CollisionSystem {
  constructor() {
    this.isLocked = false;
    this.onCollision = null;
    this.onNearMiss = null;
    this.craftZ = 0.0;
  }

  reset() {
    this.isLocked = false;
  }

  /**
   * Evaluates collision between bottom-centered player craft and active obstacle waves
   * @param {number} worldRoll - Current world roll in radians
   * @param {Array<Obstacle>} obstacles
   * @param {boolean} isInvincible - Whether player craft is invulnerable (e.g. during 180° flip)
   */
  checkCollisions(worldRoll, obstacles, isInvincible = false) {
    if (this.isLocked || !obstacles || isInvincible) return;

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      if (!obstacle.isActive) continue;

      // Robust Continuous Collision Detection (CCD)
      // Checks both instantaneous overlap and frame-to-frame sweep across craft Z plane (0.0)
      const obstacleHalfDepth = obstacle.depth * 0.5;
      const zDiff = Math.abs(obstacle.z - this.craftZ);
      const isInstantOverlap = zDiff <= (obstacleHalfDepth + 0.65);
      const prevZ = obstacle.prevZ !== undefined ? obstacle.prevZ : obstacle.z;
      const isSweptCross = (prevZ <= (this.craftZ + 0.8) && obstacle.z >= (this.craftZ - 0.8));

      if (isInstantOverlap || isSweptCross) {
        const hitResult = obstacle.checkHit(worldRoll, 0.16);

        if (hitResult.hit) {
          this.isLocked = true;
          if (this.onCollision) {
            this.onCollision(obstacle, hitResult);
          }
          return;
        } else if (hitResult.nearMiss && !obstacle.hasTriggeredNearMiss) {
          obstacle.hasTriggeredNearMiss = true;
          if (this.onNearMiss) {
            this.onNearMiss(obstacle);
          }
        }
      }
    }
  }
}
