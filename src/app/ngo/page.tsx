"use client";

import { useEffect, useState } from "react";
import { getNgoCases, updateCaseStatus } from "@/modules/cases/actions";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, LogOut, CheckCircle, Clock } from "lucide-react";
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

  // Supabase Realtime Subscription (New cases appear live!)
  useEffect(() => {
    const channel = supabase.channel('ngo-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
        // Refresh the list when any case changes
        getNgoCases().then(setCases);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  async function handleStatusChange(caseId: string, newStatus: string) {
    await updateCaseStatus(caseId, newStatus);
    // UI updates automatically via realtime!
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xl font-bold">Loading NGO Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-[#12263F] text-white p-6 rounded-2xl shadow-md mb-8">
          <div className="flex items-center gap-4">
            <ShieldAlert size={36} className="text-[#F5A524]" />
            <div>
              <h1 className="text-2xl font-black">Partner Dashboard</h1>
              <p className="text-gray-300">Demo Legal Aid Partner</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-3 rounded-lg font-bold transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm tracking-wider border-b border-gray-200">
                <th className="p-4 font-bold">Ref No.</th>
                <th className="p-4 font-bold">Date Submitted</th>
                <th className="p-4 font-bold">Unpaid Amount</th>
                <th className="p-4 font-bold">Evidence Strength</th>
                <th className="p-4 font-bold">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No active cases yet.</td></tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#12263F]">{c.reference_no}</td>
                    <td className="p-4 text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-[#B3261E]">₹{c.totals?.unpaid || 0}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${c.evidence_strength === 'strong' ? 'bg-[#1E7A4F]/20 text-[#1E7A4F]' : 'bg-[#F5A524]/20 text-[#F5A524]'}`}>
                        {c.evidence_strength}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className="bg-white border border-gray-300 text-sm rounded-lg focus:ring-[#F5A524] focus:border-[#F5A524] block w-full p-2.5 font-bold text-[#12263F]"
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
  );
}