import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoachClient } from "./CoachClient";

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");

  return <CoachClient />;
}
