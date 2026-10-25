"use client";

import { useEffect, useState } from "react";
import { submitCase, getWorkerCase } from "@/modules/cases/actions";
import { t } from "@/modules/i18n/dictionary";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ArrowLeft, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Noto_Sans, Noto_Sans_Kannada } from 'next/font/google';

const notoSans = Noto_Sans({ subsets: ['latin'], weight: ['400', '700'] });
const notoSansKannada = Noto_Sans_Kannada({ subsets: ['kannada'], weight: ['400', '700'] });

export default function SharePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const lang = "en"; 
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const existing = await getWorkerCase();
      setCaseData(existing);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!caseData?.id) return;
    const channel = supabase.channel('case-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cases', filter: `id=eq.${caseData.id}` }, (payload) => {
        setCaseData(payload.new);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseData?.id, supabase]);

  async function handleShare() {
    setSubmitting(true);
    try {
      const newCase = await submitCase();
      setCaseData(newCase);
    } catch (error: any) {
      alert(`REAL ERROR: ${error.message || error}`);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F3F6FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#12263F]"></div>
      </div>
    );
  }

  if (caseData) {
    return (
      <div className={`min-h-screen w-full bg-[#F3F6FA] text-[#12263F] p-4 md:p-8 ${notoSans.className} ${notoSansKannada.className}`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <Link className="flex items-center gap-2 text-[#41546B] font-bold p-2 bg-white rounded-lg w-fit shadow-sm min-h-[56px]" href="/worker">
            <ArrowLeft size={24} /> {t(lang, "back")}
          </Link>
          
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 text-center mt-4">
            <CheckCircle className="text-[#1E7A4F] w-20 h-20 mx-auto mb-4"/>
            <h1 className="text-3xl font-black mb-2">{t(lang, "receiptTitle")}</h1>
            <p className="text-[#41546B] font-mono text-xl mb-8">{caseData.reference_no}</p>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 text-left max-w-2xl mx-auto">
              <p className="text-sm text-[#41546B] mb-1">Partner</p>
              <p className="font-bold text-lg">Demo Legal Aid Partner</p>
            </div>

            <div className="bg-[#12263F] text-white p-6 rounded-xl flex items-center justify-center gap-3 max-w-2xl mx-auto">
              <Clock className="text-[#F5A524]" size={28} />
              <span className="font-bold text-xl uppercase tracking-wide">
                {caseData.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-[#F3F6FA] text-[#12263F] p-4 md:p-8 ${notoSans.className} ${notoSansKannada.className}`}>
       <div className="max-w-4xl mx-auto flex flex-col gap-4">
         <Link className="flex items-center gap-2 text-[#41546B] font-bold p-2 bg-white rounded-lg w-fit shadow-sm min-h-[56px]" href="/worker">
            <ArrowLeft size={24} /> {t(lang, "back")}
          </Link>

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 mt-4">
            <ShieldCheck className="text-[#F5A524] w-16 h-16 mb-6"/>
            <h1 className="text-3xl font-black mb-4">{t(lang, "consentTitle")}</h1>
            <p className="text-xl text-[#41546B] mb-10 leading-relaxed">
              {t(lang, "consentText")}
            </p>

            <button 
              onClick={handleShare}
              disabled={submitting}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#1E7A4F] text-white font-bold py-4 px-10 rounded-xl shadow-md min-h-[56px] text-lg active:scale-95 disabled:opacity-50 transition-transform"
            >
              {submitting ? "..." : t(lang, "agreeShare")}
            </button>
          </div>
       </div>
    </div>
  );
}