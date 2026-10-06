import { expect, test, type Page } from "@playwright/test";
import { createLobby, signUp } from "./helpers";

// Two separate browser sessions play a whole race. Needs a migrated database (DATABASE_URL).

/** Below the server's 30 keys per second limit. */
const KEY_DELAY_MS = 40;

async function raceText(page: Page): Promise<string> {
  return (await page.getByRole("region", { name: "Input terminal" }).locator("p").textContent()) ?? "";
}

test("two players race from lobby creation to results", async ({ browser }) => {
  test.setTimeout(120_000);
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();

  const hostName = await signUp(host, "host");
  const guestName = await signUp(guest, "guest");

  // Create, then join by code; both rosters update live.
  const code = await createLobby(host);
  await guest.getByLabel("Lobby code").fill(code.toLowerCase());
  await guest.getByRole("button", { name: "Punch in" }).click();
  await expect(guest).toHaveURL(new RegExp(`/en/lobby/${code}$`));
  await expect(host.getByRole("heading", { name: guestName })).toBeVisible();
  await expect(guest.getByRole("heading", { name: hostName })).toBeVisible();

  // The dev server compiles a page on its first visit; warm up the race and results pages now so the
  // compile does not eat the 3 s countdown (both requests redirect back to the lobby).
  await host.request.get(`/en/lobby/${code}/race`, { maxRedirects: 0 });
  await host.request.get(`/en/lobby/${code}/results`, { maxRedirects: 0 });

  // Only the host can start, once everyone is ready.
  const start = host.getByRole("button", { name: /Start the race/i });
  await host.getByRole("button", { name: "Ready up" }).click();
  await expect(start).toBeDisabled();
  await guest.getByRole("button", { name: "Ready up" }).click();
  await expect(host.getByText("2 / 2 locked in")).toBeVisible();
  await expect(guest.getByRole("button", { name: /Start the race/i })).toBeDisabled();
  await start.click();

  // Both land on the race with the same countdown and text.
  for (const page of [host, guest]) {
    await expect(page).toHaveURL(new RegExp(`/en/lobby/${code}/race$`));
    await expect(page.getByRole("timer", { name: /Race starts in/ })).toBeVisible();
  }
  const text = await raceText(host);
  expect(text.length).toBeGreaterThan(50);
  expect(await raceText(guest)).toBe(text);

  const hostInput = host.getByLabel("Type the text");
  const guestInput = guest.getByLabel("Type the text");
  await expect(hostInput).toBeEditable({ timeout: 10_000 });
  await expect(guestInput).toBeEditable({ timeout: 10_000 });

  // A corrected mistake still counts.
  await hostInput.pressSequentially("x");
  await expect(host.getByText("Mistakes: 1")).toBeVisible();
  await hostInput.press("Backspace");

  // The host's progress shows up live on the guest's track.
  const half = Math.floor(text.length / 2);
  await hostInput.pressSequentially(text.slice(0, half), { delay: KEY_DELAY_MS });
  await expect(guest.getByRole("listitem", { name: new RegExp(`^${hostName}: (4|5)\\d\\s?% of the text`) })).toBeVisible();

  // The guest reloads mid-race and gets back the progress the server recorded.
  // Keystrokes are sent in batches; the reload waits for the last one so the restored text is final
  // (a batch still in flight would land after the reload and add letters the test would type again).
  let pendingInput = 0;
  guest.on("request", (request) => {
    if (request.url().endsWith("/input")) pendingInput += 1;
  });
  const settled = (request: { url: () => string }) => {
    if (request.url().endsWith("/input")) pendingInput -= 1;
  };
  guest.on("requestfinished", settled);
  guest.on("requestfailed", settled);
  await guestInput.pressSequentially(text.slice(0, 10), { delay: KEY_DELAY_MS });
  await expect(host.getByRole("listitem", { name: new RegExp(`^${guestName}: [1-9]\\d?\\s?% of the text`) })).toBeVisible();
  // The page waits 50 ms before sending a batch, so give the last one time to start before checking.
  await guest.waitForTimeout(300);
  await expect.poll(() => pendingInput).toBe(0);
  await guest.reload();
  const restored = await guest.getByLabel("Type the text").inputValue();
  expect(restored.length).toBeGreaterThan(0);
  expect(text.startsWith(restored)).toBe(true);
  // The input opens once the page is hydrated (keys typed before would be dropped).
  await expect(guest.getByLabel("Type the text")).toBeEditable();

  await Promise.all([
    hostInput.pressSequentially(text.slice(half), { delay: KEY_DELAY_MS }),
    guest.getByLabel("Type the text").pressSequentially(text.slice(restored.length), { delay: KEY_DELAY_MS }),
  ]);

  // The server ends the race and sends both players to the real results.
  await expect(host).toHaveURL(new RegExp(`/en/lobby/${code}/results$`), { timeout: 15_000 });
  await expect(guest).toHaveURL(new RegExp(`/en/lobby/${code}/results$`), { timeout: 15_000 });
  await expect(host.getByRole("heading", { level: 1 })).toHaveText("Mission accomplished // Victory!");
  await expect(guest.getByRole("heading", { level: 1 })).toHaveText("Mission complete // Place 2");
  for (const page of [host, guest]) {
    await expect(page.getByRole("listitem", { name: new RegExp(`^Place 1: ${hostName}, \\d+ WPM$`) })).toBeVisible();
    await expect(page.getByRole("listitem", { name: new RegExp(`^Place 2: ${guestName}, \\d+ WPM$`) })).toBeVisible();
  }

  // Rematch goes back to the same lobby.
  await guest.getByRole("link", { name: /Rematch/ }).click();
  await expect(guest).toHaveURL(new RegExp(`/en/lobby/${code}$`));
  await expect(guest.getByRole("heading", { name: hostName })).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("the host sets the race rules and players chat in the lobby", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();

  const hostName = await signUp(host, "host");
  const guestName = await signUp(guest, "guest");
  const code = await createLobby(host);
  await guest.goto(`/en/lobby/${code}`);
  await guest.getByRole("button", { name: "Punch in" }).click();
  await expect(host.getByRole("heading", { name: guestName })).toBeVisible();

  // The text language starts as the host's interface language.
  const summary = guest.getByRole("region", { name: "Race rules" });
  await expect(summary).toContainText("English");

  // Only the host edits, in the settings panel; everyone sees the change in the rules summary.
  await guest.getByRole("button", { name: "Details" }).click();
  await expect(guest.getByRole("button", { name: /Sudden death/ })).toBeDisabled();
  await guest.getByRole("button", { name: "Close" }).click();
  await host.getByRole("button", { name: "Lobby settings" }).click();
  await host.getByRole("button", { name: /Sudden death/ }).click();
  await host.getByRole("button", { name: "None" }).click();
  await host.getByRole("switch", { name: "Case sensitive" }).click();
  await host.getByRole("group", { name: "Text language" }).getByRole("button", { name: "Français" }).click();
  await host.keyboard.press("Escape");
  await expect(summary).toContainText("Sudden death");
  await expect(summary).toContainText("None");
  await expect(summary).toContainText("Case sensitive Off");
  await expect(summary).toContainText("Français");

  // Messages and quick taunts reach every member.
  await host.getByLabel("Message").fill("Prepare to lose");
  await host.getByRole("button", { name: "Send" }).click();
  await expect(guest.getByRole("listitem").filter({ hasText: `${hostName}: Prepare to lose` })).toBeVisible();
  await guest.getByRole("button", { name: "Too slow!" }).click();
  await expect(host.getByRole("listitem").filter({ hasText: "Too slow!" })).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("the training dojo starts a solo race", async ({ page }) => {
  await signUp(page, "dojo");
  await page.getByRole("button", { name: /Training dojo/ }).click();
  await expect(page).toHaveURL(/\/en\/lobby\/[A-Z2-9]{6}\/race$/);
  await expect(page.getByRole("timer", { name: /Race starts in/ })).toBeVisible();
  await expect(page.getByLabel("Type the text")).toBeEditable({ timeout: 10_000 });
});

test("quick play pairs two searching players in the same race", async ({ browser }) => {
  test.setTimeout(60_000);
  const contexts = [await browser.newContext(), await browser.newContext()];
  const [first, second] = await Promise.all(contexts.map((context) => context.newPage()));
  await signUp(first, "quick");
  await signUp(second, "quick");

  await first.getByRole("link", { name: /Quick play/ }).click();
  await expect(first).toHaveURL(/\/en\/quick$/);
  await expect(first.getByRole("status")).toContainText("Searching");
  await second.getByRole("link", { name: /Quick play/ }).click();

  // Each page finds the match on its next check-in (every 1 s), shows the 2.6 s versus screen, then opens the
  // race page, which the dev server may still be compiling in CI.
  await expect(first).toHaveURL(/\/en\/lobby\/[A-Z2-9]{6}\/race$/, { timeout: 20_000 });
  await expect(second).toHaveURL(first.url(), { timeout: 20_000 });
  for (const context of contexts) await context.close();
});

test("a public lobby shows in the lobby browser and can be joined from it", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  const hostName = await signUp(host, "pub");
  const guestName = await signUp(guest, "pub");

  const code = await createLobby(host);
  await guest.goto("/en/lobbies");
  await expect(guest.getByText(`Host: ${hostName}`)).toHaveCount(0);

  await host.getByRole("button", { name: "Lobby settings" }).click();
  await host.getByRole("button", { name: "Public" }).click();
  await expect(host.getByRole("button", { name: "Public" })).toHaveAttribute("aria-pressed", "true");
  await host.keyboard.press("Escape");
  await guest.getByRole("button", { name: "Refresh" }).click();
  await expect(guest.getByText(`Host: ${hostName}`)).toBeVisible();

  // The lobby was created in English, so the French filter hides it.
  const filters = guest.getByRole("group", { name: "Text language" });
  await filters.getByRole("button", { name: "Français" }).click();
  await expect(guest.getByText(`Host: ${hostName}`)).toHaveCount(0);
  await filters.getByRole("button", { name: "English" }).click();
  await guest.getByRole("button", { name: `Join - Host: ${hostName}` }).click();

  await expect(guest).toHaveURL(new RegExp(`/en/lobby/${code}$`));
  await expect(host.getByRole("heading", { name: guestName })).toBeVisible();
  await hostContext.close();
  await guestContext.close();
});
