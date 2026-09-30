import { expect, test } from "@playwright/test";

test("renders the race in English and French", async ({ page }) => {
  await page.goto("/en/race");
  await expect(page.getByText("Target: 34 words")).toBeVisible();
  await expect(page.getByRole("listitem", { name: /SKULL_CRUSH: 46% of the text/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quick race" })).toHaveAttribute("aria-current", "page");

  await page.goto("/fr/race");
  await expect(page.getByText("Cible : 34 mots")).toBeVisible();
});

test("tracks typing progress and mistakes", async ({ page }) => {
  await page.goto("/en/race");
  const input = page.getByLabel("Type the text");
  await input.focus();
  await input.pressSequentially("The wx");
  await expect(page.getByText("Mistakes: 1")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Live");

  await input.press("Backspace");
  await input.pressSequentially("orld");
  await expect(page.getByText("Mistakes: 1")).toBeVisible();
  await expect(page.getByRole("listitem", { name: /JOKER_KEY: 4% of the text/ })).toBeVisible();
});
