/** XP required to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  return Math.round(40 * Math.pow(level, 1.35) + 30);
}

export interface LevelUpResult {
  level: number;
  xp: number;
  leveledUp: boolean;
  levelsGained: number;
}

export function addXp(level: number, xp: number, gained: number): LevelUpResult {
  let newLevel = level;
  let newXp = xp + gained;
  let levelsGained = 0;
  while (newXp >= xpToNextLevel(newLevel)) {
    newXp -= xpToNextLevel(newLevel);
    newLevel += 1;
    levelsGained += 1;
  }
  return { level: newLevel, xp: newXp, leveledUp: levelsGained > 0, levelsGained };
}

/** Scales a character's base stat by level. */
export function scaledStat(base: number, level: number, growth = 0.08): number {
  return base * (1 + growth * (level - 1));
}

export const XP_PER_KILL_BASE = 18;
