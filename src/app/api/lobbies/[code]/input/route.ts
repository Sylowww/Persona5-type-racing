import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeLobbyCode } from "@/lib/lobby-code";
import { getLobbyStore } from "@/lib/lobby-server";
import { parseInputBatch } from "@/lib/race-engine";

/** Receives a batch of keystrokes; the server replays them and decides progress, finish and ranking. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/lobbies/[code]/input">) {
  const code = normalizeLobbyCode((await params).code);
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  if (!code) return new Response(null, { status: 404 });

  const batch = parseInputBatch(await request.json().catch(() => null));
  if (!batch) return new Response(null, { status: 400 });

  const error = getLobbyStore().input(code, user.id, batch);
  if (error === "lobbyNotFound") return new Response(null, { status: 404 });
  if (error) return new Response(null, { status: 403 });
  return new Response(null, { status: 204 });
}
