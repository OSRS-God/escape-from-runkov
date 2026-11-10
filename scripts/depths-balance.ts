// The Depths on paper (version 159, as the user asked them made far harder:
// nobody should come close to more than one boss in a run). A run at each
// depth with a few kits: the fights on the way to a boss (packs and
// champions as run.ts spawns them, superiors rising, the roof coming down),
// the boss's champion guards, the boss, and then the strongest boss left,
// grown stronger, coming for you with what you've got left. No movement,
// dodging, prayer or specials: the player stands and trades blows, and eats
// under 40%. Reports how often each kit kills one boss, and two.
//
//   npx tsx scripts/depths-balance.ts        (DEPTHS_SEEDS=500 for a steadier read)
import { EnemyDef } from "../src/content/enemies";
import { EAT_DELAY, FOOD_LIMIT, ITEMS, PRIZES, SLOTS, gearPower, getItem } from "../src/content/items";
import { ENDLESS_BOSSES, ENDLESS_DEPTHS, SUPERIOR_MAX, SUPERIOR_ONE_IN, WorldDef, endlessWorld } from "../src/content/worlds";
import { enemyHit, hitChance, playerHit } from "../src/game/combat";
import { makeRng } from "../src/game/dungeon";
import { BASE_HP, GearStats, gearStats } from "../src/game/inventory";
import { Equipment } from "../src/game/save";

// run.ts's numbers (the Depths' own since version 169: its EASED_ ones)
const CHAMPION_HP = 2.5;
const CHAMPION_DAMAGE = 2;
const DEPTHS_CHAMPION = 0.05 * 3;
const DEPTHS_PACK = 0.2;
const DEPTHS_PACK_LEADER = 0.5;
const DEPTHS_PACK_SIZE: [number, number] = [2, 4];
const ELITE_ONE_IN = 12;
const BOSS_GUARDS: [number, number] = [2, 4];
const EMPOWER_HP = 3;
const EMPOWER_DAMAGE = 2;
const COLLAPSE_EVERY = 100;
const COLLAPSE_HIT = 0.08;
const COLLAPSE_HIT_STEP = 0.03;
const COLLAPSE_HIT_MAX = 0.35;
const DROP_HEAL = [15, 20, 30, 40, 55];
// The paper player's own: how many fights it takes on the way to the first
// boss (a few rooms of a cave with about two hundred in thirty rooms, most
// of which never notices you), how often a falling rock still catches them,
// and the seconds between fights
const FIGHTS_TO_BOSS = 10;
const ROCK_CAUGHT = 0.35;
const BREATHER = 6;
const TICK = 0.05;

type Kit = { name: string; equipment: Equipment; food: number; heal: number };

function tierSet(tier: number, heal: number): Kit {
    const equipment: Equipment = {};
    for (const slot of SLOTS) {
        const pieces = ITEMS.filter((i) => i.slot === slot && i.tier === tier && !PRIZES.has(i.id) && !i.exclusive && i.id !== 1050);
        if (pieces.length > 0) {
            equipment[slot] = pieces.sort((a, b) => gearPower(b) - gearPower(a))[0].id;
        }
    }
    if (equipment.weapon !== undefined && getItem(equipment.weapon).twoHanded) {
        delete equipment.shield;
    }
    return { name: `tier ${tier} set, 8 food`, equipment, food: 8, heal };
}

const KITS: Kit[] = [
    tierSet(1, 15),
    tierSet(3, 30),
    tierSet(5, 55),
    {
        name: "dragon + barrows, 8 sharks",
        equipment: { weapon: 4151, head: 4716, body: 4720, legs: 4722, shield: 1187, feet: 11840, hands: 2491, neck: 1704 },
        food: 8,
        heal: 100,
    },
    {
        name: "best in game, 8 sharks",
        equipment: { weapon: 11802, head: 26382, body: 26384, legs: 26386, feet: 11840, hands: 2491, neck: 6585, cape: 6570, ring: 6737 },
        food: 8,
        heal: 100,
    },
];

type Player = { stats: GearStats; weaponTier: number; maxHp: number; hp: number; food: number[]; time: number };

const champion = (def: EnemyDef): EnemyDef => ({
    ...def,
    hp: Math.round(def.hp * CHAMPION_HP),
    damage: Math.round(def.damage * CHAMPION_DAMAGE),
    champion: true,
});

// A fight to the death against everything here at once; the map's awake,
// so nothing heals on its own. Whether the player lived.
function fight(p: Player, enemies: EnemyDef[], world: WorldDef, rng: () => number): boolean {
    const alive = enemies.map((def) => ({ def, hp: def.hp, cooldown: 0.5 + rng() * def.attackInterval }));
    let swing = 0;
    let eat = 0;
    let t = 0;
    while (alive.length > 0 && t < 900) {
        t += TICK;
        swing -= TICK;
        eat -= TICK;
        if (swing <= 0) {
            const target = alive[0];
            if (rng() < hitChance(p.weaponTier, world.tier, !!target.def.boss)) {
                target.hp -= playerHit(p.stats, rng());
            }
            swing = p.stats.speed;
            if (target.hp <= 0) {
                alive.shift();
                if (rng() < target.def.foodChance && p.food.length < FOOD_LIMIT) {
                    p.food.unshift(DROP_HEAL[Math.min(4, Math.floor(rng() * (world.tier + 1)))]);
                }
            }
        }
        for (const e of alive) {
            e.cooldown -= TICK;
            if (e.cooldown <= 0) {
                p.hp -= enemyHit(e.def, { defence: p.stats.defenceVs[e.def.shoots?.style ?? "melee"] }, rng());
                e.cooldown = e.def.attackInterval;
            }
        }
        if (p.hp <= p.maxHp * 0.4 && p.food.length > 0 && eat <= 0) {
            p.hp = Math.min(p.maxHp, p.hp + p.food.shift()!);
            eat = EAT_DELAY;
        }
        if (p.hp <= 0) {
            return false;
        }
    }
    p.time += t + BREATHER;
    return true;
}

function pick(world: WorldDef, rng: () => number): EnemyDef {
    const total = world.enemies.reduce((n, e) => n + e.weight, 0);
    let roll = rng() * total;
    for (const e of world.enemies) {
        roll -= e.weight;
        if (roll <= 0) {
            return e.def;
        }
    }
    return world.enemies[0].def;
}

// The roof's come down however many times since the last look: a rock
// that still catches you now and then
function collapses(p: Player, done: { n: number }, rng: () => number): boolean {
    while (p.time >= COLLAPSE_EVERY * (done.n + 1)) {
        done.n++;
        if (rng() < ROCK_CAUGHT) {
            p.hp -= Math.round(p.maxHp * Math.min(COLLAPSE_HIT_MAX, COLLAPSE_HIT + COLLAPSE_HIT_STEP * (done.n - 1)));
        }
    }
    return p.hp > 0;
}

// One run: how many bosses fell before the player did (or it ended), and
// whether they lived to stand before the first (-1: died on the way)
function run(world: WorldDef, kit: Kit, seed: number): number {
    const rng = makeRng(seed);
    const stats = gearStats(kit.equipment);
    const maxHp = BASE_HP + stats.hp;
    const p: Player = { stats, weaponTier: getItem(kit.equipment.weapon!).tier, maxHp, hp: maxHp, food: new Array<number>(kit.food).fill(kit.heal), time: 0 };
    const roof = { n: 0 };
    let risen = 0;
    const superiorFor = (def: EnemyDef) => {
        const s = world.superiors?.[def.id];
        if (s && risen < SUPERIOR_MAX && rng() < 1 / SUPERIOR_ONE_IN) {
            risen++;
            return s;
        }
        return undefined;
    };
    for (let i = 0; i < FIGHTS_TO_BOSS; i++) {
        const def = pick(world, rng);
        const group: EnemyDef[] = [];
        if (rng() < DEPTHS_PACK) {
            const size = DEPTHS_PACK_SIZE[0] + Math.floor(rng() * (DEPTHS_PACK_SIZE[1] - DEPTHS_PACK_SIZE[0] + 1));
            group.push(rng() < DEPTHS_PACK_LEADER ? champion(def) : def);
            for (let k = 1; k < size; k++) {
                group.push(def);
            }
        } else {
            for (let k = 0; k < 2; k++) {
                const d = k === 0 ? def : pick(world, rng);
                group.push(rng() < DEPTHS_CHAMPION ? champion(d) : rng() < (1 * 3) / ELITE_ONE_IN ? { ...d, hp: d.hp * 1.5 } : d);
            }
        }
        if (!fight(p, group, world, rng) || !collapses(p, roof, rng)) {
            return -1;
        }
        for (const d of group) {
            const s = superiorFor(d);
            if (s && (!fight(p, [s], world, rng) || !collapses(p, roof, rng))) {
                return -1;
            }
        }
    }
    // The run's bosses, and the first one's guards
    const bosses = [...(world.bosses ?? [world.boss])].sort(() => rng() - 0.5).slice(0, ENDLESS_BOSSES);
    const guards = BOSS_GUARDS[0] + Math.floor(rng() * (BOSS_GUARDS[1] - BOSS_GUARDS[0] + 1));
    const guardDefs = Array.from({ length: guards }, () => champion(pick(world, rng)));
    if (!fight(p, guardDefs.slice(0, 3), world, rng) || !fight(p, guardDefs.slice(3), world, rng) || !collapses(p, roof, rng)) {
        return -1;
    }
    if (!fight(p, [bosses[0]], world, rng) || !collapses(p, roof, rng)) {
        return 0;
    }
    // The rest grow stronger, to at least the deepest depth's strength, and
    // the strongest comes hunting
    const deep = endlessWorld(ENDLESS_DEPTHS).bosses ?? [];
    const hunter = bosses
        .slice(1)
        .map((b) => {
            const d = deep.find((x) => x.id === b.id) ?? b;
            const hp = Math.max(EMPOWER_HP, d.hp / b.hp);
            const damage = Math.max(EMPOWER_DAMAGE, d.damage / b.damage);
            return { ...b, hp: Math.round(b.hp * hp), damage: Math.round(b.damage * damage) };
        })
        .sort((a, b) => b.hp - a.hp)[0];
    if (!hunter || !fight(p, [hunter], world, rng)) {
        return 1;
    }
    return 2;
}

const SEEDS = Number(process.env.DEPTHS_SEEDS) || 200;
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`The Depths, ${SEEDS} runs per depth and kit: how often the first boss falls, and the second (the empowered hunter).\n`);
for (let depth = 1; depth <= ENDLESS_DEPTHS; depth++) {
    const world = endlessWorld(depth);
    const bosses = world.bosses ?? [];
    const hp = bosses.map((b) => b.hp).sort((a, b) => a - b);
    console.log(
        `== Depth ${depth}: enemies tier ${world.tier}, bosses ${hp[0]} to ${hp[hp.length - 1]} hp, hitting ${Math.min(...bosses.map((b) => b.damage))} to ${Math.max(...bosses.map((b) => b.damage))}`,
    );
    console.log(pad("kit", 40) + pad("hp", 6) + pad("to a boss", 11) + pad("one boss", 10) + "two bosses");
    const share = (n: number) => `${((100 * n) / SEEDS).toFixed(1)}%`;
    for (const kit of KITS) {
        let reached = 0;
        let one = 0;
        let two = 0;
        for (let s = 0; s < SEEDS; s++) {
            const n = run(world, kit, depth * 100000 + s * 31 + 7);
            reached += n >= 0 ? 1 : 0;
            one += n >= 1 ? 1 : 0;
            two += n >= 2 ? 1 : 0;
        }
        const stats = gearStats(kit.equipment);
        console.log(pad(kit.name, 40) + pad(BASE_HP + stats.hp, 6) + pad(share(reached), 11) + pad(share(one), 10) + share(two));
    }
    console.log();
}
