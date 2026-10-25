import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile, homeFor } from "@/modules/auth/lib/session";
import { PageLoading } from "@/modules/auth/components/HomeShell";

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeFor(profile.role));
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#F3F6FA] p-6 text-center text-[#12263F]">
      <h1 className="text-5xl font-bold">Wage Shield</h1>
      <p className="max-w-md text-xl text-[#41546B]">Record your work. Keep your proof. Get your wages.</p>
      <p className="max-w-md text-xl text-[#41546B]">ನಿಮ್ಮ ಕೆಲಸ ದಾಖಲಿಸಿ. ಸಾಕ್ಷ್ಯ ಉಳಿಸಿ. ನಿಮ್ಮ ಕೂಲಿ ಪಡೆಯಿರಿ.</p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link href="/login" className="flex min-h-14 items-center justify-center rounded-xl bg-[#12263F] text-lg font-bold text-white">Log in · ಲಾಗಿನ್</Link>
        <Link href="/signup" className="flex min-h-14 items-center justify-center rounded-xl border-2 border-[#12263F] bg-white text-lg font-bold">Create account · ಖಾತೆ ತೆರೆಯಿರಿ</Link>
      </div>
      <p className="text-sm text-[#41546B]">Prototype with sample data</p>
    </main>
  );
}
