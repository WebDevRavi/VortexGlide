/**
 * VORTEX GLIDE — ParticleSystem
 * Spec Section 46: Lightweight particle bursts for collisions and impacts
 */

import * as THREE from '../vendor/three.module.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 200;
    this.particles = [];
    for(let i=0; i<this.maxParticles; i++) {
        this.particles.push({
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            life: 0,
            decay: 0,
            active: false
        });
    }

    // Geometry/Material for simple glowing points
    this.geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(this.maxParticles * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xff0044,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
    this.points.visible = false;
  }

  emit(position, count = 20) {
    let emitted = 0;
    for (let i = 0; i < this.maxParticles && emitted < count; i++) {
        const p = this.particles[i];
        if (!p.active) {
            p.active = true;
            p.position.copy(position);
            p.velocity.set(
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5
            );
            p.life = 1.0;
            p.decay = 1.0 + Math.random() * 1.5;
            emitted++;
        }
    }
    this.points.visible = true;
  }

  update(dt) {
    let activeCount = 0;
    const positions = this.points.geometry.attributes.position.array;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
          positions[i*3] = positions[i*3+1] = positions[i*3+2] = 0;
          continue;
      }

      p.life -= p.decay * dt;

      if (p.life <= 0) {
        p.active = false;
        positions[i*3] = positions[i*3+1] = positions[i*3+2] = 0;
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);

      const idx = i * 3;
      positions[idx] = p.position.x;
      positions[idx + 1] = p.position.y;
      positions[idx + 2] = p.position.z;
      activeCount++;
    }

    this.points.visible = activeCount > 0;
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
