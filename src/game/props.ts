// The maps' own things to use (version 166, as the user asked): what stands
// about the Depths and the Forgotten Castle besides the chests, the altar and
// the camps. run.ts places them (placeProps), draws them and does what they
// do; this is what each one is and how many of them a map has.
import type * as THREE from "three";
import type { Actor } from "./assets";

export type PropKind =
    // Both maps
    | "barrel"
    | "search"
    | "brazier"
    | "lever"
    | "passage"
    | "shrine"
    | "corpse"
    // The Depths
    | "vein"
    | "pool"
    | "crack"
    | "ladder"
    // The Forgotten Castle
    | "portrait"
    | "bookcase"
    | "lectern"
    | "armour"
    | "font"
    | "cell"
    | "banquet"
    // Version 172: both maps' floor traps; the Depths' glowing fungus and
    // mine carts; the castle's courtyard herbs, alchemy tables, weapon racks,
    // bell and throne
    | "trap"
    | "fungus"
    | "cart"
    | "herbs"
    | "alchemy"
    | "rack"
    | "bell"
    | "throne"
    // Version 179: a strongbox at the end of every dead end, behind a web
    // (the Depths) or a gate to shut behind you (the castle); an anvil to
    // mend worn armour; the Depths' steam vents; the castle's wells and
    // sarcophagi
    | "strongbox"
    | "web"
    | "gate"
    | "anvil"
    | "vent"
    | "well"
    | "coffin";

// The kinds in order: a kind's place here is its code over the wire (party.ts)
export const PROP_KINDS: PropKind[] = [
    "barrel",
    "search",
    "brazier",
    "lever",
    "passage",
    "shrine",
    "corpse",
    "vein",
    "pool",
    "crack",
    "ladder",
    "portrait",
    "bookcase",
    "lectern",
    "armour",
    "font",
    "cell",
    "banquet",
    "trap",
    "fungus",
    "cart",
    "herbs",
    "alchemy",
    "rack",
    "bell",
    "throne",
    "strongbox",
    "web",
    "gate",
    "anvil",
    "vent",
    "well",
    "coffin",
];

export type Prop = {
    kind: PropKind;
    x: number;
    z: number;
    rotation: number;
    // What's left of it to everyone: an oil barrel's one use, a vein's
    // loads, a pool's eels, the banquet's bites (the host's count)
    uses: number;
    // Its own: a search spot's or corpse's look, a vein's ore, the shrine's
    // trade, a bookcase's book (the lectern's is the right one), the far end
    // of a passage, whether a suit of armour wakes, a web's or gate's
    // doorway (its cell times 16, plus its door bit: caves.ts DOOR_BITS)
    data: number;
    // A brazier lit, the lever pulled (and the passages it opens), a gate
    // shut
    on?: boolean;
    // What this player's had of it already: a drink from a pool, a vial from
    // the font, the shrine's trade, a look at the portraits, the anvil's
    // mending, a well's draught
    mine?: boolean;
    // Gone from the map: a barrel burst, a crack broken through, a suit of
    // armour awake, a cage opened, a corpse up and walking
    gone?: boolean;
    actor?: Actor;
    // Which load of its model is the latest (a brazier lit while its cold
    // model was still loading keeps the lit one)
    loads?: number;
    // A pool's water, a cell's prisoner
    extra?: { mesh?: THREE.Mesh; actor?: Actor };
};

// Where a kind goes: on which map, how many, in which rooms first (by their
// kind, caves.ts's), and how much open ground it wants round it
// (the island's too, version 192: its rooms are villages, woods and ruins,
// kinds the other two don't have, so a kind's rooms list all three maps')
type PropPlan = { kind: PropKind; caves: number; castle: number; island: number; rooms?: string[]; room?: number };
export type PropMap = "caves" | "castle" | "island";

export const PROP_PLANS: PropPlan[] = [
    { kind: "barrel", caves: 6, castle: 6, island: 5 },
    { kind: "search", caves: 16, castle: 16, island: 14 },
    { kind: "brazier", caves: 8, castle: 8, island: 4 },
    { kind: "lever", caves: 1, castle: 1, island: 1 },
    { kind: "passage", caves: 2, castle: 2, island: 2, room: 1 },
    { kind: "shrine", caves: 1, castle: 1, island: 1, room: 0.9, rooms: ["ruins"] },
    { kind: "corpse", caves: 8, castle: 8, island: 6, room: 0.9 },
    { kind: "vein", caves: 10, castle: 0, island: 5, rooms: ["ruins", "woods"] },
    { kind: "pool", caves: 4, castle: 0, island: 3, room: 1.4, rooms: ["woods"] },
    { kind: "crack", caves: 3, castle: 0, island: 0, room: 1 },
    { kind: "ladder", caves: 3, castle: 0, island: 0 },
    { kind: "portrait", caves: 0, castle: 3, island: 0, rooms: ["hall", "quarters"] },
    { kind: "bookcase", caves: 0, castle: 3, island: 0, rooms: ["library"] },
    { kind: "lectern", caves: 0, castle: 1, island: 0, rooms: ["chapel"] },
    { kind: "armour", caves: 0, castle: 10, island: 0, rooms: ["hall", "court"] },
    { kind: "font", caves: 0, castle: 2, island: 0, rooms: ["chapel"] },
    { kind: "cell", caves: 0, castle: 3, island: 2, rooms: ["dungeon", "village"], room: 1 },
    { kind: "banquet", caves: 0, castle: 2, island: 1, rooms: ["hall", "village"], room: 1.6 },
    { kind: "trap", caves: 10, castle: 10, island: 8 },
    { kind: "fungus", caves: 8, castle: 0, island: 0 },
    { kind: "cart", caves: 2, castle: 0, island: 0, room: 0.8 },
    { kind: "herbs", caves: 0, castle: 6, island: 6, rooms: ["court", "woods"] },
    { kind: "alchemy", caves: 0, castle: 2, island: 1, rooms: ["library", "quarters", "village"], room: 1 },
    { kind: "rack", caves: 0, castle: 3, island: 2, rooms: ["hall", "dungeon", "village"], room: 0.9 },
    { kind: "bell", caves: 0, castle: 1, island: 1, rooms: ["court", "village"], room: 1 },
    { kind: "throne", caves: 0, castle: 1, island: 0, rooms: ["hall"], room: 1.6 },
    // Version 179's (the strongboxes go to dead ends, the webs and gates
    // across doorways: run.ts placeProps; the island's dead ends have only
    // their strongboxes)
    { kind: "strongbox", caves: 3, castle: 3, island: 3, room: 0.8 },
    { kind: "web", caves: 4, castle: 0, island: 0 },
    { kind: "gate", caves: 0, castle: 4, island: 0 },
    { kind: "anvil", caves: 2, castle: 2, island: 2, rooms: ["dungeon", "hall", "village"], room: 0.8 },
    { kind: "vent", caves: 3, castle: 0, island: 0, room: 1.6 },
    { kind: "well", caves: 0, castle: 2, island: 2, rooms: ["court", "village"], room: 1 },
    { kind: "coffin", caves: 0, castle: 4, island: 1, rooms: ["chapel", "dungeon", "ruins"], room: 1 },
];

// Their models (cache loc ids; the pool's is drawn: water)
export const BARREL_LOC = 362;
export const SEARCH_LOCS = { caves: [357, 365, 12746], castle: [357, 365, 380] };
export const SEARCH_NAMES = { caves: ["crate", "pile of sacks", "rubble"], castle: ["crate", "pile of sacks", "bookshelf"] };
export const BRAZIER_LOC = 11018;
export const BRAZIER_LIT_LOC = 11020;
export const LEVER_LOC = 20038;
export const PASSAGE_LOCS = { caves: 748, castle: 1579 };
export const SHRINE_LOC = 30851;
export const CORPSE_LOCS = [20788, 664, 6297];
export const CRACK_LOC = 28786;
export const LADDER_LOC = 2336;
export const PORTRAIT_LOC = 9610;
export const BOOKCASE_LOC = 380;
export const LECTERN_LOC = 13642;
export const ARMOUR_LOC = 817;
export const FONT_LOC = 915;
// The stocks the prisoner (the Man's model) is locked in (a hanging cage
// hid him from the camera)
export const CELL_LOC = 648;
export const CELL_SCALE = 1;
export const PRISONER_NPC = 3014;
export const BANQUET_LOC = 12315;
// Version 172's: a spike trap, glowing mushrooms, a mine cart, herbs, a
// chemistry table, a weapon rack, a bell in its frame and a stone throne
export const TRAP_LOC = 13356;
export const FUNGUS_LOC = 3913;
export const CART_LOC = 637;
export const HERBS_LOC = 4675;
export const ALCHEMY_LOC = 618;
export const RACK_LOC = 13994;
export const BELL_LOC = 6847;
export const THRONE_LOC = 1109;
export const MORT_MYRE = 2970;
// Version 179's: an iron-bound chest (the closed chest, dark), a spider's
// web, a portcullis for the gate (five tiles wide, scaled to the doorway's
// four), an anvil, a well and a stone coffin (the vent is drawn: a crack
// in the floor)
export const STRONGBOX_LOC = 172;
export const WEB_LOC = 1810;
export const GATE_LOC = 29726;
export const ANVIL_LOC = 2031;
export const WELL_LOC = 878;
export const COFFIN_LOC = 398;
// The courtyard herbs, by weight: guam, marrentill, tarromin, ranarr
export const HERBS: [number, number][] = [
    [199, 40],
    [201, 30],
    [203, 20],
    [207, 10],
];
export const MAP_SCRAP = 1535;

// The Depths' veins: each ore's rock and what it gives (gems by GEMS)
export const VEINS: { loc: number; item?: number; name: string }[] = [
    { loc: 11364, item: 440, name: "iron" },
    { loc: 11366, item: 453, name: "coal" },
    { loc: 11372, item: 447, name: "mithril" },
    { loc: 11374, item: 449, name: "adamantite" },
    { loc: 11376, item: 451, name: "runite" },
    { loc: 11380, name: "gem" },
];
// How often each vein is found, by the map's tier (its enemies'): the
// better ores deeper down
export const VEIN_WEIGHTS: Record<number, number[]> = {
    2: [4, 3, 2, 1, 0, 1],
    3: [2, 3, 3, 2, 0.5, 1.5],
    4: [1, 2, 3, 3, 1, 2],
    5: [0, 1, 2, 3, 2, 2],
};
// A gem rock's gems: sapphire, emerald, ruby and diamond, by weight
export const GEMS: [number, number][] = [
    [1623, 50],
    [1621, 30],
    [1619, 15],
    [1617, 5],
];
export const CAVE_EEL = 5003;
export const HOLY_WATER = 732;

// The shrine's trades: what it asks, and what it gives for the rest of the
// run (one a shrine, one a hero)
export type ShrineTrade = "blood" | "gold" | "prayer" | "flesh";
export const SHRINE_TRADES: ShrineTrade[] = ["blood", "gold", "prayer", "flesh"];
export const SHRINE_DAMAGE = 1.2;
export const SHRINE_DEFENCE = 25;

// The library's books, three on the shelves a run; the lectern's prayer book
// names the one with the vault behind it
export const BOOKS = [
    "The Fall of House Draynor",
    "A Treatise on Vampyres",
    "Saradomin's Light",
    "The Black Knights' Muster",
    "Hymns of the Hallowed",
    "Notes on Gargoyles",
    "The Lords of Morytania",
    "The Lost Heir",
];

// What holy water's blessing bites: the castle's undead and vampyres, by id
export const HOLY_BANE = /vampyre|ankou|zombie|undead|skelet|vyrewatch|ghost|shade|wight|revenant|banshee|count_draynor|vanstrom|verzik|arrav/;

// The map's dot for each kind once it's been seen (none for a crack, found
// by sight alone), and grey once there's nothing left of it
export const PROP_DOTS: Partial<Record<PropKind, string>> = {
    barrel: "#c8642a",
    brazier: "#ff9a3c",
    lever: "#d0d0d0",
    passage: "#9ad0ff",
    shrine: "#d070ff",
    vein: "#b0b0b0",
    pool: "#4aa8ff",
    ladder: "#c8a878",
    portrait: "#e8d8a8",
    lectern: "#e8d8a8",
    font: "#8ae0ff",
    cell: "#c8a878",
    banquet: "#ffd27a",
    fungus: "#60e8ff",
    cart: "#c8a060",
    herbs: "#6ad070",
    alchemy: "#8ae0a0",
    rack: "#d0d0d0",
    bell: "#ffd27a",
    throne: "#ffd700",
    strongbox: "#ffd27a",
    web: "#e8e8e8",
    gate: "#d0d0d0",
    anvil: "#b0b0b0",
    vent: "#ff6a3c",
    well: "#4aa8ff",
    coffin: "#c8a878",
};
