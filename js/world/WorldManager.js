/**
 * VORTEX GLIDE — WorldManager
 * Tunnel-Rolling World Coordinator: Camera fixed behind craft, worldGroup rolls around Z-axis
 */

import * as THREE from '../vendor/three.module.js';
import { Tunnel } from './Tunnel.js';

export class WorldManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // World group contains Tunnel and Obstacles; rolls as player steers
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.tunnel = new Tunnel(this.worldGroup, 7, 22.0, 4.8);
    this._initSpeedStreaks();

    // Camera rigidly fixed directly behind player craft
    this.baseCameraPos = new THREE.Vector3(0, -2.15, 3.6);
    this.baseLookAt = new THREE.Vector3(0, -2.8, -25);

    this.shakeIntensity = 0;
    this.shakeDecay = 4.5;
    this.cameraTilt = 0;
    this.fovKick = 0;
    this.streakSurge = 0;
  }

  _initSpeedStreaks() {
    // Drastically reduced count (from 200 down to 35) to eliminate visual annoyance
    const streakCount = 35;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(streakCount * 3);
    const radius = this.tunnel.getRadius() * 0.92;

    for (let i = 0; i < streakCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      // Position strictly near tunnel perimeter walls, leaving center corridor clear of clutter
      const r = radius * 0.74 + Math.random() * radius * 0.22;
      positions[i * 3] = Math.sin(theta) * r;
      positions[i * 3 + 1] = Math.cos(theta) * r;
      positions[i * 3 + 2] = -Math.random() * 90;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.streakMaterial = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.08,          // Delicate, tiny stardust specks instead of large blinding dots
      transparent: true,
      opacity: 0.22,       // Soft, ambient transparency (down from 0.75)
      blending: THREE.AdditiveBlending
    });

    this.streaks = new THREE.Points(geometry, this.streakMaterial);
    this.scene.add(this.streaks);
  }

  reset(themeIndex = 0) {
    this.tunnel.reset(themeIndex);
    this.worldGroup.rotation.set(0, 0, 0);
    this.shakeIntensity = 0;
    this.cameraTilt = 0;
    this.fovKick = 0;
    this.streakSurge = 0;
    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.baseLookAt);
  }

  triggerImpactShake(intensity = 1.2) {
    this.shakeIntensity = intensity;
  }

  triggerSlipstreamSurge() {
    this.fovKick = 3.6;     // Instant kinetic FOV kick
    this.streakSurge = 1.0;  // Streak burst duration multiplier
  }

  setWorldRoll(worldRoll, bankRatio = 0) {
    // 1. Roll the entire tunnel and obstacle world around the Z axis
    // Steering right (positive roll) rotates world clockwise (-z) so right faces slide under craft
    this.worldGroup.rotation.z = -worldRoll;

    // 2. Kinetic camera Dutch angle tilt
    this.targetCameraTilt = -bankRatio * 0.16;
  }

  update(speed, dt, currentTier = 1, normalizedSpeed = 0) {
    // 1. Scroll tunnel forward towards player
    this.tunnel.update(speed, dt, currentTier);

    // 2. Slipstream surge decay
    if (this.streakSurge > 0) {
      this.streakSurge = Math.max(0, this.streakSurge - dt * 2.2);
    }
    if (this.fovKick > 0.01) {
      this.fovKick += (0 - this.fovKick) * Math.min(1.0, 7.0 * dt);
    } else {
      this.fovKick = 0;
    }

    // 3. Animate subtle perimeter speed streaks with surge boost
    const positions = this.streaks.geometry.attributes.position.array;
    const surgeBoost = 1.0 + this.streakSurge * 0.65;
    const streakSpeed = speed * 0.85 * surgeBoost;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 2] += streakSpeed * dt;
      if (positions[i * 3 + 2] > 6.0) {
        positions[i * 3 + 2] = -90 - Math.random() * 20;
      }
    }
    this.streaks.geometry.attributes.position.needsUpdate = true;

    // Adjust streak opacity during surge
    if (this.streakMaterial) {
      const targetOpacity = 0.22 + this.streakSurge * 0.35;
      this.streakMaterial.opacity = targetOpacity;
    }

    // 4. Smooth Camera Tilt Spring
    if (this.targetCameraTilt !== undefined) {
      this.cameraTilt += (this.targetCameraTilt - this.cameraTilt) * Math.min(1.0, 14.0 * dt);
    }

    // 5. Apply Camera Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0.001) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    this.camera.position.set(
      this.baseCameraPos.x + shakeX,
      this.baseCameraPos.y + shakeY,
      this.baseCameraPos.z
    );
    this.camera.lookAt(
      this.baseLookAt.x + shakeX * 0.5,
      this.baseLookAt.y + shakeY * 0.5,
      this.baseLookAt.z
    );
    this.camera.rotation.z = this.cameraTilt;

    // 6. Dynamic Camera FOV expansion with speed (64 to 75 degrees) + slipstream kick
    const baseTargetFov = 64 + Math.min(1.0, Math.max(0, normalizedSpeed)) * 11;
    const targetFov = baseTargetFov + this.fovKick;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 5.5);
    this.camera.updateProjectionMatrix();
  }
}
