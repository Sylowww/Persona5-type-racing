import { beforeEach, describe, expect, it } from "vitest";
import { createLobbyStore, type LobbyStore } from "../../src/lib/lobby-store";
import { raceTexts } from "../../src/lib/race-texts";
import type { LobbyView } from "../../src/types/lobby";
import type { InputEvent } from "../../src/types/race";

const ann = { id: "ann", name: "ann" };
const bob = { id: "bob", name: "bob" };

let clock: number;
let store: LobbyStore;

beforeEach(() => {
  clock = 1_000_000;
  let draws = 0;
  store = createLobbyStore({ now: () => clock, randomInt: (max) => draws++ % max, tickMs: null });
});

/** Subscribes and records every view received. */
function listen(code: string, userId: string) {
  const views: (LobbyView | null)[] = [];
  const unsubscribe = store.subscribe(code, userId, (view) => views.push(view));
  return { views, last: () => views.at(-1), unsubscribe: unsubscribe ?? (() => {}) };
}

function chars(text: string): InputEvent[] {
  return [...text].map((char) => ({ type: "char", char, delayMs: 50 }));
}

/** Two connected players in a lobby, both ready. */
function readyLobby() {
  const code = store.create(ann, "en");
  expect(store.join(code, bob)).toBeNull();
  const annStream = listen(code, "ann");
  const bobStream = listen(code, "bob");
  store.setReady(code, "ann", true);
  store.setReady(code, "bob", true);
  return { code, annStream, bobStream };
}

describe("lobby store", () => {
  it("creates lobbies with unique codes", () => {
    const first = store.create(ann, "en");
    const second = store.create(bob, "fr");
    expect(first).toBe("P5-ABCD");
    expect(second).not.toBe(first);
  });

  it("reports unknown lobbies and keeps players in one lobby at a time", () => {
    expect(store.join("P5-ZZZZ", bob)).toBe("lobbyNotFound");
    const first = store.create(ann, "en");
    store.join(first, bob);
    const second = store.create(bob, "en");
    expect(store.lobbyOf("bob")).toBe(second);
    expect(store.view(first, "bob")).toBeNull();
  });

  it("does not let non-members subscribe", () => {
    const code = store.create(ann, "en");
    expect(store.subscribe(code, "bob", () => {})).toBeNull();
  });

  it("pushes membership and readiness to every subscriber", () => {
    const { annStream } = readyLobby();
    expect(annStream.last()?.players.map((player) => [player.name, player.isReady, player.isConnected])).toEqual([
      ["ann", true, true],
      ["bob", true, true],
    ]);
  });

  it("runs the countdown and race on server time, then shares results", () => {
    const { code, annStream, bobStream } = readyLobby();
    expect(store.start(code, "bob")).toBe("notHost");
    expect(store.start(code, "ann")).toBeNull();
    expect(bobStream.last()?.phase).toBe("countdown");

    const race = bobStream.last()?.race;
    const text = race?.text ?? "";
    expect(raceTexts.en).toContain(text);
    const startsAt = race?.startsAt ?? 0;
    clock = startsAt;
    store.tick();
    expect(annStream.last()?.phase).toBe("racing");

    // Typing progress is batched until the next tick.
    clock += 1_000;
    const before = bobStream.views.length;
    expect(store.input(code, "ann", { clientId: "tab", seq: 1, events: chars(text.slice(0, 10)) })).toBeNull();
    expect(bobStream.views.length).toBe(before);
    store.tick();
    expect(bobStream.last()?.race?.racers[0].progress).toBeCloseTo(10 / text.length);

    clock += 20_000;
    store.input(code, "ann", { clientId: "tab", seq: 2, events: chars(text.slice(10)) });
    store.input(code, "bob", { clientId: "tab", seq: 1, events: chars(text) });
    expect(annStream.last()?.phase).toBe("finished");
    expect(bobStream.last()?.hasResult).toBe(true);
    expect(store.result(code, "bob")?.racers.map((racer) => racer.id)).toEqual(["ann", "bob"]);
  });

  it("keeps a player through a short disconnect and frees the seat after the grace period", () => {
    const { code, bobStream } = readyLobby();
    bobStream.unsubscribe();
    expect(store.view(code, "ann")?.players[1].isConnected).toBe(false);

    clock += 10_000;
    const again = listen(code, "bob");
    expect(again.last()?.players[1]).toMatchObject({ name: "bob", isConnected: true, isReady: true });

    again.unsubscribe();
    clock += 30_000;
    store.tick();
    expect(store.view(code, "bob")).toBeNull();
    expect(store.view(code, "ann")?.players).toHaveLength(1);
  });

  it("counts several tabs of the same player as one connection", () => {
    const { code, bobStream } = readyLobby();
    const secondTab = listen(code, "bob");
    expect(secondTab.last()?.youId).toBe("bob");
    bobStream.unsubscribe();
    expect(store.view(code, "ann")?.players[1].isConnected).toBe(true);
  });

  it("tells a player who left that they are out, and deletes empty lobbies", () => {
    const { code, annStream, bobStream } = readyLobby();
    store.leave(code, "bob");
    expect(bobStream.last()).toBeNull();
    expect(annStream.last()?.players).toHaveLength(1);

    store.leave(code, "ann");
    expect(store.exists(code)).toBe(false);
  });

  it("races a player against a bot on the server clock, then deletes the lobby when the player leaves", () => {
    const code = store.create(ann, "en");
    const annStream = listen(code, "ann");
    expect(store.addBot(code, "ann", "godspeed")).toBeNull();
    const bot = annStream.last()?.players[1];
    expect(bot?.bot).toBe("godspeed");
    expect(store.lobbyOf(bot?.id ?? "")).toBeNull();

    store.setReady(code, "ann", true);
    expect(store.start(code, "ann")).toBeNull();
    clock += 3_000 + 5_000;
    store.tick();
    const racer = annStream.last()?.race?.racers.find((candidate) => candidate.id === bot?.id);
    expect(racer?.progress).toBeGreaterThan(0);

    store.leave(code, "ann");
    store.tick();
    expect(store.exists(code)).toBe(false);
  });
});
