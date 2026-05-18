"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) setError(error.message);
    else setSent(true);

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 fade-in">
      <div className="max-w-md w-full">
        <Link href="/" className="block text-center font-serif text-3xl font-bold mb-2">
          Mi<span className="italic text-glow-500">GlowUp</span>
        </Link>
        <p className="text-center text-ink/60 mb-10">Entra a tu cuenta</p>

        {sent ? (
          <div className="bg-white border border-glow-200 rounded-3xl p-8 text-center">
            <div className="text-4xl mb-4">💌</div>
            <h2 className="font-serif text-2xl font-bold mb-3">¡Revisa tu correo!</h2>
            <p className="text-ink/70">
              Te enviamos un link mágico a <strong>{email}</strong>. Hazle clic y entras directo.
            </p>
            <p className="text-sm text-ink/50 mt-4">Mira la carpeta de spam por las dudas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-ink/10">
            <label className="block text-sm font-semibold mb-2">Tu correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.cl"
              className="w-full px-4 py-3 rounded-xl border border-ink/15 focus:border-glow-500 focus:ring-2 focus:ring-glow-200 outline-none transition mb-5"
            />
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-glow-500 text-white py-3 rounded-full font-bold hover:bg-glow-600 transition disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviarme link mágico"}
            </button>
            <p className="text-xs text-ink/50 text-center mt-4">
              Sin contraseñas. Te enviamos un link al correo para entrar.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
