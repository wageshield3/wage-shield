import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LANG_CODE: Record<string, string> = { en: "en-IN", kn: "kn-IN", hi: "hi-IN" };

const SYSTEM = `You read what a daily-wage worker in India said about their workday (Kannada, Hindi or English, possibly mixed).
Return ONLY a JSON object with exactly these keys:
{"hours": number|null, "promised": number|null, "paid": number|null, "site": string|null, "contractor": string|null}
- hours: hours worked today.
- promised: the daily wage that was promised, in rupees.
- paid: the amount actually paid today, in rupees.
- Use digits for numbers. Keep site and contractor names in the script they were spoken in.
- If something was not said, use null. Never guess and never calculate.
- Output only the JSON object, nothing else.`;

const num = (v: unknown, max: number): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^0-9.]/g, "")) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 10) / 10 : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : null);

export async function POST(req: Request) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("audio");
  const lang = String(form.get("lang") ?? "en");
  if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: "no_audio" }, { status: 400 });
  if (file.size > 3_000_000) return NextResponse.json({ error: "too_big" }, { status: 413 });

  // 1) Speech to text
  const stt = new FormData();
  const extName = file.type.includes("mp4") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
const mimeBase = (file.type || "audio/webm").split(";")[0];
const clean = new Blob([await file.arrayBuffer()], { type: mimeBase });
stt.append("file", clean, `note.${extName}`);
  stt.append("language_code", LANG_CODE[lang] ?? "en-IN");
  const sttRes = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST", headers: { "api-subscription-key": key }, body: stt,
  });
  if (!sttRes.ok) {
    console.error("Sarvam STT failed", sttRes.status, (await sttRes.text()).slice(0, 300));
    return NextResponse.json({ error: "stt_failed" }, { status: 502 });
  }
  const transcript = String(((await sttRes.json()) as { transcript?: string }).transcript ?? "").trim();
  if (!transcript) return NextResponse.json({ error: "empty" }, { status: 422 });

  // 2) Keep the voice note as evidence
  const ext = file.type.includes("mp4") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
  const audioPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("audio").upload(audioPath, await file.arrayBuffer(), {
    contentType: file.type || "audio/webm",
  });
  const savedPath = up.error ? null : audioPath;

  // 3) Understand the sentence (falls back to empty values: the worker then taps them)
  let entry = { hours: null as number | null, promised: null as number | null, paid: null as number | null, site: null as string | null, contractor: null as string | null };
  try {
    const llm = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "sarvam-30b", temperature: 0.1, max_tokens: 600,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: transcript }],
      }),
    });
    if (llm.ok) {
      const j = (await llm.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = (j.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "");
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const p = JSON.parse(m[0]) as Record<string, unknown>;
        entry = { hours: num(p.hours, 24), promised: num(p.promised, 100000), paid: num(p.paid, 100000), site: str(p.site), contractor: str(p.contractor) };
      }
    } else {
      console.error("Sarvam chat failed", llm.status, (await llm.text()).slice(0, 300));
    }
  } catch (e) {
    console.error("Entry parsing failed", e);
  }

  return NextResponse.json({ transcript, entry, audioPath: savedPath });
}
