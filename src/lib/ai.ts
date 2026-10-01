import OpenAI from "openai";
import { NextResponse } from "next/server";
import { ValidationError, object } from "@/lib/validation";

export class AIUnavailable extends Error {}
let active = 0;
let windowStart = 0;
let requests = 0;
export async function aiRoute(request: Request, work: (body: Record<string, unknown>, client: OpenAI) => Promise<unknown>) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Запрос с другого сайта запрещен." }, { status: 403 });
    if (process.env.NODE_ENV === "production" && !process.env.APP_ACCESS_PASSWORD) return NextResponse.json({ error: "Для AI в опубликованном приложении настройте APP_ACCESS_PASSWORD." }, { status: 503 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI пока не настроен. Локальные задания и сохранение доступны." }, { status: 503 });
    // Read a bounded stream even when Content-Length is absent or misleading.
    const reader = request.body?.getReader();
    if (!reader) throw new ValidationError();
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const next = await reader.read(); if (next.done) break; size += next.value.length; if (size > 50000) { await reader.cancel(); return NextResponse.json({ error: "Запрос слишком большой." }, { status: 413 }); } chunks.push(next.value); } } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let body: Record<string, unknown>;
    try { body = object(JSON.parse(new TextDecoder().decode(bytes))); } catch { throw new ValidationError(); }
    const now = Date.now();
    if (now - windowStart > 3600000) { windowStart = now; requests = 0; }
    if (active >= 2 || requests >= 60) return NextResponse.json({ error: "Лимит AI-запросов. Повторите позже; локальная практика доступна." }, { status: 429, headers: { "Retry-After": "60" } });
    active += 1; requests += 1;
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60000, maxRetries: 1 });
      return NextResponse.json(await work(body, client));
    } finally { active -= 1; }
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof OpenAI.APIError && error.status === 429) return NextResponse.json({ error: "AI временно ограничил запросы. Повторите позже." }, { status: 429 });
    return NextResponse.json({ error: "AI не вернул пригодный ответ. Ваши данные сохранены; попробуйте позже." }, { status: 502 });
  }
}
export function outputJson(response: { status?: string; output_text: string }): unknown {
  if (response.status !== "completed" || !response.output_text) throw new AIUnavailable();
  try { return JSON.parse(response.output_text); } catch { throw new AIUnavailable(); }
}

export function validateAIOutput<T>(read: () => T): T {
  try { return read(); } catch { throw new AIUnavailable(); }
}
