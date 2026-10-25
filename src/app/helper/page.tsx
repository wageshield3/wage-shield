import Link from "next/link";
import { Suspense } from "react";
import { requireHelper } from "@/modules/helpermode/lib/guard";
import HelperShell, { Loading } from "@/modules/helpermode/components/HelperShell";
import LinkWorkerForm from "@/modules/helpermode/components/LinkWorkerForm";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const { supabase, name } = await requireHelper();
  const { data: links } = await supabase.from("helper_links").select("worker_id");
  const ids = (links ?? []).map((l) => l.worker_id as string);

  let workers: { id: string; full_name: string | null }[] = [];
  const unpaid: Record<string, number> = {};
  if (ids.length) {
    const [p, l] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", ids),
      supabase.from("work_logs").select("worker_id, promised_wage, paid_amount").in("worker_id", ids),
    ]);
    workers = (p.data ?? []) as typeof workers;
    for (const r of l.data ?? []) {
      unpaid[r.worker_id as string] = (unpaid[r.worker_id as string] ?? 0) + Number(r.promised_wage) - Number(r.paid_amount);
    }
  }

  return (
    <HelperShell name={name}>
      <LinkWorkerForm />
      <div className="rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-2xl font-bold">My workers · ನನ್ನ ಕಾರ್ಮಿಕರು ({workers.length})</h2>
        {workers.length === 0 ? (
          <p className="text-[#41546B]">No workers linked yet. Add one with their code above.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {workers.map((w) => (
              <li key={w.id}>
                <Link href={`/helper/${w.id}`} className="flex min-h-16 items-center justify-between rounded-xl border-2 border-[#12263F] px-4 py-3">
                  <span className="text-xl font-bold">{w.full_name ?? "Worker"}</span>
                  <span className="text-lg font-bold text-[#B3261E]">₹{Math.max(0, unpaid[w.id] ?? 0).toLocaleString("en-IN")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HelperShell>
  );
}
