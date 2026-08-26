export interface AreaDef {
  id: number;
  name: string;
  requiredLevel: number;
  groundColor: number;
  fogColor: number;
  skyColorTop: number;
  skyColorBottom: number;
  enemyCountBase: number;
  enemyHpMult: number;
  enemyDmgMult: number;
  swatch: string;
}

export const AREAS: AreaDef[] = [
  {
    id: 1,
    name: "Bambuswald",
    requiredLevel: 1,
    groundColor: 0x4f8a4a,
    fogColor: 0x9fd0a1,
    skyColorTop: 0x8fd3ff,
    skyColorBottom: 0xdff6ff,
    enemyCountBase: 3,
    enemyHpMult: 1,
    enemyDmgMult: 1,
    swatch: "#4f8a4a",
  },
  {
    id: 2,
    name: "Wüstencanyon",
    requiredLevel: 3,
    groundColor: 0xd9a463,
    fogColor: 0xf0c98a,
    skyColorTop: 0xffd48a,
    skyColorBottom: 0xffe9c2,
    enemyCountBase: 4,
    enemyHpMult: 1.4,
    enemyDmgMult: 1.25,
    swatch: "#d9a463",
  },
  {
    id: 3,
    name: "Frostgipfel",
    requiredLevel: 6,
    groundColor: 0xd7e8f4,
    fogColor: 0xc9e2f2,
    skyColorTop: 0x4a6fa5,
    skyColorBottom: 0xaecbe8,
    enemyCountBase: 5,
    enemyHpMult: 1.9,
    enemyDmgMult: 1.55,
    swatch: "#bcdcf0",
  },
  {
    id: 4,
    name: "Vulkanruinen",
    requiredLevel: 10,
    groundColor: 0x3a2a2a,
    fogColor: 0x552222,
    skyColorTop: 0x1a0e0e,
    skyColorBottom: 0x6e2020,
    enemyCountBase: 6,
    enemyHpMult: 2.5,
    enemyDmgMult: 2,
    swatch: "#8a2a2a",
  },
];

/** Level requirement for areas beyond the predefined list (progressive scaling). */
export function requiredLevelForArea(areaId: number): number {
  const known = AREAS.find((a) => a.id === areaId);
  if (known) return known.requiredLevel;
  const last = AREAS[AREAS.length - 1];
  const extra = areaId - last.id;
  return last.requiredLevel + extra * 5;
}
