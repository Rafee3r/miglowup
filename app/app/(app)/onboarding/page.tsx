"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────
// Onboarding profundo de 12 pasos con AI plan reveal final.
// ─────────────────────────────────────────────────────────

type Answers = {
  firstName?: string;
  age?: number;
  goal?: string;
  level?: string;
  blockers?: string[];
  timeAvailable?: string;
  bestTime?: string;
  feelToday?: string;
  injuries?: string[];
  motivation?: string;
  weight?: number;
  height?: number;
  trainingHistory?: string;
};

type Plan = {
  headline: string;
  intro: string;
  weeklySchedule: string;
  focusAreas: string[];
  firstWeek: string[];
  milestone: string;
  tone: string;
};

const TOTAL_STEPS = 12;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = welcome
  const [answers, setAnswers] = useState<Answers>({});
  const [revealing, setRevealing] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof Answers, value: unknown) {
    setAnswers((a) => ({ ...a, [field]: value }));
  }
  function next() { setStep((s) => s + 1); }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  async function finishOnboarding() {
    setRevealing(true);
    setError(null);
    try {
      // 1. Pedir plan a la IA
      const res = await fetch("/api/plan-reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      setPlan(data);

      // 2. Guardar perfil
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      await supabase.from("profiles").upsert({
        id: user.id,
        first_name: answers.firstName,
        goal: answers.goal,
        level: answers.level,
        age: answers.age ?? null,
        onboarded: true,
      });
      if (answers.weight || answers.height) {
        await supabase.from("measurements").insert({
          user_id: user.id,
          weight_kg: answers.weight ?? null,
          height_cm: answers.height ?? null,
        });
      }
    } catch (e) {
      console.error(e);
      setError("Algo falló. Revisa tu conexión.");
    }
  }

  const progress = (step / TOTAL_STEPS) * 100;

  // ──────── Reveal state ────────
  if (revealing) {
    return <PlanReveal plan={plan} firstName={answers.firstName || "fundadora"} onContinue={() => router.push("/dashboard")} error={error} />;
  }

  return (
    <div className="fade-in max-w-md mx-auto pb-8">
      {step > 0 && (
        <div className="mb-8">
          <div className="flex justify-between text-xs text-ink/50 mb-2">
            <button onClick={prev} className="font-semibold hover:text-ink">‹ Atrás</button>
            <span>{step} / {TOTAL_STEPS}</span>
          </div>
          <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-glow-500"
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {step === 0 && <Welcome onStart={next} />}

          {step === 1 && (
            <TextStep
              title="¿Cómo te llamas?"
              subtitle="Vamos a hablarte así. Sin formalidades."
              placeholder="Tu nombre"
              value={answers.firstName ?? ""}
              onChange={(v) => update("firstName", v)}
              onNext={next}
              canContinue={Boolean(answers.firstName?.trim())}
            />
          )}

          {step === 2 && (
            <ChipStep
              title="¿Cuál es tu objetivo principal?"
              subtitle="No tienes que elegir solo uno por el resto de tu vida."
              options={[
                { id: "tonify", label: "Tonificar mi cuerpo", emoji: "💪" },
                { id: "lose_weight", label: "Bajar de peso", emoji: "⚖️" },
                { id: "habit", label: "Crear el hábito", emoji: "🔁" },
                { id: "energy", label: "Tener más energía", emoji: "⚡" },
                { id: "mindset", label: "Sentirme mejor conmigo", emoji: "🧘‍♀️" },
              ]}
              value={answers.goal}
              onChange={(v) => update("goal", v)}
              onNext={next}
            />
          )}

          {step === 3 && (
            <ChipStep
              title="¿Cuál es tu nivel actual?"
              subtitle="Sin juicio. La gran mayoría empieza desde cero."
              options={[
                { id: "beginner", label: "Hace meses no entreno", emoji: "🌱" },
                { id: "intermediate", label: "Algo de actividad esporádica", emoji: "🚶‍♀️" },
                { id: "advanced", label: "Entreno regularmente pero estancada", emoji: "🏃‍♀️" },
              ]}
              value={answers.level}
              onChange={(v) => update("level", v)}
              onNext={next}
            />
          )}

          {step === 4 && (
            <MultiChipStep
              title="¿Qué te ha frenado antes?"
              subtitle="Marca todo lo que te haya tocado."
              options={[
                { id: "time", label: "No tener tiempo", emoji: "⌛" },
                { id: "motivation", label: "Falta de motivación", emoji: "😩" },
                { id: "diet", label: "Las dietas me agotan", emoji: "🥗" },
                { id: "gym", label: "Odio el gym", emoji: "🏋️‍♀️" },
                { id: "alone", label: "Hacerlo sola", emoji: "🚶‍♀️" },
                { id: "guilt", label: "Culpa cuando fallo un día", emoji: "😔" },
              ]}
              value={answers.blockers ?? []}
              onChange={(v) => update("blockers", v)}
              onNext={next}
            />
          )}

          {step === 5 && (
            <ChipStep
              title="¿Cuánto tiempo puedes al día?"
              subtitle="Real. Lo que verdaderamente tienes, no lo ideal."
              options={[
                { id: "10", label: "10 minutos o menos", emoji: "⏱️" },
                { id: "20", label: "15 a 25 minutos", emoji: "⏰" },
                { id: "40", label: "30 a 45 minutos", emoji: "🕐" },
                { id: "60", label: "1 hora o más", emoji: "⏳" },
              ]}
              value={answers.timeAvailable}
              onChange={(v) => update("timeAvailable", v)}
              onNext={next}
            />
          )}

          {step === 6 && (
            <ChipStep
              title="¿Cuándo te acomoda entrenar?"
              subtitle="Para sugerirte rutinas según tu ritmo."
              options={[
                { id: "morning", label: "Temprano en la mañana", emoji: "🌅" },
                { id: "midday", label: "Al mediodía / siesta", emoji: "☀️" },
                { id: "evening", label: "Tarde / antes de cenar", emoji: "🌇" },
                { id: "night", label: "En la noche", emoji: "🌙" },
                { id: "any", label: "Cuando se pueda", emoji: "🤷‍♀️" },
              ]}
              value={answers.bestTime}
              onChange={(v) => update("bestTime", v)}
              onNext={next}
            />
          )}

          {step === 7 && (
            <ChipStep
              title="¿Cómo te sientes hoy?"
              subtitle="Sin maquillar la respuesta. Esto solo lo ves tú y el coach IA."
              options={[
                { id: "exhausted", label: "Agotada física y mentalmente", emoji: "😩" },
                { id: "frustrated", label: "Frustrada con mi cuerpo", emoji: "😤" },
                { id: "hopeful", label: "Esperanzada, lista para probar", emoji: "🌸" },
                { id: "motivated", label: "Súper motivada", emoji: "🔥" },
                { id: "anxious", label: "Ansiosa con todo el cambio", emoji: "😬" },
              ]}
              value={answers.feelToday}
              onChange={(v) => update("feelToday", v)}
              onNext={next}
            />
          )}

          {step === 8 && (
            <MultiChipStep
              title="¿Tienes alguna lesión o limitación?"
              subtitle="Si nada, salta este paso. Si sí, marca y adaptamos."
              options={[
                { id: "knee", label: "Rodillas", emoji: "🦵" },
                { id: "back", label: "Espalda baja", emoji: "🔙" },
                { id: "shoulder", label: "Hombros", emoji: "💪" },
                { id: "wrist", label: "Muñecas", emoji: "✋" },
                { id: "perimenopause", label: "Perimenopausia", emoji: "🌸" },
                { id: "postpartum", label: "Postparto reciente", emoji: "👶" },
              ]}
              value={answers.injuries ?? []}
              onChange={(v) => update("injuries", v)}
              onNext={next}
              allowSkip
            />
          )}

          {step === 9 && (
            <ChipStep
              title="¿Cuál es tu motor más fuerte?"
              subtitle="Lo que te haría volver mañana aunque hoy no te dieran las ganas."
              options={[
                { id: "kids", label: "Mis hijos/familia", emoji: "👶" },
                { id: "self", label: "Sentirme bien conmigo", emoji: "🌸" },
                { id: "health", label: "Mi salud a largo plazo", emoji: "❤️" },
                { id: "appearance", label: "Cómo me veo", emoji: "🪞" },
                { id: "challenge", label: "El desafío personal", emoji: "🎯" },
              ]}
              value={answers.motivation}
              onChange={(v) => update("motivation", v)}
              onNext={next}
            />
          )}

          {step === 10 && (
            <ChipStep
              title="¿Has intentado antes?"
              subtitle="Sin culpa. Esto nos ayuda a ajustar el tono."
              options={[
                { id: "many_failed", label: "Muchas veces, abandoné todas", emoji: "🔄" },
                { id: "few_tried", label: "Algunas veces", emoji: "🤔" },
                { id: "first_time", label: "Es mi primer intento serio", emoji: "🌱" },
                { id: "consistent", label: "Soy constante en general", emoji: "✨" },
              ]}
              value={answers.trainingHistory}
              onChange={(v) => update("trainingHistory", v)}
              onNext={next}
            />
          )}

          {step === 11 && (
            <NumberStep
              title="¿Tu edad?"
              subtitle="El método se adapta a tu etapa. Sé honesta."
              placeholder="Ej: 34"
              value={answers.age?.toString() ?? ""}
              onChange={(v) => update("age", v ? Number(v) : undefined)}
              onNext={next}
              canContinue={Boolean(answers.age)}
            />
          )}

          {step === 12 && (
            <FinalStep
              firstName={answers.firstName || ""}
              weight={answers.weight}
              height={answers.height}
              onChangeWeight={(v) => update("weight", v ? Number(v) : undefined)}
              onChangeHeight={(v) => update("height", v ? Number(v) : undefined)}
              onSubmit={finishOnboarding}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ───────────────── Sub-components ─────────────────

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center pt-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="text-7xl mb-6"
      >
        🌸
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-serif text-4xl md:text-5xl font-black leading-tight mb-4"
      >
        Bienvenida.<br/>
        <span className="italic text-glow-500">Empecemos por conocerte.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-ink/70 mb-10 text-lg"
      >
        12 preguntas honestas. Toma 2 minutos. Al final, tu coach IA te entrega un plan hecho para ti.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="w-full bg-glow-500 text-white py-5 rounded-full font-bold text-lg shadow-lg shadow-glow-500/30"
      >
        Empezar →
      </motion.button>
      <p className="text-xs text-ink/40 mt-4">Tus respuestas son privadas. Solo tú y el coach IA.</p>
    </div>
  );
}

function TextStep({
  title, subtitle, placeholder, value, onChange, onNext, canContinue,
}: { title: string; subtitle: string; placeholder: string; value: string; onChange: (v: string) => void; onNext: () => void; canContinue: boolean }) {
  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-black mb-2">{title}</h1>
        <p className="text-ink/60">{subtitle}</p>
      </div>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && canContinue) onNext(); }}
        placeholder={placeholder}
        className="w-full px-5 py-4 rounded-2xl border-2 border-ink/10 focus:border-glow-500 focus:ring-4 focus:ring-glow-200 outline-none text-lg"
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        disabled={!canContinue}
        className="w-full bg-glow-500 text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-glow-500/30 disabled:opacity-30"
      >
        Continuar →
      </motion.button>
    </div>
  );
}

function NumberStep(props: { title: string; subtitle: string; placeholder: string; value: string; onChange: (v: string) => void; onNext: () => void; canContinue: boolean }) {
  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-black mb-2">{props.title}</h1>
        <p className="text-ink/60">{props.subtitle}</p>
      </div>
      <input
        autoFocus
        type="number"
        inputMode="numeric"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && props.canContinue) props.onNext(); }}
        placeholder={props.placeholder}
        className="w-full px-5 py-4 rounded-2xl border-2 border-ink/10 focus:border-glow-500 focus:ring-4 focus:ring-glow-200 outline-none text-lg"
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={props.onNext}
        disabled={!props.canContinue}
        className="w-full bg-glow-500 text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-glow-500/30 disabled:opacity-30"
      >
        Continuar →
      </motion.button>
    </div>
  );
}

function ChipStep({
  title, subtitle, options, value, onChange, onNext,
}: {
  title: string;
  subtitle: string;
  options: { id: string; label: string; emoji: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5 pt-4">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-black mb-2 leading-tight">{title}</h1>
        <p className="text-ink/60">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {options.map((o, i) => {
          const selected = value === o.id;
          return (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { onChange(o.id); setTimeout(onNext, 200); }}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition ${selected ? "border-glow-500 bg-glow-50" : "border-ink/10 bg-white hover:border-glow-200"}`}
            >
              <span className="text-3xl">{o.emoji}</span>
              <span className="font-semibold flex-1">{o.label}</span>
              {selected && <span className="text-glow-500 text-xl">✓</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function MultiChipStep({
  title, subtitle, options, value, onChange, onNext, allowSkip,
}: {
  title: string;
  subtitle: string;
  options: { id: string; label: string; emoji: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  allowSkip?: boolean;
}) {
  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  }
  return (
    <div className="space-y-5 pt-4">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-black mb-2 leading-tight">{title}</h1>
        <p className="text-ink/60">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o, i) => {
          const selected = value.includes(o.id);
          return (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(o.id)}
              className={`p-4 rounded-2xl border-2 text-center transition ${selected ? "border-glow-500 bg-glow-50" : "border-ink/10 bg-white"}`}
            >
              <div className="text-3xl mb-1">{o.emoji}</div>
              <div className="font-semibold text-sm">{o.label}</div>
            </motion.button>
          );
        })}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full bg-glow-500 text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-glow-500/30"
      >
        {value.length === 0 && allowSkip ? "Saltar →" : `Continuar (${value.length}) →`}
      </motion.button>
    </div>
  );
}

function FinalStep({
  firstName, weight, height, onChangeWeight, onChangeHeight, onSubmit,
}: { firstName: string; weight?: number; height?: number; onChangeWeight: (v: string) => void; onChangeHeight: (v: string) => void; onSubmit: () => void }) {
  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-black mb-2 leading-tight">
          Última cosa, {firstName}.
        </h1>
        <p className="text-ink/60">Para medir progreso real. Opcional, pero útil. Solo tú las ves.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest font-bold text-ink/50 mb-2 block">Peso actual (kg)</label>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={weight ?? ""}
            onChange={(e) => onChangeWeight(e.target.value)}
            placeholder="65"
            className="w-full px-4 py-3 rounded-xl border-2 border-ink/10 focus:border-glow-500 outline-none text-lg"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest font-bold text-ink/50 mb-2 block">Altura (cm)</label>
          <input
            type="number"
            inputMode="numeric"
            value={height ?? ""}
            onChange={(e) => onChangeHeight(e.target.value)}
            placeholder="165"
            className="w-full px-4 py-3 rounded-xl border-2 border-ink/10 focus:border-glow-500 outline-none text-lg"
          />
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        className="w-full bg-glow-500 text-white py-5 rounded-full font-bold text-lg shadow-lg shadow-glow-500/30"
      >
        Revelar mi plan ✨
      </motion.button>
      <p className="text-xs text-ink/40 text-center">Si dejas en blanco, podemos preguntarte después.</p>
    </div>
  );
}

// ───────────────── AI Plan Reveal ─────────────────

function PlanReveal({
  plan, firstName, onContinue, error,
}: { plan: Plan | null; firstName: string; onContinue: () => void; error: string | null }) {
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">😔</div>
        <p className="text-ink/70">{error}</p>
        <button onClick={onContinue} className="mt-6 underline text-glow-600 font-semibold">Continuar de todas formas</button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="text-6xl mb-6"
        >
          🔮
        </motion.div>
        <div className="font-serif text-2xl font-bold mb-3">El coach IA está armando tu plan...</div>
        <div className="space-y-2 text-sm text-ink/60">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>✓ Analizando tus respuestas</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>✓ Ajustando según tu nivel y tiempo</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>✓ Considerando tus bloqueos pasados</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}>✓ Generando tu schedule semanal</motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-glow-50 p-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="text-center mb-8 pt-8"
      >
        <div className="text-6xl mb-4">✨</div>
        <div className="text-xs uppercase tracking-widest font-bold text-glow-600 mb-2">Plan personalizado</div>
        <h1 className="font-serif text-3xl md:text-4xl font-black leading-tight">
          {plan.headline}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-6 mb-4 border border-glow-200 shadow-sm"
      >
        <p className="text-ink/80 leading-relaxed italic">"{plan.intro}"</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-3xl p-6 mb-4 border border-ink/10 shadow-sm"
      >
        <div className="text-xs uppercase tracking-widest font-bold text-glow-500 mb-2">📅 Tu schedule</div>
        <p className="font-serif text-xl font-bold">{plan.weeklySchedule}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-3xl p-6 mb-4 border border-ink/10 shadow-sm"
      >
        <div className="text-xs uppercase tracking-widest font-bold text-glow-500 mb-3">🎯 Áreas de foco</div>
        <div className="flex flex-wrap gap-2">
          {plan.focusAreas.map((area) => (
            <span key={area} className="bg-glow-100 text-glow-700 px-3 py-1.5 rounded-full text-sm font-semibold">{area}</span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-3xl p-6 mb-4 border border-ink/10 shadow-sm"
      >
        <div className="text-xs uppercase tracking-widest font-bold text-glow-500 mb-3">🌱 Esta primera semana</div>
        <ol className="space-y-2 text-sm">
          {plan.firstWeek.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-glow-100 text-glow-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="bg-ink text-cream rounded-3xl p-6 mb-6 shadow-lg"
      >
        <div className="text-xs uppercase tracking-widest font-bold text-glow-300 mb-2">🌸 En 4 semanas</div>
        <p className="leading-relaxed">{plan.milestone}</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onContinue}
        className="w-full bg-glow-500 text-white py-5 rounded-full font-bold text-lg shadow-xl shadow-glow-500/40"
      >
        Vamos, {firstName} →
      </motion.button>
    </div>
  );
}
