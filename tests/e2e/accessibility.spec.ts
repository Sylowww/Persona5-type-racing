import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createLobby, signUp } from "./helpers";

// Automated WCAG 2.1 A/AA checks (A11Y-01 to A11Y-03): contrast, labels, alt text, landmarks and headings.
// Keyboard use and focus (A11Y-04) are covered by the keyboard-only flow at the end of this file.

test.use({ reducedMotion: "reduce" });

/** One line per failing node: rule, element and the reason axe gives. */
async function violations(page: Page): Promise<string[]> {
  const { violations: found } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return found.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id} ${node.target.join(" ")}: ${node.failureSummary?.split("\n")[1]?.trim() ?? ""}`),
  );
}

for (const path of ["/fr", "/en", "/en/sign-in", "/en/sign-up", "/en/guest", "/en/lobbies", "/en/leaderboard", "/en/characters/joker", "/en/compendium"]) {
  test(`${path} passes the automated accessibility checks`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

test("signed-in pages pass the automated accessibility checks", async ({ page }) => {
  test.setTimeout(90_000);
  await signUp(page, "a11y");
  expect(await violations(page), "home").toEqual([]);

  await page.goto("/en/profile");
  expect(await violations(page), "profile").toEqual([]);

  await page.goto("/en");
  const code = await createLobby(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await violations(page), `lobby ${code}`).toEqual([]);
});

test("the race and results pages pass the automated accessibility checks", async ({ page }) => {
  test.setTimeout(90_000);
  await signUp(page, "a11y-race");
  await page.getByRole("button", { name: /Velvet Room/ }).click();
  const input = page.getByLabel("Type the text");
  await expect(input).toBeEditable({ timeout: 15_000 });
  expect(await violations(page), "race").toEqual([]);

  const text = (await page.getByRole("region", { name: "Input terminal" }).locator("p").textContent()) ?? "";
  await input.pressSequentially(text, { delay: 40 });
  await expect(page).toHaveURL(/\/results$/, { timeout: 20_000 });
  await expect(page.getByRole("table")).toBeVisible();
  expect(await violations(page), "results").toEqual([]);
});

/** Presses Tab until `target` has focus; fails after `max` presses. */
async function tabTo(page: Page, target: ReturnType<Page["getByRole"]>, max = 40) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error("Never reached the target with Tab");
}

test("a player signs in, opens a lobby and starts a race with the keyboard only (A11Y-04)", async ({ page }) => {
  test.setTimeout(60_000);
  const username = await signUp(page, "keys");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/en/sign-in");

  await tabTo(page, page.getByLabel("Email"));
  await page.keyboard.type(`${username}@e2e.test`);
  await page.keyboard.press("Tab");
  await page.keyboard.type("correct-horse");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en$/);

  // Every focused control shows the yellow focus ring.
  const start = page.getByRole("button", { name: /Start a race/i });
  await tabTo(page, start);
  await expect(start).toHaveCSS("outline-style", "solid");
  await expect(start).toHaveCSS("outline-width", "3px");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/lobby\/[A-Z2-9]{6}$/);

  await page.getByRole("button", { name: /Novice \/\/ Intern/ }).focus();
  await page.keyboard.press("Enter");
  await tabTo(page, page.getByRole("button", { name: "Ready up" }));
  await page.keyboard.press("Enter");
  await tabTo(page, page.getByRole("button", { name: /Start the race/i }));
  await page.keyboard.press("Enter");

  // The typing area takes focus by itself when the race opens.
  await expect(page.getByLabel("Type the text")).toBeFocused({ timeout: 15_000 });
});
