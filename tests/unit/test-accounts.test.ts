import { describe, expect, it } from "vitest";
import { isTestAccount, testEmail, testUsername } from "../../tests/e2e/test-accounts";

describe("E2E test accounts", () => {
  it("recognizes the accounts the tests create", () => {
    for (const role of ["host", "guest", "joiner", "p"]) {
      const username = testUsername(role);
      expect(username.length).toBeLessThanOrEqual(20);
      expect(isTestAccount(username, testEmail(username))).toBe(true);
    }
  });

  it("never matches a real account", () => {
    // Real players, including names that look like test ones, keep their accounts.
    expect(isTestAccount("Matthew", "someone@gmail.com")).toBe(false);
    expect(isTestAccount("Sylowww", null)).toBe(false);
    expect(isTestAccount("host_muu2w6pb141", "host_muu2w6pb141@example.com")).toBe(false);
    expect(isTestAccount("e2e_host_abc", "someone@gmail.com")).toBe(false);
    expect(isTestAccount("e2e_host_abc", null)).toBe(false);
    expect(isTestAccount("Matthew", "matthew@e2e.test")).toBe(false);
    expect(isTestAccount("E2E_Host_abc", "x@e2e.test")).toBe(false);
    expect(isTestAccount("e2e_host_abc", "x@e2e.test.com")).toBe(false);
  });
});
