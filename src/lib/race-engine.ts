// Authoritative lobby and race rules. Pure functions of (state, event, now): no timers, no I/O and no
// transport, so the same rules work behind SSE today and any other transport later.
import { z } from "zod";
import type { Locale } from "@/i18n/locales";
import type { CharacterId } from "@/types/character";
import type {
  BotDifficulty,
  LobbyKind,
  LobbyMessage,
  LobbyPhase,
  LobbyView,
  LobbyVisibility,
  PlayerEmblem,
  PublicLobby,
  RaceSettings,
} from "@/types/lobby";
import type {
  InputBatch,
  InputEvent,
  KeyStat,
  RaceRacer,
  RacerStatus,
  RaceResult,
  RaceView,
  ReplayEvent,
  ResultRacer,
  SpeedSample,
  SpellId,
  SpellMark,
} from "@/types/race";
import {
  AMBUSH_WORDS,
  appendWords,
  BOT_HEX_SPEED,
  CALLING_CARD_HEX_MS,
  callingCardTarget,
  checkpointsReached,
  firstWordLength,
  pickBonusReceivers,
  removeLastWords,
} from "./bonuses";
import { planBotRun, replanBotRun, seededRandom, slowBotSteps, type BotStep } from "./bots";
import { DEFAULT_CHARACTER, randomCharacter } from "./characters";
import { cleanMessage, MAX_LOBBY_MESSAGES, MESSAGE_COOLDOWN_MS } from "./chat";
import { canStartRace, MAX_LOBBY_CAPACITY, MIN_LOBBY_CAPACITY } from "./lobby";
import { defaultRaceSettings, parseRaceSettings, raceDurationMs } from "./race-settings";
import { rankRacers } from "./results";
import { characterPersonas, drawSpell, FALLBACK_SPELL, isSelfSpell, spellById, spellMarkMs, type Spell } from "./spells";
import { inputBatchSchema, memberRoleSchema, visibilitySchema } from "./schemas";
import {
  accuracy,
  correctPrefixLength,
  deleteChar,
  initialTypingState,
  netChars,
  normalizeTypedChar,
  progress,
  typeChar,
  wordsPerMinute,
  type TypingState,
} from "./typing";

export type EngineConfig = {
  /** Maximum number of players in one lobby. */
  capacity: number;
  countdownMs: number;
  /** How long a disconnected player keeps their seat, and how long a race waits for them. */
  reconnectGraceMs: number;
  /** Typed characters per second above which input is dropped (30/s is about 360 WPM). */
  maxKeysPerSecond: number;
  /** Minimum time between two speed samples of a racer. */
  sampleIntervalMs: number;
};


export const defaultEngineConfig: EngineConfig = {
  capacity: 30,
  countdownMs: 3_000,
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
  character: CharacterId;
  isReady: boolean;
  presence: Presence;
  /** When the connection was lost; null while connected. */
  disconnectedAt: number | null;
  /** Difficulty of a bot; null for human players. Bots are always connected and ready. */
  bot: BotDifficulty | null;
  /** Spectators follow the race without typing and do not take a seat (SALLE-01, SALLE-05). */
  role: MemberRole;
};

export type MemberRole = "player" | "spectator";

/** Spectators a custom lobby holds on top of its seats. */
export const MAX_SPECTATORS = 30;

type KeyTotals = { delayMs: number; timed: number; mistakes: number };

export type Racer = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  character: CharacterId;
  /** This racer's own text: the race text, with words added or removed by bonuses (BONUS-04). */
  text: string;
  typing: TypingState;
  /** Page currently sending this racer's input, and its last applied batch. */
  inputClient: string | null;
  inputSeq: number;
  keys: Record<string, KeyTotals>;
  samples: SpeedSample[];
  /** A bot's planned keystrokes and how many were already applied; null for human players. */
  bot: { difficulty: BotDifficulty; steps: BotStep[]; applied: number } | null;
  /** When a mistake knocked the racer out (sudden death); null otherwise. */
  eliminatedAt: number | null;
  /** When the racer gave up (COURSE-07); null otherwise. */
  forfeitedAt: number | null;
  /** Catch-up spells cast this race (at most 3). */
  bonuses: number;
  /** A spell blurring the racer's next words; null otherwise. */
  hex: SpellMark | null;
  /** A spell freezing the racer's keys; null otherwise. */
  stun: SpellMark | null;
  /** The last malus this racer took, shown on their lane for everyone while it lasts; null otherwise. */
  mark: SpellMark | null;
  /** A calling card hiding the racer's next words, and who sent it; null otherwise. */
  card: { fromId: string; until: number } | null;
  /** The racer sent their one calling card of the race. */
  cardSent: boolean;
};

/** A calling card sent by the last racer to the leader. */
export type CallingCardEvent = { id: number; fromId: string; toId: string; at: number };

/** One catch-up spell cast at a checkpoint, announced on the track (BONUS-03). */
export type BonusEvent = {
  id: number;
  spell: SpellId;
  /** The lagging racer who cast it. */
  receiverId: string;
  /** Who it acts on: the caster for a support spell, the leader otherwise. */
  targetId: string;
  at: number;
};

export type Race = {
  text: string;
  startsAt: number;
  endsAt: number;
  endedAt: number | null;
  /** Rules fixed when the race started. */
  settings: RaceSettings;
  /** Everyone in the lobby when the race started, in join order. */
  racers: Racer[];
  /** Bonus checkpoints already handed out (0 to 3). */
  checkpoints: number;
  bonusEvents: BonusEvent[];
  /** The first racer to type the first word without a mistake; null until then (powers on only). */
  ambush: { racerId: string; at: number } | null;
  callingCards: CallingCardEvent[];
  /** Seeds the bot plans made during the race, so they stay reproducible. */
  seed: number;
};

export type ChatMessage = LobbyMessage & { sentAt: number };

/**
 * A single-use invite link (SALLE-04). The first person to use it binds it to their IP address; afterwards only that
 * address may use it again (e.g. to come back after leaving).
 */
export type Invite = {
  token: string;
  usedBy: { userId: string; name: string; ip: string } | null;
  revoked: boolean;
};

/** Invite links one lobby may hold. */
export const MAX_INVITES = 60;

type ResultDetails = Pick<RaceResult, "durationMs" | "keystrokes" | "mistakes" | "speedSamples" | "keyStats">;

export type StoredResult = {
  endedAt: number;
  /** Ranked, first place first. */
  racers: ResultRacer[];
  details: Record<string, ResultDetails>;
  events: ReplayEvent[];
};

export type LobbyState = {
  code: string;
  kind: LobbyKind;
  /** Custom lobbies start joinable with their code; quick and training lobbies are always private. */
  visibility: LobbyVisibility;
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
  /** Rules of the next race. */
  settings: RaceSettings;
  /** Latest messages, oldest first, at most `MAX_LOBBY_MESSAGES`. */
  messages: ChatMessage[];
  /** Number of messages ever sent; gives each message its id. */
  messageCount: number;
  /** Players the host removed; they cannot come back to this lobby (SALLE-07). */
  kicked: string[];
  /** Invite links, oldest first. They die with the lobby. */
  invites: Invite[];
  /** When the lobby was opened; breaks ties when picking a lobby for a quick race (JOIN-03). */
  createdAt: number;
};

export type LobbyError =
  | "lobbyFull"
  | "privateLobby"
  | "raceInProgress"
  | "notMember"
  | "notHost"
  | "notReady"
  | "wrongPhase"
  | "invalidSettings"
  | "invalidMessage"
  | "tooFast"
  | "kicked"
  | "invalidInvite"
  | "inviteUsed";

export type Outcome = { ok: true; state: LobbyState } | { ok: false; error: LobbyError };

/** A joining player; their character defaults to Joker. */
export type Player = { id: string; name: string; character?: CharacterId };

const ok = (state: LobbyState): Outcome => ({ ok: true, state });
const fail = (error: LobbyError): Outcome => ({ ok: false, error });

export function createLobby(input: {
  code: string;
  /** The host's interface language, used as the race text language until the host changes it. */
  locale: Locale;
  host: Player;
  now: number;
  config?: Partial<EngineConfig>;
  /** Defaults to `custom`. */
  kind?: LobbyKind;
  /** Defaults to `defaultRaceSettings`. */
  settings?: RaceSettings;
}): LobbyState {
  const kind = input.kind ?? "custom";
  const config = { ...defaultEngineConfig, ...input.config };
  config.capacity = Math.min(MAX_LOBBY_CAPACITY, Math.max(MIN_LOBBY_CAPACITY, Math.floor(config.capacity)));
  if (kind === "training") config.capacity = 1;
  if (kind === "quick") config.capacity = 2;
  return {
    code: input.code,
    kind,
    visibility: kind === "custom" ? "code" : "private",
    config,
    phase: "waiting",
    hostId: input.host.id,
    members: [newMember(input.host, 0, input.now, "player")],
    joinCount: 1,
    race: null,
    result: null,
    settings: { ...(input.settings ?? defaultRaceSettings), language: input.locale },
    messages: [],
    messageCount: 0,
    kicked: [],
    invites: [],
    createdAt: input.now,
  };
}

// A new member counts as disconnected until their page connects, so an abandoned seat is freed after the grace period.
function newMember(player: Player, joinIndex: number, now: number, role: MemberRole): Member {
  return {
    id: player.id,
    name: player.name,
    emblem: emblems[joinIndex % emblems.length],
    character: player.character ?? DEFAULT_CHARACTER,
    isReady: false,
    presence: "disconnected",
    disconnectedAt: now,
    bot: null,
    role,
  };
}

function activeMembers(state: LobbyState): Member[] {
  return state.members.filter((member) => member.presence !== "left");
}

/** Members who race (bots included): they take the seats. */
function seatedMembers(state: LobbyState): Member[] {
  return activeMembers(state).filter((member) => member.role === "player");
}

export function isMember(state: LobbyState, userId: string): boolean {
  return state.members.some((member) => member.id === userId && member.presence !== "left");
}

function isRaceRunning(state: LobbyState): boolean {
  return state.phase === "countdown" || state.phase === "racing";
}

/**
 * The host stays while present; otherwise the longest-standing connected person (player or spectator, SALLE-08)
 * takes over. Bots never host, and they are removed once no person is left (outside a race, which ends on its own).
 */
function withHost(state: LobbyState): LobbyState {
  const humans = activeMembers(state).filter((member) => member.bot === null);
  if (humans.length === 0) {
    return isRaceRunning(state) ? state : { ...state, members: state.members.filter((member) => member.bot === null) };
  }
  if (isMember(state, state.hostId)) return state;
  const next = humans.find((member) => member.presence === "connected") ?? humans[0];
  return { ...state, hostId: next.id };
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

/**
 * Joining with a code only works for custom lobbies that are not private (those need an invite link);
 * matchmaking adds quick players with `admitPlayer`.
 */
export function joinLobby(state: LobbyState, player: Player, now: number): Outcome {
  if (isMember(state, player.id)) return ok(state);
  if (state.kind !== "custom" || state.visibility === "private") return fail("privateLobby");
  return admitPlayer(state, player, now);
}

/**
 * Adds a player to any kind of lobby. They take a seat when one is free; once the seats of a custom lobby are taken,
 * they come in as a spectator instead, up to `MAX_SPECTATORS`.
 */
export function admitPlayer(state: LobbyState, player: Player, now: number): Outcome {
  if (isMember(state, player.id)) return ok(state);
  if (state.kicked.includes(player.id)) return fail("kicked");
  if (state.phase === "countdown" || state.phase === "racing") return fail("raceInProgress");
  const open = reopen(state);
  const hasSeat = seatedMembers(open).length < open.config.capacity;
  const spectators = activeMembers(open).length - seatedMembers(open).length;
  if (!hasSeat && (open.kind !== "custom" || spectators >= MAX_SPECTATORS)) return fail("lobbyFull");
  return ok({
    ...open,
    members: [...open.members, newMember(player, open.joinCount, now, hasSeat ? "player" : "spectator")],
    joinCount: open.joinCount + 1,
  });
}

/**
 * A member of a custom lobby switches between racing and spectating while it is waiting. Taking a seat needs a free
 * one; a spectator is never ready.
 */
export function setRole(state: LobbyState, userId: string, role: unknown): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.kind !== "custom") return fail("privateLobby");
  const parsed = memberRoleSchema.safeParse(role);
  if (!parsed.success) return fail("invalidSettings");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  const member = open.members.find((candidate) => candidate.id === userId);
  if (!member || member.role === parsed.data) return ok(open);
  if (parsed.data === "player" && seatedMembers(open).length >= open.config.capacity) return fail("lobbyFull");
  return ok({ ...open, members: open.members.map((candidate) => (candidate === member ? { ...candidate, role: parsed.data, isReady: false } : candidate)) });
}

/** The host adds a bot of the chosen difficulty while the lobby is waiting, as `character` or a random one. */
export function addBot(
  state: LobbyState,
  userId: string,
  difficulty: BotDifficulty,
  random: () => number = Math.random,
  character?: CharacterId,
): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  if (open.kind === "training") return fail("privateLobby");
  if (seatedMembers(open).length >= open.config.capacity) return fail("lobbyFull");

  const bot: Member = {
    id: `bot-${open.joinCount}`,
    name: botName(open),
    emblem: emblems[open.joinCount % emblems.length],
    character: character ?? randomCharacter(random),
    isReady: true,
    presence: "connected",
    disconnectedAt: null,
    bot: difficulty,
    role: "player",
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

/** A player picked another character on their profile: their card changes now, their runner from the next race. */
export function setCharacter(state: LobbyState, userId: string, character: CharacterId): LobbyState {
  const member = state.members.find((candidate) => candidate.id === userId && candidate.bot === null);
  if (!member || member.character === character) return state;
  return { ...state, members: state.members.map((candidate) => (candidate === member ? { ...candidate, character } : candidate)) };
}

/** A player renamed on their profile: the lobby shows the new name at once, the race in progress keeps the old one. */
export function setName(state: LobbyState, userId: string, name: string): LobbyState {
  const member = state.members.find((candidate) => candidate.id === userId && candidate.bot === null);
  if (!member || member.name === name) return state;
  return { ...state, members: state.members.map((candidate) => (candidate === member ? { ...candidate, name } : candidate)) };
}

/** The host changes the next race's rules while the lobby is waiting. `change` comes from the client and is validated here. */
export function updateSettings(state: LobbyState, userId: string, change: unknown): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  const settings = parseRaceSettings(open.settings, change);
  if (!settings) return fail("invalidSettings");
  return ok({ ...open, settings });
}

/** The host sets who can join a custom lobby: public (listed), code (code or link) or private (invite link only). */
export function setVisibility(state: LobbyState, userId: string, visibility: unknown): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  if (state.kind !== "custom") return fail("privateLobby");
  const parsed = visibilitySchema.safeParse(visibility);
  if (!parsed.success) return fail("invalidSettings");
  return ok({ ...state, visibility: parsed.data });
}

/** The host sets the number of seats of a custom lobby, between 2 and 30 and never below the players already in. */
export function setCapacity(state: LobbyState, userId: string, capacity: unknown): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  if (state.kind !== "custom") return fail("privateLobby");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  const min = Math.max(MIN_LOBBY_CAPACITY, seatedMembers(open).length);
  const parsed = z.number().int().min(min).max(MAX_LOBBY_CAPACITY).safeParse(capacity);
  if (!parsed.success) return fail("invalidSettings");
  return ok({ ...open, config: { ...open.config, capacity: parsed.data } });
}

/** Free seats of a public lobby that can be joined now (JOIN-03); null when it cannot. */
export function quickRaceSeats(state: LobbyState): number | null {
  if (state.kind !== "custom" || state.visibility !== "public" || isRaceRunning(state)) return null;
  const free = state.config.capacity - seatedMembers(state).length;
  return free > 0 ? free : null;
}

/** How the lobby browser shows a public lobby; null for lobbies it does not list. */
export function publicLobbyFor(state: LobbyState): PublicLobby | null {
  if (state.kind !== "custom" || state.visibility !== "public") return null;
  const host = state.members.find((member) => member.id === state.hostId);
  return {
    code: state.code,
    hostName: host?.name ?? "",
    playerCount: seatedMembers(state).length,
    capacity: state.config.capacity,
    phase: state.phase,
    settings: state.settings,
  };
}

/** Any member can chat, in every phase. `text` comes from the client and is validated here. */
export function sendMessage(state: LobbyState, userId: string, text: unknown, now: number): Outcome {
  const author = state.members.find((member) => member.id === userId && member.presence !== "left");
  if (!author) return fail("notMember");
  const clean = cleanMessage(text);
  if (!clean) return fail("invalidMessage");
  const last = state.messages.findLast((message) => message.authorId === userId);
  if (last && now - last.sentAt < MESSAGE_COOLDOWN_MS) return fail("tooFast");

  const message: ChatMessage = { id: String(state.messageCount + 1), authorId: userId, author: author.name, text: clean, sentAt: now };
  return ok({
    ...state,
    messages: [...state.messages, message].slice(-MAX_LOBBY_MESSAGES),
    messageCount: state.messageCount + 1,
  });
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

/**
 * The host removes another player for good: they leave like with `leaveLobby` (kept as not finished during a race)
 * and can never join this lobby again. Bots are removed with `removeBot`.
 */
export function kickMember(state: LobbyState, userId: string, targetId: string): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  const target = state.members.find((member) => member.id === targetId && member.presence !== "left");
  if (!target || target.bot !== null || target.id === userId) return fail("notMember");
  return ok({
    ...leaveLobby(state, targetId),
    kicked: [...state.kicked, targetId],
    // Their invite link stops working too.
    invites: state.invites.map((invite) => (invite.usedBy?.userId === targetId ? { ...invite, revoked: true } : invite)),
  });
}

/** The host of a custom lobby creates a new invite link. `token` must be random and unguessable (128 bits or more). */
export function createInvite(state: LobbyState, userId: string, token: string): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  if (state.kind !== "custom") return fail("privateLobby");
  if (state.invites.length >= MAX_INVITES) return fail("invalidSettings");
  return ok({ ...state, invites: [...state.invites, { token, usedBy: null, revoked: false }] });
}

/**
 * Joins with an invite link, whatever the lobby's visibility. An unused link is bound to the first person and their IP
 * address; a used one only lets that address in again.
 */
export function joinWithInvite(state: LobbyState, player: Player, token: string, ip: string, now: number): Outcome {
  const invite = state.invites.find((candidate) => candidate.token === token);
  if (!invite || invite.revoked) return fail("invalidInvite");
  if (invite.usedBy && invite.usedBy.ip !== ip) return fail("inviteUsed");
  const admitted = admitPlayer(state, player, now);
  if (!admitted.ok || invite.usedBy) return admitted;
  const usedBy = { userId: player.id, name: player.name, ip };
  return ok({ ...admitted.state, invites: admitted.state.invites.map((candidate) => (candidate === invite ? { ...candidate, usedBy } : candidate)) });
}

/** The host closes the lobby outside a race (COURSE-11): everyone is removed and the store deletes it. */
export function closeLobby(state: LobbyState, userId: string): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  if (isRaceRunning(state)) return fail("wrongPhase");
  return ok({ ...state, members: [] });
}

export function setReady(state: LobbyState, userId: string, isReady: boolean): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  if (isReady && open.members.some((member) => member.id === userId && member.role === "spectator")) return fail("wrongPhase");
  return ok({ ...open, members: open.members.map((member) => (member.id === userId ? { ...member, isReady } : member)) });
}

/** `random` drives the bots' behavior during this race. */
export function startRace(state: LobbyState, userId: string, text: string, now: number, random: () => number = Math.random): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  if (state.hostId !== userId) return fail("notHost");
  // A finished race reopens the lobby first, like any other lobby action.
  const open = reopen(state);
  if (open.phase !== "waiting") return fail("wrongPhase");
  const players = seatedMembers(open);
  // Training is solo: the player starts whenever they want.
  if (open.kind !== "training" && !canStartRace(players)) return fail("notReady");

  const startsAt = now + open.config.countdownMs;
  return ok({
    ...open,
    phase: "countdown",
    race: {
      text,
      startsAt,
      endsAt: startsAt + raceDurationMs(open.settings),
      endedAt: null,
      settings: open.settings,
      checkpoints: 0,
      bonusEvents: [],
      ambush: null,
      callingCards: [],
      seed: Math.floor(random() * 2 ** 31),
      racers: players.map((member) => ({
        id: member.id,
        name: member.name,
        emblem: member.emblem,
        character: member.character,
        text,
        typing: initialTypingState,
        inputClient: null,
        inputSeq: 0,
        keys: {},
        samples: [],
        bot: member.bot === null ? null : { difficulty: member.bot, steps: planBotRun(text, member.bot, random, open.settings.mode), applied: 0 },
        eliminatedAt: null,
        forfeitedAt: null,
        bonuses: 0,
        hex: null,
        stun: null,
        mark: null,
        card: null,
        cardSent: false,
      })),
    },
  });
}

/** A racer gives up during the countdown or the race (COURSE-07): they stop typing and rank among forfeits. */
export function forfeitRace(state: LobbyState, userId: string, now: number): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  const race = state.race;
  if (!race || !isRaceRunning(state)) return fail("wrongPhase");
  const racer = race.racers.find((candidate) => candidate.id === userId);
  if (!racer || isOut(racer)) return fail("wrongPhase");
  const racers = race.racers.map((candidate) => (candidate === racer ? { ...candidate, forfeitedAt: Math.max(now, race.startsAt) } : candidate));
  return ok({ ...state, race: { ...race, racers } });
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
  if (!racer || isOut(racer)) return state;
  const isNext = batch.clientId === racer.inputClient ? batch.seq > racer.inputSeq : batch.seq === 1;
  if (!isNext) return state;
  // Stunned by a spell: the batch is used up but its keys do nothing (the page then takes the server's copy back).
  if (racer.stun && now < racer.stun.until) {
    const stunned = { ...racer, inputClient: batch.clientId, inputSeq: batch.seq };
    return { ...state, race: { ...race, racers: race.racers.map((candidate) => (candidate.id === userId ? stunned : candidate)) } };
  }

  const keyBudget = Math.floor(((now - race.startsAt) / 1000 + 1) * state.config.maxKeysPerSecond);
  let typed = racer;
  for (const event of batch.events.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (event.type === "char" && (typed.text[typed.typing.typed.length] === undefined || typed.typing.keystrokes >= keyBudget)) break;
    typed = typeEvent(typed, race, event, now);
    if (isOut(typed)) break;
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

/** A racer who finished, was eliminated or gave up types no more. */
function isOut(racer: Racer): boolean {
  return racer.typing.finishedAt !== null || racer.eliminatedAt !== null || racer.forfeitedAt !== null;
}

/**
 * Applies one keystroke with the race's typing rules and records it in the racer's key stats.
 * In sudden death, a wrong character eliminates the racer.
 */
function typeEvent(racer: Racer, race: Race, event: InputEvent, now: number): Racer {
  if (event.type === "delete") return { ...racer, typing: deleteChar(racer.typing) };
  const { settings } = race;
  const { text } = racer;
  const expected = text[racer.typing.typed.length];
  if (expected === undefined) return racer;

  const char = normalizeTypedChar(expected, event.char, settings.caseSensitive);
  const isWrong = char !== expected;
  const key = expected.toLowerCase();
  const totals = racer.keys[key] ?? { delayMs: 0, timed: 0, mistakes: 0 };
  let keyTotals = totals;
  if (isWrong) {
    keyTotals = { ...totals, mistakes: totals.mistakes + 1 };
  } else if (event.delayMs > 0) {
    keyTotals = { ...totals, delayMs: totals.delayMs + Math.min(event.delayMs, MAX_KEY_DELAY_MS), timed: totals.timed + 1 };
  }
  return {
    ...racer,
    typing: typeChar(racer.typing, text, char, now, settings.mode),
    keys: { ...racer.keys, [key]: keyTotals },
    eliminatedAt: isWrong && settings.mode === "suddenDeath" ? now : racer.eliminatedAt,
  };
}

/** Replays every bot keystroke planned up to `now` (or the time limit), each at its own planned time. */
function runBots(state: LobbyState, now: number): LobbyState {
  const race = state.race;
  if (state.phase !== "racing" || !race) return state;
  const elapsedMs = Math.min(now, race.endsAt) - race.startsAt;
  let changed = false;

  const racers = race.racers.map((racer) => {
    let next = racer;
    while (next.bot && !isOut(next) && next.bot.applied < next.bot.steps.length) {
      const step = next.bot.steps[next.bot.applied];
      if (step.atMs > elapsedMs) break;
      const time = race.startsAt + step.atMs;
      const typed = typeEvent(next, race, step.event, time);
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
  return [
    ...racer.samples,
    {
      atMs,
      wpm: wordsPerMinute(netChars(racer.text, typing.typed, race.settings.mode), atMs),
      progress: progress(racer.text, typing.typed, race.settings.mode),
    },
  ];
}

/** How long the track announces a bonus. */
export const BONUS_ANNOUNCE_MS = 4_000;

/**
 * Hands out catch-up spells when the leader passes a checkpoint (BONUS-01): each lagging racer draws one from the shared
 * pool, with better odds of a big spell the further behind they are (`drawSpell`), which either helps them or slows the
 * leader. Bots draw and suffer spells like players (BOT-04).
 */
function applyCatchUp(state: LobbyState, now: number): LobbyState {
  const race = state.race;
  if (state.phase !== "racing" || !race || !race.settings.powers) return state;
  const progressOf = (racer: Racer) => progress(racer.text, racer.typing.typed, race.settings.mode);
  const reached = checkpointsReached(Math.max(0, ...race.racers.map(progressOf)));
  if (reached <= race.checkpoints) return state;

  let racers = race.racers;
  const events = [...race.bonusEvents];
  const update = (racerId: string, change: (racer: Racer) => Racer) => {
    racers = racers.map((racer) => (racer.id === racerId ? change(racer) : racer));
  };
  for (let checkpoint = race.checkpoints; checkpoint < reached; checkpoint++) {
    const contenders = racers.filter((racer) => !isOut(racer)).map((racer) => ({ id: racer.id, progress: progressOf(racer), bonuses: racer.bonuses }));
    const { leaderId, receiverIds } = pickBonusReceivers(contenders);
    const progressById = new Map(contenders.map((contender) => [contender.id, contender.progress]));
    for (const receiverId of receiverIds) {
      if (!leaderId) continue;
      const id = events.length + 1;
      const gap = (progressById.get(leaderId) ?? 0) - (progressById.get(receiverId) ?? 0);
      const drawn = drawSpell(gap, seededRandom(race.seed + id));
      // One malus at a time on the leader: while one is running (or was just cast), the caster helps themself instead.
      const leader = racers.find((racer) => racer.id === leaderId);
      const isLeaderHit =
        isUnderMalus(leader, now) || events.some((event) => event.at === now && event.targetId === leaderId);
      const spell = !isSelfSpell(drawn) && isLeaderHit ? FALLBACK_SPELL : drawn;
      const targetId = isSelfSpell(spell) ? receiverId : leaderId;
      update(receiverId, (racer) => ({ ...racer, bonuses: racer.bonuses + 1 }));
      update(targetId, (target) => applySpell(target, spell, race, id, now));
      events.push({ id, spell: spell.id, receiverId, targetId, at: now });
    }
  }
  return { ...state, race: { ...race, racers, checkpoints: reached, bonusEvents: events } };
}

/** A spell or calling card is already slowing the racer down: one malus at a time. */
function isUnderMalus(racer: Racer | undefined, now: number): boolean {
  return (racer?.stun?.until ?? 0) > now || (racer?.hex?.until ?? 0) > now || (racer?.card?.until ?? 0) > now;
}

/**
 * "Ambush!": the first racer to type the first word without a single mistake gets a word off their own text
 * (powers on only). Bots can ambush too.
 */
function applyAmbush(state: LobbyState, now: number): LobbyState {
  const race = state.race;
  if (state.phase !== "racing" || !race || !race.settings.powers || race.ambush) return state;
  const target = firstWordLength(race.text);
  const ambusher = race.racers
    .filter((racer) => !isOut(racer) && racer.typing.mistakes === 0 && correctPrefixLength(racer.text, racer.typing.typed) >= target)
    .sort((a, b) => b.typing.typed.length - a.typing.typed.length)[0];
  if (!ambusher) return state;
  const racers = race.racers.map((racer) =>
    racer === ambusher ? withText(racer, removeLastWords(racer.text, racer.typing.typed.length, AMBUSH_WORDS), race, race.seed, now) : racer,
  );
  return { ...state, race: { ...race, racers, ambush: { racerId: ambusher.id, at: now } } };
}

/** How long the track announces a calling card. */
export const CALLING_CARD_ANNOUNCE_MS = 4_000;

/**
 * The last racer still typing sends their one calling card of the race to the leader (powers on only): the leader's
 * next words hide behind it for a moment (a bot leader types at half pace instead). Refused while the leader is already under a
 * spell or a card, so the leader takes one malus at a time.
 */
export function sendCallingCard(state: LobbyState, userId: string, now: number): Outcome {
  if (!isMember(state, userId)) return fail("notMember");
  const race = state.race;
  if (state.phase !== "racing" || !race || !race.settings.powers || now < race.startsAt) return fail("wrongPhase");
  const sender = race.racers.find((racer) => racer.id === userId);
  if (!sender || isOut(sender) || sender.cardSent) return fail("wrongPhase");
  const target = race.racers.find((racer) => racer.id === cardTarget(race, userId, now));
  if (!target) return fail("wrongPhase");

  const until = now + CALLING_CARD_HEX_MS;
  const racers = race.racers.map((racer) => {
    if (racer === sender) return { ...racer, cardSent: true };
    if (racer === target) return racer.bot ? slowBot(racer, race, now, CALLING_CARD_HEX_MS, BOT_HEX_SPEED) : { ...racer, card: { fromId: userId, until } };
    return racer;
  });
  const callingCards = [...race.callingCards, { id: race.callingCards.length + 1, fromId: userId, toId: target.id, at: now }];
  return ok({ ...state, race: { ...race, racers, callingCards } });
}

/** The leader `userId` may send a calling card to now, or null (also while the leader is under a malus). */
function cardTarget(race: Race, userId: string, now: number): string | null {
  const contenders = race.racers
    .filter((racer) => !isOut(racer))
    .map((racer) => ({ id: racer.id, progress: progress(racer.text, racer.typing.typed, race.settings.mode) }));
  const targetId = callingCardTarget(contenders, userId);
  return isUnderMalus(race.racers.find((racer) => racer.id === targetId), now) ? null : targetId;
}

/**
 * A bot cannot be frozen or blinded on screen, so a spell bends its planned keys instead: speed 0 stops it for `ms`
 * (a stun), a lower speed slows it down for `ms` (a hex or a calling card).
 */
function slowBot(target: Racer, race: Race, now: number, ms: number, speed: number): Racer {
  const { bot } = target;
  if (!bot) return target;
  return { ...target, bot: { ...bot, steps: slowBotSteps(bot.steps, bot.applied, now - race.startsAt, ms, speed) } };
}

/**
 * The effect of one spell on its target. A malus also marks the target's lane, for everyone, for as long as it lasts.
 * A bot whose text changed plans the rest of its race again.
 */
function applySpell(target: Racer, spell: Spell, race: Race, eventId: number, now: number): Racer {
  if (isSelfSpell(spell)) return castSpell(target, spell, race, eventId, now);
  return { ...castSpell(target, spell, race, eventId, now), mark: { element: spell.element, until: now + spellMarkMs(spell) } };
}

function castSpell(target: Racer, spell: Spell, race: Race, eventId: number, now: number): Racer {
  const { effect, element } = spell;
  if (effect.type === "stun") return target.bot ? slowBot(target, race, now, effect.ms, 0) : { ...target, stun: { element, until: now + effect.ms } };
  // Kouga's flash hides even the word being typed, so it stops a bot like a stun.
  if (effect.type === "hex")
    return target.bot
      ? slowBot(target, race, now, effect.ms, element === "bless" ? 0 : BOT_HEX_SPEED)
      : { ...target, hex: { element, until: now + effect.ms } };
  const text =
    effect.type === "shorten"
      ? removeLastWords(target.text, target.typing.typed.length, effect.words)
      : appendWords(target.text, race.text, race.seed + eventId, effect.words);
  return withText(target, text, race, race.seed + eventId, now);
}

/** Gives the racer a new text; a bot plans the rest of its race again. */
function withText(target: Racer, text: string, race: Race, seed: number, now: number): Racer {
  if (text === target.text) return target;
  if (!target.bot) return { ...target, text };
  const difficulty = target.bot.difficulty;
  const steps = replanBotRun(text, target.typing.typed, difficulty, seededRandom(seed), race.settings.mode, now - race.startsAt);
  return { ...target, text, bot: { difficulty, steps, applied: 0 } };
}

/** Applies time-based transitions: countdown end, race end and expired seats. Returns the same object when nothing changed. */
export function advance(state: LobbyState, now: number): LobbyState {
  let next = state;
  if (next.phase === "countdown" && next.race && now >= next.race.startsAt) next = { ...next, phase: "racing" };
  next = runBots(next, now);
  next = applyAmbush(next, now);
  next = applyCatchUp(next, now);
  if (next.phase === "racing" && isRaceOver(next, now)) next = finishRace(next, now);
  if (next.phase === "waiting" || next.phase === "finished") next = dropExpiredMembers(next, now);
  return next;
}

function isGone(member: Member | undefined, now: number, graceMs: number): boolean {
  if (!member || member.presence === "left") return true;
  return member.presence === "disconnected" && member.disconnectedAt !== null && now - member.disconnectedAt >= graceMs;
}

/**
 * Over at the time limit, once every racer finished, was eliminated, left or stayed disconnected past
 * the grace period, or once no player is left to race (or, in a bots-only race, to watch) the bots.
 */
export function isRaceOver(state: LobbyState, now: number): boolean {
  const race = state.race;
  if (!race) return false;
  if (now >= race.endsAt) return true;
  const graceMs = state.config.reconnectGraceMs;
  const memberOf = (racerId: string) => state.members.find((member) => member.id === racerId);
  // Spectators do not keep a race with human racers going: it stops once none of them is left. A bots-only race runs
  // while someone is still there to watch it.
  const humanRacers = race.racers.filter((racer) => racer.bot === null);
  const isAbandoned =
    humanRacers.length > 0
      ? humanRacers.every((racer) => isGone(memberOf(racer.id), now, graceMs))
      : state.members.every((member) => member.bot !== null || isGone(member, now, graceMs));
  if (isAbandoned) return true;
  return race.racers.every((racer) => isOut(racer) || isGone(memberOf(racer.id), now, graceMs));
}

function finishRace(state: LobbyState, now: number): LobbyState {
  const race = state.race;
  if (!race) return state;
  const endedAt = Math.min(now, race.endsAt);
  const details: Record<string, ResultDetails> = {};

  const racers = race.racers.map((racer): ResultRacer => {
    const { typing } = racer;
    const member = state.members.find((candidate) => candidate.id === racer.id);
    // Leaving, or staying disconnected past the grace period, counts as giving up (COURSE-08).
    const isGoneNow = racer.bot === null && isGone(member, now, state.config.reconnectGraceMs);
    const status: RacerStatus =
      typing.finishedAt !== null
        ? "finished"
        : racer.eliminatedAt !== null
          ? "eliminated"
          : racer.forfeitedAt !== null || isGoneNow
            ? "forfeited"
            : "timeout";
    const stoppedAt = typing.finishedAt ?? racer.eliminatedAt ?? racer.forfeitedAt ?? endedAt;
    const timeMs = Math.max(0, stoppedAt - race.startsAt);
    details[racer.id] = {
      durationMs: timeMs,
      keystrokes: typing.keystrokes,
      mistakes: typing.mistakes,
      speedSamples: racer.samples,
      keyStats: keyStats(racer.keys),
    };
    return {
      id: racer.id,
      name: racer.name,
      emblem: racer.emblem,
      character: racer.character,
      wpm: wordsPerMinute(netChars(racer.text, typing.typed, race.settings.mode), timeMs),
      rawWpm: wordsPerMinute(typing.keystrokes, timeMs),
      accuracy: accuracy(typing.keystrokes, typing.mistakes),
      mistakes: typing.mistakes,
      progress: progress(racer.text, typing.typed, race.settings.mode),
      bonuses: racer.bonuses,
      finishMs: typing.finishedAt === null ? null : timeMs,
      timeMs,
      status,
      samples: racer.samples,
    };
  });

  return {
    ...state,
    phase: "finished",
    race: { ...race, endedAt },
    result: { endedAt, racers: rankRacers(racers), details, events: replayEvents(race) },
    members: state.members.map((member) => ({ ...member, isReady: member.bot !== null })),
  };
}

/** The race's spells, calling cards and Ambush on one timeline, for the replay. */
function replayEvents(race: Race): ReplayEvent[] {
  const events: ReplayEvent[] = [
    ...race.bonusEvents.map((event): ReplayEvent => ({ type: "spell", atMs: event.at - race.startsAt, spell: event.spell, casterId: event.receiverId, targetId: event.targetId })),
    ...race.callingCards.map((card): ReplayEvent => ({ type: "card", atMs: card.at - race.startsAt, fromId: card.fromId, toId: card.toId })),
    ...(race.ambush ? [{ type: "ambush" as const, atMs: race.ambush.at - race.startsAt, racerId: race.ambush.racerId }] : []),
  ];
  return events.sort((a, b) => a.atMs - b.atMs);
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
  const end = typing.finishedAt ?? Math.min(now, race.endedAt ?? now, racer.eliminatedAt ?? now, racer.forfeitedAt ?? now);
  return wordsPerMinute(netChars(racer.text, typing.typed, race.settings.mode), end - race.startsAt);
}

/**
 * Racer ids by live place, like the final ranking: finishers by finish time, then racers still typing by progress,
 * then eliminated racers (the last one knocked out first), then forfeits by progress; ties keep join order.
 */
export function liveOrder(race: Race): string[] {
  const group = (racer: Racer) => (racer.typing.finishedAt !== null ? 0 : racer.eliminatedAt !== null ? 2 : racer.forfeitedAt !== null ? 3 : 1);
  return race.racers
    .map((racer, index) => ({ racer, index, group: group(racer), progress: progress(racer.text, racer.typing.typed, race.settings.mode) }))
    .sort((a, b) => {
      if (a.group !== b.group) return a.group - b.group;
      if (a.group === 0) return (a.racer.typing.finishedAt ?? 0) - (b.racer.typing.finishedAt ?? 0) || a.index - b.index;
      if (a.group === 2) return (b.racer.eliminatedAt ?? 0) - (a.racer.eliminatedAt ?? 0) || a.index - b.index;
      return b.progress - a.progress || a.index - b.index;
    })
    .map(({ racer }) => racer.id);
}

function raceView(state: LobbyState, race: Race, userId: string, now: number): RaceView {
  const order = liveOrder(race);
  const racers = race.racers.map(
    (racer): RaceRacer => ({
      id: racer.id,
      name: racer.name,
      emblem: racer.emblem,
      character: racer.character,
      progress: progress(racer.text, racer.typing.typed, race.settings.mode),
      wpm: liveWpm(racer, race, now),
      bonuses: racer.bonuses,
      mistakes: racer.typing.mistakes,
      isFinished: racer.typing.finishedAt !== null,
      isEliminated: racer.eliminatedAt !== null,
      isForfeited: racer.forfeitedAt !== null,
      place: order.indexOf(racer.id) + 1,
      mark: racer.mark && racer.mark.until > now ? racer.mark : null,
      isBot: racer.bot !== null,
      isConnected: state.members.some((member) => member.id === racer.id && member.presence === "connected"),
    }),
  );
  const own = race.racers.find((racer) => racer.id === userId);
  const nameOf = (racerId: string) => race.racers.find((racer) => racer.id === racerId)?.name ?? "";
  const characterOf = (racerId: string) => race.racers.find((racer) => racer.id === racerId)?.character ?? DEFAULT_CHARACTER;
  return {
    // Bonuses change texts per racer: each racer sees their own, spectators the original.
    text: own?.text ?? race.text,
    startsAt: race.startsAt,
    endsAt: race.endsAt,
    isTimed: race.settings.timeLimitSec !== null,
    mode: race.settings.mode,
    caseSensitive: race.settings.caseSensitive,
    bonusesOn: race.settings.powers,
    // Recent bonuses only: the track announces them for a few seconds.
    bonusEvents: race.bonusEvents
      .filter((event) => now - event.at < BONUS_ANNOUNCE_MS)
      .map((event) => {
        const caster = race.racers.find((racer) => racer.id === event.receiverId);
        const character = caster?.character ?? DEFAULT_CHARACTER;
        return {
          id: event.id,
          spell: event.spell,
          element: spellById(event.spell)?.element ?? "support",
          // The caster's own Persona casts whatever spell they drew.
          persona: characterPersonas[character],
          receiverId: event.receiverId,
          receiver: nameOf(event.receiverId),
          receiverCharacter: character,
          targetId: event.targetId,
          target: nameOf(event.targetId),
        };
      }),
    ambush: race.ambush ? { ...race.ambush, name: nameOf(race.ambush.racerId), character: characterOf(race.ambush.racerId) } : null,
    callingCards: race.callingCards
      .filter((card) => now - card.at < CALLING_CARD_ANNOUNCE_MS)
      .map((card) => ({ ...card, from: nameOf(card.fromId), fromCharacter: characterOf(card.fromId), to: nameOf(card.toId) })),
    racers,
    you: own
      ? {
          typed: own.typing.typed,
          keystrokes: own.typing.keystrokes,
          mistakes: own.typing.mistakes,
          streak: own.typing.streak,
          inputClient: own.inputClient,
          inputSeq: own.inputSeq,
          place: order.indexOf(userId) + 1,
          finishedAt: own.typing.finishedAt,
          eliminatedAt: own.eliminatedAt,
          forfeitedAt: own.forfeitedAt,
          hex: own.hex,
          stun: own.stun,
          card: own.card && own.card.until > now ? { from: nameOf(own.card.fromId), until: own.card.until } : null,
          canSendCard:
            state.phase === "racing" && race.settings.powers && !own.cardSent && !isOut(own) && cardTarget(race, userId, now) !== null,
          cardSent: own.cardSent,
        }
      : null,
  };
}

/** What one member sees; null when the user is not in the lobby. */
export function viewFor(state: LobbyState, userId: string, now: number): LobbyView | null {
  if (!isMember(state, userId)) return null;
  return {
    code: state.code,
    kind: state.kind,
    visibility: state.visibility,
    phase: state.phase,
    capacity: state.config.capacity,
    youId: userId,
    serverNow: now,
    players: activeMembers(state).map((member) => ({
      id: member.id,
      name: member.name,
      emblem: member.emblem,
      character: member.character,
      isHost: member.id === state.hostId,
      isReady: member.isReady,
      isConnected: member.presence === "connected",
      bot: member.bot,
      isSpectator: member.role === "spectator",
    })),
    race: state.race ? raceView(state, state.race, userId, now) : null,
    hasResult: state.result?.details[userId] !== undefined,
    settings: state.settings,
    messages: state.messages.map(({ id, authorId, author, text }) => ({ id, authorId, author, text })),
    // Tokens are secrets: only the host sees them. Addresses are never shown.
    invites:
      state.kind === "custom" && state.hostId === userId
        ? state.invites.map((invite) => ({ token: invite.token, usedBy: invite.usedBy?.name ?? null, isRevoked: invite.revoked }))
        : null,
  };
}

/** The last race's results from one racer's point of view. */
export function resultFor(state: LobbyState, userId: string): RaceResult | null {
  const details = state.result?.details[userId];
  if (!state.result || !details) return null;
  return { youId: userId, endedAt: state.result.endedAt, racers: state.result.racers, ...details, events: state.result.events };
}

/** Validates an input batch received from a client (`inputBatchSchema`, TECH-07); null when malformed. */
export function parseInputBatch(value: unknown): InputBatch | null {
  const result = inputBatchSchema.safeParse(value);
  return result.success ? result.data : null;
}
