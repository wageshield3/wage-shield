import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LANG_CODE: Record<string, string> = { en: "en-IN", kn: "kn-IN", hi: "hi-IN" };

export async function POST(req: Request) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

  const { text, lang } = (await req.json()) as { text?: string; lang?: string };
  if (!text || !text.trim()) return NextResponse.json({ error: "no_text" }, { status: 400 });

  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": key },
    body: JSON.stringify({
      text: text.slice(0, 400), target_language_code: LANG_CODE[lang ?? "en"] ?? "en-IN",
      model: "bulbul:v3", speaker: "shubh",
    }),
  });
  if (!res.ok) {
    console.error("Sarvam TTS failed", res.status, (await res.text()).slice(0, 300));
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }
  const j = (await res.json()) as { audios?: string[] };
  return NextResponse.json({ audio: (j.audios ?? []).join("") });
}
