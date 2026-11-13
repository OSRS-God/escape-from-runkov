# AGENTS.md: Escape from Runkov

Guidance for coding agents working on this repository. Read it before you change anything.
`README.md` is the long design record (how every system plays and why), and `PENDING.md` is the
changelog. This file covers how to work here safely and effectively.

## What this is

**Escape from Runkov** is a browser extraction game built from Old School RuneScape's art. You pick
a map, fight what lives there, loot chests and get back out. If you die, everything you carried
stays behind.

- **Stack:** TypeScript (strict), three.js 0.170, plain DOM UI styled like the OSRS interface, and Vite 6.
- **Old names:** the folder, the npm package and the browser storage keys are still called
  `dungeon-extraction`. Don't rename them, because players' saves live under those keys.
- **Hosting:**
  - The game is a static site on Cloudflare Pages.
  - Player accounts live in Cloudflare D1, behind a Pages Function (`functions/api`).
  - Co-op runs through a small WebSocket relay on Fly.io (`relay/`).
- **Art:** everything in `public/assets` is Jagex's copyrighted art, exported from the OSRS cache.
  That's fine for a fan project. Never sell it, bundle it into anything commercial, or commit it.
  `public/assets/` is gitignored.

### Live addresses

| What | Where |
|---|---|
| Main site | https://escape-from-runkov.pages.dev (Pages project `escape-from-runkov`, branch `main`) |
| Playtest site | https://playtest.escape-from-runkov.pages.dev (same project, branch `playtest`) |
| Account API | `<site>/api/*` (each site has its own D1 database, see below) |
| Co-op relay | `wss://escape-from-runkov-relay.fly.dev/coop` (Fly app `escape-from-runkov-relay`) |
| GitHub | https://github.com/OSRS-God/escape-from-runkov (`origin`; only `main` is pushed) |
| itch.io | Stuck at version 49 because of itch's size and file-count caps. Cloudflare is the real home. |

## The workspace around this repo

This repo sits inside a larger folder, `OSRS game/`, next to its siblings. Several workflows reach
into them.

| Folder | What it is |
|---|---|
| `dungeon-extraction/` | **This repo**: the game. |
| `Run-Escape/` | A separate repo (it has its own `CLAUDE.md`). It holds the OSRS cache tooling. **`scripts/cache/export-assets.ts` is the exporter** that turns the cache into glTF, PNG and JSON. It also has the room builders for the generated maps (`cave-rooms.ts`, `castle-rooms.ts`, `island-rooms.ts`) and `make-game-worlds.ts`, which writes `src/content/worlds.json`. Several of these scripts are uncommitted or untracked there on purpose. Don't commit or tidy that repo unless asked. |
| `full-assets/` | The exporter's output: about 1.2 GB or more of raw glb, png and json. It's the source for `npm run assets`. Its `README.md` explains its layout. |
| `starter-assets/`, `bundled-assets/` | Older asset sets. `starter-assets/README.md` documents the file formats: glTF with baked vertex colours, morph-target animation, and 1 unit = 1 tile. |
| `backups/` | Database exports. **These contain password hashes. Never read them into a conversation, print them, or commit them.** |
| `tools/butler/` | The itch.io uploader. It's legacy and rarely used. |

## Hard rules

These come from the project owner. Treat them as non-negotiable.

### Secrets and accounts
1. **Never print, log, commit, type or go looking for crown keys** (the owner and developer
   "crown" keys, see `src/game/crown.ts`). The same goes for the itch.io butler key, passwords and
   password hashes.
   - The code only holds SHA-256 hashes of crown keys. Keep it that way.
   - Don't search transcripts, history, storage or backups for keys. That has been refused before,
     as credential exploration.
   - If a task seems to need a key, stop and ask the user.
2. **Testing crown features:** add a throwaway test key as a crown for the duration of the test,
   then remove it.
   - Before any deploy, grep the tree and `dist/` for leftovers and make sure nothing matches:
     `TEMP-TEST-CROWN|d4465c43|testcrown`.
   - Never put a placeholder key into a link the user might open. A `?crown=` link stores
     whatever it's given in the browser.
3. **Production D1 (`runkov-accounts`) holds real players' accounts.**
   - Don't run writes against it without the user's explicit go-ahead.
   - Export a backup to `OSRS game/backups/` (outside the repo) first.
   - D1 time travel can roll back the whole database, which affects every account. Only the user
     decides that.

### Deploying and pushing
4. **Deploy only when explicitly asked, every time.**
   - The main site needs the user's explicit "Deploy" (or equivalent) for that release.
   - The playtest site needs an explicit yes for each redeploy.
   - The relay (`fly deploy`) and D1 changes also need an explicit go-ahead.
   - Approval doesn't carry over from one deploy to the next.
5. **Commit locally freely, but ask before `git push`.**
   - GitHub has a "changes must be made through a pull request" rule on `main` that the owner's
     pushes bypass. Don't rely on that.
   - The `playtest` and `release` branches have never been pushed. Leave it that way unless asked.
6. **Stage files by name. Never `git add -A` or `git add .`** Scratch files, logs and
   `public/assets` must stay out of commits.

### Saves and testing
7. **Players' saves are sacred.**
   - A change that drops or reshapes saved data (`SAVE_VERSION` in `src/game/save.ts`) needs the
     user's explicit agreement.
   - When it happens, it goes in `PENDING.md`.
   - Owner-only items (`exclusive` in `items.ts`, kept by `kit.ts`) must survive load, account sync
     and Start over.
8. **Test runs must be muted, and must not clobber the user's local save.** See "Testing in the
   browser".

## Commands

```bash
npm install
npm run assets        # compress what the game uses from ../full-assets into public/assets (WIPES public/assets first)
npm run dev           # Vite dev server (the agent convention is port 5180, see below)
npm run build         # tsc --noEmit && vite build -> dist/
npx tsc --noEmit      # type check only
npm run check-gear    # every wearable item has a worn piece with all its clips
npm run balance       # simulate every map with several loadouts (BALANCE_SEEDS=12 for steadier numbers)
```

Other scripts in `scripts/`, run with `npx tsx` or `node`:

| Script | Purpose |
|---|---|
| `depths-balance.ts` | The Depths simulated on paper, at each depth with several kits. |
| `ammo.ts` | Whether a pack's ammunition lasts a run on each map. |
| `gear-list.ts GEAR-LIST.md` | Regenerates `GEAR-LIST.md`. |
| `check-icons.ts` | Items whose icon is missing from `public/assets/items`. |
| `probe-region.ts <map> x1 y1 x2 y2` | Prints a map's collision around a spot (`#` solid, `n e s w` walls) and walks a line across it. |
| `compress-glb.mjs <from> <to>` / `compress-glb.mjs player` | Compresses one model, or every player piece. |
| `copy-player.mjs` | Recopies only the player pieces. |
| `compare-glb.mjs <export> <compressed>` | Checks a compressed copy against its export. |
| `icon-sheet.mjs` | Rebuilds `items.png`/`items.json`. `copy-assets.mjs` already runs it. |

There is no unit-test suite. Verification means a type check, the scripts above, and real runs in
the browser.

### Environment notes (Windows)
- **Shell:** the machine is Windows 11 with Windows PowerShell 5.1. Pipeline chain operators
  (`&&` and `||`) are not available.
- **Git:** it is not on PATH. Use `"$env:USERPROFILE\tools\git\cmd\git.exe"`.
- **Commit messages:**
  - Write the message to a temp file with
    `[IO.File]::WriteAllText("$env:TEMP\claude-msg.txt", $msg)`, then run
    `git -c core.editor=true commit -F "$env:TEMP\claude-msg.txt"`.
  - End messages with the attribution trailer your harness specifies.
- **File encoding:** edit source files and `PENDING.md` with an editor or edit tool, not
  `Set-Content` or `Out-File`. PowerShell 5.1 rewrites encodings and line endings.
- **Working directory:** PowerShell calls in agent harnesses may not start in the repo. Set the
  location explicitly.
- **Long-running work:** run long jobs in the background. That covers the exporter (minutes),
  `npm run assets` (minutes, hundreds of MB) and the dev server.

## Architecture

```
index.html            canvas#game + div#ui; loads src/main.ts, style.css, skin.css
src/main.ts           boot: renderer, save load, crown from URL, account sync, menu <-> run lifecycle,
                      abandoned-run settlement, co-op session wiring
src/content/          data and data-shaping code
  items.ts            every item (~1,000+): slot, tier, stats, stance, projectile, specials, prices,
                      shop stock, chest pools, owner/playtester exclusives
  worlds.ts           map definitions: tiers, enemies and bosses scaled to tier, shooters, ambient
                      sounds, the Depths, Forgotten Castle and Lost Isle generators, unlock rules
  worlds.json         generated by Run-Escape's make-game-worlds.ts. Don't hand-edit; regenerate.
  enemies.ts, threat.ts, tasks.ts, spells.ts, crownpets.ts, bodies.ts
  *-mobs.json, *-bosses.json   rosters for the Depths, Castle and endless bosses
src/game/
  run.ts              ONE RUN, and by far the biggest file (~550 KB): scene, player, enemies, AI,
                      combat, loot, props, bosses, mercs, co-op host/guest sides, extraction.
                      Search it; don't read it whole.
  region.ts           a map's collision (tile bits, walls, heights, roofs/cover), flow fields,
                      "hills", round tree obstacles
  caves.ts            room-grid layout for generated maps (CAVE_ROOMS, CASTLE_ROOMS, ISLAND_ROOMS)
  props.ts            interactive scenery kinds and per-map counts (PROP_PLANS: caves/castle/island)
  mapload.ts          streams a map's 64x64 squares nearest-first
  assets.ts           glTF loading, sRGB->linear vertex colours, duplicate-triangle removal, morph
                      split for >128 targets (MORPH_SPLIT), texture scrolling, sounds
  player.ts           the character built from body-kit and worn-item pieces; stances; DRAWN_OVER
  save.ts             SaveData, SAVE_VERSION, profiles/modes, character slots, save codes
  account.ts          account API client (apiBase picks local/site/main), save sync by revision
  crown.ts            crown keys (hash-checked), name colours, account-kept crowns
  kit.ts              owner/playtester kits, restoreKit/restoreCrownPets
  coop.ts             relay connection, rooms, GAME_BUILD
  party.ts            host<->guest message shapes and snapshot rates
  mates.ts            other players as drawn locally
  combat.ts           hit/soak/accuracy maths shared with scripts/balance.ts
  inventory.ts, gear.ts, mercs.ts, pets.ts, starter.ts, depths.ts, contract.ts, menu.ts,
  settings.ts, music.ts, torch.ts, shadows.ts, overhead.ts, icons.ts, friendcode.ts, paths.ts
src/ui/ui.ts          every screen and the HUD as plain DOM (~260 KB). touch.ts (phone controls),
                      chat.ts, fullmap.ts
public/ui             interface tiles and fonts (committed)
public/assets         generated by `npm run assets` (gitignored)
functions/api/[[path]].ts   Cloudflare Pages Function: the account API on D1
db/accounts.sql       the D1 schema (the function also creates tables on first use)
relay/                co-op relay (plain Node, no deps), Dockerfile, fly.toml, README
assets.json           which cache ids the game uses (items, sounds, locs, spotanims, maps)
```

### Key concepts
- **Maps:**
  - **Twelve real OSRS regions** cut from the cache: Lumbridge, Barrows, the Wilderness, the
    desert, Fremennik, Karamja, Kourend, Varlamore, Morytania, God Wars, Prifddinas and the
    Inferno. Each is a 3x3 grid of 64-tile squares, with different sizes for some.
  - **Generated room maps**, laid out new every run from 64x64 rooms in a grid. Doors use bits
    N1, E2, S4, W8.
    - **The Depths** (endless mode, caves).
    - **The Forgotten Castle** (castle mode, 5x5).
    - **The Lost Isle** (`island`, 5x4, `outdoors`, with a sea plane and coast-aware rooms).
- **Collision (`region.json` / `maps/<id>.json`):**
  - Per-tile bits: solid, wall sides, roof/cover, corner heights, bit 6 for blocked ground that
    isn't water, and bit 7 for an object on the tile.
  - Small pockets of flat blocked ground (6 tiles or fewer) are opened as "hills". In room
    builders, solid scenery inside a blocked band splits it into pockets that then get opened.
    Dress blocked bands only with non-blocking locs.
- **Assets:**
  - The layout is flat, with one file per thing (`npcs/<id>.glb`, `items/<id>.png`,
    `maps/<id>/<x>_<y>.glb`, `sounds.pack`).
  - Every model is meshopt-compressed by `copy-assets.mjs`.
  - Cloudflare Pages caps files at 25 MB, which is why maps stream by square.
- **Animation:** every clip frame is a morph target. WebGL2 guarantees only 256, so `assets.ts`
  splits models over 128 targets by clip. Adding player clips grows every piece. Don't add
  emote clips.
- **Colours:** the exporter writes sRGB palette colours as vertex colours, and `assets.ts`
  converts them. Don't double-convert.
- **Co-op:**
  - The host's browser runs the run, and guests send "up" and get "down" through the relay.
  - The relay only joins players whose `GAME_BUILD` matches.
  - Crown hashes also live in `relay/coop-relay.mjs`, so a crown change needs a relay redeploy.
- **Accounts:**
  - `/api/name|signup|login|save|daily|abyss|crown|logout`.
  - Passwords use PBKDF2. Saves are revisioned, and a stale write is refused.
  - Sessions are stored as SHA-256 hashes of their tokens.
  - Logins and signups are rate-limited by the `attempts` table.

### Browser storage keys (don't rename)
- **Saves:** `dungeon-extraction-save`. A crowned browser's second character is under
  `dungeon-extraction-save-2`, and `dungeon-extraction-slot` holds which one is active.
- **Settings and account:** `dungeon-extraction-settings`, `dungeon-extraction-account`,
  `dungeon-extraction-account-before`.
- **Crowns:** `dungeon-extraction-crown`, `dungeon-extraction-crown-account`.
- **Relay override:** `dungeon-extraction-coop`.
- **Session storage:** `dungeon-extraction-run-here`.

## Asset pipeline (exporter -> full-assets -> public/assets)

1. In `../Run-Escape`, export what's needed with
   `npx tsx scripts/cache/export-assets.ts <command> ... --out ../full-assets`. Commands include:
   - `player kits`
   - `player items <ids or assets.json>`
   - `map <ids> --tiles --full`
   - `collision <ids>`, which rewrites only the collision
   - `caves`, `castles` and `islands`, which rebuild the generated room sets and take minutes
   - `npc`, `item`, `loc`, `spotanim`, `sound`, `set <manifest>`
2. Add any new ids to `assets.json`. NPCs come from `worlds.json` and the mob/boss JSONs
   automatically.
3. **Stop the dev server**, then run `npm run assets`. It wipes `public/assets` first, and Vite
   holds files open on Windows. Restart the dev server afterwards.
4. For player-piece-only changes, use `node scripts/copy-player.mjs` instead, also with the dev
   server stopped.

### Recipes for adding things
- **A new item:**
  1. Add it in `items.ts` with its tier (and stance or projectile).
  2. Add its id to `assets.json`.
  3. Run `export-assets.ts player items <id>`, then `npm run assets` and `npm run check-gear`.
- **A shooter enemy:** add it to `SHOOTERS` in `worlds.ts`. Export its spotanims too and list them
  in `assets.json`.
- **A real-region map:**
  1. Add it to `assets.json` maps and export it with `map`.
  2. Give it a tier in `make-game-worlds.ts`, then regenerate `worlds.json`.
  3. Write its blurb in `worlds.ts`.
  4. Run `npm run assets`.
- **A generated-room map:** follow the Lost Isle (version 192). You need:
  - a room builder in Run-Escape plus an exporter command and a `copy-assets.mjs` block;
  - a `RoomSet` in `caves.ts`, prop counts in `props.ts` (`PropMap`), a `WorldDef` in
    `worlds.ts`, and a title-screen room in `ui.ts`;
  - pets wiring in `pets.ts` and `tasks.ts`.

## Versions, builds and changelog

- **Version numbers:** every change set gets the next number (the latest is 192, so the next is
  193). The commit is titled `Version N: <what changed, in plain words>`.
- **`PENDING.md` entries:**
  - Each change gets a paragraph near the top, in the house style. It says what changed, why
    ("as the user asked"), the constants and functions involved, and **what was tested and how**,
    with real numbers.
  - Mark it `(not yet deployed)` and update it when it ships, for example
    `(deployed to the main site <date> as <build>)`.
  - Status-only edits are their own commits, titled `PENDING: ...`.
- **`README.md`** is the design reference. Update the relevant section when behaviour changes.
- **`GAME_BUILD`** in `src/game/coop.ts` is the release identifier shown on the title screen and
  checked by the relay.
  - Main uses the date, `YYYY.MM.DD`, with `.2`, `.3` and so on for later releases that day.
  - The playtest branch carries its own counter with a ` playtest` suffix, for example
    `"2026.11.11.22 playtest"`.
- **Branches:**
  - `main` is the source of truth and the main site.
  - `playtest` follows main through merges, plus playtest-only switches (below).
  - `release` is an old line from the itch era; leave it alone.

### Playtest-only differences (exist only on the `playtest` branch)
- `WAYS_OUT_CLOSE = false` in `run.ts`: ways out never close.
- `removePlaytestKit` in `kit.ts`/`save.ts`: cleanup of the playtest's every-item kit.
- The ` playtest` build tag.
- Its own D1 database (`runkov-accounts-playtest`), the default binding in `wrangler.toml`.
  Production uses `[env.production]`.

Never merge `playtest` back into `main`.

## Deploying (only with explicit permission each time)

**Main site:**
```bash
npx vite build
npx --yes wrangler@latest pages deploy dist --project-name escape-from-runkov --branch main --commit-dirty=true
```
Before deploying:
- bump `GAME_BUILD`;
- run the type check;
- run the test-crown grep from "Hard rules";
- commit `Release <build> to the main site (version N)`.

**Playtest site:**
1. `git checkout playtest`, then `git merge main --no-edit`.
2. Bump `GAME_BUILD` (`"… playtest"`) and commit `Playtest build <build>`.
3. Run `npx vite build`, then deploy with `--branch playtest`.
4. Switch back to `main`.

**Verify every deploy:**
1. Fetch the site's `index.html`.
2. Find the bundle path with `/assets/index-[^"]+\.js`.
3. Fetch the bundle and confirm it contains the new `GAME_BUILD` string.
4. Then record the deploy in `PENDING.md`.

**Relay:** run `fly deploy --ha=false` from `relay/`. Keep exactly one machine, because rooms live
in memory. Check that `https://escape-from-runkov-relay.fly.dev/coop` answers `{"coop":true}`.

**D1 schema/data:** `npx wrangler d1 execute <db> --remote --file <sql>`. Only with explicit
approval, and with a backup first for production.

## Testing in the browser

### Servers
- **Dev server:**
  - Run `npx vite --port 5180 --strictPort --host 127.0.0.1`. `.claude/launch.json` defines the
    same server as `dungeon` (`npm run dev -- --port 5180 --strictPort`).
  - Open **`http://localhost:5180`**, not `127.0.0.1`. Storage and some host checks key off the
    hostname.
- **Local account API (optional):**
  1. `npm run build`.
  2. `npx wrangler pages dev dist --port 8790`. It uses a local D1 in `.wrangler/`.
  3. `apiBase()` uses port 8790 on localhost automatically.
  - Without it, you'll see harmless "connection refused" errors for `/api`.
- **Local relay (optional):** `node relay/coop-relay.mjs --any-map` serves
  `ws://localhost:8787/coop`. `relayUrl()` picks it on localhost.
- **Skipping the account:** the login screen has a hidden "Play on this device for now" button.
  Click it through JS to skip the account.

### Before a test run
1. **Mute the tab.** Set `muted: true` inside the `dungeon-extraction-settings` JSON in
   localStorage, then reload. Do this in every test tab, every time.
2. **Back up the user's local saves.** Copy every `dungeon-extraction-*` localStorage key into one
   backup key, for example `claude-backup-saves-<version>`.
3. **Restore afterwards from a page where the game isn't running,** such as
   `http://localhost:5180/favicon.ico` on the same origin. Otherwise the running game rewrites the
   save.
   1. Remove the test keys.
   2. Copy the backup back.
   3. Delete the backup key.

### Reaching the running game
Nothing is exposed on `window`. Patch the `Run` prototype through Vite's module URL:
```js
const m = await import('/src/game/run.ts');
const orig = m.Run.prototype.update;
m.Run.prototype.update = function (dt) { window.__run = this; return orig.call(this, dt); };
// start a run from the UI, then inspect window.__run (region, enemies, props, player...)
```
- **HMR caveats:**
  - Editing `run.ts` (and most modules) makes Vite reload the page, which ends the run under test.
    Re-apply the hook and start again.
  - After a hot update, a bare `import('/src/...')` can resolve to a **different module instance**
    than the page uses, so changes made through it have no effect. Reload first.
- **Screenshots:** the browser pane's screenshot tool can time out when the window is covered.
  A reliable fallback:
  1. Run a tiny local HTTP receiver that saves a POSTed data URL as a JPEG.
  2. In the page, resize the renderer (for example to 960x600) and render a frame.
  3. Send `canvas.toDataURL("image/jpeg")` to the receiver with `fetch`.
  4. To frame a shot, place the camera relative to the player's position.

### What a good test report contains
Report what was actually checked, with numbers. For example:
- reachability from the spawn to every boss, chest and exit;
- sealed seams between rooms that don't connect;
- no creature spawned off open ground;
- damage, heal or timing values observed;
- console errors, if any.

Say plainly what wasn't tested. Phone layout and co-op are the usual gaps.

## Code conventions

- **Formatting:** TypeScript strict mode, ES2022, ES modules. 4-space indent, double quotes,
  semicolons, and long lines are fine. `tsc --noEmit` must pass.
- **Comments:** comments are prose that explain *why*. They often cite the version that
  introduced a behaviour and the user's request ("version 151, as the user asked"). Keep that
  style. Name tunables as `UPPER_SNAKE` constants near their use, with a comment saying what the
  number means.
- **Shared logic:** game logic that the balance scripts also use (`combat.ts`, `items.ts`,
  `worlds.ts`) must stay free of DOM and three.js, so `tsx` can run it in Node.
- **Matching OSRS:** follow OSRS where a real behaviour exists (animations by seq id, item stats
  from the cache's bonuses, spot animations, sounds), and note the ids used.
- **Gear:** no cosmetic-only pieces. Gear comes from real cache items with real bonuses (see
  README "The gear").
- **Big files:** `run.ts` and `ui.ts` are huge. Use targeted search and line ranges, and make small
  surgical edits. Don't reformat surrounding code.
- **Prefer data over special cases:** for example, `bossCount` on a `WorldDef` and `coast` on a
  `RoomSet`, not scattered `if (map === "island")` checks.
- **Difficulty:** the game is meant to be hard. Changes to balance should come with `npm run
  balance`, `depths-balance.ts` or an in-browser measurement, recorded in `PENDING.md`.

## Working with the project owner

- **Pronouns:** use they/them for the user, and for anyone else unless told otherwise.
- **How the user follows along:** they often work remotely, from a phone. Each final message must
  stand alone: what changed, what was tested, what wasn't, and what's deployed or pushed (usually
  nothing). Put screenshots in front of them as files, not paths.
- **Ideas:** suggestions such as new classes or features are often wanted as text only. Don't
  implement until asked.
- **Interruptions:** if the user interrupts a task and moves on, don't resume it unasked.
- **Ending a change:** finish with a local commit, then ask whether to put it on the playtest site.
  Never deploy or push on your own initiative.
