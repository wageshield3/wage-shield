import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  await connection(); // run at visit time, not while the page is being prepared
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
}

export function homeFor(role: UserRole): string {
  if (role === "ngo") return "/ngo";
  if (role === "helper") return "/helper";
  return "/worker";
}

export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!allowed.includes(profile.role)) redirect(homeFor(profile.role));
  return profile;
}