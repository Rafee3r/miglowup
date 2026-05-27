"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

const BENEFITS = [
  { emoji: "💬", title: "Acceso a la comunidad", desc: "Grupo WhatsApp privado, 247 chilenas activas todos los días" },
  { emoji: "✨", title: "Coach IA ilimitado", desc: "Pregúntale lo que sea, 24/7, conoce tu objetivo y historial" },
  { emoji: "💪", title: "Rutinas personalizadas", desc: "Ajustadas según tu nivel, tiempo y feedback post-set" },
  { emoji: "🏆", title: "Retos y eventos", desc: "Únete a cohortes con ranking y progreso compartido" },
  { emoji: "📈", title: "Tracking premium", desc: "Charts de peso, cintura y calendario de hábito visual" },
  { emoji: "🔔", title: "Notificaciones inteligentes", desc: "Recordatorios cuando flaqueas, sin spam" },
  { emoji: "🎯", title: "Plan reveal con IA", desc: "Schedule semanal y áreas de foco únicas para ti" },
  { emoji: "🌸", title: "Precio fundadora congelado", desc: "Cuando subamos precio, tu monto queda fijo de por vida" },
];

export function PlanClient({
  firstName, plan, status, trialEndsAt, nextBillingAt, amount,
}: {
  firstName: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  amount: number;
}) {
  const planName = plan === "ANNUAL" ? "Anual fundadora" : "Mensual";
  const statusLabel = status === "trialing" ? "Trial activo" :
                       status === "active" || status === "authorized" ? "Activa" :
                       status === "cancelled" ? "Cancelada" :
                       status === "paused" ? "Pausada" : status;

  const daysUntilCharge = nextBillingAt
    ? Math.max(0, Math.floor((new Date(nextBillingAt).getTime() - Date.now()) / 86400000))
    : trialEndsAt
    ? Math.max(0, Math.floor((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="fade-in space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-glow-600 font-semibold">‹ Inicio</Link>
        <h1 className="font-serif text-3xl font-bold mt-1">Mi plan</h1>
        <p className="text-ink/60 mt-1">Tu suscripción y beneficios.</p>
      </div>

      {/* Hero estado actual */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-glow-500 to-glow-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold opacity-80 mb-1">Plan {planName}</div>
              <div className="font-serif text-3xl font-black leading-tight">
                ${amount.toLocaleString("es-CL")}
                <span className="text-base font-normal opacity-70">/{plan === "ANNUAL" ? "año" : "mes"}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5">
              {(status === "active" || status === "authorized" || status === "trialing") && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              )}
              {statusLabel}
            </div>
          </div>

          {status === "trialing" && daysUntilCharge !== null && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-sm">
              <p className="font-semibold mb-1">🎁 Tu trial gratis está activo</p>
              <p className="opacity-90 text-xs">
                Primer cobro en {daysUntilCharge} día{daysUntilCharge === 1 ? "" : "s"}.
                {nextBillingAt && ` (${new Date(nextBillingAt).toLocaleDateString("es-CL", { day: "numeric", month: "long" })})`}
              </p>
            </div>
          )}
          {(status === "active" || status === "authorized") && nextBillingAt && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-sm">
              <p className="font-semibold mb-1">Próximo cobro</p>
              <p className="opacity-90 text-xs">
                {new Date(nextBillingAt).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                {daysUntilCharge !== null && ` · en ${daysUntilCharge} día${daysUntilCharge === 1 ? "" : "s"}`}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Beneficios */}
      <section>
        <h2 className="font-serif text-xl font-bold mb-4">Lo que incluye tu plan</h2>
        <div className="grid grid-cols-1 gap-2.5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-white rounded-2xl p-4 border border-ink/10 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-glow-50 flex items-center justify-center text-xl flex-shrink-0">
                {b.emoji}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{b.title}</div>
                <div className="text-xs text-ink/60 mt-0.5">{b.desc}</div>
              </div>
              <div className="text-emerald-500 font-bold text-sm">✓</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Notificaciones */}
      <NotificationsSettings firstName={firstName} />

      {/* Acciones */}
      <section className="space-y-2.5">
        <h2 className="font-serif text-xl font-bold mb-2">Gestión</h2>
        <Link href="mailto:hola@miglowup.cl?subject=Cancelar%20mi%20suscripci%C3%B3n%20MiGlowUp" className="block bg-white rounded-2xl p-4 border border-ink/10 hover:border-rose-300 transition flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Cancelar suscripción</div>
            <div className="text-xs text-ink/50 mt-0.5">Sin preguntas. Sin letra chica.</div>
          </div>
          <span className="text-ink/30">›</span>
        </Link>
        <Link href="mailto:hola@miglowup.cl" className="block bg-white rounded-2xl p-4 border border-ink/10 hover:border-glow-300 transition flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Soporte</div>
            <div className="text-xs text-ink/50 mt-0.5">hola@miglowup.cl</div>
          </div>
          <span className="text-ink/30">›</span>
        </Link>
      </section>
    </div>
  );
}

function NotificationsSettings({ firstName }: { firstName: string }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      new Notification(`¡Listo, ${firstName}! 🔔`, {
        body: "Te avisaremos cuando flaquees, sin spam.",
      });
    }
  }

  return (
    <section className="bg-white rounded-2xl p-5 border border-ink/10">
      <h2 className="font-serif text-xl font-bold mb-1">Notificaciones</h2>
      <p className="text-xs text-ink/60 mb-4">Recordatorios cuando faltas días + celebración cuando llevas racha.</p>

      {permission === "unsupported" && (
        <p className="text-xs text-ink/50">Tu navegador no soporta notificaciones.</p>
      )}
      {permission === "granted" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3">
          <span>✅</span>
          <span className="font-semibold">Activadas</span>
        </div>
      )}
      {permission === "denied" && (
        <div className="text-xs text-rose-700 bg-rose-50 rounded-xl p-3">
          Bloqueadas en este navegador. Activa desde configuración del sitio en tu celular.
        </div>
      )}
      {permission === "default" && (
        <button
          onClick={requestPermission}
          className="w-full bg-glow-500 text-white py-3 rounded-full font-bold hover:bg-glow-600 transition active:scale-95"
        >
          🔔 Activar notificaciones
        </button>
      )}
    </section>
  );
}
