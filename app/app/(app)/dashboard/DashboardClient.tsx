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
  calendarDays?: { date: string; hasWorkout: boolean }[];
  todayKey?: string;
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

  const todayStr = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const rec = insights ? ROUTINES[insights.recommendedRoutine] : null;
  const streak = insights?.streak ?? 0;
  
  // Calcular métricas dinámicas basadas en los 35 días
  const completedDays = insights?.calendarDays?.filter((d) => d.hasWorkout).length ?? 0;
  const monthlyProgress = Math.min(100, Math.round((completedDays / 16) * 100)); // Meta de 16 entrenamientos al mes
  const glowPoints = completedDays * 30; // 30 puntos por entrenamiento
  const userLevel = Math.floor(glowPoints / 100) + 1;

  const calendarDays = insights?.calendarDays ?? [];

  return (
    <div className="fade-in space-y-6">
      {/* Saludo */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-glow-500">{todayStr}</p>
        {loading ? (
          <div className="mt-2 space-y-2">
            <div className="h-8 bg-ink/5 rounded-lg w-2/3 animate-pulse"></div>
          </div>
        ) : (
          <h1 className="font-serif text-3xl font-black text-ink mt-1">
            {insights?.greeting || `¡Hola, ${firstName}! ✨`}
          </h1>
        )}
      </div>

      {/* Rachas & Progreso */}
      <div>
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="font-serif text-lg font-bold text-ink">Rachas & Progreso</h2>
          <Link href="/tracking" className="text-xs font-semibold text-glow-500 hover:text-glow-600 transition">
            Ver todo ›
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Card 1: Racha */}
          <div className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm text-center flex flex-col items-center justify-between h-28 hover:shadow transition">
            <div className="text-xl">🔥</div>
            <div className="font-serif text-2xl font-black text-ink leading-none mt-1">{streak}</div>
            <div className="text-[10px] font-semibold text-ink/40 uppercase tracking-tight">Días de racha</div>
            <div className="text-[9px] font-bold text-glow-500 tracking-tight mt-0.5">¡Sigue así!</div>
          </div>

          {/* Card 2: Progreso */}
          <div className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm text-center flex flex-col items-center justify-between h-28 hover:shadow transition">
            <div className="text-xl">🏆</div>
            <div className="font-serif text-2xl font-black text-ink leading-none mt-1">{monthlyProgress}%</div>
            <div className="text-[10px] font-semibold text-ink/40 uppercase tracking-tight">Progreso mensual</div>
            <div className="text-[9px] font-bold text-glow-500 tracking-tight mt-0.5">+{completedDays > 0 ? "12%" : "0%"} vs. mes ant.</div>
          </div>

          {/* Card 3: Puntos Glow */}
          <div className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm text-center flex flex-col items-center justify-between h-28 hover:shadow transition">
            <div className="text-xl">⭐</div>
            <div className="font-serif text-2xl font-black text-ink leading-none mt-1">{glowPoints}</div>
            <div className="text-[10px] font-semibold text-ink/40 uppercase tracking-tight">Puntos Glow</div>
            <div className="text-[9px] font-bold text-ink/40 tracking-tight mt-0.5">Nivel {userLevel}</div>
          </div>
        </div>
      </div>

      {/* Coach IA recomienda */}
      {loading ? (
        <div className="bg-ink/5 rounded-3xl p-6 h-48 animate-pulse"></div>
      ) : rec ? (
        <div>
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="font-serif text-lg font-bold text-ink">Coach IA recomienda</h2>
            <Link href="/rutinas" className="text-xs font-semibold text-glow-500 hover:text-glow-600 transition">
              Ver todo ›
            </Link>
          </div>

          <Link
            href={`/rutinas/${rec.slug}`}
            className="block relative overflow-hidden rounded-3xl p-6 hover:scale-[1.01] hover:shadow-xl hover:shadow-glow-500/15 transition duration-300 ease-out shadow-lg text-white group"
          >
            {/* Background Image / Color fallback */}
            {rec.imageUrl ? (
              <>
                <img 
                  src={rec.imageUrl} 
                  alt={rec.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" 
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A66] via-[#F26A47] to-[#D74E2D]" />
            )}

            {/* Background design glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Workout Emoji floated back */}
            <div className="absolute right-6 bottom-4 text-9xl opacity-15 select-none font-serif leading-none group-hover:scale-110 transition duration-500 pointer-events-none">
              {rec.emoji}
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white mb-4">
                  🏋️‍♀️ Entrenamiento
                </span>
                <h3 className="font-serif text-3xl font-black leading-tight max-w-[70%] drop-shadow-sm">
                  {rec.title}
                </h3>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-1.5 text-sm font-semibold opacity-95">
                  <span>⏱️</span>
                  <span>{rec.duration}</span>
                </div>

                {/* Play Button */}
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition duration-300">
                  <div className="w-0 h-0 border-y-6 border-y-transparent border-l-10 border-l-glow-500 ml-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : null}

      {/* Calendario de hábitos */}
      <div>
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="font-serif text-lg font-bold text-ink">Calendario de hábitos <span className="text-ink/40 text-sm font-sans font-medium">· 35 días</span></h2>
          <Link href="/tracking" className="text-xs font-semibold text-glow-500 hover:text-glow-600 transition">
            Ver calendario ›
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-ink/5 shadow-sm">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
              <span key={d} className="text-[9px] font-bold tracking-wider text-ink/30 uppercase">{d}</span>
            ))}
          </div>

          {/* Cuadrícula de 35 días */}
          {loading ? (
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 pt-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-6 bg-ink/5 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-y-3.5 gap-x-2 text-center pt-1">
              {calendarDays.map((d, i) => {
                const dayNum = i + 1;
                const isToday = i === 34; // El último día representa hoy en la consulta

                return (
                  <div key={d.date} className="flex flex-col items-center justify-center relative">
                    {isToday ? (
                      <div className="w-8 h-8 rounded-full border border-[#D9A752] flex flex-col items-center justify-center -my-1 absolute">
                        <span className="text-xs font-bold text-[#D9A752] leading-none">{dayNum}</span>
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${d.hasWorkout ? "bg-[#D9A752]" : "bg-ink/10"}`} />
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-ink/70 leading-none">{dayNum}</span>
                        <span className={`w-1 h-1 rounded-full mt-1 ${d.hasWorkout ? "bg-glow-500 shadow-sm shadow-glow-500/50" : "bg-ink/10"}`} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid de Acciones Rápidas (2x2) */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/coach" className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm hover:scale-[1.01] hover:shadow-md transition duration-300 ease-out active:scale-98 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-glow-50 text-glow-500 text-lg group-hover:scale-105 transition">
              💬
            </div>
            <div className="text-left">
              <div className="font-bold text-xs text-ink leading-tight">Hablar con Coach IA</div>
              <div className="text-[10px] text-ink/40 mt-0.5">Tu coach 24/7</div>
            </div>
          </div>
          <span className="text-ink/20 text-xs font-bold font-mono group-hover:translate-x-0.5 transition">›</span>
        </Link>

        <Link href="/tracking" className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm hover:scale-[1.01] hover:shadow-md transition duration-300 ease-out active:scale-98 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-glow-50 text-glow-500 text-lg group-hover:scale-105 transition">
              ⚖️
            </div>
            <div className="text-left">
              <div className="font-bold text-xs text-ink leading-tight">Registrar peso</div>
              <div className="text-[10px] text-ink/40 mt-0.5">Sé constante</div>
            </div>
          </div>
          <span className="text-ink/20 text-xs font-bold font-mono group-hover:translate-x-0.5 transition">›</span>
        </Link>

        <Link href="/rutinas" className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm hover:scale-[1.01] hover:shadow-md transition duration-300 ease-out active:scale-98 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-glow-50 text-glow-500 text-lg group-hover:scale-105 transition">
              📖
            </div>
            <div className="text-left">
              <div className="font-bold text-xs text-ink leading-tight">Biblioteca</div>
              <div className="text-[10px] text-ink/40 mt-0.5">Guías y recetas</div>
            </div>
          </div>
          <span className="text-ink/20 text-xs font-bold font-mono group-hover:translate-x-0.5 transition">›</span>
        </Link>

        <Link href="/comunidad" className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm hover:scale-[1.01] hover:shadow-md transition duration-300 ease-out active:scale-98 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-glow-50 text-glow-500 text-lg group-hover:scale-105 transition">
              📞
            </div>
            <div className="text-left">
              <div className="font-bold text-xs text-ink leading-tight">Comunidad WhatsApp</div>
              <div className="text-[10px] text-ink/40 mt-0.5">Únete ahora</div>
            </div>
          </div>
          <span className="text-ink/20 text-xs font-bold font-mono group-hover:translate-x-0.5 transition">›</span>
        </Link>
      </div>
    </div>
  );
}
