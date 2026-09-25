/**
 * VORTEX GLIDE — Obstacle (Face-Mounted 3D Hazard Wave)
 * Matching png logo.png & Panel 2: 3D red neon hazard blocks mounted flush to tunnel faces
 */

import * as THREE from '../vendor/three.module.js';

export class Obstacle {
  constructor(id, type, config = {}) {
    this.id = id;
    this.type = type;
    this.config = config;

    this.z = 0;
    this.depth = 1.3;
    this.isActive = false;
    this.hasTriggeredNearMiss = false;

    this.group = new THREE.Group();

    // 8-face system: blockedFaces is an Array of face indices [0..7]
    this.blockedFaces = config.blockedFaces || [];
    this.rotationSpeed = config.rotationSpeed || 0;
    this.currentRotation = 0;

    this.faceAngleStep = (Math.PI * 2) / 8; // 45 degrees per face
    this.tumblers = [];
    this.faceBlocks = [];
    this.runwayMarkers = [];
  }

  applyBlockedFaces() {
    if (!this.faceBlocks || this.faceBlocks.length === 0) return;
    const blockedSet = new Set(this.blockedFaces);
    for (let i = 0; i < this.faceBlocks.length; i++) {
      const isBlocked = blockedSet.has(i);
      this.faceBlocks[i].visible = isBlocked;
      if (this.runwayMarkers && this.runwayMarkers[i]) {
        // Only show runway markers on static/gap gates for clear telegraphing
        this.runwayMarkers[i].visible = !isBlocked && (this.rotationSpeed === 0);
      }
    }
  }

  collectTumblers() {
    this.tumblers = [];
    this.group.traverse((child) => {
      if (child.userData && child.userData.tumblers) {
        this.tumblers.push(...child.userData.tumblers);
      }
    });
  }

  reset(z, config = {}) {
    this.z = z;
    this.prevZ = z;
    this.config = config;
    this.isActive = true;
    this.hasTriggeredNearMiss = false;
    this.blockedFaces = config.blockedFaces || [];
    this.rotationSpeed = config.rotationSpeed || 0;
    this.currentRotation = 0;

    this.group.position.z = this.z;
    this.group.rotation.z = 0;
    this.group.visible = true;
    this.applyBlockedFaces();
    this.collectTumblers();
  }

  update(moveDist, dt) {
    if (!this.isActive) return;

    this.prevZ = this.z;
    this.z += moveDist;
    this.group.position.z = this.z;

    if (this.rotationSpeed !== 0) {
      this.currentRotation += this.rotationSpeed * dt;
      this.group.rotation.z = this.currentRotation;
    }

    // Tumble floating asteroid rocks and space scrap in zero gravity
    if (this.tumblers.length > 0) {
      for (let i = 0; i < this.tumblers.length; i++) {
        const t = this.tumblers[i];
        t.mesh.rotation.x += t.rx * dt;
        t.mesh.rotation.y += t.ry * dt;
      }
    }
  }

  /**
   * Check if the player craft collides with any blocked face at the bottom
   * @param {number} worldRoll - Current roll angle of the tunnel in radians
   * @param {number} craftMargin - Player half-width margin in radians (~0.12)
   * @returns {{ hit: boolean, nearMiss: boolean }}
   */
  checkHit(worldRoll, craftMargin = 0.12) {
    if (!this.isActive) return { hit: false, nearMiss: false };

    // Player craft is fixed at bottom (angle 0).
    // The relative angle on the obstacle ring at the bottom is:
    let relAngle = worldRoll - this.currentRotation;

    // Normalize relAngle to [0, 2*PI)
    relAngle = ((relAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

    const halfFace = this.faceAngleStep * 0.5;
    const hitTolerance = halfFace - 0.04; // Inside block
    const nearMissDist = halfFace + 0.14; // Skim near edge

    let hit = false;
    let nearMiss = false;

    for (let i = 0; i < this.blockedFaces.length; i++) {
      const faceIdx = this.blockedFaces[i];
      const faceCenter = faceIdx * this.faceAngleStep;

      // Angular distance between relative bottom angle and face center
      let diff = Math.abs(relAngle - faceCenter);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;

      if (diff < (hitTolerance + craftMargin)) {
        hit = true;
        break;
      } else if (diff < (nearMissDist + craftMargin)) {
        nearMiss = true;
      }
    }

    return { hit, nearMiss: nearMiss && !hit };
  }

  recycle() {
    this.isActive = false;
    this.group.visible = false;
  }
}
