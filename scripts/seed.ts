// Fills the database with demo data: the race text corpus and a demo account. The demo account starts with no
// races, so its stats are empty until someone plays with it.
// Usage: npm run db:seed (needs DATABASE_URL, loaded from .env if present; run npm run db:migrate first).
// Add `-- --rivals` to also create five rival accounts with a race history, so a local leaderboard is not empty.
// Safe to run again: texts are upserted, and only the seed accounts (email domain below) are recreated.
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, like } from "drizzle-orm";
import pg from "pg";
import type { Locale } from "../src/i18n/locales.ts";
import { hashPassword } from "../src/lib/auth/password.ts";
import { raceResults, raceTexts, users } from "../src/lib/db-schema.ts";
import { numberRaceTexts, raceTexts as builtInTexts } from "../src/lib/race-texts.ts";

/** Reserved test domain (RFC 2606): only seed accounts use it. */
const SEED_EMAIL_DOMAIN = "demo.typestrike.test";
/** Demo account documented in the README. */
const DEMO = { username: "demo", password: "typestrike-demo" };
/** Created only with --rivals: production already has real players. */
const RIVALS = [
  { username: "Ryuji", wpm: 48 },
  { username: "Ann", wpm: 62 },
  { username: "Makoto", wpm: 85 },
  { username: "Yusuke", wpm: 55 },
  { username: "Futaba", wpm: 118 },
];
const RACES_PER_PLAYER = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

try {
  process.loadEnvFile();
} catch {
  // No .env file; rely on the environment.
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

/** Small seeded generator (mulberry32) so every run creates the same history. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(2026);
const between = (min: number, max: number) => min + random() * (max - min);

function lobbyCode(): string {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join("");
}

/** A player's past races: speed improves slowly over the last month, with some noise. */
function history(userId: string, baseWpm: number, now: number): (typeof raceResults.$inferInsert)[] {
  return Array.from({ length: RACES_PER_PLAYER }, (_, index) => {
    const racerCount = Math.floor(between(2, 7));
    const place = Math.floor(between(1, racerCount + 1));
    const progress = index / (RACES_PER_PLAYER - 1);
    const wpm = Math.round(baseWpm * (0.85 + 0.15 * progress) * between(0.92, 1.08) * 10) / 10;
    const accuracy = Math.round(between(0.88, 0.99) * 1000) / 1000;
    const characters = Math.floor(between(140, 220));
    const durationMs = Math.round(((characters / 5) / wpm) * 60_000);
    const keystrokes = Math.round(characters / accuracy);
    return {
      userId,
      lobbyCode: lobbyCode(),
      endedAt: new Date(now - (RACES_PER_PLAYER - index) * DAY_MS * 2 + Math.floor(between(0, DAY_MS))),
      place,
      racerCount,
      wpm,
      accuracy,
      finishMs: durationMs,
      durationMs,
      keystrokes,
      mistakes: keystrokes - characters,
    };
  });
}

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

try {
  const corpus = [
    ...Object.entries(builtInTexts).flatMap(([language, texts]) =>
      texts.map((body) => ({ language: language as Locale, body, hasNumbers: false })),
    ),
    ...Object.entries(numberRaceTexts).flatMap(([language, texts]) =>
      texts.map((body) => ({ language: language as Locale, body, hasNumbers: true })),
    ),
  ];
  const insertedTexts = await db.insert(raceTexts).values(corpus).onConflictDoNothing().returning({ id: raceTexts.id });
  console.log(`race texts: ${insertedTexts.length} added, ${corpus.length - insertedTexts.length} already there`);

  await db.transaction(async (tx) => {
    // Recreate the seed accounts from scratch; their race history is deleted with them.
    await tx.delete(users).where(and(eq(users.kind, "registered"), like(users.email, `%@${SEED_EMAIL_DOMAIN}`)));

    const now = Date.now();
    const withRivals = process.argv.includes("--rivals");
    const players = [{ username: DEMO.username, wpm: null }, ...(withRivals ? RIVALS : [])];
    for (const player of players) {
      const password = player.username === DEMO.username ? DEMO.password : crypto.randomUUID();
      const [user] = await tx
        .insert(users)
        .values({
          kind: "registered",
          username: player.username,
          email: `${player.username.toLowerCase()}@${SEED_EMAIL_DOMAIN}`,
          passwordHash: await hashPassword(password),
        })
        .onConflictDoNothing()
        .returning({ id: users.id });
      if (!user) {
        // A real account already uses this name.
        if (player.username === DEMO.username) throw new Error(`username "${DEMO.username}" is taken by a real account`);
        console.log(`skipped ${player.username}: username taken`);
        continue;
      }
      if (player.wpm !== null) await tx.insert(raceResults).values(history(user.id, player.wpm, now));
    }
    console.log(`demo account: ${DEMO.username}, no races yet`);
    if (withRivals) console.log(`rivals: ${RIVALS.map((rival) => rival.username).join(", ")} (${RACES_PER_PLAYER} races each)`);
  });
  console.log(`sign in with ${DEMO.username}@${SEED_EMAIL_DOMAIN} / ${DEMO.password}`);
} finally {
  await pool.end();
}
