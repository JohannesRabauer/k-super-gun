import * as THREE from "three";

export interface EnemyRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
}

/** Builds a simple villain grunt. Tier (0-3) makes it bigger, darker and more armored. */
export function buildEnemyModel(tier: number): EnemyRig {
  const root = new THREE.Group();
  const scale = 0.95 + tier * 0.12;
  root.scale.setScalar(scale);

  const bodyHue = [0x8a3b3b, 0x7a2f4a, 0x4a2f7a, 0x2f2f2f][Math.min(tier, 3)];
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyHue, roughness: 0.75 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.6 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 1.4 });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.95;
  root.add(bodyGroup);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.48, 4, 8), bodyMat);
  torso.castShadow = true;
  bodyGroup.add(torso);

  if (tier >= 1) {
    const spikes = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), darkMat);
    spikes.position.set(0, 0.35, -0.15);
    bodyGroup.add(spikes);
  }

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.6;
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), bodyMat);
  head.castShadow = true;
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
    eye.position.set(0.12 * side, 0.03, 0.24);
    headGroup.add(eye);
  }
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.1), darkMat);
  jaw.position.set(0, -0.16, 0.2);
  headGroup.add(jaw);

  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), darkMat);
    horn.position.set(0.18 * side, 0.24, -0.02);
    horn.rotation.z = 0.3 * side;
    headGroup.add(horn);
  }

  const armL = new THREE.Group();
  armL.position.set(-0.4, 0.26, 0);
  bodyGroup.add(armL);
  const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 6), bodyMat);
  armLMesh.position.y = -0.19;
  armL.add(armLMesh);

  const armR = new THREE.Group();
  armR.position.set(0.4, 0.26, 0);
  bodyGroup.add(armR);
  const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 6), bodyMat);
  armRMesh.position.y = -0.19;
  armR.add(armRMesh);

  const club = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.5, 8), darkMat);
  club.position.set(0, -0.42, 0.05);
  club.rotation.x = 0.3;
  armR.add(club);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 });
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.4, 4, 6), legMat);
  legL.position.set(-0.15, 0.23, 0);
  root.add(legL);
  const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.4, 4, 6), legMat);
  legR.position.set(0.15, 0.23, 0);
  root.add(legR);

  return { root, bodyGroup, headGroup, armR, legL, legR };
}
