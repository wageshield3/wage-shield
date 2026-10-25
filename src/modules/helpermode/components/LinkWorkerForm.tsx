"use client";

import { useActionState } from "react";
import { linkWorker } from "../actions";
import type { HelperState } from "../types";

export default function LinkWorkerForm() {
  const [state, action, pending] = useActionState<HelperState, FormData>(linkWorker, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl bg-white p-5">
      <h2 className="text-2xl font-bold">Add a worker · ಕಾರ್ಮಿಕರನ್ನು ಸೇರಿಸಿ</h2>
      <p className="text-base text-[#41546B]">Ask the worker for the 6-character code shown on his Wage Shield screen. Only add a worker who agreed to your help.</p>
      <label htmlFor="code" className="font-semibold">Worker code · ಕೋಡ್</label>
      <input id="code" name="code" maxLength={6} autoCapitalize="characters" autoComplete="off" required
        className="min-h-14 rounded-xl border-2 border-[#12263F] px-4 text-2xl font-bold uppercase tracking-widest" />
      {state.error && <p role="alert" className="rounded-xl bg-[#FBE9E7] p-3 font-semibold text-[#B3261E]">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-[#E3F4EA] p-3 font-semibold text-[#1E7A4F]">Linked: {state.name}</p>}
      <button type="submit" disabled={pending} className="min-h-14 rounded-xl bg-[#12263F] text-lg font-bold text-white disabled:opacity-60">Add worker</button>
    </form>
  );
}
