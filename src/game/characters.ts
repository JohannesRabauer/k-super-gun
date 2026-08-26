export type CharacterId = "panda" | "puma" | "koala" | "biber" | "schwein";

export type WeaponKind = "melee" | "ranged";

export interface CharacterDef {
  id: CharacterId;
  name: string;
  emoji: string;
  weaponName: string;
  weaponKind: WeaponKind;
  description: string;
  /** Primary body color */
  bodyColor: number;
  /** Secondary / accessory color */
  accentColor: number;
  accent: string; // CSS color for UI accent
  baseStats: {
    maxHp: number;
    moveSpeed: number;
    damage: number;
    attackRange: number;
    attackCooldown: number; // seconds between attacks
    projectileSpeed: number;
  };
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "panda",
    name: "Panda",
    emoji: "🐼",
    weaponName: "Bambusstab",
    weaponKind: "melee",
    description: "Trägt einen japanischen Hut und kämpft mit einem starken Bambusstab.",
    bodyColor: 0xf5f5f5,
    accentColor: 0x222222,
    accent: "#e8e8e8",
    baseStats: { maxHp: 130, moveSpeed: 5.2, damage: 18, attackRange: 2.6, attackCooldown: 0.55, projectileSpeed: 16 },
  },
  {
    id: "puma",
    name: "Puma",
    emoji: "🐆",
    weaponName: "Pfeil & Bogen",
    weaponKind: "ranged",
    description: "Trägt einen coolen Ritterhelm und greift mit Pfeil und Bogen aus der Ferne an.",
    bodyColor: 0xd9a15c,
    accentColor: 0x6b7280,
    accent: "#e0b06a",
    baseStats: { maxHp: 95, moveSpeed: 5.6, damage: 16, attackRange: 11, attackCooldown: 0.7, projectileSpeed: 24 },
  },
  {
    id: "koala",
    name: "Koala",
    emoji: "🐨",
    weaponName: "Spitzhacke",
    weaponKind: "melee",
    description: "Trägt einen Superheldenumhang und ein Stirnband mit großem 'K'. Kämpft mit einer Spitzhacke.",
    bodyColor: 0x9aa5b1,
    accentColor: 0xd62f2f,
    accent: "#b9c2cf",
    baseStats: { maxHp: 150, moveSpeed: 4.7, damage: 24, attackRange: 2.8, attackCooldown: 0.75, projectileSpeed: 16 },
  },
  {
    id: "biber",
    name: "Biber",
    emoji: "🦫",
    weaponName: "Angebissenes Holzschwert",
    weaponKind: "melee",
    description: "Trägt eine lila Kappe mit Biberbild und kämpft mit einem angebissenen Holzschwert.",
    bodyColor: 0x8a5a34,
    accentColor: 0x7c3aed,
    accent: "#a97a4d",
    baseStats: { maxHp: 115, moveSpeed: 5.4, damage: 20, attackRange: 2.4, attackCooldown: 0.45, projectileSpeed: 16 },
  },
  {
    id: "schwein",
    name: "Schwein",
    emoji: "🐷",
    weaponName: "Nunchakus",
    weaponKind: "melee",
    description: "Trägt eine coole Ninja-Maske und wirbelt mit Nunchakus.",
    bodyColor: 0xf2a3b3,
    accentColor: 0x1f1f1f,
    accent: "#f5b8c5",
    baseStats: { maxHp: 105, moveSpeed: 6.0, damage: 15, attackRange: 2.3, attackCooldown: 0.32, projectileSpeed: 16 },
  },
];

export function getCharacter(id: CharacterId): CharacterDef {
  const c = CHARACTERS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown character ${id}`);
  return c;
}
