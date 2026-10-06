import { expect, test } from "@playwright/test";
import { createLobby, signUp } from "./helpers";

// Needs a migrated database (DATABASE_URL) for the dev server.

test("sends signed-out players to sign in before creating a lobby", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: /Start a race/i }).click();
  await expect(page).toHaveURL(/\/en\/sign-in$/);
});

test("creates a lobby with the player as host", async ({ page }) => {
  const name = await signUp(page, "host");
  const code = await createLobby(page);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(code);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("Seats // 1 / 30")).toBeVisible();
  await expect(page.getByText("0 / 1 locked in")).toBeVisible();
  await expect(page.getByRole("button", { name: /Start the race/i })).toBeDisabled();

  await page.getByRole("button", { name: "Ready up" }).click();
  await expect(page.getByText("1 / 1 locked in")).toBeVisible();
  // A race needs a second player.
  await expect(page.getByRole("button", { name: /Start the race/i })).toBeDisabled();

  await page.getByRole("button", { name: "Lobby settings" }).click();
  const silent = page.getByRole("radio", { name: "Silent red" });
  await silent.click();
  await expect(silent).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");

  // /lobby brings the player back to their lobby.
  await page.goto("/en/lobby");
  await expect(page).toHaveURL(new RegExp(`/en/lobby/${code}$`));

  await page.goto(`/fr/lobby/${code}`);
  await expect(page.getByText("1 / 1 prêts")).toBeVisible();

  await page.getByRole("button", { name: "Quitter le salon" }).click();
  await expect(page).toHaveURL(/\/fr$/);
});

test("explains why a code cannot be joined", async ({ page }) => {
  await signUp(page, "joiner");
  const input = page.getByLabel("Lobby code");

  await input.fill("nope");
  await page.getByRole("button", { name: "Punch in" }).click();
  await expect(page.getByText("Enter a 6-character code like AB23CD.")).toBeVisible();

  await input.fill("ZZZZZZ");
  await page.getByRole("button", { name: "Punch in" }).click();
  await expect(page.getByText("No lobby with this code.")).toBeVisible();
});
