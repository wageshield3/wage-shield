"use client";

import { useEffect, useState } from "react";
import { getNgoCases, updateCaseStatus } from "@/modules/cases/actions";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, LogOut, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NgoDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const data = await getNgoCases();
      setCases(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('ngo-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
        getNgoCases().then(setCases);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  async function handleStatusChange(caseId: string, newStatus: string) {
    await updateCaseStatus(caseId, newStatus);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#12263F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#12263F] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-[#12263F] text-white p-6 md:p-8 rounded-3xl shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <ShieldAlert size={36} className="text-[#F5A524]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Partner Legal Dashboard</h1>
              <p className="text-gray-300 text-sm md:text-base">Demo Legal Aid Partner · Live Monitoring</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl font-bold transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Data Table Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2">
              <FileSpreadsheet className="text-[#1E7A4F]" /> Active Worker Cases ({cases.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-200">
                  <th className="p-5 font-bold">Ref No.</th>
                  <th className="p-5 font-bold">Date Submitted</th>
                  <th className="p-5 font-bold">Unpaid Amount</th>
                  <th className="p-5 font-bold">Evidence Strength</th>
                  <th className="p-5 font-bold">Case Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-medium">No active cases reported yet.</td></tr>
                ) : (
                  cases.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-5 font-mono font-bold text-[#12263F]">{c.reference_no}</td>
                      <td className="p-5 text-gray-600 font-medium">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="p-5 font-black text-[#B3261E] text-lg">₹{c.totals?.unpaid || 0}</td>
                      <td className="p-5">
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${c.evidence_strength === 'strong' ? 'bg-[#1E7A4F]/10 text-[#1E7A4F]' : 'bg-[#F5A524]/10 text-[#D97706]'}`}>
                          {c.evidence_strength}
                        </span>
                      </td>
                      <td className="p-5">
                        <select 
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          className="bg-gray-50 border border-gray-300 text-sm rounded-xl focus:ring-[#F5A524] focus:border-[#F5A524] block w-full p-3 font-bold text-[#12263F] shadow-sm cursor-pointer"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="evidence_review">Evidence Review</option>
                          <option value="notice_sent">Notice Sent</option>
                          <option value="hearing_scheduled">Hearing Scheduled</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}