import * as THREE from "three";

export function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

class Joystick {
  private base: HTMLElement;
  private knob: HTMLElement;
  private pointerId: number | null = null;
  private radius = 46;
  vector = new THREE.Vector2(0, 0); // x = world dx (screen-right), y = world dz (screen-away-from-camera), magnitude 0..1
  active = false;

  constructor(baseEl: HTMLElement) {
    this.base = baseEl;
    this.knob = baseEl.querySelector(".joystick-knob") as HTMLElement;
    this.base.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
  }

  private onDown = (e: PointerEvent) => {
    this.pointerId = e.pointerId;
    this.active = true;
    this.base.setPointerCapture?.(e.pointerId);
    this.updateFromEvent(e);
    e.preventDefault();
  };

  private onMove = (e: PointerEvent) => {
    if (this.pointerId !== e.pointerId) return;
    this.updateFromEvent(e);
  };

  private onUp = (e: PointerEvent) => {
    if (this.pointerId !== e.pointerId) return;
    this.pointerId = null;
    this.active = false;
    this.vector.set(0, 0);
    this.knob.style.transform = `translate(-50%, -50%)`;
  };

  private updateFromEvent(e: PointerEvent) {
    const rect = this.base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.radius);
    if (dist > 0) {
      dx = (dx / dist) * clamped;
      dy = (dy / dist) * clamped;
    }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / this.radius;
    const ny = dy / this.radius;
    // The camera looks toward -Z, so screen-up (negative dy) must map to world -Z, i.e. no sign flip.
    this.vector.set(nx, ny);
  }
}

export interface FrameInput {
  move: THREE.Vector2;
  aim: THREE.Vector2 | null;
  firing: boolean;
}

export class InputController {
  private keys = new Set<string>();
  private mouseDown = false;
  private mouseNDC = new THREE.Vector2(0, 0);
  private touch: boolean;
  private moveStick?: Joystick;
  private aimStick?: Joystick;

  constructor(
    private canvas: HTMLCanvasElement,
    moveEl: HTMLElement,
    aimEl: HTMLElement
  ) {
    this.touch = isTouchDevice();
    if (this.touch) {
      document.body.classList.add("touch-controls");
      this.moveStick = new Joystick(moveEl);
      this.aimStick = new Joystick(aimEl);
    } else {
      window.addEventListener("keydown", (e) => this.keys.add(e.key.toLowerCase()));
      window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
      canvas.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") this.mouseDown = true;
      });
      window.addEventListener("pointerup", () => (this.mouseDown = false));
      window.addEventListener("pointermove", (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouseNDC.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      });
    }
  }

  get isTouch() {
    return this.touch;
  }

  get mouseNdcPosition() {
    return this.mouseNDC;
  }

  get isMouseFiring() {
    return this.mouseDown;
  }

  readFrame(): FrameInput {
    if (this.touch) {
      const move = this.moveStick!.vector.clone();
      const aim = this.aimStick!.active ? this.aimStick!.vector.clone() : null;
      return { move, aim, firing: this.aimStick!.active };
    }
    let mx = 0;
    let my = 0;
    // The camera looks toward -Z, so "forward" (W / up) must move along world -Z.
    if (this.keys.has("w") || this.keys.has("arrowup")) my -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) my += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) mx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) mx += 1;
    return { move: new THREE.Vector2(mx, my), aim: null, firing: this.mouseDown };
  }
}
