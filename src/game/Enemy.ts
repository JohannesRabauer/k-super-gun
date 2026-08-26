import * as THREE from "three";
import { buildEnemyModel, EnemyRig } from "./EnemyModel";

export interface EnemyConfig {
  maxHp: number;
  damage: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldown: number;
  xpReward: number;
  tier: number;
}

let nextId = 1;

export class Enemy {
  readonly id = nextId++;
  readonly rig: EnemyRig;
  readonly position = new THREE.Vector3();
  readonly config: EnemyConfig;
  hp: number;
  attackTimer: number;
  walkPhase = Math.random() * 10;
  alive = true;
  hitFlash = 0;
  spawnGrace = 0.4;

  constructor(config: EnemyConfig, spawnPos: THREE.Vector3) {
    this.config = config;
    this.rig = buildEnemyModel(config.tier);
    this.hp = config.maxHp;
    this.position.copy(spawnPos);
    this.attackTimer = config.attackCooldown * 0.5;
    this.rig.root.position.set(spawnPos.x, 0, spawnPos.z);
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  /** Moves toward target, returns true if in range to attack this frame (cooldown-gated). */
  update(dt: number, targetPos: THREE.Vector3): "none" | "attack" {
    this.spawnGrace = Math.max(0, this.spawnGrace - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    const toTarget = new THREE.Vector2(targetPos.x - this.position.x, targetPos.z - this.position.z);
    const dist = toTarget.length();
    let attacking = false;

    if (dist > 0.001) {
      const facing = Math.atan2(toTarget.x, toTarget.y);
      this.rig.root.rotation.y = THREE.MathUtils.lerp(this.rig.root.rotation.y, facing, 0.2);
    }

    if (dist > this.config.attackRange * 0.85 && this.spawnGrace <= 0) {
      const dir = toTarget.normalize();
      this.position.x += dir.x * this.config.moveSpeed * dt;
      this.position.z += dir.y * this.config.moveSpeed * dt;
      this.walkPhase += dt * 8;
    } else if (dist <= this.config.attackRange && this.attackTimer <= 0) {
      this.attackTimer = this.config.attackCooldown;
      attacking = true;
      this.rig.armR.rotation.x = -1.4;
    }

    this.rig.root.position.set(this.position.x, 0, this.position.z);
    const bob = Math.abs(Math.sin(this.walkPhase)) * 0.04;
    this.rig.bodyGroup.position.y = 0.95 + bob;
    const legSwing = Math.sin(this.walkPhase) * 0.45;
    this.rig.legL.rotation.x = legSwing;
    this.rig.legR.rotation.x = -legSwing;
    this.rig.armR.rotation.x = THREE.MathUtils.lerp(this.rig.armR.rotation.x, 0, dt * 5);

    const mat = (this.rig.bodyGroup.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    mat.emissive?.setRGB(this.hitFlash > 0 ? 1 : 0, 0, 0);

    return attacking ? "attack" : "none";
  }
}

export function makeEnemyConfig(baseHp: number, baseDmg: number, hpMult: number, dmgMult: number, tier: number): EnemyConfig {
  return {
    maxHp: Math.round(baseHp * hpMult),
    damage: Math.round(baseDmg * dmgMult),
    moveSpeed: 3.1 + tier * 0.25,
    attackRange: 1.7,
    attackCooldown: 1.1,
    xpReward: Math.round(16 * hpMult),
    tier,
  };
}
