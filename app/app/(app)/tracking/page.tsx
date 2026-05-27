import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackingClient } from "./TrackingClient";
import { daysAgoISO } from "@/lib/time";

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
    .gte("completed_at", daysAgoISO(90))
    .order("completed_at", { ascending: false });

  // Calcular calendario de hábito server-side para evitar Date.now() en cliente
  const allLogs = logs ?? [];
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const todayKey = new Date(nowMs).toISOString().slice(0, 10);
  const calendarDays: { date: string; hasWorkout: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(nowMs - i * 86400000).toISOString().slice(0, 10);
    calendarDays.push({
      date: d,
      hasWorkout: allLogs.some((l) => l.completed_at.slice(0, 10) === d),
    });
  }

  return (
    <TrackingClient
      measurements={(measurements ?? []).reverse()}
      calendarDays={calendarDays}
      todayKey={todayKey}
    />
  );
}
