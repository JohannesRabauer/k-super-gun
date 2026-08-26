import * as THREE from "three";
import { CharacterDef } from "./characters";
import { AreaDef, AREAS } from "./areas";
import { Player } from "./Player";
import { Enemy, makeEnemyConfig } from "./Enemy";
import { buildArena, ARENA_RADIUS, ArenaHandle } from "./Arena";
import { createProjectile, Projectile } from "./Projectile";
import { InputController } from "./Input";
import { addXp, xpToNextLevel } from "./progression";

export interface GameCallbacks {
  onHp: (hp: number, max: number) => void;
  onXp: (level: number, xp: number, xpToNext: number) => void;
  onLevelUp: (level: number) => void;
  onAreaUnlock: (area: AreaDef) => void;
  onWaveInfo: (aliveCount: number, waveNumber: number) => void;
  onDeath: (runXp: number, runKills: number) => void;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  character: CharacterDef;
  level: number;
  xp: number;
  area: AreaDef;
  moveEl: HTMLElement;
  aimEl: HTMLElement;
  callbacks: GameCallbacks;
}

const CAMERA_OFFSET = new THREE.Vector3(0, 15.5, 11.5);
const BASE_ENEMY_HP = 42;
const BASE_ENEMY_DMG = 7;
const AUTO_AIM_MAX_ANGLE = THREE.MathUtils.degToRad(28);

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private input: InputController;
  private arenaHandle: ArenaHandle;
  private player: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private raycastPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private raycaster = new THREE.Raycaster();
  private area: AreaDef;
  private wave = 1;
  private waveClearTimer = 0;
  private runXp = 0;
  private runKills = 0;
  private paused = false;
  private disposed = false;
  private frameHandle = 0;
  private callbacks: GameCallbacks;

  constructor(opts: GameOptions) {
    this.callbacks = opts.callbacks;
    this.area = opts.area;

    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

    this.arenaHandle = buildArena(this.area, this.scene);

    this.player = new Player(opts.character, opts.level);
    this.player.xp = opts.xp;
    this.scene.add(this.player.rig.root);

    this.input = new InputController(opts.canvas, opts.moveEl, opts.aimEl);

    this.spawnWave();
    this.resize();
    window.addEventListener("resize", this.resize);

    this.reportHp();
    this.reportXp();
  }

  private get playerXp(): number {
    return this.player.xp;
  }
  private set playerXp(v: number) {
    this.player.xp = v;
  }

  private resize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private spawnWave() {
    const count = this.area.enemyCountBase + Math.floor(this.wave / 2) + Math.floor((this.player.level - 1) / 3);
    const tier = Math.min(3, this.area.id - 1 + Math.floor(this.wave / 4));
    const hpMult = this.area.enemyHpMult * (1 + (this.wave - 1) * 0.12);
    const dmgMult = this.area.enemyDmgMult * (1 + (this.wave - 1) * 0.06);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const radius = ARENA_RADIUS - 2.5;
      const pos = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      const config = makeEnemyConfig(BASE_ENEMY_HP, BASE_ENEMY_DMG, hpMult, dmgMult, tier);
      const enemy = new Enemy(config, pos);
      this.enemies.push(enemy);
      this.scene.add(enemy.rig.root);
    }
    this.callbacks.onWaveInfo(this.enemies.length, this.wave);
  }

  start() {
    this.clock.start();
    this.loop();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.clock.getDelta();
    this.paused = false;
  }

  get isPaused() {
    return this.paused;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameHandle);
    window.removeEventListener("resize", this.resize);
    this.arenaHandle.dispose();
    this.renderer.dispose();
  }

  private loop = () => {
    if (this.disposed) return;
    this.frameHandle = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.paused) {
      this.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
  };

  private computeAim(frameAim: THREE.Vector2 | null): THREE.Vector2 | null {
    if (frameAim) {
      if (frameAim.lengthSq() < 0.06) return null;
      return this.applyAutoAim(frameAim);
    }
    // desktop: raycast mouse against ground plane
    this.raycaster.setFromCamera(this.input.mouseNdcPosition, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.raycastPlane, hit)) return null;
    const dx = hit.x - this.player.position.x;
    const dz = hit.z - this.player.position.z;
    if (dx * dx + dz * dz < 0.01) return null;
    return new THREE.Vector2(dx, dz).normalize();
  }

  /** Snaps the aim direction toward the nearest enemy within a cone, for easier mobile aiming. */
  private applyAutoAim(rawAim: THREE.Vector2): THREE.Vector2 {
    const rawAngle = Math.atan2(rawAim.x, rawAim.y);
    let best: Enemy | null = null;
    let bestAngleDiff = AUTO_AIM_MAX_ANGLE;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.position.x - this.player.position.x;
      const dz = e.position.z - this.player.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 14) continue;
      const angle = Math.atan2(dx, dz);
      let diff = Math.abs(angle - rawAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < bestAngleDiff) {
        bestAngleDiff = diff;
        best = e;
      }
    }
    if (!best) return rawAim.clone().normalize();
    const dx = best.position.x - this.player.position.x;
    const dz = best.position.z - this.player.position.z;
    return new THREE.Vector2(dx, dz).normalize();
  }

  private update(dt: number) {
    const frame = this.input.readFrame();
    const aim = this.computeAim(frame.aim);

    if (this.player.alive) {
      this.player.update(dt, frame.move, aim);

      const firing = this.input.isTouch ? frame.firing : this.input.isMouseFiring;
      if (firing && aim && this.player.canAttack) {
        this.performPlayerAttack(aim);
      }
    }

    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateCamera(dt);
    this.checkWaveClear(dt);

    this.reportHp();
  }

  private performPlayerAttack(aim: THREE.Vector2) {
    this.player.triggerAttack();
    const stats = this.player.stats;
    if (this.player.def.weaponKind === "ranged") {
      const origin = this.player.getMuzzleWorldPosition();
      const dir3 = new THREE.Vector3(aim.x, 0, aim.y);
      this.projectiles.push(createProjectile(origin, dir3, stats.projectileSpeed, stats.damage, true));
    } else {
      const angle = Math.atan2(aim.x, aim.y);
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.position.x - this.player.position.x;
        const dz = enemy.position.z - this.player.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > stats.attackRange) continue;
        const enemyAngle = Math.atan2(dx, dz);
        let diff = Math.abs(enemyAngle - angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < THREE.MathUtils.degToRad(60)) {
          this.damageEnemy(enemy, stats.damage);
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const result = enemy.update(dt, this.player.position);
      if (result === "attack" && this.player.alive) {
        const hit = this.player.takeDamage(enemy.config.damage);
        if (hit && this.player.hp <= 0) {
          this.onPlayerDeath();
        }
      }
    }
    // cleanup dead enemies from scene after a short delay handled inline (immediate removal is fine visually)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive && e.hitFlash <= 0) {
        this.scene.remove(e.rig.root);
        this.enemies.splice(i, 1);
      }
    }
  }

  private damageEnemy(enemy: Enemy, dmg: number) {
    const died = enemy.takeDamage(dmg);
    if (died) {
      this.runKills += 1;
      this.grantXp(enemy.config.xpReward);
    }
  }

  private grantXp(amount: number) {
    this.runXp += amount;
    const prevLevel = this.player.level;
    const result = addXp(this.player.level, this.playerXp, amount);
    this.playerXp = result.xp;
    if (result.leveledUp) {
      this.player.setLevel(result.level);
      this.callbacks.onLevelUp(result.level);
      for (const area of AREAS) {
        if (area.requiredLevel > prevLevel && area.requiredLevel <= result.level) {
          this.callbacks.onAreaUnlock(area);
        }
      }
    }
    this.reportXp();
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;
      if (p.mesh.parent !== this.scene) this.scene.add(p.mesh);

      let hit = false;
      if (p.fromPlayer) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dist = p.mesh.position.distanceTo(new THREE.Vector3(enemy.position.x, 1, enemy.position.z));
          if (dist < p.radius + 0.5) {
            this.damageEnemy(enemy, p.damage);
            hit = true;
            break;
          }
        }
      }

      const dist2 = Math.hypot(p.mesh.position.x, p.mesh.position.z);
      if (hit || p.life <= 0 || dist2 > ARENA_RADIUS + 2) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private checkWaveClear(dt: number) {
    if (this.enemies.length === 0) {
      this.waveClearTimer += dt;
      if (this.waveClearTimer > 1.6) {
        this.waveClearTimer = 0;
        this.wave += 1;
        this.spawnWave();
      }
    }
  }

  private updateCamera(dt: number) {
    const target = new THREE.Vector3(this.player.position.x, 0, this.player.position.z).add(CAMERA_OFFSET);
    this.camera.position.lerp(target, Math.min(1, dt * 5));
    const lookTarget = new THREE.Vector3(this.player.position.x, 1, this.player.position.z);
    this.camera.lookAt(lookTarget);
  }

  private reportHp() {
    this.callbacks.onHp(Math.max(0, Math.round(this.player.hp)), this.player.stats.maxHp);
  }

  private reportXp() {
    const need = xpToNextLevel(this.player.level);
    this.callbacks.onXp(this.player.level, Math.round(this.playerXp), need);
  }

  private onPlayerDeath() {
    this.pause();
    this.callbacks.onDeath(this.runXp, this.runKills);
  }

  respawnPlayer() {
    this.player.respawn();
    this.resume();
  }

  getSnapshot() {
    return { level: this.player.level, xp: this.playerXp, runKills: this.runKills };
  }
}
