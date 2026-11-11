// Mercenaries (version 173, as the user asked): a follower hired at the
// guild's Mercenaries' Hall. Each kind fights its own way; one who comes
// back alive is a level better next time (MERC_MAX_LEVEL). Since version 174
// one hired is the player's for good, for the fee once: on every solo run
// till let go, a fall costing only that run, and MERC_CUT of the coins found
// taken at the end of every run. Version 181 adds ten more, each unlocked
// by a tier cleared, in better gear, with a perk (MercPerk). run.ts moves
// them.
import { AttackStyle, GEAR_BY_TIER, ItemDef, PRIZES, Slot, gearPower, getItem, weaponStyle } from "../content/items";
import type { Equipment, ItemStack } from "./save";

export type MercKind =
    | "sellsword"
    | "bowman"
    | "mage"
    | "medic"
    // Version 181 (as the user asked): ten more, each unlocked by a tier
    // cleared, with better gear to start and a perk of their own
    | "knight"
    | "marksman"
    | "warlock"
    | "chaplain"
    | "veteran"
    | "berserker"
    | "ranger"
    | "hexer"
    | "champion"
    | "paladin";
// The hall's everyday four (three of them a day, turn about; a new
// character starts with the dearest's fee), and the ten that unlock
export const MERC_KINDS: MercKind[] = ["sellsword", "bowman", "mage", "medic"];
export const MERC_ELITE_KINDS: MercKind[] = ["knight", "marksman", "warlock", "chaplain", "veteran", "berserker", "ranger", "hexer", "champion", "paladin"];

// What one of the ten does besides fight (run.ts does each):
// tough: takes that share less of every hit
// crit: that chance of a hit landing `times` as hard
// lifesteal: mended by that share of what they hit for
// prayers: that much prayer back to you every so many seconds, while near
// executioner: hits `times` as hard on a foe under `below` of its health
// rage: hits `times` as hard while under `below` of their own health
// haste: walks that many times as fast
// venom: their hits poison, for that share of the hit a tick
// secondWind: once a run, back up from a fall with that share of health
// guard: you take that share less while they're up within `range` tiles
export type MercPerk =
    | { kind: "tough"; share: number }
    | { kind: "crit"; chance: number; times: number }
    | { kind: "lifesteal"; share: number }
    | { kind: "prayers"; amount: number; every: number }
    | { kind: "executioner"; below: number; times: number }
    | { kind: "rage"; below: number; times: number }
    | { kind: "haste"; speed: number }
    | { kind: "venom"; share: number }
    | { kind: "secondWind"; share: number }
    | { kind: "guard"; share: number; range: number };

export type MercDef = {
    kind: MercKind;
    title: string;
    blurb: string;
    style: AttackStyle;
    // The hall's fee at the first level
    price: number;
    // The tier that unlocks them (a depth of the Depths cleared, or the
    // castle for 4), and the tier their own kit starts at (version 181)
    tier?: number;
    perk?: MercPerk;
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
    // A medic's: a share of your hitpoints healed every so many seconds, and
    // of their own (version 176)
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
        blurb: "A weak swing, but patches you and themselves up every few seconds.",
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
    // Version 181's ten
    knight: {
        kind: "knight",
        title: "Knight",
        blurb: "Melee, in tier 2 plate: the monsters go for them, and they take a quarter less of every hit.",
        style: "melee",
        price: 900,
        tier: 2,
        perk: { kind: "tough", share: 0.25 },
        hp: 80,
        hpTier: 32,
        defenceTier: 11,
        hit: 1.1,
        every: 1.6,
        reach: 0,
        draw: 4,
        names: ["Sir Aldric", "Dame Rowena", "Sir Caddoc", "Dame Isolde", "Sir Brandt", "Dame Maren"],
        colors: [1, 8, 8, 0, 1],
    },
    marksman: {
        kind: "marksman",
        title: "Marksman",
        blurb: "Ranged, a tier 2 bow: from seven tiles off, and one shot in four lands twice as hard.",
        style: "ranged",
        price: 950,
        tier: 2,
        perk: { kind: "crit", chance: 0.25, times: 2 },
        hp: 55,
        hpTier: 24,
        defenceTier: 5,
        hit: 0.9,
        every: 1.5,
        reach: 7,
        draw: 0,
        names: ["Hawise", "Dunstan", "Ilse", "Rafe", "Sabine", "Oswin"],
        colors: [4, 6, 6, 1, 2],
    },
    warlock: {
        kind: "warlock",
        title: "Warlock",
        blurb: "Magic, tier 3 robes: heavy hits through armour from seven tiles off, and a third of what they hit for mends them.",
        style: "magic",
        price: 1200,
        tier: 3,
        perk: { kind: "lifesteal", share: 0.35 },
        hp: 50,
        hpTier: 20,
        defenceTier: 4,
        hit: 1.5,
        every: 2.4,
        reach: 7,
        draw: 0,
        names: ["Vesna", "Caspar", "Lioba", "Drusus", "Nerys", "Ambrose"],
        colors: [0, 10, 10, 2, 0],
    },
    chaplain: {
        kind: "chaplain",
        title: "Chaplain",
        blurb: "Melee, lightly, in tier 3 mail: every eight seconds at your side they give you six prayer back.",
        style: "melee",
        price: 1100,
        tier: 3,
        perk: { kind: "prayers", amount: 6, every: 8 },
        hp: 65,
        hpTier: 28,
        defenceTier: 8,
        hit: 0.6,
        every: 1.8,
        reach: 0,
        draw: 0,
        names: ["Brother Eadric", "Sister Clement", "Brother Wystan", "Sister Agathe", "Brother Lucan", "Sister Ottilie"],
        colors: [3, 2, 2, 1, 3],
    },
    veteran: {
        kind: "veteran",
        title: "Veteran",
        blurb: "Melee, tier 3 steel: hits twice as hard on anything under a third of its health, to finish it.",
        style: "melee",
        price: 1200,
        tier: 3,
        perk: { kind: "executioner", below: 1 / 3, times: 2 },
        hp: 75,
        hpTier: 30,
        defenceTier: 9,
        hit: 1.15,
        every: 1.6,
        reach: 0,
        draw: 2,
        names: ["Grimbald", "Hesper", "Ulric", "Tamsin", "Cuthwin", "Berthe"],
        colors: [5, 3, 3, 0, 2],
    },
    berserker: {
        kind: "berserker",
        title: "Berserker",
        blurb: "Melee, tier 4 arms, quick: under half their health they hit half again as hard.",
        style: "melee",
        price: 1500,
        tier: 4,
        perk: { kind: "rage", below: 0.5, times: 1.5 },
        hp: 85,
        hpTier: 34,
        defenceTier: 6,
        hit: 1.3,
        every: 1.4,
        reach: 0,
        draw: 2,
        names: ["Skarde", "Ragna", "Hroald", "Thyri", "Gorm", "Asdis"],
        colors: [6, 5, 5, 0, 1],
    },
    ranger: {
        kind: "ranger",
        title: "Ranger",
        blurb: "Ranged, a tier 4 bow: from seven tiles off, and quick on their feet, a third faster than you.",
        style: "ranged",
        price: 1500,
        tier: 4,
        perk: { kind: "haste", speed: 1.3 },
        hp: 60,
        hpTier: 26,
        defenceTier: 6,
        hit: 1,
        every: 1.3,
        reach: 7,
        draw: 0,
        names: ["Linnet", "Corwen", "Mabyn", "Aldous", "Fenwick", "Rhoswen"],
        colors: [2, 4, 4, 1, 2],
    },
    hexer: {
        kind: "hexer",
        title: "Hexer",
        blurb: "Magic, tier 4 robes: heavy hits from seven tiles off that poison what they strike.",
        style: "magic",
        price: 1600,
        tier: 4,
        perk: { kind: "venom", share: 0.4 },
        hp: 55,
        hpTier: 22,
        defenceTier: 4,
        hit: 1.4,
        every: 2.4,
        reach: 7,
        draw: 0,
        names: ["Morgause", "Sulien", "Hekate", "Vortig", "Ysbail", "Corvin"],
        colors: [0, 9, 9, 2, 0],
    },
    champion: {
        kind: "champion",
        title: "Champion",
        blurb: "Melee, the toughest there is, in tier 5 plate: the monsters go for them, and once a run they get back up from a fall at half health.",
        style: "melee",
        price: 2200,
        tier: 5,
        perk: { kind: "secondWind", share: 0.5 },
        hp: 100,
        hpTier: 40,
        defenceTier: 12,
        hit: 1.25,
        every: 1.6,
        reach: 0,
        draw: 4,
        names: ["Sir Gawen", "Dame Elowen", "Sir Roderic", "Dame Sigrun", "Sir Leofric", "Dame Audra"],
        colors: [1, 0, 0, 0, 1],
    },
    paladin: {
        kind: "paladin",
        title: "Paladin",
        blurb: "Melee, tier 5 plate: the monsters go for them, and while they're up within four tiles of you, you take a fifth less of every hit.",
        style: "melee",
        price: 2200,
        tier: 5,
        perk: { kind: "guard", share: 0.2, range: 4 },
        hp: 90,
        hpTier: 36,
        defenceTier: 12,
        hit: 1.1,
        every: 1.6,
        reach: 0,
        draw: 3,
        names: ["Sir Percival", "Dame Guinevere", "Sir Tristan", "Dame Lunete", "Sir Bedwyr", "Dame Enid"],
        colors: [3, 11, 11, 1, 3],
    },
};

// The tier a character's reached, for the hall's locks: the deepest depth
// cleared (or the Abyss, 5), or the castle cleared (its enemies' tier, 4)
export function mercTierReached(depths: { cleared: number[]; castleCleared?: boolean; abyss?: number } | undefined): number {
    if (!depths) {
        return 1;
    }
    return Math.max(1, ...depths.cleared, depths.castleCleared ? 4 : 0, depths.abyss ? 5 : 0);
}

export function mercUnlocked(kind: MercKind, tierReached: number): boolean {
    return (MERC_DEFS[kind].tier ?? 1) <= tierReached;
}

// What the hall says a locked one waits on
export function mercLockText(kind: MercKind): string {
    const tier = MERC_DEFS[kind].tier ?? 1;
    return tier === 4 ? "Clear depth 4 of the Depths, or the Forgotten Castle, to hire them" : `Clear depth ${tier} of the Depths to hire them`;
}

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

// What they wear: what you've given them over their own kit (only what
// fits their kind since version 182: a mage given plate keeps it for you,
// in the hall's Take back gear, but doesn't wear it)
export function mercWears(kind: MercKind, record: Pick<MercRecord, "level" | "gear">): Equipment {
    const given: Equipment = {};
    for (const [slot, id] of Object.entries(record.gear ?? {})) {
        if (id !== undefined && mercFits(kind, getItem(id))) {
            given[slot as Slot] = id;
        }
    }
    return { ...mercGear(kind, record.level), ...given };
}

// Whose gear a kind's is, for the messages
export const STYLE_OWNER: Record<AttackStyle, string> = { melee: "a fighter's", ranged: "an archer's", magic: "a mage's" };

// What a kind can wear and wield (version 182, as the user asked): a weapon
// of their own style (never a thrown one: they'd have nothing to throw once
// it's gone), and armour of their style or the neutral kind (jewellery, a
// cape, void); never a mage in plate or an archer in robes
export function mercFits(kind: MercKind, item: ItemDef): boolean {
    if (!item.slot) {
        return false;
    }
    const style = MERC_DEFS[kind].style;
    if (item.slot === "weapon") {
        return !item.thrown && weaponStyle(item) === style;
    }
    return item.style === undefined || item.style === style;
}

// Whether a piece is better than what they've got in its slot (nothing, for
// the slots their kit leaves bare), by gearPower's measure
export function mercBetter(kind: MercKind, item: ItemDef, record: Pick<MercRecord, "level" | "gear">): boolean {
    if (!item.slot || !mercFits(kind, item)) {
        return false;
    }
    const worn = mercWears(kind, record);
    const weapon = worn.weapon !== undefined ? getItem(worn.weapon) : undefined;
    if (item.slot === "shield" && weapon?.twoHanded) {
        return false;
    }
    const have = worn[item.slot];
    return gearPower(item) > (have !== undefined ? gearPower(getItem(have)) : 0);
}

// Their own kit: their kind's gear of their level's tier (a tier every two
// levels since version 175, as their gear's what they hit with now: the
// first item of each slot there is, so it's the same every time); one of
// the ten starts at their own tier (version 181)
export function mercGear(kind: MercKind, level: number): Equipment {
    const def = MERC_DEFS[kind];
    const tier = Math.min(5, Math.max(1, (def.tier ?? 1) + Math.ceil(level / 2) - 1));
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
