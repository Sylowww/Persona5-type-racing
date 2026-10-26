import { describe, expect, it } from "vitest";
import {
  addBot,
  advance,
  applyInput,
  closeLobby,
  createInvite,
  createLobby,
  forfeitRace,
  isRaceOver,
  joinLobby,
  joinWithInvite,
  kickMember,
  leaveLobby,
  liveOrder,
  parseInputBatch,
  removeBot,
  resultFor,
  sendMessage,
  publicLobbyFor,
  setConnected,
  setCapacity,
  setVisibility,
  setReady,
  startRace,
  updateSettings,
  viewFor,
  MAX_SPECTATORS,
  setRole,
  type LobbyState,
  type Outcome,
} from "../../src/lib/race-engine";
import type { CharacterId } from "../../src/types/character";
import type { InputEvent, SpellId } from "../../src/types/race";
import { seededRandom } from "../../src/lib/bots";
import { drawSpell } from "../../src/lib/spells";

const TEXT = "go now";
const T0 = 1_000_000;
const COUNTDOWN = 3_000;
const START = T0 + COUNTDOWN;

function unwrap(outcome: Outcome): LobbyState {
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.state;
}

function lobbyWith(...names: string[]): LobbyState {
  const [host, ...others] = names;
  let state = createLobby({ code: "P5-TEST", locale: "en", host: { id: host, name: host }, now: T0 });
  for (const name of others) state = unwrap(joinLobby(state, { id: name, name }, T0));
  for (const name of names) state = setConnected(state, name, true, T0);
  return state;
}

function readyAll(state: LobbyState): LobbyState {
  return state.members.reduce((next, member) => unwrap(setReady(next, member.id, true)), state);
}

/** A lobby whose race has just started (countdown over). */
function racing(...names: string[]): LobbyState {
  const state = unwrap(startRace(readyAll(lobbyWith(...names)), names[0], TEXT, T0));
  return advance(state, START);
}

function chars(text: string, delayMs = 100): InputEvent[] {
  return [...text].map((char) => ({ type: "char", char, delayMs }));
}

describe("lobby membership", () => {
  it("makes the creator host and adds players in join order", () => {
    const view = viewFor(lobbyWith("ann", "bob"), "bob", T0);
    expect(view?.players.map((player) => [player.name, player.isHost])).toEqual([
      ["ann", true],
      ["bob", false],
    ]);
    expect(view?.phase).toBe("waiting");
    expect(view?.capacity).toBe(30);
  });

  it("joining twice keeps a single seat", () => {
    const state = lobbyWith("ann", "bob");
    expect(unwrap(joinLobby(state, { id: "bob", name: "bob" }, T0)).members).toHaveLength(2);
  });

  it("uses a configurable capacity sized for a class", () => {
    let state = createLobby({ code: "P5-TEST", locale: "en", host: { id: "p0", name: "p0" }, now: T0, config: { capacity: 30 } });
    for (let index = 1; index < 30; index++) state = unwrap(joinLobby(state, { id: `p${index}`, name: `p${index}` }, T0));
    expect(state.members).toHaveLength(30);
    // Once the seats are taken, newcomers watch as spectators.
    const late = unwrap(joinLobby(state, { id: "late", name: "late" }, T0));
    expect(viewFor(late, "late", T0)?.players.find((player) => player.id === "late")?.isSpectator).toBe(true);

    const huge = createLobby({ code: "P5-TEST", locale: "en", host: { id: "a", name: "a" }, now: T0, config: { capacity: 500 } });
    expect(huge.config.capacity).toBe(30);
  });

  it("refuses to join a race in progress", () => {
    const state = unwrap(startRace(readyAll(lobbyWith("ann", "bob")), "ann", TEXT, T0));
    expect(joinLobby(state, { id: "cid", name: "cid" }, T0)).toEqual({ ok: false, error: "raceInProgress" });
  });

  it("passes host to the next player when the host leaves", () => {
    const state = leaveLobby(lobbyWith("ann", "bob", "cid"), "ann");
    expect(state.hostId).toBe("bob");
    expect(state.members.map((member) => member.id)).toEqual(["bob", "cid"]);
  });
});

describe("starting a race", () => {
  it("needs every player ready", () => {
    const state = unwrap(setReady(lobbyWith("ann", "bob"), "ann", true));
    expect(startRace(state, "ann", TEXT, T0)).toEqual({ ok: false, error: "notReady" });
  });

  it("needs at least two players", () => {
    expect(startRace(readyAll(lobbyWith("ann")), "ann", TEXT, T0)).toEqual({ ok: false, error: "notReady" });
  });

  it("only lets the host start", () => {
    expect(startRace(readyAll(lobbyWith("ann", "bob")), "bob", TEXT, T0)).toEqual({ ok: false, error: "notHost" });
  });

  it("runs a countdown shared by everyone, then opens the race", () => {
    const state = unwrap(startRace(readyAll(lobbyWith("ann", "bob")), "ann", TEXT, T0));
    expect(state.phase).toBe("countdown");
    expect(viewFor(state, "bob", T0)?.race?.startsAt).toBe(START);
    expect(advance(state, START - 1)).toBe(state);
    expect(advance(state, START).phase).toBe("racing");
  });
});

describe("typing during the race", () => {
  it("ignores input before the start", () => {
    const state = unwrap(startRace(readyAll(lobbyWith("ann", "bob")), "ann", TEXT, T0));
    expect(applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars("go") }, START - 10)).toBe(state);
  });

  it("tracks progress with the shared typing rules", () => {
    let state = racing("ann", "bob");
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: [...chars("gx"), { type: "delete" }, ...chars("o")] }, START + 1_000);
    const you = viewFor(state, "ann", START + 1_000)?.race?.you;
    expect(you).toMatchObject({ typed: "go", keystrokes: 3, mistakes: 1, inputSeq: 1, place: 1 });
    const bob = viewFor(state, "bob", START + 1_000)?.race?.racers.find((racer) => racer.id === "ann");
    expect(bob?.progress).toBeCloseTo(2 / 6);
    expect(bob?.mistakes).toBe(1);
  });

  it("applies a repeated batch only once", () => {
    let state = racing("ann", "bob");
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars("go") }, START + 500);
    const again = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars("go") }, START + 600);
    expect(again).toBe(state);
  });

  it("lets a reloaded page take over and ignores the old page's late batches", () => {
    let state = racing("ann", "bob");
    state = applyInput(state, "ann", { clientId: "old", seq: 1, events: chars("go") }, START + 500);
    state = applyInput(state, "ann", { clientId: "new", seq: 1, events: chars(" ") }, START + 900);
    // Sent by the old page before the reload but received after.
    state = applyInput(state, "ann", { clientId: "old", seq: 2, events: chars("xx") }, START + 1_000);
    state = applyInput(state, "ann", { clientId: "new", seq: 2, events: chars("n") }, START + 1_100);
    expect(viewFor(state, "ann", START + 1_100)?.race?.you).toMatchObject({ typed: "go n", inputClient: "new", inputSeq: 2 });
  });

  it("drops keystrokes faster than the speed limit", () => {
    const state = applyInput(racing("ann", "bob"), "ann", { clientId: "tab", seq: 1, events: chars("go now") }, START);
    // Budget at the start is one second of input (30 keys); raise the bar by using a tiny config instead.
    expect(state.race?.racers[0].typing.typed).toBe("go now");

    const strict = createLobby({ code: "P5-TEST", locale: "en", host: { id: "a", name: "a" }, now: T0, config: { maxKeysPerSecond: 2 } });
    let lobby = unwrap(joinLobby(strict, { id: "b", name: "b" }, T0));
    lobby = advance(unwrap(startRace(readyAll(lobby), "a", TEXT, T0)), START);
    lobby = applyInput(lobby, "a", { clientId: "tab", seq: 1, events: chars("go now") }, START);
    expect(lobby.race?.racers[0].typing.typed).toBe("go");
  });

  it("ranks finishers by finish time, then by progress", () => {
    let state = racing("ann", "bob", "cid");
    state = applyInput(state, "cid", { clientId: "tab", seq: 1, events: chars("go no") }, START + 1_000);
    state = applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 2_000);
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 3_000);
    expect(state.race && liveOrder(state.race)).toEqual(["bob", "ann", "cid"]);
    expect(viewFor(state, "ann", START + 3_000)?.race?.you?.place).toBe(2);
  });
});

describe("finishing a race", () => {
  it("finishes once every racer is done and ranks the results", () => {
    let state = racing("ann", "bob");
    state = applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 2_000);
    expect(advance(state, START + 2_000).phase).toBe("racing");
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: [...chars("gx"), { type: "delete" }, ...chars("o now")] }, START + 3_000);
    state = advance(state, START + 3_000);

    expect(state.phase).toBe("finished");
    expect(state.members.every((member) => !member.isReady)).toBe(true);
    const result = resultFor(state, "ann");
    expect(result?.racers.map((racer) => [racer.id, racer.finishMs])).toEqual([
      ["bob", 2_000],
      ["ann", 3_000],
    ]);
    expect(result?.racers[0].wpm).toBeCloseTo(6 / 5 / (2 / 60));
    expect(result).toMatchObject({ youId: "ann", durationMs: 3_000, keystrokes: 7, mistakes: 1 });
    expect(result?.keyStats.find((stat) => stat.key === "o")).toMatchObject({ mistakes: 1 });
    expect(viewFor(state, "ann", START + 3_000)?.hasResult).toBe(true);
    // Every racer's WPM series is in the results, for the shared chart (RES-03).
    expect(result?.racers.map((racer) => racer.samples.at(-1)?.atMs)).toEqual([2_000, 3_000]);
  });

  it("ends at the time limit and ranks unfinished racers as not finished", () => {
    let state = racing("ann", "bob");
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars("go") }, START + 1_000);
    const limit = state.race?.endsAt ?? 0;
    expect(isRaceOver(state, limit - 1)).toBe(false);
    state = advance(state, limit + 5_000);

    const result = resultFor(state, "bob");
    expect(state.phase).toBe("finished");
    expect(result?.racers.map((racer) => [racer.id, racer.finishMs])).toEqual([
      ["ann", null],
      ["bob", null],
    ]);
    expect(result?.durationMs).toBe(limit - START);
  });

  it("waits for a disconnected racer during the grace period", () => {
    let state = racing("ann", "bob");
    state = setConnected(state, "bob", false, START + 1_000);
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 2_000);

    expect(advance(state, START + 20_000).phase).toBe("racing");
    expect(advance(state, START + 31_000).phase).toBe("finished");
  });

  it("lets a racer reconnect and keep their progress", () => {
    let state = racing("ann", "bob");
    state = applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars("go") }, START + 1_000);
    state = setConnected(state, "bob", false, START + 1_500);
    state = setConnected(advance(state, START + 10_000), "bob", true, START + 10_000);

    expect(viewFor(state, "bob", START + 10_000)?.race?.you).toMatchObject({ typed: "go", inputSeq: 1 });
    expect(advance(state, START + 60_000).phase).toBe("racing");
  });

  it("keeps a racer who left in the results without waiting for them", () => {
    let state = racing("ann", "bob");
    state = leaveLobby(state, "ann");
    expect(state.hostId).toBe("bob");
    expect(viewFor(state, "ann", START)).toBeNull();

    state = advance(applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 2_000), START + 2_000);
    expect(state.phase).toBe("finished");
    expect(resultFor(state, "bob")?.racers.map((racer) => racer.id)).toEqual(["bob", "ann"]);
  });

  it("does not depend on the host staying connected", () => {
    let state = racing("ann", "bob");
    state = setConnected(state, "ann", false, START);
    state = advance(applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 2_000), START + 2_000);
    expect(state.phase).toBe("racing");
    expect(advance(state, START + 30_000).phase).toBe("finished");
  });
});

describe("forfeits and statuses (COURSE-07, COURSE-10, RES-02)", () => {
  it("lets a racer give up, ranks them after everyone still in, and ends once all are done", () => {
    let state = racing("ann", "bob", "cid");
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars("go n") }, START + 1_000);
    state = unwrap(forfeitRace(state, "ann", START + 1_500));
    expect(forfeitRace(state, "ann", START + 1_600)).toEqual({ ok: false, error: "wrongPhase" });
    expect(viewFor(state, "ann", START + 1_500)?.race?.you?.forfeitedAt).toBe(START + 1_500);
    // Typing after giving up is ignored.
    expect(applyInput(state, "ann", { clientId: "tab", seq: 2, events: chars("ow") }, START + 1_600)).toBe(state);

    state = applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars("g") }, START + 2_000);
    state = advance(applyInput(state, "cid", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 3_000), START + 3_000);
    expect(state.phase).toBe("racing");
    state = advance(state, state.race?.endsAt ?? 0);

    const racers = resultFor(state, "ann")?.racers ?? [];
    expect(racers.map((racer) => [racer.id, racer.status])).toEqual([
      ["cid", "finished"],
      ["bob", "timeout"],
      ["ann", "forfeited"],
    ]);
    const ann = racers.find((racer) => racer.id === "ann");
    expect(ann).toMatchObject({ timeMs: 1_500, mistakes: 0, finishMs: null });
    expect(ann?.progress).toBeCloseTo(4 / TEXT.length);
    expect(ann?.rawWpm).toBeCloseTo(4 / 5 / (1.5 / 60));
  });

  it("counts a racer gone past the grace period as a forfeit", () => {
    let state = racing("ann", "bob");
    state = setConnected(state, "bob", false, START);
    state = advance(applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 1_000), START + 31_000);
    expect(resultFor(state, "ann")?.racers.map((racer) => racer.status)).toEqual(["finished", "forfeited"]);
  });
});

describe("catch-up spells (BONUS-01 to BONUS-04)", () => {
  const LONG = "one two three four five six seven eight nine ten eleven twelve";
  const FIRST_CHECKPOINT = LONG.slice(0, 16);

  /** A race random whose seed makes bob draw `spell` at the first checkpoint (16 characters behind ann). */
  function randomFor(spell: SpellId): () => number {
    const gap = 16 / LONG.length;
    for (let step = 0; step < 5_000; step++) {
      const value = step / 5_000;
      if (drawSpell(gap, seededRandom(Math.floor(value * 2 ** 31) + 1)).id === spell) return () => value;
    }
    throw new Error(`no seed draws ${spell}`);
  }

  /** Ann leads; bob lags and draws `spell` when ann passes the first checkpoint. */
  function spellRace(spell: SpellId, character: CharacterId = "panther"): LobbyState {
    let state = createLobby({ code: "P5-TEST", locale: "en", host: { id: "ann", name: "ann" }, now: T0 });
    state = unwrap(joinLobby(state, { id: "bob", name: "bob", character }, T0));
    state = unwrap(updateSettings(state, "ann", { powers: true }));
    for (const id of ["ann", "bob"]) state = setConnected(state, id, true, T0);
    state = unwrap(startRace(readyAll(state), "ann", LONG, T0, randomFor(spell)));
    return advance(state, START);
  }

  const type = (state: LobbyState, userId: string, text: string, seq: number, at: number) =>
    advance(applyInput(state, userId, { clientId: "tab", seq, events: chars(text) }, at), at);
  const racerOf = (state: LobbyState, id: string) => state.race?.racers.find((racer) => racer.id === id);

  it("does nothing when powers are off", () => {
    let state = racing("ann", "bob");
    state = type(state, "ann", TEXT.slice(0, 3), 1, START + 1_000);
    expect(state.race?.bonusEvents).toEqual([]);
  });

  it("Garu blows words off the lagging racer's own text, cast by their character's Persona", () => {
    const state = type(spellRace("garu", "panther"), "ann", FIRST_CHECKPOINT, 1, START + 3_000);
    expect(racerOf(state, "bob")?.text).toBe("one two three four five six seven eight nine");
    expect(viewFor(state, "bob", START + 3_000)?.race?.text).toBe(racerOf(state, "bob")?.text);
    expect(viewFor(state, "ann", START + 3_000)?.race?.bonusEvents).toMatchObject([
      { spell: "garu", element: "wind", persona: "Carmen", receiver: "bob", target: "bob", receiverCharacter: "panther" },
    ]);
  });

  it("gives at most three spells per race", () => {
    let state = type(spellRace("garu"), "ann", FIRST_CHECKPOINT, 1, START + 3_000);
    state = type(state, "ann", LONG.slice(16, 50), 2, START + 8_000);
    expect(racerOf(state, "bob")?.bonuses).toBe(3);
    expect(state.race?.checkpoints).toBe(3);
  });

  it("Zio stuns the leader: their keys do nothing for a moment", () => {
    const state = type(spellRace("zio"), "ann", FIRST_CHECKPOINT, 1, START + 3_000);
    expect(racerOf(state, "ann")?.stun).toEqual({ element: "elec", until: START + 4_500 });
    // Everyone sees the shocked lane while it lasts.
    expect(viewFor(state, "bob", START + 3_000)?.race?.racers.find((racer) => racer.id === "ann")?.mark).toEqual({ element: "elec", until: START + 4_500 });
    expect(viewFor(state, "bob", START + 4_600)?.race?.racers.find((racer) => racer.id === "ann")?.mark).toBeNull();
    const stunned = type(state, "ann", "x", 2, START + 3_500);
    expect(racerOf(stunned, "ann")).toMatchObject({ inputSeq: 2, typing: { typed: FIRST_CHECKPOINT } });
    expect(racerOf(type(state, "ann", LONG[16], 2, START + 4_600), "ann")?.typing.typed).toBe(LONG.slice(0, 17));
  });

  it("Frei adds words to the leader's text, and progress follows it (BONUS-04)", () => {
    const state = type(spellRace("frei"), "ann", FIRST_CHECKPOINT, 1, START + 3_000);
    const ann = racerOf(state, "ann");
    expect(ann?.text.startsWith(LONG)).toBe(true);
    expect(ann?.text.split(" ")).toHaveLength(15);
    expect(viewFor(state, "bob", START + 3_000)?.race?.racers.find((racer) => racer.id === "ann")?.progress).toBeCloseTo(16 / (ann?.text.length ?? 1));
  });

  it("Agi hides the leader's next words for a few seconds", () => {
    const state = type(spellRace("agi"), "ann", FIRST_CHECKPOINT, 1, START + 3_000);
    expect(viewFor(state, "ann", START + 3_000)?.race?.you?.hex).toEqual({ element: "fire", until: START + 7_000 });
  });

  it("hands out three spells at most per checkpoint and a single malus on the leader", () => {
    for (let seed = 0; seed < 20; seed++) {
      let state = unwrap(updateSettings(lobbyWith("ann", "bob", "cid", "dan", "eve"), "ann", { powers: true }));
      state = advance(unwrap(startRace(readyAll(state), "ann", LONG, T0, () => seed / 20)), START);
      state = type(state, "ann", FIRST_CHECKPOINT, 1, START + 3_000);
      const events = state.race?.bonusEvents ?? [];
      expect(events).toHaveLength(3);
      expect(events.filter((event) => event.targetId === "ann").length).toBeLessThanOrEqual(1);
    }
  });

  it("lets a bot draw a spell and still finish its race", () => {
    let state = unwrap(updateSettings(lobbyWith("ann"), "ann", { powers: true }));
    state = unwrap(addBot(unwrap(setReady(state, "ann", true)), "ann", "novice"));
    state = advance(unwrap(startRace(state, "ann", LONG, T0, () => 0.5)), START);
    state = type(state, "ann", LONG.slice(0, 20), 1, START + 1_000);
    const bot = state.race?.racers.find((racer) => racer.bot !== null);
    expect(bot?.bonuses).toBe(1);

    state = advance(unwrap(forfeitRace(state, "ann", START + 2_000)), START + 120_000);
    expect(resultFor(state, "ann")?.racers.find((racer) => racer.id === bot?.id)).toMatchObject({ status: "finished", bonuses: 1 });
  });
});

describe("after a race", () => {
  function finished(): LobbyState {
    let state = racing("ann", "bob");
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 1_000);
    state = applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars(TEXT) }, START + 2_000);
    return advance(state, START + 2_000);
  }

  it("goes back to the waiting room on the next ready and keeps the results", () => {
    const state = unwrap(setReady(finished(), "bob", true));
    expect(state.phase).toBe("waiting");
    expect(state.race).toBeNull();
    expect(resultFor(state, "bob")?.racers).toHaveLength(2);
  });

  it("lets new players join for the rematch", () => {
    const state = unwrap(joinLobby(finished(), { id: "cid", name: "cid" }, START + 3_000));
    expect(state.phase).toBe("waiting");
    expect(state.members).toHaveLength(3);
  });
});

describe("disconnects in the waiting room", () => {
  it("frees the seat after the grace period and moves the host", () => {
    let state = setConnected(lobbyWith("ann", "bob"), "ann", false, T0);
    expect(advance(state, T0 + 29_000)).toBe(state);
    state = advance(state, T0 + 30_000);
    expect(state.members.map((member) => member.id)).toEqual(["bob"]);
    expect(state.hostId).toBe("bob");
  });

  it("keeps the seat of a player who reconnects in time", () => {
    let state = setConnected(lobbyWith("ann", "bob"), "bob", false, T0);
    state = setConnected(state, "bob", true, T0 + 10_000);
    expect(advance(state, T0 + 60_000).members).toHaveLength(2);
  });
});

describe("characters", () => {
  it("races each player as their character, Joker by default", () => {
    let state = createLobby({ code: "P5-TEST", locale: "en", host: { id: "ann", name: "ann", character: "mona" }, now: T0 });
    state = unwrap(joinLobby(state, { id: "bob", name: "bob" }, T0));
    state = advance(unwrap(startRace(readyAll(state), "ann", TEXT, T0)), START);
    const racers = viewFor(state, "bob", START)?.race?.racers ?? [];
    expect(racers.map((racer) => racer.character)).toEqual(["mona", "joker"]);
  });

  it("gives bots a random character", () => {
    let state = unwrap(addBot(lobbyWith("ann"), "ann", "rookie", () => 0));
    state = unwrap(addBot(state, "ann", "rookie", () => 0.99));
    expect(state.members.slice(1).map((member) => member.character)).toEqual(["joker", "sophia"]);
  });
});

describe("bots", () => {
  /** Always the middle of the range: plans are reproducible. */
  const steady = () => 0.5;

  it("lets the host add bots of different difficulties, always ready", () => {
    let state = lobbyWith("ann", "bob");
    state = unwrap(addBot(state, "ann", "rookie"));
    state = unwrap(addBot(state, "ann", "godspeed"));
    const players = viewFor(state, "bob", T0)?.players ?? [];
    expect(players.map((player) => player.bot)).toEqual([null, null, "rookie", "godspeed"]);
    expect(players.filter((player) => player.bot).every((player) => player.isReady && player.isConnected && !player.isHost)).toBe(true);
    expect(new Set(players.map((player) => player.name)).size).toBe(4);
  });

  it("only lets the host add or remove bots, outside races", () => {
    const state = unwrap(addBot(lobbyWith("ann", "bob"), "ann", "master"));
    const botId = state.members[2].id;
    expect(addBot(state, "bob", "master")).toEqual({ ok: false, error: "notHost" });
    expect(removeBot(state, "bob", botId)).toEqual({ ok: false, error: "notHost" });
    expect(removeBot(state, "ann", "bob")).toEqual({ ok: false, error: "notMember" });
    expect(unwrap(removeBot(state, "ann", botId)).members.map((member) => member.id)).toEqual(["ann", "bob"]);

    const started = unwrap(startRace(readyAll(state), "ann", TEXT, T0, steady));
    expect(addBot(started, "ann", "rookie")).toEqual({ ok: false, error: "wrongPhase" });
  });

  it("counts bots against the capacity", () => {
    let state = createLobby({ code: "P5-TEST", locale: "en", host: { id: "ann", name: "ann" }, now: T0, config: { capacity: 2 } });
    state = unwrap(addBot(state, "ann", "rookie"));
    expect(addBot(state, "ann", "rookie")).toEqual({ ok: false, error: "lobbyFull" });
  });

  it("lets a single player race a bot, which types on its own and finishes", () => {
    let state = unwrap(addBot(lobbyWith("ann"), "ann", "godspeed"));
    state = advance(unwrap(startRace(readyAll(state), "ann", TEXT, T0, steady)), START);
    const botId = state.members[1].id;

    state = advance(state, START + 1_500);
    const midway = viewFor(state, "ann", START + 1_500)?.race?.racers.find((racer) => racer.id === botId);
    expect(midway?.isBot).toBe(true);
    expect(midway?.progress).toBeGreaterThan(0);

    state = advance(state, START + 60_000);
    expect(state.phase).toBe("racing");
    state = advance(applyInput(state, "ann", { clientId: "a", seq: 1, events: chars(TEXT) }, START + 61_000), START + 61_000);
    expect(state.phase).toBe("finished");
    expect(resultFor(state, "ann")?.racers.map((racer) => racer.id)).toEqual([botId, "ann"]);
  });

  it("ends the race once no player is left to race the bots, then closes the lobby", () => {
    let state = unwrap(addBot(lobbyWith("ann"), "ann", "rookie"));
    state = advance(unwrap(startRace(readyAll(state), "ann", TEXT, T0, steady)), START);
    state = advance(leaveLobby(state, "ann"), START + 100);
    expect(state.phase).toBe("finished");
    expect(state.members).toEqual([]);
  });

  it("removes bots when the last player leaves the waiting room", () => {
    const state = unwrap(addBot(lobbyWith("ann"), "ann", "master"));
    expect(leaveLobby(state, "ann").members).toEqual([]);
  });

  it("keeps bots ready for the rematch", () => {
    let state = unwrap(addBot(lobbyWith("ann"), "ann", "godspeed"));
    state = advance(unwrap(startRace(readyAll(state), "ann", TEXT, T0, steady)), START);
    state = advance(applyInput(state, "ann", { clientId: "a", seq: 1, events: chars(TEXT) }, START + 60_000), START + 60_000);
    state = unwrap(setReady(state, "ann", true));
    expect(state.phase).toBe("waiting");
    expect(state.members.map((member) => member.isReady)).toEqual([true, true]);
  });
});

describe("bot characters", () => {
  it("races as the character the host picked, or a random one", () => {
    const picked = unwrap(addBot(lobbyWith("ann"), "ann", "master", () => 0, "panther"));
    expect(picked.members.find((member) => member.bot !== null)?.character).toBe("panther");
    const random = unwrap(addBot(lobbyWith("ann"), "ann", "master", () => 0));
    expect(random.members.find((member) => member.bot !== null)?.character).toBeDefined();
  });
});

describe("parseInputBatch", () => {
  it("accepts well-formed batches", () => {
    expect(parseInputBatch({ clientId: "tab", seq: 2, events: [{ type: "char", char: "é", delayMs: 80 }, { type: "delete" }] })).toEqual({
      clientId: "tab",
      seq: 2,
      events: [{ type: "char", char: "é", delayMs: 80 }, { type: "delete" }],
    });
  });

  it("rejects malformed batches", () => {
    expect(parseInputBatch(null)).toBeNull();
    expect(parseInputBatch({ clientId: "tab", seq: 0, events: [] })).toBeNull();
    expect(parseInputBatch({ seq: 1, events: [] })).toBeNull();
    expect(parseInputBatch({ clientId: "tab", seq: 1, events: [{ type: "char", char: "ab", delayMs: 1 }] })).toBeNull();
    expect(parseInputBatch({ clientId: "tab", seq: 1, events: [{ type: "paste", char: "a" }] })).toBeNull();
    expect(parseInputBatch({ clientId: "tab", seq: 1, events: Array.from({ length: 201 }, () => ({ type: "delete" })) })).toBeNull();
  });
});

describe("race settings", () => {
  it("lets only the host change the rules, with valid values, while waiting", () => {
    const state = lobbyWith("ann", "bob");
    expect(updateSettings(state, "bob", { mode: "suddenDeath" })).toEqual({ ok: false, error: "notHost" });
    expect(updateSettings(state, "ann", { timeLimitSec: 7 })).toEqual({ ok: false, error: "invalidSettings" });

    const updated = unwrap(updateSettings(state, "ann", { mode: "suddenDeath", timeLimitSec: 30 }));
    expect(viewFor(updated, "bob", T0)?.settings).toMatchObject({ mode: "suddenDeath", timeLimitSec: 30 });
    expect(updateSettings(racing("ann", "bob"), "ann", { numbers: true })).toEqual({ ok: false, error: "wrongPhase" });
  });

  it("defaults the text language to the host's interface language", () => {
    const french = createLobby({ code: "P5-TEST", locale: "fr", host: { id: "ann", name: "ann" }, now: T0 });
    const english = createLobby({ code: "P5-TEST", locale: "en", host: { id: "ann", name: "ann" }, now: T0 });
    expect(french.settings.language).toBe("fr");
    expect(english.settings.language).toBe("en");
  });

  it("uses the chosen time limit, or a long safety cap without one", () => {
    const timed = unwrap(updateSettings(readyAll(lobbyWith("ann", "bob")), "ann", { timeLimitSec: 30 }));
    const race = unwrap(startRace(timed, "ann", TEXT, T0)).race;
    expect(race?.endsAt).toBe(START + 30_000);

    const untimed = unwrap(updateSettings(readyAll(lobbyWith("ann", "bob")), "ann", { timeLimitSec: null }));
    const view = viewFor(advance(unwrap(startRace(untimed, "ann", TEXT, T0)), START), "ann", START);
    expect(view?.race?.isTimed).toBe(false);
    expect(view?.race?.endsAt).toBeGreaterThan(START + 180_000);
  });

  it("accepts letters in the wrong case when case does not matter", () => {
    const lobby = unwrap(updateSettings(readyAll(lobbyWith("ann", "bob")), "ann", { caseSensitive: false }));
    let state = advance(unwrap(startRace(lobby, "ann", "Go now", T0)), START);
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars("go NOW") }, START + 1_000);
    expect(viewFor(state, "ann", START + 1_000)?.race?.you).toMatchObject({ typed: "Go now", mistakes: 0 });
  });

  it("eliminates a racer at their first mistake in sudden death and ranks them last", () => {
    const lobby = unwrap(updateSettings(readyAll(lobbyWith("ann", "bob", "cid")), "ann", { mode: "suddenDeath" }));
    let state = advance(unwrap(startRace(lobby, "ann", TEXT, T0)), START);
    state = applyInput(state, "ann", { clientId: "tab", seq: 1, events: chars("gx now") }, START + 1_000);
    state = applyInput(state, "bob", { clientId: "tab", seq: 1, events: chars("go x") }, START + 2_000);

    const view = viewFor(state, "ann", START + 2_000);
    expect(view?.race?.you).toMatchObject({ typed: "gx", eliminatedAt: START + 1_000 });
    expect(view?.race?.racers.map((racer) => racer.isEliminated)).toEqual([true, true, false]);
    expect(view?.race?.you?.place).toBe(3);

    state = advance(applyInput(state, "cid", { clientId: "tab", seq: 1, events: chars("go") }, START + 3_000), START + 3_000);
    expect(state.phase).toBe("racing");
    state = advance(applyInput(state, "cid", { clientId: "tab", seq: 2, events: chars(" now") }, START + 4_000), START + 4_000);
    expect(state.phase).toBe("finished");
    expect(resultFor(state, "ann")?.racers.map((racer) => racer.id)).toEqual(["cid", "bob", "ann"]);
    expect(resultFor(state, "ann")?.durationMs).toBe(1_000);
  });
});

describe("lobby chat", () => {
  it("shares cleaned messages with every member", () => {
    const state = unwrap(sendMessage(lobbyWith("ann", "bob"), "bob", "  too   slow ", T0));
    expect(viewFor(state, "ann", T0)?.messages).toEqual([{ id: "1", authorId: "bob", author: "bob", text: "too slow" }]);
  });

  it("refuses non-members, empty messages and spam", () => {
    const state = unwrap(sendMessage(lobbyWith("ann", "bob"), "ann", "hi", T0));
    expect(sendMessage(state, "eve", "hi", T0)).toEqual({ ok: false, error: "notMember" });
    expect(sendMessage(state, "bob", "   ", T0)).toEqual({ ok: false, error: "invalidMessage" });
    expect(sendMessage(state, "ann", "again", T0 + 100)).toEqual({ ok: false, error: "tooFast" });
    expect(sendMessage(state, "ann", "again", T0 + 1_000).ok).toBe(true);
  });

  it("keeps only the latest messages", () => {
    let state = lobbyWith("ann");
    for (let index = 0; index < 60; index++) state = unwrap(sendMessage(state, "ann", `m${index}`, T0 + index * 1_000));
    const messages = viewFor(state, "ann", T0)?.messages ?? [];
    expect(messages).toHaveLength(50);
    expect(messages.at(-1)).toMatchObject({ id: "60", text: "m59" });
  });
});

describe("spectators", () => {
  it("lets a member switch to spectating and back while a seat is free", () => {
    let state = lobbyWith("ann", "bob");
    state = unwrap(setReady(state, "bob", true));
    state = unwrap(setRole(state, "bob", "spectator"));
    const bob = viewFor(state, "ann", T0)?.players.find((player) => player.id === "bob");
    expect(bob).toMatchObject({ isSpectator: true, isReady: false });
    expect(setReady(state, "bob", true)).toEqual({ ok: false, error: "wrongPhase" });
    expect(setRole(state, "bob", "referee")).toEqual({ ok: false, error: "invalidSettings" });

    const full = unwrap(setCapacity(unwrap(joinLobby(state, { id: "cid", name: "cid" }, T0)), "ann", 2));
    expect(setRole(full, "bob", "player")).toEqual({ ok: false, error: "lobbyFull" });
    expect(unwrap(setRole(state, "bob", "player")).members.find((member) => member.id === "bob")?.role).toBe("player");
  });

  it("does not count spectators as racers, seats or starters", () => {
    let state = lobbyWith("ann", "bob", "cid");
    state = unwrap(setRole(state, "ann", "spectator"));
    state = unwrap(setReady(unwrap(setReady(state, "bob", true)), "cid", true));
    const started = unwrap(startRace(state, "ann", TEXT, T0));
    expect(started.race?.racers.map((racer) => racer.id)).toEqual(["bob", "cid"]);
    expect(viewFor(advance(started, START), "ann", START)?.race?.you).toBeNull();
    expect(publicLobbyFor(unwrap(setVisibility(state, "ann", "public")))?.playerCount).toBe(2);
  });

  it("ends the race once no human racer is left, even with spectators watching", () => {
    let state = lobbyWith("ann", "bob");
    state = unwrap(setRole(state, "bob", "spectator"));
    state = unwrap(addBot(unwrap(setReady(state, "ann", true)), "ann", "rookie"));
    state = advance(unwrap(startRace(state, "ann", TEXT, T0)), START);
    expect(isRaceOver(leaveLobby(state, "ann"), START)).toBe(true);
  });

  it("lets a spectating host start a bots-only race, which runs while someone watches", () => {
    let state = unwrap(setRole(lobbyWith("ann"), "ann", "spectator"));
    state = unwrap(addBot(unwrap(addBot(state, "ann", "rookie")), "ann", "master"));
    const started = advance(unwrap(startRace(state, "ann", TEXT, T0)), START);
    expect(started.race?.racers.every((racer) => racer.bot !== null)).toBe(true);
    expect(isRaceOver(started, START)).toBe(false);
    expect(isRaceOver(leaveLobby(started, "ann"), START)).toBe(true);
  });

  it("hands the host role to a spectator when the host leaves", () => {
    const state = unwrap(setRole(lobbyWith("ann", "bob"), "bob", "spectator"));
    expect(viewFor(leaveLobby(state, "ann"), "bob", T0)?.players.find((player) => player.id === "bob")?.isHost).toBe(true);
  });
});

describe("invite links", () => {
  const privateLobby = () => unwrap(createInvite(unwrap(setVisibility(lobbyWith("ann"), "ann", "private")), "ann", "tok-1"));

  it("lets only the host create links, shown to the host only", () => {
    const state = lobbyWith("ann", "bob");
    expect(createInvite(state, "bob", "x")).toEqual({ ok: false, error: "notHost" });
    const invited = unwrap(createInvite(state, "ann", "tok-1"));
    expect(viewFor(invited, "ann", T0)?.invites).toEqual([{ token: "tok-1", usedBy: null, isRevoked: false }]);
    expect(viewFor(invited, "bob", T0)?.invites).toBeNull();
  });

  it("lets the first person in, even in a private lobby, and binds the link to their address", () => {
    const state = unwrap(joinWithInvite(privateLobby(), { id: "bob", name: "bob" }, "tok-1", "1.1.1.1", T0));
    expect(viewFor(state, "bob", T0)).not.toBeNull();
    expect(viewFor(state, "ann", T0)?.invites).toEqual([{ token: "tok-1", usedBy: "bob", isRevoked: false }]);

    // Anyone else, from another address, is refused; the same address may come back.
    expect(joinWithInvite(state, { id: "cid", name: "cid" }, "tok-1", "2.2.2.2", T0)).toEqual({ ok: false, error: "inviteUsed" });
    const left = leaveLobby(state, "bob");
    expect(joinWithInvite(left, { id: "bob", name: "bob" }, "tok-1", "1.1.1.1", T0).ok).toBe(true);
    expect(joinWithInvite(left, { id: "bob", name: "bob" }, "nope", "1.1.1.1", T0)).toEqual({ ok: false, error: "invalidInvite" });
  });

  it("revokes the link of a kicked player", () => {
    const joined = unwrap(joinWithInvite(privateLobby(), { id: "bob", name: "bob" }, "tok-1", "1.1.1.1", T0));
    const kicked = unwrap(kickMember(joined, "ann", "bob"));
    expect(viewFor(kicked, "ann", T0)?.invites?.[0].isRevoked).toBe(true);
    expect(joinWithInvite(kicked, { id: "bob", name: "bob" }, "tok-1", "1.1.1.1", T0)).toEqual({ ok: false, error: "invalidInvite" });
  });

  it("does not bind the link when joining fails", () => {
    const racingLobby = unwrap(createInvite(racing("ann", "bob"), "ann", "tok-1"));
    expect(joinWithInvite(racingLobby, { id: "cid", name: "cid" }, "tok-1", "1.1.1.1", START)).toEqual({ ok: false, error: "raceInProgress" });
    expect(racingLobby.invites[0].usedBy).toBeNull();
  });
});

describe("closing a lobby", () => {
  it("lets only the host close it, outside a race", () => {
    const state = lobbyWith("ann", "bob");
    expect(closeLobby(state, "bob")).toEqual({ ok: false, error: "notHost" });
    expect(unwrap(closeLobby(state, "ann")).members).toEqual([]);
    expect(closeLobby(racing("ann", "bob"), "ann")).toEqual({ ok: false, error: "wrongPhase" });
  });
});

describe("kicking players", () => {
  it("lets only the host remove another player, who cannot come back", () => {
    const state = lobbyWith("ann", "bob", "cid");
    expect(kickMember(state, "bob", "cid")).toEqual({ ok: false, error: "notHost" });
    expect(kickMember(state, "ann", "ann")).toEqual({ ok: false, error: "notMember" });
    expect(kickMember(state, "ann", "zed")).toEqual({ ok: false, error: "notMember" });

    const kicked = unwrap(kickMember(state, "ann", "bob"));
    expect(viewFor(kicked, "bob", T0)).toBeNull();
    expect(viewFor(kicked, "ann", T0)?.players.map((player) => player.id)).toEqual(["ann", "cid"]);
    expect(joinLobby(kicked, { id: "bob", name: "bob" }, T0)).toEqual({ ok: false, error: "kicked" });
  });

  it("keeps a kicked racer in the race results as not finished", () => {
    const state = unwrap(kickMember(racing("ann", "bob", "cid"), "ann", "bob"));
    expect(state.race?.racers.map((racer) => racer.id)).toContain("bob");
    expect(isRaceOver(state, START)).toBe(false);
  });
});

describe("lobby capacity", () => {
  it("lets only the host set 2 to 30 seats, never below the players already in", () => {
    const state = lobbyWith("ann", "bob", "cid");
    expect(unwrap(setCapacity(state, "ann", 12)).config.capacity).toBe(12);
    expect(viewFor(unwrap(setCapacity(state, "ann", 3)), "bob", T0)?.capacity).toBe(3);
    expect(setCapacity(state, "bob", 12)).toEqual({ ok: false, error: "notHost" });
    expect(setCapacity(state, "ann", 2)).toEqual({ ok: false, error: "invalidSettings" });
    expect(setCapacity(state, "ann", 31)).toEqual({ ok: false, error: "invalidSettings" });
    expect(setCapacity(state, "ann", 4.5)).toEqual({ ok: false, error: "invalidSettings" });
    expect(setCapacity(state, "ann", "10")).toEqual({ ok: false, error: "invalidSettings" });
  });

  it("seats newcomers as spectators once the seats are taken, up to the spectator limit", () => {
    let state = unwrap(setCapacity(lobbyWith("ann", "bob"), "ann", 2));
    for (let index = 0; index < MAX_SPECTATORS; index++) state = unwrap(joinLobby(state, { id: `s${index}`, name: `s${index}` }, T0));
    expect(state.members.filter((member) => member.role === "spectator")).toHaveLength(MAX_SPECTATORS);
    expect(joinLobby(state, { id: "late", name: "late" }, T0)).toEqual({ ok: false, error: "lobbyFull" });
  });
});

describe("lobby visibility", () => {
  it("starts joinable with the code and lets only the host change who can join", () => {
    const state = lobbyWith("ann", "bob");
    expect(viewFor(state, "bob", T0)?.visibility).toBe("code");
    expect(publicLobbyFor(state)).toBeNull();
    expect(setVisibility(state, "bob", "public")).toEqual({ ok: false, error: "notHost" });
    expect(setVisibility(state, "ann", "secret")).toEqual({ ok: false, error: "invalidSettings" });

    const open = unwrap(setVisibility(state, "ann", "public"));
    expect(publicLobbyFor(open)).toMatchObject({ code: "P5-TEST", hostName: "ann", playerCount: 2, phase: "waiting" });
    expect(publicLobbyFor(unwrap(setVisibility(open, "ann", "code")))).toBeNull();
    expect(publicLobbyFor(unwrap(setVisibility(open, "ann", "private")))).toBeNull();
  });

  it("refuses code joins to private lobbies, which need an invite link", () => {
    const state = unwrap(setVisibility(lobbyWith("ann"), "ann", "private"));
    expect(joinLobby(state, { id: "bob", name: "bob" }, T0)).toEqual({ ok: false, error: "privateLobby" });
    expect(joinLobby(unwrap(setVisibility(state, "ann", "code")), { id: "bob", name: "bob" }, T0).ok).toBe(true);
  });

  it("keeps quick and training lobbies private", () => {
    const training = createLobby({ code: "P5-SOLO", locale: "en", host: { id: "ann", name: "ann" }, now: T0, kind: "training" });
    expect(setVisibility(training, "ann", "public")).toEqual({ ok: false, error: "privateLobby" });
  });
});
