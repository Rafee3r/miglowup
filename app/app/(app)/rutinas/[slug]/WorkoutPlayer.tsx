"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Routine, Exercise } from "@/lib/routines";

type Phase =
  | { kind: "intro" }
  | { kind: "warmup" }
  | { kind: "exercise"; exIndex: number; setIndex: number; secondsLeft: number }
  | { kind: "rest"; nextExIndex: number; nextSetIndex: number; secondsLeft: number }
  | { kind: "cooldown" }
  | { kind: "done"; totalSeconds: number; startedAt: number };

export function WorkoutPlayer({ routine }: { routine: Routine }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [muted, setMuted] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
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
        // tiempo terminado
        if (p.kind === "exercise") {
          beep();
          if (voiceOn) speak("Listo");
          return advanceAfterExercise(p.exIndex, p.setIndex);
        }
        // rest acabado → siguiente ejercicio
        beep();
        if (voiceOn) speak("Vamos");
        const next = routine.exercises[p.nextExIndex];
        const startSeconds = next.kind === "time" ? next.amount : 0;
        return {
          kind: "exercise",
          exIndex: p.nextExIndex,
          setIndex: p.nextSetIndex,
          secondsLeft: startSeconds,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind, voiceOn]);

  function advanceAfterExercise(exIndex: number, setIndex: number): Phase {
    const ex = routine.exercises[exIndex];
    // ¿más sets del mismo ejercicio?
    if (setIndex + 1 < ex.sets) {
      return {
        kind: "rest",
        nextExIndex: exIndex,
        nextSetIndex: setIndex + 1,
        secondsLeft: ex.rest,
      };
    }
    // ¿más ejercicios?
    if (exIndex + 1 < routine.exercises.length) {
      return {
        kind: "rest",
        nextExIndex: exIndex + 1,
        nextSetIndex: 0,
        secondsLeft: ex.rest,
      };
    }
    // terminó
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
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  // ─────────── Actions ───────────
  function startWorkout() {
    setStartedAt(Date.now());
    setPhase({ kind: "warmup" });
  }
  function finishWarmup() {
    const ex = routine.exercises[0];
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
    setPhase(advanceAfterExercise(phase.exIndex, phase.setIndex));
  }
  function skipRest() {
    if (phase.kind !== "rest") return;
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
    setPhase({ kind: "done", totalSeconds: total, startedAt: startedAt ?? Date.now() });
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
    <div className="-mx-5 -my-6">
      <Controls muted={muted} setMuted={setMuted} voiceOn={voiceOn} setVoiceOn={setVoiceOn} />

      {phase.kind === "intro" && <Intro routine={routine} onStart={startWorkout} />}

      {phase.kind === "warmup" && <Warmup routine={routine} onContinue={finishWarmup} />}

      {phase.kind === "exercise" && (
        <ExerciseView
          routine={routine}
          exIndex={phase.exIndex}
          setIndex={phase.setIndex}
          secondsLeft={phase.secondsLeft}
          onCompleteReps={completeRepsSet}
        />
      )}

      {phase.kind === "rest" && (
        <RestView
          routine={routine}
          secondsLeft={phase.secondsLeft}
          nextExIndex={phase.nextExIndex}
          nextSetIndex={phase.nextSetIndex}
          onSkip={skipRest}
        />
      )}

      {phase.kind === "cooldown" && <Cooldown routine={routine} onFinish={finishCooldown} />}

      {phase.kind === "done" && (
        <Done routine={routine} totalSeconds={phase.totalSeconds} onBack={() => router.push("/dashboard")} />
      )}
    </div>
  );
}

// ─────────── Sub-components ───────────

function Controls({
  muted, setMuted, voiceOn, setVoiceOn,
}: { muted: boolean; setMuted: (v: boolean) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void; }) {
  return (
    <div className="fixed top-3 right-3 z-30 flex gap-2">
      <button
        onClick={() => setVoiceOn(!voiceOn)}
        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur transition ${voiceOn ? "bg-glow-500 text-white" : "bg-white/80 text-ink/60"}`}
        title="Voz del coach"
      >
        🗣️
      </button>
      <button
        onClick={() => setMuted(!muted)}
        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur transition ${muted ? "bg-ink/80 text-white" : "bg-white/80 text-ink/60"}`}
        title={muted ? "Sonido desactivado" : "Sonido activado"}
      >
        {muted ? "🔇" : "🔔"}
      </button>
    </div>
  );
}

function Intro({ routine, onStart }: { routine: Routine; onStart: () => void }) {
  const totalSets = routine.exercises.reduce((sum, e) => sum + e.sets, 0);
  return (
    <div className={`min-h-[calc(100vh-100px)] bg-gradient-to-br ${routine.color} text-white p-6 flex flex-col`}>
      <Link href="/rutinas" className="text-white/80 text-sm font-medium mb-6">‹ Volver</Link>

      <div className="flex-1 flex flex-col justify-center fade-in">
        <div className="text-7xl mb-4">{routine.emoji}</div>
        <h1 className="font-serif text-5xl md:text-6xl font-black leading-[0.95] mb-3">{routine.title}</h1>
        <p className="text-lg text-white/90 mb-6">{routine.description}</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/15 rounded-2xl p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-widest font-bold text-white/70">Duración</div>
            <div className="font-serif text-2xl font-bold mt-1">{routine.duration}</div>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-widest font-bold text-white/70">Nivel</div>
            <div className="font-serif text-2xl font-bold mt-1">{routine.level}</div>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-widest font-bold text-white/70">Sets</div>
            <div className="font-serif text-2xl font-bold mt-1">{totalSets}</div>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur mb-8">
          <div className="text-xs uppercase tracking-widest font-bold mb-3 text-white/70">🔥 Calentamiento (3 min)</div>
          <ul className="space-y-1.5 text-sm">
            {routine.warmup.map((w) => <li key={w}>• {w}</li>)}
          </ul>
        </div>

        <button
          onClick={onStart}
          className="bg-white text-ink py-5 rounded-full font-bold text-lg hover:bg-cream transition shadow-2xl"
        >
          Empezar entrenamiento →
        </button>
        <p className="text-center text-xs text-white/70 mt-3">Activa la voz del coach si quieres guía hablada</p>
      </div>
    </div>
  );
}

function Warmup({ routine, onContinue }: { routine: Routine; onContinue: () => void }) {
  return (
    <div className="min-h-[calc(100vh-100px)] bg-amber-50 p-6 flex flex-col fade-in">
      <div className="text-xs uppercase tracking-widest font-bold text-amber-700 mb-3">Paso 1 de 3</div>
      <h2 className="font-serif text-4xl font-bold mb-6">Calentamiento</h2>
      <div className="space-y-3 flex-1">
        {routine.warmup.map((w, i) => (
          <div key={w} className="bg-white rounded-2xl p-5 border border-amber-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-serif font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <span className="font-semibold">{w}</span>
          </div>
        ))}
      </div>
      <button onClick={onContinue} className="bg-glow-500 text-white py-5 rounded-full font-bold text-lg mt-6 hover:bg-glow-600 transition shadow-lg">
        Empezar ejercicios →
      </button>
    </div>
  );
}

function ExerciseView({
  routine, exIndex, setIndex, secondsLeft, onCompleteReps,
}: { routine: Routine; exIndex: number; setIndex: number; secondsLeft: number; onCompleteReps: () => void; }) {
  const ex = routine.exercises[exIndex];
  const total = routine.exercises.length;
  const progress = ((exIndex + setIndex / ex.sets) / total) * 100;

  return (
    <div className="min-h-[calc(100vh-100px)] bg-ink text-cream p-6 flex flex-col fade-in">
      {/* Top progress + meta */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-cream/60 mb-2">
          <span>Ejercicio {exIndex + 1} de {total}</span>
          <span>Set {setIndex + 1} de {ex.sets}</span>
        </div>
        <div className="h-1.5 bg-cream/10 rounded-full overflow-hidden">
          <div className="h-full bg-glow-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-[140px] leading-none mb-6 animate-pulse-slow">{ex.emoji}</div>
        <h2 className="font-serif text-4xl md:text-5xl font-black mb-3 leading-tight">{ex.name}</h2>

        {ex.kind === "time" ? (
          <div className="mb-4">
            <div className="font-serif text-8xl font-black text-glow-400 tabular-nums">{formatTime(secondsLeft)}</div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="font-serif text-8xl font-black text-glow-400 tabular-nums">{ex.amount}</div>
            <div className="text-sm text-cream/60 uppercase tracking-widest">repeticiones</div>
          </div>
        )}

        <div className="bg-cream/10 rounded-2xl px-5 py-3 mt-2 max-w-md">
          <div className="text-xs uppercase tracking-widest font-bold text-glow-300 mb-1">Tip de forma</div>
          <p className="text-sm text-cream/90">{ex.cue}</p>
        </div>
      </div>

      {/* Bottom action */}
      {ex.kind === "reps" && (
        <button
          onClick={onCompleteReps}
          className="bg-glow-500 text-white py-5 rounded-full font-bold text-lg hover:bg-glow-600 transition shadow-2xl shadow-glow-500/30 mt-6"
        >
          Completé las {ex.amount} reps →
        </button>
      )}
    </div>
  );
}

function RestView({
  routine, secondsLeft, nextExIndex, nextSetIndex, onSkip,
}: { routine: Routine; secondsLeft: number; nextExIndex: number; nextSetIndex: number; onSkip: () => void; }) {
  const nextEx = routine.exercises[nextExIndex];
  return (
    <div className="min-h-[calc(100vh-100px)] bg-emerald-50 p-6 flex flex-col items-center justify-center text-center fade-in">
      <div className="text-xs uppercase tracking-widest font-bold text-emerald-700 mb-3">Descanso</div>
      <div className="font-serif text-9xl font-black text-emerald-700 tabular-nums mb-4">{formatTime(secondsLeft)}</div>
      <p className="text-ink/60 mb-8">Respira. Hidrátate. Sigue.</p>

      <div className="bg-white rounded-2xl p-5 border border-emerald-200 w-full max-w-md mb-6">
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

      <button onClick={onSkip} className="text-emerald-700 font-semibold underline">
        Saltar descanso
      </button>
    </div>
  );
}

function Cooldown({ routine, onFinish }: { routine: Routine; onFinish: () => void }) {
  return (
    <div className="min-h-[calc(100vh-100px)] bg-blue-50 p-6 flex flex-col fade-in">
      <div className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-3">Casi listo · paso 3 de 3</div>
      <h2 className="font-serif text-4xl font-bold mb-6">Estiramiento</h2>
      <div className="space-y-3 flex-1">
        {routine.cooldown.map((w, i) => (
          <div key={w} className="bg-white rounded-2xl p-5 border border-blue-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-serif font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <span className="font-semibold">{w}</span>
          </div>
        ))}
      </div>
      <button onClick={onFinish} className="bg-glow-500 text-white py-5 rounded-full font-bold text-lg mt-6 hover:bg-glow-600 transition shadow-lg">
        Terminar entrenamiento →
      </button>
    </div>
  );
}

function Done({ routine, totalSeconds, onBack }: { routine: Routine; totalSeconds: number; onBack: () => void }) {
  const mins = Math.floor(totalSeconds / 60);
  const sets = routine.exercises.reduce((s, e) => s + e.sets, 0);
  return (
    <div className={`min-h-[calc(100vh-100px)] bg-gradient-to-br ${routine.color} text-white p-6 flex flex-col items-center justify-center text-center fade-in`}>
      <div className="text-9xl mb-6 animate-bounce-slow">🎉</div>
      <div className="text-xs uppercase tracking-widest font-bold text-white/80 mb-3">¡Hecho!</div>
      <h2 className="font-serif text-5xl font-black mb-2">¡Lo lograste!</h2>
      <p className="text-white/90 mb-8">Completaste tu sesión de {routine.title}.</p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
        <div className="bg-white/15 rounded-2xl p-4 backdrop-blur">
          <div className="font-serif text-3xl font-black">{mins}</div>
          <div className="text-xs text-white/70">minutos</div>
        </div>
        <div className="bg-white/15 rounded-2xl p-4 backdrop-blur">
          <div className="font-serif text-3xl font-black">{sets}</div>
          <div className="text-xs text-white/70">sets</div>
        </div>
        <div className="bg-white/15 rounded-2xl p-4 backdrop-blur">
          <div className="font-serif text-3xl font-black">{routine.exercises.length}</div>
          <div className="text-xs text-white/70">ejercicios</div>
        </div>
      </div>

      <button onClick={onBack} className="bg-white text-ink px-12 py-4 rounded-full font-bold text-lg hover:bg-cream transition w-full max-w-md">
        Volver al inicio
      </button>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m === 0) return String(ss);
  return `${m}:${String(ss).padStart(2, "0")}`;
}
