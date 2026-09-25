/**
 * VORTEX GLIDE — ObstacleFactory
 * Generates rich 3D Asteroids, Derelict Space Waste, Broken Satellites, and Hazardous Scrap Pods
 */

import * as THREE from '../vendor/three.module.js';
import { Obstacle } from './Obstacle.js';

export class ObstacleFactory {
  constructor(tunnelRadius = 4.8, sides = 8) {
    this.tunnelRadius = tunnelRadius;
    this.sides = sides;
    this.faceAngleStep = (Math.PI * 2) / this.sides;
    this._nextId = 1;

    this._initMaterials();
  }

  _initMaterials() {
    // 1. Dark Basalt / Carbonaceous Space Asteroid Rock
    this.asteroidRockMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a24,
      emissive: 0x0a0c14,
      roughness: 0.88,
      metalness: 0.25,
      flatShading: true
    });

    // 2. Glowing Molten / Neon Core Veins in Asteroid Fractures
    this.asteroidVeinMaterial = new THREE.MeshStandardMaterial({
      color: 0x22050e,
      emissive: 0xff0044,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.8
    });

    // 3. Weathered Orbital Space Scrap / Satellite Hull
    this.metalScrapMaterial = new THREE.MeshStandardMaterial({
      color: 0x242a35,
      emissive: 0x060c14,
      roughness: 0.4,
      metalness: 0.85,
      flatShading: true
    });

    // 4. Photovoltaic Solar Panel Material
    this.solarPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0x051329,
      emissive: 0x02163b,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.95
    });

    // 5. Caution Hazard Yellow
    this.hazardStripeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe600
    });

    // 6. Blinking Red Hazard Beacon
    this.beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0044
    });

    // 7. Neon Edges / Debris Outlines
    this.edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xff1e56,
      linewidth: 2.0
    });

    this.solarEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      linewidth: 1.5
    });

    // 8. Runway Guide Lights for Open Faces
    this.runwayMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.35
    });
  }

  /**
   * Generates procedurally deformed faceted asteroid geometry
   */
  _createAsteroidGeometry(radius = 1.15, seed = 1) {
    const geo = new THREE.DodecahedronGeometry(radius, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = Math.sin(x * 3.8 + seed * 2.1) * 0.18 + Math.cos(y * 4.2 + z * 3.5) * 0.14;
      const factor = 1.0 + noise;
      pos.setXYZ(i, x * factor, y * factor, z * factor);
    }
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Type 0: Craggy Asteroid Boulder Cluster with glowing mineral fractures
   */
  _buildAsteroidCluster(group, tumblers, depth) {
    // 1. Primary Asteroid Boulder
    const mainGeo = this._createAsteroidGeometry(1.2, 1);
    const mainRock = new THREE.Mesh(mainGeo, this.asteroidRockMaterial);
    mainRock.position.set(0, 0.1, 0);
    mainRock.scale.set(1.2, 0.9, depth * 0.7);
    group.add(mainRock);

    // Glowing fissures
    const veinGeo = this._createAsteroidGeometry(1.16, 1);
    const veinMesh = new THREE.Mesh(veinGeo, this.asteroidVeinMaterial);
    veinMesh.position.set(0, 0.1, 0);
    veinMesh.scale.set(1.15, 0.86, depth * 0.68);
    group.add(veinMesh);

    // Edge wireframe for sci-fi silhouette
    const edges = new THREE.EdgesGeometry(mainGeo);
    const line = new THREE.LineSegments(edges, this.edgeMaterial);
    line.position.copy(mainRock.position);
    line.scale.copy(mainRock.scale);
    group.add(line);

    // 2. Tumbling Satellite Rocks
    const subGeo1 = this._createAsteroidGeometry(0.42, 2);
    const subRock1 = new THREE.Mesh(subGeo1, this.asteroidRockMaterial);
    subRock1.position.set(-1.05, 0.25, 0.15);
    group.add(subRock1);

    const subGeo2 = this._createAsteroidGeometry(0.35, 3);
    const subRock2 = new THREE.Mesh(subGeo2, this.asteroidRockMaterial);
    subRock2.position.set(1.0, 0.2, -0.2);
    group.add(subRock2);

    tumblers.push(
      { mesh: subRock1, rx: 0.6, ry: 0.8 },
      { mesh: subRock2, rx: -0.8, ry: 0.5 }
    );
  }

  /**
   * Type 1: Derelict Space Waste / Broken Satellite Debris
   */
  _buildSatelliteDebris(group, tumblers, depth) {
    // 1. Central Battered Satellite Chassis
    const chassisGeo = new THREE.BoxGeometry(1.1, 0.85, 0.95);
    const chassis = new THREE.Mesh(chassisGeo, this.metalScrapMaterial);
    group.add(chassis);

    const chassisEdges = new THREE.EdgesGeometry(chassisGeo);
    const chassisLine = new THREE.LineSegments(chassisEdges, this.edgeMaterial);
    group.add(chassisLine);

    // 2. Snapped Solar Array Wing (angled)
    const solarWingGeo = new THREE.BoxGeometry(1.5, 0.05, 0.7);
    const solarWing = new THREE.Mesh(solarWingGeo, this.solarPanelMaterial);
    solarWing.position.set(0.9, 0.15, 0.0);
    solarWing.rotation.z = -0.22;
    solarWing.rotation.x = 0.15;
    group.add(solarWing);

    const solarEdges = new THREE.EdgesGeometry(solarWingGeo);
    const solarLine = new THREE.LineSegments(solarEdges, this.solarEdgeMaterial);
    solarLine.position.copy(solarWing.position);
    solarLine.rotation.copy(solarWing.rotation);
    group.add(solarLine);

    // 3. Broken Antenna Mast & Dish
    const mastGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6);
    const mast = new THREE.Mesh(mastGeo, this.metalScrapMaterial);
    mast.position.set(-0.55, 0.5, 0.1);
    mast.rotation.z = 0.35;
    group.add(mast);

    const dishGeo = new THREE.ConeGeometry(0.35, 0.15, 8);
    const dish = new THREE.Mesh(dishGeo, this.metalScrapMaterial);
    dish.position.set(-0.7, 0.88, 0.1);
    dish.rotation.z = -1.2;
    group.add(dish);

    // Red Warning Beacon on mast tip
    const beaconGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const beacon = new THREE.Mesh(beaconGeo, this.beaconMaterial);
    beacon.position.set(-0.7, 0.95, 0.1);
    group.add(beacon);

    // Floating scrap plate tumbler
    const scrapGeo = new THREE.BoxGeometry(0.45, 0.06, 0.35);
    const scrapMesh = new THREE.Mesh(scrapGeo, this.metalScrapMaterial);
    scrapMesh.position.set(-1.0, 0.1, -0.3);
    group.add(scrapMesh);

    tumblers.push({ mesh: scrapMesh, rx: 1.2, ry: 0.9 });
  }

  /**
   * Type 2: Hazardous Orbital Waste Container / Ruptured Fuel Pod
   */
  _buildHazardWastePod(group, tumblers, depth) {
    // 1. Horizontal Fuel Cylinder
    const cylGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.2, 10);
    cylGeo.rotateZ(Math.PI / 2);
    const cyl = new THREE.Mesh(cylGeo, this.metalScrapMaterial);
    group.add(cyl);

    const cylEdges = new THREE.EdgesGeometry(cylGeo);
    const cylLine = new THREE.LineSegments(cylEdges, this.edgeMaterial);
    group.add(cylLine);

    // 2. Yellow Caution Hazard Stripe
    const stripeGeo = new THREE.BoxGeometry(1.8, 0.08, 0.9);
    const stripe = new THREE.Mesh(stripeGeo, this.hazardStripeMaterial);
    stripe.position.set(0, 0.48, 0);
    group.add(stripe);

    // 3. Ruptured glowing containment crack
    const crackGeo = new THREE.BoxGeometry(0.8, 0.25, 0.4);
    const crack = new THREE.Mesh(crackGeo, this.asteroidVeinMaterial);
    crack.position.set(0.3, 0.35, 0.3);
    group.add(crack);

    // 4. Exposed Structural Struts / Girders
    const strutGeo = new THREE.BoxGeometry(0.08, 0.08, 1.2);
    const strut1 = new THREE.Mesh(strutGeo, this.metalScrapMaterial);
    strut1.position.set(-0.9, 0.2, 0.4);
    strut1.rotation.y = 0.35;
    group.add(strut1);

    // Small floating debris chunk
    const chunkGeo = this._createAsteroidGeometry(0.3, 5);
    const chunk = new THREE.Mesh(chunkGeo, this.asteroidRockMaterial);
    chunk.position.set(1.05, 0.3, -0.2);
    group.add(chunk);

    tumblers.push({ mesh: chunk, rx: 0.7, ry: -1.1 });
  }

  /**
   * Builds an individual 3D hazard block (Asteroid or Space Waste) mounted flush to face `faceIndex`
   */
  createFaceBlock(faceIndex, depth = 1.3, archetypeIndex = 0) {
    const group = new THREE.Group();
    const tumblers = [];
    const faceAngle = faceIndex * this.faceAngleStep;

    // Archetype selection: 0 = Asteroid Cluster, 1 = Satellite Debris, 2 = Hazardous Space Waste Pod
    const type = (faceIndex + archetypeIndex) % 3;

    if (type === 0) {
      this._buildAsteroidCluster(group, tumblers, depth);
    } else if (type === 1) {
      this._buildSatelliteDebris(group, tumblers, depth);
    } else {
      this._buildHazardWastePod(group, tumblers, depth);
    }

    group.userData.tumblers = tumblers;

    // Position flush on the face
    // Distance from tunnel center to face inner surface
    const blockHeight = 1.25;
    const rFace = this.tunnelRadius * Math.cos(this.faceAngleStep * 0.5) - (blockHeight * 0.5);

    const x = Math.sin(faceAngle) * rFace;
    const y = -Math.cos(faceAngle) * rFace;

    group.position.set(x, y, 0);
    // Rotate so top face points inward toward tunnel center
    group.rotation.z = -faceAngle;

    return group;
  }

  /**
   * Creates a glowing runway marker mounted flush on open face to telegraph safe path
   */
  createRunwayMarker(faceIndex) {
    const group = new THREE.Group();
    const faceAngle = faceIndex * this.faceAngleStep;

    // Sleek dual neon guide lines on the tunnel floor
    const lineGeo = new THREE.BoxGeometry(0.06, 0.02, 2.6);
    const line1 = new THREE.Mesh(lineGeo, this.runwayMaterial);
    line1.position.set(-0.75, 0.02, 0);
    group.add(line1);

    const line2 = new THREE.Mesh(lineGeo, this.runwayMaterial);
    line2.position.set(0.75, 0.02, 0);
    group.add(line2);

    // Center chevron dot
    const dotGeo = new THREE.BoxGeometry(0.25, 0.03, 0.45);
    const dot = new THREE.Mesh(dotGeo, this.runwayMaterial);
    dot.position.set(0, 0.02, 0);
    group.add(dot);

    const rFace = this.tunnelRadius * Math.cos(this.faceAngleStep * 0.5) - 0.04;
    const x = Math.sin(faceAngle) * rFace;
    const y = -Math.cos(faceAngle) * rFace;

    group.position.set(x, y, 0);
    group.rotation.z = -faceAngle;
    return group;
  }

  /**
   * Creates an obstacle wave configured with blockedFaces
   * @param {string} type - 'gap', 'alternating', 'rotating', 'center'
   * @param {Object} config - { blockedFaces, rotationSpeed }
   */
  createObstacleWave(type, config = {}) {
    const id = this._nextId++;
    const obstacle = new Obstacle(id, type, config);
    obstacle.faceBlocks = [];
    obstacle.runwayMarkers = [];

    // Pre-create all 8 face blocks and runway markers once for zero GC recycling
    for (let faceIdx = 0; faceIdx < this.sides; faceIdx++) {
      const block = this.createFaceBlock(faceIdx, obstacle.depth, faceIdx);
      obstacle.group.add(block);
      obstacle.faceBlocks.push(block);

      const marker = this.createRunwayMarker(faceIdx);
      obstacle.group.add(marker);
      obstacle.runwayMarkers.push(marker);
    }

    obstacle.blockedFaces = config.blockedFaces || [0];
    obstacle.rotationSpeed = config.rotationSpeed || 0;
    obstacle.applyBlockedFaces();
    obstacle.collectTumblers();
    return obstacle;
  }
}
