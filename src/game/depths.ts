// The Depths' own progress between runs (version 161, as the user asked):
// cave shards, which every run earns and the delvers' upgrades cost (save.ts
// DEPTHS_UPGRADES), so even a run that ends in a death gets somewhere; a
// title for each depth escaped from with a boss slain, and the Slayer cape
// for the fifth; and the daily cave, the same cave for everyone for a day,
// whose best hauls go on a board (functions/api's /daily).
import type { RunReport } from "./run";

// What a run earns: shards a kill, more a champion, a superior and a boss,
// all of it more the deeper, and half again for getting out
const SHARDS = { kill: 1, champion: 2, superior: 8, boss: 30 };
const SHARDS_PER_DEPTH = 0.25;
const SHARDS_ESCAPED = 1.5;

export function shardsFor(report: Pick<RunReport, "kills" | "championKills" | "superiorKills" | "bossKills">, depth: number, escaped: boolean): number {
    const base =
        report.kills * SHARDS.kill + report.championKills * SHARDS.champion + report.superiorKills * SHARDS.superior + report.bossKills * SHARDS.boss;
    return Math.round(base * (1 + SHARDS_PER_DEPTH * (depth - 1)) * (escaped ? SHARDS_ESCAPED : 1));
}

// What a run gave, for the summary: shards, a depth's title and the cape
// if it cleared one, and the daily cave's day and haul if it was that
export type DepthsGain = { shards: number; title?: string; cape?: boolean; daily?: { day: number; haul: number } };

// The title each depth gives, escaped from with a boss slain; and the
// Forgotten Castle's own (version 163)
export const DEPTH_TITLES = ["Delver", "Tunneller", "Deep delver", "Abyss walker", "Slayer of the Depths"];
export const CASTLE_TITLES = ["Trespasser", "Gatebreaker", "Knight of the Ruin", "Kingslayer", "Lord of the Forgotten Castle"];

export function titlesFor(worldId: string): string[] {
    return worldId === "castle" ? CASTLE_TITLES : DEPTH_TITLES;
}

// The fifth's reward, nothing else gives it (items.ts `reward`)
export const SLAYER_CAPE = 9786;

// The daily cave: days by UTC, the depth it's at (one to three, turn about,
// so it's a cave anyone might get out of), and its seed
const DAY_MS = 86_400_000;
const DAILY_DEPTHS = 3;

export function dailyDay(now = Date.now()): number {
    return Math.floor(now / DAY_MS);
}

export function dailyDepth(day = dailyDay()): number {
    return 1 + (day % DAILY_DEPTHS);
}

export function dailySeed(day = dailyDay()): number {
    return Math.imul(day ^ 0x5eed, 2654435761) >>> 0;
}

// Time left on today's cave, for the maps screen
export function dailyLeft(now = Date.now()): string {
    const left = DAY_MS - (now % DAY_MS);
    const hours = Math.floor(left / 3_600_000);
    const minutes = Math.floor((left % 3_600_000) / 60_000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
