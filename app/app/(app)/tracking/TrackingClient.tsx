"use client";

import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { AddMeasurement } from "./AddMeasurement";

type Measurement = {
  id: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  created_at: string;
};

type CalendarDay = { date: string; hasWorkout: boolean };

export function TrackingClient({
  measurements, calendarDays, todayKey,
}: { measurements: Measurement[]; calendarDays: CalendarDay[]; todayKey: string }) {
  const weightsOnly = measurements.filter((m) => m.weight_kg !== null);
  const latestWeight = weightsOnly[weightsOnly.length - 1]?.weight_kg ?? null;
  const firstWeight = weightsOnly[0]?.weight_kg ?? null;
  const weightDelta =
    latestWeight && firstWeight && weightsOnly.length > 1
      ? +(latestWeight - firstWeight).toFixed(1)
      : null;

  const weightSeries = weightsOnly.map((m) => ({
    date: new Date(m.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" }),
    peso: m.weight_kg,
  }));

  const waistSeries = measurements
    .filter((m) => m.waist_cm !== null)
    .map((m) => ({
      date: new Date(m.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" }),
      cintura: m.waist_cm,
    }));

  // El calendario llega pre-computado desde el server (evita Date.now en cliente)
  const days = calendarDays;
  const totalWorkouts = days.filter((d) => d.hasWorkout).length;

  return (
    <div className="fade-in space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold">Tu progreso</h1>
        <p className="text-ink/60 mt-1">Datos reales. Solo tú los ves.</p>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatCard
          label="Peso actual"
          value={latestWeight ? `${latestWeight}` : "—"}
          unit={latestWeight ? "kg" : ""}
          delta={weightDelta}
        />
        <StatCard
          label="Entrenamientos"
          value={String(totalWorkouts)}
          unit="en 35 días"
        />
        <StatCard
          label="Registros"
          value={String(measurements.length)}
          unit="medidas"
        />
      </motion.div>

      {/* Calendario hábito */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-5 border border-ink/10"
      >
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-serif text-lg font-bold">Calendario de hábito</h2>
          <span className="text-xs text-ink/50">Últimos 35 días</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => (
            <motion.div
              key={d.date}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.005 }}
              className={`aspect-square rounded-md ${d.hasWorkout ? "bg-glow-500" : "bg-ink/5"} ${d.date === todayKey ? "ring-2 ring-glow-700" : ""}`}
              title={`${d.date}${d.hasWorkout ? " · entrené" : ""}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-ink/50">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-glow-500" /> Entrenaste</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-ink/5" /> Descanso</span>
        </div>
      </motion.div>

      {/* Chart de peso */}
      {weightSeries.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-5 border border-ink/10"
        >
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="font-serif text-lg font-bold">Peso</h2>
            {weightDelta !== null && (
              <span className={`text-xs font-bold ${weightDelta < 0 ? "text-emerald-600" : weightDelta > 0 ? "text-rose-500" : "text-ink/50"}`}>
                {weightDelta > 0 ? "+" : ""}{weightDelta} kg total
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightSeries} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #FFD1BD", fontSize: 12 }}
                labelStyle={{ color: "#888" }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#F26A47"
                strokeWidth={3}
                dot={{ fill: "#F26A47", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Chart de cintura */}
      {waistSeries.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-5 border border-ink/10"
        >
          <h2 className="font-serif text-lg font-bold mb-3">Cintura</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={waistSeries} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #FFD1BD", fontSize: 12 }} />
              <Line type="monotone" dataKey="cintura" stroke="#D74E2D" strokeWidth={3} dot={{ fill: "#D74E2D", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Add new measurement */}
      <AddMeasurement />

      {/* Recent list */}
      {measurements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-serif text-lg font-bold mb-3">Historial reciente</h2>
          <ul className="space-y-2">
            {measurements.slice(-10).reverse().map((m) => (
              <li key={m.id} className="bg-white rounded-xl p-4 border border-ink/10 flex justify-between text-sm">
                <span className="text-ink/60">
                  {new Date(m.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="font-semibold text-right">
                  {m.weight_kg ? `${m.weight_kg} kg` : ""}
                  {m.waist_cm ? ` · ${m.waist_cm} cm cintura` : ""}
                  {m.hip_cm ? ` · ${m.hip_cm} cm cadera` : ""}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Empty state */}
      {measurements.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-glow-50 border border-glow-200 rounded-3xl p-8 text-center"
        >
          <div className="text-5xl mb-3">📈</div>
          <h3 className="font-serif text-xl font-bold mb-2">Aún no tienes registros</h3>
          <p className="text-ink/60 text-sm">Agrega tu primera medida para empezar a ver tu progreso.</p>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  label, value, unit, delta,
}: { label: string; value: string; unit: string; delta?: number | null }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-ink/10">
      <div className="text-[10px] uppercase tracking-widest font-bold text-ink/50">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <div className="font-serif text-2xl font-black">{value}</div>
        {unit && <div className="text-xs text-ink/50">{unit}</div>}
      </div>
      {delta !== null && delta !== undefined && (
        <div className={`text-xs mt-1 font-semibold ${delta < 0 ? "text-emerald-600" : delta > 0 ? "text-rose-500" : "text-ink/50"}`}>
          {delta > 0 ? "↑" : delta < 0 ? "↓" : ""} {Math.abs(delta)} kg
        </div>
      )}
    </div>
  );
}
