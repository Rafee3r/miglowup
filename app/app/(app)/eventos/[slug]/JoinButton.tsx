"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

export function JoinButton({ eventId, initialJoined }: { eventId: string; initialJoined: boolean }) {
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (joined) {
      const ok = window.confirm("¿Salir del reto? Pierdes tu progreso.");
      if (!ok) { setLoading(false); return; }
      await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", user.id);
      setJoined(false);
    } else {
      await supabase.from("event_participants").insert({ event_id: eventId, user_id: user.id });
      setJoined(true);
      // Notificación local del navegador (si está permitida)
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("¡Bienvenida al reto! 🌸", { body: "Tu entrenamiento de hoy ya cuenta." });
      }
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <motion.button
      onClick={toggle}
      disabled={loading}
      whileTap={{ scale: 0.97 }}
      className={`w-full py-4 rounded-full font-bold text-lg shadow-xl transition ${
        joined
          ? "bg-white/20 backdrop-blur text-white border border-white/30"
          : "bg-white text-ink hover:bg-cream"
      }`}
    >
      {loading ? "..." : joined ? "✓ Estás en el reto" : "Unirme al reto →"}
    </motion.button>
  );
}
