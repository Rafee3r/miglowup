import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listActiveEvents, daysIntoEvent, type Event } from "@/lib/events";

export default async function ComunidadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const events = await listActiveEvents();
  const featured = events.find((e) => e.is_featured) ?? events[0];
  const whatsappInvite = "https://chat.whatsapp.com/CKmozDPbrtYKJN7GFOmFXn?mode=gi_t";

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Comunidad</h1>
        <p className="text-ink/60 mt-1">No estás sola en esto.</p>
      </div>

      {/* RETO ACTIVO DESTACADO */}
      {featured && <FeaturedEvent event={featured} />}

      {/* WhatsApp grupo principal */}
      <a
        href={whatsappInvite}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#25D366] text-white rounded-3xl p-5 hover:bg-[#1da851] transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">Grupo WhatsApp</div>
            <div className="text-sm opacity-90">Tu cohorte. Activo todos los días.</div>
          </div>
        </div>
      </a>

      {/* Quick links sociales */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/eventos" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 transition active:scale-95">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-semibold">Retos y eventos</div>
          <div className="text-xs text-ink/60 mt-1">Únete a la cohorte</div>
        </Link>
        <Link href="/plan" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 transition active:scale-95">
          <div className="text-2xl mb-2">💎</div>
          <div className="font-semibold">Mi plan</div>
          <div className="text-xs text-ink/60 mt-1">Suscripción y beneficios</div>
        </Link>
      </div>

      {/* Reglas comunidad */}
      <section className="bg-glow-50 border border-glow-200 rounded-2xl p-5 text-sm">
        <p className="font-semibold mb-2">📜 Reglas básicas</p>
        <ul className="space-y-1 text-ink/70 text-xs">
          <li>• Respeto siempre. No spam. No vender cosas.</li>
          <li>• Cero juicio sobre cuerpos. Cero comentarios pesados.</li>
          <li>• Si tienes una duda, pregunta. Hay 247 chilenas para ayudarte.</li>
        </ul>
      </section>
    </div>
  );
}

function FeaturedEvent({ event }: { event: Event }) {
  const { dayN, totalDays, isActive } = daysIntoEvent(event);
  const pct = Math.round((dayN / totalDays) * 100);
  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="block rounded-3xl p-6 text-white shadow-lg active:scale-[0.99] transition relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${event.color_from}, ${event.color_to})` }}
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="text-5xl">{event.emoji}</div>
          {isActive && (
            <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              EN CURSO
            </div>
          )}
        </div>
        <div className="text-xs uppercase tracking-widest font-bold opacity-80 mb-1">Reto activo</div>
        <h3 className="font-serif text-2xl font-black leading-tight mb-1">{event.title}</h3>
        {event.subtitle && <p className="text-sm opacity-90 mb-4">{event.subtitle}</p>}

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span>Día {dayN} de {totalDays}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-2 text-sm font-bold">
          Ver detalles →
        </div>
      </div>
    </Link>
  );
}
