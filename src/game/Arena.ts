import * as THREE from "three";
import { AreaDef } from "./areas";

export const ARENA_RADIUS = 22;

export interface ArenaHandle {
  group: THREE.Group;
  dispose(): void;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Builds a themed arena (ground, boundary, props) for the given area. */
export function buildArena(area: AreaDef, scene: THREE.Scene): ArenaHandle {
  const group = new THREE.Group();
  group.name = `arena-${area.id}`;
  scene.add(group);

  scene.background = new THREE.Color(area.skyColorBottom);
  scene.fog = new THREE.Fog(area.fogColor, 18, 46);

  // Ground
  const groundGeo = new THREE.CircleGeometry(ARENA_RADIUS, 48);
  const groundMat = new THREE.MeshStandardMaterial({ color: area.groundColor, roughness: 1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Subtle ring pattern for scale reference
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
  for (let r = 6; r < ARENA_RADIUS; r += 6) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.05, r, 64), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    group.add(ring);
  }

  // Boundary wall (low fence of posts so player can see the play limit)
  const postCount = 40;
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 });
  for (let i = 0; i < postCount; i++) {
    const angle = (i / postCount) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 6), postMat);
    post.position.set(Math.cos(angle) * ARENA_RADIUS, 0.55, Math.sin(angle) * ARENA_RADIUS);
    group.add(post);
  }

  // Themed props
  const rand = seededRandom(area.id * 977 + 3);
  const propCount = 22;
  for (let i = 0; i < propCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 5 + rand() * (ARENA_RADIUS - 8);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const prop = buildProp(area.id, rand);
    prop.position.set(x, 0, z);
    prop.rotation.y = rand() * Math.PI * 2;
    group.add(prop);
  }

  // Lighting
  const hemi = new THREE.HemisphereLight(area.skyColorTop, area.groundColor, 0.9);
  group.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, area.id === 4 ? 0.7 : 1.1);
  sun.position.set(12, 20, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  sun.shadow.camera.far = 60;
  group.add(sun);
  group.add(sun.target);

  return {
    group,
    dispose() {
      scene.remove(group);
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    },
  };
}

function buildProp(areaId: number, rand: () => number): THREE.Object3D {
  switch (areaId) {
    case 1: {
      // Bamboo stalk
      const group = new THREE.Group();
      const h = 2 + rand() * 2.5;
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.11, h, 8),
        new THREE.MeshStandardMaterial({ color: 0x6bb04a, roughness: 0.7 })
      );
      stalk.position.y = h / 2;
      stalk.castShadow = true;
      group.add(stalk);
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0x3f8a3f }));
      leaves.position.y = h;
      group.add(leaves);
      return group;
    }
    case 2: {
      // Desert rock / cactus
      if (rand() > 0.5) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + rand() * 0.6, 0), new THREE.MeshStandardMaterial({ color: 0xb08a55, roughness: 1 }));
        rock.position.y = 0.3;
        rock.castShadow = true;
        return rock;
      }
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x4a8a4a }));
      trunk.position.y = 0.8;
      trunk.castShadow = true;
      group.add(trunk);
      return group;
    }
    case 3: {
      // Ice crystal
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6 + rand() * 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x9fd8f0, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 }));
      crystal.position.y = 0.8;
      crystal.rotation.z = (rand() - 0.5) * 0.3;
      crystal.castShadow = true;
      return crystal;
    }
    default: {
      // Volcanic rock spire
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.4 + rand() * 0.3, 1.8 + rand() * 1.6, 5), new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.9 }));
      spire.position.y = 0.9;
      spire.castShadow = true;
      return spire;
    }
  }
}
