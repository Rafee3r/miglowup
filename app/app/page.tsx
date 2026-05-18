import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 fade-in">
      <div className="max-w-md w-full text-center">
        <div className="text-xs uppercase tracking-widest font-bold text-glow-500 mb-3">
          Tu transformación empieza acá
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-4">
          Mi<span className="italic text-glow-500">GlowUp</span>
        </h1>
        <p className="text-lg text-ink/70 mb-10">
          Comunidad, rutinas, tracking y coach IA — todo en un solo lugar.
        </p>
        <Link
          href="/login"
          className="inline-block bg-glow-500 text-white px-8 py-4 rounded-full font-bold hover:bg-glow-600 transition w-full"
        >
          Entrar
        </Link>
        <p className="text-sm text-ink/50 mt-6">
          ¿Primera vez acá? Solo ingresa tu correo y te enviamos un link mágico.
        </p>
      </div>
    </main>
  );
}
