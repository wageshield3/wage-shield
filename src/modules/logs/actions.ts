"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LogState } from "./types";

export async function addLog(_prev: LogState, fd: FormData): Promise<LogState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const worked = fd.get("status") === "worked";
  const num = (k: string) => Math.max(0, Number(fd.get(k) ?? 0) || 0);
  const text = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const date = String(fd.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Please pick a date." };

  const { error } = await supabase.from("work_logs").insert({
    worker_id: user.id,
    logged_by: user.id,
    work_date: date,
    hours: worked ? Math.min(24, num("hours")) : 0,
    site_name: worked ? text("site") : null,
    contractor_name: worked ? text("contractor") : null,
    promised_wage: worked ? num("promised") : 0,
    paid_amount: worked ? num("paid") : 0,
    source: "tap",
    confirmed_at: new Date().toISOString(),
  });
  if (error) return { error: "Could not save. Please try again." };

  revalidatePath("/worker");
  return { ok: true };
}

export async function setLanguage(fd: FormData) {
  const lang = String(fd.get("lang") ?? "");
  if (!["en", "kn", "hi"].includes(lang)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ language: lang }).eq("id", user.id);
  revalidatePath("/worker");
}
