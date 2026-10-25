"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HelperState } from "./types";

export async function helperSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function linkWorker(_prev: HelperState, fd: FormData): Promise<HelperState> {
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return { error: "Please enter the 6-character code from the worker." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "helper") return { error: "Only helpers can do this." };

  const admin = createAdminClient();
  const { data: worker } = await admin.from("profiles").select("id, full_name, role").eq("link_code", code).maybeSingle();
  if (!worker || worker.role !== "worker") return { error: "Code not found. Please check it with the worker." };

  const { error } = await admin.from("helper_links")
    .upsert({ helper_id: user.id, worker_id: worker.id }, { onConflict: "helper_id,worker_id", ignoreDuplicates: true });
  if (error) return { error: "Could not link. Please try again." };

  revalidatePath("/helper");
  return { ok: true, name: (worker.full_name as string | null) ?? "Worker" };
}

export async function addLogForWorker(_prev: HelperState, fd: FormData): Promise<HelperState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const workerId = String(fd.get("workerId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(workerId)) return { error: "Unknown worker." };
  const { data: link } = await supabase.from("helper_links").select("worker_id").eq("worker_id", workerId).maybeSingle();
  if (!link) return { error: "You are not linked to this worker." };

  const worked = fd.get("status") === "worked";
  const num = (k: string) => Math.max(0, Number(fd.get(k) ?? 0) || 0);
  const text = (k: string) => String(fd.get(k) ?? "").trim().slice(0, 80) || null;
  const date = String(fd.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Please pick a date." };

  const { error } = await supabase.from("work_logs").insert({
    worker_id: workerId,
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

  revalidatePath(`/helper/${workerId}`);
  revalidatePath("/helper");
  return { ok: true };
}
