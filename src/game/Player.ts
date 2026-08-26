import * as THREE from "three";
import { CharacterDef } from "./characters";
import { buildCharacterModel, CharacterRig } from "./CharacterModel";
import { scaledStat } from "./progression";
import { ARENA_RADIUS } from "./Arena";

export interface PlayerStats {
  maxHp: number;
  moveSpeed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  projectileSpeed: number;
}

export class Player {
  readonly def: CharacterDef;
  readonly rig: CharacterRig;
  readonly position = new THREE.Vector3(0, 0, 0);
  facing = 0; // radians, 0 = +z
  aimDir = new THREE.Vector2(0, 1);
  stats: PlayerStats;
  hp: number;
  level: number;
  xp = 0;
  attackTimer = 0;
  swingTimer = 0;
  walkPhase = 0;
  invulnTimer = 0;
  alive = true;

  constructor(def: CharacterDef, level: number) {
    this.def = def;
    this.level = level;
    this.rig = buildCharacterModel(def);
    this.stats = this.computeStats(level);
    this.hp = this.stats.maxHp;
  }

  computeStats(level: number): PlayerStats {
    const b = this.def.baseStats;
    return {
      maxHp: Math.round(scaledStat(b.maxHp, level, 0.09)),
      moveSpeed: b.moveSpeed,
      damage: Math.round(scaledStat(b.damage, level, 0.11)),
      attackRange: b.attackRange,
      attackCooldown: Math.max(0.18, b.attackCooldown - level * 0.005),
      projectileSpeed: b.projectileSpeed,
    };
  }

  setLevel(level: number) {
    const prevMax = this.stats.maxHp;
    this.level = level;
    this.stats = this.computeStats(level);
    this.hp = Math.min(this.stats.maxHp, this.hp + (this.stats.maxHp - prevMax));
  }

  get canAttack(): boolean {
    return this.attackTimer <= 0;
  }

  triggerAttack() {
    this.attackTimer = this.stats.attackCooldown;
    this.swingTimer = 0.22;
  }

  takeDamage(amount: number): boolean {
    if (this.invulnTimer > 0 || !this.alive) return false;
    this.hp -= amount;
    this.invulnTimer = 0.35;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return true;
  }

  respawn() {
    this.hp = this.stats.maxHp;
    this.alive = true;
    this.position.set(0, 0, 0);
    this.invulnTimer = 1;
  }

  update(dt: number, moveVec: THREE.Vector2, aimVec: THREE.Vector2 | null) {
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.swingTimer = Math.max(0, this.swingTimer - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);

    const moving = moveVec.lengthSq() > 0.0001;
    if (moving) {
      const norm = moveVec.clone().normalize();
      this.position.x += norm.x * this.stats.moveSpeed * dt;
      this.position.z += norm.y * this.stats.moveSpeed * dt;
      const dist = Math.hypot(this.position.x, this.position.z);
      if (dist > ARENA_RADIUS - 1) {
        const scale = (ARENA_RADIUS - 1) / dist;
        this.position.x *= scale;
        this.position.z *= scale;
      }
      this.walkPhase += dt * 9;
      if (!aimVec) this.facing = Math.atan2(norm.x, norm.y);
    }

    if (aimVec && aimVec.lengthSq() > 0.0001) {
      const n = aimVec.clone().normalize();
      this.aimDir.copy(n);
      this.facing = Math.atan2(n.x, n.y);
    }

    this.rig.root.position.set(this.position.x, 0, this.position.z);
    this.rig.root.rotation.y = this.facing;

    const bob = moving ? Math.abs(Math.sin(this.walkPhase)) * 0.05 : 0;
    this.rig.bodyGroup.position.y = 0.95 + bob;
    const legSwing = moving ? Math.sin(this.walkPhase) * 0.5 : 0;
    this.rig.legL.rotation.x = legSwing;
    this.rig.legR.rotation.x = -legSwing;

    const swingProgress = this.swingTimer > 0 ? 1 - this.swingTimer / 0.22 : 0;
    if (this.swingTimer > 0) {
      const swingAngle = Math.sin(swingProgress * Math.PI) * (this.def.weaponKind === "ranged" ? 0.5 : 1.6);
      this.rig.armR.rotation.x = -swingAngle;
    } else {
      this.rig.armR.rotation.x = THREE.MathUtils.lerp(this.rig.armR.rotation.x, 0, dt * 8);
    }

    const flash = this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0;
    this.rig.root.visible = this.alive && !flash;
  }

  getMuzzleWorldPosition(): THREE.Vector3 {
    const v = new THREE.Vector3();
    this.rig.weaponPivot.getWorldPosition(v);
    return v;
  }
}
