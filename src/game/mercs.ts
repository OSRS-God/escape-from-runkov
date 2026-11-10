// Mercenaries (version 173, as the user asked): a follower hired at the
// guild's Mercenaries' Hall. Each kind fights its own way; one who comes
// back alive is a level better next time (MERC_MAX_LEVEL). Since version 174
// one hired is the player's for good, for the fee once: on every solo run
// till let go, a fall costing only that run, and MERC_CUT of the coins found
// taken at the end of every run. run.ts moves them.
import { AttackStyle, GEAR_BY_TIER, ItemDef, PRIZES, Slot } from "../content/items";
import type { Equipment, ItemStack } from "./save";

export type MercKind = "sellsword" | "bowman" | "mage" | "medic";
export const MERC_KINDS: MercKind[] = ["sellsword", "bowman", "mage", "medic"];

export type MercDef = {
    kind: MercKind;
    title: string;
    blurb: string;
    style: AttackStyle;
    // The hall's fee at the first level
    price: number;
    // Hitpoints, and as many more a tier of the map
    hp: number;
    hpTier: number;
    // Defence against every style a tier of the map
    defenceTier: number;
    // His hit, a share of a freed prisoner's (run.ts ALLY_HIT), a swing every
    // so many seconds from this far off
    hit: number;
    every: number;
    reach: number;
    // How many tiles nearer the enemies take him to be (they go for him
    // rather than you)
    draw: number;
    // A medic's: a share of your hitpoints healed every so many seconds
    heal?: { share: number; every: number };
    names: string[];
    // His colours (the character's colour groups: hair, torso, legs, feet,
    // skin), over yours
    colors: number[];
};

export const MERC_DEFS: Record<MercKind, MercDef> = {
    sellsword: {
        kind: "sellsword",
        title: "Sellsword",
        blurb: "Melee, the toughest: the monsters go for them before you.",
        style: "melee",
        price: 400,
        hp: 60,
        hpTier: 28,
        defenceTier: 8,
        hit: 1,
        every: 1.6,
        reach: 0,
        draw: 3,
        names: ["Bram", "Hild", "Torvald", "Edda", "Garret", "Ysolde"],
        colors: [1, 4, 3, 0, 1],
    },
    bowman: {
        kind: "bowman",
        title: "Bowman",
        blurb: "Ranged: shoots from six tiles off, but can't take much.",
        style: "ranged",
        price: 450,
        hp: 45,
        hpTier: 22,
        defenceTier: 4,
        hit: 0.85,
        every: 1.5,
        reach: 6,
        draw: 0,
        names: ["Wren", "Aldo", "Fenna", "Corrin", "Lark", "Teodor"],
        colors: [3, 9, 9, 1, 2],
    },
    mage: {
        kind: "mage",
        title: "Hedge mage",
        blurb: "Magic: slow, heavy hits through armour, from seven tiles off. Fragile.",
        style: "magic",
        price: 500,
        hp: 40,
        hpTier: 18,
        defenceTier: 3,
        hit: 1.5,
        every: 2.6,
        reach: 7,
        draw: 0,
        names: ["Morwen", "Ivo", "Saska", "Thane", "Odile", "Bertil"],
        colors: [5, 7, 7, 2, 0],
    },
    medic: {
        kind: "medic",
        title: "Field medic",
        blurb: "A weak swing, but patches you up every few seconds.",
        style: "melee",
        price: 450,
        hp: 55,
        hpTier: 26,
        defenceTier: 5,
        hit: 0.5,
        every: 1.8,
        reach: 0,
        draw: 0,
        heal: { share: 0.02, every: 4 },
        names: ["Mira", "Osric", "Tilde", "Anselm", "Greta", "Pell"],
        colors: [2, 11, 2, 1, 3],
    },
};

// What became of him, for the run's summary
export type MercGain = { text: string };

export const MERC_MAX_LEVEL = 5;
// Each level past the first: this much more hit, hitpoints and healing, and
// this much more on the fee
export const MERC_LEVEL_UP = 0.1;
export const MERC_LEVEL_FEE = 0.5;
// Their share of the coins found, at the end of every run
export const MERC_CUT = 0.1;
// The hall has three of the four in a day (by UTC day), turn about
const MERCS_OFFERED = 3;

export function mercsOffered(day: number): MercKind[] {
    const skip = day % MERC_KINDS.length;
    return MERC_KINDS.filter((_, i) => i !== skip).slice(0, MERCS_OFFERED);
}

export function mercPrice(kind: MercKind, level: number): number {
    return Math.round(MERC_DEFS[kind].price * (1 + MERC_LEVEL_FEE * (level - 1)));
}

// What a mercenary's kind and level does to their numbers
export function mercScale(level: number): number {
    return 1 + MERC_LEVEL_UP * (Math.max(1, level) - 1);
}

// The hall's record of one (version 175: and what you've given them to wear
// and eat, theirs till they're let go, when it comes back to your bank)
export type MercRecord = { name: string; level: number; gear?: Equipment; food?: ItemStack[] };

// What they wear: what you've given them over their own kit
export function mercWears(kind: MercKind, record: Pick<MercRecord, "level" | "gear">): Equipment {
    return { ...mercGear(kind, record.level), ...(record.gear ?? {}) };
}

// Their own kit: their kind's gear of their level's tier (a tier every two
// levels since version 175, as their gear's what they hit with now: the
// first item of each slot there is, so it's the same every time)
export function mercGear(kind: MercKind, level: number): Equipment {
    const tier = Math.min(5, Math.max(1, Math.ceil(level / 2)));
    const def = MERC_DEFS[kind];
    const pieces = (GEAR_BY_TIER.get(tier) ?? []).filter((i) => !PRIZES.has(i.id) && !i.exclusive && !i.reward);
    const kindOf = (i: ItemDef) => (i.slot === "weapon" ? (i.uses === "runes" ? "magic" : i.ranged ? "ranged" : "melee") : (i.style ?? "melee"));
    const equipment: Equipment = {};
    for (const slot of ["weapon", "head", "body", "legs"] as Slot[]) {
        const piece = pieces.find((i) => i.slot === slot && kindOf(i) === def.style && !(slot === "weapon" && i.thrown));
        if (piece) {
            equipment[slot] = piece.id;
        }
    }
    return equipment;
}
