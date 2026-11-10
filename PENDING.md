# Pending for the next push

Version 147 (deployed 8 November 2026 as Version 2026.11.08.2, `GAME_BUILD` "2026.11.08.2"): ranged and magic hit less, as the user asked, so they aren't the
easy choice. `STYLE_DAMAGE` in items.ts: a bow or thrown weapon hits 85% of its listed max, a
spell 90%, melee unchanged, taken off in `gearStats` with the armour's bonuses; the tooltips,
the item card and the shop's compare show the hit after it (`weaponHit`). A staff casts every
2 seconds, not 1.8 (`CAST_TIME`). gearPower still goes by the listed numbers, so every tier's
prize is unchanged (no staff is near the top). THROWN_LIMIT 300 → 350, as the rune knife's
tier-3 maps cleared to the last enemy took 334 (scripts/ammo.ts: every map fits again).
Then, as the user agreed to the suggestion, kiting costs ground: each ranged shot, throw or
cast slows you to 60% (`AIM_SLOW`) for 0.45s from its start, or half the weapon's attack time
if less (`AIM_SECONDS`, `aiming` in run.ts; tested: 2.95 tiles/s aiming against 4.91). The war
room's Speed shows the pace without it (`speed(false)`) and notes it for a ranged weapon.

Version 148 (deployed 8 November 2026 as Version 2026.11.08.3, `GAME_BUILD` "2026.11.08.3"): later maps' gear drops, as the user asked. On tier 4 and 5 maps
only 9–23% of the weapons and armour dropped beat the tier under's best (the 4:2:1 weighting
toward a tier's weakest third, and a third of drops from the tier under). Now
`RARITY_BY_TIER` in items.ts weights tier 4 evenly and tier 5 at 1.25:1.1:1 (the shop's
shelves too), and `UNDER_TIER_WEIGHT` in worlds.ts makes the tier under 12 (tier 4) and 7
(tier 5) against the map's 60, not 25: 17% and 11% of drops. Measured: 24–40% of a tier 4
map's and 36–46% of a tier 5 map's weapons and armour beat the tier under's best (a tier 3
map's: 19–40%). Tier 4's armour stays lowest, as many of its pieces are weaker than tier
3's best. Prizes and their chances unchanged.

Version 149 (deployed 8 November 2026 as Version 2026.11.08.4, `GAME_BUILD` "2026.11.08.4"): ranged and magic can't clear a map untouched, as the user asked.
Every regular enemy moved 1.8–3.6 tiles a second against the player's 4.9, and most maps had
few or no shooters. Now a melee enemy (not a boss or a shooter) hit from more than 3 tiles
past its edge is `riled`: 4 seconds at 1.6 times its pace, capped at BOSS_CHASE_SPEED
(`RILE_FROM`, `RILE_SPEED`, `RILE_SECONDS`; `toldRiled` says so once a run). Poison doesn't
rile. A co-op guest's hits rile on the host from the guest's spot. And SHOOTERS in worlds.ts
gains fifteen of the maps' own enemies (ghost, skeleton, afflicted, ugthanki, mountain troll,
dagannoth, tribesman, snake, lizard, sulphur lizard, reanimated demon spawn, pyre fox, fiyr
shade, snakeling, Jal-MejRah) with the strike and bolt spells' looks, spit and rocks as a
ranged earth strike: shooters are now 11% of Lumbridge's enemies and 18–57% of every other
map's (were 0% on five maps). Tested: a zombie hit from 6 tiles went 1.8 → 2.88 for 4s, from
1 tile not at all; a Lumbridge skeleton shot every 2.2s for 4–7.

Version 150 (not yet deployed): fixes from a Codex review the user passed on. Healing specials
on ranged and magic weapons (Toxic siphon, Sanguine, Invocate, Blood surge) healed nothing, as
only a melee swing added up what it dealt: a special's shot now carries `heal` on its
projectile, and what it takes off its target heals that share on landing (tested: a 40 hit at
50% healed 20, a spell's 30 at 30% healed 9). The Barrows pet's floor was a third of the max,
under a hit's own 60% lowest roll, so it never did anything: now 80% (about 6% more on
average). Saradomin brews skipped the eating delay and the food limit, so a stack of them at
300 coins each was a bottomless heal: a brew now waits out EAT_DELAY and starts it, counts
towards FOOD_LIMIT with food (`isFood` in inventory.ts), and costs 1500. Ice spells froze for
OSRS's 4.8–19.2 seconds and every cast topped it up, so a melee enemy could be held for good:
freezes are halved (2.4–9.6s), aren't topped up while they hold, and a thawed enemy can't be
frozen again for 5 seconds (`FREEZE_IMMUNE`, `thawed`). And a boss with a second form had its
tier's hitpoints and 60% more again (balance.ts never played the second form): now the two
forms share them (`SECOND_FORM_SHARE` in enemies.ts), so the Kalphite Queen has 861 + 517,
Skotizo 1406 + 844 and K'ril 2500 + 1500. The review's last finding, magic weak on bosses (a
staff's damage a second about half the best melee or bow's at every tier), the user chose to
leave as it is: magic's part is groups and freezes.

Version 151 (not yet deployed): a harder game, as the user asked (suggestions 1, 2, 3 and 5).
Threat levels (`content/threat.ts`): picked on the title screen per map (`save.threat`), 0 to
5, each +12% enemy hitpoints, +10% enemy damage (boss +10%/+8%), −15% kill food, +2 champions
in a hundred, +30% elites, a 6% quicker clock, every boss burning floor from 3, and +20% coins
and +30% prize chance; a map opens a level each time it's beaten at its highest open
(`stats.bestThreat`); the host's goes for a party (`GameStart.threat`, which the relay passes
through as it is). `threatWorld` in run.ts scales the defs as `partyWorld` does. Bosses: the
slam (now `SLAM_HIT` 2.5 times a hit, not 1.5) comes from a fight's start, every 7s and 4.5s
enraged, not only enraged; and a boss without burning floor marks its target's spot every 6s
when they're out of the slam's reach (`STRIKE_*`: 1.4 tiles, 1.3s, twice a hit). Escaping: a
hit taken (not poison) starts the 10 seconds over. Accuracy (`hitChance` in combat.ts): 92% at
the map's tier, +3% a tier above, −12% a tier below, bosses −6%; specials always land; a miss
is a blue 0 with no spell effect, and an area spell's others roll their own. Tested in the
seed tab: threat 5 made an imp 13 hp (8), the boss 900 (600) with floor, 31 champions; the
strike ringed the player every 6s with the slam at the boss every 7s; a hit at the way out
reset 2.0s to 0, poison didn't; 90 misses in 1000 bronze sword swings on Lumbridge.

Version 152 (not yet deployed): worn capes and amulets, as the user asked. Armour sitting a
little outside a cape showed through it (patches of platebody in the Obsidian cape and 3rd age
cloak, the Saradomin cape's and Cape of legends' corners through the shoulders), and an amulet
sank into most chestplates (the glory hidden on rune, dragon, Bandos, Armadyl, iron, Masori,
Justiciar and the fighter torso). The OSRS client draws them over by face priority; here the
cape's and amulet's pieces are drawn 0.07 and 0.14 tiles nearer the camera along each point's
line to it (`DRAWN_OVER`, `drawOver` in player.ts), so nothing moves on screen. Checked on 16
capes from behind and running, the glory on 16 bodies, and front views with the nudge on and
off (the same: a cape doesn't show through a chest). Then, as the user pointed out against
OSRS, the random lines: the pieces were drawn double sided (the exporter's glTF), and a cape is
two layers whose lining and outside the item's recolours colour apart (the Saradomin cape's 88
lining faces white, 54 outside faces blue, 20 cream, per the cache), so both layers fought.
The client culls faces turned away; every player piece is now `FrontSide` (player.ts), which
gives the OSRS Wiki's Saradomin cape (blue, cream hem, white collar), clean pleats on the Cape
of legends and Obsidian cape, and the Saradomin cloak white with its blue star. Checked 16
capes and five outfits front, side and back (shields side on, skirts, staffs, godswords): no
holes.

Version 153 (not yet deployed; the relay part needs its own deploy to Fly): the serious
findings of a code check the user asked for.
- Crown keys: a party member's loadout carried their raw crown key, which the relay sent to
  everyone in the room, so anyone in a party with the owner or playtester could have worn
  their crown (and had the test kit). Now the key goes only to the relay (`crownKey` on the
  member, not the loadout), which checks it against the same SHA-256s (`crownFor`,
  `CROWN_HASHES` in coop-relay.mjs) and sets `loadout.crown` to the crown's alt, whatever the
  loadout said; the game shows party crowns by alt (`crownByAlt`, `nameColorFor`). Friends'
  crowns are checked the same way (hello's `crownKey`; a said crown is ignored). Tested on the
  local relay: the host shows "owner", a stranger claiming it with a made-up key shows none,
  and the key is in nothing the stranger received. The old keys may already have leaked in a
  party: new keys need new hashes in crown.ts and coop-relay.mjs.
- Reloading mid-run: the save held the pre-run pack until the run ended, so reloading just
  before a death kept everything. `save.activeRun` is set as a run is packed and cleared as it
  ends; the playing page writes a heartbeat every 3s under its own key (`runAlive`), and marks
  its tab in sessionStorage (`RUN_HERE`). A page opening on a run its own tab was playing, or
  one quiet for 30s, settles it as a death (`settleAbandonedRun`, sharing `leaveCarried` with
  onRunEnd: insurance pays, a gravestone with no spot stands 1.5 tiles from where you arrive);
  while another tab plays one, a new run can't start. Tested on the main character: a reload
  mid-run emptied the pack and worn gear into a Lumbridge gravestone (5 items), found a step
  from the arrival next run.
- Co-op hosts took guests' messages at their word. Now (`receiveUp`): numbers must be finite;
  a hit is at most 5 times the guest's gear's max hit (`guestMaxHit`, kept from their
  loadout and `gear` messages, at least 20), never negative, on an enemy within 15.5 tiles;
  take, drop, open, dig and revive need the guest near (3.5 tiles; revive's range plus 1.5);
  drops must be real, non-exclusive items; the vault and golden chest need a key, and digging
  a clue scroll, that this host handed that guest (`guestHolds`); a `move` without a sound
  defence keeps the last; `gear` keeps only real items in their own slots. Not tried in a live
  party.
- Accounts API: a login whose name no account could have (or whose password is a length none
  has) is refused with nothing kept but the try from that network (any length of name was
  kept before); tries at a name are counted per network (`login:<name>@<net>`, 8 per 15
  minutes), with 100 per 15 minutes from all networks (a network that hasn't got it wrong
  still gets its try), so nobody can lock a player out; tries and sign-ups are noted before
  they're judged, so a burst can't all pass the count (`note` first, `unnote` on a good
  login); IPv6 addresses count by their /64 (`networkOf`).
- Relay: incoming frames and messages not yet whole are budgeted across every connection
  (48 MB, then one holding over 64 KB is dropped; `Connection.account`); the output cap
  counts the frame being written; only known messages count as activity, and only
  `ACTIVE_MESSAGES` keep a room alive; character names go through `chatText`, which now also
  strips the Arabic letter mark, the Mongolian vowel separator, the Hangul fillers, the blank
  Braille cell and tag characters, and stacked marks past two. Run-Escape's 65 relay tests:
  64 pass before and after (the one failure is the two relays having grown apart).

Version 154 (not yet deployed): the code check's gameplay bugs, as the user asked.
- Combat (run.ts): a held key's repeats no longer drink, eat, spend specials or flick prayers
  (`e.repeat`); a special with nothing to hit waits for the next swing, its bar kept
  (`inSwing`, `takeSpecial(stats)`); a swing lands with the weapon it began with
  (`swingStats`: a maul swapped in mid-swing hit with its own numbers on the first weapon's
  quicker swing); what a heal counts is what came off (an armoured elite's six tenths), and no
  heal lands on a fallen player. Tested: holding 4 drank 1 of 6 prayer potions; a special at
  nothing kept 100 of the bar; 40 scimitar swings with a granite maul swapped in never hit
  above the scimitar's 32.
- Bosses: a slam, strike or burning floor whose boss dies under it does nothing; a second
  form heals only as high as it rose with, and is quicker than the enraged first form (0.55
  of its interval enraged, not 0.7 after 0.65). Tested: a boss killed under its ring did no
  damage; a second form's heal stopped at 360 of the first form's 600.
- Co-op: a guest asks for one pickup at a time, and one it hasn't room for after all goes back
  down for everyone (a pile was granted against the same free room, and what didn't fit was
  lost); a guest's breath and its boss prayer drain go by what's roused near it (its copies of
  the enemies have no target); an enemy's fall heard while its model loads is kept
  (`ghostsLoading`, `ghostsKilled`). Not tried in a live party. A guest whose connection drops
  still keeps its pack, as the comment there means it to (a host leaving ends every guest's
  run, which isn't the guest's doing).
- Saves (main.ts, ui.ts, save.ts): an account's newer save from another device that comes
  during a run, or while its map loads, is taken at the run's end and the run's result set
  aside (it was dropped, the 409 had taken the server's rev, and the run's end wrote over the
  other device; one taken while a map loaded let the run start with the old pack); insuring a
  second piece moves the cover with the first fee back (`insuredPaid`; it was lost); a
  gravestone running out on the map died on again goes into the new one (it was dropped
  first); Load code and Start over replace every field (`replaceSave`; an old insurance, pet,
  contract or threat levels carried over), and a save code into a browser without a crown
  drops owner-only pieces (`dropExclusive`); a grave's things come back only as far as the
  pack's limits (`roomFor`); a pack past the limits (one from before brews counted as food) has
  the rest put back in the bank as a run's packed. Tested: switching cover refunded 1,200 and
  charged 1,120; 15 sharks and 5 brews packed went in as 15 with the 5 brews banked; a grave's
  10 sharks gave 3 to a pack of 12 and kept 7.
- Smaller: selling to the trader no longer counts as coins found for the genie; a party
  guest's best threat level rises no higher than it had open itself; shots with no look of
  their own share one ball, a drop's shaft of light is freed when it's taken (and at the run's
  end), and a body's health bar goes with it, its animation no longer worked out once it's
  gone (`fadeDead`). A full run (12 kills, the boss, the golden chest, the escape) threw no
  errors.
- The Demonic sceptre (33296) is gone, as the user chose: a tier 5 staff here, but in OSRS a
  League's cosmetic for the shield slot with no stats. Out of items.ts, assets.json, GEAR-LIST
  and public/assets (its model and icon; the index entries left are harmless). A save holding
  one loses it as it loads, unpaid: the user had a refund at its sell price taken out again.
  The owner's test character, paid 12,500,000 for its kit's one before that, had it taken
  back (3,377 coins now). Tested: a save given one loads without it and with no coins more.
  check-gear: 1041 items, 0 problems.

Version 155 (not yet deployed): the fire and infernal capes' lava moves, as in OSRS, as the
user asked. The client scrolls some textures: each moves speed / 128 of the way across a 20 ms
tick in its direction. Run Escape's new scripts/cache/dump-texture-anims.ts prints every one
the cache animates as texture coordinates a second (40, the fire cape's, 0.78 a second; 59,
the infernal cape's, 0.39; and the rest of the lava kind); `TEXTURE_SCROLL` in assets.ts has
them, `findScrolling` finds each in a loaded model by its material's name (texture_<id>), and
`scrollTextures` moves them before each frame (the run's and the menu's). So any map lava
with those textures flows too. Tested: three frames 0.32s apart show both capes' patterns
moving, the infernal cape's at half the fire cape's pace.

Version 168 (not yet deployed), as the user asked: a fifth starter class for the Forgotten
Castle, "Prayer · Monk" (starter.ts), with nothing in it that sells for much (version 167's
Initiate was scrapped for its 11,000 coins of armour): an iron warhammer and monk's robes,
200 coins of gear in all (about 50 at the shop), three vials of holy water, two prayer
potions and eight shrimps, with the lantern and oil every kit gets. The robes give +11 prayer
bonus, the most of the five, and 5 defence, the least; they count as magic, so the hammer
hits 8% less in them. The Delver's blurb says "Light armour" now (it was "the lightest of
the four"). Tested on the dev server: the card shows with its six items, picking it gives
the kit, and in the castle its stats are as above with the lantern lit.

Version 166 (not yet deployed), as the user asked: sixteen kinds of thing to use about the two
maps (props.ts says what and how many; run.ts placeProps puts them in rooms of their own kind
first, propActions says what E does, propSelf and propWorld do it). E is a tap, or a hold of
the thing's own length that a hit breaks (PROP_TAP and the holds in run.ts).
- Both maps: oil barrels (tap: two cans of oil; hold: light the fuse, and three seconds later
  it bursts, hurting anything within three tiles, heroes too); crates, sacks, rubble and
  shelves to search (three seconds, often nothing; coins, food, oil, ammunition, a potion,
  now and then a clue scroll); cold braziers (lit from a lit lantern: the room joins the lit
  ones, shows on the map, and the weakest third of the map's kinds won't walk into it); a
  lever that opens a passage between two far rooms (a cave mouth, or the castle's
  trapdoors), both ends then on the map; a shrine with one trade a run (half your hitpoints
  for a fifth harder hits, half your coins for a piece of gear, your prayer bar for every
  boss's lair on the map, or all your food for 25 defence); dead adventurers to search (gear,
  coins or supplies, and one in five gets back up as a champion).
- The Depths: ore and gem rocks (three loads each, a hold apiece, heard nine tiles off; the
  better ores deeper down; new items: iron, coal, mithril, adamantite and runite ore, uncut
  sapphires to diamonds, all to sell); pools (a drink once each, which heals and may cure or
  poison; three cave eels to fish, a new food healing 35); cracked rock that only shows when
  you come on it, which a four second hold breaks for a cache of two pieces and coins, loudly;
  rope ladders, one way down to somewhere at least 60 steps off and never a living boss's
  lair, a hard landing, and the rope snaps.
- The Forgotten Castle: easels of the lords' portraits in the quarters (who's still holding
  court, how far and which way, and their halls on your map); the library's three marked
  bookcases and the chapel's lectern naming the one with a vault behind it (the vault gives
  two pieces at the crystal chest's odds and a purse; a wrong book lets out a nest of the
  weakest kind); suits of armour in the halls and courtyards, one in five waking as a champion
  animated armour when you pass; the chapels' fonts (a vial of holy water each, a new potion
  doubling your hits on the undead and vampyres for 60 seconds); prisoners in the dungeons'
  stocks (three in five fight at your side for 90 seconds, the rest turn on you as a champion);
  banquets in the halls (ten bites, 12 hitpoints each, one in five gone bad).
- Co-op: the props go out with the map (party.ts `props`), a guest's E goes to the host as
  `use` and the host's word comes back as `prop`; what a hero drinks, eats, trades, reads or
  climbs is their own, what drops or wakes is the host's. A freed prisoner is the host's
  whoever freed him (as the user asked, everyone sees him): the host moves him at his hero's
  side and swings for them, guests are told of him (`ally`) and draw him where the
  snapshots say (`al`).
- A freed prisoner finds his way round walls by the field the enemies follow to his hero,
  only goes for what he can see, and is put back by his hero if he's stuck (he walked into
  castle walls before).
- Poison's ticks don't break a hold (`lastStruck`, not `lastHurt`): a bad drink from a pool
  stopped every mine and fish till it wore off.
- Touch: the big button names a hold ("Search · hold", "Mine · hold"), a tap with a hold
  besides ("Fill · hold: light", "Drink · hold: fish") and a hold under way ("Searching ·
  keep holding"), "Locked" at a sealed passage; the prompts say "hold the button".
- Assets: 26 new locs and 11 new items in assets.json (exported with Run-Escape `loc` and
  `item`, icons in the sheet).
Tested on the dev server, single player: every kind on both maps placed in its rooms and
used (the barrel's burst took a banshee from 68 to 9, the crack and the library vault paid
out, the passage carried the player 300 tiles, the ladder dropped them 170, a freed prisoner
hit a gargoyle, a mad one attacked, a suit of armour woke). Then: holy water doubled a hit
on an Ankou and not on a Black Knight; a lit room kept a dark wizard at its doorway while a
Vyrewatch Sentinel walked in. Co-op, two tabs on the local relay, castle and Depths: the
guest used barrels (oil and a burst that killed a champion), sacks, a brazier, the lever and
a trapdoor (288 tiles), the font, the banquet, the library's vault, a corpse, a vein, a pool,
a crack, the shrine and a ladder, and woke a suit of armour, with the host's state the same;
prisoners freed by the guest and by the host were each seen on both screens following the
one who freed them, the guest's killing a dark wizard in four swings. Phone sized (740 by
360 with touch): the button and prompts as above, a held button searches a crate. Not tried:
a real phone, three or four players.

Version 165 (not yet deployed), as the user asked: both maps gone over for their looks.
- Light: the Depths and the Forgotten Castle have a gloom of their own now, the night's
  machinery made general (run.ts `gloom`: the caves a dim brown, the castle a cold moonlit
  blue), with a hero's lantern a warm light in it as far as it lets them see (little of it
  unlit) and the nearest eight fires of the rooms lighting the ground round them (torch.ts:
  twelve lights, each with its own reach).
- The dark is drawn on a small canvas over the game's (placeCaveDark) with a hole round
  whoever's watched and smaller ones round every light near: the rooms' fires, glowing fungus
  and crystals, the ways out once open, the altar and the chests worth finding, each washed
  with its own colour, so a torch down a hall shows from across it.
- Rooms' lights: the room exports carry what glows in each (caves.json and castles.json
  `lights`; caves.ts gives the layout's).
- Caves (Run-Escape cave-rooms.ts): stalagmites by the walls of every room, pale blue glowing
  fungus and purple crystals (more in the pillared halls and the lairs), and a campfire in
  each camp, its torches and fire rings lit.
- Castle (castle-rooms.ts): a deep red carpet up the middle of the halls and chapels to the
  throne or the altar, gold standing torches round the walls of the halls, quarters and
  libraries, candelabra in the chapels and by the throne and altar, wooden torches in the
  dungeons, more candles on the walls, skulls in the dungeons, vines and now and then a well
  for the fountain in the courtyards.
- The screen shakes when the roof comes down, a lair shuts or the ornate chest's floor goes,
  and each fallen rock lies where it landed for a while. The altar and the camps are on both
  maps once found. The castle's lairs shut with its own words.
- A wall or a rock between the camera and whoever's watched isn't drawn where it would hide
  them (torch.ts setSeeThrough: a window along the line of sight, soft at the edge): a hero
  beside a castle wall's north face was hidden behind it.
- A room's fires are lit no closer than six tiles to each other (caves.ts LIGHT_APART): a
  castle room has some thirty candles and torches, and all of them lit left no dark.
Checked: all 90 castle rooms and 60 cave rooms re-exported, every door joined and the floor
reached (99.95% at worst). Tested on the dev server: the castle hall moonlit with its carpet,
by lantern, a torchlit wall, the window through the south wall; the Depths with crystals,
fungus and stalagmites lit; a collapse shaking the screen and leaving four rocks. Not tried:
co-op, a phone.

Version 164 (not yet deployed), as the user asked: the regular maps are gone and everyone
starts fresh. The game is the Depths and the Forgotten Castle, both open from the start, on
the one stash (save.ts SAVE_VERSION 4: a save from before is dropped on load, an account's
too, the name kept; the modes' separate profiles are gone from the screens, though save.ts
still reads them). The Forgotten Castle is a four star map (worlds.ts CASTLE_WORLD: enemies
and lords at tier 4, the lords with the Depths' half again of a boss's hitpoints), no depths,
its title, Lord of the Forgotten Castle, for escaping it with a lord slain. Everything that
was the Depths' alone is everyone's: the lantern and oil in every starter kit, the Delver,
the shop's lantern and oil and the delvers' upgrades (shards from either map), no insurance,
the daily cave. The title screen's rooms start a run on either map; the maps screen lists
the two and the daily cave. Tasks that wanted the regular maps are about these two now: a
star task by escaping a run that many stars or more (the Depths' go up a star a depth),
"Both ways down", "Deepest delver" (the fifth depth), the Conqueror for both, a pet of every
one of the 22 bosses, and the Wise Old Man's, the night's, the night boss's and the genie's
replaced (a Depths boss; a depth cleared; a lord slain and escaped; oil still in the pack).
worlds.json stays for the Depths' enemies taken from the old maps. Tested on the dev server:
a fresh save, the four classes, the title screen's rooms, the maps screen, a castle run at
tier 4 with the lantern lit.

Version 163 (not yet deployed), as the user asked: the Forgotten Castle, a new map 40 by 40
OSRS chunks (5 by 5 map squares, 320 by 320 tiles, about 73,000 open: the biggest there is),
a mode of its own like the Depths (the user's picks: a fresh-start profile, laid out new every
run, several bosses), past the Inferno (opened by beating it on the regular profile; five
stars at depth 1).
- Rooms: Run-Escape's new scripts/cache/castle-rooms.ts (and export-assets.ts `castles`, the
  caves' export made general) builds 90 rooms, every door set in six kinds: great halls
  (Falador castle's pale stone, a throne, long tables and chairs, pillars, armour, banners),
  overgrown courtyards (rough grey stone, dead grass, a dry fountain, dead trees, statues),
  quarters and libraries (Draynor Manor's plaster and panelling, thin walls between rooms with
  doorways, beds, wardrobes, shelves), chapels (pews and an altar) and dungeons (grey stone on
  dark earth, cells, chains, crates); cobwebs, rubble and bones everywhere. Walls go as Draynor
  Manor's do (cave-dump.ts read it): facing in on the ring round the floor, Ls and posts at the
  turns, thin walls on tiles' edges inside. Checked: every room's doors joined and all its open
  ground reached, by the exported collision (a first export had cobwebs, which block, in
  doorways: they now go only where they cut nothing off).
- Game: caves.ts lays out any room set (RoomSet: CAVE_ROOMS 6 by 5, CASTLE_ROOMS 5 by 5);
  worlds.ts's CASTLE_ID world at five depths (enemies four tiers up, lords five, as the Depths'
  rules past five stars), castle-mobs.json's 14 enemies (dark wizards, animated armour, black
  knights, feral vampyres, ankou, shadow warriors, armoured zombies, huge spiders, undead
  druids, gargoyles, hellhounds, skeleton warlords, skeletal mystics, Vyrewatch sentinels) and
  castle-bosses.json's 8 lords (Count Draynor, the Black Knight Titan, Vanstrom Klause, Arrav,
  Dusk, Vardorvis, the Nightmare, Verzik Vitur), each with a move of its own (run.ts
  SIGNATURES) and a candlelit lair; models, clips and sounds exported by a helper (none met
  elsewhere in the game). Everything the Depths have the castle has (the dark and the lantern,
  sealed lairs, the hunter, the roof's collapses as its ceilings', events, special rooms,
  shards, upgrades, no insurance or gravestones, one golden chest), with titles of its own
  (Trespasser to Lord of the Forgotten Castle); not the Delver, the Slayer cape or the daily
  cave, which stay the Depths'.
- Profiles: save.ts keeps one profile a mode now (`profiles`, by mode; `mode` "endless" or
  "castle"); a save with the one other profile in `other` has it read as the mode not out.
  The title screen has the Forgotten Castle's room under the Depths' (locked till the Inferno),
  its entry screen, and Leave the Castle; the maps screen lists both modes under "Modes of
  their own".
Tested on the dev server: the castle's entry, a fresh start (the regular profile waiting), a run
(25 rooms of all six kinds, 72,959 open tiles, 262 enemies, 5 lords and lairs, the altar and
both room chests, the lantern lit), Count Draynor's lair sealed and his bite, a lord slain
empowering the rest and the Nightmare hunting, an escape giving shards, depth 2 and the title;
an old save's `other` read into `profiles`, and switching through all three modes and back.
Not tried: co-op in the castle, every lord's move in a fight.

Version 162 (not yet deployed), as the user asked: a starter class of the Depths' own, the
Delver ("Slayer · Delver"; starter.ts, `depths` keeps it off a regular new character's
choice). Built for the dark rather than the fight: iron knives (one held, 150 packed) and an
iron longsword packed for close in; a spiny helmet and slayer gloves over leather, the
lightest armour of the four; fifteen shrimps (a full pack's food; six at first, the user asked
for fifteen), a prayer potion, and five cans of oil on top of the lantern and three every
Depths start gets. Tested: the Depths' class pick shows the four, and
the Delver's pick gave that kit, eight cans of oil and the lantern.

Version 161 (deployed to the playtest 10 November 2026 as 2026.11.10.2): nine of the suggestions for the Depths, as the user asked, and
the Slayer cape as depth 5's reward:
- Light: a bullseye lantern (4550) in the pack burns an oil can (277) every two minutes and
  sees four tiles further in the dark (run.ts updateLantern, LANTERN_SIGHT). A Depths fresh
  start gets one and three cans (starter.ts); a Depths chest's purse is oil half the time; the
  shop sells both in the Depths.
- Cave shards (depths.ts shardsFor): every Depths run, a death too, earns a shard a kill, 2 a
  champion, 8 a superior, 30 a boss, a quarter more a depth deeper, half again for getting out.
  They buy the delvers' upgrades in the shop (save.ts DEPTHS_UPGRADES, three levels each):
  Provisions (two of the depth's food packed a level), Steady prayer (a tenth slower drain),
  Keen eyes (a tile more sight), Hardiness (five hitpoints). Kept in the Depths profile's
  `depths`.
- The hunter: on both maps wherever it is, and on the HUD by the clock with an arrow, how far
  and which way (run.ts huntWord); the ground shakes, its sound with it, as it comes inside 60,
  30 and 15 tiles. Co-op: `boost` says which is hunting.
- The fourteen bosses' own moves (SIGNATURES): the King Black Dragon's fire, poison and ice
  breaths; Elvarg's line of fire; the smoke devil's prayer-choking cloud; the Giant Mole
  burrowing at each quarter and coming up elsewhere; Cerberus's three souls; Sarachnis's
  spawn; Rex's stomp; Supreme's volley; Obor's club that throws you back; Bryophyta's
  growthlings and Scorpia's guardians and Corp's dark core, which mend their boss while they
  live; Calvar'ion's lightning; the Ice Queen's frost that holds you.
- Lair themes (LAIR_THEMES): each lair's floor tinted and its dark its own colour, and lava
  (the dragons, Cerberus), spores (the moss giants), webs (Sarachnis, Scorpia), ice (the Ice
  Queen) and sea water (the Dagannoths) slow or burst; smoke drains prayer; Corp's and
  Calvar'ion's dark is deeper, the Mole's dusty.
- Special rooms (placeRooms): an altar that fills the prayer bar once a run; a trapped
  treasure room's ornate chest (two pieces at a champion's prize odds and a purse; the floor
  round it gives way); a brimstone chest the first superior's brimstone key (23083) opens (two
  pieces as the crystal chest gives them); two dead adventurers' camps with food, oil and a
  potion. Co-op: the world message carries them.
- Cave events from two minutes in, every two and a half: a room flooded shut for a minute
  (its doorways blocked under water), a pocket of gas that drains prayer, a swarm of every tiny
  one within 40 tiles. Co-op `flood` and `gas`.
- Rewards: a title for each depth cleared (escaped with a boss slain; depths.ts DEPTH_TITLES:
  Delver, Tunneller, Deep delver, Abyss walker, Slayer of the Depths), shown by the name; each
  Depths boss can leave its own pet, one in 20 (pets.ts, a gift each); and the fifth depth
  gives the Slayer cape (9786; its icon and worn model exported, `reward` keeps it out of every
  chest, drop and the shop): tier 5, 14 defence, 10 hitpoints, +4 prayer, a tenth harder hits
  in the Depths.
- The daily cave: today's seed and depth (one to three in turn) for everyone, from the maps
  screen; the haul out over what went in goes on a board (functions/api's `daily` table: GET
  /api/daily, POST it logged in, each account's best a day, today's or yesterday's only). It
  takes nobody a depth deeper.
Tested in runs on the dev server: the lantern lit (11 tiles), the altar, both room chests, two
camps and five tinted lairs placed; the King Black Dragon's lair sealed and it breathed fire
then poison; killed, the Ice Queen hunted ("← Ice Queen hunts you: 275 tiles west"); Cerberus's
souls rose at 66%; the Mole went under and came up elsewhere; a flood blocked 24 tiles and
drained; gas took 13 prayer in two seconds; the ornate chest gave two pieces and seven rings, the
brimstone chest took the key; a death gave 64 shards; escaping depth 5 with a boss gave the
title and the cape, which shows worn; the board's endpoints on a local server (best kept,
unauthorised and old days refused). Not tried: a party, the swarm, lava and spores bursting.

Version 160 (deployed to the playtest 10 November 2026 as 2026.11.10.1), as the user asked: the Depths' tiny ones drop tier 1 only,
whatever the depth: gear (champions' prizes too), food, arrows and runes (worlds.ts
DEPTHS_TINY: guanic and giant bats, giant crypt rats, crypt spiders, cave bugs, crawling hands,
cave crawlers, cave slimes, rockslugs; EnemyDef's `tiny`; run.ts killEnemy's TINY_LOOT).
Their superiors are their own kinds and keep their hoards. About two in three of a depth 1
cave's enemies are tiny (153 of 231 in a test run, the weakest being the commonest). Tested:
those 153 made champions and killed dropped 153 pieces of gear, every one tier 1, shrimps
and bread, bronze and iron arrows; the other 78 dropped tiers 1 to 3.

Version 159 (deployed to the playtest 9 November 2026 as 2026.11.09.6): the Depths made far harder than the regular maps, as the user
asked (nobody should come close to more than one boss in a run), all twelve suggestions in:
- Depth d has enemies of tier d + 1 and bosses of tier d + 2 (worlds.ts depthsWorld), with half
  again a regular boss's hitpoints (DEPTHS_BOSS_HP; twice, first, left a tier 3 kit, the best
  the Depths give before a golden chest, unable to kill one at depth 1), and past five stars
  1.35 times again for every tier over. `depth` on the world now names the depth; its tier is
  its enemies'.
- A boss slain makes every boss left at least the deepest depth's strength (or three times
  its hitpoints and twice its hit, whichever is more: EMPOWER_HP/_DAMAGE) and the strongest of
  them hunts you for the rest of the run (run.ts empowerBosses; co-op `boost`).
- A lair seals once everyone in it is five tiles in from its doorways with its boss up: boulders
  (locs 2919 and 5842, new in assets.json) on its doorways, blocked until the boss falls or
  nobody's left in there, and then the boss heals whole; one that loses you heals whole too
  (caves.ts doorways/cellAt, region.ts setSolid, run.ts updateLairs/shutLair/openLair; co-op
  `seal`). Checked: sealing each of the 360 rooms of 12 caves left nothing outside reachable.
- The cave wakes after 30 seconds, not four minutes; every 75 the roof comes down round each
  of you (4 rocks and one more each time, the first right where you stand, a tenth of your
  hitpoints and 3% more each time to 35%), rousing what's near (run.ts collapse).
- No genie, and the ways out are hidden and shut until a boss falls, or six minutes have gone
  (DEPTHS_EXITS_OPEN: without it a fresh start's kit, which can't kill a boss, could never get
  out).
- Food on the dead 30% as often, a kill's prayer potion and a chest's food or potion 35% as
  often (a purse instead), one food a chest, prayer drains half again as fast.
- Dark: the screen goes black but for about seven tiles round you (placeCaveDark, a gradient
  over the canvas: fog goes by depth, so the sides stayed lit).
- Champions and elites three times as often; 30% of enemies come as packs of 3 to 5, led by a
  champion half the time; enemies start 16 tiles from where you arrive, not 8 (a test run died
  at the start); 4 to 6 champions guard each boss.
- Superiors one kill in 15, up to 8 a run, and one rising rouses what's within 12 tiles.
- No insurance and no gravestone in the Depths (main.ts leaveCarried; the stash screen and the
  death summary say so).
- One golden chest opens a run; the rest have rusted shut.
`scripts/depths-balance.ts` plays it on paper (packs, champions, superiors, collapses, guards,
the boss, then the hunter): at every depth, with every kit up to the best in the game, two
bosses in a run 0.0% of 500; one boss at depth 1 a tier 5 set 100%, a tier 3 set 0.2% (real
play dodges and prays, which the paper doesn't). Tested in a run: the bosses at 1950 hp each,
59 champions of 228 enemies, the ways out hidden, no genie, a lair sealed (24 doorway tiles, 6
boulders, nothing outside reachable), the boss killed: the four left rose to 6834 hp hitting
95 and the Ice Queen (10935) came hunting, the lair opened, the ways out came up; the second
golden chest stayed shut; the roof came down at 75 seconds for 10 of 100; a sealed boss left
hurt healed whole.

Version 158 (not yet deployed), as the user asked. Purple (tier 4) and gold (tier 5) gear only
from a boss's golden chest, on every map: chests, kills, champions, superiors, caskets, balloons
and the shop give tier 3 at best (items.ts FOUND_TIER_MAX; run.ts dropGear's `from`), but the
champion's crystal chest, each piece of which is purple 3% of the time (CRYSTAL_PURPLE_CHANCE)
whatever the map; shop shelves already holding tier 4 or 5 are cleared on load. A boss chest
still gives its map's own tier (the Depths' every tier), so tier 4 and 5 maps' bosses are where
purple and gold come from. Start over in the Depths begins only the Depths again (save.ts
restartProfile: their stash, coins, gear, record and a class to pick; the regular profile and
the look are kept). The Depths' rooms (Run Escape cave-rooms.ts) got big rocks out in the
open (a boulder, rock heaps, big sandstone rocks, a rock cluster; each with a clear tile all
round, so it can't close a way through), skeletons and bones lying about that don't block,
skeletons by the walls in lairs and red mushrooms in the plainer rooms. Checked: 30 layouts,
all 60 room designs among them, walked tile to tile at the player's size with the game's own
collision: every door through, at worst 99.994% of the open ground reached (the rest single
tiles in corners).

Version 157 (not yet deployed), as the user asked: mages and archers everywhere stand their
ground and keep shooting however close you come (run.ts's retreat is gone). The Depths get
fourteen of OSRS's cave slayer monsters (depths-mobs.json: cave bug, crawling hand, cave
crawler, banshee, cave slime, rockslug, giant bat, cockatrice, pyrefiend, cave horror,
aberrant spectre, dust devil, basilisk, bloodveld; pyrefiends and spectres cast), mixed in
weakest first with the other maps' underground ones and Fremennik's jelly, and thirteen mini
bosses, OSRS's superiors (Crushing hand, Chasm Crawler, Screaming banshee, Giant rockslug,
Cockathrice, Flaming pyrelord, Monstrous basilisk, Insatiable Bloodveld, Vitreous Jelly, Cave
abomination, Abhorrent spectre, Choke devil, King kurask): one kill in SUPERIOR_ONE_IN (30)
of its lesser kind brings one up where it fell, at most SUPERIOR_MAX (4) a run, six times its
lesser kind's hitpoints and 1.6 times its hits, going for whoever's nearest, dropping a purse
eight times the kind's and two pieces of gear at a champion's prize odds; an orange dot on the
maps. Animations found with classify-npc-seqs.ts, sounds by the OSRS Wiki's list (each kind's
own: cave_crawler_*, bloodveld_*, banshee_* and the rest; a superior its lesser kind's, the
Monstrous basilisk giant_basilisk_*). Tested: a Depths run with 205 enemies of about 25 kinds;
a forced superior rose where a crawling hand fell (66 hp against its 11) and attacked; a
pyrefiend set beside the player stayed there and cast four times in eight seconds.

Version 156 (not yet deployed; on the playtest since 9 November 2026): the Depths, a new mode,
as the user asked (first called Endless, renamed the same day; `endless` is still its id in the
code and the save, so a profile made under the old name carries on). It's open from the
start (at first it took beating the Inferno; the user asked for it straight away), and
entering it (the maps screen's Endless row, or the
title screen's Endless mode button) puts out a profile of its own (save.ts's `mode`, `other`
and PROFILE_KEYS: stash, coins, gear, record, upgrades, pets and the rest; the look, name and
friends are shared): the first time, an empty stash and the starter kits to pick again. Leave
Endless (title screen, maps screen or the starter screen) brings the regular profile back as
it was. Both ride in the one save, so the account keeps both. In Endless only Endless can be
played: five bosses a run, picked from six cave and lair bosses met nowhere else
(endless-bosses.json: King Black Dragon, Elvarg, Thermonuclear smoke devil, Giant Mole,
Cerberus, Sarachnis, exported with their own idle, walk, attack and death clips, and OSRS's
sounds by the OSRS Wiki's list of sound ids: the Giant Mole's own, the dragon set for the King
Black Dragon, Dragon Slayer's breath and scream for Elvarg, the dust devils' for the smoke
devil, the hellhounds' bark, snarl and death for Cerberus, the big spiders' for Sarachnis;
the cache's animations carry none of them, since the server sends an NPC's; then eight more,
as the user asked, for fourteen: Dagannoth Rex and Supreme (Supreme shoots), Obor, Bryophyta,
Scorpia, Calvar'ion, the Corporeal Beast and the Ice Queen (who throws ice), each with
animations found by classify-npc-seqs.ts and sounds by the same list: the dagannoths', the
giants', the scorpions', Vet'ion's own, the grim giant's for the Corporeal Beast, an ice spell
and the female hit and death), each placed
as far from the others and the start as can be found, each with a golden chest; loot rolls
every tier, one to five. It starts at depth 1 (one star enemies and bosses, as a starter kit
can manage) and goes a star deeper for each escape with a boss slain, to 5. No pets drop
there, the daily contract's boss job takes any boss, and the "every map" tasks count the
regular maps only. Before that: the map itself, at first called the Depths, a cave
laid out new from the run's seed every run, the biggest map in the game (384 by 320 tiles,
about 62,000 open against Lumbridge's 37,502). Thirty rooms, one per cell of a six by five
grid, grown off a start on the south edge with a quarter of the side by side pairs joined
again for loops (game/caves.ts). The rooms are Run Escape's scripts/cache/cave-rooms.ts:
each a map square in the cache's own format, carved as lobes and corridors and walled the
way Taverley Dungeon is (cave wall 1417 straight, diagonal and corner pieces, rock fill 1434,
pebbles and wall decoration from the real cave, props by kind: plain, lair, camp, pillars),
with a door in the middle of each side it opens on, so rooms meet; all 61 (every set of doors
in four kinds, and solid rock) are drawn by export-assets.ts's new `caves` command with the
same loader as the real maps, and copy-assets.mjs takes them into assets/caves (18 MB
compressed). Enemies are other maps' underground ones (crypt spider, guanic bat, skeleton,
giant crypt rat, ghoul, ghost, jogre, kurask, reanimated demon). No night in a cave, and the
distance fades to black. Tested: entering Endless gives the starter screen with an empty
stash and the regular profile kept (and a save round trip of both); a depth 1 run loads with
all thirty rooms, five bosses 153 to 537 steps from the start in different corners, five
golden chests and every-tier loot; build and check-gear pass. Not yet tried: co-op (guests
lay out the same seed), a whole run to a boss and out, depth going up. The relay needs no
change (a player's unlocks list just says endless in Endless).

Version 146 (deployed 8 November 2026 as Version 2026.11.08, `GAME_BUILD` "2026.11.08"): ammunition, as the user asked, for thrown weapons
that never ran out and enough shots for a whole run with a bow or staff, and speeds. Thrown
weapons stack (`thrown` on ItemDef): one held, each throw takes another of the same from the
pack, THROWN_LIMIT 300 packed, sold by 25/100 in the shop at `THROWN_PRICE` per point of max hit
by tier (bronze dart 5, dragon dart 121), out of the gear shelves (`rollShopStock`, and parseSave
clears an old shelf of them), 20–40 when found as gear; a save from before gets 100 more of each
kind it has, once (`thrownBundles`), and separate stacks are merged. Packs hold 300 arrows (was
150) and 1,000 of each rune (was 250); two shots in five keep their ammunition (`AMMO_SAVE`, with
the Fremennik pet's share on top); a kill of your own drops what your weapon takes one time in
four (`dropOwnAmmo`: 4–8 shots, or 3–5 casts of the last spell's runes, nothing above the map's
tier). New `scripts/ammo.ts`: every map's run fits a pack with its tier's best bow, staff and
thrown weapon, even a full clear (tightest the rune knife, 275 of 300). Player speed ×0.9
(`PLAYER_SPEED`, `RUN_CLIP_SPEED`), enemies ×1.2 (`ENEMY_SPEED_SCALE` in worlds.ts); a fast
elite is capped at the melee boss's chase (just under the player). Tested in the seed tab: 27
rune dart throws took 16, "You're out of rune darts" at none left, the drops by weapon, the save
grant once only, the shop's bundles.

Version 145 (7 November 2026): the game's version is the release's date, as the user asked:
`GAME_BUILD` "2026.11.07" (year.month.day, .2 and on for more releases the same day), the title
screen's "Version 2026.11.07" where it said "Build 144". The relay only compares the strings, so
nothing there changes. These notes go on numbering versions from 145.

Version 144 (built 7 November 2026, not deployed): the player throws as OSRS does, as the user
asked. Run Escape's PLAYER_CLIPS gained attack_throw (929, knives, axes and javelins),
attack_dart (6600), attack_chinchompa (2779) and attack_salamander (5247), 12 frames at most;
`thrown()` in items.ts picks one by the weapon's name. Every player piece re-exported with the
scratchpad's reexport-player-v144.ps1 (174 s: kits, every item, then every special export in
order: the gilded set, the three Guthix sunfire pieces with their paint and insets, the Ankou
outfit, the red ghostly robes, the red staff of the dead and spirit shield), the old export
kept in full-assets/player-before-v144; the scratchpad's compare-colours.mjs found every
special piece's vertices and colours unchanged. Packed with `node scripts/copy-player.mjs
../full-assets` (vite stopped, 219 s): 1,195 pieces, 2,308 MB, the biggest 5.4 MB. Every player
file changed, so the next deploy uploads all of them. `GAME_BUILD` 144.

Version 143 (built 7 November 2026, not deployed): thrown weapons fly as themselves, as the user
asked (they flew as their metal's arrow). The cache's travel spot animations, ids from the
scratchpad's RuneLite gameval SpotanimID: darts 226–231 (black 34, amethyst 1936, dragon 1122),
knives 212–218 (dragon 28), thrownaxes 35–41 (bronze 36, iron 35, dragon 1319), Morrigan's
javelin 1620 and throwing axe 1623. Exported with `export-assets.ts spotanim <ids>`, packed into
public with the scratchpad's pack-kind.mjs (vite stopped), added to assets.json's spotanims.
The player's throw itself still plays the sword swing: OSRS's throws (knives and axes 929,
darts 6600, chinchompas 2779, salamanders 5247) would be new PLAYER_CLIPS and a re-export of
every player piece. `GAME_BUILD` 143.

Version 142 (built 7 November 2026, not deployed): perks, as the user asked for more variety in
what armour does. Each comes from the piece's own OSRS bonuses (`src/content/osrs-bonuses.json`,
written by Run-Escape's new `scripts/cache/dump-bonuses.ts ../dungeon-extraction/assets.json
<out>`): a damage perk (melee strength, ranged strength or magic damage for a weapon of that
style, capped 1.5% to 3.5% by tier, `PERK_CAP`), a ward (a third more defence against magic or
ranged for a piece OSRS gives much more of it there), and OSRS's prayer bonus where
`PRAYER_BONUS` had none. 323 of the 646 pieces of armour and jewellery have one. Balance sim
(BALANCE_SEEDS=8): tiers 1–4 unchanged, tier 5 bosses 3/4/6 of 8 → 5/6/8 (caps of 2–8% made it
7/8/8). Shown in the tooltip, the stats card and the bank's worn panel. `GAME_BUILD` 142.

Version 141 (built 7 November 2026, not deployed): armour has a strength stat by its tier and
combat style, as the user asked (`strength` on an ItemDef, `TIER_STRENGTH` and `SLOT_STRENGTH`
in items.ts, `GearStats.strength` in inventory.ts): melee strength, ranged strength or magic
damage, a share on a matching weapon's max hit, shown in the stats card, the item's tooltip and
the bank's worn panel. A whole tier 5 set adds about 11% (Torva with an Abyssal tentacle: 44 to
57 with the kinds' own +18%), a tier 1 set about 4%. The balance sim (BALANCE_SEEDS=8) barely
moved: only the tier 2 set's hit, 17 to 18; its sets wear little armour of their weapon's kind.
`GAME_BUILD` 141.

Version 140 (built 7 November 2026, not deployed): gear that shared its numbers is spread a
little, as the user asked (`TIE_SPREAD` in items.ts: within a group of pieces with the same
slot, tier and stats, ordered by worth, the max hit or defence moves up to 12% each way, at least
a point). Tied pieces went from 500 of 1,022 to 315; the exclusive twins still copy their
piece. GEAR-LIST.md regenerated. `GAME_BUILD` 140.

Version 139 (built 7 November 2026, not deployed): gear batch 8, as the user asked, 59 pieces of
the real combat gear the cache still had, picked by their OSRS bonuses (the new Run-Escape
`scripts/cache/dump-obj-params.ts` prints an item's params: 0–4 attack, 5–9 defence, 10 melee
strength, 11 prayer, 14 attack speed, 434/436 the first wear requirement's skill and level). See
the README's gear batches. Worn pieces exported with `player items <ids> --no-emotes`, packed with
the scratchpad's pack-player-items.mjs (vite stopped), the icon sheet rebuilt (1094 icons);
GEAR-LIST.md and GEAR-NOT-ADDED.md regenerated. `GAME_BUILD` 139.

Version 138 (built 7 November 2026, not deployed), as the user asked: every staff is a magic
weapon, the mjolnirs (hit 14), Pharaoh's sceptre (30), the Dramen staff (9), the Merfolk trident
(26) and the demonic sceptre (60) made with `staff()` where they were swung since version 110;
and the playtester crown's first character keeps their Guthix sunfire set (`PLAYTESTER_MAIN_KIT`
in kit.ts), restored and unsellable like the owner's own kit. `GAME_BUILD` 138.

Version 137 (built 7 November 2026, not deployed): characters walk 30% faster, as the user asked
(`PLAYER_SPEED` 4.2 → 5.46 tiles a second); a melee boss's chase stays at 95% of it
(`BOSS_CHASE_SPEED`), and the run clip plays 1.3 times as fast (`RUN_CLIP_SPEED` in player.ts,
for this player and for mates) so the feet keep up. `GAME_BUILD` 137.

Version 136 (built 7 November 2026, not deployed), as the user asked: every piece of gear glows
its tier's colour (`TIER_COLOURS` in items.ts: common grey, uncommon green, rare blue, epic
purple, legendary gold). In the interface `iconElement` gives gear icons a `tier-glow` drop
shadow (style.css); on the ground a coloured additive glow sits behind the icon (`glow` on a
Pickup), and the epic and legendary beams take the same colours. A right click on any item's
icon opens a menu with View stats (`showItemMenu`/`showItemStats` in ui.ts: slot, max hit,
speed, range, style, defence, armour style, hitpoints, prayer, heals, effect, special, worth);
the run's pack menu also has Drop, where a right click dropped the item straight away before.
`GAME_BUILD` 136.

Version 135 (built 7 November 2026, not deployed): party balloons sit on the ground itself
(`groundY`, the terrain's height at the spot) where `placeActor` put them on the tile's highest
corner, up to half a tile above a slope; and each has a soft shadow (`BALLOON_SHADOW`), small
while it's high and full size as it lands, gone as it floats off. Bursts sit on the ground too.
Measured in a run: every balloon's lowest point 0.05 above the terrain. `GAME_BUILD` 135.

Version 134 (built 7 November 2026, not deployed): party balloons come all the way down. The
balloon's own animation (seq 498, the "play" clip) is its fall, about seven tiles at the drawn
scale to the ground in 2.5 seconds, not a bob: looped, it kept dropping them from on high, on
top of run.ts's own fall. It now plays once (synced to the balloon's age), and run.ts's fall is
gone (`BALLOON_HEIGHT` removed, `BALLOON_FALL` 2.5). `GAME_BUILD` 134.

Version 133 (built 7 November 2026, not deployed): Save code and Load code are hidden for a
player logged in to an account (the account carries the save), as the user asked; a test
character and play on this device while the accounts can't be reached still have them.
`GAME_BUILD` 133.

Version 132 (built 7 November 2026, not deployed): the GitHub repo is public now, as the user
asked, and a GitHub button sits beside Discord's (`GITHUB_URL` in ui.ts, `button.github` in
skin.css). On a phone on its side (max-height 450px) the six buttons are a smaller row, clear
of the way in and the build line. `GAME_BUILD` 132.

Version 131 (built 7 November 2026, not deployed): a Discord button in the title screen's row of
buttons (`DISCORD_URL` in ui.ts, https://discord.gg/DcCADFqG5n, opened in a new tab), in
Discord's blurple (`button.discord` in skin.css), as the user asked. `GAME_BUILD` 131.

Version 130 (built 7 November 2026): the playtest's updates on the main site, as the user asked,
less the ways out never closing (playtest 117.2) and every item for everyone (6ad825f's kit).
Main already had every playtest change but those and the playtest's 250 of each rune, which this
brings over (`AMMO_PER_ITEM`; runes were 2000 all together). The main site is now built from
main, accounts (functions/, the production D1 `runkov-accounts`) included. `GAME_BUILD` 130.

Version 129 (built 7 November 2026; on the main site as 105.11, its runes from release's own
`ammoOfTier` there): party balloons, a random event, as the user
asked. Every three to five minutes (the first a minute or two in) six to nine of the Party Room's
balloons drift down round someone; running into one bursts it for arrows or runes, food, now and
then gear, or nothing (`updateBalloons` and friends in run.ts, `playPop` in assets.ts). Locs
115–120 and their bursts 123–128 exported from the cache and packed into public with the
scratchpad's pack-locs.mjs, and added to assets.json. Co-op: the host drops and bursts them
(`balloons`/`burst` down messages; no relay change). `GAME_BUILD` 129.

Version 128 (built 6 November 2026; on the main site as 105.10): Sanguine torva (28254, 28256, 28258) for the owner's own
first character alone, kept like the Ankou outfit (`SANGUINE_TORVA`, `OWNER_MAIN_KIT`), each the
twin of its Torva piece, as the user asked. Worn pieces packed into public with the scratchpad's
pack-player-items.mjs, the icon sheet rebuilt. `GAME_BUILD` 128.

Version 127 (built 6 November 2026; on the playtest as 117.5, and the main site as 105.9, ported
by hand there with 100 mind runes, a pack's most on that code): starter kits, as the user asked. A new character's first
screen is "Choose your style": Melee · Squire (bronze longsword and armour, wooden shield),
Ranged · Archer (shortbow, 100 bronze arrows, leather) or Magic · Apprentice (staff of air, 150
mind runes, blue wizard robes), each with shrimps, worn and packed in place of the old bronze
sword kit (`starter.ts`, the save's `pickStarter`). Older saves never see it. `GAME_BUILD` 127.

Version 126 (built 6 November 2026; on the playtest as 117.4, the main site already had it): the skull sceptre is a magic weapon, cast like the magic
staff (tier 1, max hit 10, range 6, runes or a picked spell) in place of a swung club, as the
user asked. `GAME_BUILD` 126.

Version 125 (built 6 November 2026; on the main site as 105.8, the playtest with 117.3): a finger on the world swings as it lands again, as the user
asked, not as it lifts (124's change taken back); dragging still turns the camera. `GAME_BUILD`
125.

Version 124 (built 6 November 2026; on the main site as 105.7, the playtest with 117.2): the touch camera as OSRS mobile has it, one finger dragged
on the world turning and tilting it and two pinching it, in place of 123's two-finger twist; a
tap on the world swings as the finger lifts. The middle-button drag tilts too. `GAME_BUILD` 124.

Version 123 (built 6 November 2026; on the main site as 105.6, the playtest as 117.1): the camera turns round you in a run, with a middle-button
drag on a desktop or a two-finger twist on a touch screen (README's minimap and camera lines);
the keys, the stick and the roof check turn with it. `GAME_BUILD` 123.

Version 122 (built 6 November 2026; on the main site as 105.5): a red Staff of the dead and a red
Spirit shield (magic armour) for the owner's own first character, beside the red ghostly robes
(README's two characters section): the cache's spare copies 23613 and 23599, packed to
public/assets/player/items, their icons in the sheet, added to assets.json. `GAME_BUILD` 122.

Version 121 (built 6 November 2026; on the main site with 105.4): the red ghostly robes for the
owner's own first character beside the Ankou outfit (README's two characters section): six
pieces under the cache's spare ids 27166-27172 with every player clip, packed to
public/assets/player/items, their icons in the sheet, added to assets.json. Each has its Ghostly
piece's numbers; the regular Ghostly robes are unchanged. `GAME_BUILD` 121.

Version 120 (built 6 November 2026; on the main site as 105.4): the Ankou outfit for the owner's
own first character (README's two characters section): five pieces from the cache with every
player clip, packed to public/assets/player/items, their icons in the sheet, added to assets.json.
Each has the Infinity piece's numbers. `GAME_BUILD` 120.

Version 119 (built 6 November 2026; on the main site as 105.3): Vorki, Salmon Dev's crown's own
pet (README's "pet"). NPC 8025 exported with every animation its definition has (idle 7948, 16
frames; walk 7959, 22 frames) into full-assets/npcs/8025-vorki, packed to
public/assets/npcs/8025.glb (1.2 MB), added to assets.json. Checked on the dev server: its model
and idle drawn as a pet; the owner crown's save doesn't get it. `GAME_BUILD` 119.

Version 118 (built 6 November 2026, not deployed): Yami, the owner crown's own pet (README's
"pet"). NPC 14203 exported from the cache with its idle (12140, 40 frames) and walk (12143, 20
frames) into full-assets/npcs/14203-yami and packed to public/assets/npcs/14203.glb (2.3 MB);
added to assets.json. Its buff: hits 6% harder. Checked on the dev server with the owner crown:
given on load and following, idle on the title screen, walking after the player in a run, its
buff in the run. `GAME_BUILD` 118.

Version 117 (built 6 November 2026, playtest only): Log out to switch accounts or make another
(README's "Accounts"): on the title screen and in Settings; what's changed is sent first, then
the device starts clean. Checked locally: Fish One made with 4,242 coins, logged out, Fish Two
made fresh (50 coins, its own friend code), logged out, Fish One logged in again with its 4,242.
`GAME_BUILD` 117.

Version 116 (built 6 November 2026, playtest only): accounts (README's "Accounts"). Create
account or Log in before the guild; names unique across players; the save kept with the account
in Cloudflare D1 and synced to every device logged in to it; the friend code given on the welcome
screen and the title card, made in the game from the save's key. New: `functions/api/[[path]].ts`,
`wrangler.toml` (D1 `runkov-accounts` 
d528c70c-a6fc-486b-9de7-25ac58e777a3 for the main site, `runkov-accounts-playtest`
1cfd86c2-9118-491f-8f21-c07ec9881285 for previews), `db/accounts.sql`, `src/game/account.ts`,
`src/game/friendcode.ts`. The main site's build (105.1, the `release` branch) has no functions, so
accounts there wait for a full deploy of main. Checked locally with `wrangler pages dev`: the API
(sign-up, a taken name in any case and spacing, wrong password, login, save, a stale save turned
down) and two fresh browsers (one made Salmon and changed its coins; the other logged in and had
them, and the same friend code; Log out back to the account screen). `GAME_BUILD` 116.

Version 115 (built 6 November 2026, not deployed to the main site): the rest of the menu mockups
and a friends list (README's "Card and rooms", "The war room", "Friends", "Bank & gear"). The
title screen's combat level, vault worth, last run, Loadouts, friend online with Join, servers
and players, daily contract (`contract.ts`), Solo/Party and raiders count; the war room's seats
(level, gear, food, prayer, risking, activity), heads up, loot rule with Split at the exit
(`shareCoins`), who can join, invite links (`?join=`), find a party, friends and the docked party
chat; the vault's bonuses, loadouts, hover cards, quantity, rearranging, own tabs, deposits,
value shown, pack summary and Ready · Descend. The relay (`relay/coop-relay.mjs`) gained `hello`,
`friends`, `friendCode`, `stats` and a room's `loot`, all new messages and fields, so build 105.1
on the main site works with it as before. The save gained `friendKey`, `friends`, `loadouts`,
`bankOrder`, `bankTabs`, `lastRun`, `contract` and `stats.damageTaken`/`secondsPlayed`
(`SAVE_VERSION` unchanged). Not built: Withdraw as Note (nothing in a run uses a note), Discord
(no link yet), a tasks "ready to claim" dot (tasks pay as a run ends). Checked: both layouts at
1600 by 900 and a phone's 740 by 360; two players adding each other, the title screen's Join
into a friend's party, chat both ways with the typing kept through redraws, "opened the vault",
and a split-loot run (101 coins picked up by the host: 51 and 50). `GAME_BUILD` 115.

Version 114 (built 6 November 2026, not deployed): the playtest's OSRS-styled menus and room
icons (`src/skin.css`, the "Card and rooms" title screen, now the default on a computer) and the
night torchlight (`src/game/torch.ts`) brought onto main from the playtest branch's 807a70a and
1f4398c. The playtest's every-item kit and 250 runes a kind stay on the playtest only. The title
screen's build line no longer says "playtest". `GAME_BUILD` 114.

Version 113 (built 6 November 2026, not deployed): on a computer the chat box is at the bottom
left, left of the hotbar, opening upward (README's "Chat"); a phone keeps it at the top. Only
`style.css` changed. Checked at 1600 by 900: open and folded it stays clear of the hotbar, and the
boss bar goes back to the top. `GAME_BUILD` 113.

Version 112 (built 6 November 2026, not deployed): no walking on water (README's "Water"). Run
Escape's `collision` command now also writes `overlayTextures`; the twelve maps' region.json
re-exported with it and copied to public/assets/maps (tiles unchanged). Water tiles newly made
solid: Lumbridge 4487, Varlamore 8151, Morytania 5683, Karamja 5589, Fremennik 4918, desert
2048, Kourend 141, Barrows 64. Checked headless on Lumbridge: pushed into the river from six
shore tiles the player stops on the bank, and none of 201 enemies stood on water. `GAME_BUILD`
112.

Version 111 (built 6 November 2026, not deployed): characters drawn on every graphics card
(README's "How the character is drawn"). Builds 108 and 110's cast clips put 399 to 459 morph
targets in every player piece, past WebGL2's promised 256, and on cards with no more the
character was drawn as nothing; `assets.ts` now gives each clip a geometry of its own frames
(at most 24 a piece). Checked in headless Chrome with shaders of over 240 targets refused: the
live build 110 showed only the shadow, this one the character, idle and running, and every clip's
poses match the uncut model exactly. `GAME_BUILD` 111.

Version 110 (built 6 November 2026, not deployed): what each staff casts by OSRS's rules, and
the staves' own spells (README's "What each staff casts"). Seven more player clips in Run
Escape's PLAYER_CLIPS (cast_god 811, cast_iban 708, cast_dart 1576, cast_trident 11430,
cast_shadow 9493, cast_warped 10501, cast_ayak 12397 at 16 frames): every player piece
re-exported again (public/assets/player now 1898 MB; largest file 4.6 MB). 32 spot animations,
12 sounds and the body rune (559) added to assets.json and copied in; the spell icons are the
cache's sprites 61, 60, 59, 53 and 324. Sound ids the OSRS lists give: the god spells' 1659,
1653, 1655, Magic Dart 1718 and 174, Tumeken's shadow 6410, the swamp trident's and the eye's
cast 178. The rest are the nearest OSRS spell's (trident of the seas water wave's, the
Sanguinesti blood spells', the warped and lithic sceptres earth wave's, the bone staff
Scurrius' magic). The bone staff hits anything, not only rats as in OSRS. `GAME_BUILD` 110.

Version 109 (built 6 November 2026, not deployed): hills and objects (README's "Hills and
objects"). The twelve maps' region.json re-exported with Run Escape's new `collision` command
(object boxes, blocked-ground and object bits) and copied to public/assets/maps; region.ts
opens hillsides of a quarter to three tiles of slope (not under a roof, no wall) and checks
the body's circle against each tile's box. Hills opened per map: Lumbridge 924, Barrows 1898,
Wilderness 363, desert 2335, Fremennik 4342, Karamja 390, Kourend 3479, Varlamore 3134,
Morytania 1223, God Wars 31, Prifddinas 395, Inferno 1; they don't count toward chests and
enemies, though ground they lead to does (Lumbridge +2210 tiles, Fremennik +3211). The old
region files are in the scratchpad's region-backup. `GAME_BUILD` 109.

Version 108 (built 6 November 2026, not deployed): spells cast as OSRS casts them (README's
"Casting as OSRS casts"). Five new player clips in Run Escape's PLAYER_CLIPS (cast_staff 1162,
cast_wave 1167, cast_surge 7855, cast_ancient 1978, cast_ancient_area 1979), so every player
piece was re-exported (and the gilded, Guthix sunfire and other special exports re-run after);
public/assets/player is now 1284 MB. 59 spell sounds added to assets.json and sounds.pack.
The co-op `shot`/`pshot` messages carry the spell's id (`s`). `GAME_BUILD` 108.

Version 107 (built 5 November 2026, not deployed): Ancient Magicks (README's "Ancient
Magicks"): the sixteen combat spells on the spellbook's Ancient page, OSRS's costs, effects
(smoke poison, shadow weaken, blood heal, ice freeze; bursts and barrages hit a 3x3), OSRS's
autocasting staves only. 25 more spotanims (360-391) and the cache's icons 325-340 in
`public/ui/spells/`; soul runes (566) added; `spellbook` in the save; `frz`/`wk`/`psn` on the
co-op `hit` message. `GAME_BUILD` 107.

Version 106 (built 5 November 2026, not deployed): the spellbook (README's "The spellbook";
`src/content/spells.ts`). Staves cast the standard spellbook's twenty combat spells, strike to
surge in wind, water, earth and fire, with OSRS's rune costs and spot animations (42 new
spotanims exported and packed into `public/assets/spotanims`, ids in `assets.json`); the staff's
tier is how high it casts; elemental, battle, mystic and combination staves, the Kodai wand and
the tomes give their runes. B (or the pack panel's Spellbook tab) picks a spell to autocast,
kept in the save as `autocast`. New item: wrath runes (21880, tier 5, surges' catalyst; icon in
the sheet). Runes re-tiered (the four elemental runes tier 1, chaos 2, death 3, blood 4, wrath
5), `AMMO_LIMITS.runes` 100 to 2,000, kills drop 15 to 30 elemental runes or 4 to 8 of the map's
catalyst, the shop sells elemental runes by 100/500, and the trader sells the map's catalyst
and 100 air runes. The staff special is now "Power surge". `GAME_BUILD` 106. Spell icons are
the cache's sprites in `public/ui/spells/`.

Version 36 (3 November 2026): co-op for up to four players (README's "Co-op"), with the relay
live on Fly.io (`relay/README.md`). Version 37 fixed the host being thrown back to the guild
screen when the room updated as the run loaded. Version 38 bounded the host's snapshot (nearest
36 enemies a snapshot, a tenth of a tile) and raised the relay's host allowance to 160 KB a
second, since the relay had been cutting hosts off on a roused map, which sent everyone home.
(The real cause of that was Fly's trial stopping the machine every five minutes; a card on the
account ended it.) Version 39 fixed depositing from the pack into the stash, which left an empty
stack in the stash (the count was read after the pack was emptied of it); old empty stacks are
dropped on load. Version 40: enemies' sounds fade with distance from the player (full within 7
tiles, gone at 26, `hear()` in `run.ts`), so a mate's fight across the map isn't heard; and the
guild's rooms open from the party screen, with Back returning to the party while in one.
Version 41: the pack holds eight pieces of food and sixty arrows or runes at most, a bite takes
1.8 seconds, arrows and runes cost 12 and drop one kill in ten (three to six), and a roused boss
moves nearly as fast as the player. Version 42 rebalanced gear for that: defence soaks more
(`SOAK_HALF_AT` 80 to 60 in `combat.ts`: 60 defence halves a hit), and a piercing hit gets through
half the armour instead of all of it. `scripts/balance.ts` now chews at the real pace, caps food
and plays each tier's own full set. Version 43 fixed guests being unable to ready up for a second
run: the relay resets everyone's ready at a start, but the game still thought it was ready and
dropped the next press as no change. Version 44: armour kinds (melee, ranged, magic) with the
combat triangle's defence and the weapon bonus and penalty (README's "Armour has a kind").
Version 45: only melee bosses get the chase speed, and any boss gives up thirty tiles off and
walks back to where it stood. Version 46: the food limit is fifteen, and things can be dropped
from the pack in a run (right click, or the pack's Drop switch), laid down by the host in a party.
Version 47: a boss gives up at twenty tiles, not thirty. Version 48: a melee boss gives up at
eight, and a boss only notices you from three quarters of its give-up distance. Version 49: 132
more pieces of gear (the ranged and magic progressions in full, the missing metal slots, the
end-game prizes), tiered by what OSRS asks to wear them; `GEAR-NOT-ADDED.md` lists what's
still out. Version 50 (4 November 2026, Cloudflare Pages from here on): about a hundred more
pieces, and the emotes are gone for good (every player piece exported with `--no-emotes`, the
courtyard code removed), a quarter off every piece's size. Version 51: the Santa hat is gone
(no cosmetic gear, no trims; a save that held one loses it on load), and a fourth batch of real
combat gear: Fremennik and Temple Knight sets, white, slayer helmets, every defender and metal
glove, more shields and books, jewellery, god capes, 3rd age, the god hides, more bows and
sceptres, every elemental staff, and the newer weapons. Version 52: the fifth and last gear
batch, 270 pieces, everything in the export that is real combat gear (README's "The gear" says
what it holds and what stays out); about 850 pieces in all. Version 53: the same-stat twins the
user then asked for after all (every plateskirt the game lacked, the lower Shayzien tiers, the
Proselyte tasset, Fancy boots), 33 pieces; the other left-out kinds (prayer and diary gear, skill
capes, recolours and trims) stay out. Version 54: prayer gear does something: every piece with
an OSRS prayer bonus has it (`PRAYER_BONUS` in `items.ts`, about 130 pieces), each point making
the prayer bar drain a thirtieth slower and refill a thirtieth faster; tooltips and the worn
line show it (README's protection bullet). Version 55: harder, since a map is meant to take a
few runs to beat unless you're lucky: enemies have about a fifth more hitpoints and hit a fifth
harder, bosses have a third to twice the hitpoints (600 / 980 / 1300 / 2500 / 4000 by tier,
from 299 / 598 / 966 / 1403 / 1955) and hit harder (18 / 25 / 29 / 45 / 60), so in the sim a
tier's own full set beats its boss about one run in three on all its food, and the tier below's
set never does (README's "Balance"; `BALANCE_SEEDS=12` gives the sim a steadier read). Version
56: the phone controls laid out again (README's "On a phone or tablet"): one big button under the
right thumb that says what it does (Open, Dig, Escape...), Eat, Pray and Spec in an arc above it,
Pray held opening a fan of protections, Pack and Pause under the minimap, the potion slots alone
in the hotbar, a resting ring for the stick (and a setting to keep it there), red edges and a
ring on Eat when hitpoints are low, a buzz on big hits, and a ring under the enemy being hit.
Version 57: bosses hit for less (16 / 22 / 26 / 39 / 52 by tier, from 18 / 25 / 29 / 45 / 60)
and their rolls lean low (`bossRoll` in `combat.ts`: the lower of two, so the max is rare and the
usual hit two thirds of it); in the sim a tier's own set now beats its boss about four runs in
five on all its food (README's "Balance"). Version 58: co-op is servers, not codes: the Co-op
screen lists every public server (name, host, map, players), joined with one press; hosting makes
a public server by default, or a private one, which stays off the list and takes its code only;
the host switches between the two until the run starts (README's "Co-op"). The relay already
had all of it (open rooms, the list), so only the game changed. Version 59: ammunition in kinds,
and ranged and magic filled out. Eight kinds of arrow (bronze to dragon) and eight of rune (mind
to blood), each of a tier with a power: a bow or staff hits its max with the best kind of its
own tier, more with better and less with worse, and shoots the best kind packed (`AMMO`,
`MATCH_POWER` in `items.ts`, `ammoScale` in `combat.ts`); each shot looks like its kind; enemies
drop their map's tier, the shop sells each kind once a map of its tier is open, the trader the
map's own; the pack holds sixty arrows and sixty runes of every kind together; an old save's
arrows and runes are the bronze and mind kinds. A seventh gear batch, 85 pieces: every dart,
knife and throwing axe, Morrigan's javelin and axe, chinchompas (a burst takes half off what's
beside the target), salamanders, the phoenix crossbow, wands, plain staves and sceptres, and the
magic robes the game lacked (README's "The gear" says what, and why melee still has about twice
as many). The balance sim is unchanged (its sets use their own tier's ammunition, so a scale of
one). Version 60: the moderator's crown, a gold crown with an M by the maker's name in co-op
party lists, for the browser that holds the key (README's "Co-op", `crown.ts`). Version 61: the
crown over the maker's head in a run too (over the name, for the others), by their name on the
title screen, and a notice when a browser takes the key, so it's plain which browser holds it;
the crown link with `&home` keeps the key in the address, for a phone's home-screen icon (its
storage is apart from the browser's). Version 62: on a phone the guild's screens scroll from a
drag on anything, items included: the panels in them were scroll boxes of their own (taking the
drag and moving nothing), so only a touch on the gaps between things moved the screen; now the
screen is the one scroller, and the pause pages in a run the same (README's "On a phone or
tablet"). Version 63: the way out is Clan Wars' Free-for-all portal, a white swirl spinning
between two stone pillars (loc 26645, `EXIT_LOC` in `run.ts`), in place of the trapdoor; Run
Escape's scenery exporter now carries an object's own animation as a "play" clip (the lobby's
Clan Wars portal, 29667, a low yellow vortex, is in the assets too, unused). Version 64: the
crown is the grey owner's crown with a blue jewel and O from an RSPS forum crown pack
(`public/ui/mod-crown.png`), a little smaller over the head, with "Owner" under it in the
jewel's blue (one sprite drawn into a canvas, `crownSprite()` in `crown.ts`). Version 65: a
second crown for the playtester, the pack's grey mod crown with a green jewel and its M redrawn
as an S (`public/ui/dev-crown.png`), with "Salmon Dev" under it in the letter's green; the
crowns are a table by key hash in `crown.ts`, so each key draws its own. Version 66: the pack
holds 150 arrows and 100 runes (`AMMO_LIMITS` in `items.ts`, one limit a kind in place of sixty
for both), and a kill drops arrows or runes one time in four instead of ten
(`AMMO_DROP_CHANCE` in `run.ts`). Version 67: the pet that follows gives a small gift of its
boss's, one each (`PET_BUFFS` in `pets.ts`, README's pets bullet lists the twelve; `run.ts`
applies them, the Tasks screen and the title screen say which). Version 68: every map is Run
Escape's whole arena (3 by 3 map squares for most, 3 by 4 for Lumbridge; before, 2 by 2 round
the spawn, and one square for Kourend, Varlamore and Prifddinas), exported one file per square
(the exporter's `--tiles`) and loaded a square at a time, nearest the player first
(`mapload.ts`; README's "The maps"); the way out's closing time grows with the map's area
(`closeSeconds` in `run.ts`). Version 69: four ways out a map instead of one (`EXIT_COUNT` in
`run.ts`), each a good walk from the spawn and kept a third of the map's longer side from the
others where the ground allows (`EXIT_SPREAD_SHARE`, halved until a spot is found); any of them
escapes, each shows green on the minimap once seen, the opening message and the boss's death
point at the nearest, and the host sends them all to guests (`exits` in the `world` message).
Version 70: a genie (NPC 326) two tiles from the spawn grants a wish out of the map for coins,
at once and without waking anything (`FERRY_NPC`, `ferryFee` in `run.ts`: 150 coins at one star,
2.2 times more a tier; the host sends him as `ferry` in the `world` message); nothing once the
ways out have closed. Version 71: coins can be packed for a run. The stash screen's Coins section
(and a Coins row at the head of the stash) moves a typed amount, or all, between the bank
(`save.coins`) and a coins stack (item 995) in the backpack; `packUp` in `main.ts` turns the stack
into the run's starting purse (`broughtCoins`, taken off the best haul), and an escape banks the
purse as before. Version 72: two co-op fixes. A player's gear swap in a run now reaches the
party (a `gear` message up from a guest, passed down by the host; `Mate.wear` in `mates.ts`
rebuilds the look, swing and stance), where before a mate was drawn in the gear they joined with
for the whole run. And mates' pets are drawn now: `Mate` creates the loadout's pet and walks it
after them in each browser (no network traffic; it may clip a wall), where before only your own
pet was ever made. Version 73: a crowned browser (the owner's or the playtester's key) picks a
colour for the character's name on the Character screen (`NAME_COLORS` in `crown.ts`, ten
swatches, yellow the default); it's kept in `character.nameColor`, travels with the loadout, and
is drawn on the title screen, in party rows, the HUD's party list and over the head in a run, in
every browser only after that player's crown key has checked out (`nameColorOf`). Version 74: the
relay's made-up names ("Mighty Miner") are shown nowhere: party rows, the HUD and over-head
labels use the character's name alone (`heroName` in `ui.ts`, "Adventurer" for a player with no
loadout), the "You're X here" line is gone, and the relay names a room for its host's character
("Cody's server") and lists the host by it (`characterName` in `relay/coop-relay.mjs`, so the
relay needs deploying too). Version 75: forty more tasks (sixty in all; README's Tasks bullet
lists them). The run's report grew for them (`RunReport`: hits taken, chests opened, the golden
chest, potions drunk, specials used, trader buys, the genie, seconds left, party size). Version
76: in co-op a fallen player is down for a minute while anyone else stands, and a mate holding E
beside them for four seconds revives them at 30% hitpoints (README's "Down, not dead"); a dead
player's body now stays lying on the map for the whole party, where before it was removed the
moment their death was announced. A guest still down when the host's run ends counts as dead.
Only the game changed (the relay passes the new `revive` message on like any other). Version
77: more chests on the maps that had few for their size, and every map's chests spread apart
(README's "A map holds a crowd" paragraph has the counts). Version 78, balance: the genie takes
only coins found in the run and his wish no longer counts for the fastest escape or the no food,
no kills, no hits and last minute tasks; enemies go by walkable ground (40 to 200 a map, about ten
a thousand tiles); a co-op fall's revive window halves with each fall (60, 30, 15 seconds) and the
party boss gains three quarters more hitpoints a player, from half; chest purses 60 to 150 (golden
chest 150 to 300, vault 200 to 400); boss hitpoints scaled per map to even out each tier
(`BOSS_HP_SCALE`). README has the numbers. Version 79: the owner's and the playtester's crowned
browsers have a second character, a separate save switched from the title screen (README's
Co-op section, after the name colours). Version 80: the switch calls the second character "Test
character", and the owner's test character keeps a Saradomin rune set and godsword that always
comes back (`kit.ts`). Version 81: two handers held as OSRS holds them (godswords, mauls and
heavy two handers, the bulwark, spears and halberds; README's "How the character is drawn"), with
every player piece exported again with eight more clips (`full-assets/player`; the old export is
in `full-assets/player-before-v81`, safe to delete), and a look plays its stance from the start.
Version 82: both crowned test characters keep every item in the game in the stash for good
(README's two characters paragraph). Version 83: the 18 gilded pieces for the owner's test
character alone, at the head of its stash (worn models and icons added to the assets; README's
two characters paragraph). Version 84: the gilded armour has Zamorak's red trim (worn pieces and
icons exported again with `--retint 6057:937`). Version 85: the gilded scimitar is the Zamorak
ornamented rune scimitar's model with a gilded blade (`--like 12389:23334 --recolor 36133:7114`).
Version 86: the gilded scimitar's blade has a red edge (`--edge 37090,37157:36133:937` added).
Version 87: the gilded armour in iron's colours with the Zamorak red trim kept (README's gilded
paragraph has the export options), with the recolour order fixed so the shoulder pads are grey
with a red trim rather than solid red. Version 88: the gilded weapons match, iron with Zamorak red
(README's gilded paragraph). Version 89: Salmon Dev's test character gets an iron and Guthix green
Sunfire fanatic set of its own (README's two characters section). Version 90: item icons come
already lightened in a second sheet, `items-lit.png` (`scripts/icon-sheet.mjs` writes both), in
place of index.html's live SVG filter, which Safari drew some icons through as plain white
shapes; the filter is kept only for the fallback icons when the sheet never loads, and items on
the ground still use the unlightened `items.png`. Version 91: a full map in every run (M, the
minimap or a phone's Map button), dragged and zoomed, unwalked ground dimmed (README's full map
bullet). Version 92: the stash is a bank, a grid of icons in tabs with a search, the picked thing
shown under it to wear or pack, and Deposit pack and Deposit worn (README's Bank & gear bullet).
Version 93: chickens and imps are passive, fighting only once hit, and the weapon's own swings
leave them be (README's passive bullet). Version 94: trees and bushes are no longer safe spots;
canopies are see-through, enemies step off them and walk straight in when nothing's in the way
(README's safe spots bullet). Version 95: every clue scroll in the pack has its own dig spot
(there was one per run, so with two, solving one left the other with nothing to dig); reading
lists each, the nearest first. Version 96: a Hotbar size slider in Settings (1 to 2.5 times; until
it's set, bigger on a screen over 800 pixels high), with the prompt and the messages kept clear
of it. Version 97: the end of a run's screen sits in a darker box, drawn 1.4 times bigger on a
screen at least 1200 by 900, 1.75 at 1700 by 1250 and 2.2 at 2300 by 1600 (style.css's
.summary-box); it scrolls from its top when taller than the screen. Version 98: a click or a tap
on the world swings again (the HUD layer had taken every click since `#ui > *` gave it pointer
events, so only Space swung, and passive imps and chickens couldn't be fought by mouse or touch);
the run listens for pointerdown, and a press while the weapon recovers waits 0.6 s for it. On a
phone on its side Pack, Map and Pause sit in a row beside the minimap (under it they ran into
Spec and Pray), a screen under 330 high gets smaller buttons, and the hotbar is capped at 1.4.
Version 99: no SVG filter anywhere; icons.ts lifts items.png in a canvas for the interface (the
same pixels as items-lit.png, which is now only fetched if the canvas can't), and lifts each
fallback icon's own file the same way. Some icons showed as plain white shapes, which only the
old filter on the fallback icons could do (Safari's engine). Version 100: a stack on the ground
gives what fits and leaves the rest (it was all or nothing, so 14 food turned down a stack of
2); a guest asks the host for `n`, and `taken` carries `n` and `left` for everyone else.
Version 101: save codes are DX2, the stash and pack as bare ids, deflated, in URL-safe base64
(a 48-stack bank's code from 2,315 characters to about 730); DX1 codes still load, and a
browser without CompressionStream still writes DX1. Save code opens a box with the code and a
Copy button (the clipboard, or the old select-and-copy) in place of the browser's prompt, and
Load code says a code may have been cut short. Version 102: the bank moves any amount of a
thing either way, as coins: a How many box, 1/5/10/100 and All, and Pack N and Bank N buttons
capped by the food and ammunition limits and the pack's free slots; a packed stack of more
than one opens those instead of going back whole. Version 103: a protection prayer switched on
plays the client's sound (2676 melee, 2677 missiles, 2675 magic, ids from the OSRS wiki's sound
files) and shows its overhead icon (the cache's headicons_prayer frames 0 to 2, exported with
Run Escape's new scripts/cache/export-sprites.ts into public/ui/headicons), over this player
and over every mate: a guest's move carries `p`, a snapshot's hero state a tenth element.
Version 104: the owner's crown is dark grey with a red jewel and O (`public/ui/owner-crown.png`:
the pack's grey one with blue, each blue pixel made the red of the same shade the pack's gold
crown with red uses), and "Owner" under it is red (#e01b1b).
Version 105: a chat box at the top (ui/chat.ts), folding to a bar: the run's own messages (no
longer at the bottom left) and, in a co-op room, the party's chat in the lobby and the run.
Enter opens it to type, Esc leaves it without pausing. The relay passes `chat` to everyone in
the room, the sayer too, naming who said it itself, one line of at most 120 characters with
control, hidden and backwards-text characters taken out, five at once then one every 1.5
seconds. Lines are drawn as text only. The relay needs deploying for chat to work.

Version 35 (3 November 2026): food prices up another 250% (shrimps 105, shark 7,875).

Version 34 (3 November 2026): what you escape with stays in your pack (the stash screen puts it
away), and the boss's golden chest is locked until the boss drops its key, which it does every
time.

Version 33 (3 November 2026) shipped the balance changes made while co-op was being written: no
gear better than the map's tier from anything on it, the Santa hat one legendary roll in five
hundred, the boss's ring of flame gone (the boss never gives up the chase instead), bosses with
15% more hitpoints, food half again as dear, and a fresh start for everyone (save version 3).

Version 20 shipped the harder game, the two title screen layouts and the three investigated
fixes; README.md's "How it plays" and "The guild" describe all of it. New fixes found later go here.
