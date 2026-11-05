import { parseBody, startStream } from "../lib/claude.mjs";

// Direct streamed answer. Used for short requests, and as a fallback when background jobs are unavailable.
// Synchronous functions stop after about 30 seconds, so long summaries use /api/ai-job instead.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let parsed;
  try {
    parsed = parseBody(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!parsed) return Response.json({ error: "Empty prompt" }, { status: 400 });

  try {
    const stream = startStream(parsed);
    const enc = new TextEncoder();
    const out = new ReadableStream({
      async start(controller) {
        try {
          for await (const ev of stream) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              controller.enqueue(enc.encode(ev.delta.text));
            }
          }
        } catch (err) {
          console.error("AI stream error", err);
          controller.enqueue(enc.encode("\u0000ERROR"));
        }
        controller.close();
      },
    });
    return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (err) {
    console.error("AI request failed", err);
    return Response.json({ error: "The AI service is unavailable right now" }, { status: 502 });
  }
};

export const config = { path: "/api/ai" };
