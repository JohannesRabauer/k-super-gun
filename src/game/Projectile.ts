import * as THREE from "three";

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
  fromPlayer: boolean;
  radius: number;
}

const projectileGeo = new THREE.ConeGeometry(0.06, 0.32, 6);
projectileGeo.rotateX(Math.PI / 2);
const enemyProjectileGeo = new THREE.SphereGeometry(0.12, 8, 8);

export function createProjectile(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  speed: number,
  damage: number,
  fromPlayer: boolean
): Projectile {
  const mat = new THREE.MeshStandardMaterial({
    color: fromPlayer ? 0xffe066 : 0xff4444,
    emissive: fromPlayer ? 0xffb020 : 0xaa1010,
    emissiveIntensity: 0.6,
  });
  const mesh = new THREE.Mesh(fromPlayer ? projectileGeo : enemyProjectileGeo, mat);
  mesh.position.copy(origin);
  mesh.castShadow = false;
  const dir = direction.clone().normalize();
  if (fromPlayer) {
    mesh.lookAt(origin.clone().add(dir));
  }
  return {
    mesh,
    velocity: dir.multiplyScalar(speed),
    damage,
    life: 2.2,
    fromPlayer,
    radius: fromPlayer ? 0.18 : 0.14,
  };
}
