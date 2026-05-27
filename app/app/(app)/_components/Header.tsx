"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="px-5 py-3 flex items-center justify-between border-b border-ink/5 bg-cream/80 backdrop-blur sticky top-0 z-30">
        {/* Menu Hamburguesa (Left) */}
        <button
          onClick={() => setMenuOpen(true)}
          className="p-1.5 -ml-1.5 text-ink hover:text-glow-600 transition active:scale-90 focus:outline-none"
          title="Menú principal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo Centrado (Center) */}
        <Link href="/dashboard" className="font-serif text-2xl font-black tracking-tight select-none">
          Mi<span className="italic text-glow-500 font-semibold font-serif">Glow</span>Up
        </Link>

        {/* Campana de Notificaciones (Right) */}
        <div className="relative">
          <button
            className="p-1.5 -mr-1.5 text-ink hover:text-glow-600 transition active:scale-90 focus:outline-none"
            title="Notificaciones"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-glow-500 ring-2 ring-cream" />
        </div>
      </header>

      {/* Menú Lateral Deslizante */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-40"
            />

            {/* Cajón lateral */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-cream border-r border-ink/5 z-50 p-6 flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div className="font-serif text-2xl font-black">
                    Mi<span className="italic text-glow-500 font-serif">Glow</span>Up
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-1 text-ink/40 hover:text-ink transition"
                  >
                    ✕
                  </button>
                </div>

                <nav className="space-y-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block font-semibold text-ink/75 hover:text-glow-600 transition py-1"
                  >
                    🏠 Inicio
                  </Link>
                  <Link
                    href="/rutinas"
                    onClick={() => setMenuOpen(false)}
                    className="block font-semibold text-ink/75 hover:text-glow-600 transition py-1"
                  >
                    💪 Entrenamientos
                  </Link>
                  <Link
                    href="/coach"
                    onClick={() => setMenuOpen(false)}
                    className="block font-semibold text-ink/75 hover:text-glow-600 transition py-1"
                  >
                    ✨ Coach IA
                  </Link>
                  <Link
                    href="/tracking"
                    onClick={() => setMenuOpen(false)}
                    className="block font-semibold text-ink/75 hover:text-glow-600 transition py-1"
                  >
                    📈 Progreso y Medidas
                  </Link>
                  <Link
                    href="/comunidad"
                    onClick={() => setMenuOpen(false)}
                    className="block font-semibold text-ink/75 hover:text-glow-600 transition py-1"
                  >
                    💬 Comunidad WhatsApp
                  </Link>
                </nav>
              </div>

              {/* Botón de Cerrar Sesión */}
              <form action="/auth/signout" method="post" className="w-full">
                <button
                  type="submit"
                  className="w-full text-center bg-white border border-ink/10 text-ink/60 hover:text-rose-500 hover:border-rose-200 py-3 rounded-xl font-bold transition duration-300 shadow-sm active:scale-95"
                >
                  🚪 Cerrar Sesión
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
