// Threat (version 150, as the user asked for a harder game): a level picked
// before a run, 0 to MAX_THREAT, each making the map harder and its loot
// better. A map opens one more level each time it's beaten (escaped from
// with its boss slain) at the highest open, so a map's best is a record to
// chase. In a party the host's level goes for everyone.

export const MAX_THREAT = 5;

export const THREAT_NAMES = ["Calm", "Uneasy", "Hostile", "Dangerous", "Deadly", "Nightmare"];

// What a level does, all as shares and multipliers on the map's own
export type Threat = {
    level: number;
    enemyHp: number;
    enemyDamage: number;
    bossHp: number;
    bossDamage: number;
    // Food from kills
    food: number;
    // The chance an enemy's a champion, and the share more elites
    champion: number;
    elite: number;
    // The run's clock: the map waking and the ways out closing
    clock: number;
    // Coins from kills, chests and the vault, and the chance at a prize
    coins: number;
    prizes: number;
    // Every boss's burning floor, from this level (bosses that have none)
    bossFloor: boolean;
};

export function threatOf(level: number): Threat {
    const l = clampThreat(level);
    return {
        level: l,
        enemyHp: 1 + 0.12 * l,
        enemyDamage: 1 + 0.1 * l,
        bossHp: 1 + 0.1 * l,
        bossDamage: 1 + 0.08 * l,
        food: 1 - 0.15 * l,
        champion: 0.05 + 0.02 * l,
        elite: 1 + 0.3 * l,
        clock: 1 - 0.06 * l,
        coins: 1 + 0.2 * l,
        prizes: 1 + 0.3 * l,
        bossFloor: l >= 3,
    };
}

export function clampThreat(level: unknown): number {
    return typeof level === "number" && Number.isFinite(level) ? Math.max(0, Math.min(MAX_THREAT, Math.round(level))) : 0;
}

export function threatName(level: number): string {
    return `Threat ${level} · ${THREAT_NAMES[clampThreat(level)]}`;
}

// The level's effects in a line, for the picker's tooltip
export function threatText(level: number): string {
    const t = threatOf(level);
    if (t.level === 0) {
        return "The map as it is.";
    }
    const pct = (n: number) => `${Math.round(Math.abs(n - 1) * 100)}%`;
    return [
        `Enemies have ${pct(t.enemyHp)} more hitpoints and hit ${pct(t.enemyDamage)} harder (the boss ${pct(t.bossHp)} and ${pct(t.bossDamage)})`,
        `${pct(t.food)} less food from kills`,
        `champions ${Math.round(t.champion * 100)}% of enemies, ${pct(t.elite)} more elites`,
        `the map wakes and the ways out close ${pct(t.clock)} sooner`,
        t.bossFloor ? "every boss has burning floor" : undefined,
        `${pct(t.coins)} more coins and ${pct(t.prizes)} more chance at a prize`,
    ]
        .filter(Boolean)
        .join("; ") + ".";
}

// The highest level open on a map: one past the best it's been beaten at,
// a map beaten before threat levels came counting as beaten at 0
export function threatOpen(bestThreat: Record<string, number> | undefined, mapsBeaten: string[], mapId: string): number {
    const best = bestThreat?.[mapId] ?? (mapsBeaten.includes(mapId) ? 0 : -1);
    return Math.max(0, Math.min(MAX_THREAT, best + 1));
}
