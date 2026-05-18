"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const goals = [
  { id: "tonify", label: "Tonificar", emoji: "💪" },
  { id: "lose_weight", label: "Bajar de peso", emoji: "⚖️" },
  { id: "habit", label: "Crear el hábito", emoji: "🔁" },
  { id: "energy", label: "Más energía", emoji: "⚡" },
];

const levels = [
  { id: "beginner", label: "Principiante", desc: "Nunca o casi nunca entreno" },
  { id: "intermediate", label: "Intermedio", desc: "Algo de actividad 1-2 veces/semana" },
  { id: "advanced", label: "Avanzado", desc: "Entreno regularmente" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error: upErr } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName,
      goal,
      level,
      age: age ? Number(age) : null,
      onboarded: true,
    });
    if (upErr) {
      setError(upErr.message);
      setSaving(false);
      return;
    }
    if (weight || height) {
      await supabase.from("measurements").insert({
        user_id: user.id,
        weight_kg: weight ? Number(weight) : null,
        height_cm: height ? Number(height) : null,
      });
    }
    router.push("/dashboard");
  }

  return (
    <div className="fade-in max-w-md mx-auto">
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-2 flex-1 rounded-full ${n <= step ? "bg-glow-500" : "bg-ink/10"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h1 className="font-serif text-3xl font-bold">¿Cómo te llamas?</h1>
          <p className="text-ink/60">Para personalizar tu experiencia.</p>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-4 py-3 rounded-xl border border-ink/15 focus:border-glow-500 focus:ring-2 focus:ring-glow-200 outline-none"
          />
          <button
            onClick={() => setStep(2)}
            disabled={!firstName.trim()}
            className="w-full bg-glow-500 text-white py-3 rounded-full font-bold hover:bg-glow-600 transition disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h1 className="font-serif text-3xl font-bold">¿Cuál es tu objetivo?</h1>
          <p className="text-ink/60">Elige el que más resuene contigo.</p>
          <div className="grid grid-cols-2 gap-3">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`p-5 rounded-2xl border-2 text-left transition ${
                  goal === g.id ? "border-glow-500 bg-glow-50" : "border-ink/10 bg-white"
                }`}
              >
                <div className="text-2xl mb-2">{g.emoji}</div>
                <div className="font-semibold">{g.label}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={!goal}
            className="w-full bg-glow-500 text-white py-3 rounded-full font-bold hover:bg-glow-600 transition disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h1 className="font-serif text-3xl font-bold">¿Tu nivel actual?</h1>
          <p className="text-ink/60">Para adaptar tus rutinas.</p>
          <div className="space-y-3">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition ${
                  level === l.id ? "border-glow-500 bg-glow-50" : "border-ink/10 bg-white"
                }`}
              >
                <div className="font-semibold">{l.label}</div>
                <div className="text-sm text-ink/60">{l.desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(4)}
            disabled={!level}
            className="w-full bg-glow-500 text-white py-3 rounded-full font-bold hover:bg-glow-600 transition disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h1 className="font-serif text-3xl font-bold">Tus medidas iniciales</h1>
          <p className="text-ink/60">Opcional. Te ayudará a ver el progreso. Solo tú las ves.</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink/60">Edad</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 mt-1 rounded-xl border border-ink/15"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink/60">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 mt-1 rounded-xl border border-ink/15"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink/60">Altura (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 mt-1 rounded-xl border border-ink/15"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-glow-500 text-white py-3 rounded-full font-bold hover:bg-glow-600 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Empezar mi Glow Up ✨"}
          </button>
        </div>
      )}
    </div>
  );
}
