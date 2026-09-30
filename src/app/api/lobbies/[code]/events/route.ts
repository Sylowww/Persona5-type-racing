import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeLobbyCode } from "@/lib/lobby-code";
import { getLobbyStore } from "@/lib/lobby-server";
import type { LobbyView } from "@/types/lobby";

const HEARTBEAT_MS = 15_000;
/** Tells EventSource how long to wait before reconnecting after a dropped connection. */
const RETRY_MS = 1_000;

/**
 * Server-Sent Events stream of lobby snapshots for the signed-in member.
 * Opening it marks the player connected; closing it starts their reconnect grace period.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/lobbies/[code]/events">) {
  const code = normalizeLobbyCode((await params).code);
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const store = getLobbyStore();
  if (!code || !store.view(code, user.id)) return new Response(null, { status: 404 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      const write = (chunk: string) => {
        if (open) controller.enqueue(encoder.encode(chunk));
      };
      const heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);

      cleanup = () => {
        if (!open) return;
        open = false;
        clearInterval(heartbeat);
        unsubscribe?.();
        request.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          // Already closed by the client.
        }
      };

      write(`retry: ${RETRY_MS}\n\n`);
      const unsubscribe = store.subscribe(code, user.id, (view: LobbyView | null) => {
        if (view) {
          write(`data: ${JSON.stringify(view)}\n\n`);
        } else {
          // No longer a member (left, removed or lobby closed): tell the client and stop.
          write("event: closed\ndata: {}\n\n");
          queueMicrotask(cleanup);
        }
      });
      if (!unsubscribe) queueMicrotask(cleanup);
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform keeps compression from buffering the stream.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
