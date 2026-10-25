"use client";

import { useEffect, useState } from "react";
import { generateComplaint, ComplaintResult } from "@/modules/complaint/actions";
import { t } from "@/modules/i18n/dictionary";
import { FileText, Printer, ArrowLeft, PhoneCall, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Noto_Sans, Noto_Sans_Kannada } from 'next/font/google';

const notoSans = Noto_Sans({ subsets: ['latin'], weight: ['400', '700'] });
const notoSansKannada = Noto_Sans_Kannada({ subsets: ['kannada'], weight: ['400', '700'] });

export default function ComplaintPage() {
  const [data, setData] = useState<ComplaintResult | null>(null);
  const [loading, setLoading] = useState(true);
  const lang = "en"; // Connect to profile later

  useEffect(() => {
    async function load() {
      const result = await generateComplaint(lang);
      setData(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F6FA] p-6 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#12263F] mb-4"></div>
        <h2 className="text-xl font-bold text-[#12263F]">{t(lang, "generating")}</h2>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`min-h-screen bg-[#F3F6FA] text-[#12263F] ${notoSans.className} ${notoSansKannada.className}`}>
      <div className="p-4 flex flex-col gap-4 print:hidden max-w-2xl mx-auto">
        <Link href="/worker" className="flex items-center gap-2 text-[#41546B] font-bold p-2 bg-white rounded-lg w-fit shadow-sm min-h-[56px]">
          <ArrowLeft size={24} /> {t(lang, "back")}
        </Link>
        
        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 bg-[#F5A524] text-[#12263F] font-bold py-4 px-6 rounded-xl shadow-md min-h-[56px] text-lg active:scale-95"
        >
          <Printer size={24} /> {t(lang, "printPdf")}
        </button>

        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-[#F5A524]">
          <h3 className="font-bold text-lg mb-2">{t(lang, "whatToCarry")}</h3>
          <ul className="space-y-2 text-[#41546B]">
            <li>{t(lang, "carryId")}</li>
            <li>{t(lang, "carryPhone")}</li>
            <li>{t(lang, "carryPhotos")}</li>
          </ul>
        </div>

        <div className="bg-[#1E7A4F] text-white p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold">{t(lang, "labourline")}</h3>
            <p className="text-2xl font-black mt-1">{t(lang, "labourlinePhone")}</p>
          </div>
          <PhoneCall size={32} />
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto print:max-w-none print:p-0 print:bg-white">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm print:shadow-none print:border-none border border-gray-200">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
              <FileText className="text-[#F5A524]" /> {t(lang, "complaintDraft")}
            </h1>
            <p className="text-lg font-medium text-[#1E7A4F]">{data.localSummary}</p>
          </div>

          <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed text-base print:text-black">
            {data.englishLetter}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 print:break-inside-avoid">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="text-[#1E7A4F]" /> {t(lang, "evidenceSummary")}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-2xl font-black text-[#12263F]">{data.evidence.voiceNotes}</p>
                <p className="text-sm text-[#41546B]">{t(lang, "voiceNotes")}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-2xl font-black text-[#12263F]">{data.evidence.photos}</p>
                <p className="text-sm text-[#41546B]">{t(lang, "photos")}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-2xl font-black text-[#12263F]">{data.evidence.coworkers}</p>
                <p className="text-sm text-[#41546B]">{t(lang, "coworker")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 text-center text-sm text-[#41546B] flex items-center justify-center gap-2 print:mt-10 print:hidden">
        <AlertTriangle size={16} /> {t(lang, "disclaimer")}
      </div>
    </div>
  );
}