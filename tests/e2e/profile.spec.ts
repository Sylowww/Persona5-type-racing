import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";
import { testUsername } from "./test-accounts";

/** A valid 1x1 PNG. */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

test("renames the player", async ({ page }) => {
  await signUp(page, "rename");
  await page.goto("/en/profile");
  const name = testUsername("renamed");

  await page.getByLabel("Display name").fill(name);
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

test("refuses a name another player already has", async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  const takenName = await signUp(first, "taken");
  await signUp(second, "taker");

  await second.goto("/en/profile");
  await second.getByLabel("Display name").fill(takenName.toUpperCase());
  await second.getByRole("button", { name: "Save name" }).click();
  await expect(second.getByText("This name is already taken.")).toBeVisible();
  await firstContext.close();
  await secondContext.close();
});

test("uploads a profile picture and serves it resized", async ({ page }) => {
  const name = await signUp(page, "avatar");
  await page.goto("/en/profile");

  await page.getByLabel("Choose a picture").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "Upload picture" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved!");

  // next/image serves the stored picture through the optimizer, which resizes it.
  const avatar = page.getByRole("img", { name: `${name}'s avatar` }).first();
  await expect(avatar).toHaveAttribute("src", /\/_next\/image\?url=%2Fapi%2Favatars%2F/);
  const optimized = (await avatar.getAttribute("src")) ?? "";
  expect((await page.request.get(optimized)).ok()).toBe(true);
  const source = decodeURIComponent(optimized.match(/url=([^&]+)/)?.[1] ?? "");
  const response = await page.request.get(source);
  expect(response.headers()["content-type"]).toBe("image/png");
});

test("rejects files that are not real images or are too large", async ({ page }) => {
  await signUp(page, "badpic");
  await page.goto("/en/profile");
  const input = page.getByLabel("Choose a picture");
  const upload = page.getByRole("button", { name: "Upload picture" });

  // The name and type say PNG, but the bytes do not.
  await input.setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await upload.click();
  await expect(page.getByText("Use a JPEG, PNG or WebP picture.")).toBeVisible();

  await input.setInputFiles({ name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.getByText("This picture is over 2 MB.")).toBeVisible();
});
