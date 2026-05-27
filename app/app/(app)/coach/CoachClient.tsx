"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { text: "Dame una rutina rápida para hoy", emoji: "💪" },
  { text: "¿Qué desayuno me recomiendas?", emoji: "🥣" },
  { text: "Me siento sin motivación 😔", emoji: "💛" },
  { text: "¿Cuántas veces a la semana entreno?", emoji: "📆" },
];

export function CoachClient() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hola ✨ Soy tu Coach IA personal. Conozco tu objetivo, tu nivel y tu actividad reciente. Pregúntame lo que sea.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll cuando llegan mensajes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

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

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="-mx-5 fade-in">
      {/* Scrollable messages area
          h dinámica: viewport completo - header (~64px) - nav (~80px) - input area (~80px) */}
      <div
        ref={scrollRef}
        className="overflow-y-auto px-5 pt-2 pb-4 space-y-3"
        style={{ height: "calc(100dvh - 64px - 88px - 84px)" }}
      >
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-glow-400 to-glow-600 flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5 shadow">✨</div>
            )}
            <div
              className={`max-w-[78%] px-4 py-2.5 rounded-2xl whitespace-pre-wrap leading-relaxed text-[15px] ${
                m.role === "user"
                  ? "bg-glow-500 text-white rounded-br-md shadow-sm"
                  : "bg-white border border-ink/10 rounded-bl-md shadow-sm"
              }`}
            >
              {m.content || (
                <span className="inline-flex gap-1 items-center text-ink/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: "240ms" }} />
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {/* Sugerencias visibles solo en conversación inicial */}
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-2 pt-4"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => send(s.text)}
                className="text-left bg-white border border-ink/10 p-3 rounded-2xl hover:border-glow-300 hover:bg-glow-50 transition active:scale-95"
              >
                <div className="text-lg mb-1">{s.emoji}</div>
                <div className="text-xs font-medium text-ink/80 leading-tight">{s.text}</div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input fijo, anclado por encima del nav inferior */}
      <div
        className="fixed left-0 right-0 z-20 bg-cream/95 backdrop-blur border-t border-ink/5 px-3 py-3"
        style={{ bottom: "80px" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="max-w-2xl mx-auto flex gap-2 items-end"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe a tu coach..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl border border-ink/15 focus:border-glow-400 focus:ring-2 focus:ring-glow-100 outline-none resize-none text-[15px] leading-snug bg-white"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || streaming}
            whileTap={{ scale: 0.95 }}
            className="bg-glow-500 text-white w-11 h-11 rounded-2xl flex items-center justify-center font-bold disabled:opacity-40 shadow-md shadow-glow-500/20 flex-shrink-0"
          >
            {streaming ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
              </svg>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
