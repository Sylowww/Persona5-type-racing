import { expect, test } from "@playwright/test";

// Needs a migrated database (DATABASE_URL) for the dev server.
const unique = Date.now().toString(36);
const account = { username: `p_${unique}`, email: `p_${unique}@example.com`, password: "correct-horse" };

test("signs up, signs out and signs back in", async ({ page, context }) => {
  await page.goto("/en/sign-up");
  await page.getByLabel("Username").fill(account.username);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Create my account" }).click();

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("banner").getByText(account.username)).toBeVisible();

  const cookie = (await context.cookies()).find((c) => c.name === "session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Join" })).toBeVisible();
  expect((await context.cookies()).some((c) => c.name === "session")).toBe(false);

  await page.goto("/en/sign-in");
  await page.getByLabel("Email").fill(account.email.toUpperCase());
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Enter the race" }).click();
  await expect(page.getByRole("banner").getByText(account.username)).toBeVisible();

  // Signed-in users are sent away from the auth pages.
  await page.goto("/en/sign-in");
  await expect(page).toHaveURL(/\/en$/);
});

test("shows validation errors and keeps typed values", async ({ page }) => {
  await page.goto("/fr/sign-up");
  await page.getByLabel("Nom d'utilisateur").fill("a b");
  await page.getByLabel("Courriel").fill("pas-un-courriel");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page.getByText("Utilise seulement des lettres, des chiffres, _ ou -.")).toBeVisible();
  await expect(page.getByText("Entre une adresse courriel valide.")).toBeVisible();
  await expect(page.getByText("Ce champ est obligatoire.")).toBeVisible();
  await expect(page.getByLabel("Courriel")).toHaveValue("pas-un-courriel");
});

test("rejects a wrong password with a generic message", async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Enter the race" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Incorrect email or password." })).toBeVisible();
});
