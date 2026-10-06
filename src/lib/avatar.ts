// Validation of uploaded profile pictures (AUTH-04, SEC-02). Pure: no I/O.

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export type AvatarType = "image/jpeg" | "image/png" | "image/webp";

export type AvatarError = "missing" | "tooLarge" | "badType";

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

/** The real image type from the file's first bytes; the browser-sent type and name are never trusted. */
export function detectAvatarType(bytes: Uint8Array): AvatarType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" <size> "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

export function validateAvatar(bytes: Uint8Array): { ok: true; type: AvatarType } | { ok: false; error: AvatarError } {
  if (bytes.length === 0) return { ok: false, error: "missing" };
  if (bytes.length > MAX_AVATAR_BYTES) return { ok: false, error: "tooLarge" };
  const type = detectAvatarType(bytes);
  return type ? { ok: true, type } : { ok: false, error: "badType" };
}

/** URL of a user's uploaded picture. The version changes with every upload, so cached copies are never stale. */
export function avatarPath(userId: string, version: number): string {
  return `/api/avatars/${userId}/${version}`;
}
