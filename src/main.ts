import "./style.css";
import { CHARACTERS, CharacterDef } from "./game/characters";
import { AREAS, AreaDef } from "./game/areas";
import { loadSave, saveSave, getCharacterSave, setCharacterSave, resetSave, GameSave } from "./game/save";
import { Game } from "./game/Game";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const screenSelect = $("screen-select");
const screenAreas = $("screen-areas");
const screenPause = $("screen-pause");
const screenDeath = $("screen-death");
const hud = $("hud");
const characterGrid = $("character-grid");
const areaGrid = $("area-grid");
const saveInfo = $("save-info");
const btnStart = $<HTMLButtonElement>("btn-start");
const btnReset = $("btn-reset");
const btnBackToSelect = $("btn-back-to-select");
const btnPause = $("btn-pause");
const btnResume = $("btn-resume");
const btnQuit = $("btn-quit");
const btnRespawn = $("btn-respawn");
const btnDeathQuit = $("btn-death-quit");
const deathInfo = $("death-info");
const hpFill = $("hp-fill");
const hpLabel = $("hp-label");
const xpFill = $("xp-fill");
const xpLabel = $("xp-label");
const hudCharIcon = $("hud-char-icon");
const hudAreaName = $("hud-area-name");
const hudWaveInfo = $("hud-wave-info");
const levelupToast = $("levelup-toast");
const levelupNum = $("levelup-num");
const unlockToast = $("unlock-toast");
const canvas = $<HTMLCanvasElement>("scene");
const joystickMove = $("joystick-move");
const joystickAim = $("joystick-aim");

let save: GameSave = loadSave();
let selectedCharacter: CharacterDef | null = null;
let game: Game | null = null;

const ALL_SCREENS = [screenSelect, screenAreas, screenPause, screenDeath];

function hideAllScreens() {
  for (const s of ALL_SCREENS) s.classList.add("hidden");
}

function showScreen(el: HTMLElement) {
  hideAllScreens();
  el.classList.remove("hidden");
}

// ===================== Character Select =====================

function renderCharacterGrid() {
  characterGrid.innerHTML = "";
  for (const c of CHARACTERS) {
    const cs = getCharacterSave(save, c.id);
    const card = document.createElement("div");
    card.className = "char-card";
    card.style.setProperty("--accent", c.accent);
    if (selectedCharacter?.id === c.id) card.classList.add("selected");
    card.innerHTML = `
      <div class="char-lvl-badge">LVL ${cs.level}</div>
      <div class="char-emoji">${c.emoji}</div>
      <div class="char-name">${c.name}</div>
      <div class="char-weapon">${c.weaponName}</div>
      <div class="char-stats">
        <span>❤️ ${Math.round(c.baseStats.maxHp)}</span>
        <span>⚔️ ${Math.round(c.baseStats.damage)}</span>
        <span>${c.weaponKind === "ranged" ? "🏹 Fern" : "🥊 Nah"}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectedCharacter = c;
      save.selectedCharacter = c.id;
      saveSave(save);
      renderCharacterGrid();
      btnStart.disabled = false;
    });
    characterGrid.appendChild(card);
  }
}

function initSelectScreen() {
  if (save.selectedCharacter) {
    selectedCharacter = CHARACTERS.find((c) => c.id === save.selectedCharacter) ?? null;
  }
  renderCharacterGrid();
  btnStart.disabled = !selectedCharacter;
  const totalKills = Object.values(save.characters).reduce((sum, c) => sum + (c?.kills ?? 0), 0);
  saveInfo.textContent = totalKills > 0 ? `Gesamt besiegte Gegner: ${totalKills}` : "Willkommen bei Super Gun!";
}

btnStart.addEventListener("click", () => {
  if (!selectedCharacter) return;
  renderAreaGrid();
  showScreen(screenAreas);
});

btnReset.addEventListener("click", () => {
  if (!confirm("Spielstand wirklich zurücksetzen? Alle Level gehen verloren.")) return;
  save = resetSave();
  selectedCharacter = null;
  btnStart.disabled = true;
  initSelectScreen();
});

btnBackToSelect.addEventListener("click", () => {
  showScreen(screenSelect);
  initSelectScreen();
});

// ===================== Area Select =====================

function renderAreaGrid() {
  if (!selectedCharacter) return;
  const cs = getCharacterSave(save, selectedCharacter.id);
  areaGrid.innerHTML = "";
  for (const area of AREAS) {
    const unlocked = cs.level >= area.requiredLevel;
    const card = document.createElement("div");
    card.className = "area-card" + (unlocked ? "" : " locked");
    card.innerHTML = `
      <div class="area-swatch" style="background:${area.swatch}"></div>
      <div class="area-title">Bereich ${area.id}</div>
      <div class="area-title" style="font-size:0.85rem;font-weight:600;color:#cfd6e6;">${area.name}</div>
      <div class="area-req">${unlocked ? "Freigeschaltet" : `Ab Level ${area.requiredLevel}`}</div>
    `;
    if (unlocked) {
      card.addEventListener("click", () => startGame(area));
    }
    areaGrid.appendChild(card);
  }
}

// ===================== Game lifecycle =====================

function startGame(area: AreaDef) {
  if (!selectedCharacter) return;
  const cs = getCharacterSave(save, selectedCharacter.id);

  hideAllScreens();
  hud.classList.remove("hidden");
  hudCharIcon.textContent = selectedCharacter.emoji;
  hudAreaName.textContent = `Bereich ${area.id}: ${area.name}`;

  game?.dispose();
  lastPersistedRunKills = 0;
  game = new Game({
    canvas,
    character: selectedCharacter,
    level: cs.level,
    xp: cs.xp,
    area,
    moveEl: joystickMove,
    aimEl: joystickAim,
    callbacks: {
      onHp(hp, max) {
        hpFill.style.width = `${(hp / max) * 100}%`;
        hpLabel.textContent = `${hp}/${max}`;
      },
      onXp(level, xp, need) {
        xpFill.style.width = `${Math.min(100, (xp / need) * 100)}%`;
        xpLabel.textContent = `LVL ${level}`;
        persistProgress();
      },
      onLevelUp(level) {
        levelupNum.textContent = String(level);
        retrigger(levelupToast);
        persistProgress();
      },
      onAreaUnlock(area) {
        unlockToast.textContent = `🔓 Bereich ${area.id} "${area.name}" freigeschaltet!`;
        retrigger(unlockToast);
      },
      onWaveInfo(aliveCount, wave) {
        hudWaveInfo.textContent = `Welle ${wave} · Gegner: ${aliveCount}`;
      },
      onDeath(runXp, runKills) {
        persistProgress();
        deathInfo.textContent = `Diese Runde: +${runXp} EP, ${runKills} Gegner besiegt.`;
        showScreen(screenDeath);
      },
    },
  });
  game.start();
}

function retrigger(el: HTMLElement) {
  el.classList.add("hidden");
  // force reflow so the animation restarts
  void el.offsetWidth;
  el.classList.remove("hidden");
}

let lastPersistedRunKills = 0;

function persistProgress() {
  if (!game || !selectedCharacter) return;
  const snap = game.getSnapshot();
  const cs = getCharacterSave(save, selectedCharacter.id);
  const newKills = snap.runKills - lastPersistedRunKills;
  lastPersistedRunKills = snap.runKills;
  setCharacterSave(save, selectedCharacter.id, { level: snap.level, xp: snap.xp, kills: cs.kills + Math.max(0, newKills) });
}

function endGameToMenu() {
  game?.dispose();
  game = null;
  hud.classList.add("hidden");
  showScreen(screenSelect);
  initSelectScreen();
}

// ===================== Pause / Death =====================

btnPause.addEventListener("click", () => {
  if (!game) return;
  game.pause();
  showScreen(screenPause);
});

btnResume.addEventListener("click", () => {
  screenPause.classList.add("hidden");
  game?.resume();
});

btnQuit.addEventListener("click", () => {
  persistProgress();
  endGameToMenu();
});

btnRespawn.addEventListener("click", () => {
  screenDeath.classList.add("hidden");
  game?.respawnPlayer();
});

btnDeathQuit.addEventListener("click", () => {
  endGameToMenu();
});

window.addEventListener("beforeunload", () => {
  persistProgress();
});

// ===================== Orientation hint (mobile portrait) =====================

const orientationHint = $("orientation-hint");
function updateOrientationHint() {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const portrait = window.innerHeight > window.innerWidth;
  const inGame = !hud.classList.contains("hidden");
  orientationHint.classList.toggle("hidden", !(isTouch && portrait && inGame));
}
window.addEventListener("resize", updateOrientationHint);
setInterval(updateOrientationHint, 800);

// ===================== Boot =====================

initSelectScreen();
