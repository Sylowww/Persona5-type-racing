import { expect, test } from "@playwright/test";

test("renders the race results in English and French", async ({ page }) => {
  await page.goto("/en/race/results");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mission accomplished // Victory!");
  await expect(page.getByRole("listitem", { name: "Place 1: JOKER_KEY, 144 WPM" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "Place 4: MONA_CAT, 105 WPM" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "Q: Lag / fault" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Rematch/ })).toHaveAttribute("href", "/en/race");

  await page.goto("/fr/race/results");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mission accomplie // Victoire !");
  await expect(page.getByRole("listitem", { name: "Position 2 : SKULL_CRUSH, 129 MPM" })).toBeVisible();
});
