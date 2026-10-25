import type { ReactNode } from "react";
import type { Profile } from "@/lib/types";
import { logOut } from "../actions";

export function PageLoading() {
  return <main className="flex min-h-dvh items-center justify-center bg-[#F3F6FA] text-lg text-[#41546B]">Loading…</main>;
}

export default function HomeShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#F3F6FA] text-[#12263F]">
      <header className="flex items-center justify-between gap-4 bg-[#12263F] px-5 py-4 text-white">
        <div>
          <div className="text-xl font-bold">Wage Shield</div>
          <div className="text-sm text-[#C9D6E5]">{profile.full_name ?? "User"} · {profile.role}</div>
        </div>
        <form action={logOut}>
          <button type="submit" className="min-h-11 rounded-xl border-2 border-white px-4 font-bold">Log out</button>
        </form>
      </header>
      <section className="mx-auto max-w-2xl p-6">{children}</section>
      <footer className="p-4 text-center text-sm text-[#41546B]">Prototype with sample data</footer>
    </main>
  );
}
