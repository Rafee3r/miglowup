import Link from "next/link";

const ROUTINES = [
  { slug: "full-body-25", title: "Full Body", duration: "25 min", level: "Principiante", emoji: "💪", color: "bg-glow-500" },
  { slug: "abs-15", title: "Abdomen express", duration: "15 min", level: "Todos los niveles", emoji: "🔥", color: "bg-glow-600" },
  { slug: "gluteos-30", title: "Glúteos & piernas", duration: "30 min", level: "Intermedio", emoji: "🍑", color: "bg-glow-400" },
  { slug: "cardio-20", title: "Cardio HIIT", duration: "20 min", level: "Intermedio", emoji: "⚡", color: "bg-glow-700" },
  { slug: "yoga-30", title: "Yoga & estiramiento", duration: "30 min", level: "Principiante", emoji: "🧘‍♀️", color: "bg-emerald-600" },
  { slug: "movilidad-10", title: "Movilidad matutina", duration: "10 min", level: "Todos", emoji: "☀️", color: "bg-amber-500" },
];

export default function RutinasPage() {
  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Rutinas</h1>
        <p className="text-ink/60 mt-1">Elige la que te haga sentido hoy.</p>
      </div>

      <div className="space-y-3">
        {ROUTINES.map((r) => (
          <Link
            key={r.slug}
            href={`/rutinas/${r.slug}`}
            className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 transition"
          >
            <div className={`${r.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl`}>
              {r.emoji}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-ink/60">{r.duration} · {r.level}</div>
            </div>
            <div className="text-ink/30">›</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
