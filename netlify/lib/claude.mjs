import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
export const MODEL = "claude-sonnet-5-5";
const MAX_IMAGES = 6;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Validates a request body from the page. Returns { prompt, images, json } or null if it is unusable. */
export function parseBody(body) {
  const prompt = typeof body?.prompt === "string" ? body.prompt.slice(0, 200000) : "";
  if (!prompt.trim()) return null;
  const images = (Array.isArray(body.images) ? body.images : [])
    .filter((i) => i && IMAGE_TYPES.has(i.type) && typeof i.data === "string")
    .slice(0, MAX_IMAGES);
  return { prompt, images, json: !!body.json };
}

/** Starts a streamed Claude request for a parsed body. */
export function startStream({ prompt, images, json }) {
  const content = [
    ...images.map((i) => ({ type: "image", source: { type: "base64", media_type: i.type, data: i.data } })),
    { type: "text", text: json ? prompt + "\n\nRespond with a single valid JSON object only, no markdown fences." : prompt },
  ];
  return anthropic.messages.stream({ model: MODEL, max_tokens: 16000, messages: [{ role: "user", content }] });
}
