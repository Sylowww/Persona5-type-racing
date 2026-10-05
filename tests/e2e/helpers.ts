import { expect, type Page } from "@playwright/test";
import { testEmail, testUsername } from "./test-accounts";

/** Creates a fresh test account (needs a migrated database; deleted after the run) and returns its username. */
export async function signUp(page: Page, role: string): Promise<string> {
  const username = testUsername(role);
  await page.goto("/en/sign-up");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(testEmail(username));
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page).toHaveURL(/\/en$/);
  return username;
}

/** Opens a new lobby from the home page and returns its code. */
export async function createLobby(page: Page): Promise<string> {
  await page.getByRole("button", { name: /Start a race/i }).click();
  await expect(page).toHaveURL(/\/en\/lobby\/P5-[A-Z2-9]{4}$/);
  return page.url().split("/").at(-1) ?? "";
}
