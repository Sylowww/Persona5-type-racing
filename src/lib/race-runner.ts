// Visual state of a racer's runner on the race track. It only reads progress; nothing here feeds back into the race.

export type RunnerAnimation = "idle" | "run" | "jump" | "victory";

/** Decorative obstacles, as shares of the track. They never affect progress. */
export const RUNNER_OBSTACLES = [0.25, 0.5, 0.75] as const;

/** A runner whose progress has not increased for this long stands still. */
export const RUNNER_IDLE_AFTER_MS = 800;

export const RUNNER_JUMP_MS = 500;

export type RunnerState = {
  progress: number;
  /** When progress last increased; null if it has not since the runner appeared. */
  movedAt: number | null;
  /** When the current jump ends; null if the runner has not jumped. */
  jumpEndsAt: number | null;
};

/** Starts standing still, even mid-race (e.g. after a reload), so obstacles already passed are not jumped again. */
export function initialRunnerState(progress: number): RunnerState {
  return { progress, movedAt: null, jumpEndsAt: null };
}

/** True when going from `from` to `to` passes an obstacle; going back never does. */
export function crossesObstacle(from: number, to: number, obstacles: readonly number[] = RUNNER_OBSTACLES): boolean {
  return obstacles.some((obstacle) => from < obstacle && obstacle <= to);
}

/** Applies a new progress value; a jump starts when the runner crosses an obstacle, not while it is near one. */
export function updateRunner(
  state: RunnerState,
  progress: number,
  now: number,
  obstacles: readonly number[] = RUNNER_OBSTACLES,
): RunnerState {
  if (progress <= state.progress) return progress === state.progress ? state : { ...state, progress };
  return {
    progress,
    movedAt: now,
    jumpEndsAt: crossesObstacle(state.progress, progress, obstacles) ? now + RUNNER_JUMP_MS : state.jumpEndsAt,
  };
}

export function runnerAnimation(state: RunnerState, isFinished: boolean, now: number): RunnerAnimation {
  if (isFinished || state.progress >= 1) return "victory";
  if (state.jumpEndsAt !== null && now < state.jumpEndsAt) return "jump";
  if (state.movedAt !== null && now - state.movedAt < RUNNER_IDLE_AFTER_MS) return "run";
  return "idle";
}

/** Next moment the animation changes on its own (a jump ends or the runner stops); null if none is due. */
export function nextRunnerChangeAt(state: RunnerState, now: number): number | null {
  const times = [state.jumpEndsAt, state.movedAt === null ? null : state.movedAt + RUNNER_IDLE_AFTER_MS].filter(
    (time): time is number => time !== null && time > now,
  );
  return times.length === 0 ? null : Math.min(...times);
}

/** Run cycle speed for a WPM: 1 at 60 WPM, kept between 0.8 and 1.4 so it never looks frozen or frantic. */
export function runSpeed(wpm: number): number {
  return Math.min(Math.max(wpm / 60, 0.8), 1.4);
}
