import Link from "next/link";
import { redirect } from "next/navigation";
import { listRoutines } from "@/lib/routines";
import { createClient } from "@/lib/supabase/server";
import { daysAgoISO } from "@/lib/time";

export default async function RutinasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");

  // Cargar últimos 30 días de logs para mostrar "ya hecho" y streak
  const { data: logs } = await supabase
    .from("routine_logs")
    .select("routine_slug, completed_at")
    .eq("user_id", user.id)
    .gte("completed_at", daysAgoISO(30));

  const completedCount = (logs ?? []).reduce<Record<string, number>>((acc, log) => {
    acc[log.routine_slug] = (acc[log.routine_slug] ?? 0) + 1;
    return acc;
  }, {});

  const routines = listRoutines();

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Biblioteca de rutinas</h1>
        <p className="text-ink/60 mt-1">Elige la que te haga sentido hoy. Tu cuerpo sabe.</p>
      </div>

      <div className="space-y-3">
        {routines.map((r) => {
          const done = completedCount[r.slug] ?? 0;
          return (
            <Link
              key={r.slug}
              href={`/rutinas/${r.slug}`}
              className="group block relative overflow-hidden rounded-3xl border border-ink/10 hover:border-glow-300 transition shadow-sm hover:shadow-lg"
            >
              <div className={`bg-gradient-to-br ${r.color} p-5 flex items-center gap-4 text-white`}>
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl flex-shrink-0">
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-xl font-bold leading-tight">{r.title}</div>
                  <div className="text-sm text-white/80 mt-0.5">{r.duration} · {r.level} · {r.exercises.length} ejercicios</div>
                </div>
                {done > 0 && (
                  <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold">
                    {done}× ✓
                  </div>
                )}
                <div className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition">›</div>
              </div>
              <div className="bg-white px-5 py-3 text-xs text-ink/60">
                {r.description}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
