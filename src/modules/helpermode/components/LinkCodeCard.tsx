import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export default function LinkCodeCard() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

async function Inner() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role, link_code").eq("id", user.id).single();
  if (!data || data.role !== "worker" || !data.link_code) return null;
  return (
    <div className="rounded-2xl border-2 border-[#12263F] bg-white p-5 text-[#12263F]">
      <div className="text-base font-semibold">Your helper code · ನಿಮ್ಮ ಸಹಾಯಕರ ಕೋಡ್</div>
      <div className="my-2 text-4xl font-bold tracking-widest">{data.link_code as string}</div>
      <p className="text-sm text-[#41546B]">Give this code only to a family member or volunteer you trust, so they can log your work for you.</p>
      <p className="text-sm text-[#41546B]">ನೀವು ನಂಬುವ ಕುಟುಂಬದವರು ಅಥವಾ ಸ್ವಯಂಸೇವಕರಿಗೆ ಮಾತ್ರ ಈ ಕೋಡ್ ಕೊಡಿ.</p>
    </div>
  );
}
