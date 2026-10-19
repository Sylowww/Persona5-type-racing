import { describe, expect, it } from "vitest";
import { clientIp } from "../../src/lib/client-ip";

describe("clientIp", () => {
  it("takes the first X-Forwarded-For address, then X-Real-IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
