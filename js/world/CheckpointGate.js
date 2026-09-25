/**
 * VORTEX GLIDE — CheckpointGate
 * 3D Holographic Portal Gate that spawns across the tunnel diameter as player approaches a checkpoint.
 */

import * as THREE from '../vendor/three.module.js';

export class CheckpointGate {
  constructor(parentGroup, tunnelRadius = 4.8, sides = 8) {
    this.parentGroup = parentGroup;
    this.tunnelRadius = tunnelRadius;
    this.sides = sides;

    this.group = new THREE.Group();
    this.parentGroup.add(this.group);

    this.isActive = false;
    this.z = -999;
    this.levelConfig = null;
    this.hasTriggeredPass = false;

    this._initMesh();
    this.group.visible = false;
  }

  _initMesh() {
    // 1. Outer Holographic Octagonal Ring
    const ringRadius = this.tunnelRadius * 0.96;
    const ringGeo = new THREE.CylinderGeometry(ringRadius, ringRadius, 0.6, this.sides, 1, true);
    
    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00d2ff,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    this.ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
    this.ringMesh.rotation.x = Math.PI * 0.5;
    this.group.add(this.ringMesh);

    // 2. Wireframe / Edge Highlights
    const edges = new THREE.EdgesGeometry(ringGeo);
    this.edgeMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3.0
    });
    const edgeLines = new THREE.LineSegments(edges, this.edgeMat);
    this.ringMesh.add(edgeLines);

    // 3. Inner Rotating Energy Ring
    const innerGeo = new THREE.TorusGeometry(ringRadius * 0.88, 0.08, 8, 32);
    this.innerMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.75
    });
    this.innerRing = new THREE.Mesh(innerGeo, this.innerMat);
    this.group.add(this.innerRing);

    // 4. Center Glowing Point Light
    this.gateLight = new THREE.PointLight(0x00f3ff, 2.5, 12);
    this.group.add(this.gateLight);

    // 5. 3D Polygonal Shatter Shards
    this._initShatterShards(ringRadius);
  }

  _initShatterShards(ringRadius) {
    this.shardGroup = new THREE.Group();
    this.shards = [];
    this.isShattered = false;

    this.shardMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });

    // 16 octagonal arc shards
    const shardGeo = new THREE.PlaneGeometry(0.85, 0.45);
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(shardGeo, this.shardMat);
      mesh.visible = false;
      this.shardGroup.add(mesh);
      this.shards.push({
        mesh,
        angle: (i / 16) * Math.PI * 2,
        radius: ringRadius * 0.92,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0
      });
    }
    this.group.add(this.shardGroup);
  }

  spawn(levelConfig, spawnZ = -120) {
    this.levelConfig = levelConfig;
    this.z = spawnZ;
    this.hasTriggeredPass = false;
    this.isShattered = false;
    this.isActive = true;

    // Update colors based on level config
    const hexColor = parseInt((levelConfig.accentColor || '#00f3ff').replace('#', '0x'), 16);
    this.ringMat.color.setHex(hexColor);
    this.ringMat.emissive.setHex(hexColor);
    this.gateLight.color.setHex(hexColor);
    this.shardMat.color.setHex(hexColor);

    this.ringMesh.visible = true;
    this.innerRing.visible = true;
    this.gateLight.visible = true;

    for (let i = 0; i < this.shards.length; i++) {
      this.shards[i].mesh.visible = false;
    }

    this.group.position.set(0, 0, this.z);
    this.group.visible = true;
  }

  isGateActive() {
    return this.isActive;
  }

  triggerShatter() {
    this.isShattered = true;
    this.ringMesh.visible = false;
    this.innerRing.visible = false;

    // Spawn shards at ring perimeter with explosive centrifugal velocity
    for (let i = 0; i < this.shards.length; i++) {
      const s = this.shards[i];
      const x = Math.sin(s.angle) * s.radius;
      const y = Math.cos(s.angle) * s.radius;
      s.mesh.position.set(x, y, 0);
      s.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, s.angle);
      s.mesh.visible = true;

      // Radial blast outward + forward towards camera
      const outwardSpeed = 6.0 + Math.random() * 5.0;
      s.vx = Math.sin(s.angle) * outwardSpeed;
      s.vy = Math.cos(s.angle) * outwardSpeed;
      s.vz = 8.0 + Math.random() * 12.0; // Fly past camera
      s.rx = (Math.random() - 0.5) * 12.0;
      s.ry = (Math.random() - 0.5) * 12.0;
      s.rz = (Math.random() - 0.5) * 12.0;
    }
  }

  reset() {
    this.isActive = false;
    this.isShattered = false;
    this.group.visible = false;
    this.ringMesh.visible = true;
    this.innerRing.visible = true;
    this.gateLight.visible = true;
    for (let i = 0; i < this.shards.length; i++) {
      this.shards[i].mesh.visible = false;
    }
    this.z = -999;
    this.hasTriggeredPass = false;
  }

  update(moveDist, dt, onPassThrough) {
    if (!this.isActive) return;

    this.z += moveDist;
    this.group.position.z = this.z;

    if (!this.isShattered) {
      // Visual rotation & energy pulsation
      this.innerRing.rotation.z += dt * 2.8;
      this.ringMesh.rotation.z -= dt * 0.6;
      const pulse = 1.0 + Math.sin(performance.now() * 0.008) * 0.25;
      this.ringMat.emissiveIntensity = 1.2 * pulse;
      this.gateLight.intensity = 2.5 * pulse;

      // Check pass-through when gate reaches player position (z >= 0)
      if (!this.hasTriggeredPass && this.z >= -0.8) {
        this.hasTriggeredPass = true;
        this.triggerShatter();
        if (onPassThrough) {
          onPassThrough(this.levelConfig);
        }
      }
    } else {
      // Update exploding polygonal shards
      for (let i = 0; i < this.shards.length; i++) {
        const s = this.shards[i];
        s.mesh.position.x += s.vx * dt;
        s.mesh.position.y += s.vy * dt;
        s.mesh.position.z += s.vz * dt;
        s.mesh.rotation.x += s.rx * dt;
        s.mesh.rotation.y += s.ry * dt;
        s.mesh.rotation.z += s.rz * dt;
      }
    }

    // Recycle after passing behind camera
    if (this.z > 22.0) {
      this.reset();
    }
  }
}
