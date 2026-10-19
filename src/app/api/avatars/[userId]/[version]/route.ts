import type { NextRequest } from "next/server";
import { uuidSchema } from "@/lib/schemas";
import { getUserAvatar } from "@/lib/users";

/** Serves an uploaded profile picture. The URL's version changes on every upload, so a response never goes stale. */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/avatars/[userId]/[version]">) {
  const { userId } = await params;
  const avatar = uuidSchema.safeParse(userId).success ? await getUserAvatar(userId) : null;
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
