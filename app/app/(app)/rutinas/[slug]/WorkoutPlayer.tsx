"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import type { Routine, Exercise } from "@/lib/routines";

type Phase =
  | { kind: "intro" }
  | { kind: "warmup" }
  | { kind: "exercise"; exIndex: number; setIndex: number; secondsLeft: number }
  | { kind: "feedback"; exIndex: number; setIndex: number }
  | { kind: "rest"; nextExIndex: number; nextSetIndex: number; secondsLeft: number }
  | { kind: "cooldown" }
  | { kind: "done"; totalSeconds: number };

// Severity feedback que la IA puede usar después
type Feedback = "easy" | "ok" | "hard";

export function WorkoutPlayer({ routine }: { routine: Routine }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [muted, setMuted] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [feedbacks, setFeedbacks] = useState<{ exercise: string; feedback: Feedback }[]>([]);
  const intervalRef = useRef<number | null>(null);

  // ─────────── Timer engine ───────────
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (phase.kind !== "exercise" && phase.kind !== "rest") return;

    intervalRef.current = window.setInterval(() => {
      setPhase((p) => {
        if (p.kind !== "exercise" && p.kind !== "rest") return p;
        const left = p.secondsLeft - 1;
        if (left > 0) {
          if (left <= 3 && voiceOn) speak(String(left));
          return { ...p, secondsLeft: left };
        }
        if (p.kind === "exercise") {
          beep();
          if (voiceOn) speak("Listo");
          return { kind: "feedback", exIndex: p.exIndex, setIndex: p.setIndex };
        }
        beep();
        if (voiceOn) speak("Vamos");
        const next = routine.exercises[p.nextExIndex];
        return {
          kind: "exercise",
          exIndex: p.nextExIndex,
          setIndex: p.nextSetIndex,
          secondsLeft: next.kind === "time" ? next.amount : 0,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase.kind, voiceOn, routine.exercises]);

  function advanceAfterFeedback(exIndex: number, setIndex: number): Phase {
    const ex = routine.exercises[exIndex];
    if (setIndex + 1 < ex.sets) {
      return { kind: "rest", nextExIndex: exIndex, nextSetIndex: setIndex + 1, secondsLeft: ex.rest };
    }
    if (exIndex + 1 < routine.exercises.length) {
      return { kind: "rest", nextExIndex: exIndex + 1, nextSetIndex: 0, secondsLeft: ex.rest };
    }
    return { kind: "cooldown" };
  }

  // ─────────── Audio helpers ───────────
  function beep() {
    if (muted) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }
  function speak(text: string) {
    if (muted) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-CL";
      u.rate = 1.1;
      window.speechSynthesis.speak(u);
    } catch {}
  }
  function haptic(ms = 10) {
    if ("vibrate" in navigator) navigator.vibrate(ms);
  }

  // ─────────── Actions ───────────
  function startWorkout() {
    setStartedAt(Date.now());
    haptic(15);
    setPhase({ kind: "warmup" });
  }
  function finishWarmup() {
    const ex = routine.exercises[0];
    haptic(15);
    setPhase({
      kind: "exercise",
      exIndex: 0,
      setIndex: 0,
      secondsLeft: ex.kind === "time" ? ex.amount : 0,
    });
    if (voiceOn) speak(`Empezamos con ${ex.name}`);
  }
  function completeRepsSet() {
    if (phase.kind !== "exercise") return;
    haptic(20);
    beep();
    setPhase({ kind: "feedback", exIndex: phase.exIndex, setIndex: phase.setIndex });
  }
  function submitFeedback(fb: Feedback) {
    if (phase.kind !== "feedback") return;
    haptic(10);
    const ex = routine.exercises[phase.exIndex];
    setFeedbacks((prev) => [...prev, { exercise: ex.name, feedback: fb }]);
    setPhase(advanceAfterFeedback(phase.exIndex, phase.setIndex));
  }
  function skipRest() {
    if (phase.kind !== "rest") return;
    haptic(10);
    const next = routine.exercises[phase.nextExIndex];
    setPhase({
      kind: "exercise",
      exIndex: phase.nextExIndex,
      setIndex: phase.nextSetIndex,
      secondsLeft: next.kind === "time" ? next.amount : 0,
    });
  }
  function finishCooldown() {
    const total = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    haptic(50);
    setPhase({ kind: "done", totalSeconds: total });
    void logRoutine(total);
  }
  async function logRoutine(durationSeconds: number) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("routine_logs").insert({
        user_id: user.id,
        routine_slug: routine.slug,
        duration_min: Math.max(1, Math.round(durationSeconds / 60)),
      });
    } catch (err) {
      console.error("Failed to log routine", err);
    }
  }

  // ─────────── Render ───────────
  return (
    <div className="-mx-5 -my-6 relative">
      <Controls muted={muted} setMuted={setMuted} voiceOn={voiceOn} setVoiceOn={setVoiceOn} />

      <AnimatePresence mode="wait">
        {phase.kind === "intro" && (
          <motion.div key="intro" {...slideUp}>
            <Intro routine={routine} onStart={startWorkout} />
          </motion.div>
        )}

        {phase.kind === "warmup" && (
          <motion.div key="warmup" {...slideUp}>
            <Warmup routine={routine} onContinue={finishWarmup} />
          </motion.div>
        )}

        {phase.kind === "exercise" && (
          <motion.div key={`ex-${phase.exIndex}-${phase.setIndex}`} {...slideUp}>
            <ExerciseView
              routine={routine}
              exIndex={phase.exIndex}
              setIndex={phase.setIndex}
              secondsLeft={phase.secondsLeft}
              onCompleteReps={completeRepsSet}
            />
          </motion.div>
        )}

        {phase.kind === "feedback" && (
          <motion.div key="feedback" {...slideUp}>
            <FeedbackSheet
              exercise={routine.exercises[phase.exIndex]}
              onSelect={submitFeedback}
            />
          </motion.div>
        )}

        {phase.kind === "rest" && (
          <motion.div key="rest" {...slideUp}>
            <RestView
              routine={routine}
              secondsLeft={phase.secondsLeft}
              nextExIndex={phase.nextExIndex}
              nextSetIndex={phase.nextSetIndex}
              onSkip={skipRest}
            />
          </motion.div>
        )}

        {phase.kind === "cooldown" && (
          <motion.div key="cooldown" {...slideUp}>
            <Cooldown routine={routine} onFinish={finishCooldown} />
          </motion.div>
        )}

        {phase.kind === "done" && (
          <motion.div key="done" {...slideUp}>
            <Done
              routine={routine}
              totalSeconds={phase.totalSeconds}
              feedbacks={feedbacks}
              onBack={() => router.push("/dashboard")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

// ─────────── Sub-components ───────────

function Controls({
  muted, setMuted, voiceOn, setVoiceOn,
}: { muted: boolean; setMuted: (v: boolean) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void; }) {
  return (
    <div className="fixed top-3 right-3 z-30 flex gap-2">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setVoiceOn(!voiceOn)}
        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur transition ${voiceOn ? "bg-glow-500 text-white shadow-lg" : "bg-white/80 text-ink/60"}`}
        title="Voz del coach"
      >
        🗣️
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setMuted(!muted)}
        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur transition ${muted ? "bg-ink/80 text-white" : "bg-white/80 text-ink/60"}`}
      >
        {muted ? "🔇" : "🔔"}
      </motion.button>
    </div>
  );
}

function Intro({ routine, onStart }: { routine: Routine; onStart: () => void }) {
  const totalSets = routine.exercises.reduce((sum, e) => sum + e.sets, 0);
  return (
    <div className={`min-h-[calc(100vh-100px)] bg-gradient-to-br ${routine.color} text-white p-6 flex flex-col relative overflow-hidden`}>
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

      <Link href="/rutinas" className="text-white/80 text-sm font-medium mb-6 relative z-10">‹ Volver</Link>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="text-7xl mb-4"
        >
          {routine.emoji}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-5xl md:text-6xl font-black leading-[0.95] mb-3"
        >
          {routine.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-lg text-white/90 mb-6"
        >
          {routine.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <StatBox label="Duración" value={routine.duration} />
          <StatBox label="Nivel" value={routine.level} />
          <StatBox label="Sets" value={String(totalSets)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="bg-white/10 rounded-2xl p-5 backdrop-blur mb-8 border border-white/15"
        >
          <div className="text-xs uppercase tracking-widest font-bold mb-3 text-white/70">🔥 Calentamiento</div>
          <ul className="space-y-1.5 text-sm">
            {routine.warmup.map((w) => <li key={w}>• {w}</li>)}
          </ul>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="bg-white text-ink py-5 rounded-full font-bold text-lg shadow-2xl active:shadow-lg"
        >
          Empezar entrenamiento →
        </motion.button>
        <p className="text-center text-xs text-white/70 mt-3">Activa la voz del coach si quieres guía hablada</p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-2xl p-4 backdrop-blur border border-white/15">
      <div className="text-[10px] uppercase tracking-widest font-bold text-white/70">{label}</div>
      <div className="font-serif text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Warmup({ routine, onContinue }: { routine: Routine; onContinue: () => void }) {
  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-amber-50 to-orange-100 p-6 flex flex-col">
      <div className="text-xs uppercase tracking-widest font-bold text-amber-700 mb-3">Paso 1 de 3</div>
      <h2 className="font-serif text-4xl font-bold mb-6">Calentamiento</h2>
      <div className="space-y-3 flex-1">
        {routine.warmup.map((w, i) => (
          <motion.div
            key={w}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-amber-200 flex items-center gap-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-serif font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <span className="font-semibold">{w}</span>
          </motion.div>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onContinue}
        className="bg-glow-500 text-white py-5 rounded-full font-bold text-lg mt-6 shadow-lg shadow-glow-500/30"
      >
        Empezar ejercicios →
      </motion.button>
    </div>
  );
}

function ExerciseView({
  routine, exIndex, setIndex, secondsLeft, onCompleteReps,
}: { routine: Routine; exIndex: number; setIndex: number; secondsLeft: number; onCompleteReps: () => void; }) {
  const ex = routine.exercises[exIndex];
  const total = routine.exercises.length;
  const progress = ((exIndex + setIndex / ex.sets) / total) * 100;
  const progressInExercise = ex.kind === "time" && ex.amount > 0
    ? ((ex.amount - secondsLeft) / ex.amount) * 100
    : 0;

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-b from-ink to-ink/90 text-cream p-6 flex flex-col relative overflow-hidden">
      {/* Animated glow background */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-glow-500/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="mb-6 relative z-10">
        <div className="flex justify-between text-xs text-cream/60 mb-2">
          <span>Ejercicio {exIndex + 1} de {total}</span>
          <span>Set {setIndex + 1} de {ex.sets}</span>
        </div>
        <div className="h-1.5 bg-cream/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-glow-500"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {/* Animated exercise hero */}
        <div className="relative mb-4">
          {ex.kind === "time" && (
            <ProgressRing percent={progressInExercise} />
          )}
          <motion.div
            key={`${exIndex}-${setIndex}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-[140px] leading-none relative"
          >
            <motion.span
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              {ex.emoji}
            </motion.span>
          </motion.div>
        </div>

        <motion.h2
          key={ex.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-4xl md:text-5xl font-black mb-3 leading-tight"
        >
          {ex.name}
        </motion.h2>

        {ex.kind === "time" ? (
          <div className="mb-4">
            <motion.div
              key={secondsLeft}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-serif text-8xl font-black text-glow-400 tabular-nums"
            >
              {formatTime(secondsLeft)}
            </motion.div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="font-serif text-8xl font-black text-glow-400 tabular-nums">{ex.amount}</div>
            <div className="text-sm text-cream/60 uppercase tracking-widest">repeticiones</div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-cream/10 rounded-2xl px-5 py-3 mt-2 max-w-md border border-cream/10 backdrop-blur"
        >
          <div className="text-xs uppercase tracking-widest font-bold text-glow-300 mb-1">Tip de forma</div>
          <p className="text-sm text-cream/90">{ex.cue}</p>
        </motion.div>
      </div>

      {ex.kind === "reps" && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCompleteReps}
          className="bg-glow-500 text-white py-5 rounded-full font-bold text-lg shadow-2xl shadow-glow-500/40 mt-6 relative z-10"
        >
          Completé las {ex.amount} reps →
        </motion.button>
      )}
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 130;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width="320" height="320" className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 -rotate-90 pointer-events-none">
      <circle cx="160" cy="160" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <motion.circle
        cx="160" cy="160" r={r}
        fill="none"
        stroke="#F26A47"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: "linear" }}
      />
    </svg>
  );
}

function FeedbackSheet({ exercise, onSelect }: { exercise: Exercise; onSelect: (fb: Feedback) => void }) {
  const options: { fb: Feedback; emoji: string; label: string; color: string }[] = [
    { fb: "easy", emoji: "😎", label: "Muy fácil", color: "from-emerald-400 to-emerald-600" },
    { fb: "ok", emoji: "💪", label: "Perfecto", color: "from-glow-400 to-glow-600" },
    { fb: "hard", emoji: "🥵", label: "Muy duro", color: "from-rose-400 to-rose-600" },
  ];
  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-cream to-glow-50 p-6 flex flex-col">
      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="text-6xl text-center mb-4"
        >
          ✅
        </motion.div>
        <div className="text-xs uppercase tracking-widest font-bold text-glow-600 text-center mb-2">Set completado</div>
        <h2 className="font-serif text-3xl font-black text-center mb-2">{exercise.name}</h2>
        <p className="text-center text-ink/60 mb-10">¿Cómo se sintió?</p>

        <div className="space-y-3">
          {options.map((opt, i) => (
            <motion.button
              key={opt.fb}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(opt.fb)}
              className={`w-full bg-gradient-to-br ${opt.color} text-white p-5 rounded-2xl flex items-center gap-4 shadow-lg`}
            >
              <span className="text-4xl">{opt.emoji}</span>
              <span className="font-serif text-xl font-bold flex-1 text-left">{opt.label}</span>
              <span className="text-white/70">›</span>
            </motion.button>
          ))}
        </div>

        <p className="text-center text-xs text-ink/40 mt-6">El coach IA usa esto para ajustarte la próxima vez</p>
      </div>
    </div>
  );
}

function RestView({
  routine, secondsLeft, nextExIndex, nextSetIndex, onSkip,
}: { routine: Routine; secondsLeft: number; nextExIndex: number; nextSetIndex: number; onSkip: () => void; }) {
  const nextEx = routine.exercises[nextExIndex];
  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-emerald-50 to-teal-100 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"
      />
      <div className="relative z-10">
        <div className="text-xs uppercase tracking-widest font-bold text-emerald-700 mb-3">Descanso</div>
        <motion.div
          key={secondsLeft}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="font-serif text-9xl font-black text-emerald-700 tabular-nums mb-4 tracking-tighter"
        >
          {formatTime(secondsLeft)}
        </motion.div>
        <p className="text-ink/60 mb-8">Respira. Hidrátate. Sigue.</p>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 max-w-md mb-6 shadow-sm">
          <div className="text-xs uppercase tracking-widest font-bold text-emerald-700 mb-2">Sigue →</div>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{nextEx.emoji}</div>
            <div className="text-left">
              <div className="font-bold">{nextEx.name}</div>
              <div className="text-sm text-ink/60">
                Set {nextSetIndex + 1} de {nextEx.sets} · {nextEx.kind === "time" ? `${nextEx.amount} seg` : `${nextEx.amount} reps`}
              </div>
            </div>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.95 }} onClick={onSkip} className="text-emerald-700 font-semibold underline">
          Saltar descanso
        </motion.button>
      </div>
    </div>
  );
}

function Cooldown({ routine, onFinish }: { routine: Routine; onFinish: () => void }) {
  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex flex-col">
      <div className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-3">Casi listo · paso 3 de 3</div>
      <h2 className="font-serif text-4xl font-bold mb-6">Estiramiento</h2>
      <div className="space-y-3 flex-1">
        {routine.cooldown.map((w, i) => (
          <motion.div
            key={w}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-blue-200 flex items-center gap-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-serif font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <span className="font-semibold">{w}</span>
          </motion.div>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onFinish} className="bg-glow-500 text-white py-5 rounded-full font-bold text-lg mt-6 shadow-lg shadow-glow-500/30">
        Terminar entrenamiento →
      </motion.button>
    </div>
  );
}

function Done({
  routine, totalSeconds, feedbacks, onBack,
}: { routine: Routine; totalSeconds: number; feedbacks: { exercise: string; feedback: Feedback }[]; onBack: () => void }) {
  const mins = Math.floor(totalSeconds / 60);
  const sets = routine.exercises.reduce((s, e) => s + e.sets, 0);
  const hardCount = feedbacks.filter((f) => f.feedback === "hard").length;
  const easyCount = feedbacks.filter((f) => f.feedback === "easy").length;
  const aiVerdict =
    hardCount > sets / 3 ? "Te costó más de lo esperado — la próxima ajusto." :
    easyCount > sets / 2 ? "¡Eso fue fácil! Te subo el nivel la próxima." :
    "Nivel justo. Mantenemos.";

  return (
    <div className={`min-h-[calc(100vh-100px)] bg-gradient-to-br ${routine.color} text-white p-6 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
      {/* Confetti */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -50, x: (i - 7) * 30, opacity: 0, rotate: 0 }}
          animate={{ y: 800, opacity: [0, 1, 0], rotate: 360 * (i % 2 ? 1 : -1) }}
          transition={{ duration: 3, delay: i * 0.1, ease: "easeIn" }}
          className="absolute text-3xl pointer-events-none"
          style={{ left: `${10 + (i * 5) % 80}%` }}
        >
          {["💛", "✨", "🎉", "💪", "🌸"][i % 5]}
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 12 }}
        className="text-9xl mb-6"
      >
        🎉
      </motion.div>
      <div className="text-xs uppercase tracking-widest font-bold text-white/80 mb-3">¡Hecho!</div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-serif text-5xl font-black mb-2"
      >
        ¡Lo lograste!
      </motion.h2>
      <p className="text-white/90 mb-8">Completaste tu sesión de {routine.title}.</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-3 w-full max-w-md mb-6"
      >
        <StatBox label="Minutos" value={String(mins)} />
        <StatBox label="Sets" value={String(sets)} />
        <StatBox label="Ejercicios" value={String(routine.exercises.length)} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/15 backdrop-blur rounded-2xl p-4 mb-8 max-w-md border border-white/15"
      >
        <div className="text-xs uppercase tracking-widest font-bold text-white/70 mb-1">✨ Coach IA</div>
        <p className="text-sm">{aiVerdict}</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileTap={{ scale: 0.97 }}
        onClick={onBack}
        className="bg-white text-ink px-12 py-4 rounded-full font-bold text-lg w-full max-w-md shadow-xl"
      >
        Volver al inicio
      </motion.button>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m === 0) return String(ss);
  return `${m}:${String(ss).padStart(2, "0")}`;
}
