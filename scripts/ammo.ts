// Whether a pack's ammunition lasts a run (version 146): for each map, its
// tier's best bow, staff and thrown weapon, the shots a run takes (fighting
// a share of the map's enemies, then the boss), what's left to find after
// the shots that keep their ammunition and the kills' drops, against what a
// pack holds. No armour, so real play takes a little less.
//
//   npx tsx scripts/ammo.ts            (FOUGHT=0.35,0.6,1 for the shares)
import { AMMO_LIMITS, ITEMS, ItemDef, PRIZES, THROWN_LIMIT, gearPower } from "../src/content/items";
import { WORLDS } from "../src/content/worlds";
import { bestSpell, runesGiven, spellCost, spellScale } from "../src/content/spells";
import { playerHit } from "../src/game/combat";
import { makeRng } from "../src/game/dungeon";
import { gearStats } from "../src/game/inventory";

// run.ts's: a shot keeps its ammunition this often; a kill drops some one
// time in AMMO_DROP_CHANCE, this many shots (or casts) of it on average
const AMMO_SAVE = 0.4;
const AMMO_DROP_CHANCE = 0.25;
const DROP_SHOTS = 6;
const DROP_CASTS = 4;

const rng = makeRng(5);
const shares = (process.env.FOUGHT ?? "0.35,0.6,1").split(",").map(Number);
const best = (f: (i: ItemDef) => boolean) =>
    ITEMS.filter((i) => i.slot === "weapon" && f(i) && !PRIZES.has(i.id) && !i.exclusive).sort((a, b) => gearPower(b) - gearPower(a))[0];

console.log(`Shots a run needs from the pack (after ${AMMO_SAVE * 100}% kept and the kills' drops) / what a pack holds, fighting ${shares.map((s) => `${s * 100}%`).join(" / ")} of the map\n`);
for (const world of WORLDS) {
    const t = world.tier;
    console.log(`${world.name} (tier ${t}, ${world.enemyCount} enemies, boss ${world.boss.hp} hp)`);
    const weapons = [best((i) => i.tier === t && i.uses === "arrows"), best((i) => i.tier === t && i.uses === "runes"), best((i) => i.tier === t && !!i.thrown)];
    for (const w of weapons) {
        if (!w) {
            continue;
        }
        const stats = gearStats({ weapon: w.id });
        let scale = 1;
        let what = "";
        // What a pack holds, in shots
        let holds = w.thrown ? THROWN_LIMIT : AMMO_LIMITS.arrows;
        if (w.uses === "runes") {
            const given = runesGiven(w.id, undefined);
            const spell = bestSpell(w, given, () => Infinity);
            if (!spell) {
                continue;
            }
            scale = spellScale(w, spell);
            const cost = spellCost(spell, given);
            holds = Math.min(...cost.map((r) => Math.floor(AMMO_LIMITS.runes / r.n)));
            what = ` casting ${spell.name} (${cost.map((r) => r.n).join("+")} runes)`;
        }
        const shotsFor = (hp: number) => {
            let n = 0;
            for (let s = 0; s < 200; s++) {
                for (let h = hp; h > 0; n++) {
                    h -= Math.max(1, Math.round(playerHit(stats, rng()) * scale));
                }
            }
            return n / 200;
        };
        const total = world.enemies.reduce((n, e) => n + e.weight, 0);
        const perKill = world.enemies.reduce((n, e) => n + shotsFor(e.def.hp) * e.weight, 0) / total;
        const boss = shotsFor(world.boss.hp);
        const drop = AMMO_DROP_CHANCE * (w.uses === "runes" ? DROP_CASTS : DROP_SHOTS);
        const needs = shares.map((share) => {
            const kills = world.enemyCount * share;
            return Math.max(0, Math.round((kills * perKill + boss) * (1 - AMMO_SAVE) - kills * drop));
        });
        const flag = needs.some((n) => n > holds) ? "  << short" : "";
        console.log(`  ${(w.name + what).padEnd(58)} ${perKill.toFixed(1)} a kill, boss ${Math.round(boss)}: ${needs.join(" / ")} of ${holds}${flag}`);
    }
}
