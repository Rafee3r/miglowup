import Link from "next/link";
import { notFound } from "next/navigation";

type Exercise = { name: string; reps: string; rest: string };
type Routine = {
  title: string;
  duration: string;
  level: string;
  emoji: string;
  warmup: string[];
  exercises: Exercise[];
};

const ROUTINES: Record<string, Routine> = {
  "full-body-25": {
    title: "Full Body",
    duration: "25 min",
    level: "Principiante",
    emoji: "💪",
    warmup: ["1 min trote suave", "10 círculos brazos", "10 sentadillas suaves"],
    exercises: [
      { name: "Sentadillas", reps: "3 x 12", rest: "30 seg" },
      { name: "Flexiones (rodillas si necesitas)", reps: "3 x 10", rest: "30 seg" },
      { name: "Plancha", reps: "3 x 30 seg", rest: "30 seg" },
      { name: "Zancadas alternadas", reps: "3 x 10 c/pierna", rest: "30 seg" },
      { name: "Mountain climbers", reps: "3 x 20", rest: "45 seg" },
    ],
  },
  "abs-15": {
    title: "Abdomen express",
    duration: "15 min",
    level: "Todos",
    emoji: "🔥",
    warmup: ["30 seg saltos", "10 rotaciones de cadera"],
    exercises: [
      { name: "Crunches", reps: "3 x 15", rest: "20 seg" },
      { name: "Plancha lateral c/lado", reps: "3 x 20 seg", rest: "20 seg" },
      { name: "Tijeras (scissor kicks)", reps: "3 x 20", rest: "30 seg" },
      { name: "Bicicleta", reps: "3 x 20", rest: "30 seg" },
    ],
  },
  "gluteos-30": {
    title: "Glúteos & piernas",
    duration: "30 min",
    level: "Intermedio",
    emoji: "🍑",
    warmup: ["2 min trote", "10 sentadillas profundas"],
    exercises: [
      { name: "Sentadilla sumo", reps: "4 x 15", rest: "45 seg" },
      { name: "Hip thrust", reps: "4 x 15", rest: "45 seg" },
      { name: "Zancada caminando", reps: "4 x 10 c/pierna", rest: "60 seg" },
      { name: "Patada de glúteo", reps: "3 x 15 c/pierna", rest: "30 seg" },
      { name: "Puente con marcha", reps: "3 x 20", rest: "30 seg" },
    ],
  },
  "cardio-20": {
    title: "Cardio HIIT",
    duration: "20 min",
    level: "Intermedio",
    emoji: "⚡",
    warmup: ["2 min movilidad articular", "30 seg jumping jacks"],
    exercises: [
      { name: "Jumping jacks", reps: "45 seg on / 15 off", rest: "—" },
      { name: "Burpees", reps: "45 seg on / 15 off", rest: "—" },
      { name: "Skipping alto", reps: "45 seg on / 15 off", rest: "—" },
      { name: "Mountain climbers", reps: "45 seg on / 15 off", rest: "—" },
      { name: "Sentadilla con salto", reps: "45 seg on / 15 off", rest: "—" },
      { name: "Repite el circuito 3 rondas", reps: "—", rest: "1 min entre rondas" },
    ],
  },
  "yoga-30": {
    title: "Yoga & estiramiento",
    duration: "30 min",
    level: "Principiante",
    emoji: "🧘‍♀️",
    warmup: ["3 respiraciones profundas", "Gato-vaca x 8"],
    exercises: [
      { name: "Saludo al sol", reps: "5 rondas", rest: "—" },
      { name: "Postura del niño", reps: "1 min", rest: "—" },
      { name: "Postura del guerrero (c/lado)", reps: "45 seg", rest: "—" },
      { name: "Paloma (c/lado)", reps: "1 min", rest: "—" },
      { name: "Savasana", reps: "5 min", rest: "—" },
    ],
  },
  "movilidad-10": {
    title: "Movilidad matutina",
    duration: "10 min",
    level: "Todos",
    emoji: "☀️",
    warmup: ["Respira 5 veces profundo"],
    exercises: [
      { name: "Rotaciones de cuello", reps: "10 c/lado", rest: "—" },
      { name: "Círculos de hombros", reps: "15 adelante / 15 atrás", rest: "—" },
      { name: "Inclinación lateral", reps: "5 c/lado", rest: "—" },
      { name: "Cat-cow", reps: "10", rest: "—" },
      { name: "Estiramiento de cadera", reps: "30 seg c/lado", rest: "—" },
    ],
  },
};

export default async function RoutineDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const routine = ROUTINES[slug];
  if (!routine) notFound();

  return (
    <div className="fade-in space-y-6">
      <Link href="/rutinas" className="text-sm text-glow-600 font-semibold">‹ Volver</Link>

      <div>
        <div className="text-5xl mb-3">{routine.emoji}</div>
        <h1 className="font-serif text-3xl font-bold">{routine.title}</h1>
        <p className="text-ink/60 mt-1">{routine.duration} · {routine.level}</p>
      </div>

      <section className="bg-glow-50 border border-glow-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-3">🔥 Calentamiento (3 min)</h2>
        <ul className="space-y-2 text-sm">
          {routine.warmup.map((w) => <li key={w}>• {w}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Ejercicios</h2>
        <ol className="space-y-3">
          {routine.exercises.map((ex, i) => (
            <li key={ex.name} className="bg-white rounded-2xl p-4 border border-ink/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-glow-100 text-glow-600 font-serif font-bold flex items-center justify-center">{i + 1}</div>
              <div className="flex-1">
                <div className="font-semibold">{ex.name}</div>
                <div className="text-sm text-ink/60">{ex.reps} · descanso {ex.rest}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="bg-white rounded-2xl p-5 border border-ink/10 text-sm text-ink/70">
        💛 Termina con 2 minutos de estiramiento y mucha agua. Avísale al Coach IA si tienes dudas.
      </div>
    </div>
  );
}
