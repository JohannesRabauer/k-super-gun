import * as THREE from "three";
import { CharacterDef } from "./characters";

export interface CharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group; // used for vertical bob
  headGroup: THREE.Group;
  armR: THREE.Group; // shoulder pivot, rotate for attack swing / aim
  weaponPivot: THREE.Group; // weapon mesh sits here, tip roughly at +z
  legL: THREE.Mesh;
  legR: THREE.Mesh;
}

function makeLimbMaterial(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
}

/** Builds a stylized low-poly animal fighter, matching the character's theme. */
export function buildCharacterModel(def: CharacterDef): CharacterRig {
  const root = new THREE.Group();
  root.name = `char-${def.id}`;

  const bodyMat = makeLimbMaterial(def.bodyColor);
  const accentMat = makeLimbMaterial(def.accentColor);
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.95;
  root.add(bodyGroup);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 4, 8), bodyMat);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.62;
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bodyMat);
  head.castShadow = true;
  headGroup.add(head);

  // Snout (all characters get a small muzzle for a friendly animal look)
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), bodyMat);
  snout.position.set(0, -0.05, 0.26);
  snout.scale.set(1, 0.8, 0.9);
  headGroup.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), darkMat);
  nose.position.set(0, -0.02, 0.38);
  headGroup.add(nose);

  // Eyes
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), darkMat);
    eye.position.set(0.13 * side, 0.06, 0.26);
    headGroup.add(eye);
  }

  addCharacterFlair(def, headGroup, bodyGroup, accentMat, darkMat);

  // Arms
  const armL = new THREE.Group();
  armL.position.set(-0.42, 0.28, 0);
  bodyGroup.add(armL);
  const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.36, 4, 6), bodyMat);
  armLMesh.position.y = -0.2;
  armLMesh.castShadow = true;
  armL.add(armLMesh);

  const armR = new THREE.Group();
  armR.position.set(0.42, 0.28, 0);
  bodyGroup.add(armR);
  const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.36, 4, 6), bodyMat);
  armRMesh.position.y = -0.2;
  armRMesh.castShadow = true;
  armR.add(armRMesh);

  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0, -0.4, 0.05);
  armR.add(weaponPivot);
  buildWeapon(def, weaponPivot, accentMat, darkMat);

  // Legs
  const legMat = makeLimbMaterial(0x2c2c34);
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.42, 4, 6), legMat);
  legL.position.set(-0.16, 0.24, 0);
  legL.castShadow = true;
  root.add(legL);

  const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.42, 4, 6), legMat);
  legR.position.set(0.16, 0.24, 0);
  legR.castShadow = true;
  root.add(legR);

  return { root, bodyGroup, headGroup, armR, weaponPivot, legL, legR };
}

function addCharacterFlair(
  def: CharacterDef,
  headGroup: THREE.Group,
  bodyGroup: THREE.Group,
  accentMat: THREE.Material,
  darkMat: THREE.Material
) {
  switch (def.id) {
    case "panda": {
      // Black ears
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), darkMat);
        ear.position.set(0.22 * side, 0.24, -0.05);
        headGroup.add(ear);
      }
      // Black eye patches
      for (const side of [-1, 1]) {
        const patch = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), darkMat);
        patch.position.set(0.14 * side, 0.07, 0.23);
        patch.scale.set(1, 1.3, 0.6);
        headGroup.add(patch);
      }
      // Japanese straw hat (kasa)
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xd8b872, roughness: 0.9 }));
      hat.position.set(0, 0.34, 0);
      headGroup.add(hat);
      const hatTip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a30 }));
      hatTip.position.set(0, 0.42, 0);
      headGroup.add(hatTip);
      break;
    }
    case "puma": {
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 8), (headGroup.children[0] as THREE.Mesh).material as THREE.Material);
        ear.position.set(0.2 * side, 0.28, -0.02);
        headGroup.add(ear);
      }
      // Knight helmet
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshStandardMaterial({ color: 0x8b95a5, roughness: 0.35, metalness: 0.7 }));
      helmet.position.y = 0.02;
      headGroup.add(helmet);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.1), new THREE.MeshStandardMaterial({ color: 0x50586b, metalness: 0.6, roughness: 0.4 }));
      visor.position.set(0, 0.08, 0.27);
      headGroup.add(visor);
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0xdb3b3b }));
      plume.position.set(0, 0.38, -0.05);
      headGroup.add(plume);
      break;
    }
    case "koala": {
      // Big fluffy ears
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), (headGroup.children[0] as THREE.Mesh).material as THREE.Material);
        ear.position.set(0.28 * side, 0.16, -0.05);
        headGroup.add(ear);
      }
      // Headband with K
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 16, Math.PI), accentMat);
      band.rotation.x = Math.PI / 2;
      band.rotation.z = Math.PI;
      band.position.set(0, 0.22, 0.02);
      headGroup.add(band);
      const kBadge = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), new THREE.MeshStandardMaterial({ color: 0xffe066 }));
      kBadge.position.set(0, 0.24, 0.3);
      headGroup.add(kBadge);
      const kMark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.01), darkMat);
      kMark.position.set(0, 0.24, 0.315);
      headGroup.add(kMark);
      // Superhero cape
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshStandardMaterial({ color: 0xd62f2f, side: THREE.DoubleSide, roughness: 0.8 }));
      cape.position.set(0, 0.1, -0.32);
      cape.rotation.x = 0.25;
      bodyGroup.add(cape);
      break;
    }
    case "biber": {
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), (headGroup.children[0] as THREE.Mesh).material as THREE.Material);
        ear.position.set(0.24 * side, 0.22, -0.02);
        headGroup.add(ear);
      }
      // Front teeth
      const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0xfff2c0 }));
      teeth.position.set(0, -0.14, 0.36);
      headGroup.add(teeth);
      // Purple cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), accentMat);
      cap.position.y = 0.06;
      headGroup.add(cap);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16, 1, false, -0.5, Math.PI + 1), accentMat);
      brim.position.set(0, 0.06, 0.18);
      brim.rotation.x = 0.1;
      headGroup.add(brim);
      const capBadge = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshStandardMaterial({ color: 0x8a5a34 }));
      capBadge.position.set(0, 0.14, 0.32);
      headGroup.add(capBadge);
      // Flat tail
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.34), (headGroup.children[0] as THREE.Mesh).material as THREE.Material);
      tail.position.set(0, -0.35, -0.4);
      bodyGroup.add(tail);
      break;
    }
    case "schwein": {
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.1, 8), (headGroup.children[0] as THREE.Mesh).material as THREE.Material);
        ear.position.set(0.22 * side, 0.26, 0.05);
        ear.rotation.z = 0.3 * side;
        headGroup.add(ear);
      }
      // Ninja mask band across eyes
      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.32), darkMat);
      mask.position.set(0, 0.07, 0.02);
      headGroup.add(mask);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), darkMat);
      knot.position.set(-0.25, 0.09, -0.15);
      headGroup.add(knot);
      // Curly tail
      const tail = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 12), (headGroup.children[0] as THREE.Mesh).material as THREE.Material);
      tail.position.set(0, 0, -0.38);
      bodyGroup.add(tail);
      break;
    }
  }
}

function buildWeapon(def: CharacterDef, pivot: THREE.Group, accentMat: THREE.Material, darkMat: THREE.Material) {
  switch (def.id) {
    case "panda": {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x8fbf5a, roughness: 0.6 }));
      stick.rotation.x = Math.PI / 2.1;
      stick.position.z = 0.3;
      pivot.add(stick);
      break;
    }
    case "puma": {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 6, 16, Math.PI * 1.3), new THREE.MeshStandardMaterial({ color: 0x6b4a2b }));
      bow.rotation.y = Math.PI / 2;
      bow.position.set(0.08, 0, 0.05);
      pivot.add(bow);
      break;
    }
    case "koala": {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2b }));
      handle.rotation.x = Math.PI / 2.3;
      handle.position.z = 0.25;
      pivot.add(handle);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 4), new THREE.MeshStandardMaterial({ color: 0x9aa5b1, metalness: 0.5, roughness: 0.4 }));
      head.rotation.x = Math.PI;
      head.position.set(0, 0.02, 0.62);
      pivot.add(head);
      break;
    }
    case "biber": {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.6), new THREE.MeshStandardMaterial({ color: 0xb98a52, roughness: 0.7 }));
      blade.position.z = 0.35;
      // bite mark
      const bite = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8a5a34 }));
      bite.position.set(0.05, 0, 0.55);
      pivot.add(blade, bite);
      break;
    }
    case "schwein": {
      const stick1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), darkMat);
      stick1.position.z = 0.15;
      const stick2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), darkMat);
      stick2.position.z = 0.5;
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8 }));
      chain.position.z = 0.325;
      chain.rotation.x = Math.PI / 2;
      pivot.add(stick1, stick2, chain);
      break;
    }
  }
}
