import { parseBody, startStream } from "../netlify/lib/claude.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  let body = req.body;

  try {
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const parsed = parseBody(body);

    if (!parsed) {
      return res.status(400).json({ error: "Empty prompt" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = startStream(parsed);

    for await (const ev of stream) {
      if (
        ev.type === "content_block_delta" &&
        ev.delta.type === "text_delta"
      ) {
        res.write(ev.delta.text);
      }
    }

    return res.end();

  } catch (err) {
    console.error("AI request failed:", err);

    if (res.headersSent) {
      res.write("\u0000ERROR");
      return res.end();
    }

    return res.status(502).json({
      error: "The AI service is unavailable right now"
    });
  }
}
