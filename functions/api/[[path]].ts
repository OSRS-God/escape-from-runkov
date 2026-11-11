// The account API (version 116), a Cloudflare Pages Function beside the
// game: a player makes an account with a name nobody else has and a
// password, and their save is kept with it, so logging in on another
// phone or computer brings their progress. The main site and the playtest
// each have a database of their own (wrangler.toml), so the playtest's
// every-item kit never reaches a real save.
//
//   GET  /api/name?name=   whether a name is free
//   POST /api/signup       { name, password, save }  -> { token, name, rev }
//   POST /api/login        { name, password }        -> { token, name, save, rev }
//   GET  /api/save         (Bearer token)            -> { name, save, rev }
//   PUT  /api/save         { save, rev }             -> { rev }, or 409 with the newer
//   POST /api/logout       (Bearer token)
//   GET  /api/daily?day=   the day's daily cave board -> { day, top: [{ name, score }] }
//   POST /api/daily        { day, score } (Bearer token) -> { best, rank }
//   GET  /api/abyss        the Abyss's board, deepest beaten -> { top: [{ name, score }] }
//   POST /api/abyss        { score } (Bearer token) -> { best, rank }
//   POST /api/crown        { key } (Bearer token)   -> { crown }
//
// A crown kept with its account (version 185): a browser that holds a crown
// key (crown.ts, given by a link) and is logged in to the one account that
// crown is for (CROWN_ACCOUNTS) hands the key over once, and from then on
// log in and GET /api/save give it back (`crown`) to any device logged in
// to that account. The key is only ever told to that account's sessions.
//
// The daily cave (version 161): the Depths' cave of the day, the same for
// everyone; each account's best haul escaped from it that day, today's or
// yesterday's only.
//
// Passwords are kept only as PBKDF2 hashes, a device's token only as its
// SHA-256. Wrong passwords and sign-ups are limited per name and address.

type Row = Record<string, unknown>;
interface D1Statement {
    bind(...values: unknown[]): D1Statement;
    first<T = Row>(): Promise<T | null>;
    all<T = Row>(): Promise<{ results?: T[] }>;
    run(): Promise<unknown>;
}
interface D1Database {
    prepare(sql: string): D1Statement;
    batch(statements: D1Statement[]): Promise<unknown>;
}
type Env = { DB: D1Database };
type Context = { request: Request; env: Env };

// Workers' WebCrypto does at most this many PBKDF2 rounds
const ROUNDS = 100_000;
// OSRS's names: one to twelve letters, numbers, spaces, dashes and
// underscores, starting and ending with a letter or number
const NAME = /^[A-Za-z0-9](?:[A-Za-z0-9 _-]{0,10}[A-Za-z0-9])?$/;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 128;
const MAX_SAVE_BYTES = 1_000_000;
const MAX_BODY_BYTES = MAX_SAVE_BYTES + 4096;
// A device stays logged in this long unseen
const SESSION_MS = 180 * 86_400_000;
// Wrong passwords for a name, and from an address, in this window; and
// accounts made from an address in an hour
const LOGIN_WINDOW_MS = 15 * 60_000;
// Since version 153 the tries for a name are counted per network trying it,
// so nobody can lock a player out from elsewhere; a name tried from many
// networks at once is still held to this many, but a network that hasn't
// got it wrong lately still gets its try (the player themselves, usually)
const LOGIN_TRIES_PER_NAME = 8;
const LOGIN_TRIES_PER_NAME_ALL = 100;
const LOGIN_TRIES_PER_ADDRESS = 30;
const SIGNUPS_PER_ADDRESS_PER_HOUR = 10;

const SCHEMA = [
    "CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, name TEXT NOT NULL, canon TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, hash TEXT NOT NULL, rounds INTEGER NOT NULL, created INTEGER NOT NULL, save TEXT, rev INTEGER NOT NULL DEFAULT 0, saved INTEGER)",
    "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, account INTEGER NOT NULL, created INTEGER NOT NULL, seen INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS attempts (key TEXT NOT NULL, at INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS attempts_key ON attempts (key, at)",
    "CREATE INDEX IF NOT EXISTS sessions_account ON sessions (account)",
    "CREATE TABLE IF NOT EXISTS daily (day INTEGER NOT NULL, account INTEGER NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (day, account))",
    "CREATE INDEX IF NOT EXISTS daily_board ON daily (day, score DESC)",
    "CREATE TABLE IF NOT EXISTS crowns (account INTEGER PRIMARY KEY, crown TEXT NOT NULL, key TEXT NOT NULL, at INTEGER NOT NULL)",
];
// The crowns by the SHA-256 of their keys (crown.ts CROWNS), and the
// accounts (by canon name) each may be kept with: the owner's on
// ElmoTheGod, and the developer's on Salmon Jesus, Salmon Dev's (version
// 186), as the user asked
const CROWN_HASHES: Record<string, string> = {
    "4e0f860e8d27645123e773042753a6cf8ad67908bf69c0a660d06809cbb539bd": "owner",
    // The owner's second key (version 187), kept with ElmoTheGod's row
    "85a94f7a20da34666f8c1a970848d26bf0a11c2f63d0507c62f64ed5c72ae0a0": "owner",
    "355ef517371c4a0d44209d2ec6ce627ecfed14eabc61695fc7dd94ecc07ef6ca": "developer",};
const CROWN_ACCOUNTS: Record<string, string[]> = {
    owner: ["elmothegod"],
    developer: ["salmon_jesus"],
};
const CROWN_TRIES_PER_ADDRESS = 20;
// The board's length, and the most a haul out of one cave can be worth
const DAILY_TOP = 20;
const DAILY_MAX_SCORE = 5_000_000_000;
// The Abyss's board's day in the daily table (no day of a daily cave is
// below zero), and its deepest depth (worlds.ts ABYSS_MAX)
const ABYSS_DAY = -1;
const ABYSS_MAX = 30;

// Days since 1970, by UTC: the daily cave's number
function today(): number {
    return Math.floor(Date.now() / 86_400_000);
}
let tablesMade: Promise<unknown> | undefined;

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
    });
}

const fail = (status: number, error: string) => json(status, { error });

// A name as it's shown (spaces run together) and as it's compared
function cleanName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}

function canonName(name: string): string {
    return cleanName(name).toLowerCase().replace(/[\s_-]+/g, "_");
}

function hex(bytes: ArrayBuffer | Uint8Array): string {
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(n: number): string {
    return hex(crypto.getRandomValues(new Uint8Array(n)));
}

async function sha256(text: string): Promise<string> {
    return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

async function passwordHash(password: string, salt: string, rounds: number): Promise<string> {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: rounds },
        key,
        256,
    );
    return hex(bits);
}

// The same length every time, and every character looked at
function sameText(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

async function readJson(request: Request): Promise<Row | undefined> {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
        return undefined;
    }
    try {
        const body = JSON.parse(text);
        return body && typeof body === "object" ? (body as Row) : undefined;
    } catch {
        return undefined;
    }
}

// A save as the game sends it: its JSON, an object with a version, small
// enough to keep
function cleanSave(save: unknown): string | undefined {
    if (!save || typeof save !== "object" || typeof (save as Row).version !== "number") {
        return undefined;
    }
    const text = JSON.stringify(save);
    return text.length <= MAX_SAVE_BYTES ? text : undefined;
}

function nameProblem(name: string): string | undefined {
    if (!NAME.test(name)) {
        return "A name is 1 to 12 letters, numbers, spaces, dashes or underscores, starting and ending with a letter or number.";
    }
    return undefined;
}

async function recent(db: D1Database, key: string, since: number): Promise<number> {
    const row = await db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE key = ? AND at > ?").bind(key, since).first<{ n: number }>();
    return row?.n ?? 0;
}

// Tries are noted before they're judged (version 153): checked first and
// noted after, a burst of them sent at once all passed the count. Returns
// when, so a try that came good can be taken back.
async function note(db: D1Database, ...keys: string[]): Promise<number> {
    const now = Date.now();
    await db.batch([
        ...keys.map((key) => db.prepare("INSERT INTO attempts (key, at) VALUES (?, ?)").bind(key, now)),
        db.prepare("DELETE FROM attempts WHERE at < ?").bind(now - 86_400_000),
    ]);
    return now;
}

async function unnote(db: D1Database, at: number, ...keys: string[]): Promise<void> {
    await db.batch(keys.map((key) => db.prepare("DELETE FROM attempts WHERE key = ? AND at = ?").bind(key, at)));
}

// The network an address is on, for the limits (version 153): an IPv6
// address by its /64, as one connection is given a whole /64
function networkOf(address: string): string {
    if (!address.includes(":") || address.includes(".")) {
        return address;
    }
    const [head, tail] = address.toLowerCase().split("::");
    const front = head ? head.split(":") : [];
    const back = tail !== undefined && tail !== "" ? tail.split(":") : [];
    const groups = tail === undefined ? front : [...front, ...new Array<string>(Math.max(0, 8 - front.length - back.length)).fill("0"), ...back];
    return `${groups.slice(0, 4).map((g) => g.padStart(4, "0")).join(":")}::/64`;
}

async function newSession(db: D1Database, account: number): Promise<string> {
    const token = randomHex(32);
    const now = Date.now();
    await db.batch([
        db.prepare("INSERT INTO sessions (token, account, created, seen) VALUES (?, ?, ?, ?)").bind(await sha256(token), account, now, now),
        db.prepare("DELETE FROM sessions WHERE seen < ?").bind(now - SESSION_MS),
    ]);
    return token;
}

// The account a request's token is for
async function signedIn(db: D1Database, request: Request): Promise<{ id: number; name: string; save: string | null; rev: number } | undefined> {
    const header = request.headers.get("Authorization") ?? "";
    const token = /^Bearer ([0-9a-f]{64})$/.exec(header)?.[1];
    if (!token) {
        return undefined;
    }
    const hashed = await sha256(token);
    const row = await db
        .prepare("SELECT a.id AS id, a.name AS name, a.save AS save, a.rev AS rev, s.seen AS seen FROM sessions s JOIN accounts a ON a.id = s.account WHERE s.token = ?")
        .bind(hashed)
        .first<{ id: number; name: string; save: string | null; rev: number; seen: number }>();
    if (!row || Date.now() - row.seen > SESSION_MS) {
        return undefined;
    }
    // Seen again (not every request: once an hour is enough)
    if (Date.now() - row.seen > 3_600_000) {
        await db.prepare("UPDATE sessions SET seen = ? WHERE token = ?").bind(Date.now(), hashed).run();
    }
    return row;
}

// The crown key kept with an account, if any, and only while the account's
// still one its crown may be kept with
async function crownOf(db: D1Database, account: { id: number; name: string }): Promise<string | undefined> {
    const row = await db.prepare("SELECT crown, key FROM crowns WHERE account = ?").bind(account.id).first<{ crown: string; key: string }>();
    return row && CROWN_ACCOUNTS[row.crown]?.includes(canonName(account.name)) ? row.key : undefined;
}

export async function onRequest(context: Context): Promise<Response> {
    const { request, env } = context;
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
    }
    const db = env.DB;
    if (!db) {
        return fail(503, "Accounts aren't set up on this server.");
    }
    tablesMade ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((e) => {
        tablesMade = undefined;
        throw e;
    });
    await tablesMade;
    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
    const address = networkOf(request.headers.get("CF-Connecting-IP") ?? "local");
    try {
        if (route === "name" && request.method === "GET") {
            const name = cleanName(url.searchParams.get("name") ?? "");
            const problem = nameProblem(name);
            if (problem) {
                return json(200, { free: false, why: problem });
            }
            const taken = await db.prepare("SELECT 1 AS x FROM accounts WHERE canon = ?").bind(canonName(name)).first();
            return json(200, taken ? { free: false, why: "That name is taken by another player." } : { free: true });
        }
        if (route === "signup" && request.method === "POST") {
            const body = await readJson(request);
            const name = cleanName(String(body?.name ?? ""));
            const password = String(body?.password ?? "");
            const problem = nameProblem(name);
            if (problem) {
                return fail(400, problem);
            }
            if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
                return fail(400, `A password is ${MIN_PASSWORD} to ${MAX_PASSWORD} characters.`);
            }
            const save = body?.save === undefined ? undefined : cleanSave(body.save);
            if (body?.save !== undefined && !save) {
                return fail(400, "That save can't be kept.");
            }
            // Noted first, so sign-ups sent at once count each other
            await note(db, `signup:${address}`);
            if ((await recent(db, `signup:${address}`, Date.now() - 3_600_000)) > SIGNUPS_PER_ADDRESS_PER_HOUR) {
                return fail(429, "That's a lot of new accounts from here. Try again in an hour.");
            }
            const salt = randomHex(16);
            const hash = await passwordHash(password, salt, ROUNDS);
            let id: number;
            try {
                const row = await db
                    .prepare("INSERT INTO accounts (name, canon, salt, hash, rounds, created, save, rev, saved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id")
                    .bind(name, canonName(name), salt, hash, ROUNDS, Date.now(), save ?? null, save ? 1 : 0, save ? Date.now() : null)
                    .first<{ id: number }>();
                id = row!.id;
            } catch {
                return fail(409, "That name is taken by another player.");
            }
            return json(201, { token: await newSession(db, id), name, rev: save ? 1 : 0 });
        }
        if (route === "login" && request.method === "POST") {
            const body = await readJson(request);
            const name = cleanName(String(body?.name ?? ""));
            const password = String(body?.password ?? "");
            const canon = canonName(name);
            const since = Date.now() - LOGIN_WINDOW_MS;
            const wrong = () => fail(401, "That name and password don't match an account.");
            const tooMany = () => fail(429, "Too many wrong passwords. Wait 15 minutes and try again.");
            const fromHere = `login@${address}`;
            // Not a name an account could have, or a password no account has
            // (version 153): nothing to look up, and nothing of it kept but
            // the try from here (a name of any length was kept before)
            if (nameProblem(name) || password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
                await note(db, fromHere);
                return (await recent(db, fromHere, since)) > LOGIN_TRIES_PER_ADDRESS ? tooMany() : wrong();
            }
            // This network's tries at the name, everyone's, and this
            // network's at any name: noted now, taken back if it comes good
            const mine = `login:${canon}@${address}`;
            const everyone = `login:${canon}`;
            const at = await note(db, mine, everyone, fromHere);
            const [tries, all, here] = await Promise.all([recent(db, mine, since), recent(db, everyone, since), recent(db, fromHere, since)]);
            if (tries > LOGIN_TRIES_PER_NAME || here > LOGIN_TRIES_PER_ADDRESS || (all > LOGIN_TRIES_PER_NAME_ALL && tries > 1)) {
                return tooMany();
            }
            const row = await db
                .prepare("SELECT id, name, salt, hash, rounds, save, rev FROM accounts WHERE canon = ?")
                .bind(canon)
                .first<{ id: number; name: string; salt: string; hash: string; rounds: number; save: string | null; rev: number }>();
            // A name nobody has costs the same as a wrong password
            const hash = await passwordHash(password, row?.salt ?? "nobody", row?.rounds ?? ROUNDS);
            if (!row || !sameText(hash, row.hash)) {
                return wrong();
            }
            await unnote(db, at, mine, everyone, fromHere);
            return json(200, {
                token: await newSession(db, row.id),
                name: row.name,
                save: row.save ? JSON.parse(row.save) : null,
                rev: row.rev,
                crown: await crownOf(db, row),
            });
        }
        if (route === "save") {
            const account = await signedIn(db, request);
            if (!account) {
                return fail(401, "Log in again: this device isn't logged in.");
            }
            if (request.method === "GET") {
                return json(200, { name: account.name, save: account.save ? JSON.parse(account.save) : null, rev: account.rev, crown: await crownOf(db, account) });
            }
            if (request.method === "PUT") {
                const body = await readJson(request);
                const save = cleanSave(body?.save);
                if (!save) {
                    return fail(400, "That save can't be kept.");
                }
                // Written over only from what was seen last: another device's
                // newer save comes back instead
                const rev = Number(body?.rev);
                const done = await db
                    .prepare("UPDATE accounts SET save = ?, rev = rev + 1, saved = ? WHERE id = ? AND rev = ? RETURNING rev")
                    .bind(save, Date.now(), account.id, rev)
                    .first<{ rev: number }>();
                if (!done) {
                    const now = await db.prepare("SELECT save, rev FROM accounts WHERE id = ?").bind(account.id).first<{ save: string | null; rev: number }>();
                    return json(409, { error: "This account was saved from another device.", save: now?.save ? JSON.parse(now.save) : null, rev: now?.rev ?? 0 });
                }
                return json(200, { rev: done.rev });
            }
        }
        if (route === "daily" && request.method === "GET") {
            const asked = Number(url.searchParams.get("day"));
            const day = Number.isInteger(asked) && Math.abs(asked - today()) <= 1 ? asked : today();
            const rows = await db
                .prepare("SELECT name, score FROM daily WHERE day = ? ORDER BY score DESC, at ASC LIMIT ?")
                .bind(day, DAILY_TOP)
                .all<{ name: string; score: number }>();
            return json(200, { day, top: rows.results ?? [] });
        }
        if (route === "daily" && request.method === "POST") {
            const account = await signedIn(db, request);
            if (!account) {
                return fail(401, "Log in to go on the daily board.");
            }
            const body = await readJson(request);
            const day = Number(body?.day);
            const score = Math.floor(Number(body?.score));
            if (!Number.isInteger(day) || Math.abs(day - today()) > 1) {
                return fail(400, "That day's cave is closed.");
            }
            if (!Number.isFinite(score) || score < 0 || score > DAILY_MAX_SCORE) {
                return fail(400, "That isn't a haul.");
            }
            await db
                .prepare(
                    "INSERT INTO daily (day, account, name, score, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (day, account) DO UPDATE SET score = excluded.score, name = excluded.name, at = excluded.at WHERE excluded.score > daily.score",
                )
                .bind(day, account.id, account.name, score, Date.now())
                .run();
            const best = await db.prepare("SELECT score FROM daily WHERE day = ? AND account = ?").bind(day, account.id).first<{ score: number }>();
            const above = await db
                .prepare("SELECT COUNT(*) AS n FROM daily WHERE day = ? AND score > ?")
                .bind(day, best?.score ?? score)
                .first<{ n: number }>();
            return json(200, { best: best?.score ?? score, rank: (above?.n ?? 0) + 1 });
        }
        // The Abyss's board (version 172): the deepest depth past the fifth
        // each account has beaten, kept in the daily table as day ABYSS_DAY
        if (route === "abyss" && request.method === "GET") {
            const rows = await db
                .prepare("SELECT name, score FROM daily WHERE day = ? ORDER BY score DESC, at ASC LIMIT ?")
                .bind(ABYSS_DAY, DAILY_TOP)
                .all<{ name: string; score: number }>();
            return json(200, { top: rows.results ?? [] });
        }
        if (route === "abyss" && request.method === "POST") {
            const account = await signedIn(db, request);
            if (!account) {
                return fail(401, "Log in to go on the Abyss's board.");
            }
            const body = await readJson(request);
            const score = Math.floor(Number(body?.score));
            if (!Number.isFinite(score) || score < 6 || score > ABYSS_MAX) {
                return fail(400, "That isn't a depth of the Abyss.");
            }
            await db
                .prepare(
                    "INSERT INTO daily (day, account, name, score, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (day, account) DO UPDATE SET score = excluded.score, name = excluded.name, at = excluded.at WHERE excluded.score > daily.score",
                )
                .bind(ABYSS_DAY, account.id, account.name, score, Date.now())
                .run();
            const best = await db.prepare("SELECT score FROM daily WHERE day = ? AND account = ?").bind(ABYSS_DAY, account.id).first<{ score: number }>();
            const above = await db
                .prepare("SELECT COUNT(*) AS n FROM daily WHERE day = ? AND score > ?")
                .bind(ABYSS_DAY, best?.score ?? score)
                .first<{ n: number }>();
            return json(200, { best: best?.score ?? score, rank: (above?.n ?? 0) + 1 });
        }
        // A crown handed to the account it's for (version 185)
        if (route === "crown" && request.method === "POST") {
            const account = await signedIn(db, request);
            if (!account) {
                return fail(401, "Log in again: this device isn't logged in.");
            }
            const fromHere = `crown@${address}`;
            await note(db, fromHere);
            if ((await recent(db, fromHere, Date.now() - LOGIN_WINDOW_MS)) > CROWN_TRIES_PER_ADDRESS) {
                return fail(429, "Too many tries. Wait 15 minutes and try again.");
            }
            const body = await readJson(request);
            const key = String(body?.key ?? "");
            const crown = key.length > 0 && key.length <= 256 ? CROWN_HASHES[await sha256(key)] : undefined;
            if (!crown) {
                return fail(400, "That isn't a crown.");
            }
            if (!CROWN_ACCOUNTS[crown]?.includes(canonName(account.name))) {
                return fail(403, "That crown isn't this account's.");
            }
            await db
                .prepare("INSERT INTO crowns (account, crown, key, at) VALUES (?, ?, ?, ?) ON CONFLICT (account) DO UPDATE SET crown = excluded.crown, key = excluded.key, at = excluded.at")
                .bind(account.id, crown, key, Date.now())
                .run();
            return json(200, { crown });
        }
        if (route === "logout" && request.method === "POST") {
            const token = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get("Authorization") ?? "")?.[1];
            if (token) {
                await db.prepare("DELETE FROM sessions WHERE token = ?").bind(await sha256(token)).run();
            }
            return json(200, {});
        }
        return fail(404, "No such thing here.");
    } catch {
        return fail(500, "The account server had a problem. Try again in a moment.");
    }
}
