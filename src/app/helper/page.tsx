"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { requireRole } from "@/modules/auth/lib/session"; // Note: Client components handle auth differently, let's use standard client fetch
import { Shield, LogOut, Users, FileText, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HelperDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(prof);

      // Fetch all cases across the system so the helper can assist workers
      const { data: allCases } = await supabase
        .from("cases")
        .select("*, profiles:worker_id(full_name, phone)")
        .order("created_at", { ascending: false });

      setCases(allCases || []);
      setLoading(false);
    }
    loadData();
  }, [router, supabase]);

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
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-[#12263F] text-white p-6 md:p-8 rounded-3xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Users size={34} className="text-[#F5A524]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Community Helper Portal</h1>
              <p className="text-gray-300 text-sm md:text-base">Welcome back, {profile?.full_name || "Helper"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl font-bold transition-all"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Quick Info Banner */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4">
          <Shield className="text-[#1E7A4F] w-10 h-10 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">Field Assistance Active</h2>
            <p className="text-gray-600 text-sm">
              As a helper, you can monitor submitted worker cases, verify documentation, and coordinate with legal aid partners on behalf of informal workers.
            </p>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <FileText className="text-[#F5A524]" /> Worker Cases in Your Area ({cases.length})
          </h2>

          {cases.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-medium">
              No cases submitted by workers yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {cases.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold text-lg text-[#12263F]">{c.reference_no}</span>
                      <span className="px-3 py-1 bg-[#1E7A4F]/10 text-[#1E7A4F] text-xs font-black uppercase rounded-full">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Worker: <span className="font-bold text-[#12263F]">{c.profiles?.full_name || "Anonymous Worker"}</span> ({c.profiles?.phone || "No phone"})
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase font-bold">Unpaid Amount</div>
                      <div className="text-xl font-black text-[#B3261E]">₹{c.totals?.unpaid || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}