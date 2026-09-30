import { describe, expect, it } from "vitest";
import { formatMessage } from "../../src/i18n/format";

describe("formatMessage", () => {
  it("replaces placeholders with values", () => {
    expect(formatMessage("{count} online", { count: "2,410" })).toBe("2,410 online");
    expect(formatMessage("LVL {level} // {name}", { level: 48, name: "JOKER" })).toBe("LVL 48 // JOKER");
  });

  it("keeps unknown placeholders", () => {
    expect(formatMessage("Hello {name}", {})).toBe("Hello {name}");
  });
});
