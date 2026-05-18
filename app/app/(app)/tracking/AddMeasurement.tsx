"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AddMeasurement() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("measurements").insert({
      user_id: user.id,
      weight_kg: weight ? Number(weight) : null,
      waist_cm: waist ? Number(waist) : null,
      hip_cm: hip ? Number(hip) : null,
    });
    setWeight("");
    setWaist("");
    setHip("");
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-glow-500 text-white py-3 rounded-full font-bold hover:bg-glow-600 transition"
      >
        + Registrar hoy
      </button>
    );
  }

  return (
    <form onSubmit={save} className="bg-white rounded-2xl p-5 border border-ink/10 space-y-3">
      <h3 className="font-semibold">Nueva medida</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-ink/60">Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 mt-1 rounded-xl border border-ink/15"
          />
        </div>
        <div>
          <label className="text-xs text-ink/60">Cintura (cm)</label>
          <input
            type="number"
            step="0.5"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            className="w-full px-3 py-2 mt-1 rounded-xl border border-ink/15"
          />
        </div>
        <div>
          <label className="text-xs text-ink/60">Cadera (cm)</label>
          <input
            type="number"
            step="0.5"
            value={hip}
            onChange={(e) => setHip(e.target.value)}
            className="w-full px-3 py-2 mt-1 rounded-xl border border-ink/15"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2 rounded-full border border-ink/15 font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || (!weight && !waist && !hip)}
          className="flex-1 bg-glow-500 text-white py-2 rounded-full font-bold hover:bg-glow-600 transition disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
