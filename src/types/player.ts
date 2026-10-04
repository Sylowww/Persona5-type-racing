/** Skill radar axes, clockwise from the top. */
export type RadarAxis = "burst" | "accuracy" | "stamina" | "placement" | "rhythm" | "consistency";

/** One axis of the skill radar; `value` is a 0-1 ratio. */
export type RadarValue = { axis: RadarAxis; value: number };

export type ServerStatus = {
  name: string;
  onlineCount: number;
};
