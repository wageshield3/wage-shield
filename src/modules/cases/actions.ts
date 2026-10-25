"use server";

import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_ORG_ID = "00000000-0000-0000-0000-0000000000d1";

export async function submitCase() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  const { data: logs, error: logsError } = await supabase
    .from("work_logs")
    .select("*, evidence_files(id), coworker_confirmations(id)")
    .eq("worker_id", user.id);

  if (logsError) throw new Error(`Log fetch error: ${logsError.message}`);

  const safeLogs = logs || [];
  if (safeLogs.length === 0) throw new Error("No records found to submit.");

  let promised = 0, paid = 0, logsWithMedia = 0, coworkers = 0;
  safeLogs.forEach(log => {
    promised += Number(log.promised_wage || 0);
    paid += Number(log.paid_amount || 0);
    if (log.source === "voice" || log.audio_url || (log.evidence_files && log.evidence_files.length > 0)) {
      logsWithMedia++;
    }
    if (log.coworker_confirmations && log.coworker_confirmations.length > 0) coworkers++;
  });

  const mediaRatio = safeLogs.length > 0 ? logsWithMedia / safeLogs.length : 0;
  let strength = "medium";
  if (mediaRatio < 0.3 && coworkers === 0) strength = "weak";
  else if (mediaRatio >= 0.7 && coworkers >= 2) strength = "strong";

  const { data: refNo, error: rpcError } = await admin.rpc("next_reference_no");
  if (rpcError) {
    throw new Error(`RPC_ERROR: ${rpcError.message}`);
  }

  const { data: newCase, error: caseError } = await admin.from("cases").insert({
    reference_no: refNo || `WS-2026-fallback-${Math.floor(Math.random()*1000)}`,
    worker_id: user.id,
    partner_org_id: DEMO_ORG_ID,
    status: "submitted",
    totals: { days: safeLogs.length, promised, paid, unpaid: promised - paid },
    evidence_strength: strength
  }).select().single();

  if (caseError) {
    // THIS WILL FORCE THE REAL ERROR TO SHOW
    throw new Error(`DB_ERROR: ${caseError.message} | Details: ${caseError.details || ''}`);
  }

  await admin.from("consents").insert({
    worker_id: user.id,
    partner_org_id: DEMO_ORG_ID,
    consent_text: "I agree to share my work logs...",
  });

  await admin.from("case_events").insert({
    case_id: newCase.id,
    status: "submitted",
    notes: "Case submitted by worker",
    created_by: user.id
  });

  return newCase;
}

export async function getWorkerCase() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("worker_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  return data || null;
}
export async function getNgoCases() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get the NGO's organization ID
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile?.org_id) return [];

  // Fetch all cases for this NGO
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("partner_org_id", profile.org_id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function updateCaseStatus(caseId: string, newStatus: string) {
  await connection();
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Update the status
  await admin.from("cases").update({ status: newStatus }).eq("id", caseId);
  
  // Log the audit event
  await admin.from("case_events").insert({
    case_id: caseId,
    status: newStatus,
    notes: "Status updated by Demo Legal Aid Partner",
    created_by: user?.id
  });
}