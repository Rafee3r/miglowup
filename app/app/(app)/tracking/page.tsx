import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AddMeasurement } from "./AddMeasurement";

export default async function TrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: measurements } = await supabase
    .from("measurements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const list = measurements ?? [];
  const latest = list[0];
  const first = list[list.length - 1];
  const weightDelta =
    latest?.weight_kg && first?.weight_kg ? +(latest.weight_kg - first.weight_kg).toFixed(1) : null;

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Tu progreso</h1>
        <p className="text-ink/60 mt-1">Lleva el registro de tu transformación.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <div className="text-xs uppercase tracking-widest font-bold text-glow-500">Peso actual</div>
          <div className="font-serif text-3xl font-bold mt-2">
            {latest?.weight_kg ? `${latest.weight_kg} kg` : "—"}
          </div>
          {weightDelta !== null && (
            <div className={`text-sm mt-1 ${weightDelta < 0 ? "text-emerald-600" : "text-ink/60"}`}>
              {weightDelta > 0 ? "+" : ""}
              {weightDelta} kg desde el inicio
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <div className="text-xs uppercase tracking-widest font-bold text-glow-500">Registros</div>
          <div className="font-serif text-3xl font-bold mt-2">{list.length}</div>
          <div className="text-sm text-ink/60 mt-1">Total medidas</div>
        </div>
      </div>

      <AddMeasurement />

      <div>
        <h2 className="font-serif text-xl font-bold mb-3">Historial</h2>
        {list.length === 0 ? (
          <p className="text-ink/50 text-sm">Aún no tienes registros. ¡Agrega el primero!</p>
        ) : (
          <ul className="space-y-2">
            {list.map((m) => (
              <li key={m.id} className="bg-white rounded-xl p-4 border border-ink/10 flex justify-between text-sm">
                <span className="text-ink/60">
                  {new Date(m.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="font-semibold">
                  {m.weight_kg ? `${m.weight_kg} kg` : ""}
                  {m.waist_cm ? ` · cintura ${m.waist_cm} cm` : ""}
                  {m.hip_cm ? ` · cadera ${m.hip_cm} cm` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
