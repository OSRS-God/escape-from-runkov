// The maps you can pick: real OSRS regions exported from the cache, each with
// the enemies that live there in Run Escape and a boss, from worlds.json
// (made by Run-Escape/scripts/cache/make-game-worlds.ts). Chests and the
// boss are scattered about; the way out is where you came in.
import { EnemyDef, SECOND_FORM_SHARE } from "./enemies";
import castleBossesJson from "./castle-bosses.json";
import castleMobsJson from "./castle-mobs.json";
import depthsMobsJson from "./depths-mobs.json";
import endlessBossesJson from "./endless-bosses.json";
import worldsJson from "./worlds.json";

type WorldEnemyJson = {
    id: string;
    npcId: number;
    name: string;
    hp: number;
    damage: number;
    speed: number;
    radius: number;
    scale?: number;
    size: number;
    anims: Record<string, number>;
    sounds: Record<string, number>;
    boss?: boolean;
};

type WorldJson = {
    id: string;
    name: string;
    description: string;
    tier: number;
    difficulty: { hp: number; damage: number };
    enemies: WorldEnemyJson[];
    boss?: WorldEnemyJson;
};

export type WorldDef = {
    id: string;
    name: string;
    description: string;
    tier: number;
    enemies: { def: EnemyDef; weight: number }[];
    boss: EnemyDef;
    // The map's ambient sounds (AMBIENT), played now and then
    ambient: number[];
    enemyCount: number;
    chests: number;
    chestItems: [number, number];
    lootTiers: { tier: number; weight: number }[];
    // A cave laid out new every run from cave rooms (game/caves.ts), not a
    // real region; and which set of rooms (the Forgotten Castle's, version
    // 163, else the Depths' caves)
    caves?: boolean;
    rooms?: "castles";
    // The Depths: the bosses a run picks from (ENDLESS_BOSSES of them), each
    // made at this map's tier
    bosses?: EnemyDef[];
    // The Depths' mini bosses, by the id of the lesser kind whose kills
    // bring each (SUPERIOR_ONE_IN)
    superiors?: Record<string, EnemyDef>;
    // The Depths' depth, 1 to ENDLESS_DEPTHS (its tier is its enemies')
    depth?: number;
};

// worlds.json carries Run Escape's blurbs, about its waves and bosses, so
// each map gets its own here: the place, as the maps screen lists what
// lives there under it
const DESCRIPTIONS: Record<string, string> = {
    lumbridge: "The castle, the farms around it and the swamp to the south. Where everyone starts.",
    barrows: "The six burial mounds and the marsh around Mort'ton, where the dead don't stay buried.",
    wilderness: "The Graveyard of Shadows and the ruins around it, north of the ditch. Nobody up here is friendly.",
    desert: "The Kharidian Desert around the Kalphite hive: dunes, scorpions and bandits in the heat.",
    fremennik: "Rellekka's shore and the hills behind it, with trolls and dagannoths among the rock crabs.",
    karamja: "Jungle paths across Karamja, with the TzHaar out of their volcano. Jad is in there somewhere.",
    kourend: "The swamps and lizard dens of Great Kourend, with something demonic loose from beneath.",
    varlamore: "Varlamore's sunlit plains and hunting grounds: jaguars and foxes among the antelope.",
    morytania: "Morytania's dark woods, with vampyres and werewolves between the swamp and the shades' town.",
    god_wars: "The God Wars Dungeon, where four armies have fought for an age. All of them want you dead.",
    prifddinas: "The crystal city's gauntlet and its corrupted beasts. The Hunllef hunts the deepest halls.",
    inferno: "Inside the volcano under Mor Ul Rek: TzHaar and Jal creatures on the rock, and a Jad among them.",
    endless: "Caves that are never the same twice: thirty chambers dug anew every run. Five of fourteen lair bosses lurk far apart, slayer monsters crawl everywhere, and now and then a superior one rises where its kind falls. The loot comes from every tier. Lairs seal behind you, the roof keeps coming down, each boss slain makes the rest stronger, and only one golden chest opens a run.",
    castle: "A castle nobody remembers, its halls rebuilt in a new order every run: twenty-five rooms of great halls, overgrown courtyards, quarters, libraries, chapels and dungeons, 40 chunks a side. Its dead lords hold court far apart, and what served them still walks its halls. Four stars, every lord's chest with loot of every tier.",
};

// What a map tier asks of you (see scripts/balance.ts): the average enemy
// on a map, and its boss. Run Escape's enemies keep their relative strengths
// within a map, but each map is scaled so its average lands on its tier.
// Version 55 made it all harder: a map is meant to take a few runs to beat
// unless you're lucky, so a tier's own full set with its own food wins its
// boss about one time in three in the sim (which has no prayer or footwork),
// and the tier below's set never does
const TIER_ENEMY_HP = [0, 19, 34, 60, 86, 126];
const TIER_ENEMY_DAMAGE = [0, 4, 6.5, 9.5, 13, 18];
const TIER_BOSS_HP = [0, 600, 980, 1300, 2500, 4000];
// Version 57 took boss hits down (and their rolls lean low, combat.ts)
const TIER_BOSS_DAMAGE = [0, 16, 22, 26, 39, 52];
// Version 78 evens out the maps of a tier: in the sim a tier's own set beat
// Fremennik's, Karamja's, Kourend's, Morytania's and Prifddinas' bosses
// eight or nine fights in twelve, the Inferno's every time, against about
// four in five meant. A boss's hitpoints are its tier's times this.
const BOSS_HP_SCALE: Record<string, number> = {
    fremennik: 0.92,
    karamja: 0.92,
    kourend: 0.9,
    morytania: 0.9,
    prifddinas: 0.92,
    desert: 1.06,
    inferno: 1.2,
};

// Enemies that shoot instead of hitting, by their id in worlds.json: mages
// with a spell's spot animations (its cast graphic, the one that flies, and
// the burst where it lands), archers with an arrow's, how far off they stand
// and how long between shots (a shot hits as hard as a swing, less often).
// Regular mages throw fire strikes; mage bosses, like the Wise Old Man,
// whose attack clip is the client's spellcasting one, throw fire waves.
type Shooter = { style: "magic" | "ranged"; cast?: number; projectile: number; impact?: number; range: number; interval: number };
const STRIKE: Shooter = { style: "magic", cast: 99, projectile: 100, impact: 101, range: 6, interval: 2.2 };
const WAVE: Shooter = { style: "magic", cast: 155, projectile: 156, impact: 157, range: 7, interval: 2 };
const ARROW: Shooter = { style: "ranged", projectile: 10, range: 7, interval: 2.2 };
// Version 147, as the user asked, so a map can't be shot clear from a
// distance without a scratch: more of each map's own enemies shoot back,
// about a fifth to a third of what's met on every map but the first (a
// tenth there), with the strike and bolt spells' looks (spells.ts's LOOKS).
// Spit and thrown rocks fly as an earth strike and are ranged.
const WIND_STRIKE: Shooter = { ...STRIKE, cast: 90, projectile: 91, impact: 92 };
const WATER_STRIKE: Shooter = { ...STRIKE, cast: 93, projectile: 94, impact: 95 };
const WIND_BOLT: Shooter = { ...STRIKE, cast: 117, projectile: 118, impact: 119 };
const WATER_BOLT: Shooter = { ...STRIKE, cast: 120, projectile: 121, impact: 122 };
const FIRE_BOLT: Shooter = { ...STRIKE, cast: 126, projectile: 127, impact: 128 };
const SPIT: Shooter = { style: "ranged", projectile: 97, impact: 98, range: 6, interval: 2.2 };
const SHOOTERS: Record<string, Shooter> = {
    ghost: WIND_STRIKE,
    skeleton: ARROW,
    afflicted: WIND_STRIKE,
    ugthanki: SPIT,
    mountain_troll: SPIT,
    dagannoth: WATER_STRIKE,
    tribesman: ARROW,
    snake: SPIT,
    lizard: SPIT,
    sulphur_lizard: SPIT,
    reanimated_demon: FIRE_BOLT,
    pyre_fox: STRIKE,
    fiyr_shade: WIND_BOLT,
    snakeling: WATER_BOLT,
    jal_mejrah: SPIT,
    wise_old_man: WAVE,
    chaos_fanatic: WAVE,
    dagannoth_prime: WAVE,
    tztok_jad: WAVE,
    jaltok_jad_finale: WAVE,
    sotetseg: WAVE,
    corrupted_hunllef: WAVE,
    revenant_imp: STRIKE,
    revenant_pyrefiend: STRIKE,
    serpent_shaman: STRIKE,
    tzhaar_mej: STRIKE,
    desert_bandit: ARROW,
    nylocas_toxobolos: ARROW,
    aviansie: ARROW,
    armadyl_spiritual_ranger: ARROW,
    bree: ARROW,
    zakln_gritch: ARROW,
    iorwerth_archer: ARROW,
    tzhaar_xil: ARROW,
    javelin_colossus: { ...ARROW, interval: 2 },
    // The Depths' (endless-bosses.json): Supreme shoots as in OSRS, and the
    // Ice Queen throws ice
    dagannoth_supreme: ARROW,
    ice_queen: WATER_BOLT,
    // And its cave slayer monsters (depths-mobs.json) that cast in OSRS,
    // with their superiors a bolt where they throw a strike
    pyrefiend: STRIKE,
    flaming_pyrelord: FIRE_BOLT,
    aberrant_spectre: WIND_STRIKE,
    abhorrent_spectre: WIND_BOLT,
    // The Forgotten Castle's (version 163): its dark wizards, druids and
    // mystics cast, and of its lords Vanstrom, the Nightmare and Verzik
    dark_wizard: WIND_STRIKE,
    undead_druid: WATER_STRIKE,
    skeletal_mystic: WIND_BOLT,
    vanstrom_klause: WAVE,
    the_nightmare: WAVE,
    verzik_vitur: WAVE,
};

// Bosses' own moves (enemies.ts says what each is; run.ts does them)
type Moves = Pick<EnemyDef, "alternates" | "pierce" | "secondForm" | "floor">;
const MOVES: Record<string, Moves> = {
    tztok_jad: { alternates: true },
    jaltok_jad_finale: { alternates: true },
    verac: { pierce: true },
    kalphite_queen: { secondForm: true },
    corrupted_hunllef: { floor: true },
};

// Every other boss gets a move by its map's tier, so the one star bosses
// stay gentle and the five star ones have two: hits through armour at two
// stars, burning floor at three, a second form (or swapping styles, for a
// shooter) at four, and both at five
function defaultMoves(tier: number, shooter: boolean): Moves {
    if (tier <= 1) {
        return {};
    }
    if (tier === 2) {
        return { pierce: true };
    }
    if (tier === 3) {
        return { floor: true };
    }
    const fourth: Moves = shooter ? { alternates: true } : { secondForm: true };
    return tier === 4 ? fourth : { ...fourth, floor: true };
}

// Each map's ambient sounds, by sound id in the cache: what the map's own
// scenery plays in the client (scripts/cache/list-ambient.ts in Run Escape
// tallies them), played now and then at low volume. The ids go in
// assets.json's sounds too, so they're in the pack.
export const AMBIENT: Record<string, number[]> = {
    lumbridge: [3087, 3087, 3087, 2065, 2065, 2150, 2150, 2209, 2209, 3141, 2199, 3120, 2220],
    barrows: [3120, 3120, 2065],
    fremennik: [2065, 2065, 2065, 2065, 2065, 2065, 2066, 2220, 3137],
    karamja: [3141],
    kourend: [2151],
    varlamore: [2200, 2200, 2200, 2200, 2065],
    morytania: [2199, 2199, 2199, 2199, 2065, 2065, 2065, 2065, 2200, 2200, 2209, 3673, 2066],
    god_wars: [3087],
    prifddinas: [3124, 3124, 3124, 3124, 3124, 3124, 3124, 3124, 4157, 4157, 4157, 4157, 4157, 2199, 2209],
    inferno: [2066, 2066, 2066, 2066, 2066, 2066, 2208, 2208],
};

// Enemies that only fight back (EnemyDef's passive), by name
const PASSIVE_NAMES = /^(chicken|imp)$/i;

// Every enemy walks a fifth faster than its own pace since version 146, as
// the user asked (the bosses' chase is run.ts's, just under the player's)
const ENEMY_SPEED_SCALE = 1.2;

function convertEnemy(
    e: WorldEnemyJson,
    world: WorldJson,
    scale: { hp: number; damage: number },
): EnemyDef {
    const boss = !!e.boss;
    const shooter = SHOOTERS[e.id];
    const moves: Moves = { ...(boss ? defaultMoves(world.tier, !!shooter) : {}), ...(MOVES[e.id] ?? {}) };
    // A boss with a second form has its hitpoints split between the two
    // (version 150: before, it had its tier's and 60% more, the hardest of
    // its tier by far)
    const bossHp = TIER_BOSS_HP[world.tier] * (BOSS_HP_SCALE[world.id] ?? 1) / (moves.secondForm ? 1 + SECOND_FORM_SHARE : 1);
    const hp = boss ? Math.round(bossHp) : Math.max(8, Math.round(e.hp * scale.hp));
    const damage = boss ? TIER_BOSS_DAMAGE[world.tier] : Math.max(2, Math.round(e.damage * scale.damage));
    // Per kill; a crowded map gives forty or more kills a run, so a kill pays
    // little next to the boss
    const coinsMax = Math.round((boss ? 150 : 3) * Math.pow(2.2, world.tier - 1) * (boss ? 1 : 1 + hp / 60));
    return {
        id: `${world.id}:${e.id}`,
        npcId: e.npcId,
        name: e.name,
        hp,
        damage,
        speed: Math.min(3.2, Math.max(1.4, e.speed)) * ENEMY_SPEED_SCALE,
        radius: Math.min(0.9, Math.max(0.3, e.radius)),
        attackInterval: shooter ? shooter.interval : boss ? 1.5 : 1.6,
        attackRange: shooter ? shooter.range : 1.1 + Math.max(0, e.size - 1) * 0.5,
        aggro: boss ? 12 : 8,
        coins: [Math.round(coinsMax / 3), coinsMax],
        // Food is rare on the dead: one kill in twelve
        foodChance: boss ? 0 : 0.08,
        scale: e.scale,
        boss: boss || undefined,
        // Chickens and imps leave you be until you hit them (version 93):
        // the first map's easiest things, and a first fight on your terms
        passive: !boss && PASSIVE_NAMES.test(e.name) ? true : undefined,
        shoots: shooter
            ? { style: shooter.style, cast: shooter.cast, projectile: shooter.projectile, impact: shooter.impact }
            : undefined,
        ...moves,
    };
}

// The tier under's weight against the map's own 60, where it isn't 25
const UNDER_TIER_WEIGHT: Record<number, number> = { 4: 12, 5: 7 };

function lootTiersFor(tier: number): { tier: number; weight: number }[] {
    // The map's own tier, or about one piece in three the one under it (one
    // in six on a tier 4 map, one in ten on a tier 5, since version 147: the
    // tier under is seldom an upgrade there): nothing from a map's chests,
    // champions or kills is better than the map. Better comes from the
    // boss's golden chest, the vault and clue caskets.
    const tiers = [
        { tier: tier - 1, weight: UNDER_TIER_WEIGHT[tier] ?? 25 },
        { tier, weight: 60 },
    ].filter((t) => t.tier >= 1 && t.tier <= 5);
    return tiers;
}

// The scale that puts a map's weighted average enemy on its tier. Run
// Escape's numbers are for its own waves, so a map's can be far off: the
// Inferno's TzHaar are pushovers there, and get ten times the hp here.
function tierScale(w: WorldJson): { hp: number; damage: number } {
    let weightTotal = 0;
    let hp = 0;
    let damage = 0;
    w.enemies.forEach((e, i) => {
        const weight = Math.max(1, w.enemies.length - i);
        weightTotal += weight;
        hp += e.hp * weight;
        damage += e.damage * weight;
    });
    const clamp = (v: number) => Math.min(12, Math.max(0.2, v));
    return {
        hp: clamp(TIER_ENEMY_HP[w.tier] / (hp / weightTotal)),
        damage: clamp(TIER_ENEMY_DAMAGE[w.tier] / (damage / weightTotal)),
    };
}

// The Depths, a mode of their own, as the user asked (first called Endless,
// still its id in the code and the save, so saves made then keep it): a
// cave laid out from cave rooms in a new order every run, the biggest map
// in the game, with ENDLESS_BOSSES bosses of its own in it each run, far
// apart, and loot of
// every tier. The bosses are OSRS's cave and lair bosses, none of them met
// on another map (endless-bosses.json: their clips found with Run Escape's
// find-npc-seqs.ts and classify-npc-seqs.ts). Their sounds are OSRS's, by
// the OSRS Wiki's list of sound ids (the server sends an NPC's, so the cache
// doesn't tie them to it): the Giant Mole's own (mole_attack, _hit, _death),
// the dragons' for the King Black Dragon, Elvarg's breath and scream from
// Dragon Slayer, the dust devils' for the smoke devil, the hellhounds' bark,
// snarl and death for Cerberus, the big spiders' for Sarachnis, the
// dagannoths' for Rex and Supreme, the giants' for Obor and Bryophyta (the
// moss giant's swing for her), the scorpions' for Scorpia, Vet'ion's own for
// Calvar'ion, the grim giant's for the Corporeal Beast (none of its own is
// named), and an ice spell and the female hit and death for the Ice Queen. Its
// enemies are what lives underground on the other maps,
// by "map:enemy" in worlds.json, weakest first. Played on a fresh start of
// its own (save.ts's profiles), open from the start (the user asked: at
// first it took beating the last regular map), one star at first and a
// star deeper each time it's beaten.
const ENDLESS_ENEMIES = [
    "barrows:crypt_spider",
    "kourend:guanic_bat",
    "lumbridge:skeleton",
    "barrows:giant_crypt_rat",
    "barrows:ghoul",
    "lumbridge:ghost",
    "karamja:jogre",
    "fremennik:jelly",
    "fremennik:kurask",
    "kourend:reanimated_demon",
];
// A superior (depths-mobs.json's superiors, OSRS's superior slayer
// monsters): one in SUPERIOR_ONE_IN kills of its lesser kind brings one,
// at most SUPERIOR_MAX a run, with its lesser kind's hitpoints and hits
// times these, and its coins times SUPERIOR_COINS
// (30 and 4 until version 159 made the Depths far harder)
export const SUPERIOR_ONE_IN = 15;
export const SUPERIOR_MAX = 8;
const SUPERIOR_HP = 6;
const SUPERIOR_DAMAGE = 1.6;
const SUPERIOR_COINS = 8;
export const ENDLESS_ID = "endless";
// How many bosses a run of the Depths has, of endless-bosses.json's
export const ENDLESS_BOSSES = 5;
// Its loot, every tier, leaning a little to the better ones
const ENDLESS_LOOT = [
    { tier: 1, weight: 12 },
    { tier: 2, weight: 16 },
    { tier: 3, weight: 20 },
    { tier: 4, weight: 24 },
    { tier: 5, weight: 28 },
];

const REGULAR_JSONS = (worldsJson as WorldJson[]).filter((w) => w.boss);

function endlessJson(worlds: WorldJson[]): WorldJson {
    const find = (key: string) => {
        const [map, id] = key.split(":");
        const e = worlds.find((x) => x.id === map)?.enemies.find((x) => x.id === id);
        if (!e) {
            throw new Error(`The Depths: no ${key} in worlds.json`);
        }
        return e;
    };
    return {
        id: ENDLESS_ID,
        name: "The Depths",
        description: "",
        // (each depth has its own: ENDLESS_WORLDS)
        tier: 1,
        difficulty: { hp: 1, damage: 1 },
        // The other maps' underground ones and its own cave slayer
        // monsters (depths-mobs.json, version 157), weakest first
        enemies: [...ENDLESS_ENEMIES.map(find), ...(depthsMobsJson.mobs as WorldEnemyJson[])].sort((a, b) => a.hp - b.hp),
        // The maps screen names them all; a run picks its own (run.ts)
        boss: (endlessBossesJson as WorldEnemyJson[])[0],
    };
}

// The Depths' superiors, by the id of the lesser kind each comes from: made
// at the depth's tier as that kind is, then far tougher
function superiorsOf(w: WorldJson, scale: { hp: number; damage: number }): Record<string, EnemyDef> {
    const out: Record<string, EnemyDef> = {};
    for (const s of depthsMobsJson.superiors as (WorldEnemyJson & { of: string })[]) {
        const lesser = w.enemies.find((e) => e.id === s.of);
        if (!lesser) {
            continue;
        }
        const base = convertEnemy(lesser, w, scale);
        const own = convertEnemy(s, w, scale);
        out[base.id] = {
            ...own,
            hp: Math.round(base.hp * SUPERIOR_HP),
            damage: Math.max(own.damage, Math.round(base.damage * SUPERIOR_DAMAGE)),
            coins: [base.coins[0] * SUPERIOR_COINS, base.coins[1] * SUPERIOR_COINS],
            aggro: 12,
            foodChance: 0,
            superior: true,
        };
    }
    return out;
}

// The Forgotten Castle (version 163, as the user asked): a mode of its own
// like the Depths, a fresh start, laid out new every run (caves.ts
// CASTLE_ROOMS: five by five map squares, 40 OSRS chunks a side) with
// several bosses of its own far apart, and past the Inferno: five stars at
// its first depth. Its enemies and bosses are castle-mobs.json's and
// castle-bosses.json's, none of them met anywhere else.
export const CASTLE_ID = "castle";

function castleJson(): WorldJson {
    return {
        id: CASTLE_ID,
        name: "The Forgotten Castle",
        description: "",
        tier: 5,
        difficulty: { hp: 1, damage: 1 },
        enemies: [...(castleMobsJson.mobs as WorldEnemyJson[])].sort((a, b) => a.hp - b.hp),
        boss: (castleBossesJson as WorldEnemyJson[])[0],
    };
}

function makeWorld(w: WorldJson): WorldDef {
    const scale = tierScale(w);
    const endless = w.id === ENDLESS_ID;
    const castle = w.id === CASTLE_ID;
    const ownBosses = endless ? (endlessBossesJson as WorldEnemyJson[]) : castle ? (castleBossesJson as WorldEnemyJson[]) : undefined;
    return {
        caves: endless || castle || undefined,
        rooms: castle ? "castles" : undefined,
        superiors: endless ? superiorsOf(w, scale) : undefined,
        // Its own bosses, at its depth's tier
        bosses: ownBosses?.map((b) => convertEnemy(b, w, scale)),
        id: w.id,
        name: w.name,
        description: DESCRIPTIONS[w.id] ?? w.description,
        tier: w.tier,
        enemies: w.enemies.map((e, i) => ({
            def: convertEnemy(e, w, scale),
            // The weaker ones are the more common
            weight: Math.max(1, w.enemies.length - i),
        })),
        boss: convertEnemy(w.boss!, w, scale),
        ambient: AMBIENT[w.id] ?? [],
        // For a full 128 by 128 map; a run scales it by the map's open ground
        enemyCount: 100 + w.tier * 10,
        // Likewise a full map's worth of chests; about half hold gear, a
        // piece or two
        chests: 16 + w.tier * 2,
        chestItems: w.tier >= 4 ? [1, 2] : [1, 1],
        lootTiers: endless || castle ? ENDLESS_LOOT : lootTiersFor(w.tier),
    };
}

// The Depths at each depth, 1 to 5, far harder than the regular maps
// (version 159, as the user asked: nobody should come close to clearing more
// than one boss in a run): their enemies a tier above the depth and their
// bosses two, each boss with half again a regular boss's hitpoints for its
// tier (twice, first: scripts/depths-balance.ts found a tier 3 kit, the best
// the Depths give before a golden chest, could never kill one at depth 1),
// and past five stars everything 1.35 times again a tier it would have gone
// over; and food on the dead under a third as often. Loot is every tier at
// every depth.
export const ENDLESS_DEPTHS = 5;
const DEPTHS_ENEMY_TIERS_UP = 1;
const DEPTHS_BOSS_TIERS_UP = 2;
const DEPTHS_BOSS_HP = 1.5;
const DEPTHS_PAST_FIVE = 1.35;
const DEPTHS_FOOD = 0.3;
// The Depths a little easier (version 169, as the user asked; the Forgotten
// Castle keeps the numbers above): food on the dead half again as often, and
// depth 1's bosses with a quarter more than a regular boss's hitpoints
// instead of half (run.ts has the rest)
const EASED_FOOD = 0.45;
const EASED_FIRST_BOSS_HP = 1.25;
// The Depths' tiny ones (version 160, as the user asked): rats, bats,
// spiders, bugs, crawlers, slimes and slugs drop tier 1 only, gear, food,
// arrows and runes alike, champions of them too (run.ts killEnemy)
const DEPTHS_TINY = new Set([
    "guanic_bat",
    "giant_bat",
    "giant_crypt_rat",
    "crypt_spider",
    "cave_bug",
    "crawling_hand",
    "cave_crawler",
    "cave_slime",
    "rockslug",
]);

// The Forgotten Castle's enemies and lords, three tiers above its one depth:
// four stars
const CASTLE_ENEMY_TIERS_UP = 3;
const CASTLE_BOSS_TIERS_UP = 3;

function depthsWorld(
    depth: number,
    json = endlessJson(REGULAR_JSONS),
    enemyUp = DEPTHS_ENEMY_TIERS_UP,
    bossUp = DEPTHS_BOSS_TIERS_UP,
    eased = true,
): WorldDef {
    const food = eased ? EASED_FOOD : DEPTHS_FOOD;
    const bossHp = eased && depth === 1 ? EASED_FIRST_BOSS_HP : DEPTHS_BOSS_HP;
    const enemyTier = depth + enemyUp;
    const bossTier = depth + bossUp;
    const world = makeWorld({ ...json, tier: Math.min(5, enemyTier) });
    const enemyPast = Math.pow(DEPTHS_PAST_FIVE, Math.max(0, enemyTier - 5));
    const bossPast = Math.pow(DEPTHS_PAST_FIVE, Math.max(0, bossTier - 5));
    const bossWorld = makeWorld({ ...json, tier: Math.min(5, bossTier) });
    const enemy = (def: EnemyDef): EnemyDef => ({
        ...def,
        hp: Math.round(def.hp * enemyPast),
        damage: Math.round(def.damage * enemyPast),
        foodChance: def.foodChance * food,
        tiny: DEPTHS_TINY.has(def.id.slice(def.id.indexOf(":") + 1)) || undefined,
    });
    const boss = (def: EnemyDef): EnemyDef => ({
        ...def,
        hp: Math.round(def.hp * bossHp * bossPast),
        damage: Math.round(def.damage * bossPast),
    });
    return {
        ...world,
        depth,
        enemies: world.enemies.map((e) => ({ def: enemy(e.def), weight: e.weight })),
        superiors: Object.fromEntries(Object.entries(world.superiors ?? {}).map(([id, def]) => [id, enemy(def)])),
        bosses: (bossWorld.bosses ?? []).map(boss),
        boss: boss(bossWorld.boss),
    };
}

const ENDLESS_WORLDS: WorldDef[] = Array.from({ length: ENDLESS_DEPTHS }, (_, i) => depthsWorld(i + 1));
// The Forgotten Castle is a four star map of its own (version 164, as the
// user asked): no depths, its enemies and lords at tier 4 (the lords with
// the Depths' half again of a boss's hitpoints)
const CASTLE_WORLD: WorldDef = { ...depthsWorld(1, castleJson(), CASTLE_ENEMY_TIERS_UP, CASTLE_BOSS_TIERS_UP, false), depth: undefined };

// The game's maps (version 164, as the user asked: the twelve regular maps
// are gone, and these two, open from the start, share the one stash). The
// regular maps' worlds.json is kept for the Depths' enemies from them.
export const WORLDS: WorldDef[] = [ENDLESS_WORLDS[0], CASTLE_WORLD];

export const WORLD_BY_ID: Map<string, WorldDef> = new Map(WORLDS.map((w) => [w.id, w]));

// The modes of their own (save.ts's), each its map's id: the Depths and the
// Forgotten Castle
export type ModeId = "regular" | "endless" | "castle";
export const MODE_WORLD: Record<Exclude<ModeId, "regular">, string> = { endless: ENDLESS_ID, castle: CASTLE_ID };

// Whether a map is a mode's own (the Depths, the castle)
export function isModeWorld(id: string): boolean {
    return id === ENDLESS_ID || id === CASTLE_ID;
}

// Which profile is out (save.ts's modes), and its depth: main.ts gives the
// save's
type ModeSource = () => { mode: ModeId; depth: number };
let modeSource: ModeSource = () => ({ mode: "regular", depth: 1 });

export function setModeSource(source: ModeSource): void {
    modeSource = source;
}

// In a mode of its own (the Depths or the castle), not the regular maps
export function playingEndless(): boolean {
    return modeSource().mode !== "regular";
}

export function playingMode(): ModeId {
    return modeSource().mode;
}

// The depth of the mode that's out (each mode's profile has its own)
export function endlessDepth(): number {
    return Math.min(ENDLESS_DEPTHS, Math.max(1, modeSource().depth || 1));
}

export function endlessWorld(depth = endlessDepth()): WorldDef {
    return ENDLESS_WORLDS[Math.min(ENDLESS_DEPTHS, Math.max(1, depth)) - 1];
}

// The castle (it has no depths: the one map)
export function castleWorld(): WorldDef {
    return CASTLE_WORLD;
}

// A mode's map at a depth, by the map's id (the castle's always the same)
export function modeWorld(id: string, depth = endlessDepth()): WorldDef {
    return id === CASTLE_ID ? CASTLE_WORLD : endlessWorld(depth);
}

// A map by id (the Depths at the save's depth)
export function getWorld(id: string): WorldDef {
    const world = isModeWorld(id) ? modeWorld(id) : WORLD_BY_ID.get(id);
    if (!world) {
        throw new Error("Unknown world " + id);
    }
    return world;
}

// Every enemy in every world, for the enemy table
export const WORLD_ENEMIES: EnemyDef[] = WORLDS.flatMap((w) => [...w.enemies.map((e) => e.def), ...(w.bosses ?? [w.boss])]);

// Whether a run may go to a map: either of the two, whenever (version 164,
// as the user asked: no map waits on another)
export function mapUnlocked(_mapsBeaten: string[], id: string): boolean {
    return WORLD_BY_ID.has(id);
}

// The highest tier with a map open: what the shop's ammunition goes up to
// (the castle's four, or the Depths' at their depth if more)
export function tierUnlocked(_mapsBeaten: string[]): number {
    return Math.max(CASTLE_WORLD.tier, Math.min(5, endlessDepth() + DEPTHS_ENEMY_TIERS_UP));
}
