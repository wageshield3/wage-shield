"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Input = {
  date: string; hours: number; promised: number; paid: number;
  site: string; contractor: string; transcript: string; audioPath: string | null;
};

export async function saveVoiceLog(input: Input): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false };

  const clamp = (n: number, max: number) => Math.min(max, Math.max(0, Number(n) || 0));
  const audioPath = input.audioPath && input.audioPath.startsWith(`${user.id}/`) ? input.audioPath : null;

  const { data, error } = await supabase.from("work_logs").insert({
    worker_id: user.id,
    logged_by: user.id,
    work_date: input.date,
    hours: clamp(input.hours, 24),
    site_name: input.site.trim().slice(0, 80) || null,
    contractor_name: input.contractor.trim().slice(0, 80) || null,
    promised_wage: clamp(input.promised, 100000),
    paid_amount: clamp(input.paid, 100000),
    source: "voice",
    audio_url: audioPath,
    transcript: input.transcript.slice(0, 1000),
    confirmed_at: new Date().toISOString(),
  }).select("id").single();
  if (error || !data) return { ok: false };

  if (audioPath) {
    await supabase.from("evidence_files").insert({ log_id: data.id, type: "audio", storage_path: audioPath });
  }
  revalidatePath("/worker");
  return { ok: true };
}
