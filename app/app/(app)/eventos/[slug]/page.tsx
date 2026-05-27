import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventBySlug, isUserInEvent, getLeaderboard, daysIntoEvent } from "@/lib/events";
import { JoinButton } from "./JoinButton";

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [joined, leaderboard] = await Promise.all([
    isUserInEvent(event.id, user.id),
    getLeaderboard(event, user.id, 5),
  ]);

  const { dayN, totalDays, isActive } = daysIntoEvent(event);
  const meRow = leaderboard.find((r) => r.isMe);
  const myRank = meRow?.rank ?? null;
  const myWorkouts = meRow?.workouts ?? 0;
  const goalPct = Math.min(100, Math.round((myWorkouts / event.goal_workouts) * 100));

  return (
    <div className="fade-in -mx-5 -my-6">
      {/* HERO */}
      <section
        className="text-white px-5 py-12 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${event.color_from}, ${event.color_to})` }}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <Link href="/eventos" className="text-white/80 text-sm font-medium relative z-10">‹ Eventos</Link>

        <div className="mt-6 relative z-10">
          <div className="text-6xl mb-3">{event.emoji}</div>
          <h1 className="font-serif text-4xl font-black leading-tight mb-2">{event.title}</h1>
          {event.subtitle && <p className="text-white/90 mb-3">{event.subtitle}</p>}

          {isActive && (
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              EN CURSO · DÍA {dayN} DE {totalDays}
            </div>
          )}

          {event.description && (
            <p className="text-white/85 text-sm leading-relaxed mb-5">{event.description}</p>
          )}

          <div className="grid grid-cols-3 gap-2 mb-5">
            <StatBox label="Meta" value={`${event.goal_workouts} entrenos`} />
            <StatBox label="Duración" value={`${totalDays} días`} />
            <StatBox label="Plazas" value={joined ? "✓ Estás dentro" : "Abiertas"} />
          </div>

          <JoinButton eventId={event.id} initialJoined={joined} />
        </div>
      </section>

      {/* MI PROGRESO */}
      {joined && isActive && (
        <section className="px-5 py-6 bg-white border-b border-ink/5">
          <h2 className="font-serif text-lg font-bold mb-3">Tu progreso</h2>
          <div className="bg-glow-50 border border-glow-200 rounded-2xl p-5">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs uppercase tracking-widest font-bold text-glow-700">Entrenamientos</span>
              <span className="font-serif text-3xl font-black text-glow-700">{myWorkouts}<span className="text-base text-ink/40">/{event.goal_workouts}</span></span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-glow-400 to-glow-600 transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-ink/60">
              <span>{goalPct}% completado</span>
              {myRank && <span>Ranking #{myRank}</span>}
            </div>
          </div>
        </section>
      )}

      {/* LEADERBOARD */}
      <section className="px-5 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-serif text-xl font-bold">Ranking</h2>
          <span className="text-xs text-ink/50">Por entrenamientos completados</span>
        </div>

        <div className="space-y-2">
          {leaderboard.map((row) => (
            <LeaderboardRow key={row.user_id} row={row} />
          ))}
        </div>

        {!joined && (
          <p className="text-center text-xs text-ink/40 mt-6">
            Únete al reto para entrar al ranking ↑
          </p>
        )}
      </section>

      {/* CTA INFERIOR */}
      <section className="px-5 pb-8">
        <div className="bg-ink text-cream rounded-2xl p-5 text-sm">
          <p className="font-bold mb-2">¿Cómo cuenta un día?</p>
          <ul className="space-y-1 text-cream/80">
            <li>• Completa cualquier rutina de la app, mínimo 15 min</li>
            <li>• 1 entrenamiento por día — no acumulas haciendo 3 seguidos</li>
            <li>• Se actualiza automático al terminar la rutina</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-xl p-3 backdrop-blur border border-white/10">
      <div className="text-[10px] uppercase tracking-widest font-bold text-white/70">{label}</div>
      <div className="text-sm font-bold mt-0.5 leading-tight">{value}</div>
    </div>
  );
}

function LeaderboardRow({ row }: { row: { user_id: string; first_name: string | null; workouts: number; rank: number; isMe: boolean } }) {
  const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : null;
  const initial = (row.first_name ?? "?").charAt(0).toUpperCase();
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border transition ${row.isMe ? "bg-glow-50 border-glow-300" : "bg-white border-ink/10"}`}>
      <div className="w-8 text-center">
        {medal ? <span className="text-xl">{medal}</span> : <span className="font-bold text-ink/40 text-sm">#{row.rank}</span>}
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${row.isMe ? "bg-glow-500 text-white" : "bg-ink/10 text-ink/70"}`}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          {row.first_name ?? "Anónima"}
          {row.isMe && <span className="ml-1.5 text-xs text-glow-600 font-bold">· Tú</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="font-serif text-xl font-black">{row.workouts}</div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-ink/40">entrenos</div>
      </div>
    </div>
  );
}
