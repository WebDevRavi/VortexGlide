/**
 * VORTEX GLIDE — Tunnel
 * Spec Section 10-13: Endless 3D tunnel generator & dynamic color theme controller
 */

import * as THREE from '../vendor/three.module.js';
import { TunnelSegment } from './TunnelSegment.js';

export class Tunnel {
  constructor(parentGroup, segmentCount = 7, segmentLength = 22.0, radius = 4.8) {
    this.parentGroup = parentGroup;
    this.segmentCount = segmentCount;
    this.segmentLength = segmentLength;
    this.radius = radius;
    
    this.segments = [];
    this.group = new THREE.Group();
    this.parentGroup.add(this.group);

    // Color progression themes (Cyan -> Magenta -> Violet -> Emerald -> Amber)
    this.themes = [
      { neon: 0x00f3ff, panel: 0x050814 },
      { neon: 0xff007b, panel: 0x14050d },
      { neon: 0x8b2be2, panel: 0x0e0516 },
      { neon: 0x00ff88, panel: 0x04140b },
      { neon: 0xffe600, panel: 0x141204 }
    ];
    this.currentThemeIndex = 0;

    this.init();
  }

  init() {
    for (let i = 0; i < this.segmentCount; i++) {
      const seg = new TunnelSegment(this.radius, this.segmentLength, 8);
      const zPos = 14 - i * this.segmentLength;
      seg.setPositionZ(zPos);
      this.group.add(seg.group);
      this.segments.push(seg);
    }
  }

  reset(themeIndex = 0) {
    for (let i = 0; i < this.segments.length; i++) {
      const zPos = 14 - i * this.segmentLength;
      this.segments[i].setPositionZ(zPos);
    }
    this.setTheme(themeIndex);
  }

  update(speed, dt, currentTier = 1) {
    const moveDist = speed * dt;

    const targetThemeIdx = Math.min(this.themes.length - 1, currentTier - 1);
    if (targetThemeIdx !== this.currentThemeIndex) {
      this.setTheme(targetThemeIdx);
    }

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      let newZ = seg.getPositionZ() + moveDist;

      if (newZ > 24.0) {
        let minZ = Infinity;
        for (let j = 0; j < this.segments.length; j++) {
          const sz = this.segments[j].getPositionZ();
          if (sz < minZ) minZ = sz;
        }
        newZ = minZ - this.segmentLength;
      }

      seg.setPositionZ(newZ);
    }
  }

  setTheme(index) {
    this.currentThemeIndex = index;
    const theme = this.themes[index] || this.themes[0];
    this.segments.forEach((seg) => {
      seg.setColor(theme.neon, theme.panel);
    });
  }

  getRadius() {
    return this.radius;
  }
}
