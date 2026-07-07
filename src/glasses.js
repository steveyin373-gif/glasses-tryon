import * as THREE from 'three';

export function createGlasses(style = 'aviator', color = '#1a1a1a') {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.6,
    roughness: 0.3,
  });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    transparent: true,
    opacity: 0.35,
    metalness: 0.1,
    roughness: 0,
    transmission: 0.6,
  });

  const builders = { aviator, round, 'cat-eye': catEye, wayfarer };
  const build = builders[style] || aviator;
  build(group, mat, lensMat);

  return group;
}

function aviator(group, mat, lensMat) {
  const lensShape = new THREE.Shape();
  lensShape.moveTo(-0.5, 0.35);
  lensShape.quadraticCurveTo(-0.55, 0.0, -0.45, -0.35);
  lensShape.quadraticCurveTo(-0.1, -0.45, 0, -0.35);
  lensShape.quadraticCurveTo(0.1, -0.45, 0.45, -0.35);
  lensShape.quadraticCurveTo(0.55, 0.0, 0.5, 0.35);
  lensShape.quadraticCurveTo(0, 0.4, -0.5, 0.35);

  const lensGeo = new THREE.ExtrudeGeometry(lensShape, { depth: 0.02, bevelEnabled: false });

  const leftLens = new THREE.Mesh(lensGeo, lensMat);
  leftLens.position.set(-0.7, 0, 0);
  group.add(leftLens);

  const rightLens = new THREE.Mesh(lensGeo, lensMat);
  rightLens.position.set(0.7, 0, 0);
  group.add(rightLens);

  addFrame(group, mat, lensShape, -0.7);
  addFrame(group, mat, lensShape, 0.7);
  addBridge(group, mat);
  addTemples(group, mat);
}

function round(group, mat, lensMat) {
  const circleGeo = new THREE.CircleGeometry(0.42, 32);
  const ringGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 32);

  [-0.6, 0.6].forEach(x => {
    const lens = new THREE.Mesh(circleGeo, lensMat);
    lens.position.set(x, 0, 0);
    group.add(lens);

    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.set(x, 0, 0);
    group.add(ring);
  });

  addBridge(group, mat);
  addTemples(group, mat);
}

function catEye(group, mat, lensMat) {
  const lensShape = new THREE.Shape();
  lensShape.moveTo(-0.5, 0.3);
  lensShape.quadraticCurveTo(-0.55, -0.1, -0.4, -0.3);
  lensShape.quadraticCurveTo(0, -0.35, 0.4, -0.3);
  lensShape.quadraticCurveTo(0.55, -0.1, 0.55, 0.25);
  lensShape.quadraticCurveTo(0.45, 0.5, 0, 0.35);
  lensShape.quadraticCurveTo(-0.45, 0.5, -0.5, 0.3);

  const lensGeo = new THREE.ExtrudeGeometry(lensShape, { depth: 0.02, bevelEnabled: false });

  [-0.65, 0.65].forEach(x => {
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(x, 0, 0);
    group.add(lens);
  });

  addFrame(group, mat, lensShape, -0.65);
  addFrame(group, mat, lensShape, 0.65);
  addBridge(group, mat);
  addTemples(group, mat);
}

function wayfarer(group, mat, lensMat) {
  const lensShape = new THREE.Shape();
  lensShape.moveTo(-0.48, 0.32);
  lensShape.lineTo(0.48, 0.32);
  lensShape.quadraticCurveTo(0.52, 0.32, 0.52, 0.28);
  lensShape.lineTo(0.52, -0.28);
  lensShape.quadraticCurveTo(0.52, -0.32, 0.48, -0.32);
  lensShape.lineTo(-0.48, -0.32);
  lensShape.quadraticCurveTo(-0.52, -0.32, -0.52, -0.28);
  lensShape.lineTo(-0.52, 0.28);
  lensShape.quadraticCurveTo(-0.52, 0.32, -0.48, 0.32);

  const lensGeo = new THREE.ExtrudeGeometry(lensShape, { depth: 0.02, bevelEnabled: false });

  [-0.65, 0.65].forEach(x => {
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(x, 0, 0);
    group.add(lens);
  });

  addFrame(group, mat, lensShape, -0.65);
  addFrame(group, mat, lensShape, 0.65);
  addBridge(group, mat, 0.05);
  addTemples(group, mat);
}

function addFrame(group, mat, shape, xOffset) {
  const points = shape.getPoints(48);
  const framePath = new THREE.CatmullRomCurve3(
    points.map(p => new THREE.Vector3(p.x + xOffset, p.y, 0)),
    true
  );
  const tubeGeo = new THREE.TubeGeometry(framePath, 48, 0.025, 8, true);
  group.add(new THREE.Mesh(tubeGeo, mat));
}

function addBridge(group, mat, thickness = 0.03) {
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 0.1, 0),
    new THREE.Vector3(0, 0.18, 0.04),
    new THREE.Vector3(0.2, 0.1, 0),
  ]);
  const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 16, thickness, 8, false);
  group.add(new THREE.Mesh(bridgeGeo, mat));
}

function addTemples(group, mat) {
  [-1, 1].forEach(side => {
    const templeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.1, 0.35, 0),
      new THREE.Vector3(side * 1.2, 0.35, -1.2),
      new THREE.Vector3(side * 1.2, 0.25, -3.2),
      new THREE.Vector3(side * 1.15, 0.15, -4.8),
    ]);
    const templeGeo = new THREE.TubeGeometry(templeCurve, 16, 0.02, 8, false);
    group.add(new THREE.Mesh(templeGeo, mat));
  });
}
