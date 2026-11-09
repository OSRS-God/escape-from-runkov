import * as THREE from "three";

import { COINS, ITEMS, PRIZES, SLOTS, getItem, rollGear, rollShopStock } from "./content/items";
import { TASKS } from "./content/tasks";
import { clampThreat, threatOpen } from "./content/threat";
import { WORLD_BY_ID, WorldDef, getWorld, mapUnlocked } from "./content/worlds";
import { Account } from "./game/account";
import { recordAttempt } from "./game/contract";
import { GameStart, Session } from "./game/coop";
import { crownKey, crownVerified, takeCrownFromUrl } from "./game/crown";
import { addItem, countOf, roomFor } from "./game/inventory";
import { loadIconSheet } from "./game/icons";
import { restoreCrownPets, restoreKit } from "./game/kit";
import { MenuScene } from "./game/menu";
import { PlayerLook } from "./game/player";
import { CoopSetup, Run, RunCarry, RunResult } from "./game/run";
import {
    GRAVE_RUNS,
    Grave,
    ItemStack,
    activeSlot,
    loadSave,
    loadedSlot,
    packSize,
    runAlive,
    runHeartbeatAge,
    SaveData,
    setActiveSlot,
    setOnWrite,
    writeSave,
} from "./game/save";
import { settings } from "./game/settings";
import { isTouch } from "./ui/touch";
import { UI } from "./ui/ui";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight, false);
// The brightness curve (assets.ts), with the settings' amount
renderer.toneMapping = THREE.CustomToneMapping;
renderer.toneMappingExposure = settings.brightness;

// A crown key in the address is kept for the co-op lobby (crown.ts)
const crownTaken = takeCrownFromUrl();
// The second character is a crowned browser's (save.ts): with no key, the
// first; with one that turns out not to check, back to the first too
if (!crownKey() && activeSlot() !== 0) {
    setActiveSlot(0);
}
const { save, wiped } = loadSave();
let run: Run | undefined;

// A run under way (version 153; settleAbandonedRun): how long its page may
// go quiet before the run counts as left, how often it speaks up, and the
// tab's own word that it was playing one
const ABANDONED_AFTER_MS = 30_000;
const HEARTBEAT_MS = 3_000;
const RUN_HERE = "dungeon-extraction-run-here";
// A run's map loading, and the account's newer save from another device
// that came meanwhile or mid-run (account.onNewer): taken at the run's end
let starting = false;
let newerWaiting: SaveData | undefined;

// Co-op: the connection to the relay (coop.ts), there or not
const session = new Session();

// The character in Lumbridge's courtyard behind the guild's screens
const menu = new MenuScene(renderer);
const ui = new UI(document.getElementById("ui")!, save, menu, session, { startRun });
if (wiped) {
    ui.notice = "This version starts everyone fresh: the save from before it has been cleared.";
}
// A piece taken out of the game, paid for as the save loaded (version 154)
if (save.refunded) {
    ui.notice = `The Demonic sceptre is gone from the game (in OSRS it's a cosmetic with no stats): ${save.refunded.toLocaleString()} coins were paid for yours.`;
    save.refunded = undefined;
    writeSave(save);
}
// A run left by closing or reloading the page counts as a death (version
// 153), and the page playing a run says so every few seconds
{
    const settled = settleAbandonedRun();
    if (settled) {
        ui.notice = settled;
    }
    setInterval(() => {
        if (run) {
            runAlive();
        }
    }, HEARTBEAT_MS);
}
if (crownTaken) {
    ui.notice = new URLSearchParams(location.search).has("home")
        ? "This browser holds the crown now. Add this page to your home screen and the icon brings it along."
        : "This browser holds the crown now.";
}
// The crown's check is a moment's work: the title screen draws it once done
crownVerified(crownKey(), () => {
    if (loadedSlot() !== 0 && !crownVerified(crownKey())) {
        setActiveSlot(0);
        location.reload();
        return;
    }
    // The crown's known now, so the owner's kept kit can be put back, and a
    // crown's own pet (version 118) given, or taken from a save without it
    const kit = restoreKit(save);
    if (restoreCrownPets(save) || kit) {
        writeSave(save);
    }
    ui.onSessionChange();
});

// The coins packed for the last run started: a run's haul is what came out
// over them
let broughtCoins = 0;

// What a run takes in from the save: the pack, what's worn, the guild's
// upgrades, the gravestone on that map, the pet, and the armour's wear. Coins
// packed (the stash screen's Coins section) go in the purse, not a slot.
function packUp(worldId: string): RunCarry {
    // Nobody goes in unarmed
    if (save.equipment.weapon === undefined) {
        save.equipment.weapon = 1205;
        ui.message("The guild lends you a bronze dagger.");
    }
    // Nothing past the pack's limits goes in (version 154: a pack made
    // before brews counted as food could hold 15 food and the brews besides):
    // what's over goes back to the bank
    const within: ItemStack[] = [];
    let returned = 0;
    for (const stack of save.backpack) {
        const n = stack.id === COINS ? stack.count : roomFor(within, stack.id, stack.count);
        if (n > 0) {
            within.push({ id: stack.id, count: n });
        }
        if (n < stack.count) {
            addItem(save.stash, stack.id, stack.count - n);
            returned += stack.count - n;
        }
    }
    if (returned > 0) {
        save.backpack = within;
        ui.message(`${returned} thing${returned === 1 ? "" : "s"} over the pack's limits went back to the bank.`);
    }
    save.stats.runs++;
    // The title screen offers the last three maps played
    save.recentMaps = [worldId, ...save.recentMaps.filter((id) => id !== worldId)].slice(0, 3);
    // Under way: what's packed is out there until the run says otherwise
    save.activeRun = { map: worldId, at: Date.now() };
    runAlive();
    try {
        sessionStorage.setItem(RUN_HERE, String(save.activeRun.at));
    } catch {
        // No session storage: the heartbeat alone tells
    }
    writeSave(save);
    broughtCoins = countOf(save.backpack, COINS);
    return {
        inventory: save.backpack.filter((s) => s.id !== COINS).map((s) => ({ ...s })),
        equipment: { ...save.equipment },
        coins: broughtCoins,
        packSize: packSize(save),
        specRate: 1 + 0.5 * save.upgrades.spec,
        grave: save.graves.find((g) => g.map === worldId),
        pet: save.pet,
        pets: save.pets,
        wear: { ...save.wear },
        autocast: save.autocast,
        spellbook: save.spellbook,
        // The level picked for the map, no higher than it's open to
        threat: Math.min(save.threat?.[worldId] ?? 0, threatOpen(save.stats.bestThreat, save.stats.mapsBeaten, worldId)),
    };
}

// Whether a run may start here: not while another tab plays one with the
// same pack (version 153); a left one is settled first
function runMayStart(): boolean {
    if (!save.activeRun || run) {
        return true;
    }
    const settled = settleAbandonedRun();
    if (settled) {
        ui.message(settled);
        ui.showMenu();
        return true;
    }
    ui.message("A run is under way in another tab of the game. Finish it there first.");
    return false;
}

function startRun(worldId: string): void {
    if (!runMayStart()) {
        return;
    }
    // The maps open in order: the one before this must be beaten
    if (!mapUnlocked(save.stats.mapsBeaten, worldId)) {
        ui.showMaps();
        return;
    }
    const world = getWorld(worldId);
    void launchWorld(world, packUp(worldId), (Date.now() ^ (world.tier * 7919)) >>> 0);
}

// The host started the party's run: everyone launches the same map from
// the same seed, the host running it and the guests following. What the
// others send while this browser is still loading the map waits for its run.
let launching: { ups: [string, unknown][]; downs: unknown[] } | undefined;

function startParty(game: GameStart): void {
    if (!runMayStart()) {
        return;
    }
    const me = session.id;
    const world = WORLD_BY_ID.get(game.mapId);
    if (!me || !world) {
        ui.message("The party's map isn't in this version of the game.");
        return;
    }
    const role = session.isHost ? "host" : "guest";
    const coop: CoopSetup = {
        role,
        me,
        heroes: game.heroes,
        send: role === "host" ? (message) => session.sendDown(message) : (message) => session.sendUp(message),
        loot: game.loot,
    };
    launching = { ups: [], downs: [] };
    // The host's threat level goes for the whole party (version 150)
    void launchWorld(world, { ...packUp(world.id), threat: clampThreat(game.threat) }, game.seed, coop).then(() => {
        const pending = launching;
        launching = undefined;
        for (const [from, message] of pending?.ups ?? []) {
            run?.receiveUp(from, message);
        }
        for (const message of pending?.downs ?? []) {
            run?.receiveDown(message);
        }
    });
}

session.onStart = (game) => startParty(game);
session.onChange = () => ui.onSessionChange();
session.onDown = (message) => {
    if (launching) {
        launching.downs.push(message);
    } else {
        run?.receiveDown(message);
    }
};
session.onUp = (from, message) => {
    if (launching) {
        launching.ups.push([from, message]);
    } else {
        run?.receiveUp(from, message);
    }
};
session.onLeft = (id) => run?.coopLeft(id);
session.onGone = (reason) => {
    launching = undefined;
    run?.coopLost(
        reason === "hostLeft"
            ? "The connection to the party's gone. You're out with what you carry."
            : "The party's over. You're out with what you carry.",
    );
};
// The Co-op room is only on the title screen when there's a relay to reach.
// With one, the game stays connected from the start (version 115): friends
// see this player online, and the title screen the relay's counts.
void session.available().then((available) => {
    ui.coopEnabled = available;
    if (available && save.friendKey) {
        session.keepOnline(save.friendKey, ui.presence());
    }
    ui.onSessionChange();
    // An invite link (the war room's): into that party once connected, the
    // address cleaned so a reload doesn't join again
    const params = new URLSearchParams(location.search);
    const join = params.get("join");
    if (available && join) {
        params.delete("join");
        const rest = params.toString();
        history.replaceState(null, "", location.pathname + (rest ? `?${rest}` : "") + location.hash);
        ui.joinFromLink(join);
    }
});

async function launchWorld(world: WorldDef, carry: RunCarry, seed: number, coop?: CoopSetup): Promise<void> {
    ui.showLoading(world.name);
    starting = true;
    try {
        run = await Run.create(
            renderer,
            world,
            carry,
            save.character,
            seed,
            {
                onEnd: (result) => void onRunEnd(result),
                onMessage: (text) => ui.message(text),
                onChanged: () => ui.updateHud(),
                onHurt: (hit) => ui.hurt(hit),
                onTrade: () => ui.showTrade(),
            },
            coop,
        );
    } catch (e) {
        console.error(e);
        starting = false;
        // Nothing went out: the pack's still at home
        save.activeRun = undefined;
        writeSave(save);
        ui.message("The map failed to load. Check the browser console.");
        if (!takeNewerWaiting()) {
            ui.showMenu();
        }
        return;
    }
    starting = false;
    ui.showHud(run);
    run.start();
}

// Died, or walked out: the pack and what was worn stay out there, but for
// the one piece that was insured. A death leaves a gravestone where you fell
// (x and z; none known, where you arrived), with what you carried, for the
// next few runs: one a map, so a second death there moves the stone and what
// the old one still held goes in with the rest. One safety net a death: with
// insurance paid out, the stone holds only every other thing. Coins carried
// are gone either way.
function leaveCarried(
    carry: Pick<RunCarry, "inventory" | "equipment">,
    map: string,
    x: number,
    z: number,
    died: boolean,
): { lost: ItemStack[]; insured?: number; graveMade: boolean; graveHalved: boolean } {
    const lost: ItemStack[] = carry.inventory.filter((s) => s.id !== COINS).map((s) => ({ ...s }));
    for (const slot of SLOTS) {
        const id = carry.equipment[slot];
        if (id !== undefined) {
            lost.push({ id, count: 1 });
        }
    }
    let insured: number | undefined;
    if (save.insured !== undefined) {
        const i = lost.findIndex((s) => s.id === save.insured);
        if (i !== -1) {
            if (lost[i].count > 1) {
                lost[i].count--;
            } else {
                lost.splice(i, 1);
            }
            addItem(save.stash, save.insured, 1);
            insured = save.insured;
        }
    }
    save.equipment = {};
    save.backpack = [];
    let graveMade = false;
    let graveHalved = false;
    if (died) {
        save.stats.deaths++;
        if (lost.length > 0) {
            const inGrave = insured !== undefined ? lost.filter((_, i) => i % 2 === 0) : lost;
            graveHalved = insured !== undefined && inGrave.length < lost.length;
            const grave: Grave = { map, x, z, items: inGrave.map((s) => ({ ...s })), runsLeft: GRAVE_RUNS };
            const old = save.graves.findIndex((g) => g.map === map);
            if (old !== -1) {
                for (const stack of save.graves[old].items) {
                    addItem(grave.items, stack.id, stack.count);
                }
                save.graves.splice(old, 1);
            }
            save.graves.push(grave);
            graveMade = true;
        }
    }
    return { lost, insured, graveMade, graveHalved };
}

// A run the page closed on, or was reloaded in, with nobody playing it
// (version 153, as a code check found): until then the save still held the
// pack from before the run, so reloading just before a death kept it all.
// It counts as a death where you arrived; insurance pays as ever. A tab
// that was playing it knows at once (RUN_HERE lives through a reload); any
// other waits until the run's page has gone quiet (another tab may still be
// playing it).
function runWasHere(): boolean {
    try {
        return save.activeRun !== undefined && sessionStorage.getItem(RUN_HERE) === String(save.activeRun.at);
    } catch {
        return false;
    }
}

function settleAbandonedRun(): string | undefined {
    const left = save.activeRun;
    if (!left || (!runWasHere() && runHeartbeatAge() < ABANDONED_AFTER_MS)) {
        return undefined;
    }
    for (const grave of save.graves) {
        grave.runsLeft--;
    }
    save.graves = save.graves.filter((g) => (g.runsLeft > 0 || g.map === left.map) && g.items.length > 0);
    const { insured, graveMade } = leaveCarried({ inventory: save.backpack, equipment: save.equipment }, left.map, NaN, NaN, true);
    save.insured = undefined;
    save.insuredPaid = undefined;
    save.activeRun = undefined;
    save.lastRun = { at: Date.now(), map: left.map, kind: "died" };
    restoreKit(save);
    restoreCrownPets(save);
    writeSave(save);
    const name = WORLD_BY_ID.get(left.map)?.name ?? "the map";
    return (
        `Your last run on ${name} ended when the page closed, and counts as a death.` +
        (graveMade ? ` What you carried is in your gravestone where you arrived.` : "") +
        (insured !== undefined ? ` Your insured ${getItem(insured).name} is back in the bank.` : "")
    );
}

// The account's newer save from another device, if one came during a run:
// it's the save now, and the run's result is set aside, as it was played
// from the older one (nothing of either is lost twice or kept twice)
function takeNewerWaiting(): boolean {
    const newer = newerWaiting;
    if (!newer) {
        return false;
    }
    newerWaiting = undefined;
    ui.adoptAccountSave(newer, account.name ?? save.character.name);
    ui.notice = "This account was played on another device during that run: its newer progress is loaded, and the run's haul couldn't be added to it.";
    ui.showMenu();
    return true;
}

async function onRunEnd(result: RunResult): Promise<void> {
    run?.stop();
    run = undefined;
    launching = undefined;
    // The host's back: the party's room is a lobby again
    if (session.isHost && session.room?.started) {
        session.end();
    }
    if (takeNewerWaiting()) {
        return;
    }
    const report = result.report;
    const stats = save.stats;
    stats.deepest = Math.max(stats.deepest, result.world.tier);
    stats.kills += report.kills;
    stats.bossKills += report.bossKills;
    stats.championKills += report.championKills;
    stats.rangedKills += report.rangedKills;
    if (report.bossKills > 0 && !stats.bossesBeaten.includes(result.world.id)) {
        stats.bossesBeaten.push(result.world.id);
    }
    stats.clues += report.clues;
    stats.vaults += report.vaults;
    if (report.graveTaken) {
        stats.graves++;
    }
    // Gravestones: the one on this map holds what was left in it, and every
    // one stands a run fewer
    const visited = save.graves.find((g) => g.map === result.world.id);
    if (visited && report.graveItems !== undefined) {
        visited.items = report.graveItems;
    }
    for (const grave of save.graves) {
        grave.runsLeft--;
    }
    // A stone running out on the map just died on again goes into the new
    // one (leaveCarried; version 154: it was dropped first, and lost)
    const diedHere = (g: Grave) => result.kind === "died" && g.map === result.world.id;
    save.graves = save.graves.filter((g) => (g.runsLeft > 0 || diedHere(g)) && g.items.length > 0);
    // A pet: kept whatever happened, and it follows from now if none does
    let pet: string | undefined;
    if (report.petFound && !save.pets.includes(report.petFound)) {
        save.pets.push(report.petFound);
        save.pet ??= report.petFound;
        pet = report.petFound;
    }
    // The shop restocks while you're away, with gear up to the hardest map
    // tier reached
    save.shop = rollShopStock(Math.random, Math.max(1, stats.deepest), 8 + 2 * save.upgrades.shop);
    let kept: ItemStack[];
    let insured: number | undefined;
    let graveMade = false;
    let graveHalved = false;
    if (result.kind === "extracted") {
        // What came out stays in the pack: the stash screen puts it away
        save.equipment = { ...result.carry.equipment };
        save.backpack = result.carry.inventory.map((s) => ({ ...s }));
        // The armour comes home as worn as the run left it
        save.wear = { ...(result.carry.wear ?? {}) };
        save.coins += result.carry.coins;
        stats.extractions++;
        if (!stats.mapsEscaped.includes(result.world.id)) {
            stats.mapsEscaped.push(result.world.id);
        }
        // Out with the boss slain: the map is beaten, and the next opens
        // (the threat levels this player had open before this win)
        const openBefore = threatOpen(stats.bestThreat, stats.mapsBeaten, result.world.id);
        if (report.bossKills > 0 && !stats.mapsBeaten.includes(result.world.id)) {
            stats.mapsBeaten.push(result.world.id);
        }
        // And beaten at its threat level: the next level opens (version
        // 150). A party's guest, playing at the host's level, counts no
        // higher than it had open itself (version 154: it skipped levels)
        if (report.bossKills > 0) {
            const level = Math.min(result.carry.threat ?? 0, openBefore);
            stats.bestThreat = { ...stats.bestThreat, [result.world.id]: Math.max(stats.bestThreat?.[result.world.id] ?? 0, level) };
        }
        stats.bestHaul = Math.max(stats.bestHaul, result.carry.coins - broughtCoins);
        // A wish from the genie isn't a run to the way out, so it's no
        // record (version 78)
        if (!report.genie) {
            stats.fastestEscape = stats.fastestEscape > 0 ? Math.min(stats.fastestEscape, report.seconds) : report.seconds;
        }
        kept = result.carry.inventory;
    } else {
        ({ lost: kept, insured, graveMade, graveHalved } = leaveCarried(result.carry, result.world.id, report.x, report.z, result.kind === "died"));
    }
    // Insurance is for one run, whichever way it went, and the run's over
    save.insured = undefined;
    save.insuredPaid = undefined;
    save.activeRun = undefined;
    // The owner's kept kit comes home whatever happened (kit.ts), and a
    // crown's pet stays its own
    restoreKit(save);
    restoreCrownPets(save);
    // Wear is only kept for gear still owned somewhere
    const owned = new Set<number>([
        ...save.stash.map((s) => s.id),
        ...save.backpack.map((s) => s.id),
        ...Object.values(save.equipment).filter((id): id is number => id !== undefined),
        ...save.graves.flatMap((g) => g.items.map((s) => s.id)),
    ]);
    for (const key of Object.keys(save.wear)) {
        if (!owned.has(Number(key))) {
            delete save.wear[Number(key)];
        }
    }
    // Tasks done by now, paid once
    const done = TASKS.filter((t) => !save.tasks.includes(t.id) && t.done(save, result));
    for (const task of done) {
        save.tasks.push(task.id);
        save.coins += task.reward;
    }
    // Version 115: how it ended, for the title screen; the pace hits come
    // at, for the vault's word on food; and the day's contract, paid in
    // coins and a clue scroll the run it's done
    save.lastRun = { at: Date.now(), map: result.world.id, kind: result.kind };
    stats.damageTaken += report.damageTaken;
    stats.secondsPlayed += report.seconds;
    const contract = recordAttempt(save, result, result.kind === "extracted" ? result.carry.coins - broughtCoins : 0);
    if (contract) {
        save.coins += contract.reward;
        addItem(save.stash, contract.rewardItem, 1);
    }
    writeSave(save);
    ui.showSummary(result, kept, { tasks: done, insured, grave: graveMade, graveHalved, pet, contract });
}

// Every item icon in one sheet, fetched once (icons drawn before it comes
// fill in when it does)
void loadIconSheet();

// The account (version 116, account.ts): made or logged in to before the
// guild, the save kept with it on the server. The account's copy is
// fetched as the page opens (newer than this device's, it's loaded), and
// every change to the save is sent a moment after. A test character (a
// crowned browser's second, save.ts) is this browser's alone.
const account = new Account();
ui.account = account;
setOnWrite((written) => account.push(written));
account.onNewer = (newer) => {
    // Never mid-run, nor while a run's map loads: kept for the run's end
    // (version 154: it was dropped, the 409 had taken the server's rev, and
    // the run's end then wrote over the other device's progress; and one
    // taken while a map loaded let that run start with the old pack)
    if (run || starting) {
        newerWaiting = newer;
        return;
    }
    ui.adoptAccountSave(newer, account.name ?? save.character.name);
    ui.notice = "This account was played on another device since: its newer progress is loaded.";
    ui.showMenu();
};
account.onLoggedOut = () => {
    if (!run && loadedSlot() === 0) {
        ui.showAccount("login", "This device was logged out. Log in again to carry on.");
    }
};
// The page going away: what's waiting goes now
window.addEventListener("pagehide", () => {
    if (loadedSlot() === 0) {
        account.push(save, false);
    }
});

async function openGame(): Promise<void> {
    if (loadedSlot() !== 0) {
        ui.showMenu();
        return;
    }
    if (!account.state) {
        ui.showAccount("create");
        return;
    }
    ui.showLoading("Loading your account");
    const result = await account.pull();
    if (result.ok) {
        if (result.data.save) {
            ui.adoptAccountSave(result.data.save, result.data.name);
        } else {
            save.character.name = result.data.name;
            account.push(save, false);
        }
        ui.showMenu();
    } else if (result.status === 401) {
        ui.showAccount("login", "This device isn't logged in any more. Log in again.");
    } else {
        // The server can't be reached: this device's copy, sent once it can
        ui.notice = "Couldn't reach the account server: playing from this device's copy, which is sent when the connection's back.";
        ui.showMenu();
    }
}
void openGame();

// Phones play sideways only: upright, the cover comes down and a run waits
if (isTouch) {
    const apply = () => ui.onOrientation(window.innerHeight > window.innerWidth);
    window.matchMedia("(orientation: portrait)").addEventListener("change", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", () => setTimeout(apply, 100));
}

// For poking at a run from the console, and for scripts/check-gear.ts's
// browser half
Object.assign(window, {
    game: {
        get run() {
            return run;
        },
        save,
        menu,
        session,
        ITEMS,
        PRIZES,
        rollGear,
        rollShopStock,
        PlayerLook,
    },
});
