import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

/**
 * Genera el "plan personalizado" que se le revela a la usuaria al terminar
 * el onboarding profundo. Es el momento "wow" donde la IA mira sus 12
 * respuestas y le entrega un plan que se siente único para ella.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json(fallbackPlan(body));

  const prompt = `Eres el Coach IA de MiGlowUp. Una usuaria acaba de completar el onboarding profundo. Basándote en sus respuestas, genera un plan personalizado que la haga sentir VISTA y entendida.

Responde JSON estricto con esta estructura:
{
  "headline": "Frase corta y poderosa que resume el plan (max 60 chars). Usa SU contexto.",
  "intro": "1 frase empática reconociendo dónde está hoy. Sin clichés.",
  "weeklySchedule": "Schedule semanal recomendado (ej: '4 días/semana, 25 min cada uno')",
  "focusAreas": ["3 áreas de foco específicas según sus respuestas, max 4 palabras cada una"],
  "firstWeek": ["3 acciones concretas para esta primera semana"],
  "milestone": "Qué puede esperar en 4 semanas si sigue el plan, sin promesas exageradas",
  "tone": "uno de: 'gentle' (si dice agotada/estresada/poco tiempo), 'energetic' (si dice motivada), 'patient' (si tiene historial de fracasos)"
}

RESPUESTAS DE LA USUARIA:
${JSON.stringify(body, null, 2)}

REGLAS:
- Español chileno neutro con "tú", nunca "vos"
- Cero clichés ("tu mejor versión", "transformación radical", "quema grasa")
- Cero promesas de números ("bajarás 5 kg en X semanas")
- Empático con lo difícil. Reconoce contexto (madre, trabajo, edad, etc)
- Si dijo que le falta tiempo → enfatiza rutinas cortas
- Si dijo problemas de rodillas → menciona low-impact
- Si dijo perimenopausia o 40+ → menciona conservar masa muscular
- Tono según severidad: si responde múltiples negativas, tono 'gentle'`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error("deepseek error");
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("no content");
    const plan = JSON.parse(content);
    return NextResponse.json(plan);
  } catch (err) {
    console.error("Plan reveal AI error:", err);
    return NextResponse.json(fallbackPlan(body));
  }
}

function fallbackPlan(body: Record<string, unknown>) {
  const name = (body.firstName as string) || "fundadora";
  return {
    headline: `Plan para ${name}: empezar simple, sostenible y desde tu casa.`,
    intro: "Sabemos que llegaste con cansancio acumulado. Este plan respeta eso.",
    weeklySchedule: "4 días/semana, 20-28 min cada uno",
    focusAreas: ["Crear hábito", "Tonificación", "Energía estable"],
    firstWeek: [
      "Día 1: Movilidad matutina (10 min) — desperezarte",
      "Día 3: Full Body 25 min — primer entreno de fuerza",
      "Día 5: Yoga 30 min — recuperación activa",
    ],
    milestone: "En 4 semanas, esperamos que el entrenar ya no sea esfuerzo mental.",
    tone: "gentle",
  };
}
