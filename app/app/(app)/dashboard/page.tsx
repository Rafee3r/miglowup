import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");

  const today = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const name = profile.first_name || "fundadora";

  return (
    <div className="fade-in space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-glow-500">{today}</p>
        <h1 className="font-serif text-4xl font-bold mt-1">¡Hola, {name}!</h1>
        <p className="text-ink/60 mt-2">Lista para tu día de Glow Up 💛</p>
      </div>

      <Link
        href="/rutinas"
        className="block bg-glow-500 text-white rounded-3xl p-6 hover:bg-glow-600 transition"
      >
        <p className="text-xs uppercase tracking-widest opacity-80 font-bold mb-2">Rutina de hoy</p>
        <h2 className="font-serif text-2xl font-bold mb-3">Full Body — 25 min</h2>
        <p className="opacity-90 text-sm">Toca para empezar →</p>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/coach" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 transition">
          <div className="text-2xl mb-2">✨</div>
          <div className="font-semibold">Coach IA</div>
          <div className="text-xs text-ink/60">Pregúntame lo que sea</div>
        </Link>
        <Link href="/tracking" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 transition">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-semibold">Registrar peso</div>
          <div className="text-xs text-ink/60">Trackea tu progreso</div>
        </Link>
        <Link href="/comunidad" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 transition">
          <div className="text-2xl mb-2">💬</div>
          <div className="font-semibold">Comunidad</div>
          <div className="text-xs text-ink/60">Grupo WhatsApp</div>
        </Link>
        <Link href="/rutinas" className="bg-white rounded-2xl p-5 border border-ink/10 hover:border-glow-300 transition">
          <div className="text-2xl mb-2">💪</div>
          <div className="font-semibold">Más rutinas</div>
          <div className="text-xs text-ink/60">Explora la biblioteca</div>
        </Link>
      </div>

      <div className="bg-glow-50 border border-glow-200 rounded-2xl p-5 text-sm">
        <p className="font-semibold mb-1">💡 Tip del día</p>
        <p className="text-ink/70">Toma agua antes de entrenar. Tu cuerpo lo agradece y rindes mejor.</p>
      </div>
    </div>
  );
}
