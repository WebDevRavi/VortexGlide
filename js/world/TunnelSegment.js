/**
 * VORTEX GLIDE — TunnelSegment
 * Spec Section 10-13, Ref Prototype: Octagonal 3D neon tunnel segment with glowing floor tracks
 */

import * as THREE from '../vendor/three.module.js';

export class TunnelSegment {
  constructor(radius = 4.8, length = 22.0, sides = 8) {
    this.radius = radius;
    this.length = length;
    this.sides = sides;
    this.group = new THREE.Group();

    this._buildMesh();
  }

  _buildMesh() {
    // 1. Dark reflective interior corridor panels (Octagonal cylinder)
    const cylGeo = new THREE.CylinderGeometry(
      this.radius,
      this.radius,
      this.length,
      this.sides,
      1,
      true // open ends
    );
    cylGeo.rotateX(Math.PI / 2);
    // Align so a flat face is at the bottom (rotate by half a face angle)
    cylGeo.rotateZ(Math.PI / this.sides);

    this.panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x060914,
      roughness: 0.35,
      metalness: 0.7,
      side: THREE.BackSide
    });

    this.panelMesh = new THREE.Mesh(cylGeo, this.panelMaterial);
    this.group.add(this.panelMesh);

    // 2. Glowing Neon Perimeter Ribs (rings along segment)
    this.ribMaterial = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    const ringPositions = [-this.length * 0.5, 0, this.length * 0.5];
    ringPositions.forEach((zPos) => {
      const ringGeo = new THREE.BufferGeometry();
      const vertices = [];
      for (let i = 0; i <= this.sides; i++) {
        const theta = (i / this.sides) * Math.PI * 2 + (Math.PI / this.sides);
        vertices.push(Math.sin(theta) * this.radius, -Math.cos(theta) * this.radius, zPos);
      }
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const ringLine = new THREE.Line(ringGeo, this.ribMaterial);
      this.group.add(ringLine);
    });

    // 3. Glowing Floor Tracks (Matching png logo.png & Panel 2)
    // Run two high-luminance neon guide lines down the bottom face
    this.trackMaterial = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });

    const trackOffsets = [-0.65, 0.65];
    const trackGeo = new THREE.BufferGeometry();
    const trackVerts = [];
    const floorY = -this.radius * Math.cos(Math.PI / this.sides) + 0.02;

    trackOffsets.forEach((offsetX) => {
      trackVerts.push(offsetX, floorY, -this.length * 0.5);
      trackVerts.push(offsetX, floorY, this.length * 0.5);
    });

    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(trackVerts, 3));
    const floorTracks = new THREE.LineSegments(trackGeo, this.trackMaterial);
    this.group.add(floorTracks);

    // 4. Longitudinal Corner Rails (running down all 8 polygon corners)
    this.railMaterial = new THREE.LineBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.45
    });

    const railGeo = new THREE.BufferGeometry();
    const railVerts = [];
    for (let i = 0; i < this.sides; i++) {
      const theta = (i / this.sides) * Math.PI * 2 + (Math.PI / this.sides);
      const x = Math.sin(theta) * this.radius;
      const y = -Math.cos(theta) * this.radius;
      railVerts.push(x, y, -this.length * 0.5);
      railVerts.push(x, y, this.length * 0.5);
    }
    railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railVerts, 3));
    const rails = new THREE.LineSegments(railGeo, this.railMaterial);
    this.group.add(rails);
  }

  setPositionZ(z) {
    this.group.position.z = z;
  }

  getPositionZ() {
    return this.group.position.z;
  }

  setColor(neonHex, panelHex = 0x060914) {
    this.ribMaterial.color.setHex(neonHex);
    this.trackMaterial.color.setHex(neonHex);
    this.panelMaterial.color.setHex(panelHex);
  }
}
