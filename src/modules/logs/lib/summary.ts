import type { WorkLog } from "@/lib/types";

export function computeSummary(rows: WorkLog[]) {
  let days = 0, promised = 0, paid = 0;
  for (const r of rows) {
    if (Number(r.hours ?? 0) > 0) days++;
    promised += Number(r.promised_wage) || 0;
    paid += Number(r.paid_amount) || 0;
  }
  return { days, promised, paid, unpaid: promised - paid };
}

export const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");
