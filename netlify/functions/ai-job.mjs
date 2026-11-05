import { getStore } from "@netlify/blobs";
import { parseBody } from "../lib/claude.mjs";

// Long AI requests run as jobs so they are not cut off by the synchronous time limit.
// POST stores the request and returns a job id. The page then starts /api/ai-worker (a background
// function) with that id and polls GET /api/ai-job?id=… until the answer is ready.
const jobs = () => getStore({ name: "ai-jobs", consistency: "strong" });
const ID = /^[0-9a-f-]{36}$/;
const noStore = { "cache-control": "no-store" };

export default async (req) => {
  const store = jobs();

  if (req.method === "POST") {
    let parsed;
    try {
      parsed = parseBody(await req.json());
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!parsed) return Response.json({ error: "Empty prompt" }, { status: 400 });
    const id = crypto.randomUUID();
    await store.setJSON(`req/${id}`, parsed);
    await store.setJSON(`res/${id}`, { status: "queued", at: Date.now() });
    return Response.json({ id }, { headers: noStore });
  }

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!ID.test(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
    const res = await store.get(`res/${id}`, { type: "json" });
    if (!res) return Response.json({ status: "missing" }, { headers: noStore });
    if (res.status === "done" || res.status === "error") {
      await Promise.all([store.delete(`res/${id}`), store.delete(`req/${id}`)]);
    }
    return Response.json(res, { headers: noStore });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/ai-job" };
