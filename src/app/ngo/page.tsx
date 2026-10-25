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
  const profile = await requireRole(["ngo"]);
  return (
    <HomeShell profile={profile}>
      <h1 className="text-2xl font-bold">Partner dashboard</h1>
      <p className="mt-2 text-lg text-[#41546B]">Login works. The case dashboard will appear here in Module 6.</p>
    </HomeShell>
  );
}
