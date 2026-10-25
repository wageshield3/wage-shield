import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireHelper() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (profile.role !== "helper") redirect(profile.role === "ngo" ? "/ngo" : "/worker");
  return { supabase, user, name: (profile.full_name as string | null) ?? "Helper" };
}
