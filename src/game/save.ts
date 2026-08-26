import { CharacterId } from "./characters";

export interface CharacterSave {
  level: number;
  xp: number;
  kills: number;
}

export interface GameSave {
  version: 1;
  selectedCharacter: CharacterId | null;
  characters: Partial<Record<CharacterId, CharacterSave>>;
}

const STORAGE_KEY = "super-gun-save-v1";

function defaultCharacterSave(): CharacterSave {
  return { level: 1, xp: 0, kills: 0 };
}

function emptySave(): GameSave {
  return { version: 1, selectedCharacter: null, characters: {} };
}

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as GameSave;
    if (!parsed.characters) parsed.characters = {};
    return parsed;
  } catch {
    return emptySave();
  }
}

export function saveSave(save: GameSave) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCharacterSave(save: GameSave, id: CharacterId): CharacterSave {
  return save.characters[id] ?? defaultCharacterSave();
}

export function setCharacterSave(save: GameSave, id: CharacterId, characterSave: CharacterSave) {
  save.characters[id] = characterSave;
  saveSave(save);
}

export function resetSave(): GameSave {
  const fresh = emptySave();
  saveSave(fresh);
  return fresh;
}
