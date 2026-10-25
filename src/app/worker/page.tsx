import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { WorkLog } from "@/lib/types";
import { requireRole } from "@/modules/auth/lib/session";
import HomeShell, { PageLoading } from "@/modules/auth/components/HomeShell";
import { t } from "@/modules/i18n/dictionary";
import { computeSummary, rupees } from "@/modules/logs/lib/summary";
import LogForm from "@/modules/logs/components/LogForm";
import LanguageSwitch from "@/modules/logs/components/LanguageSwitch";
import VoiceEntry from "@/modules/voice/components/VoiceEntry";

// Added imports for the button
import Link from "next/link";
import { FileText } from "lucide-react";

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const profile = await requireRole(["worker"]);
  const lang = profile.language;
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_logs").select("*").eq("worker_id", profile.id)
    .order("work_date", { ascending: false }).order("created_at", { ascending: false });
  const logs = (data ?? []) as WorkLog[];
  const s = computeSummary(logs);
  const last = logs.find((l) => Number(l.hours ?? 0) > 0);
  const stat = (label: string, value: string) => (
    <div className="flex-1 rounded-xl bg-white p-3">
      <div className="text-sm text-[#41546B]">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );

  return (
    <HomeShell profile={profile}>
      <div className="flex flex-col gap-5">
        <LanguageSwitch current={lang} />
        
        <div className="rounded-2xl bg-[#B3261E] p-5 text-white">
          <div className="text-base">{t(lang, "unpaid")}</div>
          <div className="text-5xl font-bold">{rupees(Math.max(0, s.unpaid))}</div>
        </div>
        
        <div className="flex gap-3">
          {stat(t(lang, "days"), String(s.days))}
          {stat(t(lang, "totalPromised"), rupees(s.promised))}
          {stat(t(lang, "totalPaid"), rupees(s.paid))}
        </div>

        {/* NEW GENERATE COMPLAINT BUTTON (Module 5) */}
        <Link 
          href="/worker/complaint" 
          className="flex w-full min-h-[56px] items-center justify-center gap-2 bg-[#F5A524] text-[#12263F] font-bold py-4 rounded-xl shadow-md text-lg active:scale-95 transition-transform"
        >
          <FileText size={24} /> {t(lang, "generateComplaint")}
        </Link>

        <VoiceEntry lang={lang} defaults={{ site: last?.site_name ?? "", contractor: last?.contractor_name ?? "", promised: Number(last?.promised_wage ?? 0) }} />
        <LogForm lang={lang} defaults={{ site: last?.site_name ?? "", contractor: last?.contractor_name ?? "", promised: Number(last?.promised_wage ?? 800) }} />
        
        <div className="rounded-2xl bg-white p-5">
          <h2 className="mb-2 text-xl font-bold">{t(lang, "recent")}</h2>
          {logs.length === 0 ? <p className="text-[#41546B]">{t(lang, "none")}</p> : (
            <ul className="divide-y divide-[#D9E1EA]">
              {logs.slice(0, 7).map((l) => (
                <li key={l.id} className="flex justify-between py-2 text-base">
                  <span>{l.work_date} · {Number(l.hours ?? 0) > 0 ? `${l.hours} h` : t(lang, "notWorked")}</span>
                  <b>{rupees(Number(l.paid_amount))} / {rupees(Number(l.promised_wage))}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <p className="text-center text-sm text-[#41546B]">{t(lang, "disclaimer")}</p>
      </div>
    </HomeShell>
  );
}