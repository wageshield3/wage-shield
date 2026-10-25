"use client";

import { useActionState, useEffect, useState } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/modules/i18n/dictionary";
import { addLog } from "../actions";
import type { LogState } from "../types";

const HOURS = [4, 6, 8, 9, 10, 12];
const PROMISED = [500, 600, 700, 800, 1000];
const PAID = [0, 100, 200, 300, 500];
const base = "min-h-14 rounded-xl border-2 border-[#12263F] px-4 text-lg font-bold";
const field = "w-full min-h-14 rounded-xl border-2 border-[#12263F] bg-white px-4 text-lg text-[#12263F]";
const lab = "mb-1 block text-base font-semibold";

function Chips({ values, value, onPick }: { values: number[]; value: number; onPick: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onPick(v)}
          className={`${base} ${value === v ? "bg-[#12263F] text-white" : "bg-white text-[#12263F]"}`}>{v}</button>
      ))}
    </div>
  );
}

export default function LogForm({ lang, defaults }: { lang: Lang; defaults: { site: string; contractor: string; promised: number } }) {
  const [state, formAction, pending] = useActionState<LogState, FormData>(addLog, {});
  const [status, setStatus] = useState<"worked" | "notworked">("worked");
  const [hours, setHours] = useState(8);
  const [promised, setPromised] = useState(defaults.promised || 800);
  const [paid, setPaid] = useState(0);
  const [date, setDate] = useState("");

  useEffect(() => {
    const d = new Date();
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);

  const worked = status === "worked";
  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl bg-white p-5">
      <h2 className="text-2xl font-bold">{t(lang, "logDay")}</h2>
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="hours" value={hours} />

      <div className="flex gap-3">
        <button type="button" aria-pressed={worked} onClick={() => setStatus("worked")}
          className={`${base} flex-1 ${worked ? "border-[#1E7A4F] bg-[#1E7A4F] text-white" : "bg-white"}`}>{t(lang, "worked")}</button>
        <button type="button" aria-pressed={!worked} onClick={() => setStatus("notworked")}
          className={`${base} flex-1 ${!worked ? "bg-[#12263F] text-white" : "bg-white"}`}>{t(lang, "notWorked")}</button>
      </div>

      <div>
        <label htmlFor="date" className={lab}>{t(lang, "date")}</label>
        <input id="date" name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </div>

      {worked && (
        <>
          <div><span className={lab}>{t(lang, "hours")}</span><Chips values={HOURS} value={hours} onPick={setHours} /></div>
          <div>
            <label htmlFor="promised" className={lab}>{t(lang, "promised")}</label>
            <Chips values={PROMISED} value={promised} onPick={setPromised} />
            <input id="promised" name="promised" type="number" inputMode="numeric" min={0} value={promised}
              onChange={(e) => setPromised(Number(e.target.value) || 0)} className={`${field} mt-2`} />
          </div>
          <div>
            <label htmlFor="paid" className={lab}>{t(lang, "paid")}</label>
            <Chips values={PAID} value={paid} onPick={setPaid} />
            <input id="paid" name="paid" type="number" inputMode="numeric" min={0} value={paid}
              onChange={(e) => setPaid(Number(e.target.value) || 0)} className={`${field} mt-2`} />
          </div>
          <div>
            <label htmlFor="site" className={lab}>{t(lang, "site")}</label>
            <input id="site" name="site" defaultValue={defaults.site} className={field} />
          </div>
          <div>
            <label htmlFor="contractor" className={lab}>{t(lang, "contractor")}</label>
            <input id="contractor" name="contractor" defaultValue={defaults.contractor} className={field} />
          </div>
        </>
      )}

      {state.error && <p role="alert" className="rounded-xl bg-[#FBE9E7] p-3 font-semibold text-[#B3261E]">{t(lang, "error")}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-[#E3F4EA] p-3 font-semibold text-[#1E7A4F]">{t(lang, "saved")}</p>}

      <button type="submit" disabled={pending} className="min-h-16 rounded-xl bg-[#F5A524] text-xl font-bold text-[#12263F] disabled:opacity-60">
        {t(lang, "save")}
      </button>
    </form>
  );
}
