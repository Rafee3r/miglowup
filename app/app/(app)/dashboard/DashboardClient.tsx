"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTINES } from "@/lib/routines";

type Insights = {
  greeting: string;
  recommendedRoutine: string;
  recommendedReason: string;
  streak: number;
  workoutsLast7Days: number;
};

export function DashboardClient({ firstName }: { firstName: string }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((data) => {
        if (data.greeting) setInsights(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const rec = insights ? ROUTINES[insights.recommendedRoutine] : null;
  const streak = insights?.streak ?? 0;
  const week = insights?.workoutsLast7Days ?? 0;

  return (
    <div className="fade-in space-y-6">
      {/* Hero saludo */}
      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-glow-500">{today}</p>
        {loading ? (
          <div className="mt-3 space-y-2">
            <div className="h-9 bg-ink/5 rounded-lg w-3/4 animate-pulse"></div>
            <div className="h-9 bg-ink/5 rounded-lg w-1/2 animate-pulse"></div>
          </div>
        ) : (
          <h1 className="font-serif text-3xl md:text-4xl font-bold mt-2 leading-tight">
            {insights?.greeting || `¡Hola, ${firstName}!`}
          </h1>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Racha" value={streak} unit="días" highlight={streak >= 3} />
        <StatCard label="Esta semana" value={week} unit="entrenos" highlight={week >= 3} />
        <StatCard label="Nivel" value="" unit="" custom={streak >= 7 ? "🔥" : streak >= 3 ? "✨" : "💛"} />
      </div>

      {/* Recomendación IA */}
      {loading ? (
        <div className="bg-ink/5 rounded-3xl p-6 h-40 animate-pulse"></div>
      ) : rec ? (
        <Link
          href={`/rutinas/${rec.slug}`}
          className={`block bg-gradient-to-br ${rec.color} text-white rounded-3xl p-6 hover:scale-[1.01] hover:shadow-xl hover:shadow-glow-500/15 transition duration-300 ease-out shadow-lg`}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-white/80 mb-2">
            <span>✨ Coach IA recomienda</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-5xl flex-shrink-0">{rec.emoji}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-2xl font-black leading-tight mb-1">{rec.title}</h2>
              <p className="text-white/90 text-sm mb-3">{rec.duration} · {rec.level}</p>
              <p className="text-sm text-white/95 italic">«{insights?.recommendedReason}»</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/20 transition">
            Empezar ahora →
          </div>
        </Link>
      ) : null}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/coach" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 hover:-translate-y-1 hover:shadow-md transition duration-300 ease-out active:scale-95 group">
          <div className="text-2xl mb-2 group-hover:scale-110 transition duration-300">✨</div>
          <div className="font-semibold text-ink group-hover:text-glow-600 transition">Hablar con Coach IA</div>
          <div className="text-xs text-ink/60 mt-1">Pregúntame lo que sea</div>
        </Link>
        <Link href="/tracking" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 hover:-translate-y-1 hover:shadow-md transition duration-300 ease-out active:scale-95 group">
          <div className="text-2xl mb-2 group-hover:scale-110 transition duration-300">📈</div>
          <div className="font-semibold text-ink group-hover:text-glow-600 transition">Registrar progreso</div>
          <div className="text-xs text-ink/60 mt-1">Peso, medidas</div>
        </Link>
        <Link href="/rutinas" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 hover:-translate-y-1 hover:shadow-md transition duration-300 ease-out active:scale-95 group">
          <div className="text-2xl mb-2 group-hover:scale-110 transition duration-300">💪</div>
          <div className="font-semibold text-ink group-hover:text-glow-600 transition">Más rutinas</div>
          <div className="text-xs text-ink/60 mt-1">6 disponibles</div>
        </Link>
        <Link href="/comunidad" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 hover:-translate-y-1 hover:shadow-md transition duration-300 ease-out active:scale-95 group">
          <div className="text-2xl mb-2 group-hover:scale-110 transition duration-300">💬</div>
          <div className="font-semibold text-ink group-hover:text-glow-600 transition">Comunidad</div>
          <div className="text-xs text-ink/60 mt-1">Grupo WhatsApp</div>
        </Link>
      </div>

      {/* Motivación */}
      <div className="bg-glow-50 border border-glow-200 rounded-2xl p-5 text-sm shadow-sm">
        <p className="font-semibold mb-1 text-glow-700">💡 Tip de hoy</p>
        <p className="text-ink/75 leading-relaxed">
          {streak === 0
            ? "El primer día siempre es el más difícil. Una vez que arrancas, el siguiente cuesta menos."
            : streak < 3
            ? `Llevas ${streak} día${streak === 1 ? "" : "s"}. La constancia se construye día a día, no de golpe.`
            : streak < 7
            ? `${streak} días de racha — ya formaste un hábito mini. Sigue así.`
            : `${streak} días seguidos. Estás imparable. 🔥`}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label, value, unit, highlight, custom,
}: { label: string; value: number | string; unit: string; highlight?: boolean; custom?: string }) {
  return (
    <div className={`rounded-2xl p-4 border-2 transition duration-300 ease-out ${highlight ? "bg-glow-50 border-glow-400 text-ink shadow-sm shadow-glow-500/5" : "bg-white border-ink/10"}`}>
      <div className={`text-[10px] uppercase tracking-widest font-bold ${highlight ? "text-glow-600" : "text-ink/50"}`}>{label}</div>
      {custom ? (
        <div className="font-serif text-3xl font-black mt-1 text-glow-500">{custom}</div>
      ) : (
        <div className="flex items-baseline gap-1 mt-1">
          <div className={`font-serif text-3xl font-black ${highlight ? "text-glow-600" : "text-ink"}`}>{value}</div>
          {unit && <div className={`text-xs ${highlight ? "text-glow-500" : "text-ink/50"}`}>{unit}</div>}
        </div>
      )}
    </div>
  );
}
