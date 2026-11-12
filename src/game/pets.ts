// Pets: a boss drops one now and then, a small copy of itself that follows
// you about on runs and stands by you in the guild's courtyard. A pet is
// kept whatever happens to you out there; the Tasks screen picks which one
// comes along, and the one that does gives you a small gift of its boss's
// (PET_BUFFS; run.ts applies them).
import * as THREE from "three";

import { CROWN_PETS } from "../content/crownpets";
import { EnemyDef } from "../content/enemies";
import { CASTLE_ID, ENDLESS_ID, ISLAND_ID, castleWorld, endlessWorld, getWorld, islandWorld } from "../content/worlds";
import { Actor, createActor, play, tint } from "./assets";
import { GearStats } from "./inventory";
import { addShadow } from "./shadows";

// One boss in this many drops its pet
export const PET_ONE_IN = 8;
// How tall a pet stands, in tiles
const PET_HEIGHT = 0.9;

export { isBossPet } from "../content/crownpets";

// A Depths boss's pet (version 161, as the user asked): kept by the boss's
// own id ("endless:cerberus"), as the Depths' bosses change every run; and a
// Forgotten Castle boss's the same way ("castle:...", version 163)
const DEPTHS_PET_PREFIX = `${ENDLESS_ID}:`;
const CASTLE_PET_PREFIX = `${CASTLE_ID}:`;
// And the island's tyrants' ("island:tztok_jad", version 192)
const ISLAND_PET_PREFIX = `${ISLAND_ID}:`;

function depthsBoss(id: string): EnemyDef | undefined {
    if (id.startsWith(DEPTHS_PET_PREFIX)) {
        return endlessWorld(1).bosses?.find((b) => b.id === id);
    }
    if (id.startsWith(ISLAND_PET_PREFIX)) {
        return islandWorld().bosses?.find((b) => b.id === id);
    }
    return id.startsWith(CASTLE_PET_PREFIX) ? castleWorld().bosses?.find((b) => b.id === id) : undefined;
}

export function petName(worldId: string): string {
    const boss = depthsBoss(worldId);
    return CROWN_PETS[worldId]?.name ?? `Little ${(boss ?? getWorld(worldId).boss).name.toLowerCase()}`;
}

// Where a pet's from, for the Tasks screen
export function petFrom(id: string): string {
    if (CROWN_PETS[id]) {
        return CROWN_PETS[id].from;
    }
    if (!depthsBoss(id)) {
        return `from ${getWorld(id).name}`;
    }
    return id.startsWith(CASTLE_PET_PREFIX) ? "from the Forgotten Castle" : id.startsWith(ISLAND_PET_PREFIX) ? "from the Lost Isle" : "from the Depths";
}

// An island tyrant's pet gives what its old map's boss's did (PET_BUFFS),
// by the map it came from
const ISLAND_PET_MAPS: Record<string, string> = {
    dagannoth_prime: "fremennik",
    tztok_jad: "karamja",
    chaos_fanatic: "wilderness",
    kalphite_queen: "desert",
};

// What a pet does for you while it follows, one small thing each, after
// its boss: the Tasks screen says it in `text`
export type PetBuff = {
    text: string;
    // A share onto the max hit
    damage?: number;
    // Your hits never roll below this share of the max
    floor?: number;
    // A share faster special bar
    spec?: number;
    // A share onto every defence
    defence?: number;
    // The chance a shot takes no arrow or rune
    ammoSave?: number;
    // Max hitpoints
    hp?: number;
    // Hitpoints off every real hit taken
    soak?: number;
    // A share faster walking
    speed?: number;
    // Catching your breath this many times as fast
    regen?: number;
    // A share more coins from kills
    coins?: number;
    // The share of a boss's burning floor you take
    burn?: number;
    // Prayer bonus
    prayer?: number;
};

export const PET_BUFFS: Record<string, PetBuff> = {
    // The Wise Old Man: prayer
    lumbridge: { text: "+6 prayer bonus", prayer: 6 },
    // Verac: hits that always find their mark (version 150: four fifths, as
    // a hit already rolls 60% to 100% of the max, so a third did nothing)
    barrows: { text: "your hits never roll below 80% of the max", floor: 0.8 },
    // The Chaos Fanatic: special attacks
    wilderness: { text: "the special bar fills 20% faster", spec: 0.2 },
    // The Kalphite Queen: a hard shell
    desert: { text: "6% more defence", defence: 0.06 },
    // Dagannoth Prime: spells
    fremennik: { text: "one shot in five takes no arrow or rune", ammoSave: 0.2 },
    // TzTok-Jad: hitpoints
    karamja: { text: "8 more hitpoints", hp: 8 },
    // Skotizo: a demon's hide
    kourend: { text: "every hit on you does 1 less", soak: 1 },
    // The Javelin Colossus: long strides
    varlamore: { text: "you walk 5% faster", speed: 0.05 },
    // Sotetseg: the maze's rest
    morytania: { text: "you catch your breath twice as fast", regen: 2 },
    // K'ril Tsutsaroth: a demon's strength
    god_wars: { text: "your hits land 5% harder", damage: 0.05 },
    // The Corrupted Hunllef: the gauntlet's loot
    prifddinas: { text: "kills drop 15% more coins", coins: 0.15 },
    // JalTok-Jad: born in the fire
    inferno: { text: "a boss's burning floor does you half", burn: 0.5 },
};

// The Depths' bosses' pets, one small gift each after its boss
const DEPTHS_PET_BUFFS: Record<string, PetBuff> = {
    king_black_dragon: { text: "your hits land 5% harder", damage: 0.05 },
    elvarg: { text: "a boss's burning floor does you half", burn: 0.5 },
    thermonuclear_smoke_devil: { text: "+6 prayer bonus", prayer: 6 },
    giant_mole: { text: "you walk 5% faster", speed: 0.05 },
    cerberus: { text: "every hit on you does 1 less", soak: 1 },
    sarachnis: { text: "your hits never roll below 80% of the max", floor: 0.8 },
    dagannoth_rex: { text: "6% more defence", defence: 0.06 },
    dagannoth_supreme: { text: "one shot in five takes no arrow or rune", ammoSave: 0.2 },
    obor: { text: "8 more hitpoints", hp: 8 },
    bryophyta: { text: "you catch your breath twice as fast", regen: 2 },
    scorpia: { text: "the special bar fills 20% faster", spec: 0.2 },
    calvarion: { text: "kills drop 15% more coins", coins: 0.15 },
    corporeal_beast: { text: "10 more hitpoints", hp: 10 },
    ice_queen: { text: "6% more defence", defence: 0.06 },
};

export function petBuff(worldId: string | undefined): PetBuff | undefined {
    if (worldId?.startsWith(DEPTHS_PET_PREFIX)) {
        return DEPTHS_PET_BUFFS[worldId.slice(DEPTHS_PET_PREFIX.length)];
    }
    if (worldId?.startsWith(ISLAND_PET_PREFIX)) {
        return PET_BUFFS[ISLAND_PET_MAPS[worldId.slice(ISLAND_PET_PREFIX.length)] ?? ""];
    }
    // A castle lord's: its court's strength
    if (worldId?.startsWith(CASTLE_PET_PREFIX)) {
        return { text: "your hits land 4% harder and every hit on you does 1 less", damage: 0.04, soak: 1 };
    }
    return worldId !== undefined ? (PET_BUFFS[worldId] ?? CROWN_PETS[worldId]?.buff) : undefined;
}

// The buff's part in the gear's numbers (the rest is run.ts's, as the
// moments come)
export function applyPetStats(stats: GearStats, buff: PetBuff | undefined): void {
    if (!buff) {
        return;
    }
    if (buff.damage) {
        stats.damage = Math.max(1, Math.round(stats.damage * (1 + buff.damage)));
    }
    if (buff.defence) {
        stats.defence = Math.round(stats.defence * (1 + buff.defence));
        stats.defenceVs.melee = Math.round(stats.defenceVs.melee * (1 + buff.defence));
        stats.defenceVs.ranged = Math.round(stats.defenceVs.ranged * (1 + buff.defence));
        stats.defenceVs.magic = Math.round(stats.defenceVs.magic * (1 + buff.defence));
    }
    stats.hp += buff.hp ?? 0;
    stats.prayer += buff.prayer ?? 0;
}

// The boss's own model (or a crown pet's own), shrunk to a pet, standing idle
export async function createPet(worldId: string): Promise<Actor> {
    const actor = await createActor("npcs", CROWN_PETS[worldId]?.npcId ?? depthsBoss(worldId)?.npcId ?? getWorld(worldId).boss.npcId);
    const scale = petScale(actor);
    actor.root.scale.setScalar(scale);
    tint(actor, new THREE.Color(1, 1, 1));
    play(actor, "idle");
    // A small shadow, whatever the model's own scale
    addShadow(actor.root, 0.35 / scale);
    return actor;
}

// The scale that stands the model PET_HEIGHT tall, within reason
function petScale(actor: Actor): number {
    return Math.min(1, Math.max(0.12, PET_HEIGHT / Math.max(0.5, actor.height)));
}
