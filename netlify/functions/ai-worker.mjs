import { getStore } from "@netlify/blobs";
import { startStream } from "../lib/claude.mjs";

// Background function (up to 15 minutes): runs one queued AI job and stores the answer for /api/ai-job.
export default async (req) => {
  let id = "";
  try {
    id = String((await req.json()).id || "");
  } catch {}
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  const store = getStore({ name: "ai-jobs", consistency: "strong" });
  const job = await store.get(`req/${id}`, { type: "json" });
  if (!job) return;
  const res = await store.get(`res/${id}`, { type: "json" });
  if (res && res.status !== "queued") return; // already handled (e.g. a platform retry)

  await store.setJSON(`res/${id}`, { status: "running", at: Date.now() });
  try {
    const text = await startStream(job).finalText();
    await store.setJSON(`res/${id}`, { status: "done", text });
  } catch (err) {
    console.error("AI job failed", err);
    await store.setJSON(`res/${id}`, { status: "error", error: "The AI could not finish its answer" });
  }
  await store.delete(`req/${id}`);
};

export const config = { path: "/api/ai-worker", background: true };
