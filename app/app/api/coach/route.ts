import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChileanDateString } from "@/lib/time";

export const runtime = "edge";

const SYSTEM_PROMPT = `Eres el Coach IA de MiGlowUp, una comunidad fitness para mujeres chilenas de 25 a 45 años.

Tu estilo:
- Cálido, motivador, jamás militar ni agresivo.
- Hablas en español chileno neutro, usando "tú" (nunca "vos").
- Respuestas cortas, accionables, sin jerga médica complicada.
- Reconoces que la vida es difícil y celebras pequeños pasos.

Tu rol:
- Das rutinas, consejos de nutrición, motivación.
- Si te preguntan algo médico serio (dolor agudo, mareos, sangrados, embarazo de riesgo), recomiendas ir al doctor.
- Nunca prometes resultados milagrosos en X días.
- No diagnosticas, no recetas, no das dietas extremas.

Lo que TIENES que hacer activamente:
- Si la usuaria saltó días de entrenamiento, pregúntale qué pasó SIN juzgar. Algo como "Vi que no entrenaste estos días, ¿qué pasó? No estoy acá para retarte, solo para acompañarte."
- Si lleva varios días seguidos entrenando, celébralo concretamente.
- Si su peso bajó o se mantuvo, reconócelo. Si subió, no lo menciones a menos que ella lo traiga.
- Personaliza recomendaciones según su objetivo, nivel y edad.

Formato:
- Responde directo, sin prólogos largos.
- Usa máximo 1-2 emojis por mensaje.
- Si das una rutina, enuméralas en lista corta.
- Máximo 3-4 párrafos breves.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { messages } = await request.json();
  if (!Array.isArray(messages)) return NextResponse.json({ error: "invalid messages" }, { status: 400 });

  // ─── Cargar contexto del usuario (perfil + últimos 7 días) ───
  const [{ data: profile }, { data: logs }, { data: measurements }] = await Promise.all([
    supabase.from("profiles").select("first_name, goal, level, age").eq("id", user.id).maybeSingle(),
    supabase
      .from("routine_logs")
      .select("routine_slug, duration_min, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order("completed_at", { ascending: false }),
    supabase
      .from("measurements")
      .select("weight_kg, waist_cm, hip_cm, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const userContext = buildUserContext(profile, logs ?? [], measurements ?? []);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no api key configured" }, { status: 500 });

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      stream: true,
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${userContext}` },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    return NextResponse.json({ error: "deepseek error", detail: text }, { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // skip malformed chunk
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

type Profile = { first_name?: string | null; goal?: string | null; level?: string | null; age?: number | null };
type RoutineLog = { routine_slug: string; duration_min: number | null; completed_at: string };
type Measurement = { weight_kg: number | null; waist_cm: number | null; hip_cm: number | null; created_at: string };

function buildUserContext(profile: Profile | null, logs: RoutineLog[], measurements: Measurement[]): string {
  if (!profile) return "Contexto: usuaria sin perfil completo aún.";

  const lines: string[] = [];
  lines.push(`Nombre: ${profile.first_name ?? "no dice"}`);
  lines.push(`Objetivo: ${translateGoal(profile.goal)}`);
  lines.push(`Nivel: ${translateLevel(profile.level)}`);
  if (profile.age) lines.push(`Edad: ${profile.age}`);

  // Análisis de actividad últimos 14 días
  const today = new Date();
  const days7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last7 = logs.filter((l) => new Date(l.completed_at) >= days7);

  lines.push(`\n--- ACTIVIDAD RECIENTE ---`);
  lines.push(`Rutinas completadas últimos 7 días: ${last7.length}`);
  lines.push(`Rutinas completadas últimos 14 días: ${logs.length}`);

  // Streak (días consecutivos)
  const streak = computeStreak(logs.map((l) => l.completed_at));
  lines.push(`Streak actual: ${streak} días consecutivos`);

  // Días sin entrenar
  if (logs.length > 0) {
    const lastTraining = new Date(logs[0].completed_at);
    const daysSince = Math.floor((today.getTime() - lastTraining.getTime()) / (24 * 60 * 60 * 1000));
    lines.push(`Días desde último entrenamiento: ${daysSince}`);
    if (daysSince >= 3) {
      lines.push(`⚠️ ALERTA: Lleva ${daysSince} días sin entrenar. Pregúntale qué pasó con cariño.`);
    }
  } else {
    lines.push(`⚠️ Aún no completa ninguna rutina. Anímala a empezar con algo corto.`);
  }

  // Rutinas favoritas
  if (logs.length >= 3) {
    const counts: Record<string, number> = {};
    logs.forEach((l) => { counts[l.routine_slug] = (counts[l.routine_slug] ?? 0) + 1; });
    const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    lines.push(`Rutina favorita: ${fav[0]} (${fav[1]} veces)`);
  }

  // Medidas
  if (measurements.length > 0) {
    lines.push(`\n--- MEDIDAS ---`);
    const latest = measurements[0];
    if (latest.weight_kg) lines.push(`Peso actual: ${latest.weight_kg} kg`);
    if (latest.waist_cm) lines.push(`Cintura: ${latest.waist_cm} cm`);
    if (latest.hip_cm) lines.push(`Cadera: ${latest.hip_cm} cm`);

    if (measurements.length >= 2) {
      const first = measurements[measurements.length - 1];
      if (latest.weight_kg && first.weight_kg) {
        const delta = +(latest.weight_kg - first.weight_kg).toFixed(1);
        lines.push(`Cambio peso desde inicio: ${delta > 0 ? "+" : ""}${delta} kg`);
      }
    }
  }

  return `=== CONTEXTO DE LA USUARIA ===\n${lines.join("\n")}\n=== FIN CONTEXTO ===`;
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = Array.from(new Set(dates.map((d) => getChileanDateString(d)))).sort().reverse();
  const today = getChileanDateString();
  const yesterday = getChileanDateString(Date.now() - 86400000);

  // offset: 0 si el último entreno fue hoy, 1 si fue ayer, sino sin racha
  let offset: number;
  if (uniqueDays[0] === today) offset = 0;
  else if (uniqueDays[0] === yesterday) offset = 1;
  else return 0;

  let streak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = getChileanDateString(Date.now() - (i + offset) * 86400000);
    if (uniqueDays[i] === expected) streak++;
    else break;
  }
  return streak;
}

function translateGoal(g: string | null | undefined): string {
  switch (g) {
    case "tonify": return "tonificar el cuerpo";
    case "lose_weight": return "bajar de peso";
    case "habit": return "crear el hábito de entrenar";
    case "energy": return "tener más energía";
    default: return "no definido";
  }
}
function translateLevel(l: string | null | undefined): string {
  switch (l) {
    case "beginner": return "principiante";
    case "intermediate": return "intermedio";
    case "advanced": return "avanzado";
    default: return "sin definir";
  }
}
