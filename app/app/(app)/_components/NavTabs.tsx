"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export function NavTabs({ onboarded }: { onboarded: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!onboarded && pathname?.startsWith("/onboarding")) return null;

  const tabs = [
    { href: "/dashboard", label: "Inicio", icon: "🏠" },
    { href: "/rutinas", label: "Entrenamientos", icon: "💪" },
    { href: "plus", label: "", icon: "" }, // Central spacer for the floating button
    { href: "/coach", label: "Nutrición", icon: "🥗" }, // Nutrición links to coach for meal advice
    { href: "/tracking", label: "Perfil", icon: "👤" }, // Perfil links to tracking stats
  ];

  function handleQuickAction(href: string) {
    setMenuOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Barra de Navegación Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink/5 py-1 z-30 shadow-[0_-4px_24px_rgba(26,26,26,0.02)]">
        <div className="max-w-2xl mx-auto flex justify-around items-center relative px-2">
          {tabs.map((t) => {
            if (t.href === "plus") {
              // Botón Central Flotante (+)
              return (
                <div key="plus-btn" className="relative -top-3 flex flex-col items-center z-40">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-14 h-14 rounded-full bg-glow-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-glow-500/25 border-4 border-white focus:outline-none"
                    aria-label="Acciones rápidas"
                  >
                    <motion.span
                      animate={{ rotate: menuOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="leading-none select-none font-light"
                    >
                      +
                    </motion.span>
                  </motion.button>
                </div>
              );
            }

            const active = pathname === t.href || (t.href !== "/dashboard" && pathname?.startsWith(t.href + "/"));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center px-2 py-1 rounded-xl text-[10px] font-semibold transition-all duration-300 w-16 ${
                  active ? "text-glow-500 scale-105" : "text-ink/40 hover:text-ink/75"
                }`}
              >
                <span className={`text-xl leading-none transition-transform duration-300 ${active ? "scale-110" : ""}`}>
                  {t.icon}
                </span>
                <span className="mt-0.5 tracking-tight font-medium">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Overlay de Acciones Rápidas (Backdrop + Menu) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop esmerilado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40"
            />

            {/* Panel de Menú */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-24 left-4 right-4 md:left-auto md:right-auto md:w-[400px] md:left-1/2 md:-translate-x-1/2 bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-ink/5 shadow-2xl z-50 flex flex-col gap-3"
            >
              <h3 className="font-serif text-lg font-bold text-center text-ink mb-2">¿Qué quieres hacer hoy?</h3>
              
              <button
                onClick={() => handleQuickAction("/rutinas")}
                className="w-full bg-glow-50 border border-glow-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-glow-100 transition text-left"
              >
                <span className="text-3xl">💪</span>
                <div>
                  <div className="font-bold text-glow-700 text-sm">Empezar entrenamiento</div>
                  <div className="text-xs text-glow-600/70">15 a 30 min. Sin equipo.</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction("/tracking")}
                className="w-full bg-cream border border-ink/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-ink/5 transition text-left"
              >
                <span className="text-3xl">📈</span>
                <div>
                  <div className="font-bold text-ink text-sm">Registrar peso y medidas</div>
                  <div className="text-xs text-ink/50">Mide tu progreso real de hoy.</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction("/coach")}
                className="w-full bg-cream border border-ink/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-ink/5 transition text-left"
              >
                <span className="text-3xl">✨</span>
                <div>
                  <div className="font-bold text-ink text-sm">Preguntar a Coach IA</div>
                  <div className="text-xs text-ink/50">Dudas sobre rutinas, nutrición o motivación.</div>
                </div>
              </button>

              <button
                onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 mt-2 text-xs font-bold text-ink/40 hover:text-ink/65 underline"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
