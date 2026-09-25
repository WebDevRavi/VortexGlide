/**
 * VORTEX GLIDE — Player Craft (Enhanced Delta Arrow Interceptor)
 * Matching png logo.png & Panel 2: Glowing cyan edges, cockpit canopy, and dual thruster rays
 */

import * as THREE from '../vendor/three.module.js';

export class Player {
  constructor(scene, tunnelRadius = 4.8) {
    this.scene = scene;
    this.tunnelRadius = tunnelRadius;
    
    // Craft sits at fixed bottom position right over the floor tracks
    this.fixedY = -3.25;
    this.fixedZ = 0.0;
    
    this.group = new THREE.Group();
    this.craftGroup = new THREE.Group();
    this.group.add(this.craftGroup);

    this.turnBank = 0.0;
    
    this._buildCraft();
    this._initThrusterTrails();
    this._initCrashDebris();

    this.group.position.set(0, this.fixedY, this.fixedZ);
    this.scene.add(this.group);
  }

  _buildCraft() {
    // 1. Sleek Delta Fuselage
    const shape = new THREE.Shape();
    // Nose
    shape.moveTo(0, -0.65);
    // Right wingtip
    shape.lineTo(1.15, 0.45);
    // Right inner notch
    shape.lineTo(0.35, 0.25);
    // Center tail engine mount
    shape.lineTo(0, 0.52);
    // Left inner notch
    shape.lineTo(-0.35, 0.25);
    // Left wingtip
    shape.lineTo(-1.15, 0.45);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    };

    const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Lay flat and orient forward (-Z)
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.center();

    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x050c18,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x02162b,
      emissiveIntensity: 0.5
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.craftGroup.add(this.bodyMesh);

    // 2. High-Luminance Glowing Edges
    const edges = new THREE.EdgesGeometry(bodyGeo);
    this.lineMat = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      linewidth: 2.5
    });
    const edgeLines = new THREE.LineSegments(edges, this.lineMat);
    this.craftGroup.add(edgeLines);

    // 3. Glowing Central Cockpit Canopy (Matching Logo)
    const cockpitGeo = new THREE.ConeGeometry(0.16, 0.65, 4);
    cockpitGeo.rotateX(-Math.PI / 2);
    cockpitGeo.scale(1.0, 0.45, 1.0);

    const cockpitMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.12, -0.05);
    this.craftGroup.add(cockpit);

    // Cockpit neon aura
    this.cockpitLight = new THREE.PointLight(0x00f3ff, 2.8, 4.5);
    this.cockpitLight.position.set(0, 0.25, 0);
    this.craftGroup.add(this.cockpitLight);

    // Forward Jet Headlight (illuminates oncoming asteroids and obstacles)
    this.headLight = new THREE.SpotLight(0x00f3ff, 6.0, 50, Math.PI / 5, 0.5, 1.2);
    this.headLight.position.set(0, 0.15, -0.4);
    this.headLightTarget = new THREE.Object3D();
    this.headLightTarget.position.set(0, 0, -35);
    this.group.add(this.headLightTarget);
    this.headLight.target = this.headLightTarget;
    this.craftGroup.add(this.headLight);

    // Neon Track Under-Glow (reflects on bottom floor tracks)
    this.underGlow = new THREE.PointLight(0x00f3ff, 2.4, 3.8);
    this.underGlow.position.set(0, -0.15, 0);
    this.craftGroup.add(this.underGlow);

    // 4. Twin Thruster Exhaust Cones & Plasma Flames
    const thrusterGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.22, 8);
    thrusterGeo.rotateX(Math.PI / 2);
    this.thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    const leftThruster = new THREE.Mesh(thrusterGeo, this.thrusterMat);
    leftThruster.position.set(-0.32, 0.02, 0.45);
    this.craftGroup.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, this.thrusterMat);
    rightThruster.position.set(0.32, 0.02, 0.45);
    this.craftGroup.add(rightThruster);

    // Plasma Exhaust Flame Plumes
    const flameGeo = new THREE.ConeGeometry(0.085, 0.55, 8);
    flameGeo.rotateX(-Math.PI / 2);
    this.flameMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.88
    });

    this.leftFlame = new THREE.Mesh(flameGeo, this.flameMat);
    this.leftFlame.position.set(-0.32, 0.02, 0.72);
    this.craftGroup.add(this.leftFlame);

    this.rightFlame = new THREE.Mesh(flameGeo, this.flameMat);
    this.rightFlame.position.set(0.32, 0.02, 0.72);
    this.craftGroup.add(this.rightFlame);
  }

  _initThrusterTrails() {
    this.trailLength = 16;
    this.leftTrailPoints = [];
    this.rightTrailPoints = [];

    const trailGeo = new THREE.BufferGeometry();
    // 2 trails (left and right), each with a line segment (2 vertices) per step = 4 vertices per step
    const pos = new Float32Array(this.trailLength * 4 * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    this.trailMat = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.85,
      linewidth: 3
    });

    this.thrusterTrails = new THREE.LineSegments(trailGeo, this.trailMat);
    this.scene.add(this.thrusterTrails);
  }

  _initCrashDebris() {
    this.debrisGroup = new THREE.Group();
    this.debrisParts = [];

    // 4 Kinetic Debris Shards: Nose, Left Wing, Right Wing, Cockpit Core
    const shardGeos = [
      new THREE.ConeGeometry(0.35, 0.7, 4),                     // Nose
      new THREE.BoxGeometry(0.7, 0.12, 0.5),                    // Left Wing
      new THREE.BoxGeometry(0.7, 0.12, 0.5),                    // Right Wing
      new THREE.OctahedronGeometry(0.24, 0)                     // Core
    ];

    for (let i = 0; i < shardGeos.length; i++) {
      const geo = shardGeos[i];
      const mesh = new THREE.Mesh(geo, this.bodyMat);
      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(edges, this.lineMat);
      mesh.add(lines);

      const part = {
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        basePos: new THREE.Vector3()
      };
      this.debrisParts.push(part);
      this.debrisGroup.add(mesh);
    }

    this.debrisGroup.visible = false;
    this.group.add(this.debrisGroup);
  }

  _resetDebris() {
    this.debrisGroup.visible = false;
    const offsets = [
      new THREE.Vector3(0, 0.1, -0.4),
      new THREE.Vector3(-0.65, 0, 0.1),
      new THREE.Vector3(0.65, 0, 0.1),
      new THREE.Vector3(0, 0.2, 0)
    ];

    for (let i = 0; i < this.debrisParts.length; i++) {
      const p = this.debrisParts[i];
      p.mesh.position.copy(offsets[i]);
      p.mesh.rotation.set(0, 0, 0);
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
    }
  }

  triggerCrash() {
    this.craftGroup.visible = false;
    this.thrusterTrails.visible = false;
    this.debrisGroup.visible = true;

    // Impart explosive outward kinetic impulse
    const impulseAngles = [Math.PI * 0.5, Math.PI * 1.1, -Math.PI * 0.1, -Math.PI * 0.5];
    for (let i = 0; i < this.debrisParts.length; i++) {
      const p = this.debrisParts[i];
      const ang = impulseAngles[i] + (Math.random() - 0.5) * 0.4;
      const speed = 4.5 + Math.random() * 3.5;
      p.vx = Math.cos(ang) * speed;
      p.vy = Math.sin(ang) * speed + 2.0;
      p.vz = -Math.random() * 12.0 - 4.0; // Tumble forward into tunnel
      p.rx = (Math.random() - 0.5) * 14.0;
      p.ry = (Math.random() - 0.5) * 14.0;
      p.rz = (Math.random() - 0.5) * 14.0;
    }
  }

  updateDebris(dt) {
    if (!this.debrisGroup.visible) return;
    for (let i = 0; i < this.debrisParts.length; i++) {
      const p = this.debrisParts[i];
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += p.rx * dt;
      p.mesh.rotation.y += p.ry * dt;
      p.mesh.rotation.z += p.rz * dt;
      // Air drag & gravity
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.vz *= 0.96;
    }
  }

  reset() {
    this.turnBank = 0.0;
    this.craftGroup.rotation.set(0, 0, 0);
    this.craftGroup.position.set(0, 0, 0);
    this.leftTrailPoints = [];
    this.rightTrailPoints = [];
    this.group.visible = true;
    this.craftGroup.visible = true;
    this.thrusterTrails.visible = true;
    this._resetDebris();
  }

  /**
   * Updates banking lean and jet exhaust rays
   * @param {number} bankRatio - From -1 (left) to +1 (right)
   * @param {number} normalizedSpeed - Current speed progress 0.0 to 1.0
   */
  setBanking(bankRatio, normalizedSpeed = 0) {
    this.turnBank = bankRatio;
    // Aerodynamic bank lean up to 28 degrees (0.48 rad)
    this.craftGroup.rotation.z = -bankRatio * 0.48;
    this.craftGroup.rotation.y = bankRatio * 0.22;
    // Subtle gravitational track dip when banking hard
    this.craftGroup.position.y = -Math.abs(bankRatio) * 0.08;

    // Thruster plasma flame flare scaling with speed & turn direction
    if (this.leftFlame && this.rightFlame) {
      const baseLen = 1.0 + normalizedSpeed * 0.75;
      const flicker = 0.88 + Math.random() * 0.26;
      // Flare outer flame during bank
      const leftScale = (bankRatio > 0 ? 1.35 : 0.85) * flicker * baseLen;
      const rightScale = (bankRatio < 0 ? 1.35 : 0.85) * flicker * baseLen;
      this.leftFlame.scale.set(1.0, leftScale, 1.0);
      this.rightFlame.scale.set(1.0, rightScale, 1.0);
    }

    // Update trails
    const pAttr = this.thrusterTrails.geometry.attributes.position;
    const lx = -0.32 + bankRatio * 0.12;
    const rx = 0.32 + bankRatio * 0.12;
    const ly = this.fixedY + 0.02 - Math.abs(bankRatio) * 0.08;
    const lz = this.fixedZ + 0.45;

    let pIdx = 0;
    for (let i = 0; i < this.trailLength; i++) {
      const zOffset = i * (0.24 + normalizedSpeed * 0.16);
      // Left ray segment
      pAttr.setXYZ(pIdx++, lx, ly, lz + zOffset);
      pAttr.setXYZ(pIdx++, lx, ly, lz + zOffset + 0.2);

      // Right ray segment
      pAttr.setXYZ(pIdx++, rx, ly, lz + zOffset);
      pAttr.setXYZ(pIdx++, rx, ly, lz + zOffset + 0.2);
    }
    pAttr.needsUpdate = true;
  }

  /**
   * Acrobatic 180° Inversion barrel-roll flip animation
   * @param {number} progress - 0.0 to 1.0 during flip
   * @param {number} direction - -1 (left/CW) or +1 (right/CCW)
   */
  setFlipAnimation(progress, direction = 1) {
    if (progress > 0) {
      // 360 degree barrel roll on craft axis during world inversion
      this.craftGroup.rotation.z = direction * progress * Math.PI * 2;
      this.craftGroup.rotation.y = Math.sin(progress * Math.PI) * direction * 0.4;
      // Parabolic acrobatic arch
      this.craftGroup.position.y = Math.sin(progress * Math.PI) * 0.48;

      if (this.cockpitLight) {
        this.cockpitLight.intensity = 2.8 + Math.sin(progress * Math.PI) * 4.5;
      }
    } else {
      this.craftGroup.position.y = 0.0;
      if (this.cockpitLight) {
        this.cockpitLight.intensity = 2.8;
      }
    }
  }

  getWorldPosition() {
    return this.group.position;
  }

  hide() {
    this.group.visible = false;
    this.thrusterTrails.visible = false;
  }

  applySkin(skinConfig) {
    if (!skinConfig) return;
    if (this.bodyMat) {
      this.bodyMat.color.setHex(skinConfig.hullColor);
      this.bodyMat.emissive.setHex(skinConfig.emissive || 0x02162b);
    }
    if (this.lineMat) {
      this.lineMat.color.setHex(skinConfig.edgeColor);
    }
    if (this.cockpitLight) {
      this.cockpitLight.color.setHex(skinConfig.lightColor);
    }
    if (this.headLight) {
      this.headLight.color.setHex(skinConfig.lightColor);
    }
    if (this.underGlow) {
      this.underGlow.color.setHex(skinConfig.lightColor);
    }
    if (this.thrusterMat) {
      this.thrusterMat.color.setHex(skinConfig.edgeColor);
    }
    if (this.flameMat) {
      this.flameMat.color.setHex(skinConfig.lightColor);
    }
    if (this.trailMat) {
      this.trailMat.color.setHex(skinConfig.edgeColor);
    }
  }
}
