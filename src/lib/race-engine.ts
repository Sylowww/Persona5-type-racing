// Authoritative lobby and race rules. Pure functions of (state, event, now): no timers, no I/O and no
// transport, so the same rules work behind SSE today and any other transport later.
import type { Locale } from "@/i18n/locales";
import type { BotDifficulty, LobbyPhase, LobbyView, PlayerEmblem } from "@/types/lobby";
import type { InputBatch, InputEvent, KeyStat, RaceRacer, RaceResult, RaceView, ResultRacer, SpeedSample } from "@/types/race";
import { planBotRun, type BotStep } from "./bots";
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
const botNames = ["Phantom", "Raven", "Viper", "Noir", "Cipher", "Echo", "Nova", "Jinx", "Blaze", "Ghost"];

export type Presence = "connected" | "disconnected" | "left";

export type Member = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  isReady: boolean;
  presence: Presence;
  /** When the connection was lost; null while connected. */
  disconnectedAt: number | null;
  /** Difficulty of a bot; null for human players. Bots are always connected and ready. */
  bot: BotDifficulty | null;
};

type KeyTotals = { delayMs: number; timed: number; mistakes: number };

export type Racer = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  typing: TypingState;
  /** Page currently sending this racer's input, and its last applied batch. */
  inputClient: string | null;
  inputSeq: number;
  keys: Record<string, KeyTotals>;
  samples: SpeedSample[];
  /** A bot's planned keystrokes and how many were already applied; null for human players. */
  bot: { steps: BotStep[]; applied: number } | null;
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
  endedAt: number;
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
    bot: null,
  };
}

function activeMembers(state: LobbyState): Member[] {
  return state.members.filter((member) => member.presence !== "left");
}

export function isMember(state: LobbyState, userId: string): boolean {
  return state.members.some((member) => member.id === userId && member.presence !== "left");
}

function isRaceRunning(state: LobbyState): boolean {
  return state.phase === "countdown" || state.phase === "racing";
}

/**
 * The host stays while present; otherwise the longest-standing active player takes over. Bots never host,
 * and they are removed once no player is left (outside a race, which ends on its own).
 */
function withHost(state: LobbyState): LobbyState {
  const humans = activeMembers(state).filter((member) => member.bot === null);
  if (humans.length === 0) {
    return isRaceRunning(state) ? state : { ...state, members: state.members.filter((member) => member.bot === null) };
  }
  return isMember(state, state.hostId) ? state : { ...state, hostId: humans[0].id };
}

/** After a race, the first lobby action brings everyone back to the waiting room. Bots stay ready. */
function reopen(state: LobbyState): LobbyState {
  if (state.phase !== "finished") return state;
  return withHost({
    ...state,
    phase: "waiting",
    race: null,
    members: activeMembers(state).map((member) => ({ ...member, isReady: member.bot !== null })),
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

/** The host adds a bot of the chosen difficulty while the lobby is waiting. */
export function addBot(state: LobbyState, userId: string, difficulty: BotDifficulty): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  if (activeMembers(open).length >= open.config.capacity) return fail("lobbyFull");

  const bot: Member = {
    id: `bot-${open.joinCount}`,
    name: botName(open),
    emblem: emblems[open.joinCount % emblems.length],
    isReady: true,
    presence: "connected",
    disconnectedAt: null,
    bot: difficulty,
  };
  return ok({ ...open, members: [...open.members, bot], joinCount: open.joinCount + 1 });
}

/** A name no one in the lobby uses, numbered once every name is taken. */
function botName(state: LobbyState): string {
  const taken = new Set(state.members.map((member) => member.name));
  const count = state.members.filter((member) => member.bot !== null).length;
  const free = botNames.find((name) => !taken.has(name));
  return free ?? `${botNames[count % botNames.length]} ${Math.floor(count / botNames.length) + 1}`;
}

/** The host removes a bot while the lobby is waiting. */
export function removeBot(state: LobbyState, userId: string, botId: string): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  if (!open.members.some((member) => member.id === botId && member.bot !== null)) return fail("notMember");
  return ok({ ...open, members: open.members.filter((member) => member.id !== botId) });
}

/** Leaving before a race removes the seat; leaving during one keeps the racer in the results as not finished. */
export function leaveLobby(state: LobbyState, userId: string): LobbyState {
  if (!isMember(state, userId)) return state;
  const inRace = isRaceRunning(state);
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

/** `random` drives the bots' behavior during this race. */
export function startRace(state: LobbyState, userId: string, text: string, now: number, random: () => number = Math.random): Outcome {
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
        inputClient: null,
        inputSeq: 0,
        keys: {},
        samples: [],
        bot: member.bot === null ? null : { steps: planBotRun(text, member.bot, random), applied: 0 },
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
 * A new page (e.g. after a reload) takes over with its first batch; late batches from the old page are then ignored.
 */
export function applyInput(state: LobbyState, userId: string, batch: InputBatch, now: number): LobbyState {
  const race = state.race;
  if (state.phase !== "racing" || !race || now < race.startsAt || !isMember(state, userId)) return state;
  const racer = race.racers.find((candidate) => candidate.id === userId);
  if (!racer || racer.typing.finishedAt !== null) return state;
  const isNext = batch.clientId === racer.inputClient ? batch.seq > racer.inputSeq : batch.seq === 1;
  if (!isNext) return state;

  const keyBudget = Math.floor(((now - race.startsAt) / 1000 + 1) * state.config.maxKeysPerSecond);
  let typed = racer;
  for (const event of batch.events.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (event.type === "char" && (race.text[typed.typing.typed.length] === undefined || typed.typing.keystrokes >= keyBudget)) break;
    typed = typeEvent(typed, race.text, event, now);
    if (typed.typing.finishedAt !== null) break;
  }

  const updated: Racer = {
    ...typed,
    inputClient: batch.clientId,
    inputSeq: batch.seq,
    samples: withSample(racer, race, typed.typing, now, state.config),
  };
  return {
    ...state,
    race: { ...race, racers: race.racers.map((candidate) => (candidate.id === userId ? updated : candidate)) },
  };
}

/** Applies one keystroke with the shared typing rules and records it in the racer's key stats. */
function typeEvent(racer: Racer, text: string, event: InputEvent, now: number): Racer {
  if (event.type === "delete") return { ...racer, typing: deleteChar(racer.typing) };
  const expected = text[racer.typing.typed.length];
  if (expected === undefined) return racer;

  const key = expected.toLowerCase();
  const totals = racer.keys[key] ?? { delayMs: 0, timed: 0, mistakes: 0 };
  let keyTotals = totals;
  if (event.char !== expected) {
    keyTotals = { ...totals, mistakes: totals.mistakes + 1 };
  } else if (event.delayMs > 0) {
    keyTotals = { ...totals, delayMs: totals.delayMs + Math.min(event.delayMs, MAX_KEY_DELAY_MS), timed: totals.timed + 1 };
  }
  return { ...racer, typing: typeChar(racer.typing, text, event.char, now), keys: { ...racer.keys, [key]: keyTotals } };
}

/** Replays every bot keystroke planned up to `now` (or the time limit), each at its own planned time. */
function runBots(state: LobbyState, now: number): LobbyState {
  const race = state.race;
  if (state.phase !== "racing" || !race) return state;
  const elapsedMs = Math.min(now, race.endsAt) - race.startsAt;
  let changed = false;

  const racers = race.racers.map((racer) => {
    let next = racer;
    while (next.bot && next.typing.finishedAt === null && next.bot.applied < next.bot.steps.length) {
      const step = next.bot.steps[next.bot.applied];
      if (step.atMs > elapsedMs) break;
      const time = race.startsAt + step.atMs;
      const typed = typeEvent(next, race.text, step.event, time);
      next = {
        ...typed,
        bot: { ...next.bot, applied: next.bot.applied + 1 },
        samples: withSample(next, race, typed.typing, time, state.config),
      };
    }
    if (next !== racer) changed = true;
    return next;
  });
  return changed ? { ...state, race: { ...race, racers } } : state;
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
  next = runBots(next, now);
  if (next.phase === "racing" && isRaceOver(next, now)) next = finishRace(next, now);
  if (next.phase === "waiting" || next.phase === "finished") next = dropExpiredMembers(next, now);
  return next;
}

function isGone(member: Member | undefined, now: number, graceMs: number): boolean {
  if (!member || member.presence === "left") return true;
  return member.presence === "disconnected" && member.disconnectedAt !== null && now - member.disconnectedAt >= graceMs;
}

/**
 * Over at the time limit, once every racer finished, left or stayed disconnected past the grace period,
 * or once no player is left to race the bots.
 */
export function isRaceOver(state: LobbyState, now: number): boolean {
  const race = state.race;
  if (!race) return false;
  if (now >= race.endsAt) return true;
  const graceMs = state.config.reconnectGraceMs;
  if (state.members.every((member) => member.bot !== null || isGone(member, now, graceMs))) return true;
  return race.racers.every(
    (racer) =>
      racer.typing.finishedAt !== null ||
      isGone(
        state.members.find((member) => member.id === racer.id),
        now,
        graceMs,
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
    result: { endedAt, racers: rankRacers(racers), details },
    members: state.members.map((member) => ({ ...member, isReady: member.bot !== null })),
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
      isBot: racer.bot !== null,
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
          inputClient: own.inputClient,
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
      bot: member.bot,
    })),
    race: state.race ? raceView(state, state.race, userId, now) : null,
    hasResult: state.result?.details[userId] !== undefined,
  };
}

/** The last race's results from one racer's point of view. */
export function resultFor(state: LobbyState, userId: string): RaceResult | null {
  const details = state.result?.details[userId];
  if (!state.result || !details) return null;
  return { youId: userId, endedAt: state.result.endedAt, racers: state.result.racers, ...details };
}

/** Validates an input batch received from a client; null when malformed. */
export function parseInputBatch(value: unknown): InputBatch | null {
  if (typeof value !== "object" || value === null) return null;
  const { clientId, seq, events } = value as { clientId?: unknown; seq?: unknown; events?: unknown };
  if (typeof clientId !== "string" || clientId.length === 0 || clientId.length > 64) return null;
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
  return { clientId, seq, events: parsed };
}
