import { expect, test } from "@playwright/test";

test("renders the lobby in English and French", async ({ page }) => {
  await page.goto("/en/lobby");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("P5-JOK3");
  await expect(page.getByText("3 / 6 locked in")).toBeVisible();
  await expect(page.getByRole("heading", { name: "JOKER_KEY" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Start the race/i })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Heist lobby" })).toHaveAttribute("aria-current", "page");

  await page.goto("/fr/lobby");
  await expect(page.getByText("3 / 6 prêts")).toBeVisible();
});

test("switches the key sound option", async ({ page }) => {
  await page.goto("/en/lobby");
  const silent = page.getByRole("radio", { name: "Silent red" });
  await silent.click();
  await expect(silent).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { name: "Tactile brown" })).toHaveAttribute("aria-checked", "false");
});
