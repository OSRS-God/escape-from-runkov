// The Depths' caves: a cave laid out new from the run's seed every run, from rooms
// made in the cache's own map format and drawn by the same exporter as the
// real maps (Run-Escape's scripts/cache/cave-rooms.ts and export-assets.ts
// caves): every room is a map square, with doors in the middle of some of
// its sides, so rooms side by side meet at their doors. A room in every cell
// of a grid of six by five, the user asked: the biggest map there is, in
// ground to walk on as well as across (Lumbridge, the biggest before, has
// 37,502 tiles open; thirty rooms have about 62,000). A co-op party lays out
// the same cave from the same seed.
import * as THREE from "three";

import { loadModel } from "./assets";
import { Rng, makeRng } from "./dungeon";
import { MapLoad } from "./mapload";
import { assetUrl } from "./paths";
import { Region, RegionJson } from "./region";

const NORTH = 1;
const EAST = 2;
const SOUTH = 4;
const WEST = 8;

// A set of rooms to lay a map out from (version 163): its folder under
// assets and the index in it (<dir>/<dir>.json), the grid of cells, and the
// room for a cell growing missed. The Depths' caves, a grid of six by five;
// the Forgotten Castle's rooms (Run-Escape's castle-rooms.ts), five by five,
// 40 OSRS chunks a side as the user asked, whose empty room draws nothing.
export type RoomSet = { dir: string; cellsX: number; cellsY: number; empty: string };
export const CAVE_ROOMS: RoomSet = { dir: "caves", cellsX: 6, cellsY: 5, empty: "cave_0_rock" };
export const CASTLE_ROOMS: RoomSet = { dir: "castles", cellsX: 5, cellsY: 5, empty: "castle_0_void" };
// Of the cells next to each other that both have rooms but aren't joined,
// this share are joined too, so the cave has loops and not only dead ends
const LOOP_SHARE = 0.25;
// A new room grows off the last one added this often (else off any), for
// long ways through rather than a blob
const BRANCH_ON = 0.55;
// Where the cave is, in world tiles: past anywhere real
const BASE_X = 6400;
const BASE_Y = 6400;
// The rooms round the start load before the run begins
const NEAR = 1;
const AT_ONCE = 3;

type CaveRoomJson = {
    name: string;
    doors: number;
    kind: string;
    tiles: number[];
    heights: number[];
    boxes: number[];
    // What glows in it (version 165): x, y in the room's tiles and a kind
    // (0 a fire, torch or candles, 1 glowing fungus, 2 crystal)
    lights?: [number, number, number][];
};

type CavesJson = { size: number; doorFrom: number; doorWidth: number; rooms: CaveRoomJson[] };

// A lair's doorways (version 159): the way in at each of a room's doors,
// this many tiles in from its edge, and this many either side of the door
const DOORWAY_DEPTH = 3;
const DOORWAY_SPLAY = 3;
// The least between two of a room's fires that are both lit, in tiles
const LIGHT_APART = 6;
// Which kinds of room a cell wants, by how deep in it is (version 179, as
// the user asked for better laid out maps): the way in plain, the far end
// and the dead ends lairs and camps; the castle's halls and courts by the
// gate, its quarters, library and chapel within, its dungeons deepest. A
// cell is "near" within ZONE_NEAR rooms of the start, "deep" past
// ZONE_DEEP_SHARE of the deepest or at a dead end; one in ZONE_ANY ignores
// the zoning, so no two caves feel the same
const ROOM_ZONES: Record<string, { near: string[]; mid: string[]; deep: string[] }> = {
    caves: { near: ["plain", "pillars"], mid: ["plain", "pillars", "camp"], deep: ["lair", "camp"] },
    castles: { near: ["hall", "court"], mid: ["quarters", "library", "chapel", "hall"], deep: ["dungeon", "chapel"] },
};
const ZONE_NEAR = 1;
const ZONE_DEEP_SHARE = 0.6;
const ZONE_ANY = 0.2;

const roomsJson = new Map<string, Promise<CavesJson>>();

function loadRooms(set: RoomSet): Promise<CavesJson> {
    let loading = roomsJson.get(set.dir);
    if (!loading) {
        loading = fetch(assetUrl(`assets/${set.dir}/${set.dir}.json`)).then((r) => {
            if (!r.ok) {
                throw new Error(`No rooms (assets/${set.dir}/${set.dir}.json)`);
            }
            return r.json() as Promise<CavesJson>;
        });
        roomsJson.set(set.dir, loading);
    }
    return loading;
}

export type CaveLayout = {
    region: Region;
    // Which room is in each cell, x + y * cellsX (the set's empty room's
    // name where there's none), and how many cells across
    cells: string[];
    cellsX: number;
    empty: string;
    // Every room's lights, where they are in the scene
    lights: { x: number; z: number; kind: number }[];
    start: number;
    // Each cell's doors (NORTH 1, EAST 2, SOUTH 4, WEST 8; 0 where there's
    // no room), how many rooms it is from the start (-1 where there's
    // none), and the deepest (version 179)
    doors: number[];
    depth: number[];
    maxDepth: number;
    // The rooms' models, the start's first, each with its cell
    load(onPart: (part: THREE.Object3D, cell: number) => void): MapLoad;
    // The cell a scene position is in, -1 off the cave
    cellAt(x: number, z: number): number;
    // A room's doorways: the open tiles (the region's indices) of the way
    // in at each of its doors, to shut a lair with
    doorways(cell: number): number[];
    // One door's: the open tiles of its first `rows` in from the room's
    // edge, and the middle of the doorway on the edge, with which way
    // something across it faces (version 179: a web, a gate)
    doorway(cell: number, door: number, rows?: number): number[];
    doorAt(cell: number, door: number): { x: number; z: number; rotation: number };
};

export const DOOR_NORTH = NORTH;
export const DOOR_EAST = EAST;
export const DOOR_SOUTH = SOUTH;
export const DOOR_WEST = WEST;
export const DOOR_BITS = [NORTH, EAST, SOUTH, WEST];

// How many rooms each cell is from the start, by their doors
function depthsFrom(doors: number[], start: number, cellsX: number): number[] {
    const depth = new Array<number>(doors.length).fill(-1);
    depth[start] = 0;
    const queue = [start];
    while (queue.length > 0) {
        const c = queue.shift()!;
        const x = c % cellsX;
        const y = Math.floor(c / cellsX);
        for (const [bit, dx, dy] of [
            [NORTH, 0, 1],
            [EAST, 1, 0],
            [SOUTH, 0, -1],
            [WEST, -1, 0],
        ]) {
            const n = x + dx + (y + dy) * cellsX;
            if ((doors[c] & bit) !== 0 && x + dx >= 0 && x + dx < cellsX && n >= 0 && n < doors.length && depth[n] < 0) {
                depth[n] = depth[c] + 1;
                queue.push(n);
            }
        }
    }
    return depth;
}

// Which cells have rooms, and how they're joined: a room grown off the
// start, then off the others, to every cell, and loops added
function growCave(rng: Rng, set: RoomSet): { doors: number[]; start: number } {
    const CELLS_X = set.cellsX;
    const CELLS_Y = set.cellsY;
    const ROOMS = CELLS_X * CELLS_Y;
    const doors = new Array<number>(CELLS_X * CELLS_Y).fill(-1);
    // The start on the cave's south edge, as you come down into it
    const start = Math.floor(rng() * CELLS_X);
    doors[start] = 0;
    const order = [start];
    const step = [
        [0, 1, NORTH, SOUTH],
        [1, 0, EAST, WEST],
        [0, -1, SOUTH, NORTH],
        [-1, 0, WEST, EAST],
    ];
    const free = (c: number) => {
        const x = c % CELLS_X;
        const y = Math.floor(c / CELLS_X);
        return step
            .map(([dx, dy, out, back]) => ({ to: x + dx + (y + dy) * CELLS_X, ok: x + dx >= 0 && y + dy >= 0 && x + dx < CELLS_X && y + dy < CELLS_Y, out, back }))
            .filter((s) => s.ok && doors[s.to] === -1);
    };
    while (order.length < ROOMS) {
        const from = rng() < BRANCH_ON ? order[order.length - 1] : order[Math.floor(rng() * order.length)];
        const ways = free(from);
        if (ways.length === 0) {
            // A dead end: grow off any room that still can
            const any = order.filter((c) => free(c).length > 0);
            if (any.length === 0) {
                break;
            }
            const c = any[Math.floor(rng() * any.length)];
            const w = free(c)[Math.floor(rng() * free(c).length)];
            doors[c] |= w.out;
            doors[w.to] = w.back;
            order.push(w.to);
            continue;
        }
        const w = ways[Math.floor(rng() * ways.length)];
        doors[from] |= w.out;
        doors[w.to] = w.back;
        order.push(w.to);
    }
    // Loops, between rooms side by side
    for (const c of order) {
        const x = c % CELLS_X;
        const y = Math.floor(c / CELLS_X);
        for (const [dx, dy, out, back] of [step[0], step[1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= CELLS_X || ny >= CELLS_Y) {
                continue;
            }
            const n = nx + ny * CELLS_X;
            if (doors[n] > 0 && (doors[c] & out) === 0 && rng() < LOOP_SHARE) {
                doors[c] |= out;
                doors[n] |= back;
            }
        }
    }
    return { doors, start };
}

export async function layoutCave(id: string, name: string, seed: number, set: RoomSet = CAVE_ROOMS): Promise<CaveLayout> {
    const CELLS_X = set.cellsX;
    const CELLS_Y = set.cellsY;
    const caves = await loadRooms(set);
    const size = caves.size;
    // Its own roll, so the run's other rolls stay as they were
    const rng = makeRng(seed ^ 0x5eedcafe);
    const { doors, start } = growCave(rng, set);
    const byDoors = new Map<number, CaveRoomJson[]>();
    for (const room of caves.rooms) {
        const list = byDoors.get(room.doors) ?? [];
        list.push(room);
        byDoors.set(room.doors, list);
    }
    // The empty room: solid all over (the castle's draws nothing, and isn't
    // in its index)
    const rock: CaveRoomJson = byDoors.get(0)?.[0] ?? {
        name: set.empty,
        doors: 0,
        kind: "empty",
        tiles: new Array<number>(size * size).fill(1),
        heights: new Array<number>((size + 1) * (size + 1)).fill(0),
        boxes: [],
    };
    const drawn = (room: string) => room !== set.empty || byDoors.has(0);
    // Each cell's room: one with its doors, of a kind its depth wants
    const depth = depthsFrom(doors, start, CELLS_X);
    const maxDepth = Math.max(0, ...depth);
    const zones = ROOM_ZONES[set.dir];
    const deadEnd = (d: number) => d === NORTH || d === EAST || d === SOUTH || d === WEST;
    const cells = doors.map((d, c) => {
        if (d <= 0) {
            return rock;
        }
        let choices = byDoors.get(d)!;
        if (zones && rng() >= ZONE_ANY) {
            const wanted = depth[c] <= ZONE_NEAR ? zones.near : deadEnd(d) || depth[c] >= maxDepth * ZONE_DEEP_SHARE ? zones.deep : zones.mid;
            const zoned = choices.filter((room) => wanted.includes(room.kind));
            if (zoned.length > 0) {
                choices = zoned;
            }
        }
        return choices[Math.floor(rng() * choices.length)];
    });

    const sizeX = CELLS_X * size;
    const sizeY = CELLS_Y * size;
    const tiles = new Array<number>(sizeX * sizeY).fill(1);
    const heights = new Array<number>((sizeX + 1) * (sizeY + 1)).fill(0);
    const boxes: number[] = [];
    cells.forEach((room, c) => {
        const ox = (c % CELLS_X) * size;
        const oy = Math.floor(c / CELLS_X) * size;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                tiles[ox + x + (oy + y) * sizeX] = room.tiles[x + y * size];
            }
        }
        for (let y = 0; y <= size; y++) {
            for (let x = 0; x <= size; x++) {
                heights[ox + x + (oy + y) * (sizeX + 1)] = room.heights[x + y * (size + 1)];
            }
        }
        for (let k = 0; k + 4 < room.boxes.length; k += 5) {
            const i = room.boxes[k];
            boxes.push(ox + (i % size) + (oy + Math.floor(i / size)) * sizeX, ...room.boxes.slice(k + 1, k + 5));
        }
    });
    // The start: the open tile nearest its room's middle
    const sx = (start % CELLS_X) * size;
    const sy = Math.floor(start / CELLS_X) * size;
    let spawn = { x: BASE_X + sx + size / 2, y: BASE_Y + sy + size / 2 };
    let nearest = Infinity;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if ((tiles[sx + x + (sy + y) * sizeX] & 1) === 0) {
                const d = Math.hypot(x - size / 2, y - size / 2);
                if (d < nearest) {
                    nearest = d;
                    spawn = { x: BASE_X + sx + x + 0.5, y: BASE_Y + sy + y + 0.5 };
                }
            }
        }
    }
    const json: RegionJson = {
        id,
        name,
        baseX: BASE_X,
        baseY: BASE_Y,
        sizeX,
        sizeY,
        plane: 0,
        spawn,
        tiles,
        heights,
        tileFlags: new Array<number>(sizeX * sizeY).fill(0),
        boxes,
    };
    const region = new Region(json);
    const names = cells.map((room) => room.name);
    // (a room's fires no closer than LIGHT_APART to each other: a castle
    // room has thirty candles and torches, and all of them lit left no dark)
    const lights = cells.flatMap((room, c) => {
        const kept: [number, number, number][] = [];
        for (const light of room.lights ?? []) {
            if (light[2] !== 0 || kept.every((k) => k[2] !== 0 || Math.hypot(k[0] - light[0], k[1] - light[1]) >= LIGHT_APART)) {
                kept.push(light);
            }
        }
        return kept.map(([lx, ly, kind]) => ({
            x: BASE_X + (c % CELLS_X) * size + lx,
            z: -(BASE_Y + Math.floor(c / CELLS_X) * size + ly),
            kind,
        }));
    });

    const load = (onPart: (part: THREE.Object3D, cell: number) => void): MapLoad => {
        let cancelled = false;
        const startX = start % CELLS_X;
        const startY = Math.floor(start / CELLS_X);
        const byDistance = names
            .map((n, c) => ({ n, c, d: Math.max(Math.abs((c % CELLS_X) - startX), Math.abs(Math.floor(c / CELLS_X) - startY)) }))
            .filter((s) => drawn(s.n))
            .sort((a, b) => a.d - b.d);
        const place = async ({ n, c }: { n: string; c: number }) => {
            const gltf = await loadModel(assetUrl(`assets/${set.dir}/${n}.glb`));
            if (cancelled) {
                return;
            }
            // The same room can be in the cave more than once (the rock is)
            const part = gltf.scene.clone();
            part.position.set(BASE_X + (c % CELLS_X) * size, 0, -(BASE_Y + Math.floor(c / CELLS_X) * size));
            onPart(part, c);
        };
        const near = Promise.all(byDistance.filter((s) => s.d <= NEAR).map(place)).then(() => undefined);
        const queue = byDistance.filter((s) => s.d > NEAR);
        const all = near.then(async () => {
            const worker = async () => {
                while (queue.length > 0 && !cancelled) {
                    await place(queue.shift()!);
                }
            };
            await Promise.all(Array.from({ length: AT_ONCE }, worker));
        });
        return {
            near,
            all,
            cancel: () => {
                cancelled = true;
            },
        };
    };
    const cellAt = (x: number, z: number): number => {
        const cx = Math.floor((region.tileX(x) - BASE_X) / size);
        const cy = Math.floor((region.tileY(z) - BASE_Y) / size);
        return cx < 0 || cy < 0 || cx >= CELLS_X || cy >= CELLS_Y ? -1 : cx + cy * CELLS_X;
    };
    const doorway = (cell: number, door: number, rows = DOORWAY_DEPTH): number[] => {
        const ox = (cell % CELLS_X) * size;
        const oy = Math.floor(cell / CELLS_X) * size;
        const out: number[] = [];
        const along = [caves.doorFrom - DOORWAY_SPLAY, caves.doorFrom + caves.doorWidth + DOORWAY_SPLAY];
        const band = (x0: number, x1: number, y0: number, y1: number) => {
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const i = ox + x + (oy + y) * sizeX;
                    if ((region.tiles[i] & 1) === 0) {
                        out.push(i);
                    }
                }
            }
        };
        const d = doors[cell] & door;
        if (d & NORTH) {
            band(along[0], along[1], size - rows, size);
        }
        if (d & SOUTH) {
            band(along[0], along[1], 0, rows);
        }
        if (d & EAST) {
            band(size - rows, size, along[0], along[1]);
        }
        if (d & WEST) {
            band(0, rows, along[0], along[1]);
        }
        return out;
    };
    const doorways = (cell: number): number[] => doorway(cell, NORTH | EAST | SOUTH | WEST);
    const doorAt = (cell: number, door: number): { x: number; z: number; rotation: number } => {
        const ox = BASE_X + (cell % CELLS_X) * size;
        const oy = BASE_Y + Math.floor(cell / CELLS_X) * size;
        const mid = caves.doorFrom + caves.doorWidth / 2;
        switch (door) {
            case NORTH:
                return { x: ox + mid, z: -(oy + size), rotation: 0 };
            case SOUTH:
                return { x: ox + mid, z: -oy, rotation: 0 };
            case EAST:
                return { x: ox + size, z: -(oy + mid), rotation: Math.PI / 2 };
            default:
                return { x: ox, z: -(oy + mid), rotation: Math.PI / 2 };
        }
    };
    return { region, cells: names, cellsX: CELLS_X, empty: set.empty, lights, start, doors, depth, maxDepth, load, cellAt, doorways, doorway, doorAt };
}
