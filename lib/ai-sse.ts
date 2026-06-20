export type SseEvent = {
  type: "status" | "delta" | "complete" | "error" | "cached" | "direction";
  message?: string;
  text?: string;
  result?: unknown;
  cached?: boolean;
  direction?: unknown;
  directionIndex?: number;
};

export function createSseStream(
  handler: (
    send: (event: SseEvent) => void,
  ) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (event: SseEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      try {
        await handler(send);
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Request failed",
        });
      } finally {
        controller.close();
      }
    },
  });
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function readSseStream<T>(
  response: Response,
  onEvent: (event: SseEvent) => void,
): Promise<T | null> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Request failed (${response.status})`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      let event: SseEvent;
      try {
        event = JSON.parse(line.slice(6)) as SseEvent;
      } catch {
        continue;
      }
      onEvent(event);
      if (event.type === "complete" && event.result !== undefined) {
        result = event.result as T;
      }
      if (event.type === "error") {
        throw new Error(event.message ?? "Stream failed");
      }
    }
  }

  return result;
}
