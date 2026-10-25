import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireHelper } from "@/modules/helpermode/lib/guard";
import HelperShell, { Loading } from "@/modules/helpermode/components/HelperShell";
import HelperLogForm from "@/modules/helpermode/components/HelperLogForm";

type Params = Promise<{ workerId: string }>;

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { workerId } = await params;
  const { supabase, name } = await requireHelper();
  if (!/^[0-9a-f-]{36}$/i.test(workerId)) redirect("/helper");
  const { data: link } = await supabase.from("helper_links").select("worker_id").eq("worker_id", workerId).maybeSingle();
  if (!link) redirect("/helper");

  const [p, l] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", workerId).single(),
    supabase.from("work_logs")
      .select("id, work_date, hours, site_name, contractor_name, promised_wage, paid_amount")
      .eq("worker_id", workerId)
      .order("work_date", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const logs = l.data ?? [];
  let days = 0, promised = 0, paid = 0;
  for (const r of logs) {
    if (Number(r.hours ?? 0) > 0) days++;
    promised += Number(r.promised_wage) || 0;
    paid += Number(r.paid_amount) || 0;
  }
  const last = logs.find((r) => Number(r.hours ?? 0) > 0);
  const rs = (n: number) => "₹" + n.toLocaleString("en-IN");

  return (
    <HelperShell name={name} back>
      <h1 className="text-3xl font-bold">{(p.data?.full_name as string | null) ?? "Worker"}</h1>
      <div className="rounded-2xl bg-[#B3261E] p-5 text-white">
        <div>Unpaid balance · ಬಾಕಿ ಹಣ</div>
        <div className="text-5xl font-bold">{rs(Math.max(0, promised - paid))}</div>
        <div className="mt-1 text-sm">{days} days · promised {rs(promised)} · paid {rs(paid)}</div>
      </div>
      <HelperLogForm workerId={workerId}
        defaults={{ site: (last?.site_name as string | null) ?? "", contractor: (last?.contractor_name as string | null) ?? "", promised: Number(last?.promised_wage ?? 800) }} />
      <div className="rounded-2xl bg-white p-5">
        <h2 className="mb-2 text-xl font-bold">Recent entries</h2>
        {logs.length === 0 ? <p className="text-[#41546B]">No entries yet.</p> : (
          <ul className="divide-y divide-[#D9E1EA]">
            {logs.slice(0, 7).map((r) => (
              <li key={r.id as string} className="flex justify-between py-2">
                <span>{r.work_date as string} · {Number(r.hours ?? 0) > 0 ? `${r.hours} h` : "no work"}</span>
                <b>{rs(Number(r.paid_amount))} / {rs(Number(r.promised_wage))}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HelperShell>
  );
}
