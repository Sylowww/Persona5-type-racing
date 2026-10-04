import { describe, expect, it } from "vitest";
import {
  RUNNER_IDLE_AFTER_MS,
  RUNNER_JUMP_MS,
  crossesObstacle,
  initialRunnerState,
  runSpeed,
  runnerAnimation,
  updateRunner,
} from "../../src/lib/race-runner";
import { characterPortrait, characterSprite, characters, isCharacterId, randomCharacter, type CharacterSprite } from "../../src/lib/characters";

describe("crossesObstacle", () => {
  it("detects passing an obstacle, including landing exactly on it", () => {
    expect(crossesObstacle(0.2, 0.3)).toBe(true);
    expect(crossesObstacle(0.2, 0.25)).toBe(true);
  });

  it("ignores moves that stay before or start on an obstacle", () => {
    expect(crossesObstacle(0.1, 0.2)).toBe(false);
    expect(crossesObstacle(0.25, 0.3)).toBe(false);
  });

  it("never triggers when going back", () => {
    expect(crossesObstacle(0.3, 0.2)).toBe(false);
  });

  it("detects a fast move past several obstacles", () => {
    expect(crossesObstacle(0.2, 0.8)).toBe(true);
  });
});

describe("runner", () => {
  it("stands still at the start and after a reload mid-race", () => {
    expect(runnerAnimation(initialRunnerState(0), false, 0)).toBe("idle");
    expect(runnerAnimation(initialRunnerState(0.6), false, 0)).toBe("idle");
  });

  it("runs while progress increases, then stands still once it stops", () => {
    const state = updateRunner(initialRunnerState(0), 0.1, 1000);
    expect(runnerAnimation(state, false, 1000)).toBe("run");
    expect(runnerAnimation(state, false, 1000 + RUNNER_IDLE_AFTER_MS - 1)).toBe("run");
    expect(runnerAnimation(state, false, 1000 + RUNNER_IDLE_AFTER_MS)).toBe("idle");
  });

  it("keeps the same state when progress does not change", () => {
    const state = updateRunner(initialRunnerState(0), 0.1, 1000);
    expect(updateRunner(state, 0.1, 1500)).toBe(state);
  });

  it("does not count going back (deleting) as moving", () => {
    const state = updateRunner(updateRunner(initialRunnerState(0), 0.1, 1000), 0.05, 1500);
    expect(state.progress).toBe(0.05);
    expect(state.movedAt).toBe(1000);
  });

  it("jumps for a fixed time when crossing an obstacle, then runs on", () => {
    const state = updateRunner(initialRunnerState(0.24), 0.26, 1000);
    expect(runnerAnimation(state, false, 1000)).toBe("jump");
    expect(runnerAnimation(state, false, 1000 + RUNNER_JUMP_MS - 1)).toBe("jump");
    const later = updateRunner(state, 0.3, 1000 + RUNNER_JUMP_MS);
    expect(runnerAnimation(later, false, 1000 + RUNNER_JUMP_MS)).toBe("run");
  });

  it("finishes the jump even if the runner stops on the obstacle", () => {
    const state = updateRunner(initialRunnerState(0.24), 0.25, 1000);
    expect(runnerAnimation(state, false, 1200)).toBe("jump");
    expect(runnerAnimation(state, false, 1000 + RUNNER_IDLE_AFTER_MS)).toBe("idle");
  });

  it("jumps again only when crossing forward after going back", () => {
    let state = updateRunner(initialRunnerState(0.24), 0.26, 1000);
    state = updateRunner(state, 0.24, 2000);
    expect(runnerAnimation(state, false, 2000)).toBe("idle");
    state = updateRunner(state, 0.26, 3000);
    expect(runnerAnimation(state, false, 3000)).toBe("jump");
  });

  it("celebrates once finished, whatever else is going on", () => {
    const jumping = updateRunner(initialRunnerState(0.74), 0.76, 1000);
    expect(runnerAnimation(jumping, true, 1000)).toBe("victory");
    expect(runnerAnimation(updateRunner(initialRunnerState(0.9), 1, 1000), false, 5000)).toBe("victory");
  });
});

describe("runSpeed", () => {
  it("is 1 at 60 WPM, stays between 0.8 and 1.4 and is rounded to 0.1", () => {
    expect(runSpeed(60)).toBe(1);
    expect(runSpeed(72)).toBe(1.2);
    expect(runSpeed(74)).toBe(1.2);
    expect(runSpeed(0)).toBe(0.8);
    expect(runSpeed(200)).toBe(1.4);
  });
});

describe("characters", () => {
  it.each(Object.entries(characters))("%s fits its sprite sheet", (_, character: CharacterSprite) => {
    const animations = Object.values(character.animations);
    const rows = animations.map((animation) => animation.row);
    expect(new Set(rows).size).toBe(rows.length);
    for (const animation of animations) {
      expect(animation.row).toBeLessThan(character.rows);
      expect(animation.frames).toBeGreaterThan(0);
      expect(animation.frames).toBeLessThanOrEqual(character.columns);
      expect(animation.fps).toBeGreaterThan(0);
    }
  });
});

describe("character ids", () => {
  it("only accepts known characters", () => {
    expect(isCharacterId("mona")).toBe(true);
    expect(isCharacterId("nobody")).toBe(false);
    expect(isCharacterId("toString")).toBe(false);
    expect(isCharacterId(null)).toBe(false);
  });

  it("falls back to Joker for an unknown character", () => {
    expect(characterSprite("mona")).toBe(characters.mona);
    expect(characterSprite("nobody")).toBe(characters.joker);
  });

  it("has a portrait for every character", () => {
    expect(characterPortrait("violet")).toBe("/portraits/characters/violet.webp");
    expect(characterPortrait("oracle")).toBe("/portraits/characters/oracle.webp");
  });

  it("picks a random character, even at the edge of the range", () => {
    const picks = [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.99, 1].map((value) => randomCharacter(() => value));
    expect(picks).toEqual(["joker", "mona", "panther", "skull", "fox", "queen", "oracle", "noir", "crow", "violet", "violet"]);
  });
});
