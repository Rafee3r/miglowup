import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

/**
 * Genera el saludo personalizado del dashboard y la recomendación de rutina
 * basado en perfil, actividad reciente y hora del día.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: profile }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("first_name, goal, level, age").eq("id", user.id).maybeSingle(),
    supabase
      .from("routine_logs")
      .select("routine_slug, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order("completed_at", { ascending: false }),
  ]);

  const lastLogs = logs ?? [];
  const lastTraining = lastLogs[0] ? new Date(lastLogs[0].completed_at) : null;
  const daysSinceTraining = lastTraining
    ? Math.floor((Date.now() - lastTraining.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const hour = new Date().getHours();
  const tod = hour < 12 ? "mañana" : hour < 19 ? "tarde" : "noche";

  const userBrief = {
    name: profile?.first_name ?? null,
    goal: profile?.goal ?? null,
    level: profile?.level ?? "beginner",
    daysSinceTraining,
    workoutsLast7Days: lastLogs.filter((l) => new Date(l.completed_at) >= new Date(Date.now() - 7 * 86400000)).length,
    timeOfDay: tod,
  };

  const streakValue = computeStreak(lastLogs.map((l) => l.completed_at));

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ...fallbackInsights(userBrief),
      streak: streakValue,
      workoutsLast7Days: userBrief.workoutsLast7Days,
    });
  }

  const prompt = `Eres el coach IA de MiGlowUp. Genera 2 cosas en JSON estricto:

1. "greeting": Un saludo personalizado de 1-2 frases corto (max 80 caracteres), en español chileno neutro con "tú". Cálido, no agresivo. Si lleva 3+ días sin entrenar, pregunta con cariño. Si lleva racha buena, celebra concretamente. Si es nueva, motivala a empezar simple.

2. "recommendedRoutine": Slug de una de estas rutinas: "full-body-25", "abs-15", "gluteos-30", "cardio-20", "yoga-30", "movilidad-10". Elige según hora del día, objetivo y nivel.

3. "recommendedReason": Razón personalizada para esa rutina (max 80 caracteres).

CONTEXTO USUARIA:
- Nombre: ${userBrief.name ?? "no dice"}
- Objetivo: ${userBrief.goal ?? "no definido"}
- Nivel: ${userBrief.level}
- Días sin entrenar: ${userBrief.daysSinceTraining ?? "nunca ha entrenado"}
- Entrenamientos últimos 7 días: ${userBrief.workoutsLast7Days}
- Hora del día: ${userBrief.timeOfDay}

Responde SOLO JSON válido, sin markdown ni explicaciones:
{"greeting":"...","recommendedRoutine":"...","recommendedReason":"..."}`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error("deepseek api error");
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("no content");
    const parsed = JSON.parse(content);
    return NextResponse.json({
      greeting: parsed.greeting || fallbackInsights(userBrief).greeting,
      recommendedRoutine: parsed.recommendedRoutine || "full-body-25",
      recommendedReason: parsed.recommendedReason || "Una sesión balanceada para hoy.",
      streak: streakValue,
      workoutsLast7Days: userBrief.workoutsLast7Days,
    });
  } catch (err) {
    console.error("Insights AI error, using fallback:", err);
    return NextResponse.json({
      ...fallbackInsights(userBrief),
      streak: streakValue,
      workoutsLast7Days: userBrief.workoutsLast7Days,
    });
  }
}

type Brief = {
  name: string | null;
  goal: string | null;
  level: string;
  daysSinceTraining: number | null;
  workoutsLast7Days: number;
  timeOfDay: string;
};

function fallbackInsights(b: Brief) {
  const name = b.name ?? "fundadora";
  let greeting: string;
  if (b.daysSinceTraining === null) {
    greeting = `Hola ${name}, ¿lista para tu primera rutina? 💛`;
  } else if (b.daysSinceTraining === 0) {
    greeting = `¡${name}, llevas un día perfecto hoy! ✨`;
  } else if (b.daysSinceTraining >= 3) {
    greeting = `Hola ${name}, ¿cómo va? Te extrañamos por acá 💛`;
  } else {
    greeting = `Buen${b.timeOfDay === "mañana" ? "os días" : b.timeOfDay === "tarde" ? "a tarde" : "as noches"}, ${name} ✨`;
  }
  return {
    greeting,
    recommendedRoutine: b.timeOfDay === "mañana" ? "movilidad-10" : b.level === "beginner" ? "full-body-25" : "gluteos-30",
    recommendedReason: b.timeOfDay === "mañana" ? "Activa el cuerpo en 10 min." : "Para tu nivel y objetivo, es la indicada.",
  };
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = Array.from(new Set(dates.map((d) => d.slice(0, 10)))).sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let offset: number;
  if (uniqueDays[0] === today) offset = 0;
  else if (uniqueDays[0] === yesterday) offset = 1;
  else return 0;
  let streak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(Date.now() - (i + offset) * 86400000).toISOString().slice(0, 10);
    if (uniqueDays[i] === expected) streak++;
    else break;
  }
  return streak;
}
