/**
 * VORTEX GLIDE — CollectibleManager
 * Spawns and manages glowing Quantum Energy Crystals placed inside safe gap corridors.
 * Guides player toward open paths and builds score multipliers.
 */

import * as THREE from '../vendor/three.module.js';

export class CollectibleManager {
  constructor(parentGroup, tunnelRadius = 4.8, sides = 8) {
    this.parentGroup = parentGroup;
    this.tunnelRadius = tunnelRadius;
    this.sides = sides;
    this.faceAngleStep = (Math.PI * 2) / this.sides;

    this.group = new THREE.Group();
    this.parentGroup.add(this.group);

    this.activeCrystals = [];
    this.pool = [];
    this.onCollected = null;

    this._initMaterials();
    this._prewarmPool(16);
  }

  _initMaterials() {
    // Glowing Quantum Cyan Crystal
    this.crystalMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.95,
      roughness: 0.12,
      metalness: 0.85,
      flatShading: true
    });

    this.edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2.0
    });
  }

  _createCrystalMesh() {
    const group = new THREE.Group();

    // Diamond Octahedron
    const geo = new THREE.OctahedronGeometry(0.32, 0);
    geo.scale(0.8, 1.3, 0.8);

    const mesh = new THREE.Mesh(geo, this.crystalMaterial);
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geo);
    const lines = new THREE.LineSegments(edges, this.edgeMaterial);
    group.add(lines);

    const light = new THREE.PointLight(0x00f3ff, 1.4, 2.5);
    group.add(light);

    return {
      group,
      mesh,
      lines,
      light,
      z: 0,
      faceAngle: 0,
      faceIndex: 0,
      isActive: false
    };
  }

  _prewarmPool(count = 16) {
    for (let i = 0; i < count; i++) {
      const crystal = this._createCrystalMesh();
      crystal.group.visible = false;
      this.group.add(crystal.group);
      this.pool.push(crystal);
    }
  }

  reset() {
    for (let i = 0; i < this.activeCrystals.length; i++) {
      const c = this.activeCrystals[i];
      c.isActive = false;
      c.group.visible = false;
      this.pool.push(c);
    }
    this.activeCrystals = [];
  }

  /**
   * Spawns a crystal in one of the open gap faces
   * @param {Array<number>} openFaces
   * @param {number} spawnZ
   */
  spawnInGap(openFaces, spawnZ) {
    if (!openFaces || openFaces.length === 0) return;

    // Pick a safe open face (preferably middle of gap)
    const targetFace = openFaces[Math.floor(openFaces.length / 2)];
    let crystal = this.pool.pop();
    if (!crystal) {
      crystal = this._createCrystalMesh();
      this.group.add(crystal.group);
    }

    const faceAngle = targetFace * this.faceAngleStep;
    // Radius slightly inward from tunnel face
    const rFace = this.tunnelRadius * Math.cos(this.faceAngleStep * 0.5) - 0.75;
    const x = Math.sin(faceAngle) * rFace;
    const y = -Math.cos(faceAngle) * rFace;

    crystal.group.position.set(x, y, spawnZ);
    crystal.group.rotation.z = -faceAngle;
    crystal.group.visible = true;

    crystal.z = spawnZ;
    crystal.prevZ = spawnZ;
    crystal.faceAngle = faceAngle;
    crystal.faceIndex = targetFace;
    crystal.isActive = true;

    this.activeCrystals.push(crystal);
  }

  update(moveDist, dt, worldRoll, craftZ = 0.0) {
    const halfFace = this.faceAngleStep * 0.5;

    for (let i = this.activeCrystals.length - 1; i >= 0; i--) {
      const c = this.activeCrystals[i];
      if (!c.isActive) continue;

      c.prevZ = c.z;
      c.z += moveDist;
      c.group.position.z = c.z;

      // Tumbling rotation animation
      c.mesh.rotation.y += dt * 3.2;
      c.mesh.rotation.x += dt * 1.6;

      // Check collision with player craft at bottom using continuous swept detection
      const isInstantOverlap = Math.abs(c.z - craftZ) <= 0.95;
      const isSweptCross = (c.prevZ <= (craftZ + 0.95) && c.z >= (craftZ - 0.95));

      if (isInstantOverlap || isSweptCross) {
        // Player is at bottom (relative angle on tunnel is -worldRoll)
        let relAngle = -worldRoll;
        relAngle = ((relAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

        let diff = Math.abs(relAngle - c.faceAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff < (halfFace + 0.14)) {
          // Collected!
          c.isActive = false;
          c.group.visible = false;
          this.activeCrystals.splice(i, 1);
          this.pool.push(c);

          if (this.onCollected) {
            this.onCollected(c);
          }
          continue;
        }
      }

      // Recycle when passed
      if (c.z > 10.0) {
        c.isActive = false;
        c.group.visible = false;
        this.activeCrystals.splice(i, 1);
        this.pool.push(c);
      }
    }
  }
}
