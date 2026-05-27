"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Dame una rutina rápida para hoy",
  "¿Qué desayuno me recomiendas?",
  "Me siento sin motivación 😔",
  "¿Cuántas veces a la semana entreno?",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hola ✨ Soy tu Coach IA. Estoy aquí para ayudarte con rutinas, nutrición y motivación. ¿En qué te ayudo hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) throw new Error("fetch failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            role: "assistant",
            content: (last?.content ?? "") + chunk,
          };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Ups, algo falló. Intenta de nuevo en un momento 💛",
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="fade-in flex flex-col h-[calc(100vh-180px)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-glow-500 text-white rounded-br-sm"
                  : "bg-white border border-ink/10 rounded-bl-sm"
              }`}
            >
              {m.content || "..."}
            </div>
          </div>
        ))}
      </div>

      {messages.length <= 1 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs bg-white border border-ink/10 px-3 py-2 rounded-xl text-left hover:border-glow-300 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe a tu coach..."
          className="flex-1 px-4 py-3 rounded-full border border-ink/15 focus:border-glow-500 focus:ring-2 focus:ring-glow-200 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="bg-glow-500 text-white px-5 rounded-full font-bold hover:bg-glow-600 transition disabled:opacity-50"
        >
          {streaming ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
