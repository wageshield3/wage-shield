import Link from "next/link";
import type { ReactNode } from "react";
import { helperSignOut } from "../actions";

export function Loading() {
  return <main className="flex min-h-dvh items-center justify-center bg-[#F3F6FA] text-lg text-[#41546B]">Loading…</main>;
}

export default function HelperShell({ name, back, children }: { name: string; back?: boolean; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#F3F6FA] text-[#12263F]">
      <header className="flex items-center justify-between gap-4 bg-[#12263F] px-5 py-4 text-white">
        <div>
          <div className="text-xl font-bold">Wage Shield · Helper · ಸಹಾಯಕ</div>
          <div className="text-sm text-[#C9D6E5]">{name}</div>
        </div>
        <form action={helperSignOut}>
          <button type="submit" className="min-h-11 rounded-xl border-2 border-white px-4 font-bold">Log out</button>
        </form>
      </header>
      <section className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
        {back && <Link href="/helper" className="min-h-11 font-bold underline">← Back to my workers</Link>}
        {children}
      </section>
      <footer className="p-4 text-center text-sm text-[#41546B]">Prototype with sample data</footer>
    </main>
  );
}
