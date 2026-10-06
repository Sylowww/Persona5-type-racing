import { describe, expect, it } from "vitest";
import { avatarPath, detectAvatarType, MAX_AVATAR_BYTES, validateAvatar } from "../../src/lib/avatar";

const bytes = (...values: number[]) => new Uint8Array(values);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
// "RIFF" + 4-byte size + "WEBP"
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50);

describe("avatar type detection", () => {
  it("recognizes JPEG, PNG and WebP from their bytes", () => {
    expect(detectAvatarType(JPEG)).toBe("image/jpeg");
    expect(detectAvatarType(PNG)).toBe("image/png");
    expect(detectAvatarType(WEBP)).toBe("image/webp");
  });

  it("rejects other formats and lookalikes", () => {
    expect(detectAvatarType(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(detectAvatarType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    // A RIFF file that is not WebP (e.g. WAV).
    expect(detectAvatarType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45))).toBeNull();
    expect(detectAvatarType(bytes(0xff, 0xd8))).toBeNull();
  });
});

describe("avatar validation", () => {
  it("accepts a supported image up to 2 MB", () => {
    const largest = new Uint8Array(MAX_AVATAR_BYTES);
    largest.set(PNG);
    expect(validateAvatar(largest)).toEqual({ ok: true, type: "image/png" });
  });

  it("reports empty, oversized and unsupported files", () => {
    expect(validateAvatar(new Uint8Array())).toEqual({ ok: false, error: "missing" });
    const tooBig = new Uint8Array(MAX_AVATAR_BYTES + 1);
    tooBig.set(PNG);
    expect(validateAvatar(tooBig)).toEqual({ ok: false, error: "tooLarge" });
    expect(validateAvatar(new TextEncoder().encode("hello"))).toEqual({ ok: false, error: "badType" });
  });

  it("versions the avatar URL", () => {
    expect(avatarPath("abc", 42)).toBe("/api/avatars/abc/42");
  });
});
