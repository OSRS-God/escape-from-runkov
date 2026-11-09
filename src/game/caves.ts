// The Depths: a cave laid out new from the run's seed every run, from rooms
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
const CELLS_X = 6;
const CELLS_Y = 5;
// Every cell (solid rock, cave_0_rock, is for a cell growing missed)
const ROOMS = CELLS_X * CELLS_Y;
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
};

type CavesJson = { size: number; rooms: CaveRoomJson[] };

let cavesJson: Promise<CavesJson> | undefined;

function loadCaves(): Promise<CavesJson> {
    cavesJson ??= fetch(assetUrl("assets/caves/caves.json")).then((r) => {
        if (!r.ok) {
            throw new Error("No cave rooms (assets/caves/caves.json)");
        }
        return r.json() as Promise<CavesJson>;
    });
    return cavesJson;
}

export type CaveLayout = {
    region: Region;
    // Which room is in each cell, x + y * CELLS_X ("" for rock)
    cells: string[];
    start: number;
    // The rooms' models, the start's first
    load(onPart: (part: THREE.Object3D) => void): MapLoad;
};

// Which cells have rooms, and how they're joined: a room grown off the
// start, then off the others, to ROOMS, and loops added
function growCave(rng: Rng): { doors: number[]; start: number } {
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

export async function layoutCave(id: string, name: string, seed: number): Promise<CaveLayout> {
    const caves = await loadCaves();
    const size = caves.size;
    // Its own roll, so the run's other rolls stay as they were
    const rng = makeRng(seed ^ 0x5eedcafe);
    const { doors, start } = growCave(rng);
    const byDoors = new Map<number, CaveRoomJson[]>();
    for (const room of caves.rooms) {
        const list = byDoors.get(room.doors) ?? [];
        list.push(room);
        byDoors.set(room.doors, list);
    }
    const rock = byDoors.get(0)![0];
    const cells = doors.map((d) => {
        if (d <= 0) {
            return rock;
        }
        const choices = byDoors.get(d)!;
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

    const load = (onPart: (part: THREE.Object3D) => void): MapLoad => {
        let cancelled = false;
        const startX = start % CELLS_X;
        const startY = Math.floor(start / CELLS_X);
        const byDistance = names
            .map((n, c) => ({ n, c, d: Math.max(Math.abs((c % CELLS_X) - startX), Math.abs(Math.floor(c / CELLS_X) - startY)) }))
            .sort((a, b) => a.d - b.d);
        const place = async ({ n, c }: { n: string; c: number }) => {
            const gltf = await loadModel(assetUrl(`assets/caves/${n}.glb`));
            if (cancelled) {
                return;
            }
            // The same room can be in the cave more than once (the rock is)
            const part = gltf.scene.clone();
            part.position.set(BASE_X + (c % CELLS_X) * size, 0, -(BASE_Y + Math.floor(c / CELLS_X) * size));
            onPart(part);
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
    return { region, cells: names, start, load };
}
