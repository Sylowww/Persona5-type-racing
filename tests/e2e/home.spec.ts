import { expect, test } from "@playwright/test";

test("renders the page in French and English", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { name: "Course de frappe" })).toBeVisible();

  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Typing race" })).toBeVisible();
});

test("renders the home page sections", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("button", { name: /Start a race/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create heist lobby" })).toBeVisible();
  await expect(page.getByLabel("Lobby code")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unknown phantom" })).toBeVisible();

  await page.goto("/fr");
  await expect(page.getByRole("button", { name: /Lancer une course/i })).toBeVisible();
});
