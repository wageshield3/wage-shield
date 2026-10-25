export type UserRole = "worker" | "helper" | "ngo";
export type Lang = "en" | "kn" | "hi";
export type CaseStatus =
  | "draft" | "submitted" | "evidence_review"
  | "notice_sent" | "hearing_scheduled" | "resolved";
export type EvidenceLevel = "weak" | "medium" | "strong";
export type LogSource = "tap" | "voice" | "photo";

export interface Profile {
  id: string; role: UserRole; full_name: string | null;
  language: Lang; phone: string | null; org_id: string | null;
}
export interface WorkLog {
  id: string; worker_id: string; logged_by: string; work_date: string;
  hours: number | null; site_name: string | null; contractor_name: string | null;
  promised_wage: number; paid_amount: number; balance: number;
  source: LogSource; audio_url: string | null; transcript: string | null;
  confidence: number | null; confirmed_at: string | null;
}
export interface Case {
  id: string; worker_id: string; partner_org_id: string | null;
  reference_no: string | null; status: CaseStatus;
  total_promised: number; total_paid: number; total_unpaid: number;
  evidence_strength: EvidenceLevel | null; submitted_at: string | null;
}
export interface CaseEvent {
  id: string; case_id: string; actor_id: string | null;
  actor_role: UserRole | null; event_type: string; note: string | null; created_at: string;
}
