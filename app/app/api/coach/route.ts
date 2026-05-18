import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

Formato:
- Responde directo, sin prólogos largos.
- Usa máximo 1-2 emojis por mensaje.
- Si das una rutina, enuméralas en lista corta.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { messages } = await request.json();
  if (!Array.isArray(messages)) return NextResponse.json({ error: "invalid messages" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, goal, level, age")
    .eq("id", user.id)
    .maybeSingle();

  const userContext = profile
    ? `Contexto de la usuaria: nombre=${profile.first_name ?? "?"}, objetivo=${profile.goal ?? "?"}, nivel=${profile.level ?? "?"}, edad=${profile.age ?? "?"}.`
    : "";

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
