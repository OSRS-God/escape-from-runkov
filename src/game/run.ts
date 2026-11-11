// One run on a map: the exported OSRS region, the player, the enemies and
// boss scattered over it, the chests, the loot, and the way out where you
// came in.
import * as THREE from "three";

import { PLAYER_SOUND_NPC } from "../content/bodies";
import { HERO_TORCHES, TORCHES, TORCH_RADIUS, addTorchTo, flicker, setSeeThrough, setTorch, setTorchNight, torchesOut } from "./torch";
import { EnemyDef, SECOND_FORM_SHARE } from "../content/enemies";
import {
    BOLT,
    BOSS_KEY,
    CLUE_SCROLL,
    COINS,
    EAT_DELAY,
    FOOD_BY_TIER,
    HOLY_SECONDS,
    ITEM_BY_ID,
    POTION_EFFECT,
    POTION_SECONDS,
    PRAYER_RESTORE,
    PRAYER_BONUS_SCALE,
    Potion,
    SHOP_POTIONS,
    SLOTS,
    Special,
    TIER_COLOURS,
    VAULT_KEY,
    BRIMSTONE_KEY,
    ItemDef,
    ammoOfTier,
    gearPower,
    getItem,
    iconUrl,
    pluralName,
    rollGear,
    GEAR_BY_TIER,
    PRIZES,
    CRYSTAL_PURPLE_CHANCE,
    FOUND_TIER_MAX,
    specialOf,
    tierGlows,
} from "../content/items";
import {
    AHRIMS_STAFF,
    AMULET_OF_THE_DAMNED,
    Book,
    POISON_EVERY,
    POISON_HITS,
    SPELL_BY_ID,
    SpellDef,
    WEAKEN_SECONDS,
    bestSpell,
    castsAncients,
    castsLeft,
    poweredSpell,
    runeDrop,
    runesGiven,
    spellCost,
    spellScale,
    staffCasts,
} from "../content/spells";
import { Threat, threatName, threatOf, threatText } from "../content/threat";
import { CASTLE_ID, ENDLESS_BOSSES, ENDLESS_ID, ENDLESS_DEPTHS, SUPERIOR_MAX, SUPERIOR_ONE_IN, WorldDef, modeWorld } from "../content/worlds";
import { GameStart, LootRule } from "./coop";
import { Hero, Mate } from "./mates";
import {
    CLIP_ATTACK,
    CLIP_DEATH,
    CLIP_IDLE,
    CLIP_WALK,
    DownMessage,
    EnemyClip,
    EnemyDefLite,
    EnemyShot,
    HERO_ATTACK,
    HERO_DEATH,
    HERO_IDLE,
    HERO_RUN,
    HeroAnim,
    HeroState,
    KEYFRAME_EVERY,
    LOAD_WAIT_SECONDS,
    SNAPSHOT_HZ,
    SNAPSHOT_MAX_ENEMIES,
    SNAPSHOT_RANGE,
    STATE_CODES,
    STATE_NAMES,
    SpawnMessage,
    UpMessage,
    PRAY_NAMES,
    isDown,
    isUp,
    prayCode,
    round1,
    round2,
} from "./party";
import { MapLoad, loadMap } from "./mapload";
import { Overhead } from "./overhead";
import { PET_ONE_IN, PetBuff, applyPetStats, createPet, petBuff } from "./pets";
import { addShadow, groundShadow } from "./shadows";
import { iconTexture } from "./icons";
import {
    Actor,
    createActor,
    loadModel,
    loadTexture,
    npcSound,
    play,
    playChime,
    playPop,
    playSound,
    scrollTextures,
    setWorldLight,
    tint,
} from "./assets";
import { assetUrl } from "./paths";
import { REGEN_DELAY, REGEN_PER_SECOND, ammoScale, enemyHit, hitChance, playerHit } from "./combat";
import { Rng, makeRng } from "./dungeon";
import {
    BASE_HP,
    GearStats,
    INVENTORY_SIZE,
    WEAR_PER_HIT,
    BREW_HEAL,
    Wear,
    addItem,
    canCarry,
    carryLimitText,
    countOf,
    equip,
    gearStats,
    healOf,
    removeItem,
    roomFor,
    sellPrice,
    unequip,
    wearOf,
} from "./inventory";
import { CROWN_SHEET_HEIGHT, crownKey, crownSprite, crownVerified, nameColorOf } from "./crown";
import { playMusic } from "./music";
import { PlayerLook, RUN_CLIP_SPEED } from "./player";
import { isKept } from "./kit";
import { starterKit } from "./starter";
import { MERC_CUT, MERC_DEFS, MercDef, MercKind, STYLE_OWNER, mercBetter, mercFits, mercScale, mercWears } from "./mercs";
import { Region, Tile, TileSet, loadRegion } from "./region";
import { CASTLE_ROOMS, CAVE_ROOMS, CaveLayout, DOOR_BITS, DOOR_EAST, DOOR_NORTH, DOOR_SOUTH, DOOR_WEST, layoutCave } from "./caves";
import {
    ARMOUR_LOC,
    BANQUET_LOC,
    BARREL_LOC,
    BOOKCASE_LOC,
    BOOKS,
    BRAZIER_LIT_LOC,
    BRAZIER_LOC,
    CAVE_EEL,
    CELL_LOC,
    CELL_SCALE,
    CORPSE_LOCS,
    CRACK_LOC,
    FONT_LOC,
    GEMS,
    HOLY_BANE,
    HOLY_WATER,
    LADDER_LOC,
    LECTERN_LOC,
    LEVER_LOC,
    PASSAGE_LOCS,
    PORTRAIT_LOC,
    PRISONER_NPC,
    PROP_DOTS,
    PROP_KINDS,
    PROP_PLANS,
    Prop,
    PropKind,
    SEARCH_LOCS,
    SEARCH_NAMES,
    SHRINE_DAMAGE,
    SHRINE_DEFENCE,
    SHRINE_LOC,
    SHRINE_TRADES,
    VEINS,
    VEIN_WEIGHTS,
    ALCHEMY_LOC,
    BELL_LOC,
    CART_LOC,
    FUNGUS_LOC,
    HERBS,
    HERBS_LOC,
    MAP_SCRAP,
    MORT_MYRE,
    RACK_LOC,
    THRONE_LOC,
    TRAP_LOC,
    ANVIL_LOC,
    COFFIN_LOC,
    GATE_LOC,
    STRONGBOX_LOC,
    WEB_LOC,
    WELL_LOC,
} from "./props";
import { Character, DepthsUpgradeKey, Equipment, Grave, ItemStack } from "./save";
import { ZOOM_MAX, ZOOM_MIN, saveSettings, settings } from "./settings";

export type RunCarry = {
    // The Depths' delvers' upgrades (save.ts DEPTHS_UPGRADES, version 161),
    // and the day, if it's that day's daily cave (depths.ts)
    depths?: { upgrades: Record<DepthsUpgradeKey, number>; daily?: number };
    inventory: ItemStack[];
    equipment: Equipment;
    coins: number;
    hp?: number;
    // The guild's upgrades: pack slots, and how fast the special bar fills
    packSize?: number;
    specRate?: number;
    // Your gravestone on this map, if you died here lately, with what's in it
    grave?: Grave;
    // The pet that comes along, and every pet owned (a boss drops no second)
    pet?: string;
    pets?: string[];
    // How worn each piece of armour is (inventory.ts): it wears on in a run
    // and comes back with the gear
    wear?: Wear;
    // The spell picked to autocast (content/spells.ts; version 106), or
    // none: a staff then casts the strongest it can of the book open
    // (standard or Ancient Magicks, version 107)
    autocast?: string;
    spellbook?: Book;
    // The run's threat level (content/threat.ts, version 150): the host's
    // for a party
    threat?: number;
    // The character's starter class (starter.ts, version 171), for its perk
    perk?: string;
    // The mercenary hired for a solo run (mercs.ts, version 173), with what
    // they've been given to wear and eat (version 175)
    merc?: { kind: MercKind; name: string; level: number; gear?: Equipment; food?: ItemStack[] };
};

// The starter classes' perks (version 171, as the user asked; starter.ts
// names them): the Squire's hitpoints, the share of the arrows the Archer and
// the runes the Apprentice would use that's kept, the Delver's sight and how much
// longer its oil burns, and how much slower the Monk's protection drains
const PERK_HP = 10;
const PERK_AMMO = 0.2;
const PERK_SIGHT = 1;
const PERK_OIL = 1.25;
const PERK_PRAYER = 0.8;

// Version 172 (as the user asked): a curse on every Depths and Forgotten
// Castle run, from the run's seed so a party, and the daily cave, share it:
// its name, what it does and what it pays for it (the coins' share)
type CurseId = "dark" | "blood" | "quiet" | "restless" | "frenzy";
const CURSES: Record<CurseId, { name: string; text: string; coins: number }> = {
    dark: { name: "The dark runs deeper", text: "two tiles less sight, and a quarter more coins", coins: 1.25 },
    blood: { name: "Blood moon", text: "everything hits a fifth harder, and the coins are half again", coins: 1.5 },
    quiet: { name: "Quiet halls", text: "a quarter fewer monsters, and a quarter fewer chests", coins: 1 },
    restless: { name: "Restless dead", text: "superiors rise twice as often", coins: 1 },
    frenzy: { name: "Frenzy", text: "everything moves faster, and every kill heals you", coins: 1 },
};
const CURSE_IDS = Object.keys(CURSES) as CurseId[];
const CURSE_SIGHT = 2;
const CURSE_HIT = 1.2;
const CURSE_FEWER = 0.75;
const CURSE_SPEED = 1.15;
const CURSE_HEAL = 3;

function curseOf(seed: number): CurseId {
    return CURSE_IDS[(Math.imul(seed ^ 0xc0ffee, 2654435761) >>> 0) % CURSE_IDS.length];
}

// The map as its curse leaves it: a blood moon's harder hits, quiet halls'
// fewer monsters and chests
function curseWorld(world: WorldDef, curse: CurseId | undefined): WorldDef {
    if (curse === "blood") {
        const hit = (def: EnemyDef): EnemyDef => ({ ...def, damage: Math.round(def.damage * CURSE_HIT) });
        return {
            ...world,
            enemies: world.enemies.map((e) => ({ def: hit(e.def), weight: e.weight })),
            boss: hit(world.boss),
            bosses: world.bosses?.map(hit),
            superiors: world.superiors ? Object.fromEntries(Object.entries(world.superiors).map(([id, def]) => [id, hit(def)])) : undefined,
        };
    }
    if (curse === "quiet") {
        return { ...world, enemyCount: Math.round(world.enemyCount * CURSE_FEWER), chests: Math.round(world.chests * CURSE_FEWER) };
    }
    return world;
}

// A slayer contract on every such run (version 172): so many of one kind
// (from the seed, the same for a party; each counts their own kills), paid
// this purse (and 2.2 times more a tier) on the spot and shards after
const CONTRACT_COUNT: [number, number] = [6, 12];
const CONTRACT_COINS: [number, number] = [150, 300];
// The floor's spike traps: seen this near by lantern light (less without),
// sprung by a step this close, hurting what's this near (a share of a hero's
// hitpoints, an enemy so much and 1.8 times more a tier), a hero held a
// moment, set again after a while
const SPIKE_SEEN = 3;
const SPIKE_SEEN_DARK = 1.5;
const SPIKE_STEP = 0.7;
const SPIKE_REACH = 1.1;
const SPIKE_HURT = 0.15;
const SPIKE_HIT = 25;
const SPIKE_HELD = 1;
const SPIKE_REARM = 20;
// The Depths' glowing fungus: bites a patch, the hold to pick some, how long
// a bite's sight or haze lasts and how far, and its heal
const FUNGUS_BITES = 2;
const FUNGUS_HOLD = 1.5;
const FUNGUS_SECONDS = 45;
const FUNGUS_SIGHT = 3;
const FUNGUS_HEAL = 0.2;
// Courtyard herbs; a mine cart's odds of jumping the rails, its fall, and
// how far its arrival is heard; the bell's pull and how much less a lured
// monster notices on the way
const HERBS_PICKS = 2;
const HERBS_HOLD = 2;
const CART_DERAIL = 0.2;
const CART_HURT = 0.1;
const CART_NOISE = 12;
const BELL_SECONDS = 45;
const BELL_AGGRO = 0.3;
// The Depths' tunneller: so often it digs, for so long, coming up this far
// from someone
const TUNNEL_EVERY: [number, number] = [40, 70];
const TUNNEL_UNDER = 5;
const TUNNEL_NEAR: [number, number] = [6, 9];
// The castle's ghosts: how many, their model (the Ghost's)
const GHOSTS = 6;
const GHOST_NPC = 85;
// Night falling in the castle: the dark at its deepest by then, how much
// darker and how much less is seen, how often it deepens, and the vampyres
// waking from then on, so many so often
const NIGHT_FULL = 600;
const NIGHT_DARKEN = 0.4;
const NIGHT_SIGHT = 2;
const NIGHT_STEP = 20;
const NIGHT_VAMPYRES_FROM = 240;
const NIGHT_VAMPYRES_EVERY = 90;
const NIGHT_VAMPYRES = 2;
// The Forgotten King: wakes with this many lords slain; the strongest lord's
// hitpoints and hit this many times, his size, and his hoard's pieces
const KING_AFTER = 3;
const KING_ID = "castle:forgotten_king";
const KING_HP = 1.5;
const KING_DAMAGE = 1.2;
const KING_SCALE = 1.9;
const KING_GEAR = 3;
// A chest's odds of a map scrap
const SCRAP_CHANCE = 0.1;

// A style to protect from: enemies hit with it do half while the prayer
// bar lasts (Z, X, C, or the Pray button)
export type ProtectStyle = "none" | "melee" | "ranged" | "magic";

export function styleOf(def: EnemyDef): ProtectStyle {
    return def.shoots?.style ?? "melee";
}

// How a run ended: out with the loot, dead, or walked out of it from the
// pause menu (which loses what was carried, the same as dying), with the
// run's report card
export type RunResult = {
    kind: "extracted" | "died" | "left";
    carry: RunCarry;
    world: WorldDef;
    report: RunReport;
};

// What happened in a run, for the record, the tasks and the recap: how
// long, what was killed, what was eaten, what the pack held, who did it,
// and the map as it was seen with where it ended marked
export type RunReport = {
    seconds: number;
    kills: number;
    bossKills: number;
    championKills: number;
    // The Depths' superiors slain (version 161)
    superiorKills: number;
    rangedKills: number;
    ate: number;
    packItems: number;
    killer?: string;
    map: HTMLCanvasElement;
    // Where it ended (a gravestone goes there)
    x: number;
    z: number;
    // What's still in the gravestone visited, and whether it was emptied
    graveItems?: ItemStack[];
    graveTaken: boolean;
    // Clue scrolls dug up, vaults unlocked, and the pet a boss dropped
    // (the map's id)
    clues: number;
    vaults: number;
    petFound?: string;
    // Whether it was a night run
    night: boolean;
    // For the tasks (version 75): hits taken, chests opened by this player
    // (and whether the boss's golden one was), potions drunk, special
    // attacks used, things bought from the trader, whether the genie was
    // paid for the way out, how many seconds the ways out had left at the
    // end, and how many were in the party
    hitsTaken: number;
    // Hitpoints lost to them (version 115)
    damageTaken: number;
    chestsOpened: number;
    goldenOpened: boolean;
    drank: number;
    specials: number;
    traderBuys: number;
    genie: boolean;
    secondsLeft: number;
    party: number;
    // Party balloons this player burst (version 129)
    balloons: number;
    // Version 172: the run's slayer contract done, and the Forgotten King
    // slain
    contract?: boolean;
    kingSlain?: boolean;
    // Version 173: whether the mercenary lived (and so whether their kind
    // goes up a level or starts again), and the coins they took
    // (and what they wear and carry of yours now: version 175)
    merc?: { kind: MercKind; survived: boolean; gear: Equipment; food: ItemStack[] };
    mercCut?: number;
};

export type RunHooks = {
    onEnd: (result: RunResult) => void;
    onMessage: (text: string) => void;
    // Something the HUD shows changed
    onChanged: () => void;
    // The player's at the trader: the UI opens the trade
    onTrade: () => void;
    // A hit landed on the player, this hard (a phone buzzes)
    onHurt?: (hit: number) => void;
};

// A co-op run (party.ts): whether this browser hosts it or is a guest in
// it, who this player is to the relay, everyone in the party as the start
// named them, and how a message gets to the others (the host's go to every
// guest, a guest's to the host)
export type CoopSetup = {
    role: "host" | "guest";
    me: string;
    heroes: GameStart["heroes"];
    send: (message: unknown) => void;
    // How the coins found are shared (version 115; the host's to apply)
    loot?: LootRule;
};

// What the HUD shows of the party
export type PartyMember = { id: string; name: string; hp: number; maxHp: number; dead: boolean; done: boolean; me: boolean; color?: string };

// With more in the party, the enemies have more in them: this much over for
// each player past the first, and the boss this much
const PARTY_ENEMY_HP = 0.25;
// Half until version 78: four players with revives made short work of it
const PARTY_BOSS_HP = 0.75;

// A health bar over an enemy's head, the client's way: green over red,
// shown while it fights and for a while after
type HealthBar = { group: THREE.Group; fill: THREE.Sprite };
const BAR_SECONDS = 6;
const BAR_WIDTH = 1;

type Enemy = {
    def: EnemyDef;
    actor: Actor;
    x: number;
    z: number;
    facing: number;
    hp: number;
    bar?: HealthBar;
    // Seconds the bar stays up
    barShown: number;
    // Fleeing: running for help, low on health, before coming back
    state: "idle" | "chase" | "attack" | "flee" | "dead";
    cooldown: number;
    // Seconds between attacks: the def's, less once a boss is enraged
    interval: number;
    // Seconds until the swing lands
    hitIn: number;
    deadFor: number;
    flash: number;
    // Its colour when nothing's flashing it: white, gold for a champion,
    // red for an enraged boss
    tint: THREE.Color;
    enraged?: boolean;
    // A boss's ground slam, its marked strike, and burning floor: seconds
    // to the next
    slamIn: number;
    strikeIn: number;
    floorIn: number;
    // Seconds of crawling, from Ahrim's set
    slow: number;
    // Seconds of charging, after a hit from out of its reach (RILE_SPEED)
    riled: number;
    // Ancient Magicks (version 107): seconds frozen in place (ice); a share
    // off its hits and for how long (shadow); poison (smoke): what each
    // hit of it does, how many are left, seconds to the next, and whose;
    // and, thawed, seconds before ice can hold it again (FREEZE_IMMUNE)
    frozen: number;
    thawed: number;
    weak: number;
    weakLeft: number;
    poisonHit: number;
    poisonLeft: number;
    poisonNext: number;
    poisonBy?: Hero;
    // A shooter that alternates: what the next shot is
    style?: "magic" | "ranged";
    // A second form, once it's fallen the first time
    reborn?: boolean;
    // The Depths' boss hunting you (empowerBosses): on the maps wherever it
    // is, and on the HUD with how far and which way
    hunting?: boolean;
    // A Depths boss's signature move (SIGNATURES, version 161): seconds to
    // the next, which turn of it is next, the shares of its health whose
    // moves are done, seconds still under the ground (the Giant Mole), the
    // adds it's brought, and (on an add) the boss it mends while it lives
    sigIn?: number;
    sigStep?: number;
    sigMarks?: number[];
    burrowed?: number;
    // When the Depths' tunneller next digs off (version 172)
    tunnelAt?: number;
    adds?: Enemy[];
    mends?: Enemy;
    // A patrol: the tiles it walks between while idle, which it's heading
    // for, and how long it's been getting nowhere
    route?: Tile[];
    routeAt: number;
    stuck: number;
    // The champion carrying the vault's key
    key?: boolean;
    // An elite's trait (TRAITS), and whether it's been called out
    trait?: Trait;
    noticed?: boolean;
    // Which side of the player a melee enemy goes for, and when it last
    // took a hit (a boss heals if it's left alone; a regenerating elite
    // heals once it's been left alone a moment)
    flank: number;
    lastHurtAt: number;
    // Version 178: who last hurt it and when (a grudge), and till when it's
    // coming to look at a noise
    lastHurtBy?: Hero;
    grudgeAt: number;
    curiousUntil: number;
    // Running for help: once an enemy, for this long, and it won't give
    // up the chase until this time
    fled?: boolean;
    fleeLeft: number;
    noIdleUntil: number;
    // Co-op: its number for the network, who it's after, how many times
    // it's attacked (the guests replay each), what was last sent of it, and
    // (on a guest) when this player last hit it, so the host's word on its
    // health isn't shown as a hit twice
    uid: number;
    target?: Hero;
    attacks: number;
    sentX: number;
    sentZ: number;
    sentClip: EnemyClip;
    sentState: string;
    sentHp: number;
    tintCode: 0 | 1 | 2;
    myHitAt: number;
    // Where it was put (a boss walks back there when it gives up a chase),
    // and when it last said it was giving up
    homeX: number;
    homeZ: number;
    gaveUpAt: number;
    // A guest's copy: where the host's last word put it, eased towards, and
    // which of its attacks have been played
    targetX: number;
    targetZ: number;
    targetFacing: number;
    seenAttacks: number;
};

// Elite traits: one enemy in ELITE_ONE_IN has one, shown by its tint
type Trait = "fast" | "armoured" | "venomous" | "regenerating";
const TRAITS: Record<Trait, { tint: THREE.Color; what: string }> = {
    fast: { tint: new THREE.Color(1.35, 1.3, 0.5), what: "half again as quick" },
    armoured: { tint: new THREE.Color(0.7, 0.72, 0.85), what: "your hits do six tenths" },
    venomous: { tint: new THREE.Color(0.65, 1.35, 0.65), what: "its hits poison you; food settles it" },
    regenerating: { tint: new THREE.Color(1.35, 0.75, 1.1), what: "it heals when left alone" },
};

// A pet following the player: its model, where it is and which way it faces
type Pet = { actor: Actor; x: number; z: number; facing: number; stuck: number };
// A way out: where its portal stands, and whether it's been seen
type Exit = { x: number; z: number; actor?: Actor; found: boolean };

// A patch of ground about to hurt: the ring warning where, and what it does
// to whoever's on it when the time's up
type Hazard = { ring: THREE.Mesh; left: number; x: number; z: number; radius: number; hit: (hero: Hero) => void; burst?: () => void };

// Something dropped: its icon bobbing over a shadow, and a shaft of light
// over a piece of gear worth one
type Pickup = {
    uid: number;
    id: number;
    count: number;
    sprite: THREE.Sprite;
    shadow: THREE.Mesh;
    beam?: THREE.Mesh;
    // A piece of gear's glow, its tier's colour (version 136)
    glow?: THREE.Sprite;
    x: number;
    z: number;
    age: number;
};

// The soft round light behind a piece of gear on the ground, drawn once in
// white and coloured per tier by its material
let glowMap: THREE.CanvasTexture | undefined;

function glowTexture(): THREE.CanvasTexture {
    if (!glowMap) {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const fade = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        fade.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        fade.addColorStop(0.4, "rgba(255, 255, 255, 0.45)");
        fade.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, size, size);
        glowMap = new THREE.CanvasTexture(canvas);
    }
    return glowMap;
}

// A party balloon (version 129): where it lands, its colour, how long it's
// been about, its model once loaded, and its shadow on the ground (version
// 135), which grows as it comes down
type Balloon = { uid: number; x: number; z: number; colour: number; age: number; actor?: Actor; shadow?: THREE.Mesh; gone: boolean };

// A friendly face on the map: the wandering trader, and whether he's been
// pointed out yet (his model comes after his place is picked)
type Trader = { actor?: Actor; x: number; z: number; rotation: number; seen: boolean };
// The genie beside the spawn, who grants a wish out for coins
type Ferry = { actor?: Actor; x: number; z: number; rotation: number };

// Something flying: the player's at an enemy, or a mage's spell at a hero
// (from says whose); a visual one is a mate's, or on a guest an enemy's,
// and hurts nothing here
type Projectile = {
    root: THREE.Object3D;
    x: number;
    z: number;
    y: number;
    target?: Enemy;
    hero?: Hero;
    from?: EnemyDef;
    visual?: boolean;
    // The style a mage's or archer's shot hits with
    style?: ProtectStyle;
    damage: number;
    impact?: number;
    // A chinchompa's: what's beside the target takes half too
    splash?: boolean;
    // The player's spell, and its max hit (an Ancient spell's area and
    // effect go by them); an enemy's shot's share of its hit (shadow
    // spells take some off)
    spell?: SpellDef;
    maxHit?: number;
    scale?: number;
    // A spell's sound where it lands (version 108), anyone's
    hitSound?: number;
    // A healing special's shot: this share of what it deals comes back
    // (version 150)
    heal?: number;
};

type Effect ={ actor: Actor; left: number };

// A chest: now and then a mimic (an enemy, once opened), or watched (opening
// it rouses what's about)
type Chest = {
    tile: Tile;
    // Its model, once that's loaded
    actor?: Actor;
    opened: boolean;
    boss: boolean;
    mimic?: boolean;
    ambush?: boolean;
    // The map's vault: locked, with gear from two tiers up inside
    vault?: boolean;
    // A Depths room's own (version 161): the trapped treasure room's
    // ornate chest, whose floor gives way, or the brimstone chest a
    // superior's key opens
    room?: "trap" | "brimstone";
    // Deep in a cave or the castle (DEEP_CHEST of the way in): a piece more
    // (version 179)
    deep?: boolean;
};

// A freed prisoner fighting at someone's side (version 166): the host's to
// move, everyone's to see. His number, whose he is, where (and on a guest,
// where the host last put him), for how long yet, the next swing, how long
// the last one plays, his swings so far (a guest plays one when it grows)
type Ally = {
    uid: number;
    owner: string;
    actor: Actor;
    x: number;
    z: number;
    facing: number;
    left: number;
    swingIn: number;
    busy: number;
    attacks: number;
    walking: boolean;
    targetX: number;
    targetZ: number;
    targetFacing: number;
    seenAttacks: number;
    // Seconds he's barely moved for (ALLY_STUCK and he's put back by his hero)
    stuck: number;
};

// What walks at someone's side, as allyStep moves it (a freed prisoner, a
// mercenary: version 173)
type Walker = { x: number; z: number; stuck: number; facing: number; walking: boolean };

const PLAYER_RADIUS = 0.35;
// What the ground stops: narrower than the body, so a one tile gap between
// trees, or a doorway, can be walked through without lining up on it
const COLLISION_RADIUS = 0.25;
// Tiles a second unburdened: 4.2 until version 137, 30% faster since, as
// the user asked, and a tenth slower than that since version 146, as they
// asked too (a melee boss's chase below keeps pace with it)
const PLAYER_SPEED = 4.2 * 1.3 * 0.9;
// A melee boss after you moves at least this fast (just under you
// unburdened); any boss gives up the chase this many tiles from you and
// walks back to where it stood
const BOSS_CHASE_SPEED = PLAYER_SPEED * 0.95;
const BOSS_GIVE_UP = 20;
// Drawing a bow, throwing or casting slows you to this share of your pace
// for AIM_SECONDS from the shot's start (half the weapon's attack time at
// most, so a quick one isn't slowed for good), version 147: shooting from a
// walk backwards costs ground, as a swing up close costs hitpoints
export const AIM_SLOW = 0.6;
const AIM_SECONDS = 0.45;
// A melee enemy hit from further than RILE_FROM tiles (past its edge: out of
// any swing's reach) charges at RILE_SPEED times its pace, up to just under
// yours, for RILE_SECONDS (version 147)
const RILE_FROM = 3;
const RILE_SPEED = 1.6;
const RILE_SECONDS = 4;
// Thawed, an enemy can't be frozen again for this long (version 150; OSRS
// has its own few seconds of the same)
const FREEZE_IMMUNE = 5;// A melee boss gives up much sooner, and only notices you from a little
// nearer than that (so it doesn't rouse and give up by turns at the edge)
const BOSS_GIVE_UP_MELEE = 8;
const BOSS_NOTICE_SHARE = 0.75;
// Holding E at the way out takes this long, and the moment it starts
// everything idle within this many tiles comes running
const EXTRACT_SECONDS = 10;
const EXTRACT_WAKE = 15;
// Co-op (version 76): a player who falls while someone else in the party
// is still standing is down, not dead, for this long; a mate who holds E at
// their side this long, this close, brings them back up with this share of
// their hitpoints, and nothing can hurt them for a moment after
const REVIVE_WINDOW = 60;
const REVIVE_SECONDS = 4;
const REVIVE_RANGE = 1.6;
// What a host takes of a guest's word (version 153; receiveUp): how far a
// guest's own place can lag behind what it says it's doing, how near it
// must be to what it takes, opens, drops or digs, how far off what it hits
// can be, and how hard a hit can be (its gear's max hit this many times
// over, for specials, Dharok's and potions; at least the floor). The keys
// and clue scrolls a guest uses are counted out as the host hands them over.
const GUEST_LAG = 1.5;
const GUEST_REACH = 2 + GUEST_LAG;
const GUEST_SHOT_REACH = 14 + GUEST_LAG;
const GUEST_HIT_SCALE = 5;
const GUEST_HIT_MIN = 20;
const HELD_BY_HOST = new Set([VAULT_KEY, BOSS_KEY, CLUE_SCROLL, BRIMSTONE_KEY]);
// A guest's copies of the enemies don't know who they're after: one roused
// this near counts as after it, for its breath and (a boss) its prayer
const GUEST_CHASED_NEAR = 6;
const GUEST_BOSS_NEAR = 12;
// How long a body lies before it goes (fadeDead)
const DEAD_BODY_SECONDS = 4;

function finite(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}
const REVIVE_HP_SHARE = 0.3;
const REVIVE_GRACE = 3;
// A fall with nobody standing to help, or a solo one: this long on the
// ground, then the run's over for this player
const DEATH_PAUSE = 2.5;
// The vault (the crystal chest's model)
const VAULT_LOC = 172;
// The way out: Clan Wars' Free-for-all portal, a white swirl spinning
// between two stone pillars (its own animation, exported with the model;
// 29667, the lobby's low yellow Clan Wars vortex, is in the assets too)
const EXIT_LOC = 26645;
// Party balloons (version 129), a random event: now and then a handful
// drift down round someone standing, to burst by running into them. The
// six colours, and each one's burst, in the same order
const BALLOON_LOCS = [115, 116, 117, 118, 119, 120];
const BALLOON_BURSTS = [123, 124, 125, 126, 127, 128];
// Seconds into the run of the first, and between one and the next
const BALLOON_FIRST: [number, number] = [60, 150];
const BALLOON_EVERY: [number, number] = [180, 300];
const BALLOON_COUNT: [number, number] = [6, 9];
// How far round the hero they land (tiles), how long the fall takes, and
// how long they stay before floating off. The fall is the model's own
// animation, played once: from about seven tiles up (at this scale) to
// the ground in two and a half seconds
const BALLOON_SPREAD: [number, number] = [1.5, 5];
// The model's a fifth of a tile tall: drawn this much bigger, to read on
// the map
const BALLOON_SCALE = 3;
const BALLOON_FALL = 2.5;
// Its shadow's radius on the ground (tiles)
const BALLOON_SHADOW = 0.28;
const BALLOON_LIFE = 45;
const BALLOON_REACH = 0.75;
// What's in one: a piece of gear now and then, arrows or runes, food, or
// nothing at all
const BALLOON_GEAR = 0.08;
const BALLOON_AMMO = 0.45;
const BALLOON_FOOD = 0.32;
// The map wakes after this long (enemies notice you from twice as far, and
// nothing heals on its own), and the way out closes after this long
const WAKE_SECONDS = 240;
const CLOSE_SECONDS = 720;
// A roused enemy rouses everything idle this close
const ROUSE_SPREAD = 8;
// A melee enemy within this many tiles goes for your side
const FLANK_RANGE = 4;
// Within this an enemy with a clear straight walk to its player takes it
// rather than the flow field's tile by tile steps
const STRAIGHT_RANGE = 6;
// A swing asked for while the weapon recovers waits this long for it
const ATTACK_BUFFER = 0.6;
// Below this share of its health an enemy runs for help for this long,
// rousing what's idle this close as it goes, and won't give up the chase
// for this long after
const FLEE_HP = 1 / 3;
const FLEE_SECONDS = 4;
const FLEE_ROUSE = 6;
const FLEE_PERSIST = 12;
// A superior just risen keeps after its hero this long before it can lose interest
const SUPERIOR_PERSIST = 20;
// One enemy in this many is an elite (TRAITS); a venomous one's hits poison
// you for this many ticks, this far apart, each for this share of max hp
const ELITE_ONE_IN = 12;
const POISON_TICKS = 4;
const POISON_INTERVAL = 1.5;
const POISON_SHARE = 0.03;
// A boss is enraged below this share of its health, and an enraged boss left
// alone for this long heals this share
const BOSS_ENRAGE = 0.6;
const BOSS_IDLE_HEAL_SECONDS = 10;
const BOSS_IDLE_HEAL = 0.1;
// Protection drains this much faster with the boss after you
const BOSS_PRAYER_DRAIN = 2;
// Poison, for the record of who killed you
const POISON: EnemyDef = {
    id: "poison",
    npcId: 0,
    name: "Poison",
    hp: 1,
    damage: 0,
    speed: 0,
    radius: 0,
    attackInterval: 1,
    attackRange: 0,
    aggro: 0,
    coins: [0, 0],
    foodChance: 0,
};
// One enemy in twenty is a champion (more at a threat level: Threat's
// champion), with this much over the usual hitpoints and damage
const CHAMPION_HP = 2.5;
const CHAMPION_DAMAGE = 2;
// A boss in a fight slams the ground this often (this often enraged),
// hurting anyone this close this many times a hit when the ring's done
// (version 150: from the fight's start, not only enraged, and hard enough
// to step out of)
const SLAM_SECONDS = 7;
const SLAM_ENRAGED = 4.5;
const SLAM_RANGE = 3;
const SLAM_HIT = 2.5;
// And a boss with no burning floor marks where whoever it's after stands,
// when they're out of the slam's reach, this often: a ring this wide and
// this long, then this many times a hit (version 150), so a bow or a staff
// has something to step out of too
const STRIKE_SECONDS = 6;
const STRIKE_RADIUS = 1.4;
const STRIKE_WARN = 1.3;
const STRIKE_HIT = 2;
// Each piece of gear in the pack slows you by this much, up to the cap
const WEIGHT_PER_PIECE = 0.015;
const WEIGHT_MAX = 0.3;
// The way out shows on the minimap once you've been this close to it
const EXIT_SIGHT = 10;
// How many ways out a map has (version 69), and how far apart they're kept
// as a share of the map's longer side (halved as often as the ground needs)
const EXIT_COUNT = 4;
const EXIT_SPREAD_SHARE = 1 / 3;
// The special attack bar: what a special costs of its 100, and how much
// comes back a second
const SPEC_COST = 50;
const SPEC_REGEN = 5;
// The minimap's fog clears this far round you
const FOG_RADIUS = 12;
// The prayer bar: what protection drains a second, what comes back a second
// with none on
export const PRAYER_DRAIN = 4;
const PRAYER_REGEN = 1.5;
// The client's sound for each protection as it's switched on (the OSRS
// wiki's sound effect ids: protect_from_melee, _missiles, _magic)
const PRAYER_SOUNDS: Record<Exclude<ProtectStyle, "none">, number> = { melee: 2676, ranged: 2677, magic: 2675 };
// One chest in this many is a mimic, and this share of the rest are watched
const MIMIC_ONE_IN = 15;
const AMBUSH_CHANCE = 0.2;
// A boss with burning floor marks this many tiles this close to the player,
// this often, for this share of max hitpoints
const FLOOR_SECONDS = 8;
const FLOOR_TILES = 3;
const FLOOR_SPREAD = 3;
const FLOOR_DAMAGE = 0.15;
// This share of the map's walkers patrol: a round of up to two more tiles
// this far from where they stand, at this much of their speed
const PATROL_CHANCE = 0.3;
const PATROL_REACH = 8;
const PATROL_SPEED = 0.6;
// An ordinary kill drops its coins this often (a boss or a champion always),
// and a purse of several times the usual this often
const COIN_DROP_CHANCE = 0.4;
const PURSE_CHANCE = 0.05;
// The way out closes CLOSE_SECONDS into a run on a map of this many tiles
// a side; a bigger map gets longer by the square root of its area, to the
// half minute (closeSeconds)
const CLOSE_SECONDS_SIDE = 128;
// A kill drops a few arrows or runes this often (one in four). Since version
// 145 (as the user asked, for enough to last a whole run) a kill of this
// player's drops what their weapon takes, as far as the map's tier allows:
// this many shots of it (the arrows being shot, the runes of the spell last
// cast for this many casts, more of the thrown weapon held); a melee kill,
// or a mate's, drops arrows or runes as before.
const AMMO_DROP_CHANCE = 0.25;
const AMMO_DROP_SHOTS: [number, number] = [4, 8];
const AMMO_DROP_CASTS: [number, number] = [3, 5];
// A shot keeps its arrow, runes or thrown weapon this often (version 146,
// Ava's way), a pet's share on top
const AMMO_SAVE = 0.4;
// A thrown weapon found as gear (a chest's, a kill's) is this many of it
const THROWN_FOUND: [number, number] = [20, 40];
// How far a chinchompa's burst reaches past what it hit, in tiles
const SPLASH_TILES = 1.5;

// What a hit does besides its damage: Ahrim's slow, Torag's stall, and an
// Ancient spell's freeze (seconds), weaken (a share off its hits) and poison
// (what each poison hit does); poisoned marks a poison hit itself
type HitEffects = { slow?: boolean; stall?: boolean; freeze?: number; weaken?: number; poison?: number; poisoned?: boolean };

// How a shot looks: the spot animation flying, and the one where it lands;
// and, cast, the spell and its max hit (an Ancient spell's area and effect)
type Look = { projectile?: number; impact?: number; spell?: SpellDef; maxHit?: number; heal?: number };
// A kill drops a prayer potion this often, and a clue scroll this often
// (one a run); the scroll's spot is this many steps off, and digging works
// this close to it
const PRAYER_POTION_CHANCE = 0.04;
const CLUE_CHANCE = 0.03;
const CLUE_MIN_STEPS = 12;
const CLUE_MAX_STEPS = 32;
const CLUE_DIG_RANGE = 3;
// A pet keeps this far behind, and catches up by itself from this far
const PET_FOLLOW = 1.2;
const PET_LEASH = 12;
// One run in this many is at night: the map and everything on it under
// this light, the fog this close, and enemies noticing you from this much
// of their usual distance
const NIGHT_CHANCE = 0.25;
const NIGHT_LIGHT = new THREE.Color(0.35, 0.41, 0.68);
// The Depths' and the Forgotten Castle's own gloom (version 165, as the user
// asked for better-looking maps): the caves a dim brown, the castle a cold
// moonlit blue, a lantern's and the rooms' fires warm against both. How
// bright a hero is with no lantern lit, how far a fire of a room's reaches
// and how far off the nearest are lit, and the colours each kind of a room's
// lights washes the dark with (caves.ts's kinds: fire, fungus, crystal).
const CAVE_GLOOM = new THREE.Color(0.56, 0.5, 0.46);
const CASTLE_GLOOM = new THREE.Color(0.44, 0.48, 0.68);
const UNLIT_TORCH = 0.4;
const ROOM_LIGHT_REACH = 5;
const ROOM_LIGHT_NEAR = 22;
const LIGHT_WASH = ["255, 150, 60", "90, 220, 200", "190, 110, 255"];
// How far each kind's glow opens the dark, in tiles (the fires most)
const LIGHT_SIGHT = [4, 2.6, 3];
// The dark's canvas is this many times smaller than the screen each way, and
// lights this far off (tiles, each way) are drawn into it
const DARK_SCALE = 4;
const GLOW_NEAR = 34;
// The screen shakes this long when the roof comes down or a lair shuts
const SHAKE_SECONDS = 0.45;
const DEBRIS_SECONDS = 20;
const NIGHT_SKY = 0x0f1424;
const NIGHT_FOG: [number, number] = [12, 34];
// The caves' dark (the Depths), and how far off it starts and closes in;
// and how many tiles round you can be seen at all (version 159:
// placeCaveDark)
const CAVE_DARK = 0x000000;
const CAVE_FOG: [number, number] = [22, 48];
const CAVE_SIGHT = 7;
// A lit bullseye lantern sees this many tiles further, and a can of oil
// keeps it lit this long (version 161); the Hardiness upgrade's hitpoints
// a level
const LANTERN_SIGHT = 4;
const OIL_SECONDS = 120;
const OIL_CAN = 277;
// A Depths chest's purse is lantern oil instead this often
const CHEST_OIL = 0.5;
const HARDINESS_HP = 5;
// The Depths' reward for depth 5 (version 161, as the user asked), and how
// much harder its wearer hits down there
const SLAYER_CAPE = 9786;
const SLAYER_CAPE_DAMAGE = 1.1;
// One Depths boss in this many leaves its pet
const DEPTHS_PET_ONE_IN = 20;
// The ground shakes as the hunter comes inside each of these, in tiles
const HUNT_RUMBLES = [60, 30, 15];
// The Depths' cave events (version 161, as the user asked): the first this
// far in and then every so often, one of a flood that shuts a room's
// doorways for a while, a pocket of gas that chokes the prayer out of
// whoever stands in it (so much a second), and a swarm, every tiny one this
// near anyone coming for them at once
const EVENT_FIRST = 120;
const EVENT_EVERY = 150;
const FLOOD_SECONDS = 60;
const GAS_RADIUS = 4;
const GAS_SECONDS = 20;
const GAS_DRAIN = 8;
const SWARM_REACH = 40;
// The Depths' special rooms (placeRooms): the altar's model, how many dead
// adventurers' camps, the bones that mark one, the ornate chest's floor
// (rings round it, each this share of your hitpoints) and how far its fall
// is heard
const ALTAR_LOC = 409;
const CAMPS = 2;
const REMAINS = 526;
const TRAP_RINGS = 6;
const TRAP_HIT = 0.15;
const TRAP_ROUSE = 14;

// The maps' own things (version 166, props.ts). E used on one: a tap (let go
// within PROP_TAP seconds) or a hold of its own length; a hold is broken by
// a hit. How close is close enough, and how far off a crack hides.
const PROP_REACH = 1.7;
const PROP_TAP = 0.35;
// An oil barrel: the cans it fills, the fuse once lit, how far its burst
// reaches, what it does to an enemy (and 1.8 times more a tier) and to a hero
// (that share of their hitpoints)
const BARREL_OIL = 2;
const BARREL_HOLD = 1;
const BARREL_FUSE = 3;
const BARREL_REACH = 3;
const BARREL_HIT = 30;
const BARREL_HURT = 0.25;
// Searching a crate, sacks, rubble or a shelf, and a dead adventurer: how
// long, and how often a corpse gets back up
const SEARCH_HOLD = 3;
const CORPSE_HOLD = 2;
const CORPSE_RISE = 0.2;
// A vein's loads, each a hold, heard this far; a pool's eels, a fish a hold,
// a drink's heal (of your hitpoints) and its odds of clean water or foul;
// a crack's hold and how far its fall is heard
const VEIN_LOADS = 3;
const VEIN_HOLD = 3;
const VEIN_NOISE = 9;
const POOL_EELS = 3;
const POOL_HOLD = 4;
const POOL_HEAL = 0.15;
const POOL_CLEAN = 0.45;
const POOL_FOUL = 0.25;
const CRACK_HOLD = 4;
const CRACK_NOISE = 12;
// A rope ladder: at least this many steps from where you went down, a hard
// landing (that share of your hitpoints, and a moment held)
const LADDER_STEPS = 60;
const LADDER_HURT = 0.05;
const LADDER_HELD = 1.2;
// A suit of armour wakes with a hero this near; one in ARMOUR_ONE_IN does
const ARMOUR_WAKE = 2.2;
const ARMOUR_ONE_IN = 5;
// A font's vials (one a hero), a banquet's bites, each one's heal and its
// odds of poison, and a prisoner's odds of fighting for you
const FONT_VIALS = 4;
const BANQUET_BITES = 10;
const BANQUET_HEAL = 12;
const BANQUET_POISON = 0.2;
const PRISONER_ALLY = 0.6;
// Version 179's (as the user asked for better maps and more in them). A
// strongbox at the end of a dead end: the hold to force it, heard this far.
// A web across a dead end's doorway in the Depths: the hold to cut it. The
// castle's gates, across dead ends' doorways and some deeper in: shut
// behind you, nothing gets through till it's raised. An anvil mends every
// worn piece you wear once a run: the hold, heard this far. A steam vent
// blows every so often: the warning, how far, a share of a hero's
// hitpoints, and what it does to an enemy (1.8 times more a tier). A well's
// draught settles poison and gives back this much prayer. A coffin: the
// hold, and how often what's in it sits up.
const STRONGBOX_HOLD = 4;
const STRONGBOX_NOISE = 12;
const WEB_HOLD = 1.2;
const GATE_CLEAR = 0.9;
// (a gate that's up hangs this high over its doorway)
const GATE_RAISED = 2.6;
const ANVIL_HOLD = 3;
const ANVIL_NOISE = 10;
const VENT_EVERY = 14;
const VENT_WARN = 1.6;
const VENT_RADIUS = 1.8;
const VENT_HURT = 0.2;
const VENT_HIT = 30;
const WELL_PRAYER = 30;
const COFFIN_HOLD = 2;
const COFFIN_RISE = 0.4;
// How far in (a cell's depth as a share of the deepest) the champions,
// packs and elites start, where elites come twice as often, and where a
// chest has lain long enough untouched to hold more
const DEEP_FROM = 0.25;
const DEEP_ELITE = 0.6;
const DEEP_CHEST = 0.85;
// A freed prisoner at your side: for so long, keeping this near, going for
// what's this near them, a swing so often, hitting up to ALLY_HIT (and so
// much more a tier)
const ALLY_SECONDS = 90;
const ALLY_FOLLOW = 2.2;
const ALLY_REACH = 8;
const ALLY_EVERY = 1.6;
const ALLY_HIT = 8;
const ALLY_HIT_TIER = 6;
const ALLY_STUCK = 1.5;
// The mercenary's head (version 177, as the user asked for a far smarter
// one): no further from you than this, and a medic no further from you than
// MERC_MEDIC_RANGE; a bite below this share of their health, or this beside
// a boss (and whenever a bite wouldn't be wasted: version 180); back behind
// you below this share (a sellsword, whose job's to be
// hit, below this) till they're up to this; a bowman or mage backs off what's
// this close; a shout about what's coming at your back from this close
const ALLY_LEASH = ALLY_REACH * 1.5;
const MERC_MEDIC_RANGE = 5;
const MERC_EAT = 0.5;
const MERC_EAT_BOSS = 0.65;
const MERC_RETREAT = 0.35;
const MERC_RETREAT_TOUGH = 0.2;
const MERC_RALLY = 0.6;
const MERC_KITE = 2.2;
const MERC_CALL_RANGE = 4.5;
// Version 182 (as the user asked): what's lain untaken this long within this
// many tiles of them, that they can use, they go and get (not from under
// you: nothing within MERC_FETCH_YOURS of you), carrying at most this many
// bites; and their stride: they turn this many radians a second, walk up
// to you when you've stood still this long and they're within this of
// their post, and once set off come to this share of their follow distance
const MERC_FETCH_WAIT = 3;
const MERC_FETCH_RANGE = 30;
const MERC_FETCH_YOURS = 1.5;
const MERC_FOOD_MAX = 8;
const MERC_TURN = 11;
const MERC_WALK_STILL = 0.5;
const MERC_WALK_NEAR = 2.5;
const MERC_CLOSE_TO = 0.8;

// The shortest way round from one heading to another, so much of it at most
function turnToward(from: number, to: number, most: number): number {
    const d = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return Math.abs(d) <= most ? to : from + Math.sign(d) * most;
}
// The enemies' heads (version 178, as the user asked for far smarter
// ones). Who they go for: a hero under this share of their health draws them
// this much nearer (they smell blood), the one that hit them within this
// many seconds this much (a grudge), and one a shooter can see this much.
// What they hear: a hero's hit on something carries this far, a trap's
// spring this far, a boss's slam this far; what's idle within earshot comes
// to look for this long, standing off the spot by this. Melee ones round a
// hero take up the arc from this many degrees off its front, round to the
// same the other side (NOISE_* beyond ROUSE_SPREAD: nearer rouses outright)
const BLOOD_SHARE = 0.5;
const BLOOD_DRAW = 4;
const GRUDGE_SECONDS = 3;
const GRUDGE_DRAW = 4;
const SIGHT_DRAW = 3;
const NOISE_FIGHT = 11;
const NOISE_TRAP = 10;
const NOISE_SLAM = 14;
const NOISE_SECONDS = 12;
const NOISE_CLOSE = 2.5;
const SURROUND_ARC = [90, 60];
// A lit brazier keeps the weakest third of the map's kinds out of its room
const LIT_WEAK_SHARE = 1 / 3;

// The Depths' bosses' own moves (version 161, as the user asked: each of
// the fourteen fights like itself, after its OSRS fight), by the boss's id
// in endless-bosses.json: a move every so many seconds while it's up (`move`,
// its turn counting from 0), and one at each share of its health (`marks`).
// Rings burst for a share of the hitpoints of whoever's still in them.
// An add that mends its boss heals it MEND_RATE of its hitpoints a second.
const MEND_RATE = 0.01;
type Signature = {
    every?: number;
    move?: (run: Run, e: Enemy, t: Hero, step: number) => void;
    marks?: number[];
    atMark?: (run: Run, e: Enemy, t: Hero | undefined) => void;
};
const GREEN = new THREE.Color(0.7, 1.3, 0.6);

// Each Depths boss's lair has its own look and its own trouble (version 161,
// as the user asked): its room's floor tinted (`floor`), the dark round you
// its colour (`glow`, the dark's own at the edge), and while you're in it
// slower going (`pace`: ice, webs, water), the floor bursting about you every
// LAIR_HAZARD_EVERY seconds while its boss lives (`hazard`: lava, spores),
// prayer seeping away (`drain` a second) or a closer dark (`sight` tiles).
// `word` is said the first time you walk in.
type LairTheme = {
    word: string;
    floor: THREE.Color;
    glow: [number, number, number];
    pace?: number;
    hazard?: "lava" | "spores";
    drain?: number;
    sight?: number;
};
const LAIR_HAZARD_EVERY = 9;
const FIRE: LairTheme = {
    word: "The air in here is scorching, and lava seeps up through the floor.",
    floor: new THREE.Color(1.3, 0.8, 0.6),
    glow: [45, 8, 0],
    hazard: "lava",
};
const MOSS: LairTheme = {
    word: "Moss carpets everything here, and it puffs out spores.",
    floor: new THREE.Color(0.8, 1.15, 0.72),
    glow: [6, 22, 4],
    hazard: "spores",
};
const WEB: LairTheme = { word: "Webs hang thick in here: every step drags.", floor: new THREE.Color(0.9, 0.88, 0.86), glow: [16, 14, 12], pace: 0.7 };
const SHADOW: LairTheme = { word: "The dark in here is deeper still.", floor: new THREE.Color(0.85, 0.72, 1.05), glow: [16, 0, 26], sight: -2 };
const WATER: LairTheme = { word: "The lair's floor is ankle-deep in cold sea water.", floor: new THREE.Color(0.75, 0.9, 1.15), glow: [0, 10, 26], pace: 0.85 };
const LAIR_THEMES: Record<string, LairTheme> = {
    king_black_dragon: FIRE,
    elvarg: FIRE,
    cerberus: FIRE,
    ice_queen: { word: "The floor here is solid ice: you can barely keep your feet.", floor: new THREE.Color(0.8, 0.95, 1.35), glow: [0, 14, 34], pace: 0.75 },
    sarachnis: WEB,
    scorpia: WEB,
    thermonuclear_smoke_devil: {
        word: "Smoke chokes the air here: your prayer drains away while you stay.",
        floor: new THREE.Color(0.88, 0.95, 0.8),
        glow: [14, 18, 10],
        drain: 1.5,
    },
    bryophyta: MOSS,
    obor: MOSS,
    corporeal_beast: SHADOW,
    calvarion: SHADOW,
    dagannoth_rex: WATER,
    dagannoth_supreme: WATER,
    giant_mole: { word: "Dust hangs in the air of the Mole's warren.", floor: new THREE.Color(1.1, 0.95, 0.75), glow: [24, 14, 4], sight: -1 },
};

// The Forgotten Castle's lords' rooms (version 163): candles still lit for
// whoever held court, warm in the dark
const CASTLE_LAIR: LairTheme = {
    word: "Candles still burn in here, for whoever holds court.",
    floor: new THREE.Color(1.08, 0.95, 0.82),
    glow: [34, 16, 4],
};

function baseId(def: EnemyDef): string {
    return def.id.slice(def.id.indexOf(":") + 1);
}

function lairTheme(def: EnemyDef): LairTheme | undefined {
    return LAIR_THEMES[baseId(def)] ?? (def.id.startsWith(`${CASTLE_ID}:`) ? CASTLE_LAIR : undefined);
}
const SIGNATURES: Record<string, Signature> = {
    // Three breaths in turn: fire, poison and ice that holds you
    king_black_dragon: {
        every: 6,
        move: (run, e, t, step) => {
            const kind = step % 3;
            run.sigSay(`${e.def.name} breathes ${["fire", "poison", "ice"][kind]}!`);
            run.sigRing(e, t.x, t.z, 1.6, 1.1, kind === 0 ? 0.2 : 0.1, (hero) => {
                if (kind === 1) {
                    run.sigPoison(hero);
                } else if (kind === 2) {
                    run.sigRoot(hero, 2);
                }
            });
        },
    },
    // A line of flame from her to you and past
    elvarg: {
        every: 7,
        move: (run, e, t) => {
            const dx = t.x - e.x;
            const dz = t.z - e.z;
            const len = Math.max(0.01, Math.hypot(dx, dz));
            for (let k = 1; k <= 5; k++) {
                const along = Math.min(len + 2, k * Math.max(1.5, (len + 2) / 5));
                run.sigRing(e, e.x + (dx / len) * along, e.z + (dz / len) * along, 1.3, 1.2, 0.18);
            }
            run.sigSay("Elvarg rears back and breathes a line of fire!");
        },
    },
    // A cloud of smoke that chokes the prayer out of you
    thermonuclear_smoke_devil: {
        every: 8,
        move: (run, e, t) => {
            run.sigSay("A cloud of thick smoke billows out: it'll choke your prayer!");
            run.sigRing(e, t.x, t.z, 2.8, 1.5, 0.1, (hero) => run.sigDrainPrayer(hero, 30));
        },
    },
    // Down into the earth at each quarter lost, and up elsewhere in the lair
    giant_mole: {
        marks: [0.75, 0.5, 0.25],
        atMark: (run, e) => run.sigBurrow(e, 3),
    },
    // Its three souls, a third of the way down and two thirds
    cerberus: {
        marks: [0.66, 0.33],
        atMark: (run, e) => {
            run.sigSay("Cerberus howls, and its souls rise to fight for it!");
            run.sigAdds(e, "ghost", "Summoned soul", 3, { scale: 0.9, tint: new THREE.Color(0.7, 0.85, 1.4) });
        },
    },
    // Spiderlings out of her nest
    sarachnis: {
        marks: [0.66, 0.33],
        atMark: (run, e) => {
            run.sigSay("Sarachnis's spawn swarm out of the nest!");
            run.sigAdds(e, "crypt_spider", "Spawn of Sarachnis", 3, { scale: 0.6, hp: 0.5 });
        },
    },
    // A stomp round him that nothing turns aside
    dagannoth_rex: {
        every: 8,
        move: (run, e) => {
            run.sigSay("Dagannoth Rex rears up to stomp!");
            run.sigRing(e, e.x, e.z, 2.6, 1.2, 0.22);
        },
    },
    // A volley of arrows, one after the other where you stand
    dagannoth_supreme: {
        every: 7,
        move: (run, e, t) => {
            run.sigSay("Dagannoth Supreme looses a volley!");
            [0.8, 1.2, 1.6].forEach((warning, i) => run.sigRing(e, t.x + (i - 1) * 0.6, t.z, 1.2, warning, 0.1));
        },
    },
    // A swing of the club that throws you back, if you're close
    obor: {
        every: 7,
        move: (run, e, t) => {
            if (Math.hypot(t.x - e.x, t.z - e.z) > 3.5) {
                return;
            }
            run.sigSay("Obor swings his club wide!");
            run.sigRing(e, e.x, e.z, 3, 0.9, 0.18, (hero) => {
                run.sigKnock(e, hero, 3);
                run.sigRoot(hero, 0.8);
            });
        },
    },
    // Growthlings that mend her while they live, at each quarter lost
    bryophyta: {
        marks: [0.75, 0.5, 0.25],
        atMark: (run, e) => {
            run.sigSay("Growthlings sprout round Bryophyta, and her moss knits back: kill them!");
            run.sigAdds(e, "cave_slime", "Growthling", 2, { tint: GREEN, mend: true });
        },
    },
    // Her guardians mend her, half way down
    scorpia: {
        marks: [0.5],
        atMark: (run, e) => {
            run.sigSay("Scorpia's guardians scuttle in to mend her: kill them!");
            run.sigAdds(e, "crypt_spider", "Scorpia's guardian", 2, { scale: 0.75, tint: new THREE.Color(1.4, 1.2, 0.6), mend: true });
        },
    },
    // Lightning about you
    calvarion: {
        every: 6,
        move: (run, e, t) => {
            run.sigSay("Lightning crackles round you!");
            for (let i = 0; i < 5; i++) {
                const spread = i === 0 ? 0 : 3;
                run.sigRing(e, t.x + (Math.random() - 0.5) * 2 * spread, t.z + (Math.random() - 0.5) * 2 * spread, 1, 1.1, 0.14);
            }
        },
    },
    // A dark core that mends it, half way down; and a stomp if you're under it
    corporeal_beast: {
        every: 7,
        move: (run, e, t) => {
            if (Math.hypot(t.x - e.x, t.z - e.z) < 2.5) {
                run.sigSay("The Corporeal Beast stomps!");
                run.sigRing(e, e.x, e.z, 2.5, 0.8, 0.2);
            }
        },
        marks: [0.5],
        atMark: (run, e) => {
            run.sigSay("A dark energy core splits off the Corporeal Beast and feeds it: kill the core!");
            run.sigAdds(e, "jelly", "Dark energy core", 1, { scale: 0.5, tint: new THREE.Color(0.35, 0.25, 0.5), mend: true });
        },
    },
    // The Forgotten Castle's lords (castle-bosses.json, version 163).
    // Count Draynor drinks: what his bite takes mends him
    count_draynor: {
        every: 7,
        move: (run, e, t) => {
            run.sigSay("Count Draynor lunges for your throat!");
            run.sigRing(e, t.x, t.z, 1.4, 1.0, 0.14, () => run.sigHeal(e, 0.06));
        },
    },
    // The Black Knight Titan's stamp shakes the floor round him
    black_knight_titan: {
        every: 8,
        move: (run, e) => {
            run.sigSay("The Black Knight Titan stamps!");
            run.sigRing(e, e.x, e.z, 3, 1.2, 0.22);
        },
    },
    // Vanstrom's shadow swallows the light, and your prayer with it
    vanstrom_klause: {
        every: 8,
        move: (run, e, t) => {
            run.sigSay("Vanstrom Klause's shadow spreads across the floor!");
            for (let i = 0; i < 3; i++) {
                run.sigRing(e, t.x + (Math.random() - 0.5) * 4, t.z + (Math.random() - 0.5) * 4, 1.6, 1.3, 0.1, (hero) => run.sigDrainPrayer(hero, 20));
            }
        },
    },
    // Arrav calls the dead who served with him
    arrav: {
        marks: [0.66, 0.33],
        atMark: (run, e) => {
            run.sigSay("Arrav raises the dead who served with him!");
            run.sigAdds(e, "armoured_zombie", "Arrav's dead", 3, { hp: 0.7 });
        },
    },
    // Dusk brings the ceiling down, and stone guardians wake at half
    dusk: {
        every: 6,
        move: (run, e, t) => {
            run.sigSay("Dusk tears at the ceiling: stone falls round you!");
            for (let i = 0; i < 4; i++) {
                const spread = i === 0 ? 0 : 3;
                run.sigRing(e, t.x + (Math.random() - 0.5) * 2 * spread, t.z + (Math.random() - 0.5) * 2 * spread, 1.1, 1.2, 0.14);
            }
        },
        marks: [0.5],
        atMark: (run, e) => {
            run.sigSay("The stone guardians round the hall stir to Dusk's side!");
            run.sigAdds(e, "gargoyle", "Stone guardian", 2, { scale: 0.8, hp: 0.6 });
        },
    },
    // Vardorvis's axes sweep a line through you
    vardorvis: {
        every: 7,
        move: (run, e, t) => {
            const dx = t.x - e.x;
            const dz = t.z - e.z;
            const len = Math.max(0.01, Math.hypot(dx, dz));
            for (let k = 1; k <= 5; k++) {
                const along = Math.min(len + 2, k * Math.max(1.5, (len + 2) / 5));
                run.sigRing(e, e.x + (dx / len) * along, e.z + (dz / len) * along, 1.3, 1.1, 0.18);
            }
            run.sigSay("Vardorvis sends his axes spinning through the hall!");
        },
    },
    // The Nightmare's husks hold you while she feeds; parasites at half
    the_nightmare: {
        every: 8,
        move: (run, e, t) => {
            run.sigSay("Husks claw up out of the floor at you!");
            run.sigRing(e, t.x, t.z, 1.6, 1.3, 0.1, (hero) => run.sigRoot(hero, 2.5));
        },
        marks: [0.5],
        atMark: (run, e) => {
            run.sigSay("Parasites burst out of the Nightmare and feed her: kill them!");
            run.sigAdds(e, "shadow_warrior", "Parasite", 2, { scale: 0.7, hp: 0.5, tint: new THREE.Color(0.7, 0.55, 0.9), mend: true });
        },
    },
    // Verzik's webs and her brood
    verzik_vitur: {
        every: 7,
        move: (run, e, t) => {
            run.sigSay("Verzik Vitur hurls her web!");
            [0.8, 1.2, 1.6].forEach((warning, i) => run.sigRing(e, t.x + (i - 1) * 0.7, t.z, 1.3, warning, 0.12, (hero) => run.sigRoot(hero, 1)));
        },
        marks: [0.66, 0.33],
        atMark: (run, e) => {
            run.sigSay("Verzik's brood scuttles out to her!");
            run.sigAdds(e, "huge_spider", "Verzik's brood", 3, { scale: 0.6, hp: 0.4 });
        },
    },
    // Frost that holds you where you stand
    ice_queen: {
        every: 8,
        move: (run, e, t) => {
            run.sigSay("The Ice Queen's frost closes on you!");
            run.sigRing(e, t.x, t.z, 1.8, 1.3, 0.12, (hero) => run.sigRoot(hero, 2.5));
        },
    },
};
// The caves' rock on the minimap and the full map
const CAVE_ROCK_MAP = "#120d08";
const NIGHT_AGGRO = 0.6;
// How often a night run gives new things in the scene the torchlight
const TORCH_SWEEP = 0.5;
const FORCE_NIGHT = (() => {
    try {
        return new URLSearchParams(location.search).has("night");
    } catch {
        return false;
    }
})();
const DAY_LIGHT = new THREE.Color(1, 1, 1);
const WHITE = new THREE.Color(1, 1, 1);
// The boss stands where the fight has room: at least this many open tiles
// can be walked to within this many of it (a circle of that size holds
// about 250), so it's never in a building or a lane
const BOSS_ROOM_RADIUS = 9;
const BOSS_ROOM_TILES = 150;
const BOSS_TILE_TRIES = 12;
// The wandering trader (the Mysterious Old Man's model) charges this much
// over the shop's prices
export const TRADER_NPC = 6750;
export const TRADER_MARKUP = 1.5;
// The genie beside where you arrived (version 70) grants a wish out of the
// map for coins: this much on a one star map, and 2.2 times more a tier, as
// the purses grow, so it's about a third of a run's takings whatever the map
export const FERRY_NPC = 326;
const FERRY_FEE_BASE = 150;

export function ferryFee(tier: number): number {
    return Math.round((FERRY_FEE_BASE * Math.pow(2.2, tier - 1)) / 10) * 10;
}
// Gear of this tier and up drops under a shaft of light, with a chime
const BEAM_TIER = 4;
// An enemy's sounds are full this close to the player and silent this far
const HEAR_NEAR = 7;
const HEAR_FAR = 26;
// How often a piece of gear is one of its tier's prizes (items.ts): from a
// champion, from the boss's chest, and from the vault or a clue casket
const PRIZE_FULL = 1 / 6;
const PRIZE_BOSS_CHEST = 1 / 15;
const PRIZE_CASKET = 1 / 32;
const CAMERA_OFFSET = new THREE.Vector3(0, 13, 9);
const UP = new THREE.Vector3(0, 1, 0);
// How far round (and up or down) the camera goes for a pixel of a drag
const TURN_PER_PIXEL = 0.008;
// How steeply the camera looks down: CAMERA_OFFSET's, and as flat and as
// overhead as a drag can tilt it
const BASE_PITCH = Math.atan2(CAMERA_OFFSET.y, CAMERA_OFFSET.z);
const PITCH_MIN = 0.6;
const PITCH_MAX = 1.4;
// How far a finger can wander before it starts turning the camera, in pixels
const TAP_SLOP = 10;
const PROJECTILE_SPEED = 14;
// The minimap shows this many tiles across its circle
const MINIMAP_TILES = 40;
// How dark the unwalked ground is on the full map (1 would be the minimap's
// black)
const FULL_MAP_FOG = 0.7;
// Roofs come back this long after you're out from under them
const ROOF_RETURN_SECONDS = 0.3;
// Scenery stands on a tile that slopes less than this (in tiles) when one
// can be found in a few tries, so a chest or the trapdoor isn't half buried
const FLAT_TILE = 0.15;
const FLAT_TRIES = 20;
// A map's chests are its world's count for this much ground that can be
// walked to (or for its open ground, the older measure, if that's more),
// each the best spread of this many candidate spots
const CHEST_FULL_REACH = 12000;
const SPREAD_CANDIDATES = 12;
// A map's enemies are its world's count for this much ground that can be
// walked to, between these
const ENEMY_FULL_REACH = 14000;
const ENEMY_MIN = 40;
const ENEMY_MAX = 200;

// The Depths' bosses are each the best spread of this many candidates
const BOSS_SPREAD_CANDIDATES = 40;
// Version 159, the Depths made far harder than the regular maps (the user
// asked: nobody should come close to more than one boss a run). Each boss
// slain makes the ones left this much stronger, and the strongest of them
// comes hunting.
const EMPOWER_HP = 3;
const EMPOWER_DAMAGE = 2;
// A boss's lair shuts behind you, a rockfall over its doorways, once you're
// this far in from them with the boss up, until it falls or nobody's left in
// there; one left alone heals whole
const LAIR_SEAL_IN = 5;
const LAIR_ROCKS = [2919, 5842];
// The cave wakes almost at once; then every so often the roof comes down
// round each of you, a few more rocks each time and each a harder hit (a
// share of your hitpoints, to at most COLLAPSE_HIT_MAX), and it rouses what's
// near. No genie; the ways out stay sealed in the rock until a boss falls,
// or this long has gone by (a fresh start's kit can't kill a boss: without
// it, it could never get out)
const DEPTHS_WAKE_SECONDS = 30;
const DEPTHS_EXITS_OPEN = 360;
const COLLAPSE_EVERY = 75;
const COLLAPSE_ROCKS = 4;
const COLLAPSE_SPREAD = 4;
const COLLAPSE_WARNING = 1.6;
const COLLAPSE_HIT = 0.1;
const COLLAPSE_HIT_STEP = 0.03;
const COLLAPSE_HIT_MAX = 0.35;
const COLLAPSE_ROUSE = 14;
// Supplies are scarce: a kill's prayer potion and a chest's food or potion
// this share as often (the food on the dead is worlds.ts's), and protection
// drains this much faster
const DEPTHS_SUPPLIES = 0.35;
// Champions and elites this many times as often; this share of the enemies
// come as a pack of this many, led by a champion this often; a risen
// superior rouses what's this near; and each boss has this many champions
// standing guard about it
const DEPTHS_CHAMPIONS = 3;
const DEPTHS_PACK = 0.3;
const DEPTHS_PACK_SIZE: [number, number] = [3, 5];
const DEPTHS_PACK_LEADER = 0.5;
const SUPERIOR_ROUSE = 12;
const BOSS_GUARDS: [number, number] = [4, 6];
// What a tiny one (EnemyDef's tiny) drops, at any depth
const TINY_LOOT = [{ tier: 1, weight: 1 }];
const DEPTHS_PRAYER_DRAIN = 1.5;
// The Depths a little easier (version 169, as the user asked; the Forgotten
// Castle keeps the numbers above): fewer and smaller packs, fewer guards
// about each boss, protection draining slower, the roof coming down less
// often and less hard, and the ways out opening on their own sooner (the
// food on the dead and depth 1's bosses are worlds.ts's)
const EASED_PACK = 0.2;
const EASED_PACK_SIZE: [number, number] = [2, 4];
const EASED_GUARDS: [number, number] = [2, 4];
const EASED_PRAYER_DRAIN = 1.25;
const EASED_COLLAPSE_EVERY = 100;
const EASED_COLLAPSE_HIT = 0.08;
const EASED_EXITS_OPEN = 240;
const DEPTHS_RULES =
    "The ways out are sealed in the rock until a boss falls, or four minutes have gone, and there's no genie down here. The cave wakes fast, and its roof keeps coming down.";

// `count` different ones of a list, in a random order
function pickSome<T>(rng: Rng, list: T[], count: number): T[] {
    const left = list.slice();
    const picked: T[] = [];
    while (picked.length < count && left.length > 0) {
        picked.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
    }
    return picked;
}

function randInt(rng: Rng, min: number, max: number): number {
    return min + Math.floor(rng() * (max - min + 1));
}

// The map for a party of this many: the same, with the enemies' hitpoints
// up for every player past the first (PARTY_ENEMY_HP, PARTY_BOSS_HP)
function partyWorld(world: WorldDef, players: number): WorldDef {
    const extra = players - 1;
    const tougher = (def: EnemyDef, share: number): EnemyDef => ({ ...def, hp: Math.round(def.hp * (1 + share * extra)) });
    return {
        ...world,
        enemies: world.enemies.map((e) => ({ def: tougher(e.def, PARTY_ENEMY_HP), weight: e.weight })),
        boss: tougher(world.boss, PARTY_BOSS_HP),
        bosses: world.bosses?.map((b) => tougher(b, PARTY_BOSS_HP)),
    };
}

// The map at a threat level (version 150): its enemies tougher and harder
// hitting, less food on them, and from level 3 every boss's floor burning
function threatWorld(world: WorldDef, threat: Threat): WorldDef {
    if (threat.level === 0) {
        return world;
    }
    const enemy = (def: EnemyDef): EnemyDef => ({
        ...def,
        hp: Math.round(def.hp * threat.enemyHp),
        damage: Math.round(def.damage * threat.enemyDamage),
        foodChance: def.foodChance * threat.food,
    });
    const boss = (def: EnemyDef): EnemyDef => ({
        ...def,
        hp: Math.round(def.hp * threat.bossHp),
        damage: Math.round(def.damage * threat.bossDamage),
        floor: def.floor || threat.bossFloor || undefined,
    });
    return {
        ...world,
        enemies: world.enemies.map((e) => ({ def: enemy(e.def), weight: e.weight })),
        boss: boss(world.boss),
        bosses: world.bosses?.map(boss),
    };
}

export class Run {
    readonly scene = new THREE.Scene();
    readonly camera: THREE.PerspectiveCamera;
    readonly rng: Rng;

    // What the HUD reads
    hp: number;
    maxHp: number;
    inventory: ItemStack[];
    equipment: Equipment;
    coins: number;
    stats: GearStats;
    prompt = "";
    boss?: { name: string; hp: number; maxHp: number };
    dead = false;
    ended = false;
    // Stood still from the pause menu, or (version 183) a solo run's open
    // pack: nothing moves, nothing is heard, nothing's eaten or drunk
    paused = false;

    private player!: PlayerLook;
    // The moderator's crown over this player's head, for the game's maker
    // (crown.ts; the others' are on their Mates)
    private crown?: THREE.Sprite;
    // The protection prayer's icon over this player's head (version 103)
    private overhead?: Overhead;
    private lookGeneration = 0;
    private px: number;
    private pz: number;
    private facing = 0;
    private attackCooldown = 0;
    // Seconds left of a shot's slow (AIM_SLOW)
    private aiming = 0;
    private swingIn = -1;
    private swingTarget?: Enemy;
    private hurtFlash = 0;
    private lastHurt = -100;
    private regen = 0;
    private deadFor = 0;
    // Co-op reviving: how long E's been held at a downed mate's side (and
    // whose), and until when this player, just brought back up, can't be hit
    private reviving = 0;
    private revivingId?: string;
    private graceUntil = -100;
    // How many times this player's gone down this run: each fall's window
    // for a revive is half the last one's (version 78)
    private falls = 0;

    private enemies: Enemy[] = [];
    private pickups: Pickup[] = [];
    private projectiles: Projectile[] = [];
    private effects: Effect[] = [];
    private chests: Chest[] = [];
    // The ways out: EXIT_COUNT portals somewhere else on the map each run,
    // spread apart, each to be found (the minimap shows one once it's been
    // seen, or the nearest once the boss has fallen)
    private exits: Exit[] = [];
    private extracting = 0;
    // The run's clock: the map wakes, then the ways out close
    awake = false;
    closed = false;
    private warned = new Set<number>();
    // Whether anything was after the player last frame: no healing then
    private chased = false;
    private champions = new Map<EnemyDef, EnemyDef>();
    private ammoMessageAt = -10;
    // The spell last cast, whose runes a kill drops (dropOwnAmmo)
    private lastSpell?: SpellDef;
    // The spell picked to autocast (the spellbook sets it), or none for the
    // strongest the staff can cast with the runes packed; and the book open
    autocast?: string;
    spellbook: Book = "standard";
    private slamRing?: THREE.RingGeometry;
    private hazards: Hazard[] = [];
    // Party balloons about now, and when the next lot comes (the host's
    // and a solo run's to decide; -1 until the run's clock starts)
    private balloons: Balloon[] = [];
    private balloonsAt = -1;
    // Bursts playing out, and how many this player has burst
    private popping: { actor: Actor; left: number }[] = [];
    private balloonsBurst = 0;
    // A ring under the enemy being hit, where there's no cursor to show it
    // (a touch screen; ui/touch.ts turns it on)
    markTarget = false;
    private targetRing?: THREE.Mesh;
    // The guild's upgrades that came along
    private readonly packSize: number;
    private readonly specRate: number;
    // Protection from a style, and the prayer that pays for it, 0 to 100
    protect: ProtectStyle = "none";
    prayer = 100;
    private piercedOnce = false;
    // The map's ambient sounds: seconds to the next
    private ambientIn = 4;
    // Hitsplats: the number of every hit, floating up off whoever took it
    private splats: { sprite: THREE.Sprite; left: number; baseY: number }[] = [];
    private splatTextures = new Map<string, THREE.CanvasTexture>();
    // The special attack bar, 0 to 100, and whether the next swing spends it
    spec = 100;
    private specPending = false;
    // The numbers the swing under way began with (beginSwing)
    private swingStats?: GearStats;
    // What's been seen of the map: the minimap's fog clears round you
    private explored?: Uint8Array;
    private fog?: HTMLCanvasElement;
    private exploredTile = -1;
    // The report card
    kills = 0;
    bossKills = 0;
    championKills = 0;
    // Seconds held in place by a boss's move, and the pace the ground under
    // you allows (a lair's ice or webs: version 161)
    private rooted = 0;
    private groundPace = 1;
    // The Depths' superiors risen this run (SUPERIOR_MAX), and slain by
    // this player (cave shards: main.ts)
    private superiorsRisen = 0;
    superiorKills = 0;
    // The Depths' cave, and the lair shut now (LAIR_SEAL_IN): its cell, its
    // boss, the tiles blocked and the boulders on them
    private cave?: CaveLayout;
    private sealed?: { cell: number; boss?: Enemy; tiles: number[]; rocks: Actor[] };
    rangedKills = 0;
    ate = 0;
    clues = 0;
    vaults = 0;
    killer?: string;
    petFound?: string;
    private hitsTaken = 0;
    // Hitpoints the hits took, all told (version 115: the vault's word on
    // how long food lasts)
    private damageTaken = 0;
    private chestsOpened = 0;
    private goldenOpened = false;
    private drank = 0;
    private specials = 0;
    private traderBuys = 0;
    private genie = false;
    // Coins come by in this run (picked up, or the trader's for what was
    // sold): the genie takes only these, not coins brought from the bank
    // (version 78), so a wish out is something a run earns
    private coinsFound = 0;
    // Your gravestone from last time, with what's still in it
    private grave?: { actor: Actor; x: number; z: number; items: ItemStack[] };
    private graveTaken = false;
    // Each clue scroll's spot, one per scroll picked up (version 95: there
    // was one for the run, so a second scroll moved it and digging either
    // left the other scroll with none), and whether you've been told it's
    // close; and whether one has dropped from this run's kills or chests
    private clueSpots: { x: number; z: number; near: boolean }[] = [];
    private clueDropped = false;
    // Whether the first charge (RILE_SPEED) has been called out
    private toldRiled = false;
    private toldStrike = false;
    // A host's count of each guest's gear's max hit, and of the keys and
    // clue scrolls it has handed each (version 153; receiveUp)
    private readonly guestMaxHit = new Map<string, number>();
    private readonly guestHolds = new Map<string, Map<number, number>>();
    private pet?: Pet;
    // What the pet that came along does for you (pets.ts)
    private readonly petBuff?: PetBuff;
    private readonly carry: RunCarry;
    // The run's threat level and what it does (content/threat.ts)
    readonly threat: Threat;
    // A night run: the map's materials are darkened in place (the model is
    // shared with the menu), and put back when the run stops
    readonly night: boolean;
    private readonly gloom?: THREE.Color;
    // The map's model, a square at a time as they come in (mapload.ts)
    private map?: THREE.Object3D;
    private mapLoad?: MapLoad;
    private nightMaterials: { material: THREE.MeshBasicMaterial; color: THREE.Color }[] = [];
    private readonly nightSeen = new Set<THREE.Material>();
    private trader?: Trader;
    private ferry?: Ferry;
    // The vault shows on the minimap once its key is in hand; and whether
    // this hold of E at the way out has woken the neighbourhood yet
    private vaultFound = false;
    private extractWoke = false;
    // Each piece of armour's wear, carried in and out with the gear
    readonly wear: Wear;
    // Poison in you: ticks left, and seconds to the next
    private poisonTicks = 0;
    private poisonIn = 0;
    private fleeMessageAt = -10;
    // map.glb's floors above the plane: buildings' upper storeys and roofs,
    // and how long you've been out from under them
    private upperFloors: THREE.Object3D[] = [];
    private roofClearFor = 0;
    // Seconds left on each potion (a prayer potion works at once instead),
    // and until the next bite can be taken
    readonly boosts: Record<Potion, number> = { strength: 0, defence: 0, brew: 0, prayer: 0, holy: 0 };
    private eatIn = 0;
    // The whole map from above, for the minimap
    private minimap?: { image: HTMLCanvasElement; pxPerTile: number };
    // How far off the camera stands: the settings' distance, and the wheel's
    private zoom = settings.zoom;
    private readonly cameraOffset = new THREE.Vector3();
    // How far the camera's been turned round you from the south, in radians,
    // and how steeply it looks down (version 123; version 124 made it OSRS
    // mobile's): a middle-button drag on a desktop, a finger dragged on the
    // world on a touch screen. The keys and the stick turn with it, so up is
    // always away from the camera.
    private cameraYaw = 0;
    private cameraPitch = BASE_PITCH;
    // The middle button held down for turning, and where it was
    private turnPointer?: number;
    private turnX = 0;
    private turnY = 0;
    // The fingers on the world (not the stick or a button): where each is
    // and came down, and whether it's gone far enough to be turning the camera
    private readonly fingers = new Map<number, { x: number; y: number; fromX: number; fromY: number; dragged: boolean }>();
    // How far apart two fingers were at the pinch's last move
    private pinchFrom?: number;

    private keys = new Set<string>();
    private wantAttack = false;
    // How much longer a press waits for the weapon to be ready
    private attackAsked = 0;
    // A touch screen's stick (ui/touch.ts): which way and how far, -1 to 1,
    // added to the keys
    readonly stick = { x: 0, z: 0 };
    // A flow field to each hero enemies can be after, worked out every
    // quarter second (one hero outside co-op)
    private flows = new Map<string, Int16Array>();
    private flowAge = 1;
    // When you last moved (version 182: the mercenary walks up while you stand)
    private movedAt = -10;
    private fullMessageAt = -10;
    private time = 0;
    private frame?: number;
    private clock = new THREE.Clock();
    private disposables: { dispose(): void }[] = [];

    // Co-op (party.ts): this player as an enemy sees them (the host's own
    // hero; a guest's too, for what's local), the others in the party, and
    // the traffic between the host's run and the guests'
    readonly coop?: CoopSetup;
    private readonly self: Hero;
    private readonly mates = new Map<string, Mate>();
    // This player's run is over (out, dead, or left) while the party's goes
    // on: they watch the others until it ends, or leave
    private done?: RunResult["kind"];
    private spectating?: Mate;
    private partyOver = false;
    // The world holds still while the party loads: who hasn't yet, and how
    // long the host gives them
    private holding = false;
    private waitingFor = new Set<string>();
    private waitLeft = LOAD_WAIT_SECONDS;
    private snapshotIn = 0;
    private snapshots = 0;
    private moveIn = 0;
    private attacks = 0;
    private nextUid = 0;
    // The host's table of what each enemy is, for the guests (and theirs,
    // from the host); whether the host has sent the map yet (spawns after
    // that go on their own)
    private readonly defs: EnemyDefLite[] = [];
    private readonly defIndex = new Map<EnemyDef, number>();
    private worldSent = false;
    // On a guest: what the host's clock says, and the pickups asked for and
    // not yet answered (asked again after a moment)
    private hostLeft: number;
    private readonly requested = new Map<number, number>();
    private readonly ghosts = new Map<number, Enemy>();
    // Ghosts whose models are loading, and those heard to fall meanwhile
    private readonly ghostsLoading = new Set<number>();
    private readonly ghostsKilled = new Set<number>();

    private constructor(
        private readonly renderer: THREE.WebGLRenderer,
        readonly world: WorldDef,
        readonly region: Region,
        carry: RunCarry,
        private readonly character: Character,
        seed: number,
        private readonly hooks: RunHooks,
        coop?: CoopSetup,
    ) {
        this.rng = makeRng(seed);
        this.carry = carry;
        // (and the run's curse's coins on it: version 172)
        this.curse = world.caves ? curseOf(seed) : undefined;
        const threat = threatOf(carry.threat ?? 0);
        this.threat = this.curse ? { ...threat, coins: threat.coins * CURSES[this.curse].coins } : threat;
        this.contract = world.caves ? Run.contractOf(seed, world) : undefined;
        this.autocast = carry.autocast && SPELL_BY_ID.has(carry.autocast) ? carry.autocast : undefined;
        this.spellbook = carry.spellbook === "ancient" ? "ancient" : "standard";
        this.coop = coop;
        this.hostLeft = this.closeSeconds();
        // The first draw, so every browser in a party gets the same night;
        // alone, ?night in the address makes every run a night (a way to
        // try the torchlight)
        this.night = this.rng() < NIGHT_CHANCE || (!coop && FORCE_NIGHT);
        // (a cave has no night: the draw is still made, so the rest stay put)
        if (world.caves) {
            this.night = false;
        }
        // The gloom (version 165): what light there is without a torch. The
        // night's on a night run; underground and in the castle their own,
        // always, with a lantern's and the rooms' fires warm in it
        this.gloom = this.night ? NIGHT_LIGHT : world.rooms === "castles" ? CASTLE_GLOOM : world.caves ? CAVE_GLOOM : undefined;
        this.inventory = carry.inventory.map((s) => ({ ...s }));
        this.equipment = { ...carry.equipment };
        this.coins = carry.coins;
        this.wear = { ...(carry.wear ?? {}) };
        this.petBuff = petBuff(carry.pet);
        this.stats = gearStats(this.equipment, this.wear);
        applyPetStats(this.stats, this.petBuff);
        this.applyDepthsStats(this.stats);
        this.maxHp = BASE_HP + this.stats.hp;
        this.hp = Math.min(this.maxHp, carry.hp ?? this.maxHp);
        this.packSize = carry.packSize ?? INVENTORY_SIZE;
        this.specRate = (carry.specRate ?? 1) * (1 + (this.petBuff?.spec ?? 0));
        this.px = region.spawn.x;
        this.pz = region.spawn.z;
        this.self = {
            id: coop?.me ?? "me",
            name: character.name,
            x: this.px,
            z: this.pz,
            facing: 0,
            hp: this.hp,
            maxHp: this.maxHp,
            dead: false,
            defenceVs: this.defenceTriple(),
            protect: "none",
            me: true,
        };
        // The others, standing where everyone arrives until they say otherwise
        if (coop) {
            for (const hero of coop.heroes) {
                if (hero.id !== coop.me) {
                    this.mates.set(hero.id, new Mate(hero.id, hero.name, hero.loadout, this.px, this.pz, this.scene, (x, z) => this.groundY(x, z)));
                    this.guestMaxHit.set(hero.id, gearStats(hero.loadout.equipment ?? {}).damage);
                }
            }
        }

        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
        // Daylight: the map is lit the way the client lit it, so only the
        // distance needs fog
        this.scene.background = new THREE.Color(0x7d96b8);
        this.scene.fog = new THREE.Fog(0x7d96b8, 28, 70);
        // Underground, the distance goes to black
        if (world.caves) {
            this.scene.background = new THREE.Color(CAVE_DARK);
            this.scene.fog = new THREE.Fog(CAVE_DARK, CAVE_FOG[0], CAVE_FOG[1]);
        }
    }

    static async create(
        renderer: THREE.WebGLRenderer,
        world: WorldDef,
        carry: RunCarry,
        character: Character,
        seed: number,
        hooks: RunHooks,
        coop?: CoopSetup,
    ): Promise<Run> {
        // The Depths' caves are laid out from the run's seed, the same for a whole party
        const cave = world.caves ? await layoutCave(world.id, world.name, seed, world.rooms === "castles" ? CASTLE_ROOMS : CAVE_ROOMS) : undefined;
        const region = cave ? cave.region : await loadRegion(world.id);
        // The host's enemies have more in them for a bigger party
        if (coop?.role === "host" && coop.heroes.length > 1) {
            world = partyWorld(world, coop.heroes.length);
        }
        // And more again at a threat level (version 150)
        world = threatWorld(world, threatOf(carry.threat ?? 0));
        // And as its curse leaves it (version 172)
        world = curseWorld(world, world.caves ? curseOf(seed) : undefined);
        const run = new Run(renderer, world, region, carry, character, seed, hooks, coop);
        // The map comes in a square at a time, the ones round the spawn
        // first: the run starts on those, and the rest join as they arrive
        const map = new THREE.Group();
        run.map = map;
        run.scene.add(map);
        const onPart = (part: THREE.Object3D, cell?: number) => {
            // A Depths room, by its cell, for a lair's tint (version 161)
            if (cell !== undefined) {
                run.caveParts.set(cell, part);
                run.tintLair(cell);
            }
            part.traverse((o) => {
                const mesh = o as THREE.Mesh;
                if (mesh.isMesh) {
                    mesh.frustumCulled = true;
                }
                const level = /^level(\d+)$/.exec(o.name);
                if (level && parseInt(level[1]) > region.plane) {
                    run.upperFloors.push(o);
                }
            });
            map.add(part);
            run.applyNightTo(part);
        };
        run.cave = cave;
        run.mapLoad = cave ? cave.load(onPart) : loadMap(region, region.spawn.x, region.spawn.z, onPart);
        await run.mapLoad.near;
        // The minimap is drawn by day either way, so it can be read; and
        // again whole once the far squares are in
        run.renderMinimapImage();
        run.applyNight();
        void run.mapLoad.all.then(() => {
            if (!run.ended) {
                run.renderMinimapImage();
            }
        });
        await run.loadActors();
        return run;
    }

    // Night: the sky and fog close in, the map's colours go down to the
    // night's blue, and so does the light on everything made from here on
    private applyNight(): void {
        if (!this.gloom || !this.map) {
            return;
        }
        if (this.night) {
            this.scene.background = new THREE.Color(NIGHT_SKY);
            this.scene.fog = new THREE.Fog(NIGHT_SKY, NIGHT_FOG[0], NIGHT_FOG[1]);
        }
        setWorldLight(this.gloom);
        setTorchNight(this.gloom);
        this.nightApplied = true;
        this.applyNightTo(this.map);
    }

    // The night's colour on a part of the map (each once, as the squares
    // come in; nothing until the night has begun)
    private nightApplied = false;

    private applyNightTo(root: THREE.Object3D): void {
        const gloom = this.gloom;
        if (!gloom || !this.nightApplied) {
            return;
        }
        root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) {
                return;
            }
            for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
                const material = m as THREE.MeshBasicMaterial;
                if (!this.nightSeen.has(material) && material.color) {
                    this.nightSeen.add(material);
                    this.nightMaterials.push({ material, color: material.color.clone() });
                    material.color.multiply(this.gloomNow());
                }
            }
        });
    }

    // A picture of the whole map from straight above, north up, drawn
    // through the screen's own pipeline (to the game canvas, then copied)
    // so its colours are the screen's. Only the map is drawn (drawn again
    // when the far squares are in, with everything that moves hidden for
    // the moment); the fog over it is made the first time only.
    private renderMinimapImage(): void {
        const g = this.region;
        const canvas = this.renderer.domElement;
        // The canvas hasn't been sized yet on a fresh page (start() does
        // that), and a background tab can report no window at all
        if (canvas.width < 2 || canvas.height < 2) {
            this.renderer.setSize(window.innerWidth || 512, window.innerHeight || 512, false);
        }
        const side = Math.min(canvas.width, canvas.height);
        const tiles = Math.max(g.sizeX, g.sizeY);
        const half = tiles / 2;
        const camera = new THREE.OrthographicCamera(
            (-half * canvas.width) / side,
            (half * canvas.width) / side,
            (half * canvas.height) / side,
            (-half * canvas.height) / side,
            1,
            200,
        );
        // The picture's top edge is the map's north edge and its left edge the
        // west, as everything that reads it (the minimap, the fog, the full
        // map, the summary's map) reckons from baseX and baseY + sizeY. On a
        // map that isn't square (the Depths, 384 by 320) it was centred
        // instead, and every one of those was a room's height off, as the
        // user found: the map showed ways through beside you that weren't
        const cx = g.baseX + tiles / 2;
        const cz = -(g.baseY + g.sizeY - tiles / 2);
        camera.position.set(cx, 100, cz);
        camera.up.set(0, 0, -1);
        camera.lookAt(cx, 0, cz);
        const fog = this.scene.fog;
        const background = this.scene.background;
        this.scene.fog = null;
        this.scene.background = new THREE.Color(0x000000);
        const hidden: THREE.Object3D[] = [];
        for (const child of this.scene.children) {
            if (child !== this.map && child.visible) {
                child.visible = false;
                hidden.push(child);
            }
        }
        // The map by day, whatever the hour (and no torch's pool of light
        // drawn into the picture)
        const dimmed = this.nightMaterials;
        for (const { material, color } of dimmed) {
            material.color.copy(color);
        }
        torchesOut();
        this.renderer.render(this.scene, camera);
        for (const { material } of dimmed) {
            material.color.multiply(this.gloomNow());
        }
        for (const child of hidden) {
            child.visible = true;
        }
        this.scene.fog = fog;
        this.scene.background = background;
        const image = this.minimap?.image ?? document.createElement("canvas");
        image.width = side;
        image.height = side;
        const imageCtx = image.getContext("2d")!;
        imageCtx.drawImage(canvas, (canvas.width - side) / 2, (canvas.height - side) / 2, side, side, 0, 0, side, side);
        // A cave's rock (the Depths) is drawn dark, as OSRS's cave maps
        // have it: from above its top is the floor's own brown, so the map
        // showed rooms far bigger than they are and ways through that
        // aren't there, as the user found
        if (this.world.caves) {
            const ppt = side / tiles;
            imageCtx.fillStyle = CAVE_ROCK_MAP;
            for (let y = 0; y < g.sizeY; y++) {
                for (let x = 0; x < g.sizeX; x++) {
                    if (!g.isOpenTile(g.baseX + x, g.baseY + y)) {
                        imageCtx.fillRect(x * ppt, (g.sizeY - 1 - y) * ppt, ppt + 0.5, ppt + 0.5);
                    }
                }
            }
        }
        this.minimap = { image, pxPerTile: side / tiles };
        if (!this.fog) {
            // Fog over all of it, cleared as the map is walked
            const fogCanvas = document.createElement("canvas");
            fogCanvas.width = side;
            fogCanvas.height = side;
            const fogCtx = fogCanvas.getContext("2d")!;
            fogCtx.fillStyle = "#000";
            fogCtx.fillRect(0, 0, side, side);
            this.fog = fogCanvas;
            this.explored = new Uint8Array(g.sizeX * g.sizeY);
        }
        // Not left on screen: if loading fails after this, the menu comes
        // back over a blank canvas rather than the map from above
        this.renderer.clear();
    }

    // Clears the fog round the player when they're on a new tile
    private reveal(): void {
        const g = this.region;
        const mini = this.minimap;
        if (!mini || !this.fog || !this.explored) {
            return;
        }
        const tx = g.tileX(this.px) - g.baseX;
        const ty = g.tileY(this.pz) - g.baseY;
        const here = tx + ty * g.sizeX;
        if (here === this.exploredTile) {
            return;
        }
        this.exploredTile = here;
        for (let dy = -FOG_RADIUS; dy <= FOG_RADIUS; dy++) {
            for (let dx = -FOG_RADIUS; dx <= FOG_RADIUS; dx++) {
                const x = tx + dx;
                const y = ty + dy;
                if (dx * dx + dy * dy <= FOG_RADIUS * FOG_RADIUS && x >= 0 && y >= 0 && x < g.sizeX && y < g.sizeY) {
                    this.explored[x + y * g.sizeX] = 1;
                }
            }
        }
        const ctx = this.fog.getContext("2d")!;
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc((this.px - g.baseX) * mini.pxPerTile, (g.baseY + g.sizeY + this.pz) * mini.pxPerTile, FOG_RADIUS * mini.pxPerTile, 0, Math.PI * 2);
        ctx.fill();
    }

    private isExplored(x: number, z: number): boolean {
        const g = this.region;
        const tx = g.tileX(x) - g.baseX;
        const ty = g.tileY(z) - g.baseY;
        if (!this.explored || tx < 0 || ty < 0 || tx >= g.sizeX || ty >= g.sizeY) {
            return false;
        }
        return this.explored[tx + ty * g.sizeX] === 1;
    }

    // The whole map as it's been seen, with where you arrived, the way out
    // if it was found, and where the run ended: for the summary
    private recapMap(size: number): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, size, size);
        const mini = this.minimap;
        if (!mini) {
            return canvas;
        }
        ctx.drawImage(mini.image, 0, 0, size, size);
        if (this.fog) {
            ctx.drawImage(this.fog, 0, 0, size, size);
        }
        const g = this.region;
        const scale = size / mini.image.width;
        const dot = (x: number, z: number, color: string, r: number) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc((x - g.baseX) * mini.pxPerTile * scale, (g.baseY + g.sizeY + z) * mini.pxPerTile * scale, r, 0, Math.PI * 2);
            ctx.fill();
        };
        dot(g.spawn.x, g.spawn.z, "#ffffff", 3);
        for (const exit of this.exits) {
            if (exit.found) {
                dot(exit.x, exit.z, "#00ff00", 3);
            }
        }
        if (this.grave && this.grave.items.length > 0) {
            dot(this.grave.x, this.grave.z, "#b8b0ff", 3);
        }
        dot(this.px, this.pz, this.dead ? "#ff2020" : "#ffd700", 4);
        return canvas;
    }

    // The minimap in its circle: the map around you, chests, the way out,
    // enemies and the boss, you in the middle
    drawMinimap(ctx: CanvasRenderingContext2D, size: number): void {
        const mini = this.minimap;
        if (!mini) {
            return;
        }
        const g = this.region;
        const scale = size / MINIMAP_TILES;
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        const half = MINIMAP_TILES / 2;
        const sx = (this.px - half - g.baseX) * mini.pxPerTile;
        const sy = (this.pz - half + g.baseY + g.sizeY) * mini.pxPerTile;
        const sw = MINIMAP_TILES * mini.pxPerTile;
        ctx.drawImage(mini.image, sx, sy, sw, sw, 0, 0, size, size);
        if (this.fog) {
            ctx.drawImage(this.fog, sx, sy, sw, sw, 0, 0, size, size);
        }
        const dot = (x: number, z: number, color: string, r: number) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(size / 2 + (x - this.px) * scale, size / 2 + (z - this.pz) * scale, r, 0, Math.PI * 2);
            ctx.fill();
        };
        // Only what's been seen: chests and enemies on explored ground, and
        // the way out once it's found
        for (const chest of this.chests) {
            if (chest.opened) {
                continue;
            }
            // The vault, once its key is in hand, wherever it is
            if (chest.vault) {
                if (this.vaultFound || this.isExplored(chest.tile.x, chest.tile.z)) {
                    dot(chest.tile.x, chest.tile.z, "#60e0ff", 3);
                }
            } else if (this.isExplored(chest.tile.x, chest.tile.z)) {
                dot(chest.tile.x, chest.tile.z, chest.boss ? "#ffd700" : "#ff6a00", 2.5);
            }
        }
        for (const exit of this.exits) {
            if (exit.found) {
                dot(exit.x, exit.z, "#00ff00", 3);
            }
        }
        // Your gravestone, always: you know where you fell
        if (this.grave && this.grave.items.length > 0) {
            dot(this.grave.x, this.grave.z, "#b8b0ff", 3);
        }
        if (this.trader && this.isExplored(this.trader.x, this.trader.z)) {
            dot(this.trader.x, this.trader.z, "#40e8ff", 3);
        }
        // The altar and the camps, once come on (version 165)
        for (const altar of this.altars) {
            if (this.isExplored(altar.x, altar.z)) {
                dot(altar.x, altar.z, altar.used ? "#8a8a8a" : "#fff2a8", 3);
            }
        }
        for (const camp of this.camps) {
            if (camp.seen) {
                dot(camp.x, camp.z, "#c8a878", 2.5);
            }
        }
        for (const p of this.props) {
            const colour = this.propDot(p);
            if (colour) {
                dot(p.x, p.z, colour, 2.2);
            }
        }
        for (const e of this.enemies) {
            if (e.state !== "dead" && (this.isExplored(e.x, e.z) || e.hunting || (e.def.boss && this.lairsShown))) {
                dot(e.x, e.z, e.def.boss ? "#ff0000" : e.def.superior ? "#ff8c00" : "#ffff00", e.def.boss ? 4 : e.def.superior ? 3 : 2);
            }
        }
        // The party, wherever they are
        for (const m of this.mates.values()) {
            // Down and waiting for help: red, and bigger, to be found
            if (!m.done) {
                dot(m.x, m.z, m.dead ? "#ff2020" : "#2e8bff", m.dead ? 4 : 3);
            } else if (m.corpse) {
                dot(m.x, m.z, "#9a9a9a", 2);
            }
        }
        if (!this.done) {
            dot(this.px, this.pz, "#ffffff", 3);
        }
        ctx.restore();
    }

    // The whole map, for the full map screen (version 91): its ground in
    // tiles, and where you arrived and are, to open it on
    get mapBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } | undefined {
        if (!this.minimap) {
            return undefined;
        }
        const g = this.region;
        return { minX: g.baseX, maxX: g.baseX + g.sizeX, minZ: -(g.baseY + g.sizeY), maxZ: -g.baseY };
    }

    get mapHere(): { x: number; z: number } {
        const watching = this.done ? this.spectating : undefined;
        return watching ? { x: watching.x, z: watching.z } : { x: this.px, z: this.pz };
    }

    // The full map: the same picture, fog and marks as the minimap, the
    // whole map at any size, centred on a point (scene x and z) at this many
    // pixels a tile, with what's been found named at a size it can be read
    drawFullMap(ctx: CanvasRenderingContext2D, width: number, height: number, centreX: number, centreZ: number, pxPerTile: number): void {
        const mini = this.minimap;
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
        if (!mini) {
            ctx.restore();
            return;
        }
        const g = this.region;
        // Scene to screen, and the picture laid on it by the same reckoning
        // the minimap uses (picture x from baseX, y from the map's south edge)
        const sx = (x: number) => width / 2 + (x - centreX) * pxPerTile;
        const sy = (z: number) => height / 2 + (z - centreZ) * pxPerTile;
        const k = pxPerTile / mini.pxPerTile;
        ctx.imageSmoothingEnabled = pxPerTile < mini.pxPerTile * 2;
        ctx.setTransform(k, 0, 0, k, sx(g.baseX), sy(-(g.baseY + g.sizeY)));
        ctx.drawImage(mini.image, 0, 0);
        if (this.fog) {
            // The ground not yet walked shows dimmed here, so the map can be
            // read as a map; what's on it still shows only once it's been
            // seen (the marks below), and the minimap keeps it black
            ctx.globalAlpha = FULL_MAP_FOG;
            ctx.drawImage(this.fog, 0, 0);
            ctx.globalAlpha = 1;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const r = Math.max(3, Math.min(8, pxPerTile * 0.9));
        const dot = (x: number, z: number, color: string, scale = 1, ring = false) => {
            ctx.beginPath();
            ctx.arc(sx(x), sy(z), r * scale, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = ring ? "#ffffff" : "rgba(0, 0, 0, 0.8)";
            ctx.stroke();
        };
        // Where you came in, with the genie: always, it's where you arrived
        dot(g.spawn.x, g.spawn.z, "#ff66cc", 1, true);
        for (const chest of this.chests) {
            if (chest.opened) {
                continue;
            }
            if (chest.vault) {
                if (this.vaultFound || this.isExplored(chest.tile.x, chest.tile.z)) {
                    dot(chest.tile.x, chest.tile.z, "#60e0ff", 1.1);
                }
            } else if (this.isExplored(chest.tile.x, chest.tile.z)) {
                dot(chest.tile.x, chest.tile.z, chest.boss ? "#ffd700" : "#ff6a00", chest.boss ? 1.1 : 0.8);
            }
        }
        for (const exit of this.exits) {
            if (exit.found) {
                dot(exit.x, exit.z, "#00ff00", 1.3, true);
            }
        }
        if (this.grave && this.grave.items.length > 0) {
            dot(this.grave.x, this.grave.z, "#b8b0ff", 1.1);
        }
        if (this.trader && this.isExplored(this.trader.x, this.trader.z)) {
            dot(this.trader.x, this.trader.z, "#40e8ff", 1.1);
        }
        for (const altar of this.altars) {
            if (this.isExplored(altar.x, altar.z)) {
                dot(altar.x, altar.z, altar.used ? "#8a8a8a" : "#fff2a8", 1.1);
            }
        }
        for (const camp of this.camps) {
            if (camp.seen) {
                dot(camp.x, camp.z, "#c8a878", 0.9);
            }
        }
        for (const p of this.props) {
            const colour = this.propDot(p);
            if (colour) {
                dot(p.x, p.z, colour, 0.8);
            }
        }
        for (const e of this.enemies) {
            if (e.state !== "dead" && (this.isExplored(e.x, e.z) || e.hunting || (e.def.boss && this.lairsShown))) {
                dot(e.x, e.z, e.def.boss ? "#ff0000" : e.def.superior ? "#ff8c00" : "#ffff00", e.def.boss ? 1.4 : e.def.superior ? 1 : 0.6);
            }
        }
        for (const m of this.mates.values()) {
            if (!m.done) {
                dot(m.x, m.z, m.dead ? "#ff2020" : "#2e8bff", m.dead ? 1.3 : 1.1, true);
            } else if (m.corpse) {
                dot(m.x, m.z, "#9a9a9a", 0.8);
            }
        }
        if (!this.done) {
            // You, with which way you face
            const x = sx(this.px);
            const y = sy(this.pz);
            ctx.beginPath();
            ctx.moveTo(x + Math.sin(this.facing) * r * 2.2, y + Math.cos(this.facing) * r * 2.2);
            ctx.lineTo(x + Math.sin(this.facing + 2.4) * r * 1.3, y + Math.cos(this.facing + 2.4) * r * 1.3);
            ctx.lineTo(x + Math.sin(this.facing - 2.4) * r * 1.3, y + Math.cos(this.facing - 2.4) * r * 1.3);
            ctx.closePath();
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000000";
            ctx.stroke();
        }
        ctx.restore();
    }

    // -----------------------------------------------------------------------
    // Building the run

    private groundY(x: number, z: number): number {
        return this.region.heightAt(x, z);
    }

    // Something standing on the map: on its tile's highest corner, so no
    // part of it is under the ground, under the world's light (the night's,
    // on a night run)
    private placeActor(actor: Actor, x: number, z: number, rotation = 0, scale = 1): void {
        actor.root.position.set(x, this.region.topAt(x, z), z);
        actor.root.rotation.y = rotation;
        actor.root.scale.setScalar(scale);
        tint(actor, WHITE);
        this.scene.add(actor.root);
    }

    // The player, their gravestone and their pet; and, unless a co-op host
    // lays the map out for this run (a guest), the map's own things
    private async loadActors(): Promise<void> {
        const jobs: Promise<void>[] = [];

        // The player
        jobs.push(
            PlayerLook.create(this.character, this.equipment).then((look) => {
                this.player = look;
                look.stance = this.stats.weapon?.stance;
                look.root.scale.setScalar(this.character.size);
                look.play("idle");
                this.scene.add(look.root);
            }),
        );
        // A solo run's mercenary (version 173)
        jobs.push(this.makeMerc());
        const crown = crownVerified(crownKey(), () => this.wearCrown());
        if (crown) {
            this.wearCrown();
        }

        // Your gravestone, where you fell last time, with what you carried
        const grave = this.carry.grave;
        if (grave && grave.items.length > 0) {
            // A run left by closing the page has no spot (version 153): its
            // stone stands a step from where you arrive
            const known = Number.isFinite(grave.x) && Number.isFinite(grave.z);
            const gx = known ? grave.x : this.px + 1.5;
            const gz = known ? grave.z : this.pz + 1.5;
            jobs.push(
                createActor("locs", 404).then((actor) => {
                    this.placeActor(actor, gx, gz);
                    addShadow(actor.root, 0.5);
                    this.grave = { actor, x: gx, z: gz, items: grave.items.map((s) => ({ ...s })) };
                }),
            );
        }

        // The pet, at your heels
        if (this.carry.pet) {
            jobs.push(
                createPet(this.carry.pet).then((actor) => {
                    const x = this.px + 0.8;
                    const z = this.pz + 0.8;
                    actor.root.position.set(x, this.groundY(x, z), z);
                    this.scene.add(actor.root);
                    this.pet = { actor, x, z, facing: 0, stuck: 0 };
                }),
            );
        }

        if (this.coop?.role !== "guest") {
            this.loadLayout(jobs);
        }
        await Promise.all(jobs);

        // One of the champions has the vault's key
        if (this.coop?.role !== "guest") {
            const champions = this.enemies.filter((e) => e.def.champion);
            if (champions.length > 0) {
                champions[Math.floor(this.rng() * champions.length)].key = true;
            }
        }
    }

    // The map's things: the way out, the trader, the vault, the chests, the
    // enemies and the boss, scattered by the run's rng
    private loadLayout(jobs: Promise<void>[]): void {
        const region = this.region;
        const reach = region.flowField({ x: this.px, z: this.pz });
        const taken = new Set<number>();

        // The ways out: each somewhere a good walk from where you arrived,
        // to find (the minimap shows one green once it's near), and spread
        // out from each other, a third of the map apart where the ground
        // allows, closer where it doesn't
        const spread = Math.max(region.sizeX, region.sizeY) * EXIT_SPREAD_SHARE;
        for (let i = 0; i < EXIT_COUNT; i++) {
            let tile: Tile | undefined;
            for (let apart = spread; !tile && apart >= 1; apart /= 2) {
                for (let tries = 0; tries < 8 && !tile; tries++) {
                    const t = this.flatTile(reach, 30, taken) ?? this.flatTile(reach, 15, taken);
                    if (t && this.exits.every((e) => Math.hypot(e.x - t.x, e.z - t.z) >= apart)) {
                        tile = t;
                    }
                }
            }
            if (!tile) {
                if (i > 0) {
                    break;
                }
                tile = { x: this.px, z: this.pz };
            }
            const exit: Exit = { x: tile.x, z: tile.z, found: false };
            this.exits.push(exit);
            jobs.push(createActor("locs", EXIT_LOC).then((a) => this.placeExit(a, exit)));
        }

        // The genie, two tiles from where you arrived, facing the spot (none
        // in the Depths)
        const ferryTile = this.world.bosses ? undefined : this.nearTile({ x: this.px, z: this.pz }, taken, reach);
        if (ferryTile) {
            const rotation = Math.atan2(this.px - ferryTile.x, this.pz - ferryTile.z);
            this.ferry = { x: ferryTile.x, z: ferryTile.z, rotation };
            jobs.push(this.loadFerry());
        }

        // The wandering trader, somewhere a walk off, facing whichever way
        const traderTile = this.flatTile(reach, 15, taken);
        if (traderTile) {
            const rotation = this.rng() * Math.PI * 2;
            this.trader = { x: traderTile.x, z: traderTile.z, rotation, seen: false };
            jobs.push(this.loadTrader());
        }

        // The vault: a crystal chest a walk off, locked until a champion's
        // key opens it
        const vaultTile = this.flatTile(reach, 20, taken);
        if (vaultTile) {
            const chest: Chest = { tile: vaultTile, opened: false, boss: false, vault: true };
            this.chests.push(chest);
            jobs.push(this.loadChest(chest));
        }

        // Chests, one by each boss and the rest about the map. The Depths have
        // ENDLESS_BOSSES of their own bosses, a different few each run,
        // each as far from the others and from where you arrive as can be
        // found
        const bossDefs = this.world.bosses ? pickSome(this.rng, this.world.bosses, ENDLESS_BOSSES) : [this.world.boss];
        const bossTiles: Tile[] = [];
        const first = this.bossTile(reach, taken);
        if (first) {
            bossTiles.push(first);
        }
        const apart: Tile[] = [{ x: this.px, z: this.pz }, ...bossTiles];
        while (bossTiles.length > 0 && bossTiles.length < bossDefs.length) {
            const tile = this.spreadTile(reach, 40, taken, apart, BOSS_SPREAD_CANDIDATES);
            if (!tile) {
                break;
            }
            bossTiles.push(tile);
            apart.push(tile);
        }
        const chestTiles: { tile: Tile; boss: boolean }[] = [];
        for (const bossTile of bossTiles) {
            const near = this.flatTile(reach, 6, taken);
            chestTiles.push({ tile: this.nearTile(bossTile, taken, reach) ?? near ?? bossTile, boss: true });
        }
        // The counts are a full map's worth; a one square map gets its share
        // of them, by open ground, and never under half
        const share = Math.min(1.2, Math.max(0.5, region.openTiles / 12000));
        // Chests go by the ground that can be walked to as well (version
        // 77): the share's cap had left the widest maps (the Wilderness,
        // Lumbridge, the desert) with a third of the chests a smaller map has
        // for its ground. Never fewer than before.
        // The hillsides run over since version 109 aren't more ground for
        // chests and enemies: the maps keep the counts they had
        let reachable = 0;
        for (let i = 0; i < reach.length; i++) {
            if (reach[i] >= 0 && !region.isHill(i)) {
                reachable++;
            }
        }
        const chestCount = Math.round(this.world.chests * Math.max(share, reachable / CHEST_FULL_REACH));
        // Each one as far from the others as a few tries can find, so they
        // spread over the map instead of bunching
        const placed: Tile[] = chestTiles.map((c) => c.tile);
        if (vaultTile) {
            placed.push(vaultTile);
        }
        for (let i = 0; i < chestCount; i++) {
            const tile = this.spreadTile(reach, 10, taken, placed);
            if (tile) {
                chestTiles.push({ tile, boss: false });
                placed.push(tile);
            }
        }
        for (const chest of chestTiles) {
            // Some chests aren't what they seem, and some are watched; the
            // deep ones hold more (version 179)
            const mimic = !chest.boss && this.rng() < 1 / MIMIC_ONE_IN;
            const ambush = !chest.boss && !mimic && this.rng() < AMBUSH_CHANCE;
            const deep = !chest.boss && !mimic && this.depthShare(chest.tile) >= DEEP_CHEST;
            const made: Chest = { tile: chest.tile, opened: false, boss: chest.boss, mimic, ambush, deep };
            this.chests.push(made);
            jobs.push(this.loadChest(made));
        }

        // Enemies everywhere but near the spawn, now and then a champion,
        // and the boss far off
        const totalWeight = this.world.enemies.reduce((n, e) => n + e.weight, 0);
        // By the ground that can be walked to (version 78), so every map is
        // about as crowded as the middling ones; the open-ground share had
        // left the Wilderness at under a fifth of God Wars' crowd. A floor
        // so a small map still has a fight, a ceiling for phones.
        const enemyCount = Math.min(ENEMY_MAX, Math.max(ENEMY_MIN, Math.round((this.world.enemyCount * reachable) / ENEMY_FULL_REACH)));
        // There's always at least one champion: somebody has to carry the
        // vault's key
        let anyChampion: boolean = false;
        for (let i = 0; i < enemyCount; i++) {
            let roll = this.rng() * totalWeight;
            let def = this.world.enemies[0].def;
            for (const e of this.world.enemies) {
                roll -= e.weight;
                if (roll <= 0) {
                    def = e.def;
                    break;
                }
            }
            // (twice as far off where you arrive in the Depths, with all
            // their champions and packs: a test run died where it came in)
            const tile = region.randomTile(this.rng, reach, this.world.bosses ? 16 : 8, taken);
            if (tile) {
                // The Depths (DEPTHS_PACK): champions and elites more often,
                // and some come as a pack, led by a champion as often as not.
                // The first rooms in hold only the common kinds (version
                // 179): the champions, packs and elites start DEEP_FROM of
                // the way in, and elites come twice as often past DEEP_ELITE
                const depths = this.world.bosses ? DEPTHS_CHAMPIONS : 1;
                const deep = this.depthShare(tile);
                const dangerous = deep >= DEEP_FROM;
                const [packOdds, packSize] = this.eased() ? [EASED_PACK, EASED_PACK_SIZE] : [DEPTHS_PACK, DEPTHS_PACK_SIZE];
                const pack = this.world.bosses && dangerous && this.rng() < packOdds ? randInt(this.rng, packSize[0], packSize[1]) - 1 : 0;
                const champion: boolean =
                    (dangerous && this.rng() < this.threat.champion * depths) ||
                    (pack > 0 && this.rng() < DEPTHS_PACK_LEADER) ||
                    (i === enemyCount - 1 && !anyChampion);
                anyChampion = anyChampion || champion;
                // Some of the walkers patrol a round instead of standing
                const route =
                    !champion && !pack && !def.shoots && this.rng() < PATROL_CHANCE ? this.patrolRoute(tile, reach) : undefined;
                // Now and then an elite, with a trait of its own
                const traits = Object.keys(TRAITS) as Trait[];
                const trait =
                    !champion && dangerous && this.rng() < (this.threat.elite * depths * (deep >= DEEP_ELITE ? 2 : 1)) / ELITE_ONE_IN
                        ? traits[Math.floor(this.rng() * traits.length)]
                        : undefined;
                for (let p = 0; p < pack && i < enemyCount - 1; p++) {
                    const beside = this.nearTile(tile, taken, reach);
                    if (beside) {
                        i++;
                        jobs.push(this.spawnEnemy(def, beside).then(() => undefined));
                    }
                }
                jobs.push(
                    this.spawnEnemy(champion ? this.champion(def) : def, tile, trait).then((e) => {
                        e.route = route;
                    }),
                );
                // On the hardest maps champions come in pairs
                if (champion && this.world.tier >= 4) {
                    const second = this.nearTile(tile, taken, reach);
                    if (second) {
                        jobs.push(this.spawnEnemy(this.champion(def), second).then(() => undefined));
                    }
                }
            }
        }
        if (this.cave) {
            this.placeRooms(reach, taken, jobs, bossTiles);
            // The Depths' tunneller and the castle's ghosts (version 172)
            jobs.push(...this.placeHaunts(reach, taken));
        }
        bossTiles.forEach((tile, i) => {
            jobs.push(this.spawnEnemy(bossDefs[i], tile).then(() => undefined));
            // The Depths' bosses each have champions standing guard about
            // them (BOSS_GUARDS), of the cave's own kinds
            if (!this.world.bosses) {
                return;
            }
            const [fewest, most] = this.eased() ? EASED_GUARDS : BOSS_GUARDS;
            const guards = randInt(this.rng, fewest, most);
            let placed = 0;
            for (let tries = 0; tries < guards * 6 && placed < guards; tries++) {
                const angle = this.rng() * Math.PI * 2;
                const dist = 3 + this.rng() * 3;
                const x = Math.floor(tile.x + Math.cos(angle) * dist) + 0.5;
                const z = Math.floor(tile.z + Math.sin(angle) * dist) + 0.5;
                const at = this.region.tileX(x) - region.baseX + (this.region.tileY(z) - region.baseY) * region.sizeX;
                if (region.flowAt(reach, x, z) < 0 || taken.has(at) || !region.fits(x, z, 0.4)) {
                    continue;
                }
                taken.add(at);
                placed++;
                const def = this.world.enemies[Math.floor(this.rng() * this.world.enemies.length)].def;
                jobs.push(this.spawnEnemy(this.champion(def), { x, z }).then(() => undefined));
            }
        });
    }

    // The Depths' special rooms (version 161, as the user asked), each in a
    // room of its own away from where you arrive and the lairs: an altar that
    // fills the prayer bar once a run, a trapped treasure room's ornate chest
    // (rich, and its floor gives way), a brimstone chest that only a
    // superior's key opens, and dead adventurers' camps with a few supplies
    private altars: { x: number; z: number; used: boolean }[] = [];
    private camps: { x: number; z: number; seen: boolean }[] = [];
    private brimstoneDropped = false;

    private placeRooms(reach: Int16Array, taken: Set<number>, jobs: Promise<void>[], bossTiles: Tile[]): void {
        const cave = this.cave!;
        const g = this.region;
        const busy = new Set([cave.cellAt(this.px, this.pz), ...bossTiles.map((t) => cave.cellAt(t.x, t.z))]);
        const cells = cave.cells
            .map((name, cell) => ({ name, cell, roll: this.rng() }))
            .filter((c) => c.name !== cave.empty && !busy.has(c.cell))
            .sort((a, b) => a.roll - b.roll)
            .map((c) => c.cell);
        // An open, reachable tile well inside a room (with this much open
        // ground round it)
        const tileIn = (cell: number | undefined, radius = 0.7): Tile | undefined => {
            if (cell === undefined) {
                return undefined;
            }
            const ox = g.baseX + (cell % cave.cellsX) * 64;
            const oy = g.baseY + Math.floor(cell / cave.cellsX) * 64;
            for (let tries = 0; tries < 80; tries++) {
                const x = ox + 12 + Math.floor(this.rng() * 40) + 0.5;
                const z = -(oy + 12 + Math.floor(this.rng() * 40) + 0.5);
                const i = g.tileX(x) - g.baseX + (g.tileY(z) - g.baseY) * g.sizeX;
                if (g.flowAt(reach, x, z) >= 0 && !taken.has(i) && g.fits(x, z, radius)) {
                    taken.add(i);
                    return { x, z };
                }
            }
            return undefined;
        };
        this.placeProps(tileIn, busy, jobs);
        const altar = tileIn(cells.shift());
        if (altar) {
            this.altars.push({ ...altar, used: false });
            jobs.push(this.loadAltar(altar));
        }
        for (const room of ["trap", "brimstone"] as const) {
            const tile = tileIn(cells.shift());
            if (tile) {
                const chest: Chest = { tile, opened: false, boss: false, room };
                this.chests.push(chest);
                jobs.push(this.loadChest(chest));
            }
        }
        for (let i = 0; i < CAMPS; i++) {
            const tile = tileIn(cells.shift());
            if (tile) {
                this.camps.push({ ...tile, seen: false });
            }
        }
    }

    // How far in a spot is: its room's depth as a share of the deepest (1
    // off a cave, or where there's no telling)
    private depthShare(tile: Tile): number {
        const cave = this.cave;
        if (!cave || cave.maxDepth <= 0) {
            return 1;
        }
        const depth = cave.depth[cave.cellAt(tile.x, tile.z)] ?? -1;
        return depth < 0 ? 1 : depth / cave.maxDepth;
    }

    private loadAltar(at: Tile): Promise<void> {
        return createActor("locs", ALTAR_LOC).then((actor) => {
            if (!this.ended) {
                this.placeActor(actor, at.x, at.z);
                addShadow(actor.root, 0.9);
            }
        });
    }

    // A camp's supplies, left where its owner fell (the host's, sent once the
    // map's gone out, so a party sees them too)
    private stockCamps(): void {
        const tier = this.world.tier;
        for (const camp of this.camps) {
            this.dropPickup(FOOD_BY_TIER[Math.min(FOOD_BY_TIER.length - 1, tier - 1)], 2, camp.x, camp.z, 1.2);
            this.dropPickup(OIL_CAN, 1, camp.x, camp.z, 1.2);
            this.dropPickup(SHOP_POTIONS[Math.floor(this.rng() * SHOP_POTIONS.length)], 1, camp.x, camp.z, 1.2);
            this.dropPickup(REMAINS, 1, camp.x, camp.z, 0);
        }
    }

    // A chest's model on its tile (gilded for the boss's; the crystal chest
    // for the vault), unless it's been opened while the model loaded
    private loadChest(chest: Chest): Promise<void> {
        return createActor("locs", chest.vault ? VAULT_LOC : 75).then((actor) => {
            if (chest.opened || this.ended) {
                return;
            }
            this.placeActor(actor, chest.tile.x, chest.tile.z, Math.PI);
            addShadow(actor.root, 0.7);
            if (chest.boss) {
                tint(actor, new THREE.Color(1.2, 1.1, 0.7));
            }
            // The ornate chest bright, the brimstone chest burnt dark, a
            // deep one grey with age
            if (chest.room) {
                tint(actor, chest.room === "trap" ? new THREE.Color(1.4, 1.0, 0.6) : new THREE.Color(0.85, 0.45, 0.4));
            } else if (chest.deep) {
                tint(actor, new THREE.Color(0.8, 0.85, 1.0));
            }
            chest.actor = actor;
        });
    }

    // -----------------------------------------------------------------------
    // The maps' own things (version 166, as the user asked; props.ts): oil
    // barrels, things to search, braziers, a lever and its passage, a shrine,
    // dead adventurers; the Depths' veins, pools, cracked rock and rope
    // ladders; the castle's portraits, its library's secret, suits of armour,
    // fonts, prisoners' cages and banquets

    private props: Prop[] = [];
    // The rooms a brazier's lit, by cell, and the hitpoints at or under which
    // a kind's too weak to walk into one
    private litCells = new Set<number>();
    private weakHp = 0;
    // The shrine's gifts this player has, and the bosses' lairs on their map
    // (the shrine's prayer trade, or the castle's portraits)
    private shrineGifts = new Set<string>();
    private lairsShown = false;
    // E held on one: which, for how long, since when (a hit breaks a hold,
    // `lastStruck`'s: not poison)
    private lastStruck = -100;
    private holdProp?: Prop;
    private holdFor = 0;
    private holdFrom = 0;
    private allies: Ally[] = [];
    private readonly humanFoes = new Map<string, EnemyDef>();
    private poolDisc?: THREE.CircleGeometry;
    private poolWater?: THREE.MeshBasicMaterial;

    // Each kind's share of the map: in rooms of its own kind first, then any.
    // The lit, the rare and the big stay out of where you arrive and the
    // lairs; barrels, search spots, the dead, veins and armour go anywhere.
    private placeProps(tileIn: (cell: number | undefined, radius?: number) => Tile | undefined, busy: Set<number>, jobs: Promise<void>[]): void {
        const cave = this.cave!;
        const castle = this.world.id === CASTLE_ID;
        const kindOf = (cell: number) => cave.cells[cell].split("_").pop() ?? "";
        const rooms = cave.cells.map((_, c) => c).filter((c) => cave.cells[c] !== cave.empty);
        const pick = <T>(list: T[]): T | undefined => list[Math.floor(this.rng() * list.length)];
        const anywhere = new Set<PropKind>(["barrel", "search", "corpse", "vein", "armour"]);
        const tier = Math.min(5, Math.max(2, this.world.tier));
        const weights = VEIN_WEIGHTS[tier];
        const weighed = () => {
            let roll = this.rng() * weights.reduce((a, b) => a + b, 0);
            for (let i = 0; i < weights.length; i++) {
                roll -= weights[i];
                if (roll <= 0) {
                    return i;
                }
            }
            return 0;
        };
        const lit = new Set<number>();
        for (const plan of PROP_PLANS) {
            const count = castle ? plan.castle : plan.caves;
            // (a passage's and a mine cart's two ends go below, and so do
            // the dead ends' strongboxes, webs and gates)
            if (plan.kind === "passage" || plan.kind === "cart" || plan.kind === "strongbox" || plan.kind === "web" || plan.kind === "gate") {
                continue;
            }
            const free = rooms.filter((c) => anywhere.has(plan.kind) || !busy.has(c));
            const own = plan.rooms ? free.filter((c) => plan.rooms!.includes(kindOf(c))) : [];
            for (let n = 0; n < count; n++) {
                let tile: Tile | undefined;
                let cell: number | undefined;
                for (let tries = 0; tries < 6 && !tile; tries++) {
                    // A brazier to a room
                    const from = plan.kind === "brazier" ? free.filter((c) => !lit.has(c)) : own.length > 0 && tries < 4 ? own : free;
                    cell = pick(from);
                    tile = tileIn(cell, plan.room ?? 0.6);
                }
                if (!tile) {
                    continue;
                }
                if (plan.kind === "brazier") {
                    lit.add(cell!);
                }
                const data =
                    plan.kind === "search" || plan.kind === "corpse"
                        ? Math.floor(this.rng() * 3)
                        : plan.kind === "vein"
                          ? weighed()
                          : plan.kind === "shrine"
                            ? Math.floor(this.rng() * SHRINE_TRADES.length)
                            : plan.kind === "armour"
                              ? this.rng() < 1 / ARMOUR_ONE_IN
                                  ? 1
                                  : 0
                              : 0;
                this.props.push(this.makeProp(plan.kind, tile, data));
            }
        }
        // A passage's two ends, and each mine cart line's (version 172), the
        // farthest apart of a few pairs of rooms
        const free = rooms.filter((c) => !busy.has(c));
        const pairUp = (kind: PropKind): boolean => {
            const plan = PROP_PLANS.find((p) => p.kind === kind)!;
            let ends: [number, number] | undefined;
            let apart = 0;
            for (let i = 0; i < 24 && free.length > 1; i++) {
                const a = pick(free)!;
                const b = pick(free)!;
                const d = Math.hypot((a % cave.cellsX) - (b % cave.cellsX), Math.floor(a / cave.cellsX) - Math.floor(b / cave.cellsX));
                if (d > apart) {
                    apart = d;
                    ends = [a, b];
                }
            }
            const a = ends ? tileIn(ends[0], plan.room) : undefined;
            const b = ends ? tileIn(ends[1], plan.room) : undefined;
            if (!a || !b) {
                return false;
            }
            const first = this.props.length;
            this.props.push(this.makeProp(kind, a, first + 1), this.makeProp(kind, b, first));
            return true;
        };
        // (no passage, no lever for it)
        if ((castle ? PROP_PLANS.find((p) => p.kind === "passage")!.castle : 1) > 0 && !pairUp("passage")) {
            this.props = this.props.filter((p) => p.kind !== "lever");
        }
        const carts = PROP_PLANS.find((p) => p.kind === "cart")!;
        for (let i = 0; i < (castle ? carts.castle : carts.caves) / 2; i++) {
            pairUp("cart");
        }
        // Version 179: a strongbox at the end of the dead ends, each behind a
        // web (the Depths) or a gate (the castle) across its one doorway;
        // the castle's gates left over on the doorways of rooms deeper in
        const planned = (kind: PropKind) => {
            const plan = PROP_PLANS.find((p) => p.kind === kind)!;
            return castle ? plan.castle : plan.caves;
        };
        const shuffled = (list: number[]) => list.map((cell) => ({ cell, roll: this.rng() })).sort((a, b) => a.roll - b.roll).map((c) => c.cell);
        const beyond = (cell: number, door: number) => {
            const dx = door === DOOR_EAST ? 1 : door === DOOR_WEST ? -1 : 0;
            const dy = door === DOOR_NORTH ? 1 : door === DOOR_SOUTH ? -1 : 0;
            return cell + dx + dy * cave.cellsX;
        };
        const barred = new Set<string>();
        const across = (kind: PropKind, cell: number, door: number): boolean => {
            const far = beyond(cell, door);
            const key = `${Math.min(cell, far)}-${Math.max(cell, far)}`;
            if (busy.has(far) || barred.has(key)) {
                return false;
            }
            barred.add(key);
            const at = cave.doorAt(cell, door);
            this.props.push({ kind, x: at.x, z: at.z, rotation: at.rotation, uses: 1, data: cell * 16 + door });
            return true;
        };
        let boxes = planned("strongbox");
        let doors = planned(castle ? "gate" : "web");
        for (const cell of shuffled(free.filter((c) => DOOR_BITS.includes(cave.doors[c])))) {
            if (boxes <= 0 && doors <= 0) {
                break;
            }
            const tile = boxes > 0 ? tileIn(cell, PROP_PLANS.find((p) => p.kind === "strongbox")!.room) : undefined;
            if (tile) {
                boxes--;
                this.props.push(this.makeProp("strongbox", tile, 0));
            }
            if (doors > 0 && across(castle ? "gate" : "web", cell, cave.doors[cell])) {
                doors--;
            }
        }
        if (castle) {
            for (const cell of shuffled(free.filter((c) => cave.depth[c] >= 2 && !DOOR_BITS.includes(cave.doors[c])))) {
                if (doors <= 0) {
                    break;
                }
                const door = pick(DOOR_BITS.filter((bit) => (cave.doors[cell] & bit) !== 0));
                if (door !== undefined && across("gate", cell, door)) {
                    doors--;
                }
            }
        }
        // The library's books, each a different one; the lectern names the
        // one the vault's behind
        const books = [...BOOKS.keys()].sort(() => this.rng() - 0.5);
        const shelves = this.props.filter((p) => p.kind === "bookcase");
        shelves.forEach((p, i) => (p.data = books[i % books.length]));
        for (const lectern of this.props.filter((p) => p.kind === "lectern")) {
            lectern.data = shelves.length > 0 ? pick(shelves)!.data : -1;
        }
        // The weakest third of the map's kinds keep out of a lit room
        const kinds = this.world.enemies;
        this.weakHp = kinds.length > 0 ? kinds[Math.floor((kinds.length - 1) * LIT_WEAK_SHARE)].def.hp : 0;
        for (const p of this.props) {
            this.propPlaced(p);
            jobs.push(this.loadProp(p));
        }
    }

    // A thing laid out (the host's, or the guest's from the host's word):
    // a web's doorway blocked from the start (version 179)
    private propPlaced(p: Prop): void {
        if (p.kind === "web" || (p.kind === "gate" && p.on)) {
            this.sealDoor(p, true);
        }
    }

    // A web's or gate's doorway blocked or opened again: the row of tiles
    // on the room's edge (what it blocked, kept: the tiles read as solid
    // once it's shut)
    private readonly doorSeals = new Map<Prop, number[]>();

    private sealDoor(p: Prop, on: boolean): void {
        const cave = this.cave;
        if (!cave) {
            return;
        }
        const tiles = on ? cave.doorway(Math.floor(p.data / 16), p.data % 16, 1) : (this.doorSeals.get(p) ?? []);
        for (const i of tiles) {
            this.region.setSolid(i, on);
        }
        if (on) {
            this.doorSeals.set(p, tiles);
        } else {
            this.doorSeals.delete(p);
        }
    }

    // Whether a gate can come down: nobody and nothing standing in it
    private doorClear(p: Prop): boolean {
        const cave = this.cave;
        if (!cave) {
            return false;
        }
        const tiles = cave.doorway(Math.floor(p.data / 16), p.data % 16, 1).map((i) => this.region.centreOf(i));
        const inWay = (x: number, z: number, radius: number) => tiles.some((t) => Math.hypot(t.x - x, t.z - z) < GATE_CLEAR + radius);
        return !this.heroes().some((h) => !h.dead && inWay(h.x, h.z, PLAYER_RADIUS)) && !this.enemies.some((e) => e.state !== "dead" && inWay(e.x, e.z, e.def.radius));
    }

    private makeProp(kind: PropKind, tile: Tile, data: number): Prop {
        const uses =
            kind === "vein"
                ? VEIN_LOADS
                : kind === "pool"
                  ? POOL_EELS
                  : kind === "font"
                    ? FONT_VIALS
                    : kind === "banquet"
                      ? BANQUET_BITES
                      : kind === "fungus"
                        ? FUNGUS_BITES
                        : kind === "herbs"
                          ? HERBS_PICKS
                          : 1;
        return { kind, x: tile.x, z: tile.z, rotation: Math.floor(this.rng() * 4) * (Math.PI / 2), uses, data };
    }

    // A thing's model: its kind's, its look's, a brazier's lit or cold
    private propLoc(p: Prop): number | undefined {
        const castle = this.world.id === CASTLE_ID;
        switch (p.kind) {
            case "barrel":
                return BARREL_LOC;
            case "search":
                return (castle ? SEARCH_LOCS.castle : SEARCH_LOCS.caves)[p.data];
            case "brazier":
                return p.on ? BRAZIER_LIT_LOC : BRAZIER_LOC;
            case "lever":
                return LEVER_LOC;
            case "passage":
                return castle ? PASSAGE_LOCS.castle : PASSAGE_LOCS.caves;
            case "shrine":
                return SHRINE_LOC;
            case "corpse":
                return CORPSE_LOCS[p.data];
            case "vein":
                return VEINS[p.data].loc;
            case "pool":
                return undefined;
            case "crack":
                return CRACK_LOC;
            case "ladder":
                return LADDER_LOC;
            case "portrait":
                return PORTRAIT_LOC;
            case "bookcase":
                return BOOKCASE_LOC;
            case "lectern":
                return LECTERN_LOC;
            case "armour":
                return ARMOUR_LOC;
            case "font":
                return FONT_LOC;
            case "cell":
                return CELL_LOC;
            case "banquet":
                return BANQUET_LOC;
            case "trap":
                return TRAP_LOC;
            case "fungus":
                return FUNGUS_LOC;
            case "cart":
                return CART_LOC;
            case "herbs":
                return HERBS_LOC;
            case "alchemy":
                return ALCHEMY_LOC;
            case "rack":
                return RACK_LOC;
            case "bell":
                return BELL_LOC;
            case "throne":
                return THRONE_LOC;
            // Version 179's
            case "strongbox":
                return STRONGBOX_LOC;
            case "web":
                return WEB_LOC;
            case "gate":
                return GATE_LOC;
            case "anvil":
                return ANVIL_LOC;
            case "vent":
                return undefined;
            case "well":
                return WELL_LOC;
            case "coffin":
                return COFFIN_LOC;
        }
    }

    private async loadProp(p: Prop): Promise<void> {
        if (p.kind === "pool") {
            this.drawPool(p);
            return;
        }
        if (p.kind === "vent") {
            this.drawVent(p);
            return;
        }
        const loc = this.propLoc(p);
        if (loc === undefined) {
            return;
        }
        const load = (p.loads = (p.loads ?? 0) + 1);
        const actor = await createActor("locs", loc);
        if (this.ended || p.gone || load !== p.loads) {
            return;
        }
        if (p.actor) {
            this.scene.remove(p.actor.root);
        }
        this.placeActor(actor, p.x, p.z, p.rotation, p.kind === "cell" ? CELL_SCALE : p.kind === "lever" ? 1.4 : p.kind === "strongbox" ? 0.9 : 1);
        // A web and a gate fitted to the doorway's width (version 179: the
        // web's model is a tile wide, the portcullis five)
        if (p.kind === "web") {
            actor.root.scale.set(4, 1.3, 1);
        } else if (p.kind === "gate") {
            actor.root.scale.set(0.8, 0.8, 2);
        }
        // (none under what's flat on the floor: a trapdoor, a hole, a trap,
        // which is hidden till it's near: updateHaunts; nor under a web or
        // a gate)
        const flat = p.kind === "ladder" || p.kind === "trap" || p.kind === "web" || p.kind === "gate" || (p.kind === "passage" && this.world.id === CASTLE_ID);
        if (p.kind === "trap") {
            actor.root.visible = !!p.on;
        }
        if (!flat) {
            addShadow(actor.root, p.kind === "banquet" ? 1.6 : p.kind === "passage" ? 1.2 : 0.6);
        }
        p.actor = actor;
        this.refreshProp(p);
        // The prisoner in the cage
        if (p.kind === "cell" && !p.extra) {
            p.extra = {};
            const prisoner = await createActor("npcs", PRISONER_NPC);
            if (this.ended || p.gone) {
                return;
            }
            this.placeActor(prisoner, p.x, p.z, p.rotation);
            prisoner.root.position.y = this.groundY(p.x, p.z) + 0.1;
            play(prisoner, "idle");
            p.extra.actor = prisoner;
        }
    }

    // A pool: still, dark water a couple of tiles across
    private drawPool(p: Prop): void {
        if (!this.poolDisc) {
            this.poolDisc = new THREE.CircleGeometry(1.3, 24);
            this.poolWater = new THREE.MeshBasicMaterial({ color: 0x0e2f4a, transparent: true, opacity: 0.85, depthWrite: false });
            this.disposables.push(this.poolDisc, this.poolWater);
        }
        const mesh = new THREE.Mesh(this.poolDisc, this.poolWater);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(p.x, this.groundY(p.x, p.z) + 0.06, p.z);
        this.scene.add(mesh);
        p.extra = { mesh };
    }

    // A steam vent (version 179): a dark crack in the floor with a red
    // glow at its heart
    private drawVent(p: Prop): void {
        if (!this.ventDisc) {
            this.ventDisc = new THREE.CircleGeometry(1, 20);
            this.ventCrust = new THREE.MeshBasicMaterial({ color: 0x241410, transparent: true, opacity: 0.9, depthWrite: false });
            this.ventGlow = new THREE.MeshBasicMaterial({ color: 0xff5a22, transparent: true, opacity: 0.7, depthWrite: false });
            this.disposables.push(this.ventDisc, this.ventCrust, this.ventGlow);
        }
        const mesh = new THREE.Mesh(this.ventDisc, this.ventCrust);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(p.x, this.groundY(p.x, p.z) + 0.06, p.z);
        const glow = new THREE.Mesh(this.ventDisc, this.ventGlow);
        glow.scale.setScalar(0.35);
        glow.position.z = 0.01;
        mesh.add(glow);
        this.scene.add(mesh);
        p.extra = { mesh };
    }

    private ventDisc?: THREE.CircleGeometry;
    private ventCrust?: THREE.MeshBasicMaterial;
    private ventGlow?: THREE.MeshBasicMaterial;
    // When each vent blows next (the host's)
    private readonly ventsAt = new Map<Prop, number>();

    // A vent blowing: a warning ring, then steam that scalds whoever's on
    // it, hero or monster
    private blowVent(p: Prop): void {
        const steam: EnemyDef = { ...this.world.enemies[0].def, name: "The scalding steam" };
        const hit = Math.round(VENT_HIT * Math.pow(1.8, this.world.tier - 1));
        this.hazard(
            p.x,
            p.z,
            VENT_RADIUS,
            VENT_WARN,
            (h) => this.hurtHero(h, steam, 0, "melee", true, Math.max(1, Math.round(h.maxHp * VENT_HURT))),
            () => {
                for (const e of [...this.enemies]) {
                    if (e.state !== "dead" && Math.hypot(e.x - p.x, e.z - p.z) <= VENT_RADIUS + e.def.radius) {
                        this.damageEnemy(e, hit);
                    }
                }
            },
        );
    }

    // A thing's colour for what's left of it: a spent one dulled, the dark
    // ones darker
    private refreshProp(p: Prop): void {
        if (!p.actor) {
            return;
        }
        const spent =
            (p.kind === "vein" ||
                p.kind === "search" ||
                p.kind === "corpse" ||
                p.kind === "barrel" ||
                p.kind === "banquet" ||
                p.kind === "strongbox" ||
                p.kind === "coffin") &&
            p.uses <= 0;
        const own =
            p.kind === "passage" && this.world.id !== CASTLE_ID
                ? new THREE.Color(0.32, 0.3, 0.29)
                : p.kind === "crack"
                  ? new THREE.Color(0.6, 0.56, 0.54)
                  : p.kind === "bookcase"
                    ? new THREE.Color(0.85, 0.8, 0.75)
                    : p.kind === "strongbox"
                      ? new THREE.Color(0.5, 0.55, 0.68)
                      : p.kind === "gate"
                        ? new THREE.Color(0.55, 0.55, 0.6)
                        : WHITE;
        tint(p.actor, spent ? own.clone().multiplyScalar(p.kind === "vein" ? 0.45 : 0.65) : own);
        // A gate hangs raised over its doorway till it's dropped
        if (p.kind === "gate") {
            p.actor.root.position.y = this.region.topAt(p.x, p.z) + (p.on ? 0 : GATE_RAISED);
        }
    }

    private removeProp(p: Prop): void {
        p.gone = true;
        // (a web cut: the way's open)
        if (this.doorSeals.has(p)) {
            this.sealDoor(p, false);
        }
        if (p.actor) {
            this.scene.remove(p.actor.root);
        }
        if (p.extra?.actor) {
            this.scene.remove(p.extra.actor.root);
        }
        if (p.extra?.mesh) {
            this.scene.remove(p.extra.mesh);
        }
    }

    // How far out from its middle a thing reaches (the big ones)
    private propSize(p: Prop): number {
        switch (p.kind) {
            case "banquet":
                return 1.2;
            case "pool":
            case "gate":
                return 1;
            case "passage":
            case "vent":
                return 0.8;
            case "cell":
            case "coffin":
            case "well":
                return 0.6;
            case "corpse":
            case "web":
                return 0.4;
            default:
                return 0;
        }
    }

    // Its dot on the map, once its spot's been seen (a passage's once the
    // lever's pulled), grey when it's spent
    private propDot(p: Prop): string | undefined {
        const colour = PROP_DOTS[p.kind];
        // (a passage once open, the bell once rung and the king's throne once
        // he wakes, wherever they are: version 172)
        if (!colour || p.gone || !(this.isExplored(p.x, p.z) || (p.on && (p.kind === "passage" || p.kind === "bell" || p.kind === "throne")))) {
            return undefined;
        }
        if (p.kind === "brazier") {
            return p.on ? colour : "#8a6a4a";
        }
        const spent =
            p.kind === "lever"
                ? p.on
                : p.kind === "shrine" || p.kind === "portrait" || p.kind === "anvil" || p.kind === "well"
                  ? p.mine
                  : p.kind === "font"
                    ? p.mine || p.uses <= 0
                    : p.kind === "pool"
                      ? p.mine && p.uses <= 0
                      : p.kind === "passage" || p.kind === "lectern" || p.kind === "gate" || p.kind === "vent"
                        ? false
                        : p.uses <= 0;
        return spent ? "#8a8a8a" : colour;
    }

    // What's said of the nearest thing, and what E does there: a tap, a hold
    // of so long, both (a barrel, a pool), or neither
    private propActions(p: Prop): { prompt: string; tap?: boolean; hold?: { seconds: number; doing: string } } {
        const castle = this.world.id === CASTLE_ID;
        const searched = p.uses <= 0;
        switch (p.kind) {
            case "barrel":
                if (p.on) {
                    return { prompt: "The fuse is burning! Run!" };
                }
                return searched
                    ? { prompt: "An empty oil barrel." }
                    : {
                          prompt: `Press E to fill ${BARREL_OIL} cans of oil from the barrel · hold E to light its fuse and run`,
                          tap: true,
                          hold: { seconds: BARREL_HOLD, doing: "Lighting the fuse" },
                      };
            case "search": {
                const name = (castle ? SEARCH_NAMES.castle : SEARCH_NAMES.caves)[p.data];
                return searched
                    ? { prompt: `You've searched this ${name}.` }
                    : { prompt: `Hold E to search the ${name} (anything near can catch you at it)`, hold: { seconds: SEARCH_HOLD, doing: `Searching the ${name}` } };
            }
            case "brazier":
                if (p.on) {
                    return { prompt: "The brazier burns bright: nothing weak comes in here." };
                }
                return this.lanternLit
                    ? { prompt: "Press E to light the brazier from your lantern: the room stays lit, and the weakest things keep out", tap: true }
                    : { prompt: "A cold brazier. A lit lantern would light it." };
            case "lever":
                return p.on ? { prompt: "The lever's been pulled." } : { prompt: "Press E to pull the lever", tap: true };
            case "passage":
                return p.on
                    ? { prompt: castle ? "Press E to go down the trapdoor, to the passage's far end" : "Press E to crawl through the passage to its far end", tap: true }
                    : { prompt: `A sealed ${castle ? "trapdoor" : "passage"}. A lever somewhere opens it.` };
            case "shrine": {
                if (p.mine) {
                    return { prompt: "The shrine has nothing more for you." };
                }
                const [ask, give] = this.shrineTerms(SHRINE_TRADES[p.data]);
                return { prompt: `Press E to make the shrine's trade: ${ask}, for ${give}`, tap: true };
            }
            case "corpse":
                return searched
                    ? { prompt: "Picked clean." }
                    : { prompt: "Hold E to search the dead adventurer", hold: { seconds: CORPSE_HOLD, doing: "Searching the body" } };
            case "vein":
                return searched
                    ? { prompt: "The vein's worked out." }
                    : {
                          prompt: `Hold E to mine the ${VEINS[p.data].name} rocks (${p.uses} left; the noise carries)`,
                          hold: { seconds: VEIN_HOLD, doing: "Mining" },
                      };
            case "pool": {
                const drink = !p.mine;
                const fish = p.uses > 0;
                if (!drink && !fish) {
                    return { prompt: "A still, dark pool, fished out." };
                }
                const eels = `${p.uses} eel${p.uses === 1 ? "" : "s"} left`;
                return {
                    prompt: drink && fish ? `Press E to drink · hold E to fish (${eels})` : drink ? "Press E to drink from the pool" : `Hold E to fish (${eels})`,
                    tap: drink,
                    hold: fish ? { seconds: POOL_HOLD, doing: "Fishing" } : undefined,
                };
            }
            case "crack":
                return { prompt: "A cracked rock face, hollow behind. Hold E to break through (loud)", hold: { seconds: CRACK_HOLD, doing: "Breaking through" } };
            case "ladder":
                return searched
                    ? { prompt: "The rope's snapped." }
                    : { prompt: "Press E to climb down the rope ladder: one way, and who knows where it comes out", tap: true };
            case "portrait":
                return p.mine ? { prompt: "You've studied the portraits." } : { prompt: "Press E to study the portraits of the castle's lords", tap: true };
            case "bookcase":
                return searched ? { prompt: "Just books." } : { prompt: `Press E to pull out "${BOOKS[p.data]}"`, tap: true };
            case "lectern":
                return { prompt: "Press E to read the open prayer book", tap: true };
            case "armour":
                return { prompt: "An old suit of armour, rusted stiff." };
            case "font":
                return p.mine || p.uses <= 0
                    ? { prompt: p.uses <= 0 ? "The font is dry." : "You've had your vial from the font." }
                    : { prompt: "Press E to fill a vial with holy water", tap: true };
            case "cell":
                return { prompt: "Press E to free the prisoner from the stocks (he may not thank you)", tap: true };
            case "banquet":
                if (searched) {
                    return { prompt: "Nothing left of the banquet but bones." };
                }
                return this.eatIn > 0
                    ? { prompt: "You're still chewing." }
                    : { prompt: `Press E to eat from the banquet (${p.uses} bite${p.uses === 1 ? "" : "s"} left; some of it's gone bad)`, tap: true };
            // Version 172's
            case "trap":
                return { prompt: p.actor?.root.visible ? (p.uses > 0 ? "A spike trap. Step round it, or lead something onto it." : "A spike trap, sprung. It'll set itself again.") : "" };
            case "fungus":
                return searched
                    ? { prompt: "Picked bare." }
                    : {
                          prompt: "Press E to eat the glowing fungus · hold E to pick some for brewing",
                          tap: true,
                          hold: { seconds: FUNGUS_HOLD, doing: "Picking fungus" },
                      };
            case "cart":
                return { prompt: "Press E to ride the mine cart to the end of its line (loud)", tap: true };
            case "herbs":
                return searched
                    ? { prompt: "Picked bare." }
                    : { prompt: "Hold E to pick herbs (the alchemy tables brew them)", hold: { seconds: HERBS_HOLD, doing: "Picking herbs" } };
            case "alchemy": {
                const have = this.inventory.filter((s) => getItem(s.id).ingredient).reduce((n, s) => n + s.count, 0);
                return have >= 2
                    ? { prompt: "Press E to brew a potion from two of your herbs and fungus", tap: true }
                    : { prompt: "An alchemy table. Two herbs or fungus would brew a potion." };
            }
            case "rack":
                return p.mine ? { prompt: "You've had a weapon off this rack." } : { prompt: "Press E to borrow a weapon from the rack (this run only)", tap: true };
            case "bell":
                return searched ? { prompt: "The bell's still humming." } : { prompt: "Press E to ring the bell: everything in the castle comes to it", tap: true };
            case "throne":
                return { prompt: this.kingWoke || p.on ? "The Forgotten King's throne." : "An empty throne, cold as a grave. Something sleeps under the castle." };
            // Version 179's
            case "strongbox":
                return searched
                    ? { prompt: "The strongbox, forced and empty." }
                    : { prompt: "Hold E to force the strongbox (loud)", hold: { seconds: STRONGBOX_HOLD, doing: "Forcing the lock" } };
            case "web":
                return { prompt: "A thick web across the doorway. Hold E to cut through it", hold: { seconds: WEB_HOLD, doing: "Cutting the web" } };
            case "gate":
                return p.on
                    ? { prompt: "Press E to raise the gate", tap: true }
                    : { prompt: "Press E to drop the gate across the doorway: nothing gets through till it's raised", tap: true };
            case "anvil": {
                if (p.mine) {
                    return { prompt: "You've mended your armour here." };
                }
                return this.wornPieces().length > 0
                    ? { prompt: "Hold E to hammer the dents out of your armour (loud)", hold: { seconds: ANVIL_HOLD, doing: "Hammering" } }
                    : { prompt: "An anvil. Nothing you wear needs mending." };
            }
            case "vent":
                return { prompt: "A steam vent. It blows every so often: stand clear, or lead something onto it." };
            case "well":
                return p.mine ? { prompt: "You've drunk from the well." } : { prompt: "Press E to draw a bucket from the well", tap: true };
            case "coffin":
                return searched
                    ? { prompt: "An open coffin, empty." }
                    : { prompt: "Hold E to open the coffin (who knows what was laid in it)", hold: { seconds: COFFIN_HOLD, doing: "Shifting the lid" } };
        }
    }

    // The armour this player wears that's worn at all (version 179: the
    // anvil mends it)
    private wornPieces(): number[] {
        const worn: number[] = [];
        for (const slot of SLOTS) {
            const id = this.equipment[slot];
            if (slot !== "weapon" && id !== undefined && getItem(id).defence && wearOf(this.wear, id) > 0) {
                worn.push(id);
            }
        }
        return worn;
    }

    // What the shrine asks, and what it gives
    private shrineTerms(trade: (typeof SHRINE_TRADES)[number]): [string, string] {
        const lairs = this.world.id === CASTLE_ID ? "every lord's hall" : "every boss's lair";
        switch (trade) {
            case "blood":
                return ["half your hitpoints", "a fifth harder hits for the rest of the run"];
            case "gold":
                return ["half the coins you carry", "a piece of gear"];
            case "prayer":
                return ["your whole prayer bar", `${lairs} shown on your map`];
            case "flesh":
                return ["all the food you carry", `${SHRINE_DEFENCE} more defence for the rest of the run`];
        }
    }

    // The nearest thing in reach: its prompt, and E on it. True when E's
    // taken here (a thing with nothing to do only says so, and lets a chest
    // beside it have E).
    private propInteraction(dt: number, pressed: boolean): boolean {
        let p: Prop | undefined;
        let best = PROP_REACH;
        for (const q of this.props) {
            // (a spike trap's nothing to use: version 172)
            if (q.gone || q.kind === "trap") {
                continue;
            }
            const d = Math.hypot(q.x - this.px, q.z - this.pz) - this.propSize(q);
            if (d < best) {
                p = q;
                best = d;
            }
        }
        if (!p) {
            this.holdProp = undefined;
            this.holdFor = 0;
            return false;
        }
        const act = this.propActions(p);
        if (!act.tap && !act.hold) {
            this.prompt = act.prompt;
            this.holdFor = 0;
            return false;
        }
        if (this.holdProp !== p) {
            this.holdProp = p;
            this.holdFor = 0;
        }
        if (pressed) {
            if (this.holdFor === 0) {
                this.holdFrom = this.time;
            }
            // A hit breaks a hold: start again
            if (act.hold && this.lastStruck > this.holdFrom) {
                this.holdFor = 0;
                this.keys.delete("KeyE");
                this.hooks.onMessage("You're hit, and lose your grip on it.");
                this.prompt = act.prompt;
                return true;
            }
            this.holdFor += dt;
            if (!act.hold) {
                this.keys.delete("KeyE");
                this.holdFor = 0;
                this.useProp(p, false);
                return true;
            }
            if (this.holdFor >= act.hold.seconds) {
                this.keys.delete("KeyE");
                this.holdFor = 0;
                this.useProp(p, true);
                return true;
            }
            if (this.holdFor > PROP_TAP || !act.tap) {
                if (this.swingIn < 0) {
                    this.player.play("idle");
                }
                this.prompt = `${act.hold.doing}... ${Math.max(0, act.hold.seconds - this.holdFor).toFixed(1)}s`;
                return true;
            }
            this.prompt = act.prompt;
            return true;
        }
        // Let go soon enough: a tap
        if (act.tap && this.holdFor > 0 && this.holdFor <= PROP_TAP) {
            this.holdFor = 0;
            this.useProp(p, false);
            return true;
        }
        this.holdFor = 0;
        this.prompt = act.prompt;
        return true;
    }

    // E on a thing: this player's own part of it here, then the map's (the
    // host's, asked by a guest)
    private useProp(p: Prop, hold: boolean): void {
        if (!this.propSelf(p, hold) || !this.propReady(p, hold)) {
            return;
        }
        if (this.coop?.role === "guest") {
            this.coop.send({ k: "use", i: this.props.indexOf(p), a: hold ? 1 : 0 } satisfies UpMessage);
        } else {
            this.propWorld(p, this.self, hold);
        }
    }

    // Whether the map has a part in it still: the host's check (a guest's
    // ask can come after someone else took the last of it)
    private propReady(p: Prop, hold: boolean): boolean {
        if (p.gone) {
            return false;
        }
        switch (p.kind) {
            case "barrel":
                return p.uses > 0 && !p.on;
            case "brazier":
            case "lever":
                return !p.on;
            case "shrine":
                return SHRINE_TRADES[p.data] === "gold";
            case "pool":
                return hold && p.uses > 0;
            case "passage":
            case "portrait":
            case "lectern":
            case "armour":
            case "rack":
            case "trap":
            case "throne":
            case "vent":
            case "well":
                return false;
            case "cart":
            case "alchemy":
            case "gate":
            case "anvil":
                return true;
            default:
                return p.uses > 0;
        }
    }

    // This player's own part: what they drink, eat, trade, read or climb;
    // false if nothing comes of it
    private propSelf(p: Prop, hold: boolean): boolean {
        const say = (text: string) => this.hooks.onMessage(text);
        switch (p.kind) {
            case "barrel":
                say(hold ? "You light the barrel's fuse. Run!" : `You fill ${BARREL_OIL} cans of oil from the barrel.`);
                return true;
            case "brazier":
                return this.lanternLit;
            case "passage": {
                const far = this.props[p.data];
                if (!far) {
                    return false;
                }
                this.moveSelfNear(far.x, far.z);
                say(this.world.id === CASTLE_ID ? "You climb down the trapdoor, along a dark passage and up through another." : "You crawl through the passage and out its far end.");
                return false;
            }
            case "shrine":
                return this.shrineTrade(p);
            case "pool":
                if (hold) {
                    return true;
                }
                p.mine = true;
                this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * POOL_HEAL));
                {
                    const roll = this.rng();
                    if (roll < POOL_FOUL) {
                        say("The water tastes foul.");
                        this.poison();
                    } else if (roll < POOL_FOUL + POOL_CLEAN) {
                        this.poisonTicks = 0;
                        say("The water's cold and clean, and settles any poison in you.");
                    } else {
                        say("The water's cold, and does you good.");
                    }
                }
                this.hooks.onChanged();
                return false;
            case "ladder":
                return this.climbDown();
            case "portrait":
                this.studyPortraits();
                return false;
            case "lectern":
                say(
                    p.data >= 0
                        ? `A prayer book lies open on the lectern, one line underlined: "What the faithful keep, they keep behind ${BOOKS[p.data]}."`
                        : "A prayer book lies open on the lectern, its pages torn out.",
                );
                return false;
            case "font":
                p.mine = true;
                say("You fill a vial with holy water at the font.");
                return true;
            case "banquet":
                this.eatIn = EAT_DELAY;
                this.hp = Math.min(this.maxHp, this.hp + BANQUET_HEAL);
                if (this.rng() < BANQUET_POISON) {
                    say("You eat from the banquet. Something in it had gone bad.");
                    this.poison();
                } else {
                    say("You eat from the banquet. It's cold, but it's good.");
                }
                this.hooks.onChanged();
                return true;
            // Version 172's
            case "fungus":
                if (!hold) {
                    this.eatFungus();
                }
                return true;
            case "cart":
                return this.rideCart(p);
            case "alchemy":
                return this.brew();
            case "rack":
                this.borrowWeapon(p);
                return false;
            // Version 179's
            case "anvil": {
                const worn = this.wornPieces();
                if (p.mine || worn.length === 0) {
                    return false;
                }
                for (const id of worn) {
                    this.wear[id] = 0;
                }
                p.mine = true;
                this.applyStats();
                this.hooks.onChanged();
                say(`You hammer the dents out of your ${worn.map((id) => getItem(id).name.toLowerCase()).join(", ")}: good as new. The ringing carries.`);
                return true;
            }
            case "well":
                p.mine = true;
                this.poisonTicks = 0;
                this.prayer = Math.min(100, this.prayer + WELL_PRAYER);
                say("You draw a bucket from the well: cold, clean water. It settles any poison in you and steadies your prayers.");
                this.hooks.onChanged();
                return false;
            default:
                return true;
        }
    }

    // The shrine's trade, paid and given here (the gold's gear is the map's:
    // propWorld); false if this player can't pay
    private shrineTrade(p: Prop): boolean {
        const trade = SHRINE_TRADES[p.data];
        const say = (text: string) => this.hooks.onMessage(text);
        switch (trade) {
            case "blood":
                if (this.hp < 10) {
                    say("You're too weak to give the shrine blood.");
                    return false;
                }
                this.hp = Math.ceil(this.hp / 2);
                this.shrineGifts.add("blood");
                this.applyStats();
                say("The shrine drinks half your blood. Your arms burn with its strength.");
                break;
            case "gold":
                if (this.coins < 100) {
                    say("The shrine wants more gold than you carry.");
                    return false;
                }
                this.coins -= Math.floor(this.coins / 2);
                say("The shrine takes half your coins, and gives something back.");
                break;
            case "prayer":
                if (this.prayer < 50) {
                    say("The shrine wants a fuller prayer bar than yours.");
                    return false;
                }
                this.prayer = 0;
                this.lairsShown = true;
                say(`The shrine drains your prayer, and shows you ${this.world.id === CASTLE_ID ? "every lord's hall" : "every boss's lair"}: they're on your map.`);
                break;
            case "flesh": {
                const food = this.inventory.filter((s) => getItem(s.id).heal);
                if (food.length === 0) {
                    say("The shrine wants food, and you carry none.");
                    return false;
                }
                for (const s of food) {
                    removeItem(this.inventory, s.id, s.count);
                }
                this.shrineGifts.add("flesh");
                this.applyStats();
                say("The shrine takes all your food. Your skin hardens like bark.");
                break;
            }
        }
        p.mine = true;
        this.hooks.onChanged();
        return true;
    }

    // The portraits: every lord still holding court, and where
    private studyPortraits(): void {
        for (const p of this.props) {
            if (p.kind === "portrait") {
                p.mine = true;
            }
        }
        this.lairsShown = true;
        const lords = this.enemies.filter((e) => e.def.boss && e.state !== "dead");
        this.hooks.onMessage(
            lords.length > 0
                ? `The portraits show the lords still holding court: ${lords
                      .map((e) => `${e.def.name}, ${Math.round(Math.hypot(e.x - this.px, e.z - this.pz))} tiles to the ${this.compassTo(e.x, e.z)}`)
                      .join("; ")}. Their halls are on your map now.`
                : "Every lord in the portraits has fallen.",
        );
    }

    // A rope ladder down: somewhere a long walk off, never a living boss's
    // lair, and a hard landing
    private climbDown(): boolean {
        const g = this.region;
        const cave = this.cave;
        const flow = g.flowField({ x: this.px, z: this.pz });
        const lairs = new Set(this.enemies.filter((e) => e.def.boss && e.state !== "dead").map((e) => cave?.cellAt(e.x, e.z)));
        for (let tries = 0; tries < 400; tries++) {
            const x = g.baseX + Math.floor(this.rng() * g.sizeX) + 0.5;
            const z = -(g.baseY + Math.floor(this.rng() * g.sizeY) + 0.5);
            if (g.flowAt(flow, x, z) >= LADDER_STEPS && g.fits(x, z, 0.4) && !lairs.has(cave?.cellAt(x, z))) {
                const far = Math.round(Math.hypot(x - this.px, z - this.pz));
                const way = this.compassTo(x, z);
                this.moveSelfNear(x, z);
                this.rooted = Math.max(this.rooted, LADDER_HELD);
                this.hp = Math.max(1, this.hp - Math.max(1, Math.round(this.maxHp * LADDER_HURT)));
                this.lastHurt = this.time;
                this.hooks.onMessage(`You climb down into the dark, and the rope snaps under you. You land hard, ${far} tiles ${way} of where you went down.`);
                this.hooks.onChanged();
                return true;
            }
        }
        this.hooks.onMessage("The rope ladder hangs over nothing you'd want to drop into.");
        return false;
    }

    // This player put down beside a spot, where there's room
    private moveSelfNear(x: number, z: number): void {
        let at = { x, z };
        for (const [ox, oz] of [
            [1.3, 0],
            [-1.3, 0],
            [0, 1.3],
            [0, -1.3],
            [0, 0],
        ]) {
            if (this.region.fits(x + ox, z + oz, 0.3)) {
                at = { x: x + ox, z: z + oz };
                break;
            }
        }
        this.px = at.x;
        this.pz = at.z;
        this.player.root.position.set(at.x, this.groundY(at.x, at.z), at.z);
        this.exploredTile = -1;
    }

    // The map's part: what's left of it, what drops, what wakes, what
    // everyone sees. The host's (by is whoever used it).
    private propWorld(p: Prop, by: Hero, hold: boolean): void {
        const tier = this.world.tier;
        const purse = (min: number, max: number) => Math.round(randInt(this.rng, min, max) * Math.pow(2.2, tier - 1) * this.threat.coins);
        const give = (id: number, count: number) => this.dropPickup(id, count, by.x, by.z, 0.5);
        const potion = () => SHOP_POTIONS[Math.floor(this.rng() * SHOP_POTIONS.length)];
        const food = () => FOOD_BY_TIER[Math.min(FOOD_BY_TIER.length - 1, tier - 1)];
        switch (p.kind) {
            case "barrel":
                p.uses = 0;
                if (!hold) {
                    give(OIL_CAN, BARREL_OIL);
                    this.sendProp(p);
                    return;
                }
                p.on = true;
                this.sendProp(p);
                this.lightFuse(p, by);
                return;
            case "search": {
                p.uses = 0;
                this.sendProp(p);
                const roll = this.rng();
                if (!this.clueDropped && roll < 0.03) {
                    this.clueDropped = true;
                    give(CLUE_SCROLL, 1);
                } else if (roll < 0.45) {
                    this.tell(by, "Nothing but dust and cobwebs.");
                    return;
                } else if (roll < 0.65) {
                    give(COINS, purse(20, 60));
                } else if (roll < 0.8) {
                    give(food(), 1);
                } else if (roll < 0.88) {
                    give(OIL_CAN, 1);
                } else if (roll < 0.95) {
                    if (this.rng() < 0.5) {
                        give(ammoOfTier("arrows", tier, this.rng()), randInt(this.rng, 5, 10));
                    } else {
                        const runes = runeDrop(tier, this.rng(), this.rng(), (lo, hi) => randInt(this.rng, lo, hi));
                        give(runes.id, runes.count);
                    }
                } else {
                    give(potion(), 1);
                }
                this.tell(by, "There's something in here.");
                return;
            }
            case "brazier":
                p.on = true;
                p.uses = 0;
                this.lightBrazier(p);
                this.sendProp(p);
                // The weakest in the room make off
                for (const e of this.enemies) {
                    if (e.state !== "dead" && this.isWeak(e) && this.cave?.cellAt(e.x, e.z) === this.cave?.cellAt(p.x, p.z)) {
                        e.state = "flee";
                        e.fleeLeft = FLEE_SECONDS;
                        e.noIdleUntil = this.time + FLEE_PERSIST;
                    }
                }
                this.announce("A brazier roars into light. The room's lit for good, and the weakest things keep out of it.");
                return;
            case "lever":
                p.on = true;
                p.uses = 0;
                this.sendProp(p);
                for (const q of this.props) {
                    if (q.kind === "passage") {
                        q.on = true;
                        this.sendProp(q);
                    }
                }
                this.announce(
                    this.world.id === CASTLE_ID
                        ? "Somewhere a trapdoor's bolt slides back: a passage under the castle is open, both ends on your map."
                        : "Somewhere stone grinds on stone: a passage through the rock is open, both ends on your map.",
                );
                return;
            case "shrine":
                this.dropGear(this.world.lootTiers, by.x, by.z, PRIZE_FULL);
                return;
            case "corpse": {
                p.uses = 0;
                if (this.rng() < CORPSE_RISE) {
                    this.removeProp(p);
                    this.sendProp(p, 1);
                    void this.spawnEnemy(this.champion(this.humanFoe("Risen adventurer")), { x: p.x, z: p.z }).then((e) => {
                        e.cooldown = 0.8;
                        this.rouse(e);
                    });
                    this.announce("The dead adventurer lurches back up!");
                    return;
                }
                this.sendProp(p);
                const roll = this.rng();
                if (roll < 0.35) {
                    this.dropGear(this.world.lootTiers, by.x, by.z);
                } else if (roll < 0.7) {
                    give(COINS, purse(80, 200));
                } else {
                    const r = this.rng();
                    give(r < 0.4 ? food() : r < 0.7 ? potion() : OIL_CAN, 1);
                }
                this.tell(by, "The body still has something on it.");
                return;
            }
            case "vein": {
                p.uses--;
                this.sendProp(p);
                this.wakeNear(p.x, p.z, VEIN_NOISE);
                const vein = VEINS[p.data];
                let id = vein.item;
                if (id === undefined) {
                    let roll = this.rng() * GEMS.reduce((n, [, w]) => n + w, 0);
                    id = GEMS[0][0];
                    for (const [gem, w] of GEMS) {
                        roll -= w;
                        if (roll <= 0) {
                            id = gem;
                            break;
                        }
                    }
                }
                give(id, vein.item !== undefined && p.data < 2 ? randInt(this.rng, 1, 2) : 1);
                this.tell(by, vein.item !== undefined ? `You mine some ${vein.name === "coal" ? "coal" : `${vein.name} ore`}. The noise carries.` : "You chip a gem out of the rock. The noise carries.");
                return;
            }
            case "pool":
                p.uses--;
                this.sendProp(p);
                give(CAVE_EEL, 1);
                this.tell(by, "You catch a cave eel.");
                return;
            case "crack":
                p.uses = 0;
                this.removeProp(p);
                this.sendProp(p, 1);
                this.wakeNear(p.x, p.z, CRACK_NOISE);
                this.shake(0.3);
                this.leaveDebris(p.x + 0.6, p.z);
                this.leaveDebris(p.x - 0.5, p.z + 0.4);
                this.dropGear(this.world.lootTiers, p.x, p.z, PRIZE_FULL);
                this.dropGear(this.world.lootTiers, p.x + 0.4, p.z, PRIZE_FULL);
                this.dropPickup(COINS, purse(150, 300), p.x, p.z);
                this.announce("The cracked rock gives way: someone hid a cache behind it!");
                return;
            case "ladder":
                p.uses = 0;
                this.sendProp(p);
                return;
            case "bookcase": {
                p.uses = 0;
                this.sendProp(p);
                const right = this.props.some((q) => q.kind === "lectern" && q.data === p.data);
                if (right) {
                    for (const q of this.props) {
                        if (q.kind === "bookcase" && q.uses > 0) {
                            q.uses = 0;
                            this.sendProp(q);
                        }
                    }
                    this.dropGear(this.world.lootTiers, p.x, p.z, PRIZE_CASKET, 0, "crystal");
                    this.dropGear(this.world.lootTiers, p.x + 0.4, p.z, PRIZE_CASKET, 0, "crystal");
                    this.dropPickup(COINS, purse(300, 600), p.x, p.z);
                    this.shake(0.2);
                    this.announce(`"${BOOKS[p.data]}" tilts out, and the bookcase swings aside: a hidden vault!`);
                    return;
                }
                const weakest = this.world.enemies.slice(0, 2).map((e) => e.def);
                for (let n = 0; n < 3 && weakest.length > 0; n++) {
                    const def = weakest[n % weakest.length];
                    const angle = (n / 3) * Math.PI * 2;
                    const at = { x: p.x + Math.cos(angle) * 1.2, z: p.z + Math.sin(angle) * 1.2 };
                    void this.spawnEnemy(def, this.region.fits(at.x, at.z, 0.3) ? at : { x: p.x, z: p.z }).then((e) => this.rouse(e));
                }
                this.announce(`Behind "${BOOKS[p.data]}" was a nest, and what was in it swarms out!`);
                return;
            }
            case "font":
                p.uses--;
                this.sendProp(p);
                give(HOLY_WATER, 1);
                return;
            case "cell": {
                p.uses = 0;
                this.removeProp(p);
                const ally = this.rng() < PRISONER_ALLY;
                this.sendProp(p, ally ? 3 : 4, by);
                if (ally) {
                    this.freeAlly(p, by);
                    return;
                }
                void this.spawnEnemy(this.champion(this.humanFoe("Crazed prisoner")), { x: p.x, z: p.z }).then((e) => {
                    e.cooldown = 0.6;
                    this.rouse(e);
                });
                this.announce("The prisoner's gone mad down here, and turns on whoever let him out!");
                return;
            }
            case "banquet":
                p.uses--;
                this.sendProp(p);
                return;
            // Version 172's
            case "fungus":
                p.uses--;
                this.sendProp(p);
                if (hold) {
                    give(MORT_MYRE, 1);
                    this.tell(by, "You pick a handful of the glowing fungus.");
                }
                return;
            case "cart": {
                const far = this.props[p.data];
                if (far) {
                    this.wakeNear(far.x, far.z, CART_NOISE);
                }
                return;
            }
            case "herbs": {
                p.uses--;
                this.sendProp(p);
                let roll = this.rng() * HERBS.reduce((n, [, w]) => n + w, 0);
                let herb = HERBS[0][0];
                for (const [id, w] of HERBS) {
                    roll -= w;
                    if (roll <= 0) {
                        herb = id;
                        break;
                    }
                }
                give(herb, 1);
                return;
            }
            case "alchemy":
                give(potion(), 1);
                return;
            case "bell":
                p.uses = 0;
                p.on = true;
                this.sendProp(p);
                this.ringBell(p);
                return;
            // Version 179's
            case "strongbox":
                p.uses = 0;
                this.sendProp(p);
                this.wakeNear(p.x, p.z, STRONGBOX_NOISE);
                this.dropGear(this.world.lootTiers, p.x, p.z, PRIZE_FULL);
                this.dropGear(this.world.lootTiers, p.x + 0.4, p.z, PRIZE_FULL);
                this.dropPickup(COINS, purse(150, 350), p.x, p.z);
                this.dropPickup(potion(), 1, p.x, p.z);
                this.announce("The strongbox's lock gives with a crack that carries. It's full.");
                return;
            case "web":
                p.uses = 0;
                this.removeProp(p);
                this.sendProp(p, 1);
                this.tell(by, "You cut the web down. The way's open.");
                return;
            case "gate": {
                const shut = !p.on;
                if (shut && !this.doorClear(p)) {
                    this.tell(by, "Something's standing in the gateway.");
                    return;
                }
                p.on = shut;
                this.sealDoor(p, shut);
                this.sendProp(p);
                this.announce(shut ? "The gate crashes down across the doorway. Nothing gets through till it's raised." : "The gate grinds up.");
                return;
            }
            case "anvil":
                this.wakeNear(p.x, p.z, ANVIL_NOISE);
                return;
            case "coffin": {
                p.uses = 0;
                this.sendProp(p);
                if (this.rng() < COFFIN_RISE) {
                    const undead = this.world.enemies.filter((e) => HOLY_BANE.test(e.def.id)).map((e) => e.def);
                    const def = undead.length > 0 ? undead[Math.floor(this.rng() * undead.length)] : this.humanFoe("Restless dead");
                    const beside = { x: p.x + 1, z: p.z };
                    void this.spawnEnemy(this.champion(def), this.region.fits(beside.x, beside.z, 0.4) ? beside : { x: p.x, z: p.z }).then((e) => {
                        e.cooldown = 0.8;
                        this.rouse(e);
                    });
                    this.announce("The coffin's lid slides off, and what was laid in it sits up!");
                    return;
                }
                this.dropGear(this.world.lootTiers, by.x, by.z, PRIZE_FULL);
                give(COINS, purse(100, 250));
                this.tell(by, "Whoever was laid here was buried with their riches.");
                return;
            }
            default:
                return;
        }
    }

    // A barrel's fuse: BARREL_FUSE seconds, then everything near burns
    private lightFuse(p: Prop, by: Hero): void {
        const tier = this.world.tier;
        const flames: EnemyDef = { ...this.world.enemies[0].def, name: "The burning oil" };
        this.hazard(
            p.x,
            p.z,
            BARREL_REACH,
            BARREL_FUSE,
            (h) => this.hurtHero(h, flames, 0, "melee", true, Math.max(1, Math.round(h.maxHp * BARREL_HURT))),
            () => {
                this.removeProp(p);
                this.sendProp(p, 1);
                const hit = Math.round(BARREL_HIT * Math.pow(1.8, tier - 1));
                for (const e of [...this.enemies]) {
                    if (e.state !== "dead" && Math.hypot(e.x - p.x, e.z - p.z) <= BARREL_REACH + e.def.radius) {
                        this.damageEnemy(e, hit, by);
                    }
                }
                this.shake(0.35);
                this.leaveDebris(p.x, p.z);
                this.wakeNear(p.x, p.z, 12);
                this.announce("The oil barrel goes up in a ball of flame!");
            },
        );
    }

    // A brazier lit, for everyone: its flame, a light of the room's own,
    // and the room on the map
    private lightBrazier(p: Prop): void {
        void this.loadProp(p);
        this.cave?.lights.push({ x: p.x, z: p.z, kind: 0 });
        const cell = this.cave?.cellAt(p.x, p.z) ?? -1;
        if (cell >= 0) {
            this.litCells.add(cell);
            this.revealCell(cell);
        }
    }

    // A whole room cleared off the map's fog
    private revealCell(cell: number): void {
        const g = this.region;
        const mini = this.minimap;
        const cave = this.cave;
        if (!mini || !this.fog || !this.explored || !cave) {
            return;
        }
        const cx = (cell % cave.cellsX) * 64;
        const cy = Math.floor(cell / cave.cellsX) * 64;
        for (let y = cy; y < Math.min(g.sizeY, cy + 64); y++) {
            for (let x = cx; x < Math.min(g.sizeX, cx + 64); x++) {
                this.explored[x + y * g.sizeX] = 1;
            }
        }
        const ctx = this.fog.getContext("2d")!;
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(cx * mini.pxPerTile, (g.sizeY - cy - 64) * mini.pxPerTile, 64 * mini.pxPerTile, 64 * mini.pxPerTile);
    }

    // Too weak to walk into a lit room: the weakest third of the map's
    // kinds, never a boss, champion or superior
    private isWeak(e: Enemy): boolean {
        return !e.def.boss && !e.def.champion && !e.def.superior && e.def.hp <= this.weakHp;
    }

    // A man of the castle's dungeons (the Man's model) with the strength of
    // the map's middling kind: a prisoner gone mad, a dead adventurer risen
    private humanFoe(name: string): EnemyDef {
        let def = this.humanFoes.get(name);
        if (!def) {
            const kinds = this.world.enemies;
            const base = kinds[Math.floor(kinds.length / 2)].def;
            def = {
                ...base,
                id: `${this.world.id}:${name.toLowerCase().replace(/ /g, "_")}`,
                name,
                npcId: PRISONER_NPC,
                shoots: undefined,
                scale: 1,
                radius: 0.5,
                tiny: undefined,
                passive: undefined,
            };
            this.humanFoes.set(name, def);
        }
        return def;
    }

    // What's changed of a thing, to the guests
    private sendProp(p: Prop, r?: number, by?: Hero): void {
        this.refreshProp(p);
        if (this.coop?.role === "host") {
            this.coop.send({ k: "prop", i: this.props.indexOf(p), u: p.uses, on: p.on ? 1 : undefined, r, by: by?.id } satisfies DownMessage);
        }
    }

    // The host's word on a thing, on a guest
    private applyProp(message: Extract<DownMessage, { k: "prop" }>): void {
        const p = this.props[message.i];
        if (!p) {
            return;
        }
        p.uses = message.u;
        // (a gate goes both ways: version 179)
        if (p.kind === "gate") {
            const shut = !!message.on;
            if (shut !== !!p.on) {
                p.on = shut;
                this.sealDoor(p, shut);
            }
        } else if (message.on && !p.on) {
            p.on = true;
            if (p.kind === "brazier") {
                this.lightBrazier(p);
            }
        }
        // (a freed prisoner comes on his own: `ally`)
        if (message.r !== undefined && message.r > 0 && !p.gone) {
            this.removeProp(p);
        }
        this.refreshProp(p);
    }

    // Every frame: the prisoners' idling, the castle's armour waking (the
    // host's), and the freed prisoners fighting
    private updateProps(dt: number): void {
        for (const p of this.props) {
            if (p.gone) {
                continue;
            }
            p.extra?.actor?.mixer.update(dt);
            // The Depths' steam vents blow every VENT_EVERY seconds, each on
            // its own clock (version 179; the host's, as the hazard goes out)
            if (p.kind === "vent" && this.coop?.role !== "guest") {
                const at = this.ventsAt.get(p) ?? this.time + this.rng() * VENT_EVERY;
                if (this.time >= at) {
                    this.ventsAt.set(p, this.time + VENT_EVERY);
                    this.blowVent(p);
                } else {
                    this.ventsAt.set(p, at);
                }
            }
            if (p.kind === "armour" && p.data === 1 && this.coop?.role !== "guest") {
                const woken = this.heroes().find((h) => !h.dead && Math.hypot(h.x - p.x, h.z - p.z) < ARMOUR_WAKE);
                if (woken) {
                    this.removeProp(p);
                    this.sendProp(p, 1);
                    const armour = this.world.enemies.find((e) => e.def.id.endsWith("animated_steel_armour"))?.def ?? this.world.enemies[0].def;
                    void this.spawnEnemy(this.champion(armour), { x: p.x, z: p.z }).then((e) => {
                        e.cooldown = 0.6;
                        this.rouse(e);
                    });
                    this.announce("A suit of armour lurches to life!");
                }
            }
        }
        this.updateAllies(dt);
        this.updateMerc(dt);
    }

    // A freed prisoner at the side of whoever freed him for ALLY_SECONDS:
    // the host's (or a solo player's) to move, and every guest is told so
    // they see him too
    private freeAlly(at: { x: number; z: number }, owner: Hero): void {
        const uid = this.nextUid++;
        this.addAlly(uid, owner.id, at.x, at.z);
        if (this.coop?.role === "host") {
            this.coop.send({ k: "ally", u: uid, x: round2(at.x), z: round2(at.z), by: owner.id, on: 1 } satisfies DownMessage);
        }
        for (const h of [this.self, ...this.mates.values()]) {
            this.tell(
                h,
                h === owner
                    ? "The prisoner rubs his wrists and grabs a chair leg: he'll fight at your side for a while."
                    : `The prisoner ${owner.name} freed fights at their side for a while.`,
            );
        }
    }

    // His model, here (the host's own, or a guest's copy of the host's)
    private addAlly(uid: number, owner: string, x: number, z: number): void {
        void createActor("npcs", PRISONER_NPC).then((actor) => {
            if (this.ended || this.alliesGone.has(uid)) {
                this.alliesGone.delete(uid);
                return;
            }
            this.placeActor(actor, x, z);
            addShadow(actor.root, 0.45);
            play(actor, "idle");
            this.allies.push({
                uid,
                owner,
                actor,
                x,
                z,
                facing: 0,
                left: ALLY_SECONDS,
                swingIn: ALLY_EVERY,
                busy: 0,
                attacks: 0,
                walking: false,
                targetX: x,
                targetZ: z,
                targetFacing: 0,
                seenAttacks: 0,
                stuck: 0,
            });
        });
    }

    // Gone before his model came (a guest told while it loaded)
    private readonly alliesGone = new Set<number>();

    private dropAlly(uid: number): void {
        const a = this.allies.find((x) => x.uid === uid);
        if (!a) {
            this.alliesGone.add(uid);
            return;
        }
        this.scene.remove(a.actor.root);
        this.allies.splice(this.allies.indexOf(a), 1);
    }

    // The host's: each follows whoever freed him and goes for what's near
    // them, a swing every ALLY_EVERY seconds (their hit, for their kill),
    // until his time's up or they're gone. A guest's copies are eased to
    // where the host's snapshots put them.
    private updateAllies(dt: number): void {
        const tier = this.world.tier;
        const guest = this.coop?.role === "guest";
        for (const a of [...this.allies]) {
            a.actor.mixer.update(dt);
            a.busy -= dt;
            if (guest) {
                const k = 1 - Math.exp(-12 * dt);
                a.x += (a.targetX - a.x) * k;
                a.z += (a.targetZ - a.z) * k;
                let turn = a.targetFacing - a.facing;
                turn = Math.atan2(Math.sin(turn), Math.cos(turn));
                a.facing += turn * k;
                if (a.attacks !== a.seenAttacks) {
                    a.seenAttacks = a.attacks;
                    a.busy = 0.8;
                    play(a.actor, "attack", { once: true });
                } else if (a.busy <= 0) {
                    play(a.actor, a.walking ? "walk" : "idle");
                }
                a.actor.root.position.set(a.x, this.groundY(a.x, a.z), a.z);
                a.actor.root.rotation.y = a.facing;
                continue;
            }
            a.left -= dt;
            a.swingIn -= dt;
            const owner = this.heroById(a.owner);
            const ownerHere = owner && !owner.dead && !(owner.me ? this.done : (owner as Mate).done);
            if (a.left <= 0 || !owner || !ownerHere) {
                this.dropAlly(a.uid);
                if (this.coop?.role === "host") {
                    this.coop.send({ k: "ally", u: a.uid, x: round2(a.x), z: round2(a.z), by: a.owner, on: 0 } satisfies DownMessage);
                }
                if (owner && ownerHere) {
                    this.tell(owner, "The prisoner slips away into the dark.");
                }
                continue;
            }
            let target: Enemy | undefined;
            let best = ALLY_REACH;
            for (const e of this.enemies) {
                if (e.state === "dead" || e.def.passive || Math.hypot(e.x - owner.x, e.z - owner.z) > ALLY_REACH * 1.5) {
                    continue;
                }
                // (only what he can see: nothing through a wall)
                const d = Math.hypot(e.x - a.x, e.z - a.z);
                if (d < best && this.region.lineOfSight(a.x, a.z, e.x, e.z)) {
                    best = d;
                    target = e;
                }
            }
            const gx = target ? target.x : owner.x;
            const gz = target ? target.z : owner.z;
            const stop = target ? target.def.radius + 0.8 : ALLY_FOLLOW;
            const dx = gx - a.x;
            const dz = gz - a.z;
            const d = Math.hypot(dx, dz);
            a.walking = false;
            if ((!target && d > 20) || a.stuck > ALLY_STUCK) {
                // Left behind (a passage, a ladder) or stuck on a wall: he
                // finds his way
                this.allyCatchUp(a, owner);
            } else if (d > stop) {
                this.allyStep(a, gx, gz, owner, dt);
                if (a.busy <= 0) {
                    play(a.actor, "walk");
                }
            } else if (target) {
                a.facing = Math.atan2(dx, dz);
                if (a.swingIn <= 0) {
                    a.swingIn = ALLY_EVERY;
                    a.busy = 0.8;
                    a.attacks++;
                    play(a.actor, "attack", { once: true });
                    this.damageEnemy(target, randInt(this.rng, 0, ALLY_HIT + ALLY_HIT_TIER * tier), owner);
                } else if (a.busy <= 0) {
                    play(a.actor, "idle");
                }
            } else if (a.busy <= 0) {
                play(a.actor, "idle");
            }
            a.actor.root.position.set(a.x, this.groundY(a.x, a.z), a.z);
            a.actor.root.rotation.y = a.facing;
        }
    }

    // A step toward a spot: straight where nothing's in the way, else down
    // the field the enemies follow to his hero (round the castle's walls).
    // Version 177: a mercenary's step can be quicker (hurry), and goes round
    // what they'd rather not tread on (avoid: a spike trap), sideways if
    // need be
    // (version 182: a flow of their own to follow instead of their hero's, a
    // mercenary's to what they're fetching; and a turn rate, radians a
    // second, where they shouldn't snap round)
    private allyStep(
        a: Walker,
        gx: number,
        gz: number,
        owner: Hero,
        dt: number,
        how: { hurry?: number; avoid?: (x: number, z: number) => boolean; flow?: Int16Array; turn?: number } = {},
    ): void {
        const region = this.region;
        let dx = gx - a.x;
        let dz = gz - a.z;
        const straight = region.lineOfSight(a.x, a.z, gx, gz) && region.clearWalk(a.x, a.z, gx, gz, COLLISION_RADIUS);
        const flow = how.flow ?? this.flows.get(owner.id);
        const here = flow ? region.flowAt(flow, a.x, a.z) : -1;
        if (!straight && flow && here > 0) {
            const tx = region.tileX(a.x);
            const ty = region.tileY(a.z);
            let best = here;
            let bx = tx;
            let by = ty;
            for (const [ox, oy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ]) {
                if (region.crossesWall(tx, ty, tx + ox, ty + oy)) {
                    continue;
                }
                const n = region.flowAt(flow, tx + ox + 0.5, -(ty + oy + 0.5));
                if (n !== -1 && n < best) {
                    best = n;
                    bx = tx + ox;
                    by = ty + oy;
                }
            }
            dx = bx + 0.5 - a.x;
            dz = -(by + 0.5) - a.z;
        }
        const len = Math.hypot(dx, dz);
        if (len < 0.01) {
            return;
        }
        const step = PLAYER_SPEED * 0.9 * (how.hurry ?? 1) * dt;
        let ux = dx / len;
        let uz = dz / len;
        let [nx, nz] = this.moveCircle(a.x, a.z, ux * step, uz * step, COLLISION_RADIUS);
        if (how.avoid?.(nx, nz)) {
            // Round it: the side that's clear, else no step
            let found = false;
            for (const turn of [1, -1]) {
                const sx = uz * turn;
                const sz = -ux * turn;
                const [tx, tz] = this.moveCircle(a.x, a.z, sx * step, sz * step, COLLISION_RADIUS);
                if (!how.avoid(tx, tz)) {
                    [nx, nz, ux, uz] = [tx, tz, sx, sz];
                    found = true;
                    break;
                }
            }
            if (!found) {
                a.stuck += dt;
                return;
            }
        }
        a.stuck = Math.hypot(nx - a.x, nz - a.z) < step * 0.3 ? a.stuck + dt : 0;
        a.x = nx;
        a.z = nz;
        const heading = Math.atan2(ux, uz);
        a.facing = how.turn === undefined ? heading : turnToward(a.facing, heading, how.turn * dt);
        a.walking = true;
    }

    // Put back behind his hero, where there's room
    private allyCatchUp(a: Walker, owner: Hero): void {
        a.stuck = 0;
        for (const back of [1.2, 0.6, 0]) {
            const x = owner.x - Math.sin(owner.facing) * back;
            const z = owner.z - Math.cos(owner.facing) * back;
            if (back === 0 || this.region.fits(x, z, 0.3)) {
                a.x = x;
                a.z = z;
                return;
            }
        }
    }

    // -----------------------------------------------------------------------
    // Version 172 (as the user asked): the run's curse and slayer contract,
    // map scraps, the Depths' tunneller and fungus and mine carts, the
    // castle's ghosts, night, bell, racks, herbs, alchemy and the Forgotten
    // King, and both maps' spike traps

    private readonly curse?: CurseId;
    private contract?: { name: string; count: number; have: number; done: boolean };
    private borrowed: number[] = [];
    private fungusSight = 0;
    private fungusDim = 0;
    private lure?: { x: number; z: number; until: number; flow: Int16Array };
    // The last thing heard (version 178, makeNoise), when its field was
    // laid, whether the run's been told of onlookers, and when it was last
    // told of something smelling blood
    private noise?: { x: number; z: number; until: number; flow: Int16Array };
    private noiseLaidAt = -10;
    private toldLookers = false;
    private bloodToldAt = -10;
    private gloomShade = 1;
    private nightStepIn = NIGHT_STEP;
    private vampyresIn = 0;
    private nightTold = false;
    private kingWoke = false;
    private kingSlain = false;
    private readonly trapsRearm = new Map<Prop, number>();

    // The run's contract: one of the map's kinds (the commoner the likelier,
    // never a tiny one), so many of it, from the seed
    private static contractOf(seed: number, world: WorldDef): { name: string; count: number; have: number; done: boolean } | undefined {
        const rng = makeRng((seed ^ 0x51a7e) >>> 0);
        const kinds = world.enemies.filter((e) => !e.def.tiny && !e.def.passive);
        if (kinds.length === 0) {
            return undefined;
        }
        let roll = rng() * kinds.reduce((n, e) => n + e.weight, 0);
        let def = kinds[0].def;
        for (const e of kinds) {
            roll -= e.weight;
            if (roll <= 0) {
                def = e.def;
                break;
            }
        }
        return { name: def.name, count: randInt(rng, CONTRACT_COUNT[0], CONTRACT_COUNT[1]), have: 0, done: false };
    }

    private static plural(name: string): string {
        const lower = name.toLowerCase();
        return lower.endsWith("s") ? lower : `${lower}s`;
    }

    // One of this player's kills: the contract's count, a frenzy's heal
    private killedOne(def: EnemyDef): void {
        if (this.curse === "frenzy") {
            this.hp = Math.min(this.maxHp, this.hp + CURSE_HEAL);
        }
        const c = this.contract;
        if (!c || c.done || def.name.replace(/^Champion /i, "").toLowerCase() !== c.name.toLowerCase()) {
            return;
        }
        c.have++;
        if (c.have >= c.count) {
            c.done = true;
            const reward = Math.round(randInt(this.rng, CONTRACT_COINS[0], CONTRACT_COINS[1]) * Math.pow(2.2, this.world.tier - 1) * this.threat.coins);
            this.coins += reward;
            this.coinsFound += reward;
            playChime(true);
            this.hooks.onMessage(`Slayer contract done: ${c.count} ${Run.plural(c.name)}. The guild pays ${reward.toLocaleString()} coins, and shards once you're out.`);
        }
        this.hooks.onChanged();
    }

    // The HUD's word on the contract, and the stats page's on the curse
    get contractWord(): string | undefined {
        const c = this.contract;
        return c ? (c.done ? "Contract done" : `Slayer: ${c.have}/${c.count} ${Run.plural(c.name)}`) : undefined;
    }

    get curseWord(): { name: string; text: string } | undefined {
        return this.curse ? CURSES[this.curse] : undefined;
    }

    // The map's light now: its gloom, deepened as the castle's night falls
    private gloomNow(): THREE.Color {
        return this.gloom ? this.gloom.clone().multiplyScalar(this.gloomShade) : WHITE;
    }

    // A map scrap read: a room not yet seen (a living boss's lair or a
    // hidden cache first) drawn on the map
    private readScrap(): void {
        const cave = this.cave;
        const g = this.region;
        if (!cave) {
            return;
        }
        const centre = (c: number) => ({ x: g.baseX + (c % cave.cellsX) * 64 + 32, z: -(g.baseY + Math.floor(c / cave.cellsX) * 64 + 32) });
        const unseen = cave.cells.map((_, c) => c).filter((c) => cave.cells[c] !== cave.empty && !this.isExplored(centre(c).x, centre(c).z));
        const worth = new Set([
            ...this.enemies.filter((e) => e.def.boss && e.state !== "dead").map((e) => cave.cellAt(e.x, e.z)),
            ...this.props.filter((p) => p.kind === "crack" && !p.gone).map((p) => cave.cellAt(p.x, p.z)),
        ]);
        const best = unseen.filter((c) => worth.has(c));
        const pool = best.length > 0 && this.rng() < 0.6 ? best : unseen;
        const cell = pool[Math.floor(this.rng() * pool.length)];
        if (cell === undefined) {
            this.hooks.onMessage("You pick up a scrap of an old map, but it shows nothing you haven't seen.");
            return;
        }
        this.revealCell(cell);
        const at = centre(cell);
        const words: Record<string, string> = {
            plain: "a cave",
            pillars: "a pillared cave",
            camp: "an old camp",
            lair: "a lair",
            hall: "a great hall",
            court: "a courtyard",
            quarters: "some quarters",
            library: "a library",
            chapel: "a chapel",
            dungeon: "a dungeon",
        };
        const what = worth.has(cell) ? "with something marked in it" : (words[cave.cells[cell].split("_").pop() ?? ""] ?? "a room");
        this.hooks.onMessage(`You pick up a scrap of an old map. It shows ${worth.has(cell) ? "a room" : what} ${Math.round(Math.hypot(at.x - this.px, at.z - this.pz))} tiles to the ${this.compassTo(at.x, at.z)}${worth.has(cell) ? `, ${what}` : ""}: it's on your map now.`);
    }

    // The host's: the Depths' tunneller, far from where you arrive, and the
    // castle's ghosts about it
    private placeHaunts(reach: Int16Array, taken: Set<number>): Promise<void>[] {
        const jobs: Promise<void>[] = [];
        const kinds = this.world.enemies;
        if (kinds.length === 0) {
            return jobs;
        }
        const base = kinds[Math.floor(kinds.length / 2)].def;
        if (this.world.id === ENDLESS_ID) {
            const def: EnemyDef = {
                ...base,
                id: `${this.world.id}:tunneller`,
                name: "Tunneller",
                npcId: 955,
                hp: Math.round(base.hp * 6),
                damage: Math.round(base.damage * 1.6),
                scale: 1.8,
                radius: 0.9,
                superior: true,
                tunneller: true,
                shoots: undefined,
                tiny: undefined,
                passive: undefined,
            };
            const tile = this.region.randomTile(this.rng, reach, 40, taken);
            if (tile) {
                jobs.push(this.spawnEnemy(def, tile).then(() => undefined));
            }
        }
        if (this.world.id === CASTLE_ID) {
            const def: EnemyDef = {
                ...base,
                id: `${this.world.id}:restless_ghost`,
                name: "Restless ghost",
                npcId: GHOST_NPC,
                scale: 1.1,
                radius: 0.5,
                ghostly: true,
                shoots: undefined,
                tiny: undefined,
                passive: undefined,
            };
            for (let i = 0; i < GHOSTS; i++) {
                const tile = this.region.randomTile(this.rng, reach, 20, taken);
                if (tile) {
                    jobs.push(this.spawnEnemy(def, tile).then(() => undefined));
                }
            }
        }
        return jobs;
    }

    // The tunneller's dig: under for TUNNEL_UNDER seconds, up again a few
    // tiles from someone; true while it's digging
    private tunnel(e: Enemy, heroes: Hero[]): boolean {
        if (e.state === "attack" || heroes.length === 0) {
            return false;
        }
        e.tunnelAt ??= this.time + randInt(this.rng, TUNNEL_EVERY[0], TUNNEL_EVERY[1]);
        if (this.time < e.tunnelAt) {
            return false;
        }
        e.tunnelAt = this.time + randInt(this.rng, TUNNEL_EVERY[0], TUNNEL_EVERY[1]);
        const h = heroes[Math.floor(this.rng() * heroes.length)];
        for (let tries = 0; tries < 40; tries++) {
            const angle = this.rng() * Math.PI * 2;
            const d = TUNNEL_NEAR[0] + this.rng() * (TUNNEL_NEAR[1] - TUNNEL_NEAR[0]);
            const x = h.x + Math.cos(angle) * d;
            const z = h.z + Math.sin(angle) * d;
            if (this.region.fits(x, z, e.def.radius) && this.region.lineOfSight(h.x, h.z, x, z)) {
                e.homeX = x;
                e.homeZ = z;
                e.burrowed = TUNNEL_UNDER;
                e.state = "chase";
                e.noIdleUntil = this.time + 20;
                e.actor.root.visible = false;
                this.tell(h, "The rock shudders under your feet: something is digging toward you!");
                return true;
            }
        }
        return false;
    }

    // A ghost's way: straight at whoever it's after, walls or no
    private drift(e: Enemy, t: Hero, dt: number): void {
        const dx = t.x - e.x;
        const dz = t.z - e.z;
        const d = Math.hypot(dx, dz);
        if (d <= 0.8) {
            play(e.actor, "idle");
            return;
        }
        const step = Math.min(d - 0.8, this.speedOf(e) * dt);
        e.x += (dx / d) * step;
        e.z += (dz / d) * step;
        e.facing = Math.atan2(dx, dz);
        play(e.actor, "walk");
    }

    // A step down a flow field (the bell's): to the next tile nearer
    private walkFlow(e: Enemy, flow: Int16Array, dt: number): void {
        const region = this.region;
        const tx = region.tileX(e.x);
        const ty = region.tileY(e.z);
        let best = region.flowAt(flow, e.x, e.z);
        if (best <= 0) {
            play(e.actor, "idle");
            return;
        }
        let bx = tx;
        let by = ty;
        for (const [ox, oy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]) {
            if (region.crossesWall(tx, ty, tx + ox, ty + oy)) {
                continue;
            }
            const n = region.flowAt(flow, tx + ox + 0.5, -(ty + oy + 0.5));
            if (n !== -1 && n < best) {
                best = n;
                bx = tx + ox;
                by = ty + oy;
            }
        }
        const dx = bx + 0.5 - e.x;
        const dz = -(by + 0.5) - e.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.01) {
            return;
        }
        const step = this.speedOf(e) * dt;
        [e.x, e.z] = this.moveCircle(e.x, e.z, (dx / len) * step, (dz / len) * step, COLLISION_RADIUS);
        e.facing = Math.atan2(dx, dz);
        play(e.actor, "walk");
    }

    // The bell rung: everything but the lords heads for it a while, those
    // after someone further off breaking away
    private ringBell(p: Prop): void {
        this.lure = { x: p.x, z: p.z, until: this.time + BELL_SECONDS, flow: this.region.flowField({ x: p.x, z: p.z }) };
        for (const e of this.enemies) {
            if (e.def.boss || e.def.passive || e.state === "dead") {
                continue;
            }
            const t = e.target;
            if (e.state === "idle" || !t || Math.hypot(t.x - e.x, t.z - e.z) > 6) {
                e.state = "idle";
                e.noIdleUntil = 0;
            }
        }
        this.shake(0.2);
        this.announce("The bell's toll rolls through the castle. Everything that hears it is heading for the courtyard: it's on your map.");
    }

    // The Forgotten King wakes on his throne (the host's), the strongest of
    // the castle's lords and more, the castle's skeleton warlord grown huge
    private wakeKing(): void {
        this.kingWoke = true;
        const throne = this.props.find((p) => p.kind === "throne");
        const kinds = this.world.enemies;
        const base = kinds.find((e) => e.def.id.endsWith("skeleton_warlord"))?.def ?? kinds[kinds.length - 1].def;
        const lords = this.world.bosses ?? [this.world.boss];
        const top = lords.reduce((a, b) => (b.hp > a.hp ? b : a));
        const def: EnemyDef = {
            ...base,
            id: KING_ID,
            name: "The Forgotten King",
            boss: true,
            champion: undefined,
            superior: undefined,
            hp: Math.round(top.hp * KING_HP),
            damage: Math.round(top.damage * KING_DAMAGE),
            scale: (base.scale ?? 1) * KING_SCALE,
            radius: 1.1,
            coins: top.coins,
            aggro: top.aggro,
            attackInterval: top.attackInterval,
        };
        const at = throne ? { x: throne.x, z: throne.z + 1.5 } : { x: this.px, z: this.pz };
        if (throne) {
            throne.on = true;
            this.sendProp(throne);
        }
        void this.spawnEnemy(def, this.region.fits(at.x, at.z, 0.8) ? at : throne ?? at).then((king) => {
            king.tint = new THREE.Color(1.5, 1.25, 0.6);
            tint(king.actor, king.tint);
        });
        this.shake(0.5);
        this.announce("The castle groans. In the great hall, the Forgotten King rises from his throne: it's on your map.");
    }

    // What the castle lends goes back: one of each borrowed weapon, worn or
    // packed
    private returnBorrowed(): void {
        for (const id of this.borrowed) {
            if (this.equipment.weapon === id) {
                delete this.equipment.weapon;
            } else {
                removeItem(this.inventory, id, 1);
            }
        }
        this.borrowed = [];
    }

    // A weapon off a rack: one of the map's tier, in hand, the old one packed
    private borrowWeapon(p: Prop): boolean {
        const tier = Math.min(5, Math.max(1, this.world.tier));
        const weapons = (GEAR_BY_TIER.get(tier) ?? []).filter((i) => i.slot === "weapon" && !PRIZES.has(i.id) && !i.exclusive && !i.reward);
        const item = weapons[Math.floor(this.rng() * weapons.length)];
        if (!item) {
            return false;
        }
        if (!addItem(this.inventory, item.id, 1, this.packSize)) {
            this.hooks.onMessage("Your pack is too full to swap a weapon in.");
            return false;
        }
        this.equipFromInventory(item.id);
        if (this.equipment.weapon !== item.id) {
            removeItem(this.inventory, item.id, 1);
            this.hooks.onMessage("Your pack is too full to swap a weapon in.");
            return false;
        }
        this.borrowed.push(item.id);
        p.mine = true;
        this.hooks.onMessage(`You take ${item.name} from the rack. It's the castle's: it goes back when you leave.`);
        return true;
    }

    // A bite of glowing fungus: a heal, sharper eyes, strength, a haze, or poison
    private eatFungus(): void {
        const say = (text: string) => this.hooks.onMessage(text);
        const roll = this.rng();
        if (roll < 0.25) {
            this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * FUNGUS_HEAL));
            say("The fungus is bitter, but you feel better.");
        } else if (roll < 0.45) {
            this.fungusSight = FUNGUS_SECONDS;
            say("Your eyes sharpen: you see further in the dark for a while.");
        } else if (roll < 0.65) {
            this.boosts.strength = Math.max(this.boosts.strength, FUNGUS_SECONDS);
            this.applyStats();
            say("A rush of strength runs through you.");
        } else if (roll < 0.85) {
            this.fungusDim = FUNGUS_SECONDS;
            this.shake(0.6);
            say("The cave swims and the dark closes in. That one was bad.");
        } else {
            say("It tastes of rot.");
            this.poison();
        }
        this.hooks.onChanged();
    }

    // Two of what's packed for brewing go into the flask (the potion's the
    // table's: propWorld)
    private brew(): boolean {
        const have = this.inventory.filter((s) => getItem(s.id).ingredient).reduce((n, s) => n + s.count, 0);
        if (have < 2) {
            this.hooks.onMessage("You need two herbs or fungus to brew anything.");
            return false;
        }
        let left = 2;
        for (const s of this.inventory.filter((x) => getItem(x.id).ingredient)) {
            const n = Math.min(left, s.count);
            removeItem(this.inventory, s.id, n);
            left -= n;
            if (left === 0) {
                break;
            }
        }
        this.hooks.onMessage("You grind them together on the table, and a potion bubbles up in the flask.");
        this.hooks.onChanged();
        return true;
    }

    // A ride down the mine cart's line: to its far end, or thrown out half
    // way when it jumps the rails
    private rideCart(p: Prop): boolean {
        const far = this.props[p.data];
        if (!far) {
            return false;
        }
        if (this.rng() < CART_DERAIL) {
            const mx = (p.x + far.x) / 2;
            const mz = (p.z + far.z) / 2;
            const flow = this.region.flowField({ x: far.x, z: far.z });
            for (let r = 0; r < 12; r++) {
                for (let a = 0; a < 8; a++) {
                    const x = Math.floor(mx + Math.cos((a / 8) * Math.PI * 2) * r) + 0.5;
                    const z = Math.floor(mz + Math.sin((a / 8) * Math.PI * 2) * r) + 0.5;
                    if (this.region.fits(x, z, 0.4) && this.region.flowAt(flow, x, z) >= 0) {
                        this.moveSelfNear(x, z);
                        this.hp = Math.max(1, this.hp - Math.max(1, Math.round(this.maxHp * CART_HURT)));
                        this.lastHurt = this.time;
                        this.rooted = Math.max(this.rooted, 1);
                        this.hooks.onMessage("The cart jumps the rails half way and throws you out!");
                        this.hooks.onChanged();
                        return true;
                    }
                }
            }
        }
        this.moveSelfNear(far.x, far.z);
        this.hooks.onMessage("The cart rattles down the line and slams to a stop at its far end. Everything near heard it.");
        return true;
    }

    // A spike trap sprung (the host's): what's on it hurt, a hero held
    private springTrap(p: Prop): void {
        const tier = this.world.tier;
        const spikes: EnemyDef = { ...this.world.enemies[0].def, name: "The spike trap" };
        this.makeNoise(p.x, p.z, NOISE_TRAP);
        for (const h of this.heroes()) {
            if (Math.hypot(h.x - p.x, h.z - p.z) <= SPIKE_REACH) {
                this.hurtHero(h, spikes, 0, "melee", true, Math.max(1, Math.round(h.maxHp * SPIKE_HURT)));
                if (h.me) {
                    this.rooted = Math.max(this.rooted, SPIKE_HELD);
                }
                this.tell(h, "Spikes shoot up out of the floor!");
            }
        }
        for (const e of [...this.enemies]) {
            if (e.state !== "dead" && !e.def.boss && Math.hypot(e.x - p.x, e.z - p.z) <= SPIKE_REACH + e.def.radius) {
                this.damageEnemy(e, Math.round(SPIKE_HIT * Math.pow(1.8, tier - 1)), this.self);
            }
        }
        p.uses = 0;
        p.on = true;
        this.trapsRearm.set(p, this.time + SPIKE_REARM);
        this.sendProp(p);
    }

    // Every frame: the ghosts seen only by light, the fungus wearing off,
    // the castle's night deepening (and its vampyres waking: the host's),
    // and the spike traps seen, sprung and set again
    private updateHaunts(dt: number): void {
        const host = this.coop?.role !== "guest";
        if (this.fungusSight > 0) {
            this.fungusSight -= dt;
        }
        if (this.fungusDim > 0) {
            this.fungusDim -= dt;
        }
        if (this.lure && this.time >= this.lure.until) {
            this.lure = undefined;
        }
        if (this.world.id === CASTLE_ID) {
            for (const e of this.enemies) {
                if (e.def.npcId !== GHOST_NPC || e.state === "dead") {
                    continue;
                }
                const d = Math.hypot(e.x - this.px, e.z - this.pz);
                const lit = d < 1.8 || (this.lanternLit && d < this.sightShown * 0.75) || this.litCells.has(this.cave?.cellAt(e.x, e.z) ?? -1);
                e.actor.root.visible = lit;
                if (!lit && e.bar) {
                    e.bar.group.visible = false;
                }
            }
            this.nightStepIn -= dt;
            if (this.nightStepIn <= 0 && this.gloom) {
                this.nightStepIn = NIGHT_STEP;
                this.gloomShade = 1 - NIGHT_DARKEN * Math.min(1, this.time / NIGHT_FULL);
                const light = this.gloomNow();
                for (const { material, color } of this.nightMaterials) {
                    material.color.copy(color).multiply(light);
                }
                setWorldLight(light);
                setTorchNight(light);
            }
            if (host && this.time >= NIGHT_VAMPYRES_FROM) {
                if (!this.nightTold) {
                    this.nightTold = true;
                    this.announce("Night has fallen on the castle. The vampyres are waking.");
                }
                this.vampyresIn -= dt;
                if (this.vampyresIn <= 0) {
                    this.vampyresIn = NIGHT_VAMPYRES_EVERY;
                    const vampyre = this.world.enemies.find((e) => e.def.id.endsWith("feral_vampyre"))?.def;
                    const reach = this.flows.get(this.self.id) ?? this.region.flowField({ x: this.px, z: this.pz });
                    for (let i = 0; vampyre && i < NIGHT_VAMPYRES; i++) {
                        const tile = this.region.randomTile(this.rng, reach, 20, new Set());
                        if (tile) {
                            void this.spawnEnemy(vampyre, tile);
                        }
                    }
                }
            }
        }
        for (const p of this.props) {
            if (p.kind !== "trap" || p.gone) {
                continue;
            }
            const d = Math.hypot(p.x - this.px, p.z - this.pz);
            if (p.actor) {
                p.actor.root.visible = !!p.on || d < (this.lanternLit ? SPIKE_SEEN : SPIKE_SEEN_DARK);
            }
            if (!host) {
                continue;
            }
            const rearm = this.trapsRearm.get(p);
            if (rearm !== undefined && this.time >= rearm) {
                this.trapsRearm.delete(p);
                p.uses = 1;
                this.sendProp(p);
            }
            if (p.uses > 0) {
                const stepped =
                    this.heroes().some((h) => Math.hypot(h.x - p.x, h.z - p.z) < SPIKE_STEP) ||
                    this.enemies.some((e) => e.state !== "dead" && !e.def.boss && !e.def.ghostly && !(e.burrowed && e.burrowed > 0) && Math.hypot(e.x - p.x, e.z - p.z) < SPIKE_STEP);
                if (stepped) {
                    this.springTrap(p);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // The mercenary (version 173, as the user asked; mercs.ts): hired at the
    // guild for a solo run, a hero the enemies can go for (heroes()), drawn
    // as a player in their kind's gear, walking and fighting as a freed
    // prisoner does, a medic patching you up as they go

    // (version 175: their gear's numbers, as a player's are, what you've
    // given them of it, the food you've given them, and which build of their
    // look is the latest)
    private merc?: {
        kind: MercKind;
        def: MercDef;
        name: string;
        level: number;
        hero: Hero;
        look?: PlayerLook;
        looks: number;
        attackClip: string;
        bar: HealthBar;
        stats: GearStats;
        gear: Equipment;
        food: ItemStack[];
        eatIn: number;
        x: number;
        z: number;
        facing: number;
        stuck: number;
        walking: boolean;
        swingIn: number;
        busy: number;
        healIn: number;
        deadFor: number;
        gone: boolean;
        // Version 177: hurt badly, keeping behind you till they've mended;
        // what they've shouted about, and when they last shouted
        fallingBack: boolean;
        called: WeakSet<Enemy>;
        calledAt: number;
        // Version 181: their perk's clock (a chaplain's prayers), and
        // whether its once-a-run is spent (a champion's second wind)
        perkIn: number;
        perkUsed: boolean;
        // Version 182: what they're off to fetch and the way to it, when
        // they last were (no blinking back to you on the way home), and
        // whether they're coming up to you (so they don't stop and start)
        fetching?: { uid: number; flow: Int16Array };
        fetchedAt: number;
        closing: boolean;
    };
    // What you've put down for them to take (dropItem's), and what they've
    // looked at and left
    private readonly givenUids = new Set<number>();
    private readonly mercLeft = new Set<number>();
    // What you last hit, and when: the mercenary goes for it first
    private playerFoe?: Enemy;
    private playerFoeAt = -10;

    // The mercenary, beside you where you came in, at their kind's numbers
    // for the map's tier and their level, and their gear's
    private async makeMerc(): Promise<void> {
        const hired = this.carry.merc;
        if (!hired || this.coop) {
            return;
        }
        const def = MERC_DEFS[hired.kind];
        let x = this.px;
        let z = this.pz;
        for (const [ox, oz] of [
            [1.2, 0],
            [-1.2, 0],
            [0, 1.2],
            [0, -1.2],
        ]) {
            if (this.region.fits(this.px + ox, this.pz + oz, 0.3)) {
                x = this.px + ox;
                z = this.pz + oz;
                break;
            }
        }
        const hero: Hero = { id: "merc", name: hired.name, x, z, facing: 0, hp: 1, maxHp: 1, dead: false, defenceVs: [0, 0, 0], protect: "none", me: false };
        const bar = this.makeHealthBar();
        this.scene.add(bar.group);
        this.merc = {
            kind: hired.kind,
            def,
            name: hired.name,
            level: hired.level,
            hero,
            looks: 0,
            attackClip: "attack",
            bar,
            stats: gearStats({}),
            gear: { ...(hired.gear ?? {}) },
            food: (hired.food ?? []).map((s) => ({ ...s })),
            eatIn: 0,
            x,
            z,
            facing: 0,
            stuck: 0,
            walking: false,
            swingIn: def.every,
            busy: 0,
            healIn: def.heal?.every ?? 0,
            deadFor: 0,
            gone: false,
            fallingBack: false,
            called: new WeakSet(),
            calledAt: -10,
            perkIn: def.perk?.kind === "prayers" ? def.perk.every : 0,
            perkUsed: false,
            fetchedAt: -100,
            closing: false,
        };
        this.mercStats(true);
        await this.dressMerc();
    }

    // Their numbers from what they wear, as a player's are (inventory.ts
    // gearStats): its hitpoints on their kind's own for the map's tier and
    // their level, its defence on their kind's, its weapon's swing and reach
    private mercStats(whole = false): void {
        const m = this.merc!;
        const tier = this.world.tier;
        const stats = gearStats(mercWears(m.kind, { level: m.level, gear: m.gear }));
        m.stats = stats;
        const maxHp = Math.round((m.def.hp + m.def.hpTier * tier) * mercScale(m.level)) + stats.hp;
        m.hero.hp = whole ? maxHp : Math.min(maxHp, m.hero.hp + Math.max(0, maxHp - m.hero.maxHp));
        m.hero.maxHp = maxHp;
        const own = m.def.defenceTier * tier;
        m.hero.defenceVs = [stats.defenceVs.melee + own, stats.defenceVs.ranged + own, stats.defenceVs.magic + own];
        m.attackClip = stats.weapon?.attackClip ?? "attack";
    }

    // Their look in what they wear, built again whenever it changes (the
    // latest build kept, where they stand)
    private async dressMerc(): Promise<void> {
        const m = this.merc;
        if (!m) {
            return;
        }
        const build = ++m.looks;
        const character: Character = { ...this.character, name: m.name, colors: this.character.colors.map((c, i) => m.def.colors[i] ?? c) };
        const look = await PlayerLook.create(character, mercWears(m.kind, { level: m.level, gear: m.gear }));
        if (this.ended || this.merc !== m || build !== m.looks || m.gone) {
            return;
        }
        const old = m.look;
        if (old) {
            this.scene.remove(old.root);
        }
        look.stance = m.stats.weapon?.stance;
        look.root.scale.setScalar(this.character.size);
        look.root.position.set(m.x, this.groundY(m.x, m.z), m.z);
        look.root.rotation.y = m.facing;
        look.play(m.hero.dead ? "death" : "idle", { once: m.hero.dead });
        this.scene.add(look.root);
        m.look = look;
    }

    // Something you put down, taken up: gear goes on (what it replaces of
    // yours goes down where they stand, their own kit's they keep to
    // themselves), food and brews into their pack (a bite at once if
    // they're hurt enough for it: version 176); anything else they leave
    private mercTakes(p: Pickup): void {
        const m = this.merc!;
        const item = getItem(p.id);
        const name = item.name.toLowerCase();
        if (healOf(item) > 0) {
            this.removePickup(p);
            const have = m.food.find((s) => s.id === p.id);
            if (have) {
                have.count += p.count;
            } else {
                m.food.push({ id: p.id, count: p.count });
            }
            const verb = item.heal ? "eat" : "drink";
            if (m.eatIn <= 0 && m.hero.maxHp - m.hero.hp >= healOf(item)) {
                this.mercEat(m.food.find((s) => s.id === p.id)!);
                this.hooks.onMessage(p.count > 1 ? `${m.name} takes the ${name}: one to ${verb} now, the rest for later.` : `${m.name} takes the ${name} and ${verb}s it.`);
            } else {
                this.hooks.onMessage(`${m.name} packs the ${name}, to ${verb} when they're hurt.`);
            }
            return;
        }
        const slot = item.slot;
        const weapon = m.stats.weapon;
        // (only their own kind's gear since version 182, as the user asked)
        if (!slot || !mercFits(m.kind, item) || (slot === "shield" && weapon?.twoHanded)) {
            this.mercLeft.add(p.uid);
            this.hooks.onMessage(
                !slot
                    ? `${m.name} has no use for the ${name}.`
                    : !mercFits(m.kind, item)
                      ? `${m.name} leaves the ${name}: not ${STYLE_OWNER[m.def.style]} ${slot === "weapon" ? "weapon" : "armour"}.`
                      : `${m.name} can't hold a shield with a two-handed weapon.`,
            );
            return;
        }
        this.removePickup(p);
        const giveBack = (id: number | undefined) => {
            if (id !== undefined) {
                this.dropPickup(id, 1, m.x, m.z, 0.4);
            }
        };
        giveBack(m.gear[slot]);
        m.gear[slot] = p.id;
        if (slot === "weapon" && item.twoHanded) {
            giveBack(m.gear.shield);
            delete m.gear.shield;
        }
        this.mercStats();
        void this.dressMerc();
        this.hooks.onMessage(slot === "weapon" || slot === "shield" ? `${m.name} takes up the ${name}.` : `${m.name} takes the ${name} and puts it on.`);
    }

    // A bite from their pack, then EAT_DELAY to the next, as yours
    private mercEat(bite: ItemStack): void {
        const m = this.merc!;
        m.hero.hp = Math.min(m.hero.maxHp, m.hero.hp + healOf(getItem(bite.id)));
        bite.count--;
        if (bite.count <= 0) {
            m.food.splice(m.food.indexOf(bite), 1);
        }
        m.eatIn = EAT_DELAY;
    }

    // A hit on the mercenary (hurtHero's), their armour off it; at none
    // they fall for good
    private hurtMerc(hit: number): void {
        const m = this.merc;
        if (!m || m.hero.dead) {
            return;
        }
        // (version 181: a knight takes less; a champion gets back up once)
        const perk = m.def.perk;
        if (perk?.kind === "tough" && hit > 0) {
            hit = Math.max(1, Math.round(hit * (1 - perk.share)));
        }
        m.hero.hp = Math.max(0, m.hero.hp - hit);
        this.splat(m.x, m.z, 1.8, hit);
        if (m.hero.hp <= 0 && perk?.kind === "secondWind" && !m.perkUsed) {
            m.perkUsed = true;
            m.hero.hp = Math.max(1, Math.round(m.hero.maxHp * perk.share));
            this.hooks.onMessage(`${m.name} goes down, and gets back up again, bloodied but standing.`);
            return;
        }
        if (m.hero.hp <= 0) {
            m.hero.dead = true;
            m.bar.group.visible = false;
            m.look?.play("death", { once: true });
            this.hooks.onMessage(`${m.name} the ${m.def.title.toLowerCase()} falls. They'll be patched up for your next run.`);
        }
    }

    // Every frame (a solo run's). Version 177, as the user asked for a far
    // smarter one. Hurt, they eat (sooner beside a boss); a medic patches.
    // Then, first things first: out of a ring about to burst; a bowman or
    // mage back from what's closing on them; hurt badly, behind you till
    // they've mended; at the foe that matters most (mercFoe), a swordsman
    // round to its far side from you; what you've put down; else at your
    // back, out of your way. Never further from you than ALLY_LEASH, never
    // at what's still asleep (a fight you haven't picked stays unpicked),
    // never onto a spike trap; and a shout about what's coming at your back
    private updateMerc(dt: number): void {
        const m = this.merc;
        if (!m) {
            return;
        }
        m.look?.update(dt);
        if (m.hero.dead) {
            m.deadFor += dt;
            if (m.deadFor > DEATH_PAUSE && !m.gone) {
                m.gone = true;
                if (m.look) {
                    this.scene.remove(m.look.root);
                }
                this.scene.remove(m.bar.group);
            }
            return;
        }
        const scale = mercScale(m.level);
        m.busy -= dt;
        m.swingIn -= dt;
        // Hurt, they eat what you gave them (version 175): what fills the
        // gap best, as F does for you. Since version 180 (as the user asked)
        // as soon as they're down by what a bite of theirs heals, so none of
        // it's wasted; and below MERC_EAT (MERC_EAT_BOSS beside a boss)
        // whatever the bite
        m.eatIn -= dt;
        if (m.eatIn <= 0 && m.food.length > 0) {
            const missing = m.hero.maxHp - m.hero.hp;
            const smallest = Math.min(...m.food.map((s) => healOf(getItem(s.id))));
            const bossNear = this.enemies.some((e) => e.def.boss && e.state !== "idle" && e.state !== "dead" && Math.hypot(e.x - m.x, e.z - m.z) < ALLY_REACH);
            if (missing >= smallest || m.hero.hp < m.hero.maxHp * (bossNear ? MERC_EAT_BOSS : MERC_EAT)) {
                this.mercEat(this.mercBite(m));
            }
        }
        // A chaplain's prayers (version 181): so much of your prayer bar
        // back every so often, while they're at your side
        if (m.def.perk?.kind === "prayers" && !this.dead && !this.done) {
            m.perkIn -= dt;
            if (m.perkIn <= 0) {
                m.perkIn = m.def.perk.every;
                if (this.prayer < 100 && Math.hypot(m.x - this.px, m.z - this.pz) < ALLY_REACH) {
                    this.prayer = Math.min(100, this.prayer + m.def.perk.amount * scale);
                    this.hooks.onChanged();
                }
            }
        }
        // A medic patches themselves as well as you, each time (version 176)
        if (m.def.heal && !this.dead && !this.done) {
            m.healIn -= dt;
            if (m.healIn <= 0) {
                m.healIn = m.def.heal.every;
                if (this.hp < this.maxHp && Math.hypot(m.x - this.px, m.z - this.pz) < ALLY_REACH) {
                    this.hp = Math.min(this.maxHp, this.hp + Math.max(1, Math.round(this.maxHp * m.def.heal.share * scale)));
                    this.hooks.onChanged();
                }
                if (m.hero.hp < m.hero.maxHp) {
                    m.hero.hp = Math.min(m.hero.maxHp, m.hero.hp + Math.max(1, Math.round(m.hero.maxHp * m.def.heal.share * scale)));
                }
            }
        }
        // Hurt badly, they keep behind you till they've mended (a sellsword
        // stands longer: the monsters are meant to go for them)
        if (!m.fallingBack && m.hero.hp < m.hero.maxHp * (m.def.draw > 0 ? MERC_RETREAT_TOUGH : MERC_RETREAT)) {
            m.fallingBack = true;
            this.hooks.onMessage(`${m.name} falls back, hurt.`);
        } else if (m.fallingBack && m.hero.hp >= m.hero.maxHp * MERC_RALLY) {
            m.fallingBack = false;
        }
        // (a bow's or a staff's reach since version 175: their weapon's, as a
        // player's; no arrows or runes asked of them)
        const reach = m.stats.ranged ? m.stats.range : 0;
        const toYou = Math.hypot(this.px - m.x, this.pz - m.z);
        // (off fetching, far from you, they still fight what's on them)
        const target = toYou > ALLY_LEASH && !m.fetching ? undefined : this.mercFoe(m, reach);
        // Falling back, a bowman or mage still shoots from behind you
        const fighting = target && (!m.fallingBack || reach > 0);
        this.mercCallOut(m);
        // Nothing to fight: what you've put down for them, if it's near, or
        // food or a brew you've no room for (version 176); and since version
        // 182 (as the user asked) anything they can use that's lain
        // MERC_FETCH_WAIT untaken within MERC_FETCH_RANGE, you not on it
        let fetch: Pickup | undefined;
        if (!target && !m.fallingBack) {
            let best = Infinity;
            for (const p of this.pickups) {
                if (this.mercLeft.has(p.uid)) {
                    continue;
                }
                const d = Math.hypot(p.x - m.x, p.z - m.z);
                let wanted: boolean;
                if (this.givenUids.has(p.uid)) {
                    wanted = d < ALLY_REACH;
                } else if (p.age < 0.4) {
                    wanted = false;
                } else if (healOf(getItem(p.id)) > 0 && this.roomInPack(p.id, p.count) === 0) {
                    wanted = d < ALLY_REACH;
                } else {
                    wanted = p.age >= MERC_FETCH_WAIT && d < MERC_FETCH_RANGE && Math.hypot(p.x - this.px, p.z - this.pz) > MERC_FETCH_YOURS && this.mercUses(m, getItem(p.id));
                }
                // (the one they're already after, unless another's much nearer)
                const score = d - (p.uid === m.fetching?.uid ? 4 : 0);
                if (wanted && score < best) {
                    best = score;
                    fetch = p;
                }
            }
        }
        if (fetch && m.fetching?.uid !== fetch.uid) {
            // The way there, a flow of its own (allyStep's is to you); what
            // can't be reached is left
            const flow = this.region.flowField({ x: fetch.x, z: fetch.z });
            if (this.region.flowAt(flow, m.x, m.z) === -1) {
                this.mercLeft.add(fetch.uid);
                fetch = undefined;
            } else {
                m.fetching = { uid: fetch.uid, flow };
                if (!this.givenUids.has(fetch.uid) && Math.hypot(fetch.x - m.x, fetch.z - m.z) > ALLY_REACH) {
                    this.hooks.onMessage(`${m.name} goes for the ${getItem(fetch.id).name.toLowerCase()}.`);
                }
            }
        }
        // (the errand's kept through a fight on the way, so it's not
        // announced and worked out again after)
        if (fetch) {
            m.fetchedAt = this.time;
        } else if (!target) {
            m.fetching = undefined;
        }
        // Where they're going, and how close is close enough
        let gx: number;
        let gz: number;
        let stop: number;
        if (target && !m.fallingBack) {
            [gx, gz] = [target.x, target.z];
            stop = reach > 0 ? reach : target.def.radius + 0.8;
            // A swordsman works round to its far side from you, so the two
            // of you aren't queued up where its swings land
            const side = reach > 0 ? undefined : this.mercFlank(m, target);
            if (side) {
                [gx, gz] = side;
                stop = 0.4;
            }
        } else if (fetch) {
            [gx, gz] = [fetch.x, fetch.z];
            stop = 0.6;
        } else {
            [gx, gz] = this.mercPost(m.fallingBack);
            stop = m.fallingBack ? 0.8 : ALLY_FOLLOW;
        }
        const d = Math.hypot(gx - m.x, gz - m.z);
        const inReach = target ? Math.hypot(target.x - m.x, target.z - m.z) <= (reach > 0 ? reach : target.def.radius + 0.8) && this.region.lineOfSight(m.x, m.z, target.x, target.z) : false;
        m.walking = false;
        // Out of a ring about to burst before anything; a bowman or mage
        // back from what's closing on them (they shoot once it's off them)
        const away = this.mercDanger(m) ?? (reach > 0 ? this.mercKite(m, toYou) : undefined);
        const avoid = this.trapAvoid();
        // (a ranger's pace: version 181)
        const pace = m.def.perk?.kind === "haste" ? m.def.perk.speed : 1;
        // Their stride (version 182, as the user asked for better running):
        // following you, once they've set off they come to MERC_CLOSE_TO of
        // their follow distance, not stopping and starting at its edge; and
        // they walk up the last bit while you stand still
        const following = !target && !fetch && !m.fallingBack;
        let go = d > stop;
        if (following) {
            m.closing = d > stop || (m.closing && d > stop * MERC_CLOSE_TO);
            go = m.closing;
        } else {
            m.closing = false;
        }
        const walk = following && this.time - this.movedAt > MERC_WALK_STILL && d < stop + MERC_WALK_NEAR;
        const turn = MERC_TURN * dt;
        if (away) {
            this.allyStep(m, m.x + away[0] * 2, m.z + away[1] * 2, this.self, dt, { avoid, hurry: 1.1 * pace, turn: MERC_TURN });
            this.mercStride(m, 1.1 * pace, false);
        } else if (fetch && d <= stop) {
            this.mercTakes(fetch);
        } else if ((!target && !fetch && toYou > 20 && this.time - m.fetchedAt > 12) || m.stuck > ALLY_STUCK) {
            this.allyCatchUp(m, this.self);
        } else if (fighting && inReach && m.swingIn <= 0) {
            // Their weapon's swing and hit, as a player's (version 175),
            // their kind's share of it and their level's on top
            m.facing = turnToward(m.facing, Math.atan2(target.x - m.x, target.z - m.z), turn * 2);
            m.swingIn = Math.max(0.6, m.stats.speed);
            m.busy = 0.9;
            m.look?.play(m.attackClip, { once: true });
            const lands = this.rng() < hitChance(m.stats.weapon?.tier ?? 1, this.world.tier, !!target.def.boss);
            // Their perk's part in the hit (version 181): a marksman's
            // lucky shot, a veteran's finishing blow, a berserker's rage,
            // a hexer's venom, a warlock's mending
            const perk = m.def.perk;
            let times = 1;
            if (perk?.kind === "crit" && this.rng() < perk.chance) {
                times = perk.times;
            } else if (perk?.kind === "executioner" && target.hp < target.def.hp * perk.below) {
                times = perk.times;
            } else if (perk?.kind === "rage" && m.hero.hp < m.hero.maxHp * perk.below) {
                times = perk.times;
            }
            const hit = lands ? Math.max(1, Math.round(playerHit(m.stats, this.rng()) * m.def.hit * scale * times)) : 0;
            const effects: HitEffects = perk?.kind === "venom" && hit > 0 ? { poison: Math.max(1, Math.round(hit * perk.share)) } : {};
            this.damageEnemy(target, hit, this.self, effects);
            if (perk?.kind === "lifesteal" && hit > 0 && !m.hero.dead) {
                m.hero.hp = Math.min(m.hero.maxHp, m.hero.hp + Math.max(1, Math.round(hit * perk.share)));
            }
        } else if (go) {
            // (quicker when they've fallen behind, or off after something;
            // a walk up to you when you're standing)
            const hurry = walk ? 0.5 : fetch || (!target && toYou > 6) ? 1.2 : 1;
            this.allyStep(m, gx, gz, this.self, dt, { avoid, hurry: hurry * pace, flow: fetch ? m.fetching?.flow : undefined, turn: MERC_TURN });
            this.mercStride(m, hurry * pace, walk);
        } else if (fighting) {
            m.facing = turnToward(m.facing, Math.atan2(target.x - m.x, target.z - m.z), turn);
            if (m.busy <= 0) {
                m.look?.play("idle");
            }
        } else if (m.busy <= 0) {
            m.look?.play("idle");
        }
        m.hero.x = m.x;
        m.hero.z = m.z;
        m.hero.facing = m.facing;
        if (m.look) {
            m.look.root.position.set(m.x, this.groundY(m.x, m.z), m.z);
            m.look.root.rotation.y = m.facing;
        }
        m.bar.group.visible = settings.healthBars;
        m.bar.group.position.set(m.x, this.groundY(m.x, m.z) + (m.look?.height ?? 1.6) * this.character.size + 0.3, m.z);
        m.bar.fill.scale.x = Math.max(0.001, m.hero.hp / m.hero.maxHp) * BAR_WIDTH;
    }

    // Their legs at their pace (version 182): the run clip as fast as they
    // go (a player's RUN_CLIP_SPEED at PLAYER_SPEED; theirs is 0.9 of it
    // times the hurry), or the walk, which covers half the ground a cycle
    private mercStride(m: NonNullable<Run["merc"]>, hurry: number, walk: boolean): void {
        if (m.busy > 0 || !m.look) {
            return;
        }
        const pace = RUN_CLIP_SPEED * 0.9 * hurry;
        if (walk && m.look.has("walk")) {
            m.look.play("walk", { speed: pace * 2 });
        } else {
            m.look.play("run", { speed: pace });
        }
    }

    // What they'd go and get (version 182): food or a brew while they carry
    // under MERC_FOOD_MAX bites, and gear of their own kind better than
    // what's in its slot (mercs.ts mercBetter)
    private mercUses(m: NonNullable<Run["merc"]>, item: ItemDef): boolean {
        if (healOf(item) > 0) {
            return m.food.reduce((n, s) => n + s.count, 0) < MERC_FOOD_MAX;
        }
        return mercBetter(m.kind, item, { level: m.level, gear: m.gear });
    }

    // The bite that fills the gap best: the biggest heal that isn't wasted,
    // else the smallest there is (foodToEat's rule)
    private mercBite(m: NonNullable<Run["merc"]>): ItemStack {
        const missing = m.hero.maxHp - m.hero.hp;
        let best: ItemStack | undefined;
        let bestHeal = 0;
        let smallest = m.food[0];
        let smallestHeal = Infinity;
        for (const stack of m.food) {
            const heal = healOf(getItem(stack.id));
            if (heal <= missing && heal > bestHeal) {
                best = stack;
                bestHeal = heal;
            }
            if (heal < smallestHeal) {
                smallest = stack;
                smallestHeal = heal;
            }
        }
        return best ?? smallest;
    }

    // The foe that matters most (version 177): what they can see that's
    // awake and near you, the nearest first, but sooner what you're
    // hitting, what's on you, what's on them, and what a hit of theirs
    // would finish; later a boss while its company's about, and what's
    // running for help (chasing it wakes more). A medic keeps nearer you,
    // to go on patching
    private mercFoe(m: NonNullable<Run["merc"]>, reach: number): Enemy | undefined {
        const leash = m.def.heal ? MERC_MEDIC_RANGE : ALLY_LEASH;
        const maxHit = Math.round(playerHit(m.stats, 1) * m.def.hit * mercScale(m.level));
        const yours = this.time - this.playerFoeAt < 4 ? this.playerFoe : undefined;
        let company = false;
        for (const e of this.enemies) {
            if (!e.def.boss && !e.def.passive && e.state !== "idle" && e.state !== "dead" && Math.hypot(e.x - this.px, e.z - this.pz) < ALLY_REACH) {
                company = true;
                break;
            }
        }
        let best: Enemy | undefined;
        let bestScore = ALLY_REACH + reach;
        for (const e of this.enemies) {
            if (e.state === "idle" || e.state === "dead" || e.def.passive || (e.burrowed !== undefined && e.burrowed > 0)) {
                continue;
            }
            // (what's on them counts wherever they are: version 182)
            if (Math.hypot(e.x - this.px, e.z - this.pz) > leash && e.target !== m.hero) {
                continue;
            }
            let score = Math.hypot(e.x - m.x, e.z - m.z);
            if (e === yours) {
                score -= 5;
            }
            if (e.target === this.self) {
                score -= 4;
            }
            if (e.target === m.hero) {
                score -= 3;
            }
            if (e.hp <= maxHit) {
                score -= 5;
            }
            if (e.def.boss && company) {
                score += 3;
            }
            if (e.state === "flee") {
                score += 6;
            }
            if (score < bestScore && this.region.lineOfSight(m.x, m.z, e.x, e.z)) {
                bestScore = score;
                best = e;
            }
        }
        return best;
    }

    // Where a swordsman stands to a foe: a spot at its side or its far side
    // from you, as far from you as there's room for and a straight walk to
    // (not through the foe, nor a wall); none where there's no such spot
    private mercFlank(m: NonNullable<Run["merc"]>, target: Enemy): [number, number] | undefined {
        const ax = target.x - this.px;
        const az = target.z - this.pz;
        const len = Math.hypot(ax, az);
        if (len < 0.5) {
            return undefined;
        }
        const base = Math.atan2(ax, az);
        const r = target.def.radius + 0.7;
        let best: [number, number] | undefined;
        let bestScore = -Infinity;
        for (const turn of [0, 1, -1, 2, -2]) {
            const angle = base + (turn * Math.PI) / 3;
            const x = target.x + Math.sin(angle) * r;
            const z = target.z + Math.cos(angle) * r;
            if (!this.region.fits(x, z, COLLISION_RADIUS) || !this.region.lineOfSight(x, z, target.x, target.z)) {
                continue;
            }
            const fromMe = Math.hypot(x - m.x, z - m.z);
            // (standing there already is as good as it gets)
            if (fromMe > 0.4 && !(this.region.lineOfSight(m.x, m.z, x, z) && this.region.clearWalk(m.x, m.z, x, z, COLLISION_RADIUS))) {
                continue;
            }
            // (nor a straight walk that goes through the foe)
            if (fromMe > 0.4 && this.segmentNear(m.x, m.z, x, z, target.x, target.z) < target.def.radius * 0.8) {
                continue;
            }
            const score = Math.hypot(x - this.px, z - this.pz) - fromMe * 0.5;
            if (score > bestScore) {
                bestScore = score;
                best = [x, z];
            }
        }
        return best;
    }

    // How near a line from one spot to another passes a third
    private segmentNear(x1: number, z1: number, x2: number, z2: number, px: number, pz: number): number {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len2 = dx * dx + dz * dz;
        const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / len2));
        return Math.hypot(x1 + dx * t - px, z1 + dz * t - pz);
    }

    // Their post with nothing to do: a pace behind you, out of your way,
    // and away from whatever's nearest you; further back when they're hurt
    private mercPost(retreating: boolean): [number, number] {
        let fx = -Math.sin(this.facing);
        let fz = -Math.cos(this.facing);
        let near = ALLY_REACH;
        for (const e of this.enemies) {
            if (e.state === "idle" || e.state === "dead" || e.def.passive) {
                continue;
            }
            const d = Math.hypot(e.x - this.px, e.z - this.pz);
            if (d < near && d > 0.1) {
                near = d;
                fx = (this.px - e.x) / d;
                fz = (this.pz - e.z) / d;
            }
        }
        const back = retreating ? 1.6 : 1;
        const x = this.px + fx * back;
        const z = this.pz + fz * back;
        return this.region.fits(x, z, COLLISION_RADIUS) ? [x, z] : [this.px, this.pz];
    }

    // Which way out of a ring they're standing in, if they're in one
    private mercDanger(m: NonNullable<Run["merc"]>): [number, number] | undefined {
        for (const h of this.hazards) {
            const d = Math.hypot(m.x - h.x, m.z - h.z);
            if (d <= h.radius + PLAYER_RADIUS + 0.4) {
                if (d < 0.05) {
                    const toYou = Math.hypot(this.px - m.x, this.pz - m.z) || 1;
                    return [(this.px - m.x) / toYou, (this.pz - m.z) / toYou];
                }
                return [(m.x - h.x) / d, (m.z - h.z) / d];
            }
        }
        return undefined;
    }

    // Which way a bowman or mage backs off: from a swordsman after them
    // that's this close and that they can outpace (a boss that closes as
    // fast as they walk they stand and shoot at); from far off you, back
    // toward you as well
    private mercKite(m: NonNullable<Run["merc"]>, toYou: number): [number, number] | undefined {
        let worst: Enemy | undefined;
        let near = MERC_KITE;
        for (const e of this.enemies) {
            if (e.state === "idle" || e.state === "dead" || e.def.shoots || e.def.passive || e.target !== m.hero || (e.burrowed !== undefined && e.burrowed > 0)) {
                continue;
            }
            const d = Math.hypot(e.x - m.x, e.z - m.z) - e.def.radius;
            if (d < near && this.speedOf(e) < PLAYER_SPEED * 0.9) {
                near = d;
                worst = e;
            }
        }
        if (!worst) {
            return undefined;
        }
        const d = Math.hypot(m.x - worst.x, m.z - worst.z) || 1;
        let ax = (m.x - worst.x) / d;
        let az = (m.z - worst.z) / d;
        if (toYou > 5) {
            ax += (this.px - m.x) / toYou;
            az += (this.pz - m.z) / toYou;
            const len = Math.hypot(ax, az) || 1;
            ax /= len;
            az /= len;
        }
        return [ax, az];
    }

    // What a mercenary, or a cunning enemy, won't tread on: an armed spike
    // trap
    private trapAvoid(): ((x: number, z: number) => boolean) | undefined {
        const traps = this.props.filter((p) => p.kind === "trap" && !p.gone && p.uses > 0);
        return traps.length === 0 ? undefined : (x, z) => traps.some((p) => Math.hypot(p.x - x, p.z - z) < SPIKE_STEP + 0.3);
    }

    // A shout about what's coming at you from behind, once each and not
    // too often
    private mercCallOut(m: NonNullable<Run["merc"]>): void {
        if (this.dead || this.done || this.time - m.calledAt < 5) {
            return;
        }
        for (const e of this.enemies) {
            if (e.state === "idle" || e.state === "dead" || e.target !== this.self || m.called.has(e)) {
                continue;
            }
            const dx = e.x - this.px;
            const dz = e.z - this.pz;
            const d = Math.hypot(dx, dz);
            if (d > MERC_CALL_RANGE || d < 0.1) {
                continue;
            }
            let diff = Math.abs(Math.atan2(dx, dz) - this.facing) % (Math.PI * 2);
            diff = diff > Math.PI ? Math.PI * 2 - diff : diff;
            if (diff < Math.PI * 0.65) {
                continue;
            }
            m.called.add(e);
            m.calledAt = this.time;
            this.hooks.onMessage(`${m.name}: "Behind you!"`);
            return;
        }
    }

    // What the HUD says of the mercenary
    get mercWord(): string | undefined {
        const m = this.merc;
        return m ? (m.hero.dead ? `${m.name} has fallen` : `${m.name} ${Math.ceil(m.hero.hp)}/${m.hero.maxHp}`) : undefined;
    }

    // The host's word on a freed prisoner, on a guest
    private applyAlly(message: Extract<DownMessage, { k: "ally" }>): void {
        if (message.on) {
            this.addAlly(message.u, message.by, message.x, message.z);
        } else {
            this.dropAlly(message.u);
        }
    }

    // A portal out, swirling from the moment it's there
    private placeExit(actor: Actor, exit: Exit): void {
        exit.actor = actor;
        this.placeActor(actor, exit.x, exit.z);
        actor.root.visible = this.exitsOpen();
        play(actor, "play");
    }

    // What the run's first word says of the Depths' rules (DEPTHS_RULES), or
    // the Forgotten Castle's, the same in its own words (version 163)
    private depthsRules(): string {
        return this.world.id === CASTLE_ID
            ? "The ways out are barred until a lord falls, or six minutes have gone, and there's no genie here. The castle wakes fast, and its ceilings keep coming down."
            : DEPTHS_RULES;
    }

    // The ways out are there to use: always, but in the Depths only once a
    // boss has fallen, or the rock's split on its own (DEPTHS_EXITS_OPEN)
    private exitsOpen(): boolean {
        return !this.world.bosses || this.bossKills > 0 || this.time >= (this.eased() ? EASED_EXITS_OPEN : DEPTHS_EXITS_OPEN);
    }

    // The Depths themselves, a little easier than the Forgotten Castle
    // (version 169: the EASED_ numbers)
    private eased(): boolean {
        return this.world.id === ENDLESS_ID;
    }

    // The Depths' ways out come out of the rock once they're open
    private exitsShown = false;

    private updateDepthsExits(): void {
        if (this.exitsShown || !this.world.bosses || !this.exitsOpen()) {
            return;
        }
        this.exitsShown = true;
        for (const e of this.exits) {
            if (e.actor) {
                e.actor.root.visible = true;
            }
        }
        if (this.bossKills === 0) {
            this.hooks.onMessage("Somewhere the rock splits on its own: the ways out are open.");
        }
    }

    // The way out nearest the player
    private nearestExit(): Exit | undefined {
        let best: Exit | undefined;
        let bestDistance = Infinity;
        for (const exit of this.exits) {
            const distance = Math.hypot(exit.x - this.px, exit.z - this.pz);
            if (distance < bestDistance) {
                best = exit;
                bestDistance = distance;
            }
        }
        return best;
    }

    // The boss has fallen: the nearest way out is told
    private revealNearestExit(): void {
        // The Depths' ways out break open out of the rock (and stay open)
        if (this.world.bosses && !this.exitsShown) {
            this.hooks.onMessage("Somewhere the rock splits: the ways out are open.");
            this.exitsShown = true;
            for (const e of this.exits) {
                if (e.actor) {
                    e.actor.root.visible = true;
                }
            }
        }
        const exit = this.nearestExit();
        if (exit) {
            exit.found = true;
        }
    }

    private loadTrader(): Promise<void> {
        const trader = this.trader!;
        return createActor("npcs", TRADER_NPC).then((actor) => {
            this.placeActor(actor, trader.x, trader.z, trader.rotation);
            play(actor, "idle");
            addShadow(actor.root, 0.45);
            trader.actor = actor;
        });
    }

    private loadFerry(): Promise<void> {
        const ferry = this.ferry!;
        return createActor("npcs", FERRY_NPC).then((actor) => {
            this.placeActor(actor, ferry.x, ferry.z, ferry.rotation);
            play(actor, "idle");
            addShadow(actor.root, 0.45);
            ferry.actor = actor;
        });
    }

    // What the genie asks for a wish out of this map
    ferryFee(): number {
        return ferryFee(this.world.tier);
    }

    // A patrol's round: where it stands and up to two more open tiles a few
    // off, each in plain sight of the last so the walk between is clear
    private patrolRoute(tile: Tile, reach: Int16Array): Tile[] | undefined {
        const route: Tile[] = [tile];
        for (let i = 0; i < 2; i++) {
            const from = route[route.length - 1];
            for (let tries = 0; tries < 8; tries++) {
                const x = Math.floor(tile.x + randInt(this.rng, -PATROL_REACH, PATROL_REACH)) + 0.5;
                const z = Math.floor(tile.z + randInt(this.rng, -PATROL_REACH, PATROL_REACH)) + 0.5;
                if (
                    Math.hypot(x - from.x, z - from.z) >= 3 &&
                    this.region.flowAt(reach, x, z) >= 0 &&
                    this.region.fits(x, z, 0.3) &&
                    this.region.lineOfSight(from.x, from.z, x, z)
                ) {
                    route.push({ x, z });
                    break;
                }
            }
        }
        return route.length > 1 ? route : undefined;
    }

    // An enemy of the map's own, standing here: the host tells the guests
    // once the map's gone out (before that it goes with the map)
    private async spawnEnemy(def: EnemyDef, tile: Tile, trait?: Trait): Promise<Enemy> {
        const enemy = await this.makeEnemy(def, tile.x, tile.z, this.rng() * Math.PI * 2, trait, this.nextUid++);
        if (this.coop?.role === "host" && this.worldSent) {
            this.coop.send(this.spawnMessage(enemy));
        }
        return enemy;
    }

    private async makeEnemy(def: EnemyDef, x: number, z: number, facing: number, trait: Trait | undefined, uid: number): Promise<Enemy> {
        const actor = await createActor("npcs", def.npcId);
        const tile = { x, z };
        actor.root.position.set(tile.x, this.groundY(tile.x, tile.z), tile.z);
        actor.root.rotation.y = facing;
        actor.root.scale.setScalar(def.scale ?? 1);
        // A shadow its footprint wide, whatever the model's scale
        addShadow(actor.root, (def.radius * 1.4) / (def.scale ?? 1));
        this.scene.add(actor.root);
        play(actor, "idle");
        // Champions are gilded; an elite wears its trait's colour
        const colour = def.champion ? new THREE.Color(1.35, 1.1, 0.7) : trait ? TRAITS[trait].tint.clone() : new THREE.Color(1, 1, 1);
        tint(actor, colour);
        // The boss has the bar at the top of the screen instead
        const bar = def.boss ? undefined : this.makeHealthBar();
        if (bar) {
            this.scene.add(bar.group);
        }
        const enemy: Enemy = {
            def,
            actor,
            x: tile.x,
            z: tile.z,
            facing: actor.root.rotation.y,
            hp: def.hp,
            bar,
            barShown: 0,
            state: "idle",
            cooldown: 0,
            interval: def.attackInterval,
            hitIn: -1,
            deadFor: 0,
            flash: 0,
            tint: colour,
            slamIn: SLAM_SECONDS,
            strikeIn: STRIKE_SECONDS,
            floorIn: FLOOR_SECONDS,
            slow: 0,
            riled: 0,
            frozen: 0,
            thawed: 0,
            weak: 0,
            weakLeft: 0,
            poisonHit: 0,
            poisonLeft: 0,
            poisonNext: 0,
            routeAt: 0,
            stuck: 0,
            trait,
            // Every other one goes left
            flank: this.enemies.length % 2 === 0 ? 1 : -1,
            lastHurtAt: 0,
            grudgeAt: -10,
            curiousUntil: -10,
            fleeLeft: 0,
            noIdleUntil: 0,
            uid,
            attacks: 0,
            sentX: NaN,
            sentZ: NaN,
            sentClip: CLIP_IDLE,
            sentState: "",
            sentHp: -1,
            tintCode: 0,
            myHitAt: -10,
            homeX: x,
            homeZ: z,
            gaveUpAt: -10,
            targetX: x,
            targetZ: z,
            targetFacing: facing,
            seenAttacks: 0,
        };
        this.enemies.push(enemy);
        if (def.boss) {
            this.noteLair(enemy);
        }
        return enemy;
    }

    // The def's place in the table the guests get (party.ts); a new one
    // after the map's gone out travels with the spawn
    private defCode(def: EnemyDef): number {
        let code = this.defIndex.get(def);
        if (code === undefined) {
            code = this.defs.length;
            this.defIndex.set(def, code);
            this.defs.push({
                npc: def.npcId,
                name: def.name,
                hp: def.hp,
                radius: def.radius,
                scale: def.scale,
                boss: def.boss ? 1 : undefined,
                champion: def.champion ? 1 : undefined,
                shoots: def.shoots?.style,
                id: def.boss || def.superior ? def.id : undefined,
                superior: def.superior ? 1 : undefined,
            });
        }
        return code;
    }

    private spawnMessage(e: Enemy): SpawnMessage {
        const known = this.defIndex.has(e.def);
        const d = this.defCode(e.def);
        return {
            k: "spawn",
            u: e.uid,
            d,
            x: round2(e.x),
            z: round2(e.z),
            f: round2(e.facing),
            t: e.trait,
            key: e.key ? 1 : undefined,
            def: known && this.worldSent ? undefined : this.worldSent ? this.defs[d] : undefined,
        };
    }

    // A champion's def: the same enemy, bigger, far tougher, worth more
    private champion(def: EnemyDef): EnemyDef {
        let c = this.champions.get(def);
        if (!c) {
            c = {
                ...def,
                id: `${def.id}:champion`,
                name: `Champion ${def.name.toLowerCase()}`,
                hp: Math.round(def.hp * CHAMPION_HP),
                damage: Math.round(def.damage * CHAMPION_DAMAGE),
                scale: (def.scale ?? 1) * 1.3,
                coins: [def.coins[0] * 4, def.coins[1] * 4],
                champion: true,
            };
            this.champions.set(def, c);
        }
        return c;
    }

    // Where the boss stands: far off, flat, and with room for the fight
    // round it (the first candidate with enough open ground within
    // BOSS_ROOM_RADIUS, else the one with the most)
    private bossTile(reach: Int16Array, taken: Set<number>): Tile | undefined {
        let best: Tile | undefined;
        let bestRoom = -1;
        for (let tries = 0; tries < BOSS_TILE_TRIES; tries++) {
            const tile = this.flatTile(reach, 40, taken) ?? this.flatTile(reach, 20, taken);
            if (!tile) {
                break;
            }
            const room = this.roomAround(tile, BOSS_ROOM_RADIUS);
            if (room > bestRoom) {
                best = tile;
                bestRoom = room;
            }
            if (room >= BOSS_ROOM_TILES) {
                break;
            }
        }
        return best;
    }

    // How many open tiles can be walked to from a tile without leaving a
    // circle this big round it
    roomAround(tile: Tile, radius: number): number {
        const g = this.region;
        const flow = g.flowField(tile);
        let open = 0;
        for (let y = 0; y < g.sizeY; y++) {
            for (let x = 0; x < g.sizeX; x++) {
                if (flow[x + y * g.sizeX] < 0) {
                    continue;
                }
                const wx = g.baseX + x + 0.5;
                const wz = -(g.baseY + y + 0.5);
                if (Math.hypot(wx - tile.x, wz - tile.z) <= radius) {
                    open++;
                }
            }
        }
        return open;
    }

    // A random reachable tile that's flat enough for something to stand on:
    // the first within FLAT_TILE of a few tries, else the flattest of them
    private flatTile(reach: Int16Array, minDistance: number, taken: TileSet): Tile | undefined {
        let best: Tile | undefined;
        let bestRange = Infinity;
        for (let tries = 0; tries < FLAT_TRIES; tries++) {
            const tile = this.region.randomTile(this.rng, reach, minDistance, taken);
            if (!tile) {
                break;
            }
            const range = this.region.cornerRange(tile.x, tile.z);
            if (range < bestRange) {
                best = tile;
                bestRange = range;
            }
            if (range <= FLAT_TILE) {
                break;
            }
        }
        return best;
    }

    // A flat tile as far as can be found from every tile already placed: the
    // best of a few candidates (each of them flat, reachable and free), by
    // its distance to the nearest placed one. Only the one chosen is taken.
    private spreadTile(reach: Int16Array, minDistance: number, taken: Set<number>, placed: Tile[], candidates = SPREAD_CANDIDATES): Tile | undefined {
        const peek: TileSet = { has: (i) => taken.has(i), add: () => undefined };
        let best: Tile | undefined;
        let bestGap = -1;
        for (let tries = 0; tries < candidates; tries++) {
            const tile = this.flatTile(reach, minDistance, peek);
            if (!tile) {
                break;
            }
            let gap = Infinity;
            for (const p of placed) {
                gap = Math.min(gap, Math.hypot(p.x - tile.x, p.z - tile.z));
            }
            if (gap > bestGap) {
                best = tile;
                bestGap = gap;
            }
        }
        if (best) {
            const g = this.region;
            taken.add(g.tileX(best.x) - g.baseX + (g.tileY(best.z) - g.baseY) * g.sizeX);
        }
        return best;
    }

    // An open tile next to another, for the boss's chest
    private nearTile(tile: Tile, taken: Set<number>, reach: Int16Array): Tile | undefined {
        for (const [dx, dz] of [
            [2, 0],
            [-2, 0],
            [0, 2],
            [0, -2],
            [2, 2],
            [-2, -2],
        ]) {
            const x = tile.x + dx;
            const z = tile.z + dz;
            if (this.region.flowAt(reach, x, z) >= 0) {
                const i = this.region.tileX(x) - this.region.baseX + (this.region.tileY(z) - this.region.baseY) * this.region.sizeX;
                if (!taken.has(i)) {
                    taken.add(i);
                    return { x, z };
                }
            }
        }
        return undefined;
    }

    // -----------------------------------------------------------------------
    // Running

    start(): void {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        // A pointer, not a mouse: a phone's tap is one straight away, where
        // its mouse event comes late or not at all
        window.addEventListener("pointerdown", this.onMouseDown);
        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
        window.addEventListener("pointercancel", this.onPointerUp);
        window.addEventListener("mousedown", this.onMiddleDown);
        window.addEventListener("wheel", this.onWheel, { passive: true });
        window.addEventListener("resize", this.onResize);
        this.onResize();
        this.clock.start();
        this.reveal();
        playMusic(assetUrl(`assets/music/${this.world.id}.ogg`));
        const coop = this.coop;
        if (this.threat.level > 0) {
            this.hooks.onMessage(`${threatName(this.threat.level)}. ${threatText(this.threat.level)}`);
        }
        // The run's curse and slayer contract (version 172)
        if (this.curse) {
            this.hooks.onMessage(`This run's curse, ${CURSES[this.curse].name}: ${CURSES[this.curse].text}.`);
        }
        if (this.contract) {
            this.hooks.onMessage(`The guild's slayer contract: kill ${this.contract.count} ${Run.plural(this.contract.name)} for a purse and shards.`);
        }
        // (and who's with you: version 173)
        if (this.merc) {
            this.hooks.onMessage(
                `${this.merc.name} the ${this.merc.def.title.toLowerCase()} (level ${this.merc.level}) is with you, for a tenth of the coins you find.`,
            );
        }
        if (coop?.role === "guest") {
            const host = coop.heroes.find((h) => h.id !== coop.me)?.name ?? "the host";
            this.hooks.onMessage(
                this.world.bosses
                    ? `${this.world.name}, with ${host}'s party. Chests are scattered about, ${this.bossGuards()}. ${this.depthsRules()}`
                    : `${this.world.name}, with ${host}'s party. Chests are scattered about, ${this.bossGuards()}; the ways out are to be found. They close in ${Math.round(this.closeSeconds() / 60)} minutes. A genie waits where you arrived: ${this.ferryFee().toLocaleString()} coins buys a wish out.`,
            );
            // The host's map comes once this one's ready for it; the world
            // holds until everyone's loaded
            this.holding = true;
            coop.send({ k: "loaded" } satisfies UpMessage);
        } else {
            this.hooks.onMessage(
                this.world.bosses
                    ? `${this.world.name}. Chests are scattered about, ${this.bossGuards()}. ${this.depthsRules()}`
                    : `${this.world.name}. Chests are scattered about, ${this.bossGuards()}. There are ${this.exits.length} ways out, the nearest somewhere to the ${this.exitCompass()}: find one, or the boss will tell you. They close in ${Math.round(this.closeSeconds() / 60)} minutes. A genie waits where you arrived: ${this.ferryFee().toLocaleString()} coins buys a wish out.`,
            );
            if (coop?.role === "host") {
                this.sendWorld();
                for (const id of this.mates.keys()) {
                    this.waitingFor.add(id);
                }
                this.holding = this.waitingFor.size > 0;
            }
        }
        if (this.night) {
            this.hooks.onMessage("Night has fallen. You see less, and so do they.");
        }
        // The Depths' camps' supplies, now the map's gone out to any party
        if (coop?.role !== "guest") {
            this.stockCamps();
        }
        // A clue scroll brought in (the daily contract pays one, version 115)
        // names its spot as one picked up here would
        const scrolls = this.inventory.reduce((n, s) => n + (s.id === CLUE_SCROLL ? s.count : 0), 0);
        for (let i = 0; i < scrolls; i++) {
            this.setClue();
        }
        const loop = () => {
            this.frame = requestAnimationFrame(loop);
            const dt = Math.min(0.05, this.clock.getDelta());
            if (this.holding) {
                this.updateHold(dt);
            } else if (!this.paused) {
                this.update(dt);
            }
            // The lava capes and lava flowing, as the client does it
            scrollTextures(performance.now() / 1000);
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    // Paused, the world stands as it is; keys held down are let go of, so
    // nothing carries on by itself when it resumes. In co-op the world
    // doesn't wait: a menu over the run only takes the controls.
    setPaused(paused: boolean): void {
        if (this.ended) {
            return;
        }
        if (this.coop) {
            this.menuOpen = paused;
        } else {
            if (this.paused === paused) {
                return;
            }
            this.paused = paused;
        }
        this.keys.clear();
        this.wantAttack = false;
        this.attackAsked = 0;
        this.stick.x = 0;
        this.stick.z = 0;
        if (!paused) {
            // The time spent paused isn't a frame
            this.clock.getDelta();
        }
    }

    private menuOpen = false;

    // Out of the run from the pause menu, leaving everything carried behind
    // (nothing, if this player's part is already over)
    leave(): void {
        if (this.done) {
            this.end(this.done);
            return;
        }
        if (this.coop?.role === "guest") {
            this.coop.send({ k: "gone", how: "left" } satisfies UpMessage);
        }
        this.end("left");
    }

    // Which way the nearest way out lies from the player, as a compass point
    private exitCompass(): string {
        const exit = this.nearestExit();
        return exit ? this.compassTo(exit.x, exit.z) : "north";
    }

    // Which way somewhere lies from the player, as a compass point
    private compassTo(x: number, z: number): string {
        // North is up the map, which is -z here
        const angle = Math.atan2(x - this.px, -(z - this.pz));
        const names = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
        return names[((Math.round((angle / (Math.PI * 2)) * 8) % 8) + 8) % 8];
    }

    // The same with the distance
    private exitDirection(): string {
        const exit = this.nearestExit();
        if (!exit) {
            return "where you came in";
        }
        return `${Math.round(Math.hypot(exit.x - this.px, exit.z - this.pz))} tiles to the ${this.exitCompass()}`;
    }

    // How long until the way out closes (the host's word, on a guest)
    get timeLeft(): number {
        if (this.coop?.role === "guest") {
            return Math.max(0, this.hostLeft);
        }
        return Math.max(0, this.closeSeconds() - this.time);
    }

    // When the way out closes: CLOSE_SECONDS for a 128 tile map, longer by
    // the square root of the area for a bigger one
    private closeSeconds(): number {
        const area = this.region.sizeX * this.region.sizeY;
        return Math.round((CLOSE_SECONDS * this.threat.clock * Math.sqrt(area / (CLOSE_SECONDS_SIDE * CLOSE_SECONDS_SIDE))) / 30) * 30;
    }

    // Whether this player's part of the run is over while the party plays
    // on, and who they're watching
    get spectatingName(): string | undefined {
        return this.done ? (this.spectating?.name ?? undefined) : undefined;
    }

    get isDone(): boolean {
        return this.done !== undefined;
    }

    // Everyone in the party, for the HUD: this player first
    party(): PartyMember[] {
        const list: PartyMember[] = [
            {
                id: this.self.id,
                name: this.self.name,
                hp: this.hp,
                maxHp: this.maxHp,
                dead: this.dead,
                done: this.done !== undefined,
                me: true,
                color: nameColorOf(this.character, crownKey()),
            },
        ];
        for (const m of this.mates.values()) {
            list.push({ id: m.id, name: m.name, hp: m.hp, maxHp: m.maxHp, dead: m.dead, done: m.done, me: false, color: m.nameColor });
        }
        return list;
    }

    // How many slots the pack has, with the guild's upgrade
    get slots(): number {
        return this.packSize;
    }

    // How much the gear in the pack slows you, 0 to WEIGHT_MAX
    weight(): number {
        let pieces = 0;
        for (const stack of this.inventory) {
            if (getItem(stack.id).slot) {
                pieces++;
            }
        }
        return Math.min(WEIGHT_MAX, pieces * WEIGHT_PER_PIECE);
    }

    // Tiles a second, with the pack's weight (and a pet's long strides), and
    // slower while a shot's drawn or a spell's cast (aimed false: the pace
    // without that, as the war room says it)
    speed(aimed = true): number {
        const aim = aimed && this.aiming > 0 ? AIM_SLOW : 1;
        // Held by a boss's move, or slowed by a lair's ground (version 161)
        const held = aimed && this.rooted > 0 ? 0 : 1;
        return PLAYER_SPEED * (1 - this.weight()) * (1 + (this.petBuff?.speed ?? 0)) * aim * held * (aimed ? this.groundPace : 1);
    }

    // How many of a thing the pack holds
    readonly count = (id: number): number => countOf(this.inventory, id);

    // Whether a shot keeps what it'd take: AMMO_SAVE, and a pet's share of
    // what's left (version 146)
    // (and the Archer's arrows and the Apprentice's runes a fifth more often,
    // their classes' perks: version 171)
    private ammoSaved(perk?: "Archer" | "Apprentice"): boolean {
        const own = perk && this.isClass(perk) ? PERK_AMMO : 0;
        return this.rng() < 1 - (1 - AMMO_SAVE) * (1 - (this.petBuff?.ammoSave ?? 0)) * (1 - own);
    }

    // The character's starter class is this one (starter.ts, version 171)
    private isClass(name: string): boolean {
        return this.carry.perk === name;
    }

    // Its perk, for the stats page
    get classPerk(): { cls: string; name: string; text: string } | undefined {
        const kit = starterKit(this.carry.perk);
        return kit ? { cls: kit.name, ...kit.perk } : undefined;
    }

    // What a kill of this player's drops for their weapon (version 146): a
    // few shots' worth of what it takes, of no tier above the map's (so a
    // weak map isn't farmed for dear ammunition); false when there's nothing
    // to drop, and arrows or runes come as they always have
    private dropOwnAmmo(x: number, z: number): boolean {
        const weapon = this.stats.weapon;
        const tier = this.world.tier;
        const shots = () => randInt(this.rng, AMMO_DROP_SHOTS[0], AMMO_DROP_SHOTS[1]);
        if (weapon?.thrown) {
            if (weapon.tier > tier) {
                return false;
            }
            this.dropPickup(weapon.id, shots(), x, z);
            return true;
        }
        if (weapon?.uses === "arrows") {
            const shooting = this.ammo();
            this.dropPickup(shooting && getItem(shooting.id).tier <= tier ? shooting.id : ammoOfTier("arrows", tier, this.rng()), shots(), x, z);
            return true;
        }
        if (weapon?.uses === "runes" && this.lastSpell) {
            const casts = randInt(this.rng, AMMO_DROP_CASTS[0], AMMO_DROP_CASTS[1]);
            const runes = spellCost(this.lastSpell, this.runesGiven()).filter((r) => getItem(r.id).tier <= tier);
            for (const r of runes) {
                this.dropPickup(r.id, r.n * casts, x, z);
            }
            return runes.length > 0;
        }
        return false;
    }

    // The runes the staff and shield in hand give for nothing (spells.ts)
    runesGiven(): Set<number> {
        return runesGiven(this.equipment.weapon, this.equipment.shield);
    }

    // Whether Ahrim's staff casts Ancient Magicks: with all of Ahrim's set and
    // the amulet of the damned, as in OSRS (version 110)
    ahrimCasts(): boolean {
        return this.stats.set === "ahrim" && this.equipment.neck === AMULET_OF_THE_DAMNED;
    }

    // The spell a staff casts now (version 106): the one picked to
    // autocast, or, none picked, the strongest it can with the runes packed;
    // or why it can't cast
    castingSpell(): { spell?: SpellDef; why?: string } {
        const weapon = this.stats.weapon;
        if (weapon?.uses !== "runes") {
            return {};
        }
        const given = this.runesGiven();
        const ahrim = this.ahrimCasts();
        // A powered staff casts its own spell, whatever's picked (version 110)
        const powered = poweredSpell(weapon);
        if (powered) {
            return castsLeft(powered, given, this.count) > 0 ? { spell: powered } : { why: `You don't have the runes to charge your ${weapon.name.toLowerCase()}.` };
        }
        const picked = this.autocast ? SPELL_BY_ID.get(this.autocast) : undefined;
        const ancientsBarred = `Your ${weapon.name.toLowerCase()} can't cast Ancient Magicks${weapon.id === AHRIMS_STAFF ? " without the rest of Ahrim's set and the amulet of the damned" : ""}.`;
        if (picked?.book === "staff" && !staffCasts(weapon, picked, ahrim)) {
            return { why: `Only certain staves cast ${picked.name}: not your ${weapon.name.toLowerCase()}.` };
        }
        if (picked) {
            if (picked.book === "ancient" && !castsAncients(weapon, ahrim)) {
                return { why: ancientsBarred };
            }
            if (!staffCasts(weapon, picked, ahrim)) {
                return { why: `Your ${weapon.name.toLowerCase()} can't cast ${picked.name}: it takes a tier ${picked.tier} staff.` };
            }
            if (castsLeft(picked, given, this.count) <= 0) {
                return { why: `You don't have the runes for ${picked.name}.` };
            }
            return { spell: picked };
        }
        if (this.spellbook === "ancient" && !castsAncients(weapon, ahrim)) {
            return { why: ancientsBarred };
        }
        const best = bestSpell(weapon, given, this.count, this.spellbook, ahrim);
        return best ? { spell: best } : { why: "You don't have the runes for any spell your staff can cast." };
    }

    // The ammunition the weapon in hand shoots, if it's in the pack: the
    // best kind there (a staff's runes are the spell's to take: castingSpell)
    ammo(): ItemStack | undefined {
        const uses = this.stats.weapon?.uses;
        if (!uses) {
            return undefined;
        }
        let best: ItemStack | undefined;
        for (const stack of this.inventory) {
            const item = getItem(stack.id);
            if (item.ammo === uses && (!best || (item.power ?? 0) > (getItem(best.id).power ?? 0))) {
                best = stack;
            }
        }
        return best;
    }

    // The map wakes after a while, and the way out closes after longer, with
    // warnings before it does
    private updateClock(): void {
        // A guest's clock is the host's, from the snapshots
        if (this.coop?.role === "guest") {
            return;
        }
        if (!this.awake && this.time >= (this.world.bosses ? DEPTHS_WAKE_SECONDS : WAKE_SECONDS * this.threat.clock)) {
            this.awake = true;
            this.announce("The map wakes. Everything here knows you're about now, and nothing heals on its own.");
        }
        if (this.world.bosses && this.time >= (this.eased() ? EASED_COLLAPSE_EVERY : COLLAPSE_EVERY) * (this.collapses + 1)) {
            this.collapse();
        }
        const left = this.closeSeconds() - this.time;
        for (const warn of [120, 60, 30]) {
            if (left <= warn && !this.warned.has(warn)) {
                this.warned.add(warn);
                this.announce(
                    warn >= 60 ? `The ways out close in ${warn / 60} minute${warn > 60 ? "s" : ""}.` : "The ways out close in thirty seconds!",
                );
            }
        }
        if (!this.closed && left <= 0) {
            this.closed = true;
            this.announce("The ways out have closed. There's no leaving with the loot now.");
        }
    }

    // The Depths' roof comes down (COLLAPSE_EVERY): rocks about each hero,
    // more and harder each time, and what's near comes to see
    private collapses = 0;

    private collapse(): void {
        this.collapses++;
        const share = Math.min(COLLAPSE_HIT_MAX, (this.eased() ? EASED_COLLAPSE_HIT : COLLAPSE_HIT) + COLLAPSE_HIT_STEP * (this.collapses - 1));
        const rocks = COLLAPSE_ROCKS + this.collapses;
        const falling: EnemyDef = { ...this.world.enemies[0].def, name: "Falling rocks" };
        for (const hero of this.heroes()) {
            for (let i = 0; i < rocks; i++) {
                // The first right where they stand, the rest about them
                const spread = i === 0 ? 0 : COLLAPSE_SPREAD;
                const x = hero.x + (this.rng() - 0.5) * 2 * spread;
                const z = hero.z + (this.rng() - 0.5) * 2 * spread;
                if (!this.region.fits(x, z, 0.1)) {
                    continue;
                }
                // (each lands with a shake, and leaves its rock a while)
                this.hazard(
                    x,
                    z,
                    1.2,
                    COLLAPSE_WARNING,
                    (h) => this.hurtHero(h, falling, 0, "melee", true, Math.max(1, Math.round(h.maxHp * share))),
                    () => {
                        this.shake(i === 0 ? 0.35 : 0.2);
                        this.leaveDebris(x, z);
                    },
                );
            }
            this.wakeNear(hero.x, hero.z, COLLAPSE_ROUSE);
        }
        const castle = this.world.id === CASTLE_ID;
        this.announce(
            this.collapses === 1
                ? `The ${castle ? "castle" : "cave"} shudders and the ${castle ? "ceiling" : "roof"} starts to come down. Get clear of the rings!`
                : `The ${castle ? "ceiling" : "roof"} comes down again, harder.`,
        );
    }

    // A sound from somewhere on the map, as loud as it's near: full within
    // HEAR_NEAR tiles of the player (or whoever they're watching), fading to
    // nothing at HEAR_FAR, so a mate's fight across the map isn't in your ear
    private hear(key: string, x: number, z: number, volume: number): void {
        const at = this.done && this.spectating ? this.spectating : { x: this.px, z: this.pz };
        const dist = Math.hypot(x - at.x, z - at.z);
        const share = dist <= HEAR_NEAR ? 1 : Math.max(0, 1 - (dist - HEAR_NEAR) / (HEAR_FAR - HEAR_NEAR));
        if (share > 0.02) {
            playSound(key, volume * share);
        }
    }

    // A word for everyone in the party (and this player), or for one hero
    private announce(text: string): void {
        this.hooks.onMessage(text);
        if (this.coop?.role === "host") {
            this.coop.send({ k: "msg", text } satisfies DownMessage);
        }
    }

    private tell(hero: Hero, text: string): void {
        if (hero.me) {
            this.hooks.onMessage(text);
        } else if (this.coop?.role === "host") {
            this.coop.send({ k: "msg", text, to: hero.id } satisfies DownMessage);
        }
    }

    // Everything idle this close comes running; how many did
    private wakeNear(x: number, z: number, radius: number): number {
        let woke = 0;
        for (const e of this.enemies) {
            if (e.state === "idle" && !e.def.passive && Math.hypot(e.x - x, e.z - z) < radius) {
                e.state = "chase";
                woke++;
            }
        }
        // (and further off, they come to look: version 178)
        this.makeNoise(x, z, radius * 1.5);
        return woke;
    }

    // Where the vault lies from the player
    private vaultDirection(): string {
        const vault = this.chests.find((c) => c.vault);
        if (!vault) {
            return "nowhere to be found";
        }
        return `${Math.round(Math.hypot(vault.tile.x - this.px, vault.tile.z - this.pz))} tiles to the ${this.compassTo(vault.tile.x, vault.tile.z)}`;
    }

    // Sets an enemy after the player, and its idle neighbours with it: a
    // fight is noise. An elite is called out the first time.
    private rouse(e: Enemy): void {
        if (e.state !== "idle") {
            return;
        }
        e.state = "chase";
        e.lastHurtAt = this.time;
        this.notice(e);
        for (const o of this.enemies) {
            if (o.state === "idle" && !o.def.passive && Math.hypot(o.x - e.x, o.z - e.z) < ROUSE_SPREAD) {
                o.state = "chase";
                o.lastHurtAt = this.time;
                this.notice(o);
            }
        }
    }

    private notice(e: Enemy): void {
        if (e.trait && !e.noticed) {
            e.noticed = true;
            this.tell(e.target ?? this.self, `A ${e.trait} ${e.def.name.toLowerCase()} comes at you: ${TRAITS[e.trait].what}.`);
        }
    }

    setZoom(zoom: number): void {
        this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
    }

    // A key pressed or let go of by a touch screen's button
    press(code: string, down: boolean): void {
        if (this.paused || this.menuOpen || this.done) {
            return;
        }
        if (down) {
            this.keys.add(code);
            if (code === "Space") {
                this.wantAttack = true;
            }
        } else {
            this.keys.delete(code);
        }
    }

    stop(): void {
        if (this.frame !== undefined) {
            cancelAnimationFrame(this.frame);
        }
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("pointerdown", this.onMouseDown);
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        window.removeEventListener("pointercancel", this.onPointerUp);
        window.removeEventListener("mousedown", this.onMiddleDown);
        window.removeEventListener("wheel", this.onWheel);
        window.removeEventListener("resize", this.onResize);
        // No more of the map, and its colours back, for the menu and the
        // next run
        this.mapLoad?.cancel();
        this.overhead?.remove();
        for (const { material, color } of this.nightMaterials) {
            material.color.copy(color);
        }
        this.nightMaterials = [];
        setWorldLight(DAY_LIGHT);
        torchesOut();
        for (const d of this.disposables) {
            d.dispose();
        }
        this.caveDark?.remove();
        // The shafts of light over what's still lying about
        for (const p of this.pickups) {
            p.beam?.geometry.dispose();
            (p.beam?.material as THREE.Material | undefined)?.dispose();
        }
    }

    private onResize = (): void => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    };

    private onKeyDown = (e: KeyboardEvent): void => {
        if ((e.target as HTMLElement).tagName === "INPUT" || this.paused || this.menuOpen || this.done) {
            return;
        }
        this.keys.add(e.code);
        if (e.code === "Space") {
            this.wantAttack = true;
            e.preventDefault();
        }
        // A held key's repeats move and swing, but don't drink, eat, spend
        // or flick prayers over and over (version 154: holding 4 drank
        // every prayer potion in the pack)
        if (e.repeat) {
            return;
        }
        // Hotkeys: F eats, 1 to 4 drink, Q spends the special, Z X C protect
        if (e.code === "KeyF") {
            this.eatHotkey();
        } else if (e.code === "KeyQ") {
            this.useSpecial();
        } else if (e.code === "KeyZ") {
            this.setProtect("melee");
        } else if (e.code === "KeyX") {
            this.setProtect("ranged");
        } else if (e.code === "KeyC") {
            this.setProtect("magic");
        } else if (e.code === "Digit1") {
            this.drinkKind("strength");
        } else if (e.code === "Digit2") {
            this.drinkKind("defence");
        } else if (e.code === "Digit3") {
            this.drinkKind("brew");
        } else if (e.code === "Digit4") {
            this.drinkKind("prayer");
        }
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        this.keys.delete(e.code);
    };

    private onMouseDown = (e: PointerEvent): void => {
        const onWorld = (e.target as HTMLElement).tagName === "CANVAS";
        // A finger on the world swings as it lands, as a click does, and can
        // go on to drag the camera round; a second makes it a pinch
        if (e.pointerType === "touch" && onWorld) {
            this.fingers.set(e.pointerId, { x: e.clientX, y: e.clientY, fromX: e.clientX, fromY: e.clientY, dragged: false });
            if (this.fingers.size > 1) {
                for (const f of this.fingers.values()) {
                    f.dragged = true;
                }
                this.pinchFrom = this.fingerSpread();
            }
        }
        if (e.button === 1 && onWorld) {
            e.preventDefault();
            this.turnPointer = e.pointerId;
            this.turnX = e.clientX;
            this.turnY = e.clientY;
            // Its moves and its letting go still come once it's off the page
            try {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            } catch {
                // Not a live pointer
            }
            return;
        }
        if (e.button === 0 && !this.paused && !this.menuOpen && onWorld) {
            this.wantAttack = true;
        }
    };

    // The browser's own middle-button scrolling stays off the world
    private onMiddleDown = (e: MouseEvent): void => {
        if (e.button === 1 && (e.target as HTMLElement).tagName === "CANVAS") {
            e.preventDefault();
        }
    };

    // A drag turns the camera round you and tilts it, OSRS's way: across
    // turns it, up and down tilts it, as if the world were held and moved.
    // The middle button drags on a desktop, one finger on the world on a
    // touch screen; two fingers there pinch it in and out.
    private onPointerMove = (e: PointerEvent): void => {
        if (e.pointerId === this.turnPointer) {
            this.dragCamera(e.clientX - this.turnX, e.clientY - this.turnY);
            this.turnX = e.clientX;
            this.turnY = e.clientY;
            return;
        }
        const finger = this.fingers.get(e.pointerId);
        if (!finger) {
            return;
        }
        const dx = e.clientX - finger.x;
        const dy = e.clientY - finger.y;
        finger.x = e.clientX;
        finger.y = e.clientY;
        if (this.fingers.size > 1) {
            const spread = this.fingerSpread();
            if (this.pinchFrom && spread) {
                this.setZoom(this.zoom * (this.pinchFrom / spread));
            }
            this.pinchFrom = spread;
            return;
        }
        if (!finger.dragged && Math.hypot(e.clientX - finger.fromX, e.clientY - finger.fromY) > TAP_SLOP) {
            finger.dragged = true;
        }
        if (finger.dragged) {
            this.dragCamera(dx, dy);
        }
    };

    private onPointerUp = (e: PointerEvent): void => {
        if (e.pointerId === this.turnPointer) {
            this.turnPointer = undefined;
        }
        if (this.fingers.delete(e.pointerId) && this.pinchFrom !== undefined && this.fingers.size < 2) {
            // The pinch's distance is kept for the next run, like the wheel's
            this.pinchFrom = undefined;
            settings.zoom = this.zoom;
            saveSettings();
        }
    };

    private dragCamera(dx: number, dy: number): void {
        this.cameraYaw -= dx * TURN_PER_PIXEL;
        this.cameraPitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, this.cameraPitch - dy * TURN_PER_PIXEL));
    }

    // How far apart the first two fingers on the world are
    private fingerSpread(): number | undefined {
        const [a, b] = this.fingers.values();
        return a && b ? Math.hypot(b.x - a.x, b.y - a.y) : undefined;
    }

    // The wheel takes the camera a little in and out, and the next run
    // starts where it's left
    private onWheel = (e: WheelEvent): void => {
        this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom * Math.exp(e.deltaY * 0.0008)));
        settings.zoom = this.zoom;
        saveSettings();
    };

    // This player's part of the run is over: out with the loot, dead, or
    // gone. Alone, that's the run. In a party the others play on, and this
    // one watches them until they're all out too (or leaves from the pause
    // menu); the host's browser keeps running the map for them meanwhile.
    private finishSelf(kind: RunResult["kind"]): void {
        if (this.done || this.ended) {
            return;
        }
        const coop = this.coop;
        if (!coop) {
            this.end(kind);
            return;
        }
        this.done = kind;
        this.self.dead = true;
        if (kind === "extracted") {
            // Gone from the map
            this.scene.remove(this.player.root);
            if (this.crown) {
                this.scene.remove(this.crown);
            }
            if (this.pet) {
                this.scene.remove(this.pet.actor.root);
            }
        }
        if (coop.role === "guest") {
            coop.send({ k: "gone", how: kind } satisfies UpMessage);
        } else {
            coop.send({ k: "gone", id: coop.me, how: kind } satisfies DownMessage);
        }
        if (!this.othersRemain()) {
            this.end(kind);
            return;
        }
        this.hooks.onMessage(
            kind === "extracted"
                ? "You're out. You watch the others until they're out too; Esc, then Leave run, goes back to the guild now."
                : "You watch the others until they're out; Esc, then Leave run, goes back to the guild now.",
        );
    }

    // Whether anyone else in the party is still in the map
    private othersRemain(): boolean {
        for (const m of this.mates.values()) {
            if (!m.done && !m.dead) {
                return true;
            }
        }
        return false;
    }

    // Whether this party splits the coins found (version 115)
    private splitsLoot(): boolean {
        return this.coop?.role === "host" && this.coop.loot === "split";
    }

    // Coins picked up in a party that splits its loot: shared between
    // everyone still in the map (a hero who's down too, who may yet be
    // revived), the odd coins the taker's. Each share is in its owner's
    // purse, theirs to keep only by getting out.
    private shareCoins(takerId: string, count: number): void {
        const coop = this.coop;
        if (!coop) {
            return;
        }
        const ids = [...(this.done ? [] : [coop.me]), ...[...this.mates.values()].filter((m) => !m.done).map((m) => m.id)];
        if (!ids.includes(takerId)) {
            ids.push(takerId);
        }
        const each = Math.floor(count / ids.length);
        const odd = count - each * ids.length;
        const shares: [string, number][] = ids.map((id) => [id, each + (id === takerId ? odd : 0)]);
        const by = coop.heroes.find((h) => h.id === takerId)?.name ?? "Someone";
        coop.send({ k: "share", by, n: count, s: shares } satisfies DownMessage);
        this.takeShare(by, count, shares);
    }

    // This player's share of coins someone found
    private takeShare(by: string, count: number, shares: [string, number][]): void {
        const mine = shares.find(([id]) => id === this.self.id)?.[1] ?? 0;
        if (mine <= 0 || this.done) {
            return;
        }
        this.coins += mine;
        this.coinsFound += mine;
        this.hooks.onMessage(
            by === this.coop?.heroes.find((h) => h.id === this.self.id)?.name
                ? `You find ${count.toLocaleString()} coins: ${mine.toLocaleString()} of them are your share.`
                : `${by} finds ${count.toLocaleString()} coins: your share is ${mine.toLocaleString()}.`,
        );
        this.hooks.onChanged();
    }

    // A mate's gone or fallen: if this player's only watching, and there's
    // nobody left to watch, that's the run
    private checkPartyDone(): void {
        if (this.done && !this.ended && !this.othersRemain()) {
            this.end(this.done);
        }
    }

    private end(kind: RunResult["kind"]): void {
        if (this.ended) {
            return;
        }
        this.ended = true;
        // The host's run is the party's: over for everyone
        if (this.coop?.role === "host" && !this.partyOver) {
            this.coop.send({ k: "over" } satisfies DownMessage);
        }
        // The castle's borrowed weapons go back on their racks (version 172)
        this.returnBorrowed();
        // The mercenary takes their share of what was found (version 173),
        // at the end of every run since version 174, fallen or not (out of
        // what you're carrying: a death leaves none to take)
        const mercAlive = !!this.merc && !this.merc.hero.dead;
        let mercCut = 0;
        if (kind === "extracted" && this.merc) {
            mercCut = Math.min(this.coins, Math.floor(this.coinsFound * MERC_CUT));
            this.coins -= mercCut;
        }
        // A clue scroll or a key is no use anywhere else
        if (kind === "extracted") {
            this.inventory = this.inventory.filter((s) => {
                const item = getItem(s.id);
                return !item.clue && !item.key && !item.bossKey && !item.brimstone;
            });
        }
        this.hooks.onEnd({
            kind,
            carry: { inventory: this.inventory, equipment: this.equipment, coins: this.coins, hp: this.hp, wear: this.wear, threat: this.threat.level },
            world: this.world,
            report: {
                seconds: this.time,
                kills: this.kills,
                bossKills: this.bossKills,
                championKills: this.championKills,
                superiorKills: this.superiorKills,
                rangedKills: this.rangedKills,
                ate: this.ate,
                packItems: this.inventory.length,
                killer: this.killer,
                map: this.recapMap(240),
                x: this.px,
                z: this.pz,
                graveItems: this.grave?.items,
                graveTaken: this.graveTaken,
                clues: this.clues,
                vaults: this.vaults,
                petFound: this.petFound,
                night: this.night,
                hitsTaken: this.hitsTaken,
                damageTaken: this.damageTaken,
                chestsOpened: this.chestsOpened,
                goldenOpened: this.goldenOpened,
                drank: this.drank,
                specials: this.specials,
                traderBuys: this.traderBuys,
                genie: this.genie,
                secondsLeft: Math.round(this.timeLeft),
                party: 1 + this.mates.size,
                balloons: this.balloonsBurst,
                contract: this.contract?.done,
                kingSlain: this.kingSlain,
                merc:
                    this.carry.merc && !this.coop
                        ? { kind: this.carry.merc.kind, survived: mercAlive, gear: { ...(this.merc?.gear ?? this.carry.merc.gear ?? {}) }, food: (this.merc?.food ?? this.carry.merc.food ?? []).map((s) => ({ ...s })) }
                        : undefined,
                mercCut,
            },
        });
    }

    // Whether the bar has enough for a special
    get specReady(): boolean {
        return this.spec >= SPEC_COST;
    }

    // Protection on or off: the same style again takes it off
    setProtect(style: ProtectStyle): void {
        if (this.dead || this.paused) {
            return;
        }
        if (style === "none" || this.protect === style) {
            this.protect = "none";
            return;
        }
        if (this.prayer <= 0) {
            this.hooks.onMessage("You have no prayer left.");
            return;
        }
        this.protect = style;
        playSound(`sounds/${PRAYER_SOUNDS[style]}`, 0.45);
    }

    // The next protection round: none, melee, ranged, magic (the Pray button)
    cycleProtect(): void {
        const order: ProtectStyle[] = ["none", "melee", "ranged", "magic"];
        const next = order[(order.indexOf(this.protect) + 1) % order.length];
        if (next === "none") {
            this.protect = "none";
        } else {
            this.setProtect(next);
        }
    }

    // How much slower the bar drains and faster it refills for the prayer
    // bonus of what's worn: +30 is twice as slow and twice as fast
    private prayerScale(): number {
        return 1 + Math.max(0, this.stats.prayer) / PRAYER_BONUS_SCALE;
    }

    private updatePrayer(dt: number): void {
        const scale = this.prayerScale();
        if (this.protect !== "none") {
            // Twice as fast with the boss after you (a guest's copies of the
            // enemies know no target: a roused boss near it, version 154)
            const guest = this.coop?.role === "guest";
            const bossOnMe = this.enemies.some(
                (e) =>
                    e.def.boss &&
                    e.state !== "idle" &&
                    e.state !== "dead" &&
                    (guest ? Math.hypot(e.x - this.px, e.z - this.pz) < GUEST_BOSS_NEAR : e.target === this.self),
            );
            // (the Steady prayer upgrade a tenth off a level)
            const drain = this.eased() ? EASED_PRAYER_DRAIN : DEPTHS_PRAYER_DRAIN;
            const depths = (this.world.bosses ? drain * (1 - 0.1 * (this.carry.depths?.upgrades.prayer ?? 0)) : 1) * (this.isClass("Monk") ? PERK_PRAYER : 1);
            this.prayer = Math.max(0, this.prayer - (PRAYER_DRAIN * (bossOnMe ? BOSS_PRAYER_DRAIN : 1) * depths * dt) / scale);
            if (this.prayer <= 0) {
                this.protect = "none";
                this.hooks.onMessage("Your prayer runs out.");
            }
        } else {
            this.prayer = Math.min(100, this.prayer + PRAYER_REGEN * scale * dt);
        }
    }

    // One of the map's ambient sounds now and then, quietly
    private updateAmbient(dt: number): void {
        this.ambientIn -= dt;
        if (this.ambientIn > 0) {
            return;
        }
        this.ambientIn = 5 + this.rng() * 9;
        const sounds = this.world.ambient;
        if (sounds.length > 0) {
            playSound(`sounds/${sounds[Math.floor(this.rng() * sounds.length)]}`, 0.25);
        }
    }

    // A patch of ground that hurts whoever's on it when its time is up,
    // ringed in red until then (`burst` goes once, as it does). The guests
    // see the ring; the host does the hurting.
    private hazard(x: number, z: number, radius: number, left: number, hit: (hero: Hero) => void, burst?: () => void): void {
        if (!this.slamRing) {
            this.slamRing = new THREE.RingGeometry(0.85, 1, 40);
            this.disposables.push(this.slamRing);
        }
        const ring = new THREE.Mesh(
            this.slamRing,
            new THREE.MeshBasicMaterial({ color: 0xff3000, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.scale.setScalar(radius);
        ring.position.set(x, this.groundY(x, z) + 0.05, z);
        this.scene.add(ring);
        this.hazards.push({ ring, left, x, z, radius, hit, burst });
        if (this.coop?.role === "host") {
            this.coop.send({ k: "hazard", x: round2(x), z: round2(z), r: radius, l: round2(left) } satisfies DownMessage);
        }
    }

    private updateHazards(dt: number): void {
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const h = this.hazards[i];
            h.left -= dt;
            (h.ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.35 * Math.sin(h.left * 25);
            if (h.left <= 0) {
                this.scene.remove(h.ring);
                (h.ring.material as THREE.Material).dispose();
                this.hazards.splice(i, 1);
                h.burst?.();
                for (const hero of this.heroes()) {
                    if (Math.hypot(hero.x - h.x, hero.z - h.z) <= h.radius + PLAYER_RADIUS) {
                        h.hit(hero);
                    }
                }
            }
        }
    }

    // Party balloons: the next lot when it's time (not on a guest: the host
    // sends them), the fall, the bob, a burst for whoever runs into one,
    // and those left too long floating off
    private updateBalloons(dt: number): void {
        const host = this.coop?.role !== "guest";
        const between = (range: [number, number]) => range[0] + this.rng() * (range[1] - range[0]);
        if (host) {
            if (this.balloonsAt < 0) {
                this.balloonsAt = this.time + between(BALLOON_FIRST);
            } else if (this.time >= this.balloonsAt) {
                this.balloonsAt = this.time + between(BALLOON_EVERY);
                this.dropBalloons();
            }
        }
        for (const pop of [...this.popping]) {
            pop.actor.mixer.update(dt);
            pop.left -= dt;
            if (pop.left <= 0) {
                this.scene.remove(pop.actor.root);
                this.popping.splice(this.popping.indexOf(pop), 1);
            }
        }
        // (balloons are the players' to burst, not a mercenary's)
        const heroes = host ? this.heroes().filter((h) => h !== this.merc?.hero) : [];
        for (const b of [...this.balloons]) {
            b.age += dt;
            if (b.age > BALLOON_LIFE + 3) {
                this.removeBalloon(b);
                continue;
            }
            if (b.actor) {
                b.actor.mixer.update(dt);
                // On the ground itself (not its tile's highest corner, which
                // on a slope is half a tile up) once its fall's played; off
                // up into the sky at the end
                const off = Math.max(0, b.age - BALLOON_LIFE);
                b.actor.root.position.y = this.groundY(b.x, b.z) + off * off * 2;
            }
            if (b.shadow) {
                // Small while it's high, its own size on the ground, gone
                // as it floats off
                const down = Math.min(1, b.age / BALLOON_FALL);
                const off = Math.max(0, 1 - (b.age - BALLOON_LIFE) / 1.5);
                b.shadow.scale.setScalar(BALLOON_SHADOW * (0.35 + 0.65 * down * down) * Math.min(1, off));
            }
            if (!host || b.age < BALLOON_FALL || b.age > BALLOON_LIFE) {
                continue;
            }
            const by = heroes.find((h) => Math.hypot(h.x - b.x, h.z - b.z) < BALLOON_REACH + PLAYER_RADIUS);
            if (by) {
                this.burstBalloon(b, by);
            }
        }
    }

    // A lot of party balloons round someone standing (a solo run's player,
    // or anyone in a party), each on open ground
    private dropBalloons(): void {
        const heroes = this.heroes().filter((h) => h !== this.merc?.hero);
        if (heroes.length === 0) {
            return;
        }
        const hero = heroes[Math.floor(this.rng() * heroes.length)];
        const count = randInt(this.rng, BALLOON_COUNT[0], BALLOON_COUNT[1]);
        const sent: [number, number, number, number][] = [];
        for (let i = 0; i < count; i++) {
            for (let tries = 0; tries < 10; tries++) {
                const angle = this.rng() * Math.PI * 2;
                const dist = BALLOON_SPREAD[0] + this.rng() * (BALLOON_SPREAD[1] - BALLOON_SPREAD[0]);
                const x = round2(hero.x + Math.cos(angle) * dist);
                const z = round2(hero.z + Math.sin(angle) * dist);
                if (!this.region.fits(x, z, 0.3) || this.balloons.some((b) => Math.hypot(b.x - x, b.z - z) < 1)) {
                    continue;
                }
                const uid = this.nextUid++;
                const colour = Math.floor(this.rng() * BALLOON_LOCS.length);
                this.addBalloon(uid, x, z, colour);
                sent.push([uid, x, z, colour]);
                break;
            }
        }
        if (sent.length === 0) {
            return;
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "balloons", b: sent } satisfies DownMessage);
        }
        this.announce(
            this.coop ? "Party balloons are drifting down! Run into them to burst them." : "Party balloons drift down around you! Run into them to burst them.",
        );
    }

    private addBalloon(uid: number, x: number, z: number, colour: number): void {
        const b: Balloon = { uid, x, z, colour, age: 0, gone: false };
        this.balloons.push(b);
        void createActor("locs", BALLOON_LOCS[colour] ?? BALLOON_LOCS[0]).then((actor) => {
            if (b.gone || this.done) {
                return;
            }
            b.actor = actor;
            this.placeActor(actor, x, z, this.rng() * Math.PI * 2, BALLOON_SCALE);
            actor.root.position.y = this.groundY(x, z);
            b.shadow = groundShadow(BALLOON_SHADOW);
            b.shadow.position.set(x, this.groundY(x, z) + 0.05, z);
            this.scene.add(b.shadow);
            // Its fall, once, as far along as the balloon is (a model that
            // loaded late, or a guest told late, doesn't start from the top)
            play(actor, "play", { once: true });
            actor.mixer.update(Math.min(b.age, BALLOON_FALL));
        });
    }

    private removeBalloon(b: Balloon): void {
        b.gone = true;
        if (b.actor) {
            this.scene.remove(b.actor.root);
        }
        if (b.shadow) {
            this.scene.remove(b.shadow);
        }
        const i = this.balloons.indexOf(b);
        if (i !== -1) {
            this.balloons.splice(i, 1);
        }
    }

    // A balloon run into: it bursts, and what was in it falls where it was
    // (the host rolls it and tells everyone)
    private burstBalloon(b: Balloon, by?: Hero): void {
        this.removeBalloon(b);
        const distance = Math.hypot(b.x - this.px, b.z - this.pz);
        playPop(distance <= HEAR_NEAR ? 1 : Math.max(0, 1 - (distance - HEAR_NEAR) / (HEAR_FAR - HEAR_NEAR)));
        void createActor("locs", BALLOON_BURSTS[b.colour] ?? BALLOON_BURSTS[0]).then((actor) => {
            if (this.done) {
                return;
            }
            this.placeActor(actor, b.x, b.z, 0, BALLOON_SCALE);
            actor.root.position.y = this.groundY(b.x, b.z);
            this.popping.push({ actor, left: Math.max(0.3, play(actor, "play", { once: true })) });
        });
        if (!by) {
            return;
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "burst", u: b.uid } satisfies DownMessage);
        }
        if (by.me) {
            this.balloonsBurst++;
        }
        const roll = this.rng();
        if (roll < BALLOON_GEAR) {
            this.dropGear(this.world.lootTiers, b.x, b.z, 0, 0.3);
        } else if (roll < BALLOON_GEAR + BALLOON_AMMO) {
            if (this.rng() < 0.5) {
                this.dropPickup(ammoOfTier("arrows", this.world.tier, this.rng()), randInt(this.rng, 5, 10), b.x, b.z, 0.3);
            } else {
                const runes = runeDrop(this.world.tier, this.rng(), this.rng(), (lo, hi) => randInt(this.rng, lo, hi));
                this.dropPickup(runes.id, runes.count * 2, b.x, b.z, 0.3);
            }
        } else if (roll < BALLOON_GEAR + BALLOON_AMMO + BALLOON_FOOD) {
            this.dropPickup(FOOD_BY_TIER[Math.min(FOOD_BY_TIER.length - 1, this.world.tier - 1)], randInt(this.rng, 1, 2), b.x, b.z, 0.3);
        } else {
            this.tell(by, "The balloon was empty.");
        }
    }

    // The weapon's special attack, on the next swing, if the bar has enough
    useSpecial(): void {
        const special = specialOf(this.stats.weapon);
        if (!special || this.dead || this.paused || this.specPending) {
            return;
        }
        if (this.spec < SPEC_COST) {
            this.hooks.onMessage("Your special attack isn't ready.");
            return;
        }
        this.specPending = true;
        this.wantAttack = true;
    }

    // The special the swing landing now spends, if it's spending one
    private takeSpecial(stats: GearStats = this.stats): Special | undefined {
        if (!this.specPending) {
            return undefined;
        }
        this.specPending = false;
        const special = specialOf(stats.weapon);
        if (!special || this.spec < SPEC_COST) {
            return undefined;
        }
        this.spec -= SPEC_COST;
        this.specials++;
        this.hooks.onMessage(`${special.name}!`);
        return special;
    }

    // Torchlight on a night run (version 114, torch.ts): a torch with
    // this player and each mate still in it. What's come into the scene
    // since (the map's far squares, enemies, drops) takes the light every
    // TORCH_SWEEP seconds.
    private torchSweep = 0;

    private updateTorches(dt: number): void {
        if (!this.gloom) {
            return;
        }
        this.torchSweep -= dt;
        if (this.torchSweep <= 0) {
            this.torchSweep = TORCH_SWEEP;
            addTorchTo(this.scene);
        }
        // Underground and in the castle (version 165) a hero's light is
        // their lantern's: as far as it lets them see, and little of it
        // unlit (a mate's is taken as lit: nobody says)
        const caves = this.world.caves === true;
        const reach = caves ? this.sightShown + 2 : TORCH_RADIUS;
        const heroes: { x: number; z: number; out: boolean; on: number }[] = [
            { x: this.px, z: this.pz, out: this.dead, on: caves && !this.lanternLit ? UNLIT_TORCH : 1 },
            ...[...this.mates.values()].map((m) => ({ x: m.x, z: m.z, out: m.dead || m.done, on: 1 })),
        ];
        for (let i = 0; i < HERO_TORCHES; i++) {
            const h = heroes[i];
            if (!h || h.out) {
                setTorch(i, 0, -1000, 0, 0);
            } else {
                setTorch(i, h.x, this.groundY(h.x, h.z) + 1.1, h.z, h.on * flicker(this.time, i * 1.7), reach);
            }
        }
        // And the nearest fires of the rooms light the ground round them,
        // fading in as they come near
        const at = this.done && this.spectating ? this.spectating : { x: this.px, z: this.pz };
        // Whoever's watched shows through a wall or a rock in the camera's
        // way (the caves and the castle: the night's maps are as they were)
        const flat = Math.hypot(this.cameraOffset.x, this.cameraOffset.z);
        setSeeThrough(
            at.x,
            this.groundY(at.x, at.z),
            at.z,
            this.cameraOffset.x / Math.max(flat, 0.001),
            this.cameraOffset.z / Math.max(flat, 0.001),
            this.cameraOffset.y / Math.max(flat, 0.001),
            caves && flat > 0.01,
        );
        const fires = (this.cave?.lights ?? [])
            .filter((l) => l.kind === 0)
            .map((l) => ({ l, d: Math.hypot(l.x - at.x, l.z - at.z) }))
            .filter((f) => f.d < ROOM_LIGHT_NEAR)
            .sort((a, b) => a.d - b.d);
        for (let i = HERO_TORCHES; i < TORCHES; i++) {
            const fire = fires[i - HERO_TORCHES];
            if (!fire) {
                setTorch(i, 0, -1000, 0, 0);
            } else {
                const fade = Math.min(1, (ROOM_LIGHT_NEAR - fire.d) / 5);
                setTorch(i, fire.l.x, this.groundY(fire.l.x, fire.l.z) + 1, fire.l.z, fade * flicker(this.time, fire.l.x * 1.3 + fire.l.z), ROOM_LIGHT_REACH);
            }
        }
    }

    private update(dt: number): void {
        this.time += dt;
        if (!this.player) {
            return;
        }
        this.updateClock();
        this.updateLairs();
        this.updateDepthsExits();
        this.updateLantern(dt);
        this.updateProps(dt);
        this.updateHunt();
        this.updateDebris(dt);
        this.updateLairThemes(dt);
        this.updateCaveEvents(dt);
        if (this.rooted > 0) {
            this.rooted -= dt;
        }
        this.updatePrayer(dt);
        this.updateAmbient(dt);
        this.updatePlayer(dt);
        this.updatePet(dt);
        this.syncSelf();
        this.updateMates(dt);
        if (this.coop?.role === "guest") {
            this.updateGhosts(dt);
        } else {
            this.updateEnemies(dt);
        }
        // (after the enemies: a ghost out of the light stays hidden, its bar
        // too; version 172)
        this.updateHaunts(dt);
        this.updateProjectiles(dt);
        this.updateHazards(dt);
        this.updateSplats(dt);
        this.updateEffects(dt);
        this.updateTorches(dt);
        this.updatePickups(dt);
        this.updateBalloons(dt);
        this.updateInteractions(dt);
        this.player.update(dt);
        for (const exit of this.exits) {
            exit.actor?.mixer.update(dt);
        }
        for (const e of this.enemies) {
            if (e.state !== "dead" || e.deadFor <= DEAD_BODY_SECONDS) {
                e.actor.mixer.update(dt);
            }
        }
        this.updateBoosts(dt);
        this.updateFloors(dt);
        this.placeCamera();
        // The boss bar, once it has seen you
        const boss = this.enemies.find((e) => e.def.boss && e.state !== "dead" && e.state !== "idle");
        this.boss = boss ? { name: boss.def.name, hp: boss.hp, maxHp: boss.def.hp } : undefined;
        if (this.coop?.role === "host") {
            this.sendSnapshot(dt);
        } else if (this.coop?.role === "guest") {
            this.sendMove(dt);
        }
        this.hooks.onChanged();
    }

    // The world holds while the party loads: the host counts the guests in
    // (or gives up waiting after a while), the guests wait for its word
    private updateHold(dt: number): void {
        if (!this.player) {
            return;
        }
        const coop = this.coop!;
        if (coop.role === "host") {
            this.waitLeft -= dt;
            if (this.waitingFor.size === 0 || this.waitLeft <= 0) {
                this.holding = false;
                this.prompt = "";
                coop.send({ k: "go" } satisfies DownMessage);
                this.hooks.onMessage(this.waitingFor.size === 0 ? "Everyone's in. Go." : "Not everyone's loaded, but the run goes on.");
                this.waitingFor.clear();
                this.clock.getDelta();
            } else {
                const names = [...this.waitingFor].map((id) => this.mates.get(id)?.name ?? "someone");
                this.prompt = `Waiting for ${names.join(", ")} to load... ${Math.ceil(this.waitLeft)}s`;
            }
        } else {
            this.prompt = "Waiting for the others to load...";
        }
        this.player.update(dt);
        this.updateMates(dt);
        for (const exit of this.exits) {
            exit.actor?.mixer.update(dt);
        }
        for (const e of this.enemies) {
            if (e.state !== "dead" || e.deadFor <= DEAD_BODY_SECONDS) {
                e.actor.mixer.update(dt);
            }
        }
        this.placeCamera();
        this.hooks.onChanged();
    }

    // The camera over this player, or over whoever they're watching once
    // their own part is over
    private placeCamera(): void {
        let x = this.px;
        let z = this.pz;
        if (this.done) {
            const watching = this.spectating;
            if (!watching || watching.done || watching.dead) {
                this.spectating = [...this.mates.values()].find((m) => !m.done && !m.dead);
            }
            if (this.spectating) {
                x = this.spectating.x;
                z = this.spectating.z;
                this.prompt = `Watching ${this.spectating.name}. Esc, then Leave run, goes back to the guild.`;
            }
        }
        const py = this.groundY(x, z);
        this.cameraOffset
            .set(0, Math.sin(this.cameraPitch), Math.cos(this.cameraPitch))
            .multiplyScalar(CAMERA_OFFSET.length() * this.zoom)
            .applyAxisAngle(UP, this.cameraYaw);
        this.camera.position.set(x, py, z).add(this.cameraOffset);
        this.camera.lookAt(x, py + 0.6, z);
        this.placeCaveDark(x, py + 0.6, z);
        // A shake (the roof coming down, a lair shutting), dying away
        if (this.shakeLeft > 0) {
            const by = this.shakeBy * (this.shakeLeft / SHAKE_SECONDS);
            this.camera.position.x += (Math.random() - 0.5) * by;
            this.camera.position.y += (Math.random() - 0.5) * by;
            this.camera.position.z += (Math.random() - 0.5) * by;
        }
    }

    // The screen's shake (version 165): how long is left of it and how hard
    private shakeLeft = 0;
    private shakeBy = 0;

    private shake(by: number): void {
        this.shakeBy = this.shakeLeft > 0 ? Math.max(by, this.shakeBy) : by;
        this.shakeLeft = SHAKE_SECONDS;
    }

    // Rocks left where the roof came down, for a while, then gone
    private debris: { actor: Actor; left: number }[] = [];

    private leaveDebris(x: number, z: number): void {
        void createActor("locs", LAIR_ROCKS[0]).then((rock) => {
            if (this.ended) {
                return;
            }
            this.placeActor(rock, x, z, Math.random() * Math.PI * 2, 0.3 + Math.random() * 0.2);
            rock.root.position.y = this.groundY(x, z);
            this.debris.push({ actor: rock, left: DEBRIS_SECONDS });
        });
    }

    private updateDebris(dt: number): void {
        if (this.shakeLeft > 0) {
            this.shakeLeft -= dt;
        }
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.left -= dt;
            if (d.left <= 0) {
                this.scene.remove(d.actor.root);
                this.debris.splice(i, 1);
            } else if (d.left < 1) {
                d.actor.root.position.y -= dt * 0.6;
            }
        }
    }

    // The Depths' dark closes in round you (version 159): black over the
    // screen but for a ring of CAVE_SIGHT tiles about whoever's watched,
    // however far the camera's pulled back. On the screen rather than as
    // fog, which goes by depth into it, so the sides would stay lit.
    private caveDark?: HTMLCanvasElement;

    // A lantern lit, and the seconds its oil has left (LANTERN_SIGHT); and
    // the ring of sight as drawn
    private sightShown = CAVE_SIGHT;
    private lanternLit = false;
    private oilLeft = 0;

    // How far the dark lets you see: the caves' own, the Keen eyes upgrade's
    // and a lit lantern's
    private caveSight(): number {
        const lair = this.themeAt(this.px, this.pz)?.theme.sight ?? 0;
        const delver = this.isClass("Delver") ? PERK_SIGHT : 0;
        // (version 172: the deeper dark's curse, a bite of fungus either way,
        // and the castle's night falling)
        const curse = this.curse === "dark" ? -CURSE_SIGHT : 0;
        const fungus = (this.fungusSight > 0 ? FUNGUS_SIGHT : 0) - (this.fungusDim > 0 ? FUNGUS_SIGHT : 0);
        const night = this.world.id === CASTLE_ID ? -Math.round(NIGHT_SIGHT * Math.min(1, this.time / NIGHT_FULL)) : 0;
        return Math.max(3, CAVE_SIGHT + (this.carry.depths?.upgrades.sight ?? 0) + (this.lanternLit ? LANTERN_SIGHT : 0) + lair + delver + curse + fungus + night);
    }

    // The Depths' own on the gear's numbers: the Hardiness upgrade's
    // hitpoints, and the Slayer cape's harder hits
    private applyDepthsStats(stats: GearStats): void {
        if (!this.world.caves) {
            return;
        }
        stats.hp += HARDINESS_HP * (this.carry.depths?.upgrades.hardiness ?? 0);
        if (this.equipment.cape === SLAYER_CAPE) {
            stats.damage = Math.round(stats.damage * SLAYER_CAPE_DAMAGE);
        }
        // The shrine's gifts (version 166), for the rest of the run
        if (this.shrineGifts.has("blood")) {
            stats.damage = Math.round(stats.damage * SHRINE_DAMAGE);
        }
        if (this.shrineGifts.has("flesh")) {
            stats.defence += SHRINE_DEFENCE;
            stats.defenceVs.melee += SHRINE_DEFENCE;
            stats.defenceVs.ranged += SHRINE_DEFENCE;
            stats.defenceVs.magic += SHRINE_DEFENCE;
        }
    }

    // A bullseye lantern in the pack burns a can of oil every OIL_SECONDS:
    // lit as soon as there's oil to burn, out when there's none left
    private updateLantern(dt: number): void {
        if (!this.world.caves || this.dead) {
            return;
        }
        const has = (key: "lantern" | "oil") => this.inventory.some((s) => getItem(s.id)[key]);
        if (!has("lantern")) {
            this.lanternLit = false;
            return;
        }
        if (this.lanternLit) {
            this.oilLeft -= dt;
            if (this.oilLeft > 0) {
                return;
            }
        }
        const oil = this.inventory.find((s) => getItem(s.id).oil);
        if (oil && removeItem(this.inventory, oil.id, 1)) {
            // (a quarter longer for a Delver: its class's perk, version 171)
            this.oilLeft = OIL_SECONDS * (this.isClass("Delver") ? PERK_OIL : 1);
            if (!this.lanternLit) {
                this.hooks.onMessage("You light your bullseye lantern: it pushes the dark back.");
            }
            this.lanternLit = true;
            this.hooks.onChanged();
        } else if (this.lanternLit) {
            this.lanternLit = false;
            this.hooks.onMessage("Your lantern burns the last of its oil and gutters out.");
        }
    }

    // (version 165) Drawn on a small canvas over the game's, stretched: all
    // of it's soft edges. The dark, then a hole in it round whoever's
    // watched, and smaller ones round the fires, glowing fungus and crystals
    // of the rooms, the ways out and the chests, so a torch down a hall
    // shows from across it; then each light's own colour washed over it.
    private placeCaveDark(x: number, y: number, z: number): void {
        if (!this.world.caves) {
            return;
        }
        const canvas = this.renderer.domElement;
        if (!this.caveDark) {
            this.caveDark = document.createElement("canvas");
            this.caveDark.className = "cave-dark";
            canvas.after(this.caveDark);
        }
        const dark = this.caveDark;
        const dw = Math.max(2, Math.round(canvas.clientWidth / DARK_SCALE));
        const dh = Math.max(2, Math.round(canvas.clientHeight / DARK_SCALE));
        if (dark.width !== dw || dark.height !== dh) {
            dark.width = dw;
            dark.height = dh;
        }
        const ctx = dark.getContext("2d");
        if (!ctx) {
            return;
        }
        this.camera.updateMatrixWorld();
        const at = new THREE.Vector3(x, y, z).project(this.camera);
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
        // Eased toward what's seen now, so a lantern lighting opens it out
        this.sightShown += (this.caveSight() - this.sightShown) * 0.08;
        const edge = new THREE.Vector3(x, y, z).addScaledVector(right, 1).project(this.camera);
        // A tile across, on this canvas, where whoever's watched stands
        const tile = Math.hypot(((edge.x - at.x) / 2) * dw, ((edge.y - at.y) / 2) * dh);
        const onCanvas = (v: THREE.Vector3): [number, number] => [((v.x + 1) / 2) * dw, ((1 - v.y) / 2) * dh];
        // A lair's dark is its own colour (LAIR_THEMES' glow)
        const [r, g, b] = this.themeAt(this.px, this.pz)?.theme.glow ?? [0, 0, 0];
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, dw, dh);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.97)`;
        ctx.fillRect(0, 0, dw, dh);
        const disc = (cx: number, cy: number, radius: number, stops: [number, string][]) => {
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            for (const [stop, colour] of stops) {
                gradient.addColorStop(stop, colour);
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        };
        const hole = (cx: number, cy: number, radius: number, depth: number) =>
            disc(cx, cy, radius, [
                [0, `rgba(0, 0, 0, ${depth})`],
                [0.4, `rgba(0, 0, 0, ${depth})`],
                [0.75, `rgba(0, 0, 0, ${depth * 0.28})`],
                [1, "rgba(0, 0, 0, 0)"],
            ]);
        ctx.globalCompositeOperation = "destination-out";
        const [sx, sy] = onCanvas(at);
        const mine = tile * this.sightShown * (this.lanternLit ? flicker(this.time, 0.3) + 0.05 : 1);
        hole(sx, sy, mine, 1);
        const glows = this.glowsNear(x, z).map((glow) => {
            const p = new THREE.Vector3(glow.x, y, glow.z).project(this.camera);
            const [gx, gy] = onCanvas(p);
            return { gx, gy, radius: tile * glow.sight * flicker(this.time, glow.x + glow.z), kind: glow.kind, behind: p.z > 1 };
        });
        for (const glow of glows) {
            if (!glow.behind) {
                hole(glow.gx, glow.gy, glow.radius, 0.9);
            }
        }
        // Each light's colour over what it shows, and the lantern's warmth
        ctx.globalCompositeOperation = "source-over";
        for (const glow of glows) {
            if (!glow.behind) {
                disc(glow.gx, glow.gy, glow.radius * 0.9, [
                    [0, `rgba(${LIGHT_WASH[glow.kind]}, 0.16)`],
                    [1, `rgba(${LIGHT_WASH[glow.kind]}, 0)`],
                ]);
            }
        }
        if (this.lanternLit) {
            disc(sx, sy, mine * 0.8, [
                [0, `rgba(${LIGHT_WASH[0]}, 0.07)`],
                [1, `rgba(${LIGHT_WASH[0]}, 0)`],
            ]);
        }
    }

    // What glows near a spot: the rooms' own lights (caves.ts), the ways out
    // once they're open, the altar, and chests not yet opened, a glint each
    private glowsNear(x: number, z: number): { x: number; z: number; kind: number; sight: number }[] {
        const out: { x: number; z: number; kind: number; sight: number }[] = [];
        const near = (gx: number, gz: number) => Math.abs(gx - x) < GLOW_NEAR && Math.abs(gz - z) < GLOW_NEAR;
        for (const light of this.cave?.lights ?? []) {
            if (near(light.x, light.z)) {
                out.push({ ...light, sight: LIGHT_SIGHT[light.kind] });
            }
        }
        if (this.exitsOpen()) {
            for (const exit of this.exits) {
                if (near(exit.x, exit.z)) {
                    out.push({ x: exit.x, z: exit.z, kind: 1, sight: 3 });
                }
            }
        }
        for (const altar of this.altars) {
            if (near(altar.x, altar.z)) {
                out.push({ x: altar.x, z: altar.z, kind: 0, sight: 2.5 });
            }
        }
        for (const chest of this.chests) {
            if (!chest.opened && (chest.boss || chest.room || chest.vault) && near(chest.tile.x, chest.tile.z)) {
                out.push({ x: chest.tile.x, z: chest.tile.z, kind: chest.vault ? 2 : 0, sight: 1.8 });
            }
        }
        // The shrine, the pools and the font, a gem rock's glint (version 166;
        // a lit brazier is one of the rooms' own lights now)
        for (const p of this.props) {
            const glow = p.kind === "shrine" ? 2 : p.kind === "pool" || p.kind === "font" ? 1 : p.kind === "vein" && !VEINS[p.data].item && p.uses > 0 ? 2 : -1;
            if (glow >= 0 && near(p.x, p.z)) {
                out.push({ x: p.x, z: p.z, kind: glow, sight: p.kind === "vein" ? 1.2 : 2 });
            }
        }
        return out;
    }

    // This player as the enemies (and the snapshot) see them
    private syncSelf(): void {
        const s = this.self;
        s.x = this.px;
        s.z = this.pz;
        s.facing = this.facing;
        s.hp = this.hp;
        s.maxHp = this.maxHp;
        s.dead = this.dead || this.done !== undefined;
        s.defenceVs = this.defenceTriple();
        s.protect = this.protect;
    }

    // The armour's defence against melee, ranged and magic, in that order
    // (party.ts sends it so; a hero carries it so)
    private defenceTriple(): [number, number, number] {
        const d = this.stats.defenceVs;
        return [d.melee, d.ranged, d.magic];
    }

    // A hero's defence against a style of attack
    private static defenceAgainst(hero: Hero, style: ProtectStyle): number {
        return hero.defenceVs[style === "ranged" ? 1 : style === "magic" ? 2 : 0];
    }

    // The others in the party, eased along
    private updateMates(dt: number): void {
        for (const m of this.mates.values()) {
            if (!m.done || m.corpse) {
                m.update(dt, settings.healthBars);
            }
        }
    }

    // Every hero an enemy could be after: this player and the mates still
    // standing
    private heroes(): Hero[] {
        const list: Hero[] = [];
        if (!this.dead && !this.done) {
            list.push(this.self);
        }
        for (const m of this.mates.values()) {
            if (!m.done && !m.dead) {
                list.push(m);
            }
        }
        // (and a solo run's mercenary, while they stand: version 173)
        if (this.merc && !this.merc.hero.dead && !this.done) {
            list.push(this.merc.hero);
        }
        return list;
    }

    // The storeys and roofs above the plane go while anything up there hangs
    // over you (a roof, the way the client takes roofs off indoors, or an
    // eave or walkway), and while one a few tiles toward the camera (south,
    // unless it's been turned) would stand between you and it. They go at
    // once and come back only after you've been clear for a moment, so a walk
    // along a wall doesn't flick them.
    private updateFloors(dt: number): void {
        if (this.upperFloors.length === 0) {
            return;
        }
        let covered = false;
        const towardX = Math.sin(this.cameraYaw);
        const towardZ = Math.cos(this.cameraYaw);
        for (let tiles = 0; tiles <= 4 && !covered; tiles++) {
            covered = this.region.isCovered(this.px + towardX * tiles, this.pz + towardZ * tiles);
        }
        this.roofClearFor = covered ? 0 : this.roofClearFor + dt;
        const show = !covered && this.roofClearFor >= ROOF_RETURN_SECONDS;
        for (const floor of this.upperFloors) {
            floor.visible = show;
        }
    }

    private moveCircle(x: number, z: number, dx: number, dz: number, radius: number): [number, number] {
        let [nx, nz] = this.region.moveAxis(x, z, dx, 0, radius);
        [nx, nz] = this.region.moveAxis(nx, nz, 0, dz, radius);
        return [nx, nz];
    }

    private updatePlayer(dt: number): void {
        const p = this.player;
        if (this.done || this.dead) {
            this.overhead?.show("none", this.px, 0, this.pz);
        }
        if (this.done) {
            return;
        }
        if (this.dead) {
            this.deadFor += dt;
            // Down in a party: a mate standing can still come for you, until
            // the window's gone
            const help = this.coop !== undefined && this.othersRemain() && this.deadFor < this.reviveWindow();
            if (this.deadFor > DEATH_PAUSE && !help) {
                this.finishSelf("died");
            }
            return;
        }
        this.attackCooldown -= dt;
        this.aiming -= dt;
        this.spec =Math.min(100, this.spec + SPEC_REGEN * this.specRate * dt);
        if (this.hurtFlash > 0) {
            this.hurtFlash -= dt;
            if (this.hurtFlash <= 0) {
                this.player.restore();
            }
        }
        let dx = 0;
        let dz = 0;
        if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) dz -= 1;
        if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) dz += 1;
        if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) dx -= 1;
        if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) dx += 1;
        dx += this.stick.x;
        dz += this.stick.z;
        // Up on the keys or the stick is away from the camera, however it's
        // turned (the turn of the camera's offset, done to the way)
        if (this.cameraYaw !== 0) {
            const cos = Math.cos(this.cameraYaw);
            const sin = Math.sin(this.cameraYaw);
            [dx, dz] = [dx * cos + dz * sin, dz * cos - dx * sin];
        }
        const moving = dx !== 0 || dz !== 0;
        const swinging = this.swingIn >= 0;
        if (moving) {
            this.movedAt = this.time;
        }

        // Catching your breath: only standing still, with nothing after you,
        // and only before the map wakes. After that it's food.
        const regenRate = this.petBuff?.regen ?? 1;
        // (a guest's copies of the enemies are never chasing: anything
        // roused near it is, version 154)
        const chased =
            this.coop?.role === "guest"
                ? this.enemies.some((e) => e.state !== "idle" && e.state !== "dead" && Math.hypot(e.x - this.px, e.z - this.pz) < GUEST_CHASED_NEAR)
                : this.chased;
        if (!chased && !moving && !this.awake && this.time - this.lastHurt > REGEN_DELAY / regenRate && this.hp < this.maxHp) {
            this.regen += REGEN_PER_SECOND * regenRate * dt;
            if (this.regen >= 1) {
                this.hp = Math.min(this.maxHp, this.hp + Math.floor(this.regen));
                this.regen -= Math.floor(this.regen);
            }
        }
        // Poison ticks on until it's run its course or food settles it
        if (this.poisonTicks > 0) {
            this.poisonIn -= dt;
            if (this.poisonIn <= 0) {
                this.poisonIn = POISON_INTERVAL;
                this.poisonTicks--;
                this.hurtPlayer(POISON, 1, "melee", true, Math.max(2, Math.round(this.maxHp * POISON_SHARE)));
            }
        }

        // Moving never waits for a swing, so you can fight on the move or get
        // away; the swing's animation just plays over the run
        if (moving && this.extracting <= 0) {
            const len = Math.hypot(dx, dz);
            dx /= len;
            dz /= len;
            const speed = this.speed();
            [this.px, this.pz] = this.moveCircle(this.px, this.pz, dx * speed * dt, dz * speed * dt, COLLISION_RADIUS);
            if (!swinging) {
                this.facing = Math.atan2(dx, dz);
                p.play("run", { speed: RUN_CLIP_SPEED });
            }
        } else if (!swinging) {
            p.play("idle");
        }

        // Swinging: the hit lands part way through the animation
        if (swinging) {
            this.swingIn -= dt;
            if (this.swingIn < 0) {
                this.landSwing();
            }
        }

        // The weapon fires on its own at anything in its range that's after
        // you (a passive chicken or imp minding its own business is left
        // be); Space, a click or a tap swings regardless, at anything
        // A press while the weapon's still recovering waits a moment for it
        // (version 98: it was dropped, so a tap between swings did nothing)
        if (this.wantAttack) {
            this.attackAsked = ATTACK_BUFFER;
            this.wantAttack = false;
        }
        const asked = this.attackAsked > 0;
        if (this.attackCooldown <= 0 && !swinging) {
            if (asked || this.nearestEnemy(this.stats.range, true, false)) {
                this.beginSwing(asked);
                this.attackAsked = 0;
            }
        }
        this.attackAsked = Math.max(0, this.attackAsked - dt);

        const groundY = this.groundY(this.px, this.pz);
        p.root.position.set(this.px, groundY, this.pz);
        p.root.rotation.y = this.facing;
        const top = groundY + p.height * this.character.size;
        if (this.crown) {
            // The sheet's bottom (the word) a little over the head
            this.crown.position.set(this.px, top + 0.12 + CROWN_SHEET_HEIGHT / 2, this.pz);
            this.crown.visible = !this.dead;
        }
        // The protection's icon over the head, over the crown if there's one
        this.overhead ??= new Overhead(this.scene);
        this.overhead.show(this.protect, this.px, top + 0.12 + (this.crown ? CROWN_SHEET_HEIGHT + 0.04 : 0), this.pz);
        this.reveal();
    }

    // The pet keeps a step behind and to one side, walking when you do;
    // left far behind, or stuck on something, it catches up by itself
    private updatePet(dt: number): void {
        const pet = this.pet;
        if (!pet) {
            return;
        }
        pet.actor.mixer.update(dt);
        const sin = Math.sin(this.facing);
        const cos = Math.cos(this.facing);
        const tx = this.px - sin * PET_FOLLOW + cos * 0.5;
        const tz = this.pz - cos * PET_FOLLOW - sin * 0.5;
        const dx = tx - pet.x;
        const dz = tz - pet.z;
        const dist = Math.hypot(dx, dz);
        if (dist > PET_LEASH || pet.stuck > 2) {
            const open = this.region.fits(tx, tz, 0.15);
            pet.x = open ? tx : this.px;
            pet.z = open ? tz : this.pz;
            pet.stuck = 0;
        } else if (dist > 0.3) {
            const step = Math.min(dist, Math.max(this.speed(), dist * 2) * dt);
            const [nx, nz] = this.moveCircle(pet.x, pet.z, (dx / dist) * step, (dz / dist) * step, 0.15);
            pet.stuck = Math.hypot(nx - pet.x, nz - pet.z) < step * 0.3 && dist > 2 ? pet.stuck + dt : 0;
            pet.x = nx;
            pet.z = nz;
            pet.facing = Math.atan2(dx, dz);
            play(pet.actor, "walk");
        } else {
            play(pet.actor, "idle");
        }
        pet.actor.root.position.set(pet.x, this.groundY(pet.x, pet.z), pet.z);
        pet.actor.root.rotation.y = pet.facing;
    }

    // The nearest enemy in reach, and in line of sight; with passive false,
    // not a passive one that's still minding its own business
    private nearestEnemy(range: number, anyDirection: boolean, passive = true): Enemy | undefined {
        let best: Enemy | undefined;
        let bestDist = Infinity;
        for (const e of this.enemies) {
            if (e.state === "dead" || (!passive && e.def.passive && e.state === "idle")) {
                continue;
            }
            const dist = Math.hypot(e.x - this.px, e.z - this.pz) - e.def.radius;
            if (dist > range || dist >= bestDist) {
                continue;
            }
            // Not through a wall
            if (!this.region.lineOfSight(this.px, this.pz, e.x, e.z)) {
                continue;
            }
            if (!anyDirection) {
                const angle = Math.atan2(e.x - this.px, e.z - this.pz);
                let diff = Math.abs(angle - this.facing) % (Math.PI * 2);
                diff = diff > Math.PI ? Math.PI * 2 - diff : diff;
                if (diff > Math.PI * 0.6) {
                    continue;
                }
            }
            best = e;
            bestDist = dist;
        }
        return best;
    }

    // A swing: on its own (at what's after you) or asked for (at anything)
    private beginSwing(asked = false): void {
        const stats = this.stats;
        // A bow shoots nothing without arrows in the pack, and a staff casts
        // nothing it can't (its tier) or hasn't the runes for, and a thrown
        // weapon needs another of it packed to throw (version 146)
        const casting = stats.weapon?.uses === "runes" ? this.castingSpell() : undefined;
        const why =
            stats.weapon?.uses === "arrows" && !this.ammo()
                ? "You're out of arrows."
                : stats.weapon?.thrown && this.count(stats.weapon.id) === 0
                  ? `You're out of ${pluralName(stats.weapon.name)}: the one in your hand is your last.`
                  : casting && !casting.spell
                    ? casting.why
                    : undefined;
        if (why) {
            if (this.time - this.ammoMessageAt > 3) {
                this.ammoMessageAt = this.time;
                this.hooks.onMessage(why);
            }
            this.attackCooldown = 1;
            return;
        }
        // Face whatever is in reach, even behind
        const target = this.nearestEnemy(stats.range, true, asked);
        if (target) {
            this.facing = Math.atan2(target.x - this.px, target.z - this.pz);
        }
        // A spell is cast with its own animation and sound, OSRS's (version
        // 108); anything else swings as the weapon does
        const spell = casting?.spell;
        const clip = spell?.clip ?? stats.weapon?.attackClip ?? "attack";
        const length = this.player.play(clip, { once: true, speed: Math.max(1, 0.7 / stats.speed) });
        this.swingIn = Math.min(0.3, length * 0.5);
        this.swingTarget = target;
        // The swing lands with the weapon it began with (version 154: a
        // weapon swapped in before it landed hit with its own numbers on the
        // first one's quicker swing)
        this.swingStats = stats;
        this.attackCooldown = stats.speed;
        if (stats.ranged) {
            this.aiming = Math.min(AIM_SECONDS, stats.speed * 0.5);
        }
        this.attacks++;
        // A god spell sounds only where it lands
        const sound = spell ? spell.castSound : stats.sound;
        if (sound) {
            playSound(`sounds/${sound}`, 0.4);
        }
        // A spell's own light on the caster as it's cast
        if (casting?.spell?.cast !== undefined && target) {
            void this.burst(casting.spell.cast, this.px, this.pz);
        }
    }

    // Whether this swing or shot finds an enemy (combat.ts's hitChance):
    // a special always does
    private lands(e: Enemy, special: boolean): boolean {
        return special || this.rng() < hitChance(this.stats.weapon?.tier ?? 1, this.world.tier, !!e.def.boss);
    }

    // What a melee swing landing now reaches: everything in front within
    // reach and sight, and what it was aimed at
    private inSwing(stats: GearStats): Enemy[] {
        return this.enemies.filter((e) => {
            if (e.state === "dead") {
                return false;
            }
            const dist = Math.hypot(e.x - this.px, e.z - this.pz) - e.def.radius;
            if (dist > stats.range || !this.region.lineOfSight(this.px, this.pz, e.x, e.z)) {
                return false;
            }
            const angle = Math.atan2(e.x - this.px, e.z - this.pz);
            let diff = Math.abs(angle - this.facing) % (Math.PI * 2);
            diff = diff > Math.PI ? Math.PI * 2 - diff : diff;
            return diff <= Math.PI * 0.45 || e === this.swingTarget;
        });
    }

    private landSwing(): void {
        this.swingIn = -1;
        const stats = this.swingStats ?? this.stats;
        this.swingStats = undefined;
        // A special lands more, or harder, and may heal; a full Barrows set
        // has its say too (SET_EFFECTS). With nothing to hit it waits for
        // the next swing, the bar kept (version 154: it was spent on air)
        const struck = stats.ranged ? [] : this.inSwing(stats);
        const aimed = stats.ranged ? this.swingTarget && this.swingTarget.state !== "dead" : struck.length > 0;
        const special = aimed ? this.takeSpecial(stats) : undefined;
        const hits = special?.hits ?? 1;
        const set = stats.set;
        const roll = () => {
            // Verac's never rolls low; Dharok's hits harder the lower you are
            let hit = set === "verac" ? stats.damage * (0.85 + this.rng() * 0.15) : playerHit(stats, this.rng());
            if (set === "dharok") {
                hit *= 1 + (1 - this.hp / this.maxHp);
            }
            // A pet may hold the roll off the floor
            if (this.petBuff?.floor) {
                hit = Math.max(hit, stats.damage * this.petBuff.floor);
            }
            return Math.max(1, Math.round(hit * (special?.power ?? 1)));
        };
        if (stats.ranged) {
            const target = this.swingTarget && this.swingTarget.state !== "dead" ? this.swingTarget : undefined;
            if (target) {
                // Each shot takes an arrow or a rune (a special's shots the
                // one), and the kind decides the hit and the look of the
                // shot (ammoScale; a crossbow shoots a bolt whatever's packed)
                let look: Look = { projectile: stats.weapon?.projectile, impact: stats.weapon?.impact };
                let scale = 1;
                if (stats.weapon?.uses === "runes") {
                    // A spell: its runes (OSRS's costs, less what the staff
                    // and shield give), its hit and its look (spells.ts)
                    const { spell } = this.castingSpell();
                    if (!spell) {
                        return;
                    }
                    scale = spellScale(stats.weapon, spell);
                    look = { projectile: spell.projectile, impact: spell.impact, spell, maxHit: Math.max(1, Math.round(stats.damage * scale)) };
                    this.lastSpell = spell;
                    if (!this.ammoSaved("Apprentice")) {
                        for (const rune of spellCost(spell, this.runesGiven())) {
                            removeItem(this.inventory, rune.id, rune.n);
                        }
                        this.hooks.onChanged();
                    }
                } else if (stats.weapon?.thrown) {
                    // A throw: another of the same from the pack (version 146)
                    if (this.count(stats.weapon.id) === 0) {
                        return;
                    }
                    if (!this.ammoSaved()) {
                        removeItem(this.inventory, stats.weapon.id, 1);
                        this.hooks.onChanged();
                    }
                } else if (stats.weapon?.uses) {
                    const ammo = this.ammo();
                    if (!ammo) {
                        return;
                    }
                    const kind = getItem(ammo.id);
                    scale = ammoScale(stats.weapon, kind);
                    if (stats.weapon.projectile !== BOLT) {
                        look = { projectile: kind.projectile ?? look.projectile, impact: kind.impact ?? look.impact };
                    }
                    if (!this.ammoSaved("Archer")) {
                        removeItem(this.inventory, ammo.id, 1);
                        this.hooks.onChanged();
                    }
                }
                // A shot that misses (version 150) flies all the same, for a 0
                const shot = () => (this.lands(target, !!special) ? Math.max(1, Math.round(roll() * scale)) : 0);
                // A healing special heals when its shot lands (version 150)
                const specLook = special?.heal ? { ...look, heal: special.heal } : look;
                for (let i = 0; i < hits; i++) {
                    void this.shoot(target, shot(), specLook);
                }
                // Karil's bolts: one in three hits again at half
                if (set === "karil" && this.rng() < 1 / 3) {
                    const again = shot();
                    void this.shoot(target, again > 0 ? Math.max(1, Math.round(again / 2)) : 0, look);
                }
            }
            return;
        }
        // Melee hits everything in front within reach. What's dealt is what
        // came off (version 154: an armoured elite's six tenths, not the
        // whole hit, for a heal)
        let dealt = 0;
        for (const e of struck) {
            for (let i = 0; i < hits && e.hp > 0 && e.state !== "dead"; i++) {
                const damage = this.lands(e, !!special) ? roll() : 0;
                const before = e.hp;
                this.damageEnemy(e, damage);
                dealt += Math.max(0, before - e.hp);
            }
        }
        if (this.dead) {
            return;
        }
        if (special?.heal && dealt > 0) {
            this.hp = Math.min(this.maxHp, this.hp + Math.round(dealt * special.heal));
        }
        // Guthan's: a quarter of what's dealt comes back
        if (set === "guthan" && dealt > 0) {
            this.hp = Math.min(this.maxHp, this.hp + Math.round(dealt * 0.25));
        }
    }

    // A hitsplat: the client's red square with the number, over whoever
    // took the hit, drifting up and fading; the client's green for poison
    private splat(x: number, z: number, height: number, value: number, poison = false): void {
        const material = new THREE.SpriteMaterial({
            map: this.splatTexture(value, poison),
            transparent: true,
            depthTest: false,
            toneMapped: false,
            fog: false,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.05, 0.7, 1);
        sprite.renderOrder = 20;
        const baseY = this.groundY(x, z) + height;
        sprite.position.set(x + (this.rng() - 0.5) * 0.3, baseY, z);
        this.scene.add(sprite);
        this.splats.push({ sprite, left: 1, baseY });
    }

    private splatTexture(value: number, poison = false): THREE.CanvasTexture {
        const key = poison ? `p${value}` : String(value);
        let texture = this.splatTextures.get(key);
        if (!texture) {
            const canvas = document.createElement("canvas");
            canvas.width = 96;
            canvas.height = 64;
            const ctx = canvas.getContext("2d")!;
            // A splat: a blob with jagged lobes round it, the lobes' sizes
            // from a fixed pattern so every splat is the same shape, and a
            // few drops flung off it
            const cx = 48;
            const cy = 32;
            const lobes = [1.0, 0.78, 1.18, 0.84, 1.08, 0.74, 1.22, 0.8, 1.02, 0.76, 1.15, 0.82, 1.06, 0.72, 1.2, 0.86];
            const outline = (scale: number) => {
                ctx.beginPath();
                for (let i = 0; i <= lobes.length; i++) {
                    const a = (i / lobes.length) * Math.PI * 2;
                    const r = lobes[i % lobes.length] * scale;
                    const x = cx + Math.cos(a) * 30 * r;
                    const y = cy + Math.sin(a) * 19 * r;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
            };
            // A miss is a blue 0, as in OSRS (version 150)
            const miss = value === 0 && !poison;
            ctx.fillStyle = poison ? "#0a3a0a" : miss ? "#06143a" : "#4a0000";
            outline(1.08);
            ctx.fill();
            ctx.fillStyle = poison ? "#2a9a1a" : miss ? "#2050c8" : "#c01010";
            outline(1);
            ctx.fill();
            for (const [dx, dy, r] of [
                [34, -22, 3.5],
                [-37, 14, 3],
                [30, 20, 2.5],
                [-31, -17, 2],
                [41, 2, 2],
            ]) {
                ctx.beginPath();
                ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = "#fff";
            ctx.font = "26px 'OSRS Bold', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.strokeText(String(value), cx, cy + 1);
            ctx.fillText(String(value), cx, cy + 1);
            texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            this.splatTextures.set(key, texture);
            this.disposables.push(texture);
        }
        return texture;
    }

    private updateSplats(dt: number): void {
        for (let i = this.splats.length - 1; i >= 0; i--) {
            const s = this.splats[i];
            s.left -= dt;
            s.sprite.position.y = s.baseY + (1 - s.left) * 0.6;
            (s.sprite.material as THREE.SpriteMaterial).opacity = Math.min(1, s.left * 3);
            if (s.left <= 0) {
                this.scene.remove(s.sprite);
                (s.sprite.material as THREE.SpriteMaterial).dispose();
                this.splats.splice(i, 1);
            }
        }
    }

    // An arrow, bolt or spell on its way: the spot animation of what's
    // shot (the arrows' or runes' own, else the weapon's), flying at the
    // target (the party sees it too). A chinchompa's burst spreads.
    private shoot(target: Enemy, damage: number, look: Look): Promise<void> {
        const weapon = this.stats.weapon;
        const y = this.groundY(this.px, this.pz) + 1.0;
        // The party hears of the spell too, to cast it and hear it as it was
        const s = look.spell?.id;
        if (this.coop?.role === "host") {
            this.coop.send({ k: "pshot", from: this.coop.me, u: target.uid, p: look.projectile, i: look.impact, s } satisfies DownMessage);
        } else if (this.coop?.role === "guest") {
            this.coop.send({ k: "shot", u: target.uid, p: look.projectile, i: look.impact, s } satisfies UpMessage);
        }
        return this.launch(this.px, this.pz, y, look.projectile, {
            target,
            damage,
            impact: look.impact,
            splash: weapon?.splash,
            spell: look.spell,
            maxHit: look.maxHit,
            hitSound: look.spell?.hitSound,
            heal: look.heal,
        });
    }

    // One ball for every shot with no look of its own (version 154: each
    // shot made a new one, kept till the run ended)
    private ball?: { geometry: THREE.SphereGeometry; material: THREE.MeshBasicMaterial };

    private ballProjectile(): THREE.Object3D {
        if (!this.ball) {
            this.ball = { geometry: new THREE.SphereGeometry(0.12, 6, 6), material: new THREE.MeshBasicMaterial({ color: 0xdddddd }) };
            this.disposables.push(this.ball.geometry, this.ball.material);
        }
        return new THREE.Mesh(this.ball.geometry, this.ball.material);
    }

    // A mage's spell or an archer's arrow: a spell's cast graphic on the
    // caster, and the shot itself flying at a hero from about hand height
    private async cast(e: Enemy, t: Hero): Promise<void> {
        const magic = e.def.shoots;
        if (!magic) {
            return;
        }
        // One that alternates throws an arrow between its spells
        const style: ProtectStyle = e.def.alternates ? (e.style ?? magic.style) : magic.style;
        const projectile = style === "ranged" && magic.style !== "ranged" ? 10 : magic.projectile;
        const impact = style === "magic" ? magic.impact : undefined;
        const castAnim = style === "magic" ? magic.cast : undefined;
        const y = this.groundY(e.x, e.z) + e.actor.height * (e.def.scale ?? 1) * 0.6;
        if (this.coop?.role === "host") {
            this.coop.send({ k: "shot", x: round2(e.x), z: round2(e.z), y: round2(y), to: t.id, p: projectile, i: impact, c: castAnim } satisfies DownMessage);
        }
        // A shadow spell takes a share off what it throws (version 107)
        await this.launch(e.x, e.z, y, projectile, { hero: t, from: e.def, style, impact, cast: castAnim, scale: this.weakScale(e) });
    }

    // A mate's spell, from its shot's word (version 108): they cast it with
    // its own animation, and its sound is heard where they are
    private mateSpell(mate: Mate, id: unknown): SpellDef | undefined {
        const spell = typeof id === "string" ? SPELL_BY_ID.get(id) : undefined;
        if (spell) {
            mate.castWith(spell.clip);
            if (spell.castSound !== undefined) {
                this.hear(`sounds/${spell.castSound}`, mate.x, mate.z, 0.4);
            }
        }
        return spell;
    }

    // What a shadow spell leaves of an enemy's hits (version 107)
    private weakScale(e: Enemy): number {
        return e.weakLeft > 0 ? 1 - e.weak : 1;
    }

    // Something flying from here: a spot animation (or a plain ball when
    // there's none) at an enemy, at a hero, or just for show
    private async launch(
        x: number,
        z: number,
        y: number,
        projectile: number | undefined,
        at: {
            target?: Enemy;
            hero?: Hero;
            from?: EnemyDef;
            style?: ProtectStyle;
            damage?: number;
            impact?: number;
            cast?: number;
            visual?: boolean;
            splash?: boolean;
            spell?: SpellDef;
            maxHit?: number;
            scale?: number;
            hitSound?: number;
            heal?: number;
        },
    ): Promise<void> {
        if (at.cast !== undefined) {
            void this.burst(at.cast, x, z);
        }
        const actor = projectile !== undefined ? await createActor("spotanims", projectile).catch(() => undefined) : undefined;
        if (this.ended) {
            return;
        }
        let root: THREE.Object3D;
        if (actor) {
            root = actor.root;
            if (actor.clips.size > 0) {
                play(actor, "play");
                this.effects.push({ actor, left: 60 });
            }
        } else if (projectile === undefined && at.impact !== undefined) {
            // A spell with no flight (a burst, a barrage): nothing to see on
            // the way, only where it lands (version 107)
            root = new THREE.Group();
        } else {
            root = this.ballProjectile();
        }
        root.position.set(x, y, z);
        this.scene.add(root);
        this.projectiles.push({
            root,
            x,
            z,
            y,
            target: at.target,
            hero: at.hero,
            from: at.from,
            style: at.style,
            damage: at.damage ?? 0,
            impact: at.impact,
            visual: at.visual,
            splash: at.splash,
            spell: at.spell,
            maxHit: at.maxHit,
            scale: at.scale,
            hitSound: at.hitSound,
            heal: at.heal,
        });
    }

    // A hit on an enemy by a hero (this player unless said). On a guest the
    // host decides: the hit goes up to it, and shows here meanwhile. Set
    // effects: Ahrim's slows what a spell hits, Torag's puts another half
    // second between its attacks.
    private damageEnemy(e: Enemy, damage: number, by: Hero = this.self, effects: HitEffects = {}): void {
        if (by.me && !effects.poisoned) {
            effects = { ...effects, stall: this.stats.set === "torag" };
        }
        // Under the ground, nothing reaches it (a signature move)
        if (e.burrowed !== undefined && e.burrowed > 0) {
            return;
        }
        // Holy water's blessing (version 166): double on the undead and
        // vampyres (by name, which a guest's copy has too)
        if (by.me && damage > 0 && this.boosts.holy > 0 && HOLY_BANE.test(e.def.name.toLowerCase().replace(/ /g, "_"))) {
            damage *= 2;
        }
        // A miss (version 150) does nothing but rouse it: no freeze, no
        // poison, no slow, as a splashed spell in OSRS
        if (damage <= 0) {
            effects = {};
        }
        if (this.coop?.role === "guest") {
            this.coop.send({
                k: "hit",
                u: e.uid,
                d: damage,
                slow: effects.slow ? 1 : undefined,
                stall: effects.stall ? 1 : undefined,
                frz: effects.freeze,
                wk: effects.weaken,
                psn: effects.poison,
            } satisfies UpMessage);
            e.myHitAt = this.time;
        }
        // An armoured elite shrugs off some of it
        if (e.trait === "armoured" && damage > 0) {
            damage = Math.max(1, Math.round(damage * 0.6));
        }
        e.hp = Math.max(0, e.hp - damage);
        e.flash = 0.12;
        e.barShown = BAR_SECONDS;
        e.lastHurtAt = this.time;
        // (yours: the mercenary's first choice, version 177; and its grudge
        // and the fight's noise, version 178)
        if (by.me && !effects.poisoned) {
            this.playerFoe = e;
            this.playerFoeAt = this.time;
        }
        if (damage > 0 && !effects.poisoned) {
            e.lastHurtBy = by;
            e.grudgeAt = this.time;
            this.makeNoise(e.x, e.z, NOISE_FIGHT);
        }
        tint(e.actor, new THREE.Color(1.6, 0.6, 0.6));
        this.splat(e.x, e.z, e.actor.height * (e.def.scale ?? 1) * 0.7, damage, effects.poisoned);
        if (this.coop?.role === "guest") {
            // Its fall is the host's to call
            this.hear(npcSound(e.def.npcId, "hit"), e.x, e.z, 0.4);
            return;
        }
        this.rouse(e);
        if (effects.stall) {
            e.cooldown += 0.5;
        }
        // Hit from out of any swing's reach, a melee enemy charges (version
        // 147): a bow or a spell can't keep it off for ever
        if (!e.def.boss && !e.def.shoots && !effects.poisoned && Math.hypot(by.x - e.x, by.z - e.z) - e.def.radius > RILE_FROM) {
            e.riled = RILE_SECONDS;
            if (!this.toldRiled && by.me) {
                this.toldRiled = true;
                this.hooks.onMessage(`Shot from afar, the ${e.def.name.toLowerCase()} charges at you!`);
            }
        }
        if (effects.slow) {
            e.slow = 4;
        }
        // Ancient Magicks (version 107): ice holds it (a boss shrugs that
        // off), shadow weakens its hits, smoke poisons it (a fresh poison
        // only if it's stronger than what's in it). Version 150: a freeze
        // isn't topped up while it holds, nor laid again until FREEZE_IMMUNE
        // after it thaws, so ice can't hold one for good
        if (effects.freeze && !e.def.boss && e.frozen <= 0 && e.thawed <= 0) {
            e.frozen = effects.freeze;
        }
        if (effects.weaken) {
            e.weak = Math.max(e.weakLeft > 0 ? e.weak : 0, effects.weaken);
            e.weakLeft = WEAKEN_SECONDS;
        }
        if (effects.poison && (e.poisonLeft <= 0 || effects.poison >= e.poisonHit)) {
            e.poisonHit = effects.poison;
            e.poisonLeft = POISON_HITS;
            e.poisonNext = POISON_EVERY;
            e.poisonBy = by;
        }
        if (e.hp <= 0) {
            this.killEnemy(e, by);
            return;
        }
        this.hear(npcSound(e.def.npcId, "hit"), e.x, e.z, 0.4);
        // Low, an ordinary enemy runs for help, once
        if (!e.def.boss && !e.def.champion && !e.def.superior && !e.fled && e.hp < e.def.hp * FLEE_HP) {
            e.fled = true;
            e.state = "flee";
            e.fleeLeft = FLEE_SECONDS;
            e.noIdleUntil = this.time + FLEE_PERSIST;
            if (this.time - this.fleeMessageAt > 3) {
                this.fleeMessageAt = this.time;
                this.hooks.onMessage(`The ${e.def.name.toLowerCase()} runs for help!`);
            }
        }
    }

    private killEnemy(e: Enemy, by: Hero): void {
        // A second form: up again, quicker, greener, with most of its health
        if (e.def.secondForm && !e.reborn) {
            e.reborn = true;
            e.hp = Math.round(e.def.hp * SECOND_FORM_SHARE);
            // Quicker than it was, enraged or not (version 154: 0.7 of its
            // interval came after the enraged 0.65, so it slowed)
            e.interval = e.def.attackInterval * (e.enraged ? 0.55 : 0.7);
            e.tint = new THREE.Color(0.8, 1.25, 0.8);
            tint(e.actor, e.tint);
            e.actor.root.scale.setScalar((e.def.scale ?? 1) * 1.15);
            e.flash = 0;
            this.sendTint(e, 2);
            this.announce(`${e.def.name} sheds its shell and rises again!`);
            return;
        }
        e.state = "dead";
        e.hp = 0;
        // The kill is the killer's; the boss is everyone's
        if (by.me) {
            this.kills++;
            if (e.def.champion) {
                this.championKills++;
            }
            if (e.def.superior) {
                this.superiorKills++;
            }
            if (this.stats.ranged) {
                this.rangedKills++;
            }
            this.killedOne(e.def);
        }
        if (e.def.boss) {
            this.bossKills++;
            // With enough of its lords slain, the castle's king wakes
            // (version 172)
            if (this.world.id === CASTLE_ID && e.def.id !== KING_ID && this.bossKills >= KING_AFTER && !this.kingWoke) {
                this.wakeKing();
            }
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "kill", u: e.uid, by: by.id, boss: e.def.boss ? 1 : undefined, champion: e.def.champion ? 1 : undefined } satisfies DownMessage);
        }
        tint(e.actor, new THREE.Color(1, 1, 1));
        play(e.actor, "death", { once: true });
        this.hear(npcSound(e.def.npcId, "death"), e.x, e.z, 0.5);
        // An elite was worth twice the coins; an ordinary enemy only
        // sometimes carried any
        // (and a pet's share, for whoever walks over them)
        const coins = Math.round(
            randInt(this.rng, e.def.coins[0], e.def.coins[1]) * (e.trait ? 2 : 1) * (1 + (this.petBuff?.coins ?? 0)) * this.threat.coins,
        );
        if (e.def.boss || e.def.champion || e.def.superior || this.rng() < COIN_DROP_CHANCE) {
            this.dropPickup(COINS, coins, e.x, e.z);
        }
        // The Depths' mini bosses (version 157, as the user asked): now and
        // then where one of its lesser kind falls, a superior rises and goes
        // for whoever's nearest, as in OSRS
        const superior = this.world.superiors?.[e.def.id.replace(/:champion$/, "")];
        // (twice as often under the restless dead's curse: version 172)
        if (superior && this.superiorsRisen < SUPERIOR_MAX && this.rng() < (this.curse === "restless" ? 2 : 1) / SUPERIOR_ONE_IN) {
            this.superiorsRisen++;
            const at = { x: e.x, z: e.z };
            void this.spawnEnemy(superior, at).then((s) => {
                s.state = "chase";
                s.noIdleUntil = this.time + SUPERIOR_PERSIST;
            });
            // Its roar brings what's near (version 159)
            this.wakeNear(at.x, at.z, SUPERIOR_ROUSE);
            this.announce(`A superior foe has appeared: ${superior.name}!`);
        }
        // A tiny one in the Depths (EnemyDef's tiny, version 160) drops
        // tier 1 whatever the depth: gear, food, arrows and runes
        const tier = e.def.tiny ? 1 : this.world.tier;
        const loot = e.def.tiny ? TINY_LOOT : this.world.lootTiers;
        if (this.rng() < e.def.foodChance) {
            const food = [315, 2309, 333, 329, 379][Math.min(4, Math.floor(this.rng() * (tier + 1)))];
            this.dropPickup(food, 1, e.x + 0.3, e.z + 0.3);
        }
        if (e.def.boss) {
            // The Forgotten King's own hoard (version 172): pieces as the
            // golden chest gives them, purple and gold among them, and a purse
            if (e.def.id === KING_ID) {
                this.kingSlain = true;
                for (let i = 0; i < KING_GEAR; i++) {
                    this.dropGear(this.world.lootTiers, e.x + (i - 1) * 0.5, e.z - 0.3, PRIZE_BOSS_CHEST, 0, "boss");
                }
                this.dropPickup(COINS, Math.round(randInt(this.rng, 1000, 2000) * Math.pow(2.2, this.world.tier - 1) * this.threat.coins), e.x, e.z + 0.4);
                this.announce("The Forgotten King falls, and his hoard spills across the great hall.");
            }
            this.revealNearestExit();
            // The golden chest's key, every time
            this.dropPickup(BOSS_KEY, 1, e.x - 0.3, e.z + 0.3);
            this.hooks.onMessage(`${e.def.name} falls and drops the golden chest's key. The nearest way out is ${this.exitDirection()}.`);
            if (this.world.bosses) {
                this.empowerBosses();
            }
            // Now and then something small is left behind, if you haven't
            // got one from here already
            // (none from the Depths: pets are a map's own boss's, and the
            // Depths' bosses change every run)
            const pets = this.carry.pets ?? [];
            if (!this.world.bosses && !pets.includes(this.world.id) && !this.petFound && this.rng() < 1 / PET_ONE_IN) {
                this.petFound = this.world.id;
                this.hooks.onMessage(`Something small crawls out from under ${e.def.name}. It seems to like you.`);
            }
            // A Depths boss's own pet (version 161), very rarely, by the
            // boss's id: one of each of the fourteen to find
            if (this.world.bosses && by.me && !pets.includes(e.def.id) && !this.petFound && this.rng() < 1 / DEPTHS_PET_ONE_IN) {
                this.petFound = e.def.id;
                this.hooks.onMessage(`Something small crawls out of ${e.def.name}'s lair after you. It seems to like you.`);
            }
            return;
        }
        // Arrows or runes, for whoever shoots: one kill in four, what this
        // player's weapon takes if it was theirs (dropOwnAmmo), else a few
        // arrows of the map's tier, or a handful of elemental runes or a few
        // of the tier's catalyst (version 106: spells take OSRS's costs)
        if (this.rng() < AMMO_DROP_CHANCE && !(by.me && this.dropOwnAmmo(e.x + 0.3, e.z - 0.3))) {
            if (this.rng() < 0.5) {
                const kind = ammoOfTier("arrows", tier, this.rng());
                this.dropPickup(kind, randInt(this.rng, 3, 6), e.x + 0.3, e.z - 0.3);
            } else {
                const runes = runeDrop(tier, this.rng(), this.rng(), (lo, hi) => randInt(this.rng, lo, hi));
                this.dropPickup(runes.id, runes.count, e.x + 0.3, e.z - 0.3);
            }
        }
        // A clue scroll, once a run
        if (!this.clueDropped && this.rng() < CLUE_CHANCE) {
            this.clueDropped = true;
            this.dropPickup(CLUE_SCROLL, 1, e.x - 0.3, e.z + 0.3);
        }
        // A superior carries two pieces of gear, a champion's prize each (and
        // the first to fall, the brimstone chest's key: version 161)
        if (e.def.superior) {
            this.dropGear(this.world.lootTiers, e.x - 0.3, e.z - 0.3, PRIZE_FULL);
            this.dropGear(this.world.lootTiers, e.x + 0.3, e.z - 0.3, PRIZE_FULL);
            if (!this.brimstoneDropped && this.chests.some((c) => c.room === "brimstone" && !c.opened)) {
                this.brimstoneDropped = true;
                this.dropPickup(BRIMSTONE_KEY, 1, e.x, e.z + 0.4);
            }
            this.announce(`The ${e.def.name.toLowerCase()} falls, and leaves its hoard.`);
            return;
        }
        // A champion always carried a piece of gear, the way a chest gives it
        if (e.def.champion) {
            this.dropGear(loot, e.x - 0.3, e.z - 0.3, PRIZE_FULL);
            if (e.key) {
                this.dropPickup(VAULT_KEY, 1, e.x + 0.3, e.z + 0.4);
                this.announce(`The ${e.def.name.toLowerCase()} drops its prize, and a crystal key.`);
            } else {
                this.announce(`The ${e.def.name.toLowerCase()} drops its prize.`);
            }
            return;
        }
        // Now and then one was carrying more: a purse, or a piece of gear the
        // way a chest gives it
        const roll = this.rng();
        if (roll < 0.02) {
            this.dropGear(loot, e.x - 0.3, e.z - 0.3);
            this.announce(`The ${e.def.name.toLowerCase()} was carrying something.`);
        } else if (roll < 0.02 + PURSE_CHANCE) {
            this.dropPickup(COINS, coins * randInt(this.rng, 4, 8), e.x - 0.3, e.z + 0.3);
        } else if (roll < 0.02 + PURSE_CHANCE + PRAYER_POTION_CHANCE * (this.world.bosses ? DEPTHS_SUPPLIES : 1)) {
            this.dropPickup(2434, 1, e.x - 0.3, e.z - 0.3);
        }
    }

    // A piece of gear from a roll over tiers, dropped here; a tier's prize
    // only where prizes are given (the boss's chest, the vault, a champion,
    // a clue casket), at the weight they're given there. Purple and gold
    // only from a boss's golden chest (`from` "boss"; version 158): anything
    // else gives FOUND_TIER_MAX at best, but the crystal chest ("crystal"),
    // a piece of which is purple now and then whatever the map
    private dropGear(
        tiers: { tier: number; weight: number }[],
        x: number,
        z: number,
        prizes = 0,
        scatter?: number,
        from?: "boss" | "crystal",
    ): void {
        // Away from a boss's chest the tiers past FOUND_TIER_MAX are left out
        // of the roll (the rest keep their weights to each other), or it's
        // FOUND_TIER_MAX itself where that leaves none (a four or five star
        // map's)
        if (from !== "boss") {
            const allowed = tiers.filter((t) => t.tier <= FOUND_TIER_MAX);
            tiers = allowed.length > 0 ? allowed : [{ tier: FOUND_TIER_MAX, weight: 1 }];
        }
        let roll = this.rng() * tiers.reduce((n, t) => n + t.weight, 0);
        let pick = tiers[tiers.length - 1].tier;
        for (const t of tiers) {
            roll -= t.weight;
            if (roll <= 0) {
                pick = t.tier;
                break;
            }
        }
        if (from === "crystal" && this.rng() < CRYSTAL_PURPLE_CHANCE) {
            pick = FOUND_TIER_MAX + 1;
        }
        // A threat level's better odds at a prize (version 150)
        const item = rollGear(this.rng, pick, Math.min(1, prizes * this.threat.prizes));
        if (item) {
            // A thrown weapon comes as a bundle (version 146)
            this.dropPickup(item.id, item.thrown ? randInt(this.rng, THROWN_FOUND[0], THROWN_FOUND[1]) : 1, x, z, scatter);
        }
    }

    // Who an enemy goes for: the nearest hero standing, with a little
    // loyalty to the one it's after already. Version 178: once it's up, a
    // hero that's bleeding draws it (BLOOD_DRAW), so does the one that just
    // hit it (GRUDGE_DRAW), and a shooter's drawn to who it can see
    private targetFor(e: Enemy, heroes: Hero[]): Hero | undefined {
        let best: Hero | undefined;
        let bestDist = Infinity;
        const up = e.state !== "idle";
        for (const h of heroes) {
            // (a sellsword draws them their way: version 173)
            const draw = h === this.merc?.hero ? this.merc.def.draw : 0;
            let d = Math.hypot(h.x - e.x, h.z - e.z) - (h === e.target ? 2 : 0) - draw;
            if (up) {
                if (h.hp < h.maxHp * BLOOD_SHARE) {
                    d -= BLOOD_DRAW;
                }
                if (e.lastHurtBy === h && this.time - e.grudgeAt < GRUDGE_SECONDS) {
                    d -= GRUDGE_DRAW;
                }
                if (e.def.shoots && this.region.lineOfSight(e.x, e.z, h.x, h.z)) {
                    d -= SIGHT_DRAW;
                }
            }
            if (d < bestDist) {
                best = h;
                bestDist = d;
            }
        }
        return best;
    }

    // Something heard (version 178): what's idle within earshot, beyond
    // what the noise rouses outright, comes to look, down a field to where
    // it was, and stands there a while before going back to its business.
    // One sound at a time: a new one near the last keeps it fresh, and the
    // field isn't laid again within a moment of the last
    private makeNoise(x: number, z: number, radius: number): void {
        if (this.coop?.role === "guest" || this.ended) {
            return;
        }
        const n = this.noise;
        if (n && this.time < n.until && Math.hypot(n.x - x, n.z - z) < 4) {
            n.until = this.time + NOISE_SECONDS;
        } else if (!n || this.time >= n.until || this.time - this.noiseLaidAt > 1.5) {
            this.noise = { x, z, until: this.time + NOISE_SECONDS, flow: this.region.flowField({ x, z }) };
            this.noiseLaidAt = this.time;
        } else {
            return;
        }
        let lookers = 0;
        for (const e of this.enemies) {
            if (e.state !== "idle" || e.def.passive || e.def.boss || e.def.ghostly) {
                continue;
            }
            const d = Math.hypot(e.x - x, e.z - z);
            if (d < radius) {
                if (d > NOISE_CLOSE && e.curiousUntil <= this.time) {
                    lookers++;
                }
                e.curiousUntil = this.time + NOISE_SECONDS;
            }
        }
        if (lookers > 0 && !this.toldLookers) {
            this.toldLookers = true;
            this.announce("Something's heard that, and comes to look.");
        }
    }

    // Whether one's wise to the ground (version 178): an elite, a champion
    // or a superior steps round an armed spike trap; the rest blunder on
    private cunning(e: Enemy): boolean {
        return !!e.trait || !!e.def.champion || !!e.def.superior;
    }

    // Where in a ring round a hero a melee enemy stands (version 178): the
    // ones on them and near, in a set order, spread over the arc from
    // SURROUND_ARC degrees off the hero's front round to the same the other
    // side (the wider arc from four up), one alone to the side it favours
    private surroundAngle(e: Enemy, t: Hero): number {
        const ring: Enemy[] = [];
        for (const o of this.enemies) {
            if (o.state !== "dead" && o.state !== "idle" && o.target === t && !o.def.shoots && !o.def.boss && Math.hypot(o.x - t.x, o.z - t.z) < FLANK_RANGE) {
                ring.push(o);
            }
        }
        const n = ring.length;
        if (n <= 1) {
            return e.flank > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        ring.sort((a, b) => a.uid - b.uid);
        const i = Math.max(0, ring.indexOf(e));
        const from = (SURROUND_ARC[n <= 3 ? 0 : 1] * Math.PI) / 180;
        return from + (i * (Math.PI * 2 - from * 2)) / (n - 1);
    }

    private updateEnemies(dt: number): void {
        const heroes = this.heroes();
        this.flowAge += dt;
        if (this.flowAge > 0.25) {
            this.flows.clear();
            for (const h of heroes) {
                this.flows.set(h.id, this.region.flowField({ x: h.x, z: h.z }));
            }
            this.flowAge = 0;
        }
        let chased = false;
        for (const e of this.enemies) {
            if (e.flash > 0) {
                e.flash -= dt;
                if (e.flash <= 0 && e.state !== "dead") {
                    tint(e.actor, e.tint);
                }
            }
            if (e.slow > 0) {
                e.slow -= dt;
            }
            if (e.riled > 0) {
                e.riled -= dt;
            }
            // Ancient Magicks' holds (version 107): a freeze and a weakening
            // wear off, and a poison hits every few seconds until it's done
            if (e.frozen > 0) {
                e.frozen -= dt;
                if (e.frozen <= 0) {
                    e.thawed = FREEZE_IMMUNE;
                }
            } else if (e.thawed > 0) {
                e.thawed -= dt;
            }
            if (e.weakLeft > 0) {
                e.weakLeft -= dt;
            }
            if (e.poisonLeft > 0 && e.state !== "dead") {
                e.poisonNext -= dt;
                if (e.poisonNext <= 0) {
                    e.poisonNext = POISON_EVERY;
                    e.poisonLeft--;
                    this.damageEnemy(e, e.poisonHit, e.poisonBy ?? this.self, { poisoned: true });
                }
            }
            if (e.state === "dead") {
                this.fadeDead(e, dt);
                continue;
            }
            // Under the ground (a signature move): nothing until it's up
            if (e.burrowed !== undefined && e.burrowed > 0) {
                e.burrowed -= dt;
                if (e.burrowed <= 0) {
                    this.emerge(e);
                }
                continue;
            }
            // The Depths' tunneller digs off toward someone now and then
            // (version 172)
            if (e.def.tunneller && this.tunnel(e, heroes)) {
                continue;
            }
            const t = this.targetFor(e, heroes);
            // (turned on you bleeding: said once a while, version 178)
            if (t && t !== e.target && t.me && e.state !== "idle" && t.hp < t.maxHp * BLOOD_SHARE && this.time - this.bloodToldAt > 10) {
                this.bloodToldAt = this.time;
                this.hooks.onMessage(`The ${e.def.name.toLowerCase()} smells blood, and comes for you.`);
            }
            e.target = t;
            const dist = t ? Math.hypot(e.x - t.x, e.z - t.z) : Infinity;
            e.cooldown -= dt;

            if (e.state === "idle") {
                // Twice as far once the map's awake, less in the dark; a
                // boss never from further than it would chase
                let aggro = e.def.aggro * (this.awake ? 2 : 1) * (this.night ? NIGHT_AGGRO : 1);
                if (e.def.boss) {
                    aggro = Math.min(aggro, this.bossGiveUp(e) * BOSS_NOTICE_SHARE);
                }
                // The castle's bell rung (version 172): everything but the
                // lords heads for it, and notices less on the way
                const lure = this.lure && this.time < this.lure.until && !e.def.boss ? this.lure : undefined;
                if (lure) {
                    aggro *= BELL_AGGRO;
                }
                // A passive one never comes at you on sight
                if (t && dist < aggro && !e.def.passive) {
                    this.rouse(e);
                } else if (lure && Math.hypot(e.x - lure.x, e.z - lure.z) > 3) {
                    this.walkFlow(e, lure.flow, dt);
                } else if (e.curiousUntil > this.time && this.noise && this.time < this.noise.until) {
                    // Come to look at a noise (version 178): to near it,
                    // then a stand facing it
                    const noise = this.noise;
                    if (Math.hypot(e.x - noise.x, e.z - noise.z) > NOISE_CLOSE) {
                        this.walkFlow(e, noise.flow, dt);
                    } else {
                        e.facing = Math.atan2(noise.x - e.x, noise.z - e.z);
                        play(e.actor, "idle");
                    }
                } else if (e.def.boss && Math.hypot(e.x - e.homeX, e.z - e.homeZ) > 1) {
                    this.walkHome(e, dt);
                } else if (e.route) {
                    this.patrol(e, dt);
                } else {
                    play(e.actor, "idle");
                }
            }
            if (e.state !== "idle") {
                if (t === this.self) {
                    chased = true;
                }
                // A regenerating elite heals once it's been left alone a moment
                if (e.trait === "regenerating" && e.hp < e.def.hp && this.time - e.lastHurtAt > 3) {
                    e.hp = Math.min(e.def.hp, e.hp + e.def.hp * 0.02 * dt);
                }
            }

            if (e.state === "flee") {
                this.flee(e, t, dt);
            }

            if (e.state === "attack") {
                if (e.hitIn >= 0) {
                    e.hitIn -= dt;
                    if (e.hitIn < 0 && t) {
                        const reach = e.def.attackRange + PLAYER_RADIUS + 0.4;
                        if (Math.hypot(e.x - t.x, e.z - t.z) <= reach && this.region.lineOfSight(e.x, e.z, t.x, t.z)) {
                            if (e.def.shoots) {
                                void this.cast(e, t);
                            } else {
                                this.hurtHero(t, e.def, this.weakScale(e), "melee", e.def.pierce, undefined, e.trait === "venomous");
                            }
                        }
                    }
                }
                if (e.cooldown <= 0) {
                    e.state = "chase";
                }
                if (t) {
                    e.facing = Math.atan2(t.x - e.x, t.z - e.z);
                }
            }

            if (e.state === "chase") {
                // Out of reach it gives up: a boss only from much further,
                // and nothing soon after running for help
                const giveUp = dist > (e.def.boss ? this.bossGiveUp(e) : e.def.aggro * 2.5) && this.time > e.noIdleUntil;
                if (giveUp && e.def.boss && t && this.time - e.gaveUpAt > 5) {
                    e.gaveUpAt = this.time;
                    this.announce(`${e.def.name} loses interest and turns back.`);
                    // A Depths boss given the slip heals whole (version 159)
                    if (this.world.bosses) {
                        this.healBoss(e);
                    }
                }
                if (!t || giveUp) {
                    e.state = "idle";
                    // A mage or archer stands its ground and keeps shooting
                    // however close you come (the user asked: they used to
                    // back away while you were in melee range)
                } else if (dist <= e.def.attackRange + PLAYER_RADIUS && this.region.lineOfSight(e.x, e.z, t.x, t.z)) {
                    if (e.cooldown <= 0) {
                        e.state = "attack";
                        e.attacks++;
                        // A shooter that alternates swaps now, and says so
                        if (e.def.alternates && e.def.shoots) {
                            e.style = e.style === "magic" ? "ranged" : "magic";
                            this.announce(e.style === "magic" ? `${e.def.name}'s fire gathers!` : `${e.def.name} rears up to throw!`);
                        }
                        const length = play(e.actor, "attack", { once: true });
                        e.hitIn = Math.min(0.45, length * 0.5);
                        e.cooldown = e.interval;
                        this.hear(npcSound(e.def.npcId, "attack"), e.x, e.z, 0.35);
                    } else if (!e.def.shoots && !e.def.boss) {
                        // Between swings a melee enemy works round to your side
                        this.chase(e, t, dt);
                    } else {
                        play(e.actor, "idle");
                    }
                    e.facing = Math.atan2(t.x - e.x, t.z - e.z);
                } else {
                    this.chase(e, t, dt);
                }
            }

            if (e.def.boss) {
                this.updateBoss(e, t, dt);
            }
            if (e.def.floor && e.state !== "idle" && t) {
                this.updateFloor(e, t, dt);
            }
            e.actor.root.position.set(e.x, this.groundY(e.x, e.z), e.z);
            e.actor.root.rotation.y = e.facing;
            this.updateHealthBar(e, dt);
        }
        this.chased = chased;
        this.updateTargetRing();
    }

    // The ring sits under the last enemy swung at while it lives and is near
    private updateTargetRing(): void {
        const e = this.swingTarget;
        const shown = this.markTarget && e !== undefined && e.state !== "dead" && !this.dead && Math.hypot(e.x - this.px, e.z - this.pz) < 10;
        if (!shown) {
            if (this.targetRing) {
                this.targetRing.visible = false;
            }
            return;
        }
        if (!this.targetRing) {
            const geometry = new THREE.RingGeometry(0.78, 1, 40);
            const material = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
            this.disposables.push(geometry, material);
            this.targetRing = new THREE.Mesh(geometry, material);
            this.targetRing.rotation.x = -Math.PI / 2;
            this.scene.add(this.targetRing);
        }
        this.targetRing.visible = true;
        this.targetRing.scale.setScalar(0.7 * (e.def.scale ?? 1));
        this.targetRing.position.set(e.x, this.groundY(e.x, e.z) + 0.06, e.z);
    }

    // How fast an enemy moves: its own pace, half again for a fast elite,
    // half while Ahrim's spell has it crawling
    private speedOf(e: Enemy): number {
        // A roused melee boss closes the distance: nearly as quick as you
        // are, so it can't be shot at from a walk backwards for ever (one
        // that shoots back has no need)
        const base = e.def.boss && !e.def.shoots && e.state !== "idle" ? Math.max(e.def.speed, BOSS_CHASE_SPEED) : e.def.speed;
        // Frozen by an ice spell, it stands where it is (version 107)
        if (e.frozen > 0) {
            return 0;
        }
        // A fast elite never quite catches you unburdened (version 146: with
        // enemies a fifth quicker it could have); nor does one charging a
        // shooter, though it gains on one who stops to shoot (version 147)
        const fast =
            e.trait === "fast" || e.riled > 0
                ? Math.max(base, Math.min(base * (e.riled > 0 ? RILE_SPEED : 1.5), BOSS_CHASE_SPEED))
                : base;
        // (and quicker under a frenzy's curse: version 172)
        return fast * (e.slow > 0 ? 0.5 : 1) * (this.curse === "frenzy" ? CURSE_SPEED : 1);
    }

    // Running for help: toward the nearest idle friend that isn't past
    // whoever it's after (version 178), else straight away from them, at
    // full tilt, rousing what's idle along the way, then back into the chase
    private flee(e: Enemy, t: Hero | undefined, dt: number): void {
        e.fleeLeft -= dt;
        let dx = e.x - (t?.x ?? e.x);
        let dz = e.z - (t?.z ?? e.z);
        const awayLen = Math.hypot(dx, dz) || 1;
        let help = 15;
        for (const o of this.enemies) {
            if (o === e || o.state !== "idle" || o.def.passive || o.def.boss) {
                continue;
            }
            const ox = o.x - e.x;
            const oz = o.z - e.z;
            const d = Math.hypot(ox, oz);
            // (not through the hero: the help has to lie at least sideways)
            if (d < help && d > FLEE_ROUSE * 0.5 && (ox * -dx + oz * -dz) / (d * awayLen) < 0.3) {
                help = d;
                [dx, dz] = [ox, oz];
            }
        }
        const len = Math.hypot(dx, dz);
        let moved = false;
        if (len > 0.01) {
            const step = this.speedOf(e) * dt;
            const [nx, nz] = this.moveCircle(e.x, e.z, (dx / len) * step, (dz / len) * step, COLLISION_RADIUS);
            moved = Math.hypot(nx - e.x, nz - e.z) >= step * 0.3;
            e.x = nx;
            e.z = nz;
            e.facing = Math.atan2(dx, dz);
            play(e.actor, "walk");
        }
        for (const o of this.enemies) {
            if (o.state === "idle" && !o.def.passive && Math.hypot(o.x - e.x, o.z - e.z) < FLEE_ROUSE) {
                o.state = "chase";
                o.lastHurtAt = this.time;
                this.notice(o);
            }
        }
        if (e.fleeLeft <= 0 || !moved) {
            e.state = "chase";
        }
    }

    // A venomous hit: poison that ticks for a while, unless you eat
    private poison(): void {
        if (this.poisonTicks === 0) {
            this.hooks.onMessage("You've been poisoned. Food settles it.");
            this.poisonIn = POISON_INTERVAL;
        }
        this.poisonTicks = POISON_TICKS;
    }

    // How far off a boss gives up the chase: a melee one soon, a shooter
    // much later
    private bossGiveUp(e: Enemy): number {
        return e.def.shoots ? BOSS_GIVE_UP : BOSS_GIVE_UP_MELEE;
    }

    // A boss that's given up walks back to where it stood (stuck on the
    // way too long, it's simply put back there)
    private walkHome(e: Enemy, dt: number): void {
        const dx = e.homeX - e.x;
        const dz = e.homeZ - e.z;
        const dist = Math.hypot(dx, dz);
        const step = e.def.speed * dt;
        const [nx, nz] = this.moveCircle(e.x, e.z, (dx / dist) * Math.min(step, dist), (dz / dist) * Math.min(step, dist), COLLISION_RADIUS);
        e.stuck = Math.hypot(nx - e.x, nz - e.z) < step * 0.3 ? e.stuck + dt : 0;
        if (e.stuck > 3) {
            e.x = e.homeX;
            e.z = e.homeZ;
            e.stuck = 0;
            return;
        }
        e.x = nx;
        e.z = nz;
        e.facing = Math.atan2(dx, dz);
        play(e.actor, "walk");
    }

    // A patrol walks its round while nothing's up: on to the next tile of
    // it when this one's reached, or when something's in the way too long
    private patrol(e: Enemy, dt: number): void {
        const route = e.route!;
        const target = route[e.routeAt];
        const dx = target.x - e.x;
        const dz = target.z - e.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.5 || e.stuck > 1.5) {
            e.routeAt = (e.routeAt + 1) % route.length;
            e.stuck = 0;
            return;
        }
        const step = this.speedOf(e) * PATROL_SPEED * dt;
        const [nx, nz] = this.moveCircle(e.x, e.z, (dx / dist) * step, (dz / dist) * step, COLLISION_RADIUS);
        e.stuck = Math.hypot(nx - e.x, nz - e.z) < step * 0.3 ? e.stuck + dt : 0;
        e.x = nx;
        e.z = nz;
        e.facing = Math.atan2(dx, dz);
        play(e.actor, "walk");
    }

    // A Depths boss down (EMPOWER_HP): the ones left grow stronger, as hurt
    // as they were, and the strongest of them comes hunting, and never gives up
    private empowerBosses(): void {
        const left = this.enemies.filter((o) => o.def.boss && o.state !== "dead");
        if (left.length === 0) {
            return;
        }
        // At least the deepest depth's strength, whatever the depth: the
        // same boss at ENDLESS_DEPTHS over the same boss here, unscaled (so
        // a party's and a threat level's extra stays on top)
        const here = modeWorld(this.world.id, this.world.depth ?? 1).bosses ?? [];
        const deep = modeWorld(this.world.id, ENDLESS_DEPTHS).bosses ?? [];
        for (const o of left) {
            const share = o.hp / o.def.hp;
            const id = o.def.id;
            const mine = here.find((b) => b.id === id);
            const deepest = deep.find((b) => b.id === id);
            const hp = Math.max(EMPOWER_HP, mine && deepest ? deepest.hp / mine.hp : 1);
            const damage = Math.max(EMPOWER_DAMAGE, mine && deepest ? deepest.damage / mine.damage : 1);
            o.def = { ...o.def, hp: Math.round(o.def.hp * hp), damage: Math.round(o.def.damage * damage) };
            o.hp = Math.max(1, Math.round(o.def.hp * share));
            if (this.coop?.role === "host") {
                this.coop.send({ k: "boost", u: o.uid, hp: o.def.hp, d: o.def.damage } satisfies DownMessage);
            }
        }
        const hunter = left.reduce((a, b) => (b.def.hp > a.def.hp ? b : a));
        hunter.state = "chase";
        hunter.lastHurtAt = this.time;
        hunter.noIdleUntil = Infinity;
        hunter.hunting = true;
        this.huntWarned = Infinity;
        if (this.coop?.role === "host") {
            this.coop.send({ k: "boost", u: hunter.uid, hp: hunter.def.hp, d: hunter.def.damage, h: 1 } satisfies DownMessage);
        }
        // (the castle's in its own words: version 172)
        const castle = this.world.id === CASTLE_ID;
        const others = left.length > 1 ? `the ${left.length} ${castle ? "lords" : "bosses"} left grow stronger` : `${hunter.def.name} grows stronger`;
        this.announce(`${castle ? "The castle stirs" : "The Depths stir"}: ${others}, and ${hunter.def.name} is hunting you!`);
    }

    // The Depths' lairs (LAIR_THEMES): each boss by the cell it stands
    // guard in, the cave's rooms' models by cell (for the floor's tint), the
    // lairs walked into so far, and seconds to the floor's next burst
    private lairs = new Map<number, Enemy>();
    private caveParts = new Map<number, THREE.Object3D>();
    private lairsSeen = new Set<number>();
    private lairHazardIn = LAIR_HAZARD_EVERY;

    private themeAt(x: number, z: number): { theme: LairTheme; boss: Enemy; cell: number } | undefined {
        const cell = this.cave?.cellAt(x, z);
        const boss = cell !== undefined ? this.lairs.get(cell) : undefined;
        const theme = boss ? lairTheme(boss.def) : undefined;
        return theme && boss && cell !== undefined ? { theme, boss, cell } : undefined;
    }

    // A boss's lair noted where it stands (the host's and a guest's alike)
    private noteLair(e: Enemy): void {
        const cell = this.cave?.cellAt(e.homeX, e.homeZ);
        if (cell === undefined || cell < 0) {
            return;
        }
        this.lairs.set(cell, e);
        this.tintLair(cell);
    }

    // A lair's room in its theme's colours, once both the room and its boss
    // are in (its own copies of the materials: a room can be in the cave twice)
    tintLair(cell: number | undefined): void {
        if (cell === undefined) {
            return;
        }
        const part = this.caveParts.get(cell);
        const boss = this.lairs.get(cell);
        const theme = boss ? lairTheme(boss.def) : undefined;
        if (!part || !theme || part.userData.lairTinted) {
            return;
        }
        part.userData.lairTinted = true;
        part.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) {
                return;
            }
            const tinted = (m: THREE.Material) => {
                const copy = m.clone() as THREE.MeshStandardMaterial;
                copy.color?.multiply(theme.floor);
                this.disposables.push(copy);
                return copy;
            };
            mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tinted) : tinted(mesh.material);
        });
    }

    // In a lair: its word the first time, its ground's pace, its prayer
    // drain; and (the host's, for everyone in one) its floor's bursts
    private updateLairThemes(dt: number): void {
        if (!this.cave) {
            return;
        }
        const here = this.dead ? undefined : this.themeAt(this.px, this.pz);
        this.groundPace = here?.theme.pace ?? 1;
        // A dead adventurer's camp, the first time you come on it
        for (const camp of this.camps) {
            if (!camp.seen && Math.hypot(camp.x - this.px, camp.z - this.pz) < 5) {
                camp.seen = true;
                this.hooks.onMessage("A dead adventurer's camp: whatever they carried, they won't need it now.");
            }
        }
        if (here && !this.lairsSeen.has(here.cell)) {
            this.lairsSeen.add(here.cell);
            this.hooks.onMessage(here.theme.word);
        }
        if (here?.theme.drain && this.protect !== "none") {
            this.prayer = Math.max(0, this.prayer - here.theme.drain * dt);
        }
        if (this.coop?.role === "guest") {
            return;
        }
        this.lairHazardIn -= dt;
        if (this.lairHazardIn > 0) {
            return;
        }
        this.lairHazardIn = LAIR_HAZARD_EVERY;
        for (const hero of this.heroes()) {
            const lair = this.themeAt(hero.x, hero.z);
            if (!lair?.theme.hazard || lair.boss.state === "dead") {
                continue;
            }
            for (let i = 0; i < 2; i++) {
                const x = hero.x + (this.rng() - 0.5) * 5;
                const z = hero.z + (this.rng() - 0.5) * 5;
                if (this.region.fits(x, z, 0.1)) {
                    const spores = lair.theme.hazard === "spores";
                    this.sigRing(lair.boss, x, z, 1.2, 1.4, spores ? 0.05 : 0.08, spores ? (h) => this.sigPoison(h) : undefined);
                }
            }
        }
    }

    // The Depths' cave events (EVENT_EVERY): the events so far, the rooms
    // flooded now (their cell, blocked tiles, the water on them and seconds
    // left) and the pockets of gas
    private events = 0;
    private floods: { cell: number; tiles: number[]; water: THREE.Mesh[]; left: number }[] = [];
    private gas: { x: number; z: number; r: number; left: number; mesh: THREE.Mesh }[] = [];

    private updateCaveEvents(dt: number): void {
        if (!this.world.caves) {
            return;
        }
        // Floods drain and gas thins, for everyone; a guest's floods drain
        // when the host says
        for (const flood of [...this.floods]) {
            flood.left -= dt;
            if (flood.left <= 0 && this.coop?.role !== "guest") {
                this.drain(flood.cell);
            }
        }
        for (const pocket of [...this.gas]) {
            pocket.left -= dt;
            (pocket.mesh.material as THREE.MeshBasicMaterial).opacity = 0.28 * Math.min(1, pocket.left / 3) + 0.04 * Math.sin(this.time * 3);
            if (pocket.left <= 0) {
                this.scene.remove(pocket.mesh);
                (pocket.mesh.material as THREE.Material).dispose();
                this.gas.splice(this.gas.indexOf(pocket), 1);
            } else if (!this.dead && Math.hypot(this.px - pocket.x, this.pz - pocket.z) < pocket.r) {
                this.prayer = Math.max(0, this.prayer - GAS_DRAIN * dt);
            }
        }
        if (this.coop?.role === "guest" || this.time < EVENT_FIRST + EVENT_EVERY * this.events) {
            return;
        }
        this.events++;
        const heroes = this.heroes();
        const hero = heroes[Math.floor(this.rng() * heroes.length)];
        if (!hero) {
            return;
        }
        const kind = Math.floor(this.rng() * 3);
        if (kind === 0) {
            this.floodSomewhere(heroes);
        } else if (kind === 1) {
            const x = hero.x + (this.rng() - 0.5) * 6;
            const z = hero.z + (this.rng() - 0.5) * 6;
            this.addGas(x, z, GAS_RADIUS, GAS_SECONDS);
            if (this.coop?.role === "host") {
                this.coop.send({ k: "gas", x: round2(x), z: round2(z), r: GAS_RADIUS, l: GAS_SECONDS } satisfies DownMessage);
            }
            this.announce("A pocket of gas hisses out of the rock: it'll choke your prayer while you stand in it.");
        } else {
            let woke = 0;
            for (const e of this.enemies) {
                if (e.def.tiny && e.state === "idle" && heroes.some((h) => Math.hypot(h.x - e.x, h.z - e.z) < SWARM_REACH)) {
                    e.state = "chase";
                    e.lastHurtAt = this.time;
                    woke++;
                }
            }
            this.announce(
                woke > 0
                    ? `The ${this.world.id === CASTLE_ID ? "castle" : "cave"}'s vermin swarm: ${woke} of them come skittering out of the dark!`
                    : "Something skitters in the walls, then goes quiet.",
            );
        }
    }

    // A room nobody's in, not a lair, flooded shut for FLOOD_SECONDS
    private floodSomewhere(heroes: Hero[]): void {
        const cave = this.cave!;
        const inUse = new Set([...heroes.map((h) => cave.cellAt(h.x, h.z)), ...this.lairs.keys(), ...this.floods.map((f) => f.cell), this.sealed?.cell]);
        const cells = cave.cells.map((name, cell) => ({ name, cell })).filter((c) => c.name !== cave.empty && !inUse.has(c.cell));
        const pick = cells[Math.floor(this.rng() * cells.length)];
        if (!pick) {
            return;
        }
        this.flood(pick.cell);
        if (this.coop?.role === "host") {
            this.coop.send({ k: "flood", c: pick.cell, on: 1 } satisfies DownMessage);
        }
        const g = this.region;
        const mid = g.centreOf((pick.cell % cave.cellsX) * 64 + 32 + (Math.floor(pick.cell / cave.cellsX) * 64 + 32) * g.sizeX);
        this.announce(
            this.world.id === CASTLE_ID
                ? `Water floods through the halls: a wing to the ${this.compassTo(mid.x, mid.z)} is flooded shut for a minute.`
                : `Water roars through the tunnels: a cave to the ${this.compassTo(mid.x, mid.z)} is flooded shut for a minute.`,
        );
    }

    private flood(cell: number): void {
        const tiles = this.cave!.doorways(cell).filter((i) => this.region.isOpenTile(this.region.baseX + (i % this.region.sizeX), this.region.baseY + Math.floor(i / this.region.sizeX)));
        const geometry = (this.waterTile ??= new THREE.PlaneGeometry(1, 1));
        const material = (this.waterMaterial ??= new THREE.MeshBasicMaterial({ color: 0x2a6fa8, transparent: true, opacity: 0.75, depthWrite: false }));
        const water: THREE.Mesh[] = [];
        for (const i of tiles) {
            this.region.setSolid(i, true);
            const at = this.region.centreOf(i);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(at.x, this.region.topAt(at.x, at.z) + 0.15, at.z);
            this.scene.add(mesh);
            water.push(mesh);
        }
        this.floods.push({ cell, tiles, water, left: FLOOD_SECONDS });
    }

    private drain(cell: number): void {
        const flood = this.floods.find((f) => f.cell === cell);
        if (!flood) {
            return;
        }
        this.floods.splice(this.floods.indexOf(flood), 1);
        for (const i of flood.tiles) {
            this.region.setSolid(i, false);
        }
        for (const mesh of flood.water) {
            this.scene.remove(mesh);
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "flood", c: cell, on: 0 } satisfies DownMessage);
        }
        if (this.coop?.role !== "guest") {
            this.announce("The floodwater drains away.");
        }
    }

    private waterTile?: THREE.PlaneGeometry;
    private waterMaterial?: THREE.MeshBasicMaterial;

    private addGas(x: number, z: number, r: number, left: number): void {
        const geometry = (this.gasDisc ??= new THREE.CircleGeometry(1, 40));
        const material = new THREE.MeshBasicMaterial({ color: 0x7fbf3a, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.scale.setScalar(r);
        mesh.position.set(x, this.groundY(x, z) + 0.08, z);
        this.scene.add(mesh);
        this.gas.push({ x, z, r, left, mesh });
    }

    private gasDisc?: THREE.CircleGeometry;

    // The boss hunting you (empowerBosses), and the nearest of HUNT_RUMBLES
    // it's been told inside of (version 161)
    private huntWarned = Infinity;

    private hunter(): Enemy | undefined {
        for (const e of [...this.enemies, ...this.ghosts.values()]) {
            if (e.hunting && e.state !== "dead") {
                return e;
            }
        }
        return undefined;
    }

    // For the HUD: who's hunting you, how far, and which way on the screen
    get huntWord(): { text: string; near: boolean } | undefined {
        const e = this.hunter();
        if (!e || this.dead) {
            return undefined;
        }
        const dx = e.x - this.px;
        const dz = e.z - this.pz;
        const dist = Math.round(Math.hypot(dx, dz));
        // The screen's up and right on the ground, however the camera's turned
        const up = [-Math.sin(this.cameraYaw), -Math.cos(this.cameraYaw)];
        const right = [Math.cos(this.cameraYaw), -Math.sin(this.cameraYaw)];
        const angle = Math.atan2(dx * right[0] + dz * right[1], dx * up[0] + dz * up[1]);
        const arrow = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"][(Math.round(angle / (Math.PI / 4)) + 8) % 8];
        return { text: `${arrow} ${e.def.name} hunts you: ${dist} tiles ${this.compassTo(e.x, e.z)}`, near: dist < HUNT_RUMBLES[HUNT_RUMBLES.length - 1] };
    }

    // The ground shakes as the hunter closes in: told inside each of
    // HUNT_RUMBLES, and again once it's dropped back past one
    private updateHunt(): void {
        const e = this.hunter();
        if (!e || this.dead) {
            return;
        }
        const dist = Math.hypot(e.x - this.px, e.z - this.pz);
        const inside = HUNT_RUMBLES.filter((r) => dist < r);
        const nearest = inside.length > 0 ? inside[inside.length - 1] : Infinity;
        if (nearest < this.huntWarned) {
            this.huntWarned = nearest;
            playSound(npcSound(e.def.npcId, "attack"), nearest <= 15 ? 0.6 : 0.3);
            this.hooks.onMessage(
                nearest <= 15
                    ? `${e.def.name} is almost on you!`
                    : `The ground shakes: ${e.def.name} is ${Math.round(dist)} tiles off, to the ${this.compassTo(e.x, e.z)}.`,
            );
        } else if (nearest > this.huntWarned) {
            this.huntWarned = nearest;
        }
    }

    // The Depths' lairs (LAIR_SEAL_IN): one shuts once everyone in it is well
    // in from its doorways with its boss up and nothing stands in them, and
    // opens again once the boss is down, or nobody's left in there (and then
    // the boss heals whole)
    private updateLairs(): void {
        const cave = this.cave;
        if (!cave || this.coop?.role === "guest") {
            return;
        }
        const heroes = this.heroes();
        const sealed = this.sealed;
        if (sealed) {
            const boss = sealed.boss;
            const anyoneIn = heroes.some((h) => cave.cellAt(h.x, h.z) === sealed.cell);
            if (!boss || boss.state === "dead") {
                this.openLair();
            } else if (!anyoneIn) {
                this.openLair(boss);
            }
            return;
        }
        for (const e of this.enemies) {
            if (!e.def.boss || e.state === "dead" || e.state === "idle") {
                continue;
            }
            const cell = cave.cellAt(e.homeX, e.homeZ);
            if (!heroes.some((h) => cave.cellAt(h.x, h.z) === cell)) {
                continue;
            }
            const doorways = cave.doorways(cell).map((i) => this.region.centreOf(i));
            const near = (x: number, z: number, far: number) => doorways.some((c) => Math.hypot(c.x - x, c.z - z) < far);
            const ready =
                heroes.every((h) => !near(h.x, h.z, cave.cellAt(h.x, h.z) === cell ? LAIR_SEAL_IN : 2)) &&
                !this.enemies.some((o) => o.state !== "dead" && near(o.x, o.z, o.def.radius + 1));
            if (ready) {
                this.shutLair(cell, e);
            }
            return;
        }
    }

    // A lair's doorways blocked, and boulders fallen on them
    private shutLair(cell: number, boss?: Enemy): void {
        const tiles = this.cave!.doorways(cell);
        for (const i of tiles) {
            this.region.setSolid(i, true);
        }
        const sealed = { cell, boss, tiles, rocks: [] as Actor[] };
        this.sealed = sealed;
        // A boulder on every other tile each way: each is two tiles across
        const g = this.region;
        for (const i of tiles) {
            if ((i % g.sizeX) % 2 !== 0 || Math.floor(i / g.sizeX) % 2 !== 0) {
                continue;
            }
            const at = g.centreOf(i);
            const id = LAIR_ROCKS[Math.floor(this.rng() * LAIR_ROCKS.length)];
            const turn = Math.floor(this.rng() * 4) * (Math.PI / 2);
            void createActor("locs", id).then((rock) => {
                if (this.sealed !== sealed || this.ended) {
                    return;
                }
                this.placeActor(rock, at.x + 0.5, at.z - 0.5, turn);
                addShadow(rock.root, 0.9);
                sealed.rocks.push(rock);
            });
        }
        this.shake(0.5);
        if (boss) {
            this.announce(
                this.world.id === CASTLE_ID
                    ? `The ceiling gives way over the doorways: ${boss.def.name}'s hall is sealed until it falls.`
                    : `Rocks crash down over the doorways: ${boss.def.name}'s lair is sealed until it falls.`,
            );
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "seal", c: cell, on: 1 } satisfies DownMessage);
        }
    }

    // The rocks shift and the lair opens; a boss nobody's left fighting
    // heals whole and goes back to standing guard
    private openLair(healed?: Enemy): void {
        const sealed = this.sealed;
        if (!sealed) {
            return;
        }
        this.sealed = undefined;
        for (const i of sealed.tiles) {
            this.region.setSolid(i, false);
        }
        for (const rock of sealed.rocks) {
            this.scene.remove(rock.root);
        }
        if (healed) {
            this.healBoss(healed);
        }
        if (this.coop?.role !== "guest") {
            this.announce("The rocks shift: the lair's doorways are open again.");
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "seal", c: sealed.cell, on: 0 } satisfies DownMessage);
        }
    }

    // A Depths boss left alone is whole again, as if never fought
    private healBoss(e: Enemy): void {
        const whole = e.reborn ? Math.round(e.def.hp * SECOND_FORM_SHARE) : e.def.hp;
        if (e.state === "dead" || e.hp >= whole) {
            return;
        }
        e.hp = whole;
        this.announce(`${e.def.name} is left alone, and heals whole.`);
    }

    // A Depths boss's own move (SIGNATURES, version 161, as the user asked:
    // each of the fourteen fights like itself), on a timer while it's up and
    // at shares of its health; and any adds that mend it, mending it
    private updateSignature(e: Enemy, t: Hero | undefined, dt: number): void {
        const sig = SIGNATURES[baseId(e.def)];
        if (!sig || e.state === "idle" || e.state === "dead") {
            return;
        }
        const menders = (e.adds ?? []).filter((a) => a.mends === e && a.state !== "dead").length;
        if (menders > 0) {
            const whole = e.reborn ? Math.round(e.def.hp * SECOND_FORM_SHARE) : e.def.hp;
            e.hp = Math.min(whole, e.hp + e.def.hp * MEND_RATE * menders * dt);
        }
        for (const mark of sig.marks ?? []) {
            if (e.hp <= e.def.hp * mark && !(e.sigMarks ?? []).includes(mark)) {
                e.sigMarks = [...(e.sigMarks ?? []), mark];
                sig.atMark?.(this, e, t);
            }
        }
        if (!sig.every || !t) {
            return;
        }
        e.sigIn ??= sig.every / 2;
        e.sigIn -= dt;
        if (e.sigIn <= 0) {
            e.sigIn = sig.every;
            e.sigStep = (e.sigStep ?? 0) + 1;
            sig.move?.(this, e, t, e.sigStep - 1);
        }
    }

    // The moves' pieces: a ring that bursts on whoever's in it, for a share
    // of their hitpoints (through armour and prayer: it can be walked out of),
    // with more on top
    sigRing(e: Enemy, x: number, z: number, radius: number, warning: number, share: number, extra?: (hero: Hero) => void): void {
        this.hazard(x, z, radius, warning, (hero) => {
            if (e.state !== "dead") {
                this.hurtHero(hero, e.def, 0, "magic", true, Math.max(1, Math.round(hero.maxHp * share)));
                extra?.(hero);
            }
        });
    }

    sigSay(text: string): void {
        this.announce(text);
    }

    // A boss mended by this share of its hitpoints (Count Draynor's bite)
    sigHeal(e: Enemy, share: number): void {
        const whole = e.reborn ? Math.round(e.def.hp * SECOND_FORM_SHARE) : e.def.hp;
        if (e.state !== "dead") {
            e.hp = Math.min(whole, e.hp + Math.round(e.def.hp * share));
        }
    }

    sigPoison(hero: Hero): void {
        if (hero.me) {
            this.poison();
        }
    }

    // Held in place (this player alone: a co-op mate's moves are its own)
    sigRoot(hero: Hero, seconds: number): void {
        if (hero.me) {
            this.rooted = Math.max(this.rooted, seconds);
            this.hooks.onMessage("You're held fast!");
        }
    }

    // Thrown back from where the boss stands
    sigKnock(e: Enemy, hero: Hero, tiles: number): void {
        if (!hero.me) {
            return;
        }
        const dx = this.px - e.x;
        const dz = this.pz - e.z;
        const len = Math.max(0.01, Math.hypot(dx, dz));
        [this.px, this.pz] = this.moveCircle(this.px, this.pz, (dx / len) * tiles, (dz / len) * tiles, COLLISION_RADIUS);
    }

    sigDrainPrayer(hero: Hero, amount: number): void {
        if (hero.me) {
            this.prayer = Math.max(0, this.prayer - amount);
        }
    }

    // Adds beside the boss, of one of the cave's own kinds, made smaller or
    // tinted as said, after the nearest hero; mending the boss if `mend`
    sigAdds(e: Enemy, kind: string, name: string, count: number, look: { scale?: number; tint?: THREE.Color; hp?: number; mend?: boolean }): void {
        const base = this.world.enemies.find((x) => x.def.id.endsWith(`:${kind}`))?.def ?? this.world.enemies[0].def;
        const def: EnemyDef = {
            ...base,
            id: `${base.id}:add`,
            name,
            hp: Math.max(1, Math.round(base.hp * (look.hp ?? 1))),
            scale: (base.scale ?? 1) * (look.scale ?? 1),
            foodChance: 0,
            coins: [0, 0],
        };
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + this.rng();
            const x = e.x + Math.cos(angle) * 2.2;
            const z = e.z + Math.sin(angle) * 2.2;
            if (!this.region.fits(x, z, COLLISION_RADIUS)) {
                continue;
            }
            void this.spawnEnemy(def, { x, z }).then((add) => {
                if (look.tint) {
                    add.tint = look.tint.clone();
                    tint(add.actor, add.tint);
                }
                if (look.mend) {
                    add.mends = e;
                }
                e.adds = [...(e.adds ?? []), add];
                this.rouse(add);
            });
        }
    }

    // Under the ground for a while (the Giant Mole): unseen and unhurt, then
    // up somewhere else in its lair
    sigBurrow(e: Enemy, seconds: number): void {
        e.burrowed = seconds;
        e.actor.root.visible = false;
        this.announce(`${e.def.name} digs down into the ground!`);
    }

    private emerge(e: Enemy): void {
        const cell = this.cave?.cellAt(e.homeX, e.homeZ);
        for (let tries = 0; tries < 30; tries++) {
            const x = e.homeX + (this.rng() - 0.5) * 20;
            const z = e.homeZ + (this.rng() - 0.5) * 20;
            if (this.region.fits(x, z, e.def.radius) && (cell === undefined || this.cave?.cellAt(x, z) === cell) && Math.hypot(x - this.px, z - this.pz) > 4) {
                e.x = x;
                e.z = z;
                break;
            }
        }
        e.actor.root.visible = true;
        this.announce(`${e.def.name} bursts up out of the ground!`);
    }

    // Half way down, a boss is enraged: quicker, redder, with company. In a
    // fight it slams the ground now and then, a ring on the ground warning
    // where, and marks where whoever it's after stands when they're off
    private updateBoss(e: Enemy, t: Hero | undefined, dt: number): void {
        if (this.world.bosses) {
            this.updateSignature(e, t, dt);
        }
        // Left alone too long, an enraged boss gets some of its health back
        // (a second form no higher than it rose with, version 154: it healed
        // back past it to the first form's whole)
        const whole = e.reborn ? Math.round(e.def.hp * SECOND_FORM_SHARE) : e.def.hp;
        if (e.enraged && e.state !== "idle" && this.time - e.lastHurtAt > BOSS_IDLE_HEAL_SECONDS && e.hp < whole) {
            e.lastHurtAt = this.time;
            e.hp = Math.min(whole, e.hp + Math.round(whole * BOSS_IDLE_HEAL));
            this.announce(`${e.def.name} catches its breath and heals.`);
        }
        if (!e.enraged && e.hp <= e.def.hp * BOSS_ENRAGE) {
            e.enraged = true;
            e.interval = e.def.attackInterval * 0.65;
            e.tint = new THREE.Color(1.4, 0.75, 0.75);
            tint(e.actor, e.tint);
            this.sendTint(e, 1);
            e.slamIn = SLAM_SECONDS / 2;
            this.announce(`${e.def.name} is enraged!`);
            // Company: a few of the map's commonest enemy, beside it
            const company = this.world.enemies[0].def;
            for (const [ox, oz] of [
                [2, 0],
                [-2, 0],
                [0, 2],
            ]) {
                const x = e.x + ox;
                const z = e.z + oz;
                if (this.region.fits(x, z, COLLISION_RADIUS)) {
                    void this.spawnEnemy(company, { x, z }).then((add) => this.rouse(add));
                }
            }
        }
        if (e.state === "idle") {
            return;
        }
        e.slamIn -= dt;
        if (e.slamIn <= 0) {
            e.slamIn = e.enraged ? SLAM_ENRAGED : SLAM_SECONDS;
            this.makeNoise(e.x, e.z, NOISE_SLAM);
            // A boss killed while its ring's up neither slams nor hurts
            // (version 154: it burst all the same, from the body)
            this.hazard(
                e.x,
                e.z,
                SLAM_RANGE,
                1.2,
                (hero) => {
                    if (e.state !== "dead") {
                        this.hurtHero(hero, e.def, SLAM_HIT * this.weakScale(e), "melee", e.def.pierce);
                    }
                },
                () => {
                    if (e.state !== "dead") {
                        play(e.actor, "attack", { once: true });
                        e.attacks++;
                    }
                },
            );
        }
        // The marked strike, for a boss without burning floor
        if (e.def.floor || !t) {
            return;
        }
        e.strikeIn -= dt;
        if (e.strikeIn <= 0 && Math.hypot(t.x - e.x, t.z - e.z) > SLAM_RANGE + 1) {
            e.strikeIn = STRIKE_SECONDS;
            const style: ProtectStyle = e.def.alternates ? (e.style ?? styleOf(e.def)) : styleOf(e.def);
            this.hazard(t.x, t.z, STRIKE_RADIUS, STRIKE_WARN, (hero) => {
                if (e.state !== "dead") {
                    this.hurtHero(hero, e.def, STRIKE_HIT * this.weakScale(e), style, e.def.pierce);
                }
            });
            if (!this.toldStrike) {
                this.toldStrike = true;
                this.tell(t, `${e.def.name} marks where you stand: step out of the ring!`);
            }
        }
    }

    // Burning floor: a few tiles round whoever it's after ringed, then burst
    private updateFloor(e: Enemy, t: Hero, dt: number): void {
        e.floorIn -= dt;
        if (e.floorIn > 0) {
            return;
        }
        e.floorIn = FLOOR_SECONDS;
        for (let i = 0; i < FLOOR_TILES; i++) {
            const x = t.x + (this.rng() - 0.5) * 2 * FLOOR_SPREAD;
            const z = t.z + (this.rng() - 0.5) * 2 * FLOOR_SPREAD;
            if (!this.region.fits(x, z, 0.1)) {
                continue;
            }
            this.hazard(x, z, 1, 1.4, (hero) => {
                if (e.state !== "dead") {
                    this.hurtHero(hero, e.def, 0, "magic", true, Math.round(hero.maxHp * FLOOR_DAMAGE));
                }
            });
        }
        this.tell(t, `The ground under you glows: ${e.def.name}'s fire is coming.`);
    }

    private barMaterials?: { back: THREE.SpriteMaterial; red: THREE.SpriteMaterial; green: THREE.SpriteMaterial };

    private makeHealthBar(): HealthBar {
        if (!this.barMaterials) {
            const make = (color: number, renderOrder: number) => {
                // Not fogged, not brightened: a plain red and green
                const material = new THREE.SpriteMaterial({ color, fog: false, depthWrite: false, toneMapped: false });
                material.userData.renderOrder = renderOrder;
                this.disposables.push(material);
                return material;
            };
            this.barMaterials = { back: make(0x000000, 10), red: make(0xff0000, 11), green: make(0x00ff00, 12) };
        }
        const group = new THREE.Group();
        const sprite = (material: THREE.SpriteMaterial, x: number, width: number, height: number) => {
            const s = new THREE.Sprite(material);
            // Grows from its left edge, so the fill shrinks from the right
            s.center.set(0, 0.5);
            s.position.set(x, 0, 0);
            s.scale.set(width, height, 1);
            s.renderOrder = material.userData.renderOrder;
            group.add(s);
            return s;
        };
        sprite(this.barMaterials.back, -BAR_WIDTH / 2 - 0.03, BAR_WIDTH + 0.06, 0.2);
        sprite(this.barMaterials.red, -BAR_WIDTH / 2, BAR_WIDTH, 0.14);
        const fill = sprite(this.barMaterials.green, -BAR_WIDTH / 2, BAR_WIDTH, 0.14);
        group.visible = false;
        return { group, fill };
    }

    // Over its head while it's hurt or fighting, for BAR_SECONDS after
    private updateHealthBar(e: Enemy, dt: number): void {
        const bar = e.bar;
        if (!bar) {
            return;
        }
        e.barShown = Math.max(0, e.barShown - dt);
        if (e.state === "attack") {
            e.barShown = BAR_SECONDS;
        }
        bar.group.visible = settings.healthBars && e.barShown > 0;
        if (!bar.group.visible) {
            return;
        }
        const top = e.actor.height * (e.def.scale ?? 1);
        bar.group.position.set(e.x, this.groundY(e.x, e.z) + top + 0.25, e.z);
        bar.fill.scale.x = Math.max(0.001, e.hp / e.def.hp) * BAR_WIDTH;
    }

    private chase(e: Enemy, t: Hero, dt: number): void {
        // A ghost drifts straight through whatever's between (version 172)
        if (e.def.ghostly) {
            this.drift(e, t, dt);
            return;
        }
        const region = this.region;
        const flow = this.flows.get(t.id);
        let dx = t.x - e.x;
        let dz = t.z - e.z;
        let here = flow ? region.flowAt(flow, e.x, e.z) : -1;
        const near = Math.hypot(dx, dz);
        // Close, in sight and nothing in the way (a tree's trunk, say), it
        // walks straight at the player, whatever the field says (version 94:
        // the field goes round a tree's whole canopy, so near one it led an
        // enemy round and round while the player stood under it, safe)
        const straight =
            near < STRAIGHT_RANGE &&
            region.lineOfSight(e.x, e.z, t.x, t.z) &&
            region.clearWalk(e.x, e.z, t.x - (dx / Math.max(near, 0.001)) * 0.5, t.z - (dz / Math.max(near, 0.001)) * 0.5, COLLISION_RADIUS);
        // Close and in sight, a melee enemy goes for your side instead of
        // queueing up in front, where your swings land. Version 178: a pack
        // takes up places round you (surroundAngle), not two spots
        const slot = e.def.shoots || e.def.boss || near >= FLANK_RANGE ? (e.flank > 0 ? Math.PI / 2 : -Math.PI / 2) : this.surroundAngle(e, t);
        const flankX = t.x + Math.sin(t.facing + slot);
        const flankZ = t.z + Math.cos(t.facing + slot);
        // Only where it can walk there straight: past a tree's trunk it
        // follows the field round instead (version 94; else it walked into
        // the trunk and stood there, a safe spot)
        const flanking =
            !e.def.shoots &&
            !e.def.boss &&
            near < FLANK_RANGE &&
            near > 0.5 &&
            region.lineOfSight(e.x, e.z, t.x, t.z) &&
            region.clearWalk(e.x, e.z, flankX, flankZ, COLLISION_RADIUS);
        // Standing where the field has no step (under a tree's canopy, whose
        // tiles it goes round) with no straight way on, it makes for the
        // nearest tile that has one first (version 94: before, it stood
        // there for good, and a tree was a safe spot to shoot it from)
        const offField = flow !== undefined && here === -1 && !straight && !flanking;
        if (offField) {
            const out = region.nearestFlow(flow, e.x, e.z, COLLISION_RADIUS);
            if (out.steps !== -1) {
                const ox = out.x - e.x;
                const oz = out.z - e.z;
                const olen = Math.hypot(ox, oz);
                if (olen > 0.05) {
                    const step = this.speedOf(e) * dt;
                    [e.x, e.z] = this.moveCircle(e.x, e.z, (ox / olen) * step, (oz / olen) * step, COLLISION_RADIUS);
                    e.facing = Math.atan2(ox, oz);
                    play(e.actor, "walk");
                    return;
                }
                here = out.steps;
            }
        }
        // No way round to the player at all (a fence between, say): wait
        // rather than walk into it
        if (offField && here === -1) {
            play(e.actor, "idle");
            return;
        }
        if (flanking) {
            dx = flankX - e.x;
            dz = flankZ - e.z;
            // At the side already: stand there
            if (Math.hypot(dx, dz) < 0.25) {
                play(e.actor, "idle");
                return;
            }
        } else if (near <= 0.5) {
            // On top of the player already: no closer
            play(e.actor, "idle");
            return;
        }
        // Follow the field unless the player is right there, or a straight
        // walk gets there
        if (!flanking && !straight && flow && here > 1) {
            const tx = region.tileX(e.x);
            const ty = region.tileY(e.z);
            let best = here;
            let bx = tx;
            let by = ty;
            for (const [ox, oy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ]) {
                // Not the player's own tile through a wall: the field counts
                // steps round it, so the next step is a neighbour it can enter
                if (region.crossesWall(tx, ty, tx + ox, ty + oy)) {
                    continue;
                }
                const n = region.flowAt(flow, tx + ox + 0.5, -(ty + oy + 0.5));
                if (n !== -1 && n < best) {
                    best = n;
                    bx = tx + ox;
                    by = ty + oy;
                }
            }
            dx = bx + 0.5 - e.x;
            dz = -(by + 0.5) - e.z;
        }
        // Keep off the others
        for (const o of this.enemies) {
            if (o === e || o.state === "dead") {
                continue;
            }
            const ox = e.x - o.x;
            const oz = e.z - o.z;
            const dist = Math.hypot(ox, oz);
            const min = e.def.radius + o.def.radius;
            if (dist < min && dist > 0.001) {
                dx += (ox / dist) * (min - dist) * 3;
                dz += (oz / dist) * (min - dist) * 3;
            }
        }
        const len = Math.hypot(dx, dz);
        if (len < 0.01) {
            return;
        }
        dx /= len;
        dz /= len;
        const step = this.speedOf(e) * dt;
        // The same narrow footprint as the player, whatever its size, so a
        // big one follows the flow field through a one tile gap too
        let [nx, nz] = this.moveCircle(e.x, e.z, dx * step, dz * step, COLLISION_RADIUS);
        // A cunning one steps round an armed spike trap (version 178): the
        // side that's clear, else it waits
        const avoid = this.cunning(e) ? this.trapAvoid() : undefined;
        if (avoid?.(nx, nz)) {
            let found = false;
            for (const turn of [e.flank, -e.flank]) {
                const sx = dz * turn;
                const sz = -dx * turn;
                const [tx, tz] = this.moveCircle(e.x, e.z, sx * step, sz * step, COLLISION_RADIUS);
                if (!avoid(tx, tz)) {
                    [nx, nz, dx, dz] = [tx, tz, sx, sz];
                    found = true;
                    break;
                }
            }
            if (!found) {
                play(e.actor, "idle");
                return;
            }
        }
        // A lit room (version 166): the weakest won't step into one
        if (this.litCells.size > 0 && this.cave && this.isWeak(e)) {
            const into = this.cave.cellAt(nx, nz);
            if (into !== this.cave.cellAt(e.x, e.z) && this.litCells.has(into)) {
                play(e.actor, "idle");
                return;
            }
        }
        [e.x, e.z] = [nx, nz];
        e.facing = Math.atan2(dx, dz);
        play(e.actor, "walk");
    }

    // A hit on a hero: on this player, or (the host) rolled for a mate from
    // their defence and sent to them, with its poison if the enemy's venomous
    private hurtHero(hero: Hero, enemy: EnemyDef, scale = 1, style: ProtectStyle = styleOf(enemy), pierce = false, fixed?: number, venom = false): void {
        if (hero.me) {
            this.hurtPlayer(enemy, scale, style, pierce, fixed);
            if (venom && !this.dead) {
                this.poison();
            }
            return;
        }
        // The mercenary takes their own (version 173)
        if (hero === this.merc?.hero) {
            this.hurtMerc(this.rollHit(enemy, Run.defenceAgainst(hero, style), scale, pierce, fixed));
            return;
        }
        if (hero.dead || this.coop?.role !== "host") {
            return;
        }
        const hit = this.rollHit(enemy, Run.defenceAgainst(hero, style), scale, pierce, fixed);
        this.coop.send({
            k: "hurt",
            to: hero.id,
            hit,
            style,
            pierce: pierce ? 1 : undefined,
            fixed: fixed !== undefined ? 1 : undefined,
            by: enemy.name,
            venom: venom ? 1 : undefined,
        } satisfies DownMessage);
    }

    // What an enemy's hit comes to against this much defence: its roll less
    // the soak; a piercing hit gets through half the armour (and all of a
    // prayer, which applyHit sees to); or a set amount
    private rollHit(enemy: EnemyDef, defence: number, scale: number, pierce: boolean, fixed?: number): number {
        if (fixed !== undefined) {
            return fixed;
        }
        return Math.max(1, Math.round(enemyHit(enemy, { defence: pierce ? defence / 2 : defence }, this.rng()) * scale));
    }

    // A hit on the player: the enemy's roll less armour, halved by
    // protection from its style, unless it pierces (then neither counts);
    // or a set amount
    private hurtPlayer(enemy: EnemyDef, scale = 1, style: ProtectStyle = styleOf(enemy), pierce = false, fixed?: number): void {
        if (this.dead) {
            return;
        }
        let hit = this.rollHit(enemy, Run.defenceAgainst(this.self, style), scale, pierce, fixed);
        // A paladin at your side takes the edge off every hit (version 181)
        const m = this.merc;
        const guard = m?.def.perk?.kind === "guard" ? m.def.perk : undefined;
        if (guard && m && !m.hero.dead && hit > 0 && Math.hypot(m.x - this.px, m.z - this.pz) <= guard.range) {
            hit = Math.max(1, Math.round(hit * (1 - guard.share)));
        }
        this.applyHit(hit, enemy.name, style, pierce, fixed !== undefined);
    }

    // The hit landing: protection halves it unless it pierces or is set;
    // the armour wears, the health goes, and at none the player falls
    private applyHit(hit: number, by: string, style: ProtectStyle, pierce: boolean, fixed: boolean): void {
        if (this.dead || this.done || this.time < this.graceUntil) {
            return;
        }
        if (pierce && !fixed && !this.piercedOnce) {
            this.piercedOnce = true;
            this.hooks.onMessage(`${by}'s hits find the gaps in your armour. Nothing softens them.`);
        }
        if (!pierce && !fixed && this.protect === style && this.protect !== "none") {
            hit = Math.max(1, Math.round(hit / 2));
        }
        // A pet's hide takes a little off a real hit, or a pet born in the
        // fire a share off a burning floor's (a set hit that isn't poison)
        if (this.petBuff?.soak && !fixed) {
            hit = Math.max(1, hit - this.petBuff.soak);
        }
        if (this.petBuff?.burn !== undefined && fixed && by !== POISON.name) {
            hit = Math.max(1, Math.round(hit * this.petBuff.burn));
        }
        // A real hit wears the armour that took it
        if (!fixed) {
            this.wearArmour();
        }
        // A hit (not poison's) at the way out starts the escape over
        // (version 150): what's come running has to be dealt with first
        if (this.extracting > 0 && by !== POISON.name) {
            this.extracting = 0;
            this.hooks.onMessage("The hit throws you off your escape. Start it again.");
        }
        this.damageTaken += Math.min(hit, Math.max(0, this.hp));
        this.hp -= hit;
        this.hitsTaken++;
        this.lastHurt = this.time;
        // (poison's ticks don't break a hold on the map's things: version 166)
        if (by !== POISON.name) {
            this.lastStruck = this.time;
        }
        this.hurtFlash = 0.15;
        this.hooks.onHurt?.(hit);
        this.player.flash(new THREE.Color(1.6, 0.5, 0.5));
        this.splat(this.px, this.pz, 1.5 * this.character.size, hit);
        playSound(npcSound(PLAYER_SOUND_NPC, "hit"), 0.5);
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            this.killer = by;
            this.swingIn = -1;
            this.player.restore();
            this.player.play("death", { once: true });
            playSound(npcSound(PLAYER_SOUND_NPC, "death"), 0.6);
            this.falls++;
            if (this.coop && this.othersRemain()) {
                this.hooks.onMessage(
                    `You're down. Someone in the party has ${this.reviveWindow()} seconds to revive you, or everything you carried is lost.` +
                        (this.falls > 1 ? " Each fall gives them half the time of the last." : ""),
                );
                if (this.coop.role === "host") {
                    this.coop.send({ k: "msg", text: Run.downText(this.self.name) } satisfies DownMessage);
                }
            } else {
                this.hooks.onMessage("You have died. Everything you carried is lost.");
            }
        }
    }

    // This fall's time for a revive: the full window the first time, half
    // the last fall's each time after
    private reviveWindow(): number {
        return REVIVE_WINDOW / Math.pow(2, Math.max(0, this.falls - 1));
    }

    private static downText(name: string): string {
        return `${name} is down. Stand beside them and hold E (Revive on a phone) to bring them back.`;
    }

    // Back up from being down: a share of the hitpoints, a moment nothing
    // can hurt, and the poison gone. Only while still down (not bled out)
    private standUp(by: string): void {
        if (!this.dead || this.done || this.ended) {
            return;
        }
        this.dead = false;
        this.deadFor = 0;
        this.killer = undefined;
        this.hp = Math.max(1, Math.round(this.maxHp * REVIVE_HP_SHARE));
        this.graceUntil = this.time + REVIVE_GRACE;
        this.poisonTicks = 0;
        this.lastHurt = this.time;
        this.player.restore();
        this.player.play("idle");
        this.hooks.onMessage(`${by} pulls you back to your feet.`);
        this.hooks.onChanged();
    }

    // A mate who's down within reach, for this player to revive (not one
    // just revived, whose word that they're up hasn't come yet)
    private downedMateNear(): Mate | undefined {
        for (const m of this.mates.values()) {
            if (!m.done && m.dead && this.time - m.revivedAt > 2 && Math.hypot(m.x - this.px, m.z - this.pz) < REVIVE_RANGE) {
                return m;
            }
        }
        return undefined;
    }

    // This player's revive of a mate: a guest asks the host, the host does it
    private sendRevive(mate: Mate): void {
        mate.revivedAt = this.time;
        if (this.coop?.role === "guest") {
            this.coop.send({ k: "revive", id: mate.id } satisfies UpMessage);
        } else {
            this.revive(mate.id, this.self);
        }
    }

    // The host's: a hero revived by another, if they're still down. The
    // host stands up here; a guest is told to
    private revive(id: string, by: Hero): void {
        const target = this.heroById(id);
        if (!target || target === by || by.dead) {
            return;
        }
        if (target.me) {
            if (!this.dead || this.done) {
                return;
            }
            this.standUp(by.name);
        } else {
            const mate = this.mates.get(id);
            if (!mate || mate.done || !mate.dead) {
                return;
            }
            mate.revivedAt = this.time;
            this.coop?.send({ k: "revive", id, by: by.name } satisfies DownMessage);
        }
        this.announce(`${by.name} revives ${target.name}.`);
    }

    // Every piece of armour worn wears a little with each hit; a word when
    // one is half gone and when it's worn through
    private wearArmour(): void {
        let changed = false;
        for (const slot of SLOTS) {
            const id = this.equipment[slot];
            if (slot === "weapon" || id === undefined) {
                continue;
            }
            const item = getItem(id);
            if (!item.defence) {
                continue;
            }
            const before = wearOf(this.wear, id);
            if (before >= 1) {
                continue;
            }
            const after = Math.min(1, before + WEAR_PER_HIT);
            this.wear[id] = after;
            changed = true;
            if (before < 0.5 && after >= 0.5) {
                this.hooks.onMessage(`Your ${item.name.toLowerCase()} is wearing thin.`);
            } else if (after >= 1) {
                this.hooks.onMessage(`Your ${item.name.toLowerCase()} is worn through: half its defence is gone until the guild repairs it.`);
            }
        }
        if (changed) {
            this.applyStats();
        }
    }

    // The player's spell landing (version 107): on the target, and for a
    // burst or barrage on up to eight more within a tile of it (OSRS's three
    // by three), each with the spell's effect; a blood spell heals a quarter
    // of what it dealt in all
    private landSpell(p: Projectile, target: Enemy, slow: boolean): void {
        const spell = p.spell!;
        // An effect with a chance (version 110: the swamp trident's venom,
        // the Sanguinesti staff's heal) comes on that share of hits
        const effect = spell.effect && (spell.effect.chance === undefined || this.rng() < spell.effect.chance) ? spell.effect : undefined;
        const effects: HitEffects = { slow };
        if (effect?.kind === "freeze") {
            effects.freeze = effect.seconds;
        } else if (effect?.kind === "weaken") {
            effects.weaken = effect.share;
        } else if (effect?.kind === "poison") {
            effects.poison = Math.max(1, Math.round((p.maxHit ?? p.damage) * effect.share));
        }
        const hit = [target];
        if (spell.area) {
            const near = this.enemies
                .filter((e) => e !== target && e.state !== "dead" && Math.max(Math.abs(e.x - target.x), Math.abs(e.z - target.z)) <= 1.5)
                .sort((a, b) => Math.hypot(a.x - target.x, a.z - target.z) - Math.hypot(b.x - target.x, b.z - target.z));
            hit.push(...near.slice(0, 8));
        }
        let dealt = 0;
        for (const e of hit) {
            // The others roll their own hit, from a little under the target's
            // (version 150: and whether it lands, from about the usual hit
            // when the target's was a miss)
            const base = p.damage > 0 ? p.damage : Math.round((p.maxHit ?? 1) * 0.8);
            const damage = e === target ? p.damage : this.lands(e, false) ? Math.max(1, Math.round(base * (0.75 + this.rng() * 0.25))) : 0;
            const before = e.hp;
            this.damageEnemy(e, damage, this.self, effects);
            dealt += Math.max(0, before - e.hp);
            if (e !== target) {
                void this.burst(spell.impact, e.x, e.z);
            }
        }
        if (effect?.kind === "heal" && dealt > 0 && !this.dead) {
            this.hp = Math.min(this.maxHp, this.hp + Math.round(dealt * effect.share));
            // The Sanguinesti staff's heal shows on its caster
            if (spell.healLook !== undefined) {
                void this.burst(spell.healLook, this.px, this.pz);
            }
        }
    }

    private updateProjectiles(dt: number): void {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const tx = p.target ? p.target.x : (p.hero?.x ?? this.px);
            const tz = p.target ? p.target.z : (p.hero?.z ?? this.pz);
            const ty = this.groundY(tx, tz) + 0.8;
            const dx = tx - p.x;
            const dz = tz - p.z;
            const dy = ty - p.y;
            const dist = Math.hypot(dx, dz);
            const step = PROJECTILE_SPEED * dt;
            const gone = p.target ? p.target.state === "dead" : p.hero ? p.hero.dead : this.dead;
            if (dist <= step || gone) {
                if (!gone) {
                    if (p.visual) {
                        // Someone else's: it lands, and that's all
                    } else if (p.target) {
                        // Ahrim's: what a spell hits crawls
                        const slow = this.stats.set === "ahrim" && this.stats.weapon?.uses === "runes";
                        const before = p.target.hp;
                        if (p.spell) {
                            this.landSpell(p, p.target, slow);
                        } else {
                            this.damageEnemy(p.target, p.damage, this.self, { slow });
                        }
                        // A healing special's shot (version 150): a share of
                        // what it took off its target
                        if (p.heal && before > p.target.hp && !this.dead) {
                            this.hp = Math.min(this.maxHp, this.hp + Math.round((before - p.target.hp) * p.heal));
                        }
                        // A chinchompa: everything beside what it hit takes half
                        if (p.splash && p.damage > 0) {
                            for (const e of this.enemies) {
                                if (e !== p.target && e.state !== "dead" && Math.hypot(e.x - tx, e.z - tz) <= SPLASH_TILES) {
                                    this.damageEnemy(e, Math.max(1, Math.round(p.damage / 2)), this.self);
                                }
                            }
                        }
                    } else if (p.from && p.hero) {
                        this.hurtHero(p.hero, p.from, p.scale ?? 1, p.style ?? styleOf(p.from), p.from.pierce);
                    }
                    if (p.impact !== undefined) {
                        void this.burst(p.impact, tx, tz);
                    }
                    if (p.hitSound !== undefined) {
                        this.hear(`sounds/${p.hitSound}`, tx, tz, 0.4);
                    }
                }
                this.scene.remove(p.root);
                this.projectiles.splice(i, 1);
                continue;
            }
            p.x += (dx / dist) * step;
            p.z += (dz / dist) * step;
            p.y += (dy / dist) * step;
            p.root.position.set(p.x, p.y, p.z);
            // Nose first
            p.root.lookAt(tx, ty, tz);
        }
    }

    // A spot animation played once where something lands
    private async burst(spotAnim: number, x: number, z: number): Promise<void> {
        const actor = await createActor("spotanims", spotAnim).catch(() => undefined);
        if (!actor || this.ended) {
            return;
        }
        actor.root.position.set(x, this.groundY(x, z), z);
        this.scene.add(actor.root);
        const length = play(actor, "play", { once: true });
        this.effects.push({ actor, left: Math.max(0.3, length) });
    }

    private updateEffects(dt: number): void {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.actor.mixer.update(dt);
            effect.left -= dt;
            if (effect.left <= 0) {
                this.scene.remove(effect.actor.root);
                this.effects.splice(i, 1);
            }
        }
    }

    // Something dropped here, scattered up to this far (a kill's drops a
    // little, a chest's not at all); the host tells the guests where it lay
    private dropPickup(id: number, count: number, x: number, z: number, scatter = 0.8, uid = this.nextUid++): void {
        // Its cell of the icon sheet, through the world's brightness curve, so
        // a dark icon reads on the ground
        const material = new THREE.SpriteMaterial({ map: iconTexture(id), transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.7, 0.62, 1);
        // Scatter a little, onto open ground
        for (let tries = 0; tries < 6 && scatter > 0; tries++) {
            const sx = x + (this.rng() - 0.5) * scatter;
            const sz = z + (this.rng() - 0.5) * scatter;
            if (this.region.fits(sx, sz, 0.1)) {
                x = sx;
                z = sz;
                break;
            }
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "drop", u: uid, i: id, n: count, x: round2(x), z: round2(z) } satisfies DownMessage);
        }
        const y = this.groundY(x, z);
        sprite.position.set(x, y + 0.5, z);
        this.scene.add(sprite);
        const shadow = groundShadow(0.28);
        shadow.position.set(x, y + 0.05, z);
        this.scene.add(shadow);
        // Every piece of gear glows its tier's colour (version 136)
        const item = getItem(id);
        let glow: THREE.Sprite | undefined;
        if (tierGlows(item)) {
            glow = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: glowTexture(),
                    color: TIER_COLOURS[item.tier],
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    toneMapped: false,
                }),
            );
            glow.scale.setScalar(1.15);
            glow.position.copy(sprite.position);
            sprite.renderOrder = 1;
            this.scene.add(glow);
        }
        // Gear worth a shout stands under a shaft of light, with a chime
        let beam: THREE.Mesh | undefined;
        if (item.slot && item.tier >= BEAM_TIER) {
            const best = item.tier >= 5;
            beam = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.3, 7, 12, 1, true),
                new THREE.MeshBasicMaterial({
                    color: TIER_COLOURS[item.tier],
                    transparent: true,
                    opacity: 0.35,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                    toneMapped: false,
                }),
            );
            beam.position.set(x, y + 3.5, z);
            this.scene.add(beam);
            if (Math.hypot(x - this.px, z - this.pz) < HEAR_FAR) {
                playChime(best);
            }
            this.hooks.onMessage(`${item.name} gleams on the ground.`);
        }
        this.pickups.push({ uid, id, count, sprite, shadow, beam, glow, x, z, age: 0 });
    }

    // A pickup off the ground, whoever took it
    private removePickup(p: Pickup): void {
        this.scene.remove(p.sprite, p.shadow);
        // Its shaft of light freed with it (version 154: kept till the end)
        if (p.beam) {
            this.scene.remove(p.beam);
            p.beam.geometry.dispose();
            (p.beam.material as THREE.Material).dispose();
        }
        if (p.glow) {
            this.scene.remove(p.glow);
            p.glow.material.dispose();
        }
        p.sprite.material.dispose();
        const i = this.pickups.indexOf(p);
        if (i !== -1) {
            this.pickups.splice(i, 1);
        }
    }

    // Something into the pack (or the purse): whether it went, with a word
    private takeItem(id: number, count: number): boolean {
        if (id === COINS) {
            this.coins += count;
            this.coinsFound += count;
            return true;
        }
        // A map scrap is read as it's picked up (version 172)
        if (getItem(id).scrap) {
            this.readScrap();
            return true;
        }
        if (!canCarry(this.inventory, id, count)) {
            if (this.time - this.fullMessageAt > 2) {
                this.hooks.onMessage(carryLimitText(id));
                this.fullMessageAt = this.time;
            }
            return false;
        }
        if (!addItem(this.inventory, id, count, this.packSize)) {
            if (this.time - this.fullMessageAt > 2) {
                this.hooks.onMessage("Your pack is full.");
                this.fullMessageAt = this.time;
            }
            return false;
        }
        if (id === CLUE_SCROLL) {
            this.setClue();
        } else if (id === VAULT_KEY) {
            this.vaultFound = true;
            this.hooks.onMessage(`You pick up the crystal key. The vault is ${this.vaultDirection()}.`);
        } else if (id === BRIMSTONE_KEY) {
            const chest = this.chests.find((c) => c.room === "brimstone" && !c.opened);
            this.hooks.onMessage(
                chest
                    ? `You pick up a brimstone key. The brimstone chest is ${Math.round(Math.hypot(chest.tile.x - this.px, chest.tile.z - this.pz))} tiles to the ${this.compassTo(chest.tile.x, chest.tile.z)}.`
                    : "You pick up a brimstone key.",
            );
        } else if (id === BOSS_KEY) {
            const golden = this.chests.find((c) => c.boss && !c.opened);
            this.hooks.onMessage(
                golden
                    ? `You pick up the golden chest's key. The chest is ${Math.round(Math.hypot(golden.tile.x - this.px, golden.tile.z - this.pz))} tiles to the ${this.compassTo(golden.tile.x, golden.tile.z)}.`
                    : "You pick up the golden chest's key.",
            );
        } else {
            this.hooks.onMessage(`You pick up ${count > 1 ? count + " " : ""}${getItem(id).name}.`);
        }
        return true;
    }

    // How many of a stack on the ground the pack has room for: what its
    // limits allow (food, arrows, runes) and its slots hold (version 100:
    // a stack was all or nothing, so 14 food turned down a stack of 2)
    private roomInPack(id: number, count: number): number {
        // (a map scrap is read, never packed: version 172)
        if (id === COINS || getItem(id).scrap) {
            return count;
        }
        const allowed = roomFor(this.inventory, id, count);
        if (getItem(id).stackable) {
            return this.inventory.some((s) => s.id === id) || this.inventory.length < this.packSize ? allowed : 0;
        }
        return Math.max(0, Math.min(allowed, this.packSize - this.inventory.length));
    }

    // Why nothing of it fits, once a while
    private noRoom(id: number): void {
        if (this.time - this.fullMessageAt > 2) {
            this.hooks.onMessage(canCarry(this.inventory, id, 1) ? "Your pack is full." : carryLimitText(id));
            this.fullMessageAt = this.time;
        }
    }

    private updatePickups(dt: number): void {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            p.age += dt;
            p.sprite.position.y = this.groundY(p.x, p.z) + 0.5 + Math.sin(p.age * 3) * 0.06;
            if (p.glow) {
                p.glow.position.y = p.sprite.position.y;
                p.glow.material.opacity = 0.75 + 0.25 * Math.sin(p.age * 2.5);
            }
            if (p.beam) {
                (p.beam.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.12 * Math.sin(p.age * 4);
                p.beam.rotation.y += dt * 0.6;
            }
            if (this.dead || this.done || p.age < 0.4) {
                continue;
            }
            if (Math.hypot(p.x - this.px, p.z - this.pz) < 0.7) {
                if (this.coop?.role === "guest") {
                    // The host hands it over (asked again if it hasn't in a moment)
                    const asked = this.requested.get(p.uid);
                    const room = this.roomInPack(p.id, p.count);
                    // One at a time (version 154): asked for together, a pile
                    // was all granted against the same free room, and what
                    // didn't fit was lost
                    const waiting = [...this.requested].some(([u, at]) => u !== p.uid && this.time - at <= 1.5);
                    if (waiting) {
                        continue;
                    }
                    if (room > 0 && (asked === undefined || this.time - asked > 1.5)) {
                        this.requested.set(p.uid, this.time);
                        this.coop.send({ k: "take", u: p.uid, n: room < p.count ? room : undefined } satisfies UpMessage);
                    } else if (room === 0) {
                        this.noRoom(p.id);
                    }
                    continue;
                }
                // A party that splits its loot shares the coins out
                if (p.id === COINS && this.coop && this.splitsLoot()) {
                    this.shareCoins(this.coop.me, p.count);
                    this.coop.send({ k: "taken", u: p.uid } satisfies DownMessage);
                    this.removePickup(p);
                    continue;
                }
                // What fits, and the rest left where it lies
                const room = this.roomInPack(p.id, p.count);
                if (room === 0) {
                    this.noRoom(p.id);
                    continue;
                }
                if (!this.takeItem(p.id, room)) {
                    continue;
                }
                if (room < p.count) {
                    p.count -= room;
                    if (this.coop?.role === "host") {
                        this.coop.send({ k: "taken", u: p.uid, n: room, left: p.count } satisfies DownMessage);
                    }
                    this.hooks.onChanged();
                    continue;
                }
                if (this.coop?.role === "host") {
                    this.coop.send({ k: "taken", u: p.uid } satisfies DownMessage);
                }
                this.removePickup(p);
            }
        }
    }

    private updateInteractions(dt: number): void {
        this.prompt = "";
        if (this.dead && !this.done && this.coop && this.othersRemain()) {
            this.prompt = `You're down. ${Math.max(0, Math.ceil(this.reviveWindow() - this.deadFor))}s for someone to revive you`;
            return;
        }
        if (this.dead || this.done) {
            return;
        }
        const near = (x: number, z: number) => Math.hypot(x - this.px, z - this.pz) < 1.6;
        const pressed = this.keys.has("KeyE");

        // A mate who's down: held E at their side brings them back up
        const downed = this.downedMateNear();
        if (downed) {
            if (!pressed) {
                this.reviving = 0;
                this.prompt = `Hold E to revive ${downed.name}: ${REVIVE_SECONDS} seconds at their side`;
                return;
            }
            if (this.revivingId !== downed.id) {
                this.revivingId = downed.id;
                this.reviving = 0;
            }
            this.reviving += dt;
            if (this.swingIn < 0) {
                this.player.play("idle");
            }
            this.prompt = `Reviving ${downed.name}... ${Math.max(0, REVIVE_SECONDS - this.reviving).toFixed(1)}s`;
            if (this.reviving >= REVIVE_SECONDS) {
                this.reviving = 0;
                this.revivingId = undefined;
                this.keys.delete("KeyE");
                this.sendRevive(downed);
            }
            return;
        }
        this.reviving = 0;

        // A way out, once it's been found
        const open = this.exitsOpen();
        for (const exit of this.exits) {
            if (open && !exit.found && Math.hypot(exit.x - this.px, exit.z - this.pz) < EXIT_SIGHT) {
                exit.found = true;
                this.hooks.onMessage("You spot a way out.");
            }
        }
        const exit = open ? this.exits.find((e) => e.actor && near(e.x, e.z)) : undefined;
        if (exit) {
            if (this.closed) {
                this.prompt = "The ways out have closed";
                return;
            }
            if (pressed) {
                // The way out is loud: the first moment of it wakes what's near
                if (!this.extractWoke) {
                    this.extractWoke = true;
                    if (this.coop?.role === "guest") {
                        this.coop.send({ k: "wake", x: round2(this.px), z: round2(this.pz) } satisfies UpMessage);
                    } else {
                        const woke = this.wakeNear(this.px, this.pz, EXTRACT_WAKE);
                        this.announce(woke > 0 ? "The way out groans open. Everything near has heard it." : "The way out groans open. Nothing stirs.");
                    }
                }
                this.extracting += dt;
                // Standing still, but a swing at whatever comes still plays
                if (this.swingIn < 0) {
                    this.player.play("idle");
                }
                this.prompt = `Escaping... ${Math.max(0, EXTRACT_SECONDS - this.extracting).toFixed(1)}s`;
                if (this.extracting >= EXTRACT_SECONDS) {
                    this.finishSelf("extracted");
                }
            } else {
                this.extracting = 0;
                this.extractWoke = false;
                this.prompt = "Hold E to escape: ten seconds unhurt, and everything near will hear it";
            }
            return;
        }
        this.extracting = 0;
        this.extractWoke = false;

        // Your gravestone, with what you left in it
        const grave = this.grave;
        if (grave && grave.items.length > 0 && near(grave.x, grave.z)) {
            const n = grave.items.reduce((sum, s) => sum + s.count, 0);
            this.prompt = `Press E to take back what you left here (${n} thing${n === 1 ? "" : "s"})`;
            if (pressed) {
                this.takeGrave();
            }
            return;
        }

        // The genie: a wish out, for coins, until the ways out close
        const ferry = this.ferry;
        if (ferry && Math.hypot(ferry.x - this.px, ferry.z - this.pz) < 1.8) {
            const fee = this.ferryFee();
            // Only what this run has found pays (and never more than's carried)
            const found = Math.min(this.coins, this.coinsFound);
            if (this.closed) {
                this.prompt = "The genie's wishes went with the ways out";
            } else if (found < fee) {
                this.prompt = `The genie wants ${fee.toLocaleString()} coins found on this map for a wish out; you've found ${found.toLocaleString()}`;
            } else {
                this.prompt = `Press E to pay the genie ${fee.toLocaleString()} coins for a wish out of the map`;
                if (pressed) {
                    this.keys.delete("KeyE");
                    this.coins -= fee;
                    this.coinsFound -= fee;
                    this.genie = true;
                    this.hooks.onChanged();
                    this.hooks.onMessage(`The genie takes ${fee.toLocaleString()} coins and grants your wish. The map fades.`);
                    this.finishSelf("extracted");
                }
            }
            return;
        }

        // The trader: a word when he's first in sight, a trade at his side
        const trader = this.trader;
        if (trader) {
            const d = Math.hypot(trader.x - this.px, trader.z - this.pz);
            if (!trader.seen && d < 10) {
                trader.seen = true;
                this.hooks.onMessage(
                    "A wandering trader has set up here. He sells food, potions and ammunition for the coins you carry, and buys what you've found.",
                );
            }
            if (d < 1.8) {
                this.prompt = "Press E to trade";
                if (pressed) {
                    this.keys.delete("KeyE");
                    this.hooks.onTrade();
                }
                return;
            }
        }

        // The clue scroll's spot: a word when it's close, the spade when
        // it's here
        this.matchClueSpots();
        for (const clue of this.clueSpots) {
            const d = Math.hypot(clue.x - this.px, clue.z - this.pz);
            if (d < 6 && !clue.near) {
                clue.near = true;
                this.hooks.onMessage("The ground about here has been dug before. The spot is close.");
            }
            if (d < CLUE_DIG_RANGE) {
                this.prompt = "Press E to dig here";
                if (pressed) {
                    this.dig(clue);
                }
                return;
            }
        }

        // The Depths' altar: the prayer bar full again, once a run
        for (const altar of this.altars) {
            if (!near(altar.x, altar.z)) {
                continue;
            }
            if (altar.used) {
                this.prompt = "You've prayed here already this run.";
                return;
            }
            this.prompt = "Press E to pray at the altar: a full prayer bar, once a run";
            if (pressed) {
                altar.used = true;
                this.prayer = 100;
                this.keys.delete("KeyE");
                this.hooks.onMessage("You pray at the altar, and your prayer is full again.");
            }
            return;
        }

        // The maps' own things (version 166)
        if (this.propInteraction(dt, pressed)) {
            return;
        }

        // Chests, and the vault, which wants its key
        for (const chest of this.chests) {
            if (chest.opened || !near(chest.tile.x, chest.tile.z)) {
                continue;
            }
            if (chest.vault && !this.inventory.some((s) => s.id === VAULT_KEY)) {
                this.prompt = "The vault is locked. One of this map's champions carries the key.";
                return;
            }
            if (chest.room === "brimstone" && !this.inventory.some((s) => s.id === BRIMSTONE_KEY)) {
                this.prompt = "The brimstone chest is locked. The first superior to fall drops its key.";
                return;
            }
            if (chest.room) {
                this.prompt = chest.room === "trap" ? "Press E to open the ornate chest (the floor round it looks weak)" : "Press E to unlock the brimstone chest";
                if (pressed) {
                    this.openChest(chest);
                }
                return;
            }
            if (chest.boss && this.goldenSpent()) {
                this.prompt = "The golden chest's lock has rusted shut: the Depths give up only one a run.";
                return;
            }
            if (chest.boss && !this.inventory.some((s) => s.id === BOSS_KEY)) {
                this.prompt = "The golden chest is locked. The boss has its key.";
                return;
            }
            this.prompt = chest.vault
                ? "Press E to unlock the vault"
                : chest.boss
                  ? "Press E to open the golden chest"
                  : chest.deep
                    ? "Press E to open the old chest (this deep in, nobody's been at it)"
                    : "Press E to open the chest";
            if (pressed) {
                this.openChest(chest);
            }
            return;
        }
    }

    // The Depths give up one golden chest a run, whoever opens it (version
    // 159); the rest stay shut
    private goldenSpent(): boolean {
        return this.world.bosses !== undefined && this.chests.some((c) => c.boss && c.opened);
    }

    // A chest opened, by this player unless said (the host opens them for
    // the guests, who ask)
    private openChest(chest: Chest, by: Hero = this.self): void {
        chest.opened = true;
        if (chest.actor) {
            this.scene.remove(chest.actor.root);
        }
        if (by === this.self) {
            this.chestsOpened++;
            if (chest.boss) {
                this.goldenOpened = true;
            }
        }
        const index = this.chests.indexOf(chest);
        if (this.coop?.role === "guest") {
            // The key's spent here; the host spills what's inside
            if (chest.vault) {
                removeItem(this.inventory, VAULT_KEY, 1);
                this.vaults++;
                this.hooks.onChanged();
            } else if (chest.boss) {
                removeItem(this.inventory, BOSS_KEY, 1);
                this.hooks.onChanged();
            } else if (chest.room === "brimstone") {
                removeItem(this.inventory, BRIMSTONE_KEY, 1);
                this.hooks.onChanged();
            }
            this.coop.send({ k: "open", c: index } satisfies UpMessage);
            return;
        }
        if (this.coop?.role === "host") {
            this.coop.send({ k: "opened", c: index, by: by.id } satisfies DownMessage);
        }
        // A mimic: no chest at all, but a champion of whatever lives here
        if (chest.mimic) {
            const pick = this.world.enemies[Math.floor(this.rng() * this.world.enemies.length)].def;
            void this.spawnEnemy(this.champion(pick), chest.tile).then((mimic) => {
                mimic.cooldown = 0.6;
                this.rouse(mimic);
            });
            this.announce("The chest bites!");
            return;
        }
        // A watched chest: what's about comes running
        if (chest.ambush) {
            let roused = 0;
            for (const e of this.enemies) {
                if (e.state === "idle" && !e.def.passive && Math.hypot(e.x - chest.tile.x, e.z - chest.tile.z) < 12) {
                    e.state = "chase";
                    roused++;
                }
            }
            if (roused > 0) {
                this.announce("The lid creaks. Something heard it.");
            }
        }
        // The chest is gone once opened; what was in it lies exactly where
        // it stood
        const tier = this.world.tier;
        const drop = (id: number, count: number) => this.dropPickup(id, count, chest.tile.x, chest.tile.z, 0);
        const gear = (tiers: { tier: number; weight: number }[], prizes = 0, from?: "boss" | "crystal") =>
            this.dropGear(tiers, chest.tile.x, chest.tile.z, prizes, 0, from);
        const purse = (min: number, max: number) => Math.round(randInt(this.rng, min, max) * Math.pow(2.2, tier - 1) * this.threat.coins);
        const potion = () => SHOP_POTIONS[Math.floor(this.rng() * SHOP_POTIONS.length)];
        // Nothing on a map is better than the map: the vault, the golden
        // chest and the caskets give the map's own tier, their chance of its
        // prize apart (and since version 158 only the golden chest gives
        // purple or gold: dropGear's `from`)
        const own = [{ tier, weight: 1 }];
        if (chest.vault) {
            // The key goes in the lock; two pieces of the map's tier, and a
            // purse to match
            if (by.me) {
                removeItem(this.inventory, VAULT_KEY, 1);
                this.vaults++;
            }
            gear(own, PRIZE_CASKET, "crystal");
            gear(own, PRIZE_CASKET, "crystal");
            drop(COINS, purse(200, 400));
            if (by.me) {
                playChime(true);
            }
            this.announce("The vault swings open.");
            this.hooks.onChanged();
            return;
        }
        // The Depths' trapped treasure room: two pieces at a champion's
        // prize odds and a fat purse, and the floor round it gives way
        if (chest.room === "trap") {
            gear(this.world.lootTiers, PRIZE_FULL);
            gear(this.world.lootTiers, PRIZE_FULL);
            drop(COINS, purse(200, 400));
            const falling: EnemyDef = { ...this.world.enemies[0].def, name: "The falling floor" };
            for (let i = 0; i < TRAP_RINGS; i++) {
                const angle = (i / TRAP_RINGS) * Math.PI * 2;
                const x = chest.tile.x + Math.cos(angle) * 1.6;
                const z = chest.tile.z + Math.sin(angle) * 1.6;
                this.hazard(x, z, 1.3, 1.0, (h) => this.hurtHero(h, falling, 0, "melee", true, Math.max(1, Math.round(h.maxHp * TRAP_HIT))));
            }
            this.hazard(chest.tile.x, chest.tile.z, 1.3, 1.0, (h) => this.hurtHero(h, falling, 0, "melee", true, Math.max(1, Math.round(h.maxHp * TRAP_HIT))));
            this.wakeNear(chest.tile.x, chest.tile.z, TRAP_ROUSE);
            this.shake(0.4);
            this.announce("The ornate chest swings open, and the floor round it gives way! Run!");
            return;
        }
        // The brimstone chest: a superior's key, two pieces as the crystal
        // chest gives them (a purple now and then) and a purse
        if (chest.room === "brimstone") {
            if (by.me) {
                removeItem(this.inventory, BRIMSTONE_KEY, 1);
                this.hooks.onChanged();
            }
            gear(this.world.lootTiers, PRIZE_CASKET, "crystal");
            gear(this.world.lootTiers, PRIZE_CASKET, "crystal");
            drop(COINS, purse(300, 600));
            this.announce("The brimstone chest's lock gives, and it's full.");
            return;
        }
        if (chest.boss) {
            // The boss's key goes in the lock. The prize: two or three pieces
            // of the map's tier (the tier's prizes among them), a potion and
            // a purse
            if (by.me) {
                removeItem(this.inventory, BOSS_KEY, 1);
                this.hooks.onChanged();
            }
            // (the only place purple and gold come from; the Depths' rolls
            // every tier, as the rest of their loot did before version 158)
            const count = 2 + (this.rng() < 0.5 ? 1 : 0);
            for (let i = 0; i < count; i++) {
                gear(this.world.caves ? this.world.lootTiers : own, PRIZE_BOSS_CHEST, "boss");
            }
            drop(potion(), 1);
            drop(COINS, purse(150, 300));
            this.announce("The golden chest creaks open.");
            return;
        }
        // Now and then a scrap of an old map under the rest (version 172)
        if (this.world.caves && this.rng() < SCRAP_CHANCE) {
            drop(MAP_SCRAP, 1);
        }
        // Deep in the map a chest has lain a long time untouched (version
        // 179): a piece at a champion's prize odds and a purse on top
        if (chest.deep) {
            gear(this.world.lootTiers, PRIZE_FULL);
            drop(COINS, purse(40, 120));
            this.announce("The old chest's hinges shriek. Nobody's had this one in a long time: there's more in it.");
        }
        // About half the chests hold gear, mostly the map's own tier; the
        // rest supplies, or a purse
        const roll = this.rng();
        if (roll < 0.55) {
            const count = randInt(this.rng, this.world.chestItems[0], this.world.chestItems[1]);
            for (let i = 0; i < count; i++) {
                gear(this.world.lootTiers);
            }
        } else if (roll < 0.85) {
            // The Depths' chests hold supplies far less often: a purse
            // instead (DEPTHS_SUPPLIES)
            const depths = this.world.bosses !== undefined;
            if (!this.clueDropped && this.rng() < 0.15) {
                this.clueDropped = true;
                drop(CLUE_SCROLL, 1);
            } else if (depths && this.rng() > DEPTHS_SUPPLIES) {
                // ...or a can or two of lantern oil (version 161)
                if (this.rng() < CHEST_OIL) {
                    drop(OIL_CAN, randInt(this.rng, 1, 2));
                } else {
                    drop(COINS, purse(60, 150));
                }
            } else if (this.rng() < 0.4) {
                drop(potion(), 1);
            } else {
                drop(FOOD_BY_TIER[Math.min(FOOD_BY_TIER.length - 1, tier - 1)], depths ? 1 : randInt(this.rng, 1, 2));
            }
        } else {
            // 15 to 40 until version 78, less than the food the same chest
            // might have held instead
            drop(COINS, purse(60, 150));
        }
        this.hooks.onMessage("The chest creaks open.");
    }

    // What fits of the grave's things comes back to the pack; the stone
    // goes once it's empty
    private takeGrave(): void {
        const grave = this.grave!;
        const left: ItemStack[] = [];
        let taken = 0;
        // As much of each as the pack's limits allow (version 154: food,
        // ammunition and thrown weapons came back past them)
        for (const stack of grave.items) {
            const n = roomFor(this.inventory, stack.id, stack.count);
            if (n > 0 && addItem(this.inventory, stack.id, n, this.packSize)) {
                taken += n;
                if (n < stack.count) {
                    left.push({ id: stack.id, count: stack.count - n });
                }
            } else {
                left.push(stack);
            }
        }
        grave.items = left;
        if (left.length === 0) {
            this.graveTaken = true;
            this.scene.remove(grave.actor.root);
            this.hooks.onMessage("You take back everything you left here. The stone crumbles.");
        } else if (taken > 0) {
            this.hooks.onMessage(`You take back what fits. ${left.length} thing${left.length === 1 ? " stays" : "s stay"} in the grave.`);
        } else if (this.time - this.fullMessageAt > 2) {
            this.hooks.onMessage("Your pack is full.");
            this.fullMessageAt = this.time;
        }
        this.hooks.onChanged();
    }

    // A clue scroll picked up: its spot is an open tile a good walk off, and
    // the scroll says which way and how far from where you stand
    private setClue(): void {
        const reach = this.region.flowField({ x: this.px, z: this.pz });
        let spot: Tile | undefined;
        for (let tries = 0; tries < 30 && !spot; tries++) {
            const t = this.region.randomTile(this.rng, reach, CLUE_MIN_STEPS, new Set());
            if (t && this.region.flowAt(reach, t.x, t.z) <= CLUE_MAX_STEPS) {
                spot = t;
            }
        }
        let chosen = spot ?? this.region.randomTile(this.rng, reach, CLUE_MIN_STEPS, new Set()) ?? { x: this.px, z: this.pz };
        // Not on another scroll's spot, so each is a casket of its own
        const clash = (p: { x: number; z: number }) => this.clueSpots.some((c) => Math.hypot(c.x - p.x, c.z - p.z) < CLUE_DIG_RANGE * 2);
        for (let tries = 0; tries < 30 && clash(chosen); tries++) {
            const other = this.region.randomTile(this.rng, reach, CLUE_MIN_STEPS, new Set());
            if (other) {
                chosen = other;
            }
        }
        this.clueSpots.push({ x: chosen.x, z: chosen.z, near: false });
        this.readClue();
    }

    // One spot per scroll in the pack: a scroll dropped (or taken from the
    // pack some other way) takes the newest spot with it
    private matchClueSpots(): void {
        const held = this.inventory.reduce((n, s) => n + (s.id === CLUE_SCROLL ? s.count : 0), 0);
        if (this.clueSpots.length > held) {
            this.clueSpots.length = held;
        }
    }

    // The scrolls' directions, from where you stand now (so reading again
    // nearer narrows a spot down), the nearest first
    readClue(): void {
        this.matchClueSpots();
        if (this.clueSpots.length === 0 || this.dead) {
            return;
        }
        const by = (c: { x: number; z: number }) => Math.hypot(c.x - this.px, c.z - this.pz);
        const spots = [...this.clueSpots].sort((a, b) => by(a) - by(b));
        const lines = spots.map((clue) => {
            const paces = Math.round(by(clue));
            return paces < 2 ? "dig where you stand" : `dig ${paces} paces to the ${this.compassTo(clue.x, clue.z)} of where you stand`;
        });
        this.hooks.onMessage(
            lines.length === 1
                ? `The scroll reads: ${lines[0]}.`
                : `Your ${lines.length} scrolls read: ${lines.map((l, i) => `${i + 1}) ${l}`).join("; ")}.`,
        );
    }

    // The casket: two pieces of gear of the map's tier (its prize among
    // them, now and then), and a purse
    private dig(clue: { x: number; z: number; near: boolean }): void {
        this.clueSpots = this.clueSpots.filter((c) => c !== clue);
        removeItem(this.inventory, CLUE_SCROLL, 1);
        this.clues++;
        this.player.play("idle");
        this.hooks.onMessage("You dig up a casket and prise it open.");
        this.hooks.onChanged();
        if (this.coop?.role === "guest") {
            // The host drops what's in it
            this.coop.send({ k: "dig", x: round2(clue.x), z: round2(clue.z) } satisfies UpMessage);
            return;
        }
        this.dropCasket(clue.x, clue.z);
    }

    // What a casket holds, spilled about the spot
    private dropCasket(x: number, z: number): void {
        const tier = this.world.tier;
        const scatter = () => [x + (this.rng() - 0.5) * 1.2, z + (this.rng() - 0.5) * 1.2] as const;
        for (let i = 0; i < 2; i++) {
            this.dropGear([{ tier, weight: 1 }], ...scatter(), PRIZE_CASKET);
        }
        this.dropPickup(COINS, Math.round(randInt(this.rng, 40, 80) * Math.pow(2.2, tier - 1) * this.threat.coins), ...scatter());
    }

    // -----------------------------------------------------------------------
    // Co-op: what the host sends (party.ts has the shapes)

    // The map as the host laid it out, for the guests, with every enemy on
    // it; after this, each new enemy goes on its own (spawnEnemy)
    private sendWorld(): void {
        const coop = this.coop;
        if (coop?.role !== "host") {
            return;
        }
        for (const e of this.enemies) {
            this.defCode(e.def);
        }
        const exits = this.exits.length > 0 ? this.exits : [{ x: this.px, z: this.pz }];
        coop.send({
            k: "world",
            exits: exits.map((e) => [round2(e.x), round2(e.z)] as [number, number]),
            chests: this.chests.map((c) => [
                round2(c.tile.x),
                round2(c.tile.z),
                c.vault ? 2 : c.boss ? 1 : c.room === "trap" ? 3 : c.room === "brimstone" ? 4 : c.deep ? 5 : 0,
            ]),
            altars: this.altars.map((a) => [round2(a.x), round2(a.z)]),
            props: this.props.map((p) => [PROP_KINDS.indexOf(p.kind), round2(p.x), round2(p.z), round2(p.rotation), p.data, p.uses]),
            trader: this.trader ? [round2(this.trader.x), round2(this.trader.z), round2(this.trader.rotation)] : undefined,
            ferry: this.ferry ? [round2(this.ferry.x), round2(this.ferry.z), round2(this.ferry.rotation)] : undefined,
            defs: this.defs.slice(),
            spawns: this.enemies.map((e) => this.spawnMessage(e)),
        } satisfies DownMessage);
        this.worldSent = true;
    }

    // An enemy's colour changed for good: enraged, or reborn
    private sendTint(e: Enemy, code: 1 | 2): void {
        e.tintCode = code;
        if (this.coop?.role === "host") {
            this.coop.send({ k: "tint", u: e.uid, c: code } satisfies DownMessage);
        }
    }

    // What this player's doing, as the others' copy of them plays it
    private selfAnim(): HeroAnim {
        if (this.dead) {
            return HERO_DEATH;
        }
        const clip = this.player.current;
        if (clip !== undefined && clip.startsWith("run")) {
            return HERO_RUN;
        }
        if (clip === undefined || clip.startsWith("idle")) {
            return HERO_IDLE;
        }
        return HERO_ATTACK;
    }

    private selfState(): HeroState {
        return [
            this.self.id,
            round2(this.px),
            round2(this.pz),
            round2(this.facing),
            Math.round(this.hp),
            this.maxHp,
            this.selfAnim(),
            this.attacks % 100,
            this.dead ? 1 : 0,
            prayCode(this.protect),
        ];
    }

    // What an enemy's model is playing, as a code
    private clipCode(e: Enemy): EnemyClip {
        switch (e.actor.current) {
            case "walk":
                return CLIP_WALK;
            case "attack":
                return CLIP_ATTACK;
            case "death":
                return CLIP_DEATH;
            default:
                return CLIP_IDLE;
        }
    }

    // The snapshot, SNAPSHOT_HZ times a second: every hero, and every enemy
    // that's up, or near a hero and moved (or due a keyframe), or just fallen
    private sendSnapshot(dt: number): void {
        const coop = this.coop;
        if (coop?.role !== "host") {
            return;
        }
        this.snapshotIn -= dt;
        if (this.snapshotIn > 0) {
            return;
        }
        this.snapshotIn = 1 / SNAPSHOT_HZ;
        this.snapshots++;
        const keyframe = this.snapshots % KEYFRAME_EVERY === 0;
        const heroes: HeroState[] = [];
        if (!this.done) {
            heroes.push(this.selfState());
        }
        for (const m of this.mates.values()) {
            if (!m.done) {
                heroes.push(m.state());
            }
        }
        // Every enemy near a hero that's changed since it was last sent (or
        // is due a keyframe, or has just fallen), nearest first, up to the
        // snapshot's limit: the rest stay changed and go next time
        const candidates: { e: Enemy; clip: EnemyClip; dist: number }[] = [];
        for (const e of this.enemies) {
            const clip = this.clipCode(e);
            const changed =
                Math.abs(e.x - e.sentX) > 0.05 || Math.abs(e.z - e.sentZ) > 0.05 || clip !== e.sentClip || e.state !== e.sentState || e.hp !== e.sentHp;
            if (e.state === "dead") {
                if (e.sentState === "dead") {
                    continue;
                }
            } else if (!changed && !keyframe) {
                continue;
            }
            let dist = Infinity;
            for (const h of heroes) {
                dist = Math.min(dist, Math.hypot(h[1] - e.x, h[2] - e.z));
            }
            if (dist > SNAPSHOT_RANGE && e.state !== "dead") {
                continue;
            }
            candidates.push({ e, clip, dist });
        }
        candidates.sort((a, b) => a.dist - b.dist);
        const shots: EnemyShot[] = [];
        for (const { e, clip } of candidates.slice(0, SNAPSHOT_MAX_ENEMIES)) {
            shots.push([e.uid, round1(e.x), round1(e.z), round1(e.facing), Math.round(e.hp), clip, e.attacks % 100, STATE_CODES[e.state]]);
            e.sentX = e.x;
            e.sentZ = e.z;
            e.sentClip = clip;
            e.sentState = e.state;
            e.sentHp = e.hp;
        }
        coop.send({
            k: "s",
            t: Math.round(this.time * 10) / 10,
            left: Math.round(this.timeLeft),
            f: (this.awake ? 1 : 0) | (this.closed ? 2 : 0),
            h: heroes,
            e: shots,
            al:
                this.allies.length > 0
                    ? this.allies.map((a) => [a.uid, round1(a.x), round1(a.z), round1(a.facing), a.walking ? 1 : 0, a.attacks % 100] as [number, number, number, number, 0 | 1, number])
                    : undefined,
        } satisfies DownMessage);
    }

    // A guest's word on where it is, as often as the host's snapshots
    private sendMove(dt: number): void {
        const coop = this.coop;
        if (coop?.role !== "guest" || this.done) {
            return;
        }
        this.moveIn -= dt;
        if (this.moveIn > 0) {
            return;
        }
        this.moveIn = 1 / SNAPSHOT_HZ;
        coop.send({
            k: "move",
            x: round2(this.px),
            z: round2(this.pz),
            f: round2(this.facing),
            hp: Math.round(this.hp),
            mh: this.maxHp,
            a: this.selfAnim(),
            ac: this.attacks % 100,
            d: this.defenceTriple(),
            dead: this.dead ? 1 : 0,
            p: prayCode(this.protect),
        } satisfies UpMessage);
    }

    // -----------------------------------------------------------------------
    // Co-op: what a guest does with the host's word, and the host with a
    // guest's

    // A hero by their id: this player, or a mate
    private heroById(id: string): Hero | undefined {
        return id === this.self.id ? this.self : this.mates.get(id);
    }

    // A guest's copies of the host's enemies, eased to where the last
    // snapshot put them, playing what the host says they're playing
    private updateGhosts(dt: number): void {
        const k = 1 - Math.exp(-12 * dt);
        for (const e of this.enemies) {
            if (e.flash > 0) {
                e.flash -= dt;
                if (e.flash <= 0 && e.state !== "dead") {
                    tint(e.actor, e.tint);
                }
            }
            if (e.state === "dead") {
                this.fadeDead(e, dt);
                continue;
            }
            e.x += (e.targetX - e.x) * k;
            e.z += (e.targetZ - e.z) * k;
            let turn = e.targetFacing - e.facing;
            turn = Math.atan2(Math.sin(turn), Math.cos(turn));
            e.facing += turn * k;
            if (e.attacks !== e.seenAttacks) {
                e.seenAttacks = e.attacks;
                play(e.actor, "attack", { once: true });
                this.hear(npcSound(e.def.npcId, "attack"), e.x, e.z, 0.35);
            } else if (e.sentClip === CLIP_WALK) {
                play(e.actor, "walk");
            } else if (e.sentClip === CLIP_IDLE || e.actor.current !== "attack") {
                play(e.actor, "idle");
            }
            e.actor.root.position.set(e.x, this.groundY(e.x, e.z), e.z);
            e.actor.root.rotation.y = e.facing;
            this.updateHealthBar(e, dt);
        }
    }

    // An enemy def from the host's table, for a guest's copy: what's drawn
    // and named; it fights nothing here
    private readonly ghostDefs = new Map<number, EnemyDef>();

    private ghostDef(code: number, lite: EnemyDefLite): EnemyDef {
        let def = this.ghostDefs.get(code);
        if (!def) {
            def = {
                id: lite.id ?? `ghost:${code}`,
                superior: lite.superior ? true : undefined,
                npcId: lite.npc,
                name: lite.name,
                hp: lite.hp,
                damage: 0,
                speed: 0,
                radius: lite.radius,
                attackInterval: 1,
                attackRange: 0,
                aggro: 0,
                coins: [0, 0],
                foodChance: 0,
                scale: lite.scale,
                boss: lite.boss ? true : undefined,
                champion: lite.champion ? true : undefined,
                shoots: lite.shoots ? { style: lite.shoots, projectile: 0 } : undefined,
            };
            this.ghostDefs.set(code, def);
        }
        return def;
    }

    private async spawnGhost(message: SpawnMessage): Promise<void> {
        if (message.def) {
            this.defs[message.d] = message.def;
        }
        const lite = this.defs[message.d];
        if (!lite || this.ghosts.has(message.u) || this.ended) {
            return;
        }
        const def = this.ghostDef(message.d, lite);
        // Its fall can come while its model loads (version 154: then it
        // stood for good, as the host never says a dead one's dead again)
        this.ghostsLoading.add(message.u);
        const e = await this.makeEnemy(def, message.x, message.z, message.f, message.t as Trait | undefined, message.u);
        this.ghostsLoading.delete(message.u);
        e.key = !!message.key;
        this.ghosts.set(message.u, e);
        if (this.ghostsKilled.delete(message.u)) {
            this.ghostDied(e);
        }
    }

    // A ghost's fall heard before it's here (spawnGhost)
    private ghostFell(u: number): void {
        if (this.ghostsLoading.has(u)) {
            this.ghostsKilled.add(u);
        }
    }

    // The map as the host laid it out
    private applyWorld(message: Extract<DownMessage, { k: "world" }>): void {
        this.exits = message.exits.map(([x, z]) => ({ x, z, found: false }));
        for (const exit of this.exits) {
            void createActor("locs", EXIT_LOC).then((a) => {
                if (!this.ended) {
                    this.placeExit(a, exit);
                }
            });
        }
        this.chests = message.chests.map(([x, z, kind]) => ({
            tile: { x, z },
            opened: false,
            boss: kind === 1,
            vault: kind === 2,
            room: kind === 3 ? "trap" : kind === 4 ? "brimstone" : undefined,
            deep: kind === 5,
        }));
        for (const chest of this.chests) {
            void this.loadChest(chest);
        }
        this.altars = (message.altars ?? []).map(([x, z]) => ({ x, z, used: false }));
        for (const altar of this.altars) {
            void this.loadAltar(altar);
        }
        // (in the host's order: a thing's place is how it's named after)
        this.props = (message.props ?? []).map(([k, x, z, rotation, data, uses]) => ({ kind: PROP_KINDS[k] ?? "search", x, z, rotation, data, uses }));
        for (const p of this.props) {
            this.propPlaced(p);
            void this.loadProp(p);
        }
        if (message.trader) {
            const [x, z, rotation] = message.trader;
            this.trader = { x, z, rotation, seen: false };
            void this.loadTrader();
        }
        if (message.ferry) {
            const [x, z, rotation] = message.ferry;
            this.ferry = { x, z, rotation };
            void this.loadFerry();
        }
        this.defs.length = 0;
        this.defs.push(...message.defs);
        for (const spawn of message.spawns) {
            void this.spawnGhost(spawn);
        }
        this.hooks.onMessage(`There are ${this.exits.length} ways out, the nearest somewhere to the ${this.exitCompass()}: find one, or ${this.world.bosses ? "a" : "the"} boss will tell you.`);
    }

    // Who guards the golden chests, for the run's first message
    private bossGuards(): string {
        if (!this.world.bosses) {
            return "the boss guards a golden one";
        }
        const names = this.enemies.filter((e) => e.def.boss).map((e) => e.def.name);
        return names.length > 0
            ? `${names.length} bosses each guard a golden one, far apart: ${names.join(", ")}`
            : `${ENDLESS_BOSSES} bosses each guard a golden one, far apart`;
    }

    private applySnapshot(s: Extract<DownMessage, { k: "s" }>): void {
        this.hostLeft = s.left;
        this.awake = (s.f & 1) !== 0;
        this.closed = (s.f & 2) !== 0;
        for (const [u, x, z, facing, walking, attacks] of s.al ?? []) {
            const a = this.allies.find((y) => y.uid === u);
            if (a) {
                a.targetX = x;
                a.targetZ = z;
                a.targetFacing = facing;
                a.walking = walking === 1;
                a.attacks = attacks;
                if (Math.hypot(x - a.x, z - a.z) > 5) {
                    a.x = x;
                    a.z = z;
                }
            }
        }
        for (const state of s.h) {
            if (state[0] === this.self.id) {
                continue;
            }
            const m = this.mates.get(state[0]);
            if (m && !m.done) {
                m.apply(state);
            }
        }
        for (const [u, x, z, facing, hp, clip, attacks, state] of s.e) {
            const e = this.ghosts.get(u);
            if (!e) {
                if (STATE_NAMES[state] === "dead") {
                    this.ghostFell(u);
                }
                continue;
            }
            e.targetX = x;
            e.targetZ = z;
            e.targetFacing = facing;
            if (Math.hypot(x - e.x, z - e.z) > 5) {
                e.x = x;
                e.z = z;
                e.facing = facing;
            }
            // Someone else's hit shows as one; this player's showed already
            if (hp < e.hp && this.time - e.myHitAt > 0.4 && e.state !== "dead") {
                e.flash = 0.12;
                e.barShown = BAR_SECONDS;
                tint(e.actor, new THREE.Color(1.6, 0.6, 0.6));
                this.splat(e.x, e.z, e.actor.height * (e.def.scale ?? 1) * 0.7, e.hp - hp);
            }
            e.hp = hp;
            const name = STATE_NAMES[state];
            if (name === "dead") {
                this.ghostDied(e);
            } else {
                e.state = name;
            }
            e.sentClip = clip;
            e.attacks = attacks;
        }
    }

    // A body lies a few seconds, then goes, its health bar with it (version
    // 154: the bar stayed in the scene, hidden, and the body's animation
    // kept being worked out every frame till the run ended)
    private fadeDead(e: Enemy, dt: number): void {
        if (e.deadFor > DEAD_BODY_SECONDS) {
            return;
        }
        e.deadFor += dt;
        if (e.bar) {
            e.bar.group.visible = false;
        }
        if (e.deadFor > DEAD_BODY_SECONDS) {
            this.scene.remove(e.actor.root);
            if (e.bar) {
                this.scene.remove(e.bar.group);
            }
        }
    }

    private ghostDied(e: Enemy): void {
        if (e.state === "dead") {
            return;
        }
        e.state = "dead";
        e.hp = 0;
        e.deadFor = 0;
        tint(e.actor, new THREE.Color(1, 1, 1));
        play(e.actor, "death", { once: true });
        this.hear(npcSound(e.def.npcId, "death"), e.x, e.z, 0.5);
    }

    private static goneText(name: string, how: "extracted" | "died" | "left"): string {
        return how === "extracted" ? `${name} escaped with their loot.` : how === "died" ? `${name} has died.` : `${name} left the run.`;
    }

    // A mate's out of the run: their copy goes (or, fallen, stays lying
    // where they fell, for everyone to see), and on the host the rest of the
    // party hears
    private mateGone(mate: Mate, how: "extracted" | "died" | "left"): void {
        if (mate.done) {
            return;
        }
        mate.done = true;
        if (how === "died" || mate.dead) {
            mate.lieDown();
        } else {
            mate.remove();
        }
        this.hooks.onMessage(Run.goneText(mate.name, how));
        if (this.coop?.role === "host") {
            this.coop.send({ k: "gone", id: mate.id, how } satisfies DownMessage);
        }
        this.checkPartyDone();
    }

    // What the host sent (a guest's side)
    receiveDown(message: unknown): void {
        if (!isDown(message) || this.ended || this.coop?.role !== "guest") {
            return;
        }
        const me = this.self.id;
        switch (message.k) {
            case "s":
                this.applySnapshot(message);
                break;
            case "world":
                this.applyWorld(message);
                break;
            case "spawn":
                void this.spawnGhost(message);
                break;
            case "gear":
                if (message.id !== this.coop?.me) {
                    this.mates.get(message.id)?.wear(message.e);
                }
                break;
            case "tint": {
                const e = this.ghosts.get(message.u);
                if (e) {
                    e.tintCode = message.c;
                    e.tint = message.c === 1 ? new THREE.Color(1.4, 0.75, 0.75) : message.c === 2 ? new THREE.Color(0.8, 1.25, 0.8) : new THREE.Color(1, 1, 1);
                    tint(e.actor, e.tint);
                    if (message.c === 2) {
                        e.actor.root.scale.setScalar((e.def.scale ?? 1) * 1.15);
                    }
                }
                break;
            }
            case "boost": {
                const e = this.ghosts.get(message.u);
                if (e) {
                    e.def = { ...e.def, hp: message.hp, damage: message.d };
                    if (message.h) {
                        e.hunting = true;
                        this.huntWarned = Infinity;
                    }
                }
                break;
            }
            case "seal":
                if (message.on && !this.sealed && this.cave) {
                    this.shutLair(message.c);
                } else if (!message.on) {
                    this.openLair();
                }
                break;
            case "flood":
                if (message.on && this.cave && !this.floods.some((f) => f.cell === message.c)) {
                    this.flood(message.c);
                } else if (!message.on) {
                    this.drain(message.c);
                }
                break;
            case "gas":
                this.addGas(message.x, message.z, message.r, message.l);
                break;
            case "drop":
                this.dropPickup(message.i, message.n, message.x, message.z, 0, message.u);
                break;
            case "balloons":
                if (Array.isArray(message.b)) {
                    for (const [u, x, z, c] of message.b) {
                        this.addBalloon(Number(u), Number(x), Number(z), Number(c) || 0);
                    }
                }
                break;
            case "burst": {
                const b = this.balloons.find((x) => x.uid === message.u);
                if (b) {
                    this.burstBalloon(b);
                }
                break;
            }
            case "share":
                if (Array.isArray(message.s)) {
                    this.takeShare(String(message.by), Number(message.n) || 0, message.s);
                }
                break;
            case "taken": {
                const p = this.pickups.find((x) => x.uid === message.u);
                this.requested.delete(message.u);
                if (p) {
                    if (message.to === me) {
                        const n = message.n ?? p.count;
                        // No room after all: it goes back down where this
                        // player stands, for anyone (version 154: it was lost)
                        if (!this.takeItem(p.id, n) && this.coop) {
                            this.coop.send({ k: "drop", i: p.id, n, x: round2(this.px), z: round2(this.pz) } satisfies UpMessage);
                        }
                        this.hooks.onChanged();
                    }
                    // Part taken: the rest stays where it is
                    if (message.left !== undefined && message.left > 0) {
                        p.count = message.left;
                    } else {
                        this.removePickup(p);
                    }
                }
                break;
            }
            case "prop":
                this.applyProp(message);
                break;
            case "ally":
                this.applyAlly(message);
                break;
            case "opened": {
                const chest = this.chests[message.c];
                if (chest) {
                    chest.opened = true;
                    if (chest.actor) {
                        this.scene.remove(chest.actor.root);
                    }
                }
                break;
            }
            case "hazard":
                this.hazard(message.x, message.z, message.r, message.l, () => undefined);
                break;
            case "shot": {
                const hero = this.heroById(message.to);
                if (hero) {
                    void this.launch(message.x, message.z, message.y, message.p, { hero, visual: true, impact: message.i, cast: message.c });
                }
                break;
            }
            case "pshot": {
                const mate = this.mates.get(message.from);
                const e = this.ghosts.get(message.u);
                if (mate && e && message.from !== me) {
                    const spell = this.mateSpell(mate, message.s);
                    void this.launch(mate.x, mate.z, this.groundY(mate.x, mate.z) + 1.0, message.p, { target: e, visual: true, impact: message.i, hitSound: spell?.hitSound });
                }
                break;
            }
            case "hurt":
                if (message.to === me) {
                    this.applyHit(message.hit, message.by, message.style, !!message.pierce, !!message.fixed);
                    if (message.venom && !this.dead) {
                        this.poison();
                    }
                }
                break;
            case "kill": {
                const e = this.ghosts.get(message.u);
                if (e) {
                    this.ghostDied(e);
                } else {
                    this.ghostFell(message.u);
                }
                if (message.by === me) {
                    this.kills++;
                    if (message.champion) {
                        this.championKills++;
                    }
                    // (the contract and a frenzy's heal, version 172)
                    if (e) {
                        this.killedOne(e.def);
                    }
                    if (e?.def.superior) {
                        this.superiorKills++;
                    }
                    if (this.stats.ranged) {
                        this.rangedKills++;
                    }
                }
                if (message.boss) {
                    this.bossKills++;
                    this.revealNearestExit();
                    const name = e?.def.name ?? "The boss";
                    // (the party's king slain: version 172)
                    if (name === "The Forgotten King") {
                        this.kingSlain = true;
                    }
                    this.hooks.onMessage(`${name} falls. The golden chest is yours. The nearest way out is ${this.exitDirection()}.`);
                    const pets = this.carry.pets ?? [];
                    if (!this.world.bosses && !pets.includes(this.world.id) && !this.petFound && this.rng() < 1 / PET_ONE_IN) {
                        this.petFound = this.world.id;
                        this.hooks.onMessage(`Something small crawls out from under ${name}. It seems to like you.`);
                    }
                }
                break;
            }
            case "msg":
                if (!message.to || message.to === me) {
                    this.hooks.onMessage(message.text);
                }
                break;
            case "go":
                this.holding = false;
                this.prompt = "";
                this.clock.getDelta();
                break;
            case "revive":
                if (message.id === me) {
                    this.standUp(message.by);
                } else {
                    const mate = this.mates.get(message.id);
                    if (mate) {
                        mate.revivedAt = this.time;
                    }
                }
                break;
            case "gone": {
                const mate = this.mates.get(message.id);
                if (mate) {
                    this.mateGone(mate, message.how);
                }
                break;
            }
            case "over":
                this.partyOver = true;
                if (!this.done) {
                    this.hooks.onMessage(
                        this.dead ? "The host's run is over, with you still down. Everything you carried is lost." : "The host's run is over. You're out, with what you carry.",
                    );
                }
                this.end(this.done ?? (this.dead ? "died" : "extracted"));
                break;
        }
    }

    // What a guest sent (the host's side)
    receiveUp(from: string, message: unknown): void {
        if (!isUp(message) || this.ended || this.coop?.role !== "host") {
            return;
        }
        const coop = this.coop;
        const mate = this.mates.get(from);
        if (!mate || mate.done) {
            return;
        }
        // What a guest's word can be (version 153, as a code check found):
        // the host took every message at its word, so a changed game could
        // hit for anything or heal an enemy, drop any item, open the vault
        // without its key or dig caskets with no clue. Numbers must be
        // numbers, a guest must be near what it acts on, a hit can be no
        // more than its gear could do, and the keys and clue scrolls it uses
        // are ones this host handed it
        const near = (x: unknown, z: unknown, reach: number) => finite(x) && finite(z) && Math.hypot(mate.x - x, mate.z - z) <= reach;
        switch (message.k) {
            case "move": {
                if (![message.x, message.z, message.f, message.hp, message.mh].every(finite)) {
                    break;
                }
                const wasDown = mate.dead;
                const d = Array.isArray(message.d) && message.d.length === 3 && message.d.every(finite) ? message.d : mate.defenceVs;
                mate.move(message.x, message.z, message.f, message.hp, message.mh, message.a, message.ac, d, message.dead === 1);
                // Their protection, for its icon over them here and in the snapshot
                mate.protect = PRAY_NAMES[message.p ?? 0] ?? "none";
                // A guest just fell with others still standing: everyone hears
                if (!wasDown && mate.dead && ((!this.dead && !this.done) || this.othersRemain())) {
                    this.announce(Run.downText(mate.name));
                }
                break;
            }
            case "revive": {
                const target = typeof message.id === "string" ? this.heroById(message.id) : undefined;
                if (target && near(target.x, target.z, REVIVE_RANGE + GUEST_LAG)) {
                    this.revive(message.id, mate);
                }
                break;
            }
            case "hit": {
                const e = this.enemies.find((x) => x.uid === message.u);
                const most = Math.max(GUEST_HIT_MIN, (this.guestMaxHit.get(from) ?? 0) * GUEST_HIT_SCALE);
                if (e && e.state !== "dead" && finite(message.d) && message.d >= 0 && message.d <= most && near(e.x, e.z, GUEST_SHOT_REACH)) {
                    const share = (v: unknown, cap: number) => (finite(v) && v >= 0 ? Math.min(cap, v) : undefined);
                    this.damageEnemy(e, Math.round(message.d), mate, {
                        slow: !!message.slow,
                        stall: !!message.stall,
                        freeze: share(message.frz, 20),
                        weaken: share(message.wk, 0.15),
                        poison: share(message.psn, 30),
                    });
                }
                break;
            }
            case "shot": {
                const e = this.enemies.find((x) => x.uid === message.u);
                if (e) {
                    const spell = this.mateSpell(mate, message.s);
                    coop.send({ k: "pshot", from, u: message.u, p: message.p, i: message.i, s: spell?.id } satisfies DownMessage);
                    void this.launch(mate.x, mate.z, this.groundY(mate.x, mate.z) + 1.0, message.p, { target: e, visual: true, impact: message.i, hitSound: spell?.hitSound });
                }
                break;
            }
            case "take": {
                const found = this.pickups.find((x) => x.uid === message.u);
                const p = found && near(found.x, found.z, GUEST_REACH) ? found : undefined;
                if (p && p.id === COINS && this.splitsLoot()) {
                    this.shareCoins(from, p.count);
                    coop.send({ k: "taken", u: p.uid } satisfies DownMessage);
                    this.removePickup(p);
                    break;
                }
                if (p) {
                    // Part of it, when that's all the guest has room for
                    const n = finite(message.n) ? Math.floor(message.n) : p.count;
                    if (n > 0 && n < p.count) {
                        p.count -= n;
                        this.guestHold(from, p.id, n);
                        coop.send({ k: "taken", u: p.uid, to: from, n, left: p.count } satisfies DownMessage);
                    } else {
                        this.guestHold(from, p.id, p.count);
                        coop.send({ k: "taken", u: p.uid, to: from } satisfies DownMessage);
                        this.removePickup(p);
                    }
                }
                break;
            }
            case "drop": {
                // A real item, not an owner's own, at their feet; a key or a
                // clue only one this host handed them
                const item = finite(message.i) ? ITEM_BY_ID.get(message.i) : undefined;
                const n = message.n;
                if (
                    item &&
                    !item.exclusive &&
                    Number.isInteger(n) &&
                    n > 0 &&
                    n <= 1000 &&
                    near(message.x, message.z, GUEST_REACH) &&
                    (!HELD_BY_HOST.has(item.id) || this.guestSpend(from, item.id, n))
                ) {
                    this.dropPickup(item.id, n, message.x, message.z, 0);
                }
                break;
            }
            case "use": {
                // One of the map's things, from where the guest stands
                const p = finite(message.i) ? this.props[message.i] : undefined;
                const hold = message.a === 1;
                if (p && near(p.x, p.z, GUEST_REACH + PROP_REACH + this.propSize(p)) && this.propReady(p, hold)) {
                    this.propWorld(p, mate, hold);
                }
                break;
            }
            case "open": {
                const chest = finite(message.c) ? this.chests[message.c] : undefined;
                if (
                    chest &&
                    !chest.opened &&
                    near(chest.tile.x, chest.tile.z, GUEST_REACH) &&
                    (!chest.vault || this.guestSpend(from, VAULT_KEY, 1)) &&
                    (chest.room !== "brimstone" || this.guestSpend(from, BRIMSTONE_KEY, 1)) &&
                    (!chest.boss || (!this.goldenSpent() && this.guestSpend(from, BOSS_KEY, 1)))
                ) {
                    this.openChest(chest, mate);
                }
                break;
            }
            case "dig":
                if (near(message.x, message.z, GUEST_REACH) && this.guestSpend(from, CLUE_SCROLL, 1)) {
                    this.dropCasket(message.x, message.z);
                    this.announce(`${mate.name} digs up a casket.`);
                }
                break;
            case "wake": {
                const woke = this.wakeNear(message.x, message.z, EXTRACT_WAKE);
                this.announce(woke > 0 ? `${mate.name} opens the way out. Everything near has heard it.` : `${mate.name} opens the way out. Nothing stirs.`);
                break;
            }
            case "gear": {
                // Drawn here, and passed on to the other guests: only items
                // the game has, each in its own slot
                const e: Equipment = {};
                if (typeof message.e === "object" && message.e !== null) {
                    for (const [slot, id] of Object.entries(message.e as Record<string, unknown>)) {
                        const item = finite(id) ? ITEM_BY_ID.get(id) : undefined;
                        if (item && item.slot === slot) {
                            e[slot as keyof Equipment] = item.id;
                        }
                    }
                }
                this.guestMaxHit.set(from, gearStats(e).damage);
                mate.wear(e);
                coop.send({ k: "gear", id: from, e } satisfies DownMessage);
                break;
            }
            case "loaded":
                this.waitingFor.delete(from);
                break;
            case "gone":
                this.mateGone(mate, message.how);
                break;
        }
    }

    // A key or clue scroll handed to a guest, counted; spent when it's used
    // or put down, and only if it's there
    private guestHold(from: string, id: number, n: number): void {
        if (!HELD_BY_HOST.has(id)) {
            return;
        }
        let held = this.guestHolds.get(from);
        if (!held) {
            held = new Map();
            this.guestHolds.set(from, held);
        }
        held.set(id, (held.get(id) ?? 0) + n);
    }

    private guestSpend(from: string, id: number, n: number): boolean {
        const held = this.guestHolds.get(from);
        const has = held?.get(id) ?? 0;
        if (!held || has < n) {
            return false;
        }
        held.set(id, has - n);
        return true;
    }

    // The relay says a player left the room
    coopLeft(id: string): void {
        const mate = this.mates.get(id);
        if (mate && !mate.done) {
            this.mateGone(mate, "left");
        }
    }

    // The connection to the party's gone: a guest is out with what they
    // carry; the host plays on alone
    coopLost(text: string): void {
        if (this.ended || !this.coop) {
            return;
        }
        this.hooks.onMessage(text);
        if (this.coop.role === "guest") {
            this.partyOver = true;
            this.end(this.done ?? (this.dead ? "died" : "extracted"));
            return;
        }
        for (const mate of this.mates.values()) {
            if (!mate.done) {
                mate.done = true;
                mate.remove();
            }
        }
        this.holding = false;
        this.checkPartyDone();
    }

    // -----------------------------------------------------------------------
    // The trader

    // Buying from the trader: the coins carried pay, the pack has to have room
    buy(id: number, count: number, cost: number): boolean {
        if (this.dead) {
            return false;
        }
        if (this.coins < cost) {
            this.hooks.onMessage("You haven't the coins for that.");
            return false;
        }
        if (!canCarry(this.inventory, id, count)) {
            this.hooks.onMessage(carryLimitText(id));
            return false;
        }
        if (!addItem(this.inventory, id, count, this.packSize)) {
            this.hooks.onMessage("Your pack is full.");
            return false;
        }
        this.coins -= cost;
        this.traderBuys++;
        this.hooks.onChanged();
        return true;
    }

    // Selling him a piece from the pack, at the shop's buying price
    sell(id: number): boolean {
        const item = getItem(id);
        // The owner's kept kit (kit.ts) isn't for selling
        if (isKept(id)) {
            this.hooks.onMessage(`${item.name} is kept: it isn't for sale.`);
            return false;
        }
        if (this.dead || !item.slot || !removeItem(this.inventory, id, 1)) {
            return false;
        }
        // Coins, but not coins found here (version 154: gear brought from
        // the guild and sold paid the genie's "found on this map" wish)
        this.coins += sellPrice(item);
        this.hooks.onChanged();
        return true;
    }

    // -----------------------------------------------------------------------
    // What the inventory panel does

    eat(id: number): void {
        const item = getItem(id);
        if (!item.heal || this.dead || this.stoodStill("eat")) {
            return;
        }
        // One bite at a time: the next waits EAT_DELAY
        if (this.eatIn > 0) {
            if (this.time - this.fullMessageAt > 1.5) {
                this.hooks.onMessage("You're still chewing.");
                this.fullMessageAt = this.time;
            }
            return;
        }
        if (removeItem(this.inventory, id, 1)) {
            this.eatIn = EAT_DELAY;
            this.hp = Math.min(this.maxHp, this.hp + item.heal);
            this.ate++;
            // Food settles poison
            if (this.poisonTicks > 0) {
                this.poisonTicks = 0;
                this.hooks.onMessage(`You eat the ${item.name.toLowerCase()}. The poison settles.`);
            } else {
                this.hooks.onMessage(`You eat the ${item.name.toLowerCase()}.`);
            }
            this.hooks.onChanged();
        }
    }

    // Nothing's eaten or drunk while the world stands still (version 183,
    // as the user asked): the pack's for sorting, not a safe meal
    private stoodStill(verb: "eat" | "drink"): boolean {
        if (!this.paused) {
            return false;
        }
        if (this.time - this.fullMessageAt > 1.5) {
            this.hooks.onMessage(`The world's stood still while the pack's open: shut it to ${verb}.`);
            this.fullMessageAt = this.time;
        }
        return true;
    }

    // Something put down from the pack, a step ahead: to make room, or for
    // a mate to pick up (in a party the host lays it there for everyone)
    dropItem(id: number, count: number): void {
        // The gilded pieces are the owner's test character's alone, so they
        // aren't put down where a mate could take one (version 83)
        if (getItem(id).exclusive) {
            this.hooks.onMessage(`${getItem(id).name} stays with you.`);
            return;
        }
        // Nor a weapon borrowed from the castle's racks (version 172)
        if (this.borrowed.includes(id)) {
            this.hooks.onMessage(`The ${getItem(id).name.toLowerCase()} is the castle's: it stays with you till you're out, then goes back on its rack.`);
            return;
        }
        if (this.dead || this.done || !removeItem(this.inventory, id, count)) {
            return;
        }
        const item = getItem(id);
        const x = this.px + Math.sin(this.facing) * 1.3;
        const z = this.pz + Math.cos(this.facing) * 1.3;
        const [dx, dz] = this.region.fits(x, z, 0.1) ? [x, z] : [this.px, this.pz];
        if (this.coop?.role === "guest") {
            this.coop.send({ k: "drop", i: id, n: count, x: round2(dx), z: round2(dz) } satisfies UpMessage);
        } else {
            // (marked for a mercenary to take up: version 175)
            const uid = this.nextUid++;
            this.dropPickup(id, count, dx, dz, 0, uid);
            if (this.merc && !this.merc.hero.dead) {
                this.givenUids.add(uid);
            }
        }
        this.hooks.onMessage(`You drop ${count > 1 ? count + " " : ""}${item.name}.`);
        this.hooks.onChanged();
    }

    // F eats what fills the gap best: the biggest heal that isn't wasted,
    // else the smallest there is
    eatHotkey(): void {
        const stack = this.foodToEat();
        if (stack) {
            this.eat(stack.id);
        }
    }

    foodToEat(): ItemStack | undefined {
        const missing = this.maxHp - this.hp;
        let best: ItemStack | undefined;
        let bestHeal = 0;
        let smallest: ItemStack | undefined;
        let smallestHeal = Infinity;
        for (const stack of this.inventory) {
            const heal = getItem(stack.id).heal;
            if (!heal) {
                continue;
            }
            if (heal <= missing && heal > bestHeal) {
                best = stack;
                bestHeal = heal;
            }
            if (heal < smallestHeal) {
                smallest = stack;
                smallestHeal = heal;
            }
        }
        return best ?? smallest;
    }

    // 1 to 4 drink a potion of that kind from the pack
    drinkKind(kind: Potion): void {
        const stack = this.inventory.find((s) => getItem(s.id).potion === kind);
        if (stack) {
            this.drink(stack.id);
        }
    }

    drink(id: number): void {
        const item = getItem(id);
        if (!item.potion || this.dead || this.stoodStill("drink")) {
            return;
        }
        // A brew is a bite like any food (version 150): it waits out
        // EAT_DELAY, and starts it, so brews can't be gulped one on another
        if (item.potion === "brew" && this.eatIn > 0) {
            if (this.time - this.fullMessageAt > 1.5) {
                this.hooks.onMessage("You're still chewing.");
                this.fullMessageAt = this.time;
            }
            return;
        }
        if (!removeItem(this.inventory, id, 1)) {
            return;
        }
        if (item.potion === "brew") {
            this.eatIn = EAT_DELAY;
        }
        if (item.potion === "prayer") {
            // Straight onto the bar, nothing to wear off
            this.prayer = Math.min(100, this.prayer + PRAYER_RESTORE);
        } else {
            this.boosts[item.potion] = item.potion === "holy" ? HOLY_SECONDS : POTION_SECONDS;
            this.applyStats();
            if (item.potion === "brew") {
                this.hp = Math.min(this.maxHp, this.hp + BREW_HEAL);
            }
        }
        this.drank++;
        this.hooks.onMessage(
            item.potion === "holy" ? `You sprinkle the holy water over your weapon: ${POTION_EFFECT.holy}.` : `You drink the ${item.name.toLowerCase()}.`,
        );
        this.hooks.onChanged();
    }

    private updateBoosts(dt: number): void {
        if (this.eatIn > 0) {
            this.eatIn -= dt;
        }
        for (const kind of Object.keys(this.boosts) as Potion[]) {
            if (this.boosts[kind] <= 0) {
                continue;
            }
            this.boosts[kind] -= dt;
            if (this.boosts[kind] <= 0) {
                this.boosts[kind] = 0;
                this.applyStats();
                this.hooks.onMessage(
                    kind === "brew" ? "The brew wears off." : kind === "holy" ? "The holy water's blessing fades." : `The ${kind} potion wears off.`,
                );
            }
        }
    }

    // The gear's numbers, with the pet's gift and the potions on top
    private applyStats(): void {
        const stats = gearStats(this.equipment, this.wear);
        applyPetStats(stats, this.petBuff);
        // The Squire's Steadfast (version 171)
        if (this.isClass("Squire")) {
            stats.hp += PERK_HP;
        }
        this.applyDepthsStats(stats);
        if (this.boosts.strength > 0) {
            stats.damage = Math.round(stats.damage * 1.25);
        }
        if (this.boosts.defence > 0) {
            stats.defence += 20;
            stats.defenceVs.melee += 20;
            stats.defenceVs.ranged += 20;
            stats.defenceVs.magic += 20;
        }
        if (this.boosts.brew > 0) {
            stats.hp += 15;
        }
        this.stats = stats;
        const maxHp = BASE_HP + stats.hp;
        this.hp = Math.min(this.hp, maxHp);
        this.maxHp = maxHp;
    }

    equipFromInventory(id: number): void {
        if (this.dead) {
            return;
        }
        if (equip(this.equipment, this.inventory, id, this.packSize)) {
            this.refreshStats();
        } else {
            this.hooks.onMessage("No room in your pack to swap that.");
        }
    }

    unequipSlot(slot: keyof Equipment): void {
        if (this.dead) {
            return;
        }
        if (unequip(this.equipment, this.inventory, slot, this.packSize)) {
            this.refreshStats();
        } else {
            this.hooks.onMessage("Your pack is full.");
        }
    }

    // The crown over this player's head, once the key has checked out
    private wearCrown(): void {
        const crown = crownVerified(crownKey());
        if (!crown || this.crown || this.ended || this.done === "extracted") {
            return;
        }
        this.crown = crownSprite(crown);
        this.scene.add(this.crown);
    }

    // Worn gear changed: build the look again in place
    private rebuildLook(): void {
        const generation = ++this.lookGeneration;
        void PlayerLook.create(this.character, this.equipment).then((look) => {
            if (generation !== this.lookGeneration || this.ended) {
                return;
            }
            const old = this.player;
            this.scene.remove(old.root);
            this.player = look;
            look.stance = this.stats.weapon?.stance;
            look.root.scale.setScalar(this.character.size);
            look.root.position.copy(old.root.position);
            look.root.rotation.copy(old.root.rotation);
            look.play(old.current && old.current !== "idle" ? old.current : "idle", {
                once: old.current === "death",
            });
            this.scene.add(look.root);
        });
    }

    private refreshStats(): void {
        this.applyStats();
        this.rebuildLook();
        this.hooks.onChanged();
        // The party draws this player in the new gear too
        const coop = this.coop;
        if (coop && !this.ended) {
            const e = { ...this.equipment };
            if (coop.role === "guest") {
                coop.send({ k: "gear", e } satisfies UpMessage);
            } else {
                coop.send({ k: "gear", id: coop.me, e } satisfies DownMessage);
            }
        }
    }
}
