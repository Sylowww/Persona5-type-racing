import type { NextRequest } from "next/server";
import { getUserAvatar } from "@/lib/users";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Serves an uploaded profile picture. The URL's version changes on every upload, so a response never goes stale. */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/avatars/[userId]/[version]">) {
  const { userId } = await params;
  const avatar = UUID_PATTERN.test(userId) ? await getUserAvatar(userId) : null;
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
