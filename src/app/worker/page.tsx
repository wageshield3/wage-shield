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
import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import LinkCodeCard from "@/modules/helpermode/components/LinkCodeCard";

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
    <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="text-xs uppercase font-bold text-[#41546B] tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-black text-[#12263F]">{value}</div>
    </div>
  );

  return (
    <HomeShell profile={profile}>
      <div className="flex flex-col gap-6 animate-fadeIn pb-10">
        <LanguageSwitch current={lang} />
        
        {/* Unpaid Balance Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#B3261E] to-[#8C1D18] p-6 text-white shadow-lg">
          <div className="text-sm font-medium uppercase tracking-wider opacity-90">{t(lang, "unpaid")}</div>
          <div className="text-5xl font-black mt-1">{rupees(Math.max(0, s.unpaid))}</div>
        </div>
        
        {/* Stats Row */}
        <div className="flex gap-3">
          {stat(t(lang, "days"), String(s.days))}
          {stat(t(lang, "totalPromised"), rupees(s.promised))}
          {stat(t(lang, "totalPaid"), rupees(s.paid))}
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link className="flex-1 flex min-h-[56px] items-center justify-center gap-3 bg-[#F5A524] hover:bg-[#E0941F] text-[#12263F] font-bold py-4 px-6 rounded-2xl shadow-md text-base active:scale-95 transition-all text-center" href="/worker/complaint">
            <FileText size={22} /> {t(lang, "generateComplaint")}
          </Link>
          
          <Link className="flex-1 flex min-h-[56px] items-center justify-center gap-3 bg-[#1E7A4F] hover:bg-[#17613E] text-white font-bold py-4 px-6 rounded-2xl shadow-md text-base active:scale-95 transition-all text-center" href="/worker/share">
            <ShieldCheck size={22} /> {t(lang, "trackStatus")}
          </Link>
        </div>

        <VoiceEntry lang={lang} defaults={{ site: last?.site_name ?? "", contractor: last?.contractor_name ?? "", promised: Number(last?.promised_wage ?? 0) }} />
        <LogForm lang={lang} defaults={{ site: last?.site_name ?? "", contractor: last?.contractor_name ?? "", promised: Number(last?.promised_wage ?? 800) }} />
        
        {/* Recent Entries */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-xl font-bold text-[#12263F]">{t(lang, "recent")}</h2>
          {logs.length === 0 ? <p className="text-[#41546B]">{t(lang, "none")}</p> : (
            <ul className="divide-y divide-gray-100">
              {logs.slice(0, 7).map((l) => (
                <li key={l.id} className="flex justify-between py-3 text-base">
                  <span className="text-[#41546B] font-medium">{l.work_date} · {Number(l.hours ?? 0) > 0 ? `${l.hours} h` : t(lang, "notWorked")}</span>
                  <span className="font-bold text-[#12263F]">{rupees(Number(l.paid_amount))} / {rupees(Number(l.promised_wage))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <p className="text-center text-xs text-[#41546B] mt-2">{t(lang, "disclaimer")}</p>
      </div>
    </HomeShell>
  );
}