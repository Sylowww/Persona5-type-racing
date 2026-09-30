import { expect, type Page } from "@playwright/test";

let counter = 0;

/** Creates a fresh account (needs a migrated database) and returns its username. */
export async function signUp(page: Page, prefix: string): Promise<string> {
  counter += 1;
  const username = `${prefix}_${Date.now().toString(36)}${counter}${Math.floor(Math.random() * 100)}`.slice(0, 20);
  await page.goto("/en/sign-up");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(`${username}@example.com`);
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
