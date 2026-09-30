// Authoritative lobby and race rules. Pure functions of (state, event, now): no timers, no I/O and no
// transport, so the same rules work behind SSE today and any other transport later.
import type { Locale } from "@/i18n/locales";
import type { LobbyPhase, LobbyView, PlayerEmblem } from "@/types/lobby";
import type { InputBatch, KeyStat, RaceRacer, RaceResult, RaceView, ResultRacer, SpeedSample } from "@/types/race";
import { canStartRace } from "./lobby";
import { rankRacers } from "./results";
import {
  accuracy,
  correctPrefixLength,
  deleteChar,
  initialTypingState,
  progress,
  typeChar,
  wordsPerMinute,
  type TypingState,
} from "./typing";

export type EngineConfig = {
  /** Maximum number of players in one lobby. */
  capacity: number;
  countdownMs: number;
  /** The race ends after this long even if some racers are still typing. */
  raceTimeLimitMs: number;
  /** How long a disconnected player keeps their seat, and how long a race waits for them. */
  reconnectGraceMs: number;
  /** Typed characters per second above which input is dropped (30/s is about 360 WPM). */
  maxKeysPerSecond: number;
  /** Minimum time between two speed samples of a racer. */
  sampleIntervalMs: number;
};

export const MIN_LOBBY_CAPACITY = 2;
export const MAX_LOBBY_CAPACITY = 60;

export const defaultEngineConfig: EngineConfig = {
  capacity: 30,
  countdownMs: 3_000,
  raceTimeLimitMs: 180_000,
  reconnectGraceMs: 30_000,
  maxKeysPerSecond: 30,
  sampleIntervalMs: 1_000,
};

const MAX_EVENTS_PER_BATCH = 200;
const MAX_KEY_DELAY_MS = 2_000;
const emblems: readonly PlayerEmblem[] = ["domino", "cat", "skull", "mask"];

export type Presence = "connected" | "disconnected" | "left";

export type Member = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  isReady: boolean;
  presence: Presence;
  /** When the connection was lost; null while connected. */
  disconnectedAt: number | null;
};

type KeyTotals = { delayMs: number; timed: number; mistakes: number };

export type Racer = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  typing: TypingState;
  /** Last input batch applied. */
  inputSeq: number;
  keys: Record<string, KeyTotals>;
  samples: SpeedSample[];
};

export type Race = {
  text: string;
  startsAt: number;
  endsAt: number;
  endedAt: number | null;
  /** Everyone in the lobby when the race started, in join order. */
  racers: Racer[];
};

type ResultDetails = Pick<RaceResult, "durationMs" | "keystrokes" | "mistakes" | "speedSamples" | "keyStats">;

export type StoredResult = {
  /** Ranked, first place first. */
  racers: ResultRacer[];
  details: Record<string, ResultDetails>;
};

export type LobbyState = {
  code: string;
  locale: Locale;
  config: EngineConfig;
  phase: LobbyPhase;
  hostId: string;
  /** In join order. Players who left during a race stay (as `left`) until it ends. */
  members: Member[];
  /** Number of players who ever joined; picks the next emblem. */
  joinCount: number;
  race: Race | null;
  /** Results of the last finished race. */
  result: StoredResult | null;
};

export type LobbyError = "lobbyFull" | "raceInProgress" | "notMember" | "notHost" | "notReady" | "wrongPhase";

export type Outcome = { ok: true; state: LobbyState } | { ok: false; error: LobbyError };

export type Player = { id: string; name: string };

const ok = (state: LobbyState): Outcome => ({ ok: true, state });
const fail = (error: LobbyError): Outcome => ({ ok: false, error });

export function createLobby(input: {
  code: string;
  locale: Locale;
  host: Player;
  now: number;
  config?: Partial<EngineConfig>;
}): LobbyState {
  const config = { ...defaultEngineConfig, ...input.config };
  config.capacity = Math.min(MAX_LOBBY_CAPACITY, Math.max(MIN_LOBBY_CAPACITY, Math.floor(config.capacity)));
  return {
    code: input.code,
    locale: input.locale,
    config,
    phase: "waiting",
    hostId: input.host.id,
    members: [newMember(input.host, 0, input.now)],
    joinCount: 1,
    race: null,
    result: null,
  };
}

// A new member counts as disconnected until their page connects, so an abandoned seat is freed after the grace period.
function newMember(player: Player, joinIndex: number, now: number): Member {
  return {
    id: player.id,
    name: player.name,
    emblem: emblems[joinIndex % emblems.length],
    isReady: false,
    presence: "disconnected",
    disconnectedAt: now,
  };
}

function activeMembers(state: LobbyState): Member[] {
  return state.members.filter((member) => member.presence !== "left");
}

export function isMember(state: LobbyState, userId: string): boolean {
  return state.members.some((member) => member.id === userId && member.presence !== "left");
}

/** The host stays while present; otherwise the longest-standing active member takes over. */
function withHost(state: LobbyState): LobbyState {
  if (isMember(state, state.hostId)) return state;
  const next = activeMembers(state)[0];
  return next ? { ...state, hostId: next.id } : state;
}

/** After a race, the first lobby action brings everyone back to the waiting room. */
function reopen(state: LobbyState): LobbyState {
  if (state.phase !== "finished") return state;
  return withHost({
    ...state,
    phase: "waiting",
    race: null,
    members: activeMembers(state).map((member) => ({ ...member, isReady: false })),
  });
}

export function joinLobby(state: LobbyState, player: Player, now: number): Outcome {
  if (isMember(state, player.id)) return ok(state);
  if (state.phase === "countdown" || state.phase === "racing") return fail("raceInProgress");
  const open = reopen(state);
  if (activeMembers(open).length >= open.config.capacity) return fail("lobbyFull");
  return ok({
    ...open,
    members: [...open.members, newMember(player, open.joinCount, now)],
    joinCount: open.joinCount + 1,
  });
}

/** Leaving before a race removes the seat; leaving during one keeps the racer in the results as not finished. */
export function leaveLobby(state: LobbyState, userId: string): LobbyState {
  if (!isMember(state, userId)) return state;
  const inRace = state.phase === "countdown" || state.phase === "racing";
  const members = inRace
    ? state.members.map((member) => (member.id === userId ? { ...member, presence: "left" as const, isReady: false } : member))
    : state.members.filter((member) => member.id !== userId);
  return withHost({ ...state, members });
}

export function setReady(state: LobbyState, userId: string, isReady: boolean): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  return ok({ ...open, members: open.members.map((member) => (member.id === userId ? { ...member, isReady } : member)) });
}

export function startRace(state: LobbyState, userId: string, text: string, now: number): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  if (state.phase !== "waiting") return fail("wrongPhase");
  const players = activeMembers(state);
  if (!canStartRace(players)) return fail("notReady");

  const startsAt = now + state.config.countdownMs;
  return ok({
    ...state,
    phase: "countdown",
    race: {
      text,
      startsAt,
      endsAt: startsAt + state.config.raceTimeLimitMs,
      endedAt: null,
      racers: players.map((member) => ({
        id: member.id,
        name: member.name,
        emblem: member.emblem,
        typing: initialTypingState,
        inputSeq: 0,
        keys: {},
        samples: [],
      })),
    },
  });
}

export function setConnected(state: LobbyState, userId: string, connected: boolean, now: number): LobbyState {
  const member = state.members.find((candidate) => candidate.id === userId);
  if (!member || member.presence === "left" || (member.presence === "connected") === connected) return state;
  const updated: Member = connected
    ? { ...member, presence: "connected", disconnectedAt: null }
    : { ...member, presence: "disconnected", disconnectedAt: now };
  return { ...state, members: state.members.map((candidate) => (candidate.id === userId ? updated : candidate)) };
}

/**
 * Replays a batch of keystrokes with the shared typing rules, timed by the server clock.
 * Batches already applied, input outside the race and keystrokes above the speed limit are ignored.
 */
export function applyInput(state: LobbyState, userId: string, batch: InputBatch, now: number): LobbyState {
  const race = state.race;
  if (state.phase !== "racing" || !race || now < race.startsAt || !isMember(state, userId)) return state;
  const racer = race.racers.find((candidate) => candidate.id === userId);
  if (!racer || batch.seq <= racer.inputSeq || racer.typing.finishedAt !== null) return state;

  const keyBudget = Math.floor(((now - race.startsAt) / 1000 + 1) * state.config.maxKeysPerSecond);
  const keys = { ...racer.keys };
  let typing = racer.typing;

  for (const event of batch.events.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (event.type === "delete") {
      typing = deleteChar(typing);
      continue;
    }
    const expected = race.text[typing.typed.length];
    if (expected === undefined || typing.keystrokes >= keyBudget) break;

    const key = expected.toLowerCase();
    const totals = keys[key] ?? { delayMs: 0, timed: 0, mistakes: 0 };
    if (event.char !== expected) {
      keys[key] = { ...totals, mistakes: totals.mistakes + 1 };
    } else if (event.delayMs > 0) {
      keys[key] = { ...totals, delayMs: totals.delayMs + Math.min(event.delayMs, MAX_KEY_DELAY_MS), timed: totals.timed + 1 };
    }

    typing = typeChar(typing, race.text, event.char, now);
    if (typing.finishedAt !== null) break;
  }

  const updated: Racer = { ...racer, typing, inputSeq: batch.seq, keys, samples: withSample(racer, race, typing, now, state.config) };
  return {
    ...state,
    race: { ...race, racers: race.racers.map((candidate) => (candidate.id === userId ? updated : candidate)) },
  };
}

function withSample(racer: Racer, race: Race, typing: TypingState, now: number, config: EngineConfig): SpeedSample[] {
  const atMs = now - race.startsAt;
  const last = racer.samples.at(-1);
  const isDue = !last || atMs - last.atMs >= config.sampleIntervalMs || typing.finishedAt !== null;
  if (!isDue || typing === racer.typing) return racer.samples;
  return [...racer.samples, { atMs, wpm: wordsPerMinute(correctPrefixLength(race.text, typing.typed), atMs) }];
}

/** Applies time-based transitions: countdown end, race end and expired seats. Returns the same object when nothing changed. */
export function advance(state: LobbyState, now: number): LobbyState {
  let next = state;
  if (next.phase === "countdown" && next.race && now >= next.race.startsAt) next = { ...next, phase: "racing" };
  if (next.phase === "racing" && isRaceOver(next, now)) next = finishRace(next, now);
  if (next.phase === "waiting" || next.phase === "finished") next = dropExpiredMembers(next, now);
  return next;
}

function isGone(member: Member | undefined, now: number, graceMs: number): boolean {
  if (!member || member.presence === "left") return true;
  return member.presence === "disconnected" && member.disconnectedAt !== null && now - member.disconnectedAt >= graceMs;
}

/** Over at the time limit, or once every racer finished, left or stayed disconnected past the grace period. */
export function isRaceOver(state: LobbyState, now: number): boolean {
  const race = state.race;
  if (!race) return false;
  if (now >= race.endsAt) return true;
  return race.racers.every(
    (racer) =>
      racer.typing.finishedAt !== null ||
      isGone(
        state.members.find((member) => member.id === racer.id),
        now,
        state.config.reconnectGraceMs,
      ),
  );
}

function finishRace(state: LobbyState, now: number): LobbyState {
  const race = state.race;
  if (!race) return state;
  const endedAt = Math.min(now, race.endsAt);
  const details: Record<string, ResultDetails> = {};

  const racers = race.racers.map((racer): ResultRacer => {
    const { typing } = racer;
    const finishMs = typing.finishedAt === null ? null : typing.finishedAt - race.startsAt;
    const durationMs = finishMs ?? endedAt - race.startsAt;
    const wpm = wordsPerMinute(correctPrefixLength(race.text, typing.typed), durationMs);
    details[racer.id] = {
      durationMs,
      keystrokes: typing.keystrokes,
      mistakes: typing.mistakes,
      speedSamples: racer.samples,
      keyStats: keyStats(racer.keys),
    };
    return { id: racer.id, name: racer.name, emblem: racer.emblem, wpm, accuracy: accuracy(typing.keystrokes, typing.mistakes), finishMs };
  });

  return {
    ...state,
    phase: "finished",
    race: { ...race, endedAt },
    result: { racers: rankRacers(racers), details },
    members: state.members.map((member) => ({ ...member, isReady: false })),
  };
}

function keyStats(keys: Record<string, KeyTotals>): KeyStat[] {
  return Object.entries(keys).map(([key, totals]) => ({
    key,
    avgDelayMs: totals.timed === 0 ? 0 : Math.round(totals.delayMs / totals.timed),
    mistakes: totals.mistakes,
  }));
}

function dropExpiredMembers(state: LobbyState, now: number): LobbyState {
  const members = state.members.filter((member) => !isGone(member, now, state.config.reconnectGraceMs));
  return members.length === state.members.length ? state : withHost({ ...state, members });
}

function liveWpm(racer: Racer, race: Race, now: number): number {
  const { typing } = racer;
  if (typing.finishedAt !== null) return wordsPerMinute(race.text.length, typing.finishedAt - race.startsAt);
  const end = Math.min(now, race.endedAt ?? now);
  return wordsPerMinute(correctPrefixLength(race.text, typing.typed), end - race.startsAt);
}

/** Racer ids by live place: finishers by finish time, then by progress; ties keep join order. */
export function liveOrder(race: Race): string[] {
  return race.racers
    .map((racer, index) => ({ racer, index, progress: progress(race.text, racer.typing.typed) }))
    .sort((a, b) => {
      const aDone = a.racer.typing.finishedAt;
      const bDone = b.racer.typing.finishedAt;
      if (aDone !== null && bDone !== null) return aDone - bDone || a.index - b.index;
      if (aDone !== null) return -1;
      if (bDone !== null) return 1;
      return b.progress - a.progress || a.index - b.index;
    })
    .map(({ racer }) => racer.id);
}

function raceView(state: LobbyState, race: Race, userId: string, now: number): RaceView {
  const racers = race.racers.map(
    (racer): RaceRacer => ({
      id: racer.id,
      name: racer.name,
      emblem: racer.emblem,
      progress: progress(race.text, racer.typing.typed),
      wpm: liveWpm(racer, race, now),
      isFinished: racer.typing.finishedAt !== null,
      isConnected: state.members.some((member) => member.id === racer.id && member.presence === "connected"),
    }),
  );
  const own = race.racers.find((racer) => racer.id === userId);
  return {
    text: race.text,
    startsAt: race.startsAt,
    endsAt: race.endsAt,
    racers,
    you: own
      ? {
          typed: own.typing.typed,
          keystrokes: own.typing.keystrokes,
          mistakes: own.typing.mistakes,
          streak: own.typing.streak,
          inputSeq: own.inputSeq,
          place: liveOrder(race).indexOf(userId) + 1,
          finishedAt: own.typing.finishedAt,
        }
      : null,
  };
}

/** What one member sees; null when the user is not in the lobby. */
export function viewFor(state: LobbyState, userId: string, now: number): LobbyView | null {
  if (!isMember(state, userId)) return null;
  return {
    code: state.code,
    phase: state.phase,
    capacity: state.config.capacity,
    locale: state.locale,
    youId: userId,
    serverNow: now,
    players: activeMembers(state).map((member) => ({
      id: member.id,
      name: member.name,
      emblem: member.emblem,
      isHost: member.id === state.hostId,
      isReady: member.isReady,
      isConnected: member.presence === "connected",
    })),
    race: state.race ? raceView(state, state.race, userId, now) : null,
    hasResult: state.result?.details[userId] !== undefined,
  };
}

/** The last race's results from one racer's point of view. */
export function resultFor(state: LobbyState, userId: string): RaceResult | null {
  const details = state.result?.details[userId];
  if (!state.result || !details) return null;
  return { youId: userId, racers: state.result.racers, ...details };
}

/** Validates an input batch received from a client; null when malformed. */
export function parseInputBatch(value: unknown): InputBatch | null {
  if (typeof value !== "object" || value === null) return null;
  const { seq, events } = value as { seq?: unknown; events?: unknown };
  if (typeof seq !== "number" || !Number.isSafeInteger(seq) || seq < 1) return null;
  if (!Array.isArray(events) || events.length > MAX_EVENTS_PER_BATCH) return null;

  const parsed: InputBatch["events"][number][] = [];
  for (const event of events) {
    if (typeof event !== "object" || event === null) return null;
    const { type, char, delayMs } = event as { type?: unknown; char?: unknown; delayMs?: unknown };
    if (type === "delete") {
      parsed.push({ type: "delete" });
    } else if (type === "char" && typeof char === "string" && [...char].length === 1 && typeof delayMs === "number" && Number.isFinite(delayMs)) {
      parsed.push({ type: "char", char, delayMs });
    } else {
      return null;
    }
  }
  return { seq, events: parsed };
}
