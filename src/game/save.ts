// What persists between runs, in localStorage: the stash, coins, what's worn
// and who the character is.
import { FOUND_TIER_MAX, ITEM_BY_ID, Slot, getItem, rollShopStock } from "../content/items";
import { Book, SPELL_BY_ID } from "../content/spells";
import { clampThreat } from "../content/threat";
import { DEFAULT_COLORS, DEFAULT_KITS } from "./player";

export type ItemStack = { id: number; count: number };
export type Equipment = Partial<Record<Slot, number>>;

export type Character = {
    name: string;
    // Body kit per part (hair, jaw, torso, arms, hands, legs, feet)
    kits: number[];
    // Colour choice per group (hair, torso, legs, feet, skin)
    colors: number[];
    // Height scale
    size: number;
    // The name's colour, one of crown.ts's NAME_COLORS: drawn only while the
    // browser holds a crown key that checks out (version 73)
    nameColor?: string;
};

// The save's shape. A save from an older version is dropped on load, so a
// change that should start everyone fresh raises this.
export const SAVE_VERSION = 3;

export type SaveData = {
    version: typeof SAVE_VERSION;
    coins: number;
    stash: ItemStack[];
    // Packed for the next run: lost on death, back in the stash on extraction
    backpack: ItemStack[];
    equipment: Equipment;
    character: Character;
    // What the shop has on its shelves, rolled again after every run
    shop: number[];
    stats: Stats;
    // Tasks done (content/tasks.ts), each paid once
    tasks: string[];
    // The item insured for the next run: it comes home if you don't. And
    // what was paid for it, given back if the cover moves (version 154)
    insured?: number;
    insuredPaid?: number;
    // The guild's upgrades, bought with coins (UPGRADES has what each does)
    upgrades: Upgrades;
    // Gravestones: where you last died on a map, with what you carried in
    // it, for the next GRAVE_RUNS runs (one a map; main.ts keeps them)
    graves: Grave[];
    // Pets found (the map whose boss dropped each), and the one following
    pets: string[];
    pet?: string;
    // How worn each piece of armour is, 0 to 1, by item id: every hit taken
    // wears what's worn, and the guild repairs it (inventory.ts has the
    // numbers)
    wear: Record<number, number>;
    // The last few maps started, newest first, for the title screen
    recentMaps: string[];
    // The spell picked to autocast (content/spells.ts; version 106), or
    // none for the strongest the staff can cast of the book open: the
    // standard spellbook or Ancient Magicks (version 107)
    autocast?: string;
    spellbook?: Book;
    // Friends (version 115): this character's key for its friend code (the
    // relay makes the code from it; the key itself is shown nowhere), and
    // the friends added, by code with the name they had when added
    friendKey?: string;
    // The code made from that key (friendcode.ts, version 116), kept so it
    // shows at once; made again whenever the key isn't the one it's from
    friendCode?: string;
    friends?: Friend[];
    // Sets of gear and pack saved in the vault, worn and packed in one click
    loadouts?: Loadout[];
    // The bank as it's been arranged (dragged about), and its own tabs
    bankOrder?: number[];
    bankTabs?: BankTab[];
    // How the last run ended, and when (a timestamp), for the title screen
    lastRun?: { at: number; map: string; kind: "extracted" | "died" | "left" };
    // Today's contract (contract.ts): which day it's for, the best a run
    // has done towards it, and whether it's been paid
    contract?: { day: number; map: string; best: number; done: boolean };
    // A new character still to pick its starter kit (starter.ts, version
    // 127); a save from before it never had the choice, and keeps its gear
    pickStarter?: boolean;
    // Whether the save has had version 146's thrown weapons sorted out
    // (parseSave): true for any save made since
    thrownBundles?: boolean;
    // The threat level picked for each map (content/threat.ts, version 150)
    threat?: Record<string, number>;
    // A run under way (version 153): set as one's packed, cleared as it
    // ends. Found on a page opening with no page playing it (runAlive), the
    // run was left by closing or reloading, and counts as a death.
    activeRun?: { map: string; at: number };
    // The Depths (version 156; "endless" in the code and the save, its first
    // name), a fresh start of their own, as the user asked:
    // its own stash, coins, gear, record and the rest (PROFILE_KEYS), with a
    // starter kit picked again. The profile played is the one in the save's
    // own fields; the other waits in `other`. `mode` says which is out.
    mode?: "endless";
    other?: Profile;
    // How deep the Depths go for this profile, 1 to 5 (their tier): one deeper
    // each time it's beaten
    endlessDepth?: number;
    // The Depths' own progress (version 161): cave shards and what they've
    // bought (DEPTHS_UPGRADES), the depths escaped from with a boss slain
    // (each a title, the fifth the Slayer cape), the title worn, and the best
    // of today's daily cave
    depths?: DepthsProgress;
};

export type DepthsUpgradeKey = "provisions" | "prayer" | "sight" | "hardiness";
export type DepthsProgress = {
    shards: number;
    upgrades: Record<DepthsUpgradeKey, number>;
    cleared: number[];
    title?: string;
    daily?: { day: number; best: number };
};

// What cave shards buy, a level at a time, for every Depths run after
export const DEPTHS_UPGRADES: Record<DepthsUpgradeKey, { name: string; effect: string; costs: number[] }> = {
    provisions: { name: "Provisions", effect: "two more of the food you can find packed for you a run, a level", costs: [40, 120, 300] },
    prayer: { name: "Steady prayer", effect: "protection drains a tenth slower in the Depths, a level", costs: [60, 160, 360] },
    sight: { name: "Keen eyes", effect: "a tile more of the dark seen round you, a level", costs: [50, 140, 320] },
    hardiness: { name: "Hardiness", effect: "five more hitpoints in the Depths, a level", costs: [80, 200, 450] },
};

export function newDepths(): DepthsProgress {
    return { shards: 0, upgrades: { provisions: 0, prayer: 0, sight: 0, hardiness: 0 }, cleared: [] };
}

// The profile's Depths progress, made on first want
export function depthsOf(save: SaveData): DepthsProgress {
    save.depths ??= newDepths();
    return save.depths;
}

// The fields each profile keeps for itself; the rest (the character's look
// and name, friends, the save's version) is the same in both
const PROFILE_KEYS = [
    "coins",
    "stash",
    "backpack",
    "equipment",
    "shop",
    "stats",
    "tasks",
    "insured",
    "insuredPaid",
    "upgrades",
    "graves",
    "pets",
    "pet",
    "wear",
    "recentMaps",
    "autocast",
    "spellbook",
    "loadouts",
    "bankOrder",
    "bankTabs",
    "lastRun",
    "contract",
    "pickStarter",
    "threat",
    "activeRun",
    "endlessDepth",
    "depths",
] as const;
type ProfileKey = (typeof PROFILE_KEYS)[number];
export type Profile = Partial<Pick<SaveData, ProfileKey>>;

function profileOf(save: SaveData): Profile {
    const out: Record<string, unknown> = {};
    for (const key of PROFILE_KEYS) {
        if (save[key] !== undefined) {
            out[key] = save[key];
        }
    }
    return out as Profile;
}

export type Mode = "regular" | "endless";

// The profile that's out begun again (version 158: Start over in the
// Depths), from a new save's, a starter kit to pick; the other profile and
// what's shared (the look, name and friends) as they were
export function restartProfile(save: SaveData): void {
    const target = save as unknown as Record<string, unknown>;
    for (const key of PROFILE_KEYS) {
        delete target[key];
    }
    Object.assign(save, profileOf(newSave()));
}

export function modeOf(save: SaveData): Mode {
    return save.mode === "endless" ? "endless" : "regular";
}

// Puts the other profile out: what's out now goes into `other`, and a first
// time into the Depths starts from a new save's (a starter kit to pick)
export function switchMode(save: SaveData, mode: Mode): void {
    if (modeOf(save) === mode) {
        return;
    }
    const away = profileOf(save);
    const back = save.other ?? profileOf(newSave());
    const target = save as unknown as Record<string, unknown>;
    for (const key of PROFILE_KEYS) {
        delete target[key];
    }
    Object.assign(save, back);
    save.other = away;
    if (mode === "endless") {
        save.mode = "endless";
    } else {
        delete save.mode;
    }
}

export type Friend = { code: string; name: string };
export type Loadout = { name: string; equipment: Equipment; backpack: ItemStack[] };
export type BankTab = { name: string; ids: number[] };
export const MAX_FRIENDS = 50;
export const MAX_LOADOUTS = 6;
export const MAX_BANK_TABS = 8;

export type Grave = { map: string; x: number; z: number; items: ItemStack[]; runsLeft: number };
export const GRAVE_RUNS = 2;

export type Upgrades = { pack: number; shop: number; insurance: number; spec: number };

// What each upgrade does per level, and what the levels cost
export const UPGRADES: Record<keyof Upgrades, { name: string; effect: string; costs: number[] }> = {
    pack: { name: "A bigger pack", effect: "four more pack slots a level", costs: [1500, 6000] },
    shop: { name: "Wider shelves", effect: "two more pieces of gear in the shop a level", costs: [800, 3000] },
    insurance: { name: "Guild cover", effect: "insurance a quarter cheaper a level", costs: [1000, 4000] },
    spec: { name: "Battle training", effect: "the special attack bar fills half again as fast a level", costs: [2000, 8000] },
};

export function packSize(save: SaveData): number {
    return 28 + 4 * save.upgrades.pack;
}

// The record, across every run
export type Stats = {
    runs: number;
    extractions: number;
    deaths: number;
    deepest: number;
    kills: number;
    bossKills: number;
    championKills: number;
    rangedKills: number;
    // Most coins carried out of a run, and the quickest escape in seconds (0 for none yet)
    bestHaul: number;
    fastestEscape: number;
    // Maps escaped from, maps whose boss has fallen, and maps beaten: escaped
    // from in a run where its boss fell (the next map opens on that)
    mapsEscaped: string[];
    bossesBeaten: string[];
    mapsBeaten: string[];
    // Clue scrolls dug up, gravestones emptied, and vaults unlocked
    clues: number;
    graves: number;
    vaults: number;
    // Hitpoints lost to hits and seconds spent in runs, all told (version
    // 115): how fast a run eats food, for the vault's word on the pack
    damageTaken: number;
    secondsPlayed: number;
    // The highest threat level each map's been beaten at (version 150)
    bestThreat?: Record<string, number>;
};

const KEY = "dungeon-extraction-save";

// Character slots (version 79): a browser holding a crown key (crown.ts) has
// a second character, a whole save of its own (stash, coins, progress,
// look), kept beside the first under its own key. Which one is played is
// kept too; everyone else only ever has the first.
export const CHARACTER_SLOTS = 2;
const SLOT_STORAGE = "dungeon-extraction-slot";

function slotKey(slot: number): string {
    return slot === 0 ? KEY : `${KEY}-${slot + 1}`;
}

// The slot being played: 0 (the first) unless a crowned browser switched
export function activeSlot(): number {
    try {
        const slot = Number(localStorage.getItem(SLOT_STORAGE) ?? 0);
        return Number.isInteger(slot) && slot >= 0 && slot < CHARACTER_SLOTS ? slot : 0;
    } catch {
        return 0;
    }
}

export function setActiveSlot(slot: number): void {
    try {
        if (slot === 0) {
            localStorage.removeItem(SLOT_STORAGE);
        } else {
            localStorage.setItem(SLOT_STORAGE, String(slot));
        }
    } catch {
        // No storage: always the first
    }
}

// Another slot's save, to name it on the switch (undefined: nobody there yet)
export function peekSlot(slot: number): SaveData | undefined {
    try {
        const raw = localStorage.getItem(slotKey(slot));
        return raw ? parseSave(raw) : undefined;
    } catch {
        return undefined;
    }
}

export function newSave(): SaveData {
    return {
        version: SAVE_VERSION,
        coins: 50,
        // The guild's starter kit
        stash: [{ id: 1129, count: 1 }],
        backpack: [{ id: 315, count: 8 }],
        equipment: { weapon: 1277 },
        character: { name: "Adventurer", kits: DEFAULT_KITS.slice(), colors: DEFAULT_COLORS.slice(), size: 1 },
        shop: rollShopStock(Math.random, 1),
        stats: {
            runs: 0,
            extractions: 0,
            deaths: 0,
            deepest: 0,
            kills: 0,
            bossKills: 0,
            championKills: 0,
            rangedKills: 0,
            bestHaul: 0,
            fastestEscape: 0,
            mapsEscaped: [],
            bossesBeaten: [],
            mapsBeaten: [],
            clues: 0,
            graves: 0,
            vaults: 0,
            damageTaken: 0,
            secondsPlayed: 0,
        },
        tasks: [],
        upgrades: { pack: 0, shop: 0, insurance: 0, spec: 0 },
        graves: [],
        pets: [],
        wear: {},
        recentMaps: [],
        friendKey: newFriendKey(),
        friends: [],
        loadouts: [],
        bankOrder: [],
        bankTabs: [],
        pickStarter: true,
        thrownBundles: true,
    };
}

// A character's friend key (version 115): random, kept in the save; the
// relay hashes it into the friend code everyone sees
function newFriendKey(): string {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const THROWN_GRANT = 100;

// A list with each stackable thing in one stack
function mergeStacks(list: ItemStack[]): ItemStack[] {
    const out: ItemStack[] = [];
    for (const s of list) {
        const same = getItem(s.id).stackable ? out.find((o) => o.id === s.id) : undefined;
        if (same) {
            same.count += s.count;
        } else {
            out.push({ ...s });
        }
    }
    return out;
}

// A save from its JSON, brought up to date; undefined if it isn't one
export function parseSave(raw: string): SaveData | undefined {
    try {
        const data = JSON.parse(raw) as SaveData;
        if (data.version !== SAVE_VERSION || !data.character || !Array.isArray(data.stash)) {
            return undefined;
        }
        const fresh = newSave();
        const save = { ...fresh, ...data };
        // Saves from before the record grew, or tasks
        save.stats = { ...fresh.stats, ...(data.stats ?? {}) };
        save.upgrades = { ...fresh.upgrades, ...(data.upgrades ?? {}) };
        if (!Array.isArray(save.tasks)) {
            save.tasks = [];
        }
        // Saves from before gravestones and pets
        if (!Array.isArray(save.graves)) {
            save.graves = [];
        }
        if (!Array.isArray(save.pets)) {
            save.pets = [];
        }
        if (save.pet !== undefined && !save.pets.includes(save.pet)) {
            save.pet = undefined;
        }
        if (!save.wear || typeof save.wear !== "object") {
            save.wear = {};
        }
        if (!Array.isArray(save.recentMaps)) {
            save.recentMaps = [];
        }
        if (save.autocast !== undefined && !SPELL_BY_ID.has(save.autocast)) {
            delete save.autocast;
        }
        if (save.spellbook !== undefined && save.spellbook !== "standard" && save.spellbook !== "ancient") {
            delete save.spellbook;
        }
        // Threat levels (version 150): numbers by map, or none
        const levels = (record: unknown): Record<string, number> | undefined => {
            if (!record || typeof record !== "object") {
                return undefined;
            }
            const out: Record<string, number> = {};
            for (const [map, level] of Object.entries(record)) {
                out[map] = clampThreat(level);
            }
            return out;
        };
        save.threat = levels(save.threat);
        save.stats.bestThreat = levels(save.stats.bestThreat);
        // Empty stacks (a deposit that went wrong before version 39) go, and
        // so does anything the game no longer has (the Santa hat, say)
        const whole = (list: ItemStack[]) => list.filter((s) => s && typeof s.id === "number" && s.count > 0 && ITEM_BY_ID.has(s.id));
        save.stash = whole(save.stash);
        save.backpack = whole(Array.isArray(save.backpack) ? save.backpack : []);
        for (const grave of save.graves) {
            grave.items = whole(grave.items ?? []);
        }
        for (const [slot, id] of Object.entries(save.equipment)) {
            if (id === undefined || !ITEM_BY_ID.has(id)) {
                delete save.equipment[slot as Slot];
            }
        }
        if (save.insured !== undefined && !ITEM_BY_ID.has(save.insured)) {
            save.insured = undefined;
        }
        if (save.insured === undefined || typeof save.insuredPaid !== "number" || !(save.insuredPaid >= 0)) {
            save.insuredPaid = undefined;
        }
        if (Array.isArray(save.shop)) {
            // (a thrown weapon is sold by the bundle since version 146, never
            // off the gear shelves; and nothing purple or gold since version
            // 158, which only bosses' chests give)
            save.shop = save.shop.filter((id) => ITEM_BY_ID.has(id) && !getItem(id).thrown && getItem(id).tier <= FOUND_TIER_MAX);
        }
        // Saves from before looks were built from body kits
        if (!Array.isArray(save.character.kits) || !Array.isArray(save.character.colors)) {
            save.character = { ...newSave().character, name: save.character.name, size: save.character.size ?? 1, nameColor: save.character.nameColor };
        }
        if (typeof save.character.nameColor !== "string") {
            delete save.character.nameColor;
        }
        if (!Array.isArray(save.shop)) {
            save.shop = rollShopStock(Math.random, Math.max(1, save.stats?.deepest ?? 1));
        }
        // Version 115's: anything that isn't what it should be goes
        if (typeof save.friendKey !== "string" || save.friendKey.length < 16) {
            delete save.friendKey;
            delete save.friendCode;
        }
        if (typeof save.friendCode !== "string" || !/^[A-Z0-9]{8}$/.test(save.friendCode)) {
            delete save.friendCode;
        }
        save.friends = Array.isArray(save.friends)
            ? save.friends.filter((f) => f && typeof f.code === "string" && typeof f.name === "string").slice(0, MAX_FRIENDS)
            : [];
        save.loadouts = Array.isArray(save.loadouts)
            ? save.loadouts
                  .filter((l) => l && typeof l.name === "string" && l.equipment && typeof l.equipment === "object" && Array.isArray(l.backpack))
                  .map((l) => ({
                      name: l.name.slice(0, 16),
                      equipment: Object.fromEntries(Object.entries(l.equipment).filter(([, id]) => typeof id === "number" && ITEM_BY_ID.has(id))),
                      backpack: whole(l.backpack),
                  }))
                  .slice(0, MAX_LOADOUTS)
            : [];
        save.bankOrder = Array.isArray(save.bankOrder) ? save.bankOrder.filter((id) => typeof id === "number" && ITEM_BY_ID.has(id)) : [];
        save.bankTabs = Array.isArray(save.bankTabs)
            ? save.bankTabs
                  .filter((t) => t && typeof t.name === "string" && Array.isArray(t.ids))
                  .map((t) => ({ name: t.name.slice(0, 16), ids: t.ids.filter((id) => typeof id === "number" && ITEM_BY_ID.has(id)) }))
                  .slice(0, MAX_BANK_TABS)
            : [];
        if (!save.lastRun || typeof save.lastRun.at !== "number" || typeof save.lastRun.map !== "string") {
            delete save.lastRun;
        }
        if (!save.contract || typeof save.contract.day !== "number" || typeof save.contract.map !== "string") {
            delete save.contract;
        }
        // Only a save made with the choice still to make has it (fresh's
        // true isn't an older save's), and only before its first run
        if (data.pickStarter !== true || save.stats.runs > 0) {
            delete save.pickStarter;
        }
        // Thrown weapons stack since version 146, and each throw takes one:
        // a save's separate ones are made one stack, and a save from before
        // it gets THROWN_GRANT more of each kind it has, once, so what it
        // bought as a weapon still throws (data's, as fresh's is true)
        save.stash = mergeStacks(save.stash);
        save.backpack = mergeStacks(save.backpack);
        if (data.thrownBundles !== true) {
            const owned = new Set([...save.stash, ...save.backpack].map((s) => s.id).concat(Object.values(save.equipment)));
            for (const id of owned) {
                if (getItem(id).thrown) {
                    save.stash = mergeStacks([...save.stash, { id, count: THROWN_GRANT }]);
                }
            }
            save.thrownBundles = true;
        }
        // The Depths' profiles (version 156): the one waiting is made good the
        // same way as the one out, from its own fields and the shared ones
        if (save.mode !== "endless") {
            delete save.mode;
        }
        if (typeof save.endlessDepth === "number" && Number.isFinite(save.endlessDepth)) {
            save.endlessDepth = Math.min(5, Math.max(1, Math.floor(save.endlessDepth)));
        } else {
            delete save.endlessDepth;
        }
        save.depths = cleanDepths(data.depths);
        if (data.other && typeof data.other === "object") {
            const shared: Record<string, unknown> = { ...data, other: undefined, mode: undefined };
            for (const key of PROFILE_KEYS) {
                delete shared[key];
            }
            const other = parseSave(JSON.stringify({ ...shared, ...data.other }));
            if (other) {
                save.other = profileOf(other);
            } else {
                delete save.other;
            }
        } else {
            delete save.other;
        }
        save.friendKey ??= newFriendKey();
        return save;
    } catch {
        return undefined;
    }
}

// A save's Depths progress, kept to what it could be (version 161)
function cleanDepths(raw: unknown): DepthsProgress | undefined {
    if (!raw || typeof raw !== "object") {
        return undefined;
    }
    const d = raw as Partial<DepthsProgress>;
    const count = (n: unknown, max: number) => (typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0);
    const out = newDepths();
    out.shards = count(d.shards, 1e9);
    for (const key of Object.keys(DEPTHS_UPGRADES) as DepthsUpgradeKey[]) {
        out.upgrades[key] = count(d.upgrades?.[key], DEPTHS_UPGRADES[key].costs.length);
    }
    out.cleared = Array.isArray(d.cleared) ? [...new Set(d.cleared.filter((n) => Number.isInteger(n) && n >= 1 && n <= 5))].sort() : [];
    if (typeof d.title === "string" && d.title.length <= 40) {
        out.title = d.title;
    }
    if (d.daily && typeof d.daily === "object") {
        out.daily = { day: count(d.daily.day, 1e7), best: count(d.daily.best, 1e12) };
    }
    return out;
}

// The save in this browser, or a new one; `wiped` says a save from an older
// version (or a broken one) was there and has been dropped
// The slot this page loaded, and writes to: fixed for the page's life, so a
// second tab that switched characters can't have this one write over the
// other character
let pageSlot = 0;

export function loadedSlot(): number {
    return pageSlot;
}

export function loadSave(): { save: SaveData; wiped: boolean } {
    pageSlot = activeSlot();
    const raw = localStorage.getItem(slotKey(pageSlot));
    const save = raw ? parseSave(raw) : undefined;
    if (save) {
        return { save, wiped: false };
    }
    const fresh = newSave();
    if (raw) {
        writeSave(fresh);
    }
    return { save: fresh, wiped: !!raw };
}

// A save as text to carry to another browser, with a tag in front so it's
// plainly a save code. DX2 (version 101): the stash and pack as bare ids
// (or [id, count]), the JSON deflated and in URL-safe base64, a third of
// the length or less. DX1, the JSON as it is in plain base64, still loads,
// and is what a browser without the compressor gets.
const CODE_TAG = "DX1-";
const PACKED_TAG = "DX2-";

type PackedStack = number | [number, number];

function packStacks(list: ItemStack[]): PackedStack[] {
    return list.map((s) => (s.count === 1 ? s.id : [s.id, s.count]));
}

function unpackStacks(list: unknown): unknown {
    if (!Array.isArray(list)) {
        return list;
    }
    return list.map((s: unknown) => (typeof s === "number" ? { id: s, count: 1 } : Array.isArray(s) ? { id: Number(s[0]), count: Number(s[1]) } : s));
}

// Bytes to base64 and back, a piece at a time (one spread of a big save's
// bytes into String.fromCharCode can overflow the call stack)
function toBase64(bytes: Uint8Array): string {
    let text = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
        text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(text);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

async function run(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
    const writer = stream.writable.getWriter();
    void writer.write(bytes);
    void writer.close();
    return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

export async function saveCode(save: SaveData): Promise<string> {
    if (typeof CompressionStream === "undefined") {
        return CODE_TAG + toBase64(new TextEncoder().encode(JSON.stringify(save)));
    }
    const packed = { ...save, stash: packStacks(save.stash), backpack: packStacks(save.backpack) };
    const deflated = await run(new TextEncoder().encode(JSON.stringify(packed)), new CompressionStream("deflate-raw"));
    return PACKED_TAG + toBase64(deflated).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Undefined if it isn't one: no tag, cut short or garbled, or from a save
// version this game no longer takes
export async function parseSaveCode(code: string): Promise<SaveData | undefined> {
    // Spaces and line breaks a chat app put in don't count
    const trimmed = code.replace(/\s+/g, "");
    try {
        if (trimmed.startsWith(PACKED_TAG)) {
            if (typeof DecompressionStream === "undefined") {
                return undefined;
            }
            let body = trimmed.slice(PACKED_TAG.length).replace(/-/g, "+").replace(/_/g, "/");
            body += "=".repeat((4 - (body.length % 4)) % 4);
            const json = new TextDecoder().decode(await run(fromBase64(body), new DecompressionStream("deflate-raw")));
            const data = JSON.parse(json) as Record<string, unknown>;
            data.stash = unpackStacks(data.stash);
            data.backpack = unpackStacks(data.backpack);
            return parseSave(JSON.stringify(data));
        }
        if (trimmed.startsWith(CODE_TAG)) {
            return parseSave(new TextDecoder().decode(fromBase64(trimmed.slice(CODE_TAG.length))));
        }
    } catch {
        // Cut short or garbled
    }
    return undefined;
}

// Told of every write of the first character's save (version 116: main.ts
// sends it to the account), unless it's quiet (a save that came from the
// account)
let onWrite: ((save: SaveData) => void) | undefined;

export function setOnWrite(listener: (save: SaveData) => void): void {
    onWrite = listener;
}

// The page playing a run says so every few seconds (version 153), under
// its own key so the save isn't written each time; a run whose page has
// said nothing for a while has been left
function aliveKey(): string {
    return `${slotKey(pageSlot)}-alive`;
}

export function runAlive(): void {
    try {
        localStorage.setItem(aliveKey(), String(Date.now()));
    } catch {
        // No storage: nothing to settle later either
    }
}

export function runHeartbeatAge(): number {
    try {
        const at = Number(localStorage.getItem(aliveKey()));
        return at > 0 ? Date.now() - at : Infinity;
    } catch {
        return Infinity;
    }
}

export function writeSave(save: SaveData, quiet = false): void {
    localStorage.setItem(slotKey(pageSlot), JSON.stringify(save));
    if (!quiet && pageSlot === 0) {
        onWrite?.(save);
    }
}

// Owner-only pieces out of a save (version 154): a save code loaded into a
// browser without a crown, which turned a test character's kit into
// ordinary items there
export function dropExclusive(save: SaveData): void {
    const mine = (s: ItemStack) => !getItem(s.id).exclusive;
    save.stash = save.stash.filter(mine);
    save.backpack = save.backpack.filter(mine);
    for (const [slot, id] of Object.entries(save.equipment)) {
        if (id !== undefined && getItem(id).exclusive) {
            delete save.equipment[slot as Slot];
        }
    }
    for (const grave of save.graves) {
        grave.items = grave.items.filter(mine);
    }
    for (const loadout of save.loadouts ?? []) {
        loadout.backpack = loadout.backpack.filter(mine);
        for (const [slot, id] of Object.entries(loadout.equipment)) {
            if (id !== undefined && getItem(id).exclusive) {
                delete loadout.equipment[slot as Slot];
            }
        }
    }
    // And the profile waiting (version 156), the same way
    if (save.other) {
        const o = save.other;
        const other = { ...o, stash: o.stash ?? [], backpack: o.backpack ?? [], equipment: o.equipment ?? {}, graves: o.graves ?? [] } as SaveData;
        dropExclusive(other);
        save.other = profileOf(other);
    }
}

export function resetSave(): SaveData {
    const save = newSave();
    writeSave(save);
    return save;
}
