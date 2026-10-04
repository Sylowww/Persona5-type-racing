import { describe, expect, it } from "vitest";
import {
  addBot,
  advance,
  applyInput,
  createLobby,
  isRaceOver,
  joinLobby,
  leaveLobby,
  liveOrder,
  parseInputBatch,
  removeBot,
  resultFor,
  sendMessage,
  publicLobbyFor,
  setConnected,
  setVisibility,
  setReady,
  startRace,
  updateSettings,
  viewFor,
  type LobbyState,
  type Outcome,
} from "../../src/lib/race-engine";
import type { InputEvent } from "../../src/types/race";

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
    expect(joinLobby(state, { id: "late", name: "late" }, T0)).toEqual({ ok: false, error: "lobbyFull" });

    const huge = createLobby({ code: "P5-TEST", locale: "en", host: { id: "a", name: "a" }, now: T0, config: { capacity: 500 } });
    expect(huge.config.capacity).toBe(60);
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
    expect(state.members.slice(1).map((member) => member.character)).toEqual(["joker", "violet"]);
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

describe("lobby visibility", () => {
  it("starts private and lets only the host make it public", () => {
    const state = lobbyWith("ann", "bob");
    expect(viewFor(state, "bob", T0)?.visibility).toBe("private");
    expect(publicLobbyFor(state)).toBeNull();
    expect(setVisibility(state, "bob", "public")).toEqual({ ok: false, error: "notHost" });
    expect(setVisibility(state, "ann", "secret")).toEqual({ ok: false, error: "invalidSettings" });

    const open = unwrap(setVisibility(state, "ann", "public"));
    expect(publicLobbyFor(open)).toMatchObject({ code: "P5-TEST", hostName: "ann", playerCount: 2, phase: "waiting" });
    expect(publicLobbyFor(unwrap(setVisibility(open, "ann", "private")))).toBeNull();
  });

  it("keeps quick and training lobbies private", () => {
    const training = createLobby({ code: "P5-SOLO", locale: "en", host: { id: "ann", name: "ann" }, now: T0, kind: "training" });
    expect(setVisibility(training, "ann", "public")).toEqual({ ok: false, error: "privateLobby" });
  });
});
