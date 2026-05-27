import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackingClient } from "./TrackingClient";
import { daysAgoISO, todayKey, dateKeyDaysAgo, getChileanDateString } from "@/lib/time";

export default async function TrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");

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

  // Calcular calendario de hábito server-side usando la zona horaria chilena
  const allLogs = logs ?? [];
  const todayDateKey = todayKey();
  const calendarDays: { date: string; hasWorkout: boolean }[] = [];
  
  for (let i = 34; i >= 0; i--) {
    const d = dateKeyDaysAgo(i);
    calendarDays.push({
      date: d,
      hasWorkout: allLogs.some((l) => getChileanDateString(l.completed_at) === d),
    });
  }

  return (
    <TrackingClient
      measurements={(measurements ?? []).reverse()}
      calendarDays={calendarDays}
      todayKey={todayDateKey}
    />
  );
}
