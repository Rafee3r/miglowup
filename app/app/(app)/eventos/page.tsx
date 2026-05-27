import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listAllEvents, daysIntoEvent } from "@/lib/events";

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const events = await listAllEvents();
  const today = new Date().toISOString().slice(0, 10);

  const active = events.filter((e) => e.start_date <= today && e.end_date >= today);
  const upcoming = events.filter((e) => e.start_date > today);
  const past = events.filter((e) => e.end_date < today);

  return (
    <div className="fade-in space-y-8">
      <div>
        <Link href="/comunidad" className="text-sm text-glow-600 font-semibold">‹ Comunidad</Link>
        <h1 className="font-serif text-3xl font-bold mt-1">Retos y eventos</h1>
        <p className="text-ink/60 mt-1">Únete a una cohorte y compite con cariño.</p>
      </div>

      {active.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs uppercase tracking-widest font-bold text-emerald-700">En curso</h2>
          </div>
          <div className="space-y-3">
            {active.map((e) => <EventCard key={e.id} event={e} status="active" />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest font-bold text-ink/50 mb-3">Próximamente</h2>
          <div className="space-y-3">
            {upcoming.map((e) => <EventCard key={e.id} event={e} status="upcoming" />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest font-bold text-ink/50 mb-3">Pasados</h2>
          <div className="space-y-3 opacity-60">
            {past.map((e) => <EventCard key={e.id} event={e} status="past" />)}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div className="bg-glow-50 border border-glow-200 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-3">🌸</div>
          <h3 className="font-serif text-xl font-bold mb-2">Próximamente</h3>
          <p className="text-ink/60 text-sm">Estamos preparando el próximo reto de la cohorte. Te avisamos en WhatsApp.</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, status }: { event: Awaited<ReturnType<typeof listAllEvents>>[number]; status: "active" | "upcoming" | "past" }) {
  const { dayN, totalDays } = daysIntoEvent(event);
  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="block rounded-2xl p-5 text-white shadow active:scale-[0.99] transition relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${event.color_from}, ${event.color_to})` }}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{event.emoji}</div>
        <div className="flex-1">
          <div className="font-serif text-xl font-bold leading-tight">{event.title}</div>
          {event.subtitle && <div className="text-sm opacity-80 mt-0.5">{event.subtitle}</div>}
          <div className="text-xs opacity-70 mt-2">
            {status === "active" && `Día ${dayN} de ${totalDays}`}
            {status === "upcoming" && `Empieza ${new Date(event.start_date).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`}
            {status === "past" && `Terminó ${new Date(event.end_date).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`}
          </div>
        </div>
        <div className="text-white/60">›</div>
      </div>
    </Link>
  );
}
