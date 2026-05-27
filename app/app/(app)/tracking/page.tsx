import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackingClient } from "./TrackingClient";

export default async function TrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: measurements } = await supabase
    .from("measurements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  const { data: logs } = await supabase
    .from("routine_logs")
    .select("routine_slug, completed_at")
    .eq("user_id", user.id)
    .gte("completed_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order("completed_at", { ascending: false });

  return (
    <TrackingClient
      measurements={(measurements ?? []).reverse()}
      logs={logs ?? []}
    />
  );
}
