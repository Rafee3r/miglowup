"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/rutinas", label: "Rutinas", icon: "💪" },
  { href: "/coach", label: "Coach", icon: "✨" },
  { href: "/tracking", label: "Progreso", icon: "📈" },
  { href: "/comunidad", label: "Comunidad", icon: "💬" },
];

export function NavTabs({ onboarded }: { onboarded: boolean }) {
  const pathname = usePathname();
  if (!onboarded && pathname?.startsWith("/onboarding")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink/10 px-2 py-2 z-20">
      <div className="max-w-2xl mx-auto flex justify-around">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname?.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center px-3 py-1 rounded-lg text-xs font-medium transition ${
                active ? "text-glow-600" : "text-ink/50 hover:text-ink"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="mt-1">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
