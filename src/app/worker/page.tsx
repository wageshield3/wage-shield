import { Suspense } from "react";
import { requireRole } from "@/modules/auth/lib/session";
import HomeShell, { PageLoading } from "@/modules/auth/components/HomeShell";

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const profile = await requireRole(["worker"]);
  return (
    <HomeShell profile={profile}>
      <h1 className="text-2xl font-bold">Worker home</h1>
      <p className="mt-2 text-lg text-[#41546B]">Login works. Your daily log screen will appear here in Module 3.</p>
    </HomeShell>
  );
}
