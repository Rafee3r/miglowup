/**
 * Eventos comunitarios — tipos + queries comunes.
 * Tabla `events` + `event_participants` (ver supabase/migration-events.sql).
 */

import { createClient } from "@/lib/supabase/server";

export type Event = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  emoji: string;
  color_from: string;
  color_to: string;
  start_date: string;
  end_date: string;
  goal_workouts: number;
  cover_image: string | null;
  is_featured: boolean;
};

export type LeaderboardRow = {
  user_id: string;
  first_name: string | null;
  workouts: number;
  last_workout: string | null;
  rank: number;
  isMe: boolean;
};

export async function listActiveEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("events")
    .select("*")
    .lte("start_date", today)
    .gte("end_date", today)
    .order("is_featured", { ascending: false })
    .order("start_date", { ascending: true });
  return data ?? [];
}

export async function listAllEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });
  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export async function isUserInEvent(eventId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Devuelve el leaderboard del evento. Para cada participante, cuenta cuántas
 * rutinas completó entre event.start_date y event.end_date.
 *
 * Si hay menos de minRows participantes, agrega "fantasmas" demo para que
 * la sección no se vea vacía (estos no son usuarios reales, solo motivación).
 */
export async function getLeaderboard(event: Event, currentUserId: string, minRows = 5): Promise<LeaderboardRow[]> {
  const supabase = await createClient();

  // 1. Lista de participantes reales
  const { data: participants } = await supabase
    .from("event_participants")
    .select("user_id, joined_at")
    .eq("event_id", event.id);

  const userIds = (participants ?? []).map((p) => p.user_id);
  if (userIds.length === 0) {
    return fillWithGhosts([], currentUserId, minRows);
  }

  // 2. Profiles de los participantes
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, is_public")
    .in("id", userIds);

  // 3. Rutinas completadas en el rango del evento, por user
  const startISO = new Date(event.start_date).toISOString();
  const endISO = new Date(new Date(event.end_date).getTime() + 86400000).toISOString();
  const { data: logs } = await supabase
    .from("routine_logs")
    .select("user_id, completed_at")
    .in("user_id", userIds)
    .gte("completed_at", startISO)
    .lte("completed_at", endISO);

  const countByUser: Record<string, number> = {};
  const lastByUser: Record<string, string> = {};
  (logs ?? []).forEach((l) => {
    countByUser[l.user_id] = (countByUser[l.user_id] ?? 0) + 1;
    if (!lastByUser[l.user_id] || l.completed_at > lastByUser[l.user_id]) {
      lastByUser[l.user_id] = l.completed_at;
    }
  });

  // 4. Build rows + ordenar
  const rows: LeaderboardRow[] = (profiles ?? []).map((p) => ({
    user_id: p.id,
    first_name: (p.is_public || p.id === currentUserId) ? p.first_name : null,
    workouts: countByUser[p.id] ?? 0,
    last_workout: lastByUser[p.id] ?? null,
    rank: 0,
    isMe: p.id === currentUserId,
  }));

  rows.sort((a, b) => {
    if (b.workouts !== a.workouts) return b.workouts - a.workouts;
    // Desempate: el más reciente arriba
    return (b.last_workout ?? "").localeCompare(a.last_workout ?? "");
  });
  rows.forEach((r, i) => { r.rank = i + 1; });

  return fillWithGhosts(rows, currentUserId, minRows);
}

/**
 * Si hay menos de `minRows` participantes, agrega filas demo para que el
 * leaderboard se vea poblado. Estas filas NO son usuarios reales.
 */
function fillWithGhosts(real: LeaderboardRow[], currentUserId: string, minRows: number): LeaderboardRow[] {
  const ghosts: { name: string; workouts: number }[] = [
    { name: "Marciana ⭐", workouts: 18 },
    { name: "Cami", workouts: 14 },
    { name: "Pau", workouts: 11 },
    { name: "Javi", workouts: 9 },
    { name: "Antonia", workouts: 7 },
    { name: "Vale", workouts: 5 },
  ];
  const out = [...real];
  let i = 0;
  while (out.length < minRows && i < ghosts.length) {
    out.push({
      user_id: `ghost_${i}`,
      first_name: ghosts[i].name,
      workouts: ghosts[i].workouts,
      last_workout: null,
      rank: 0,
      isMe: false,
    });
    i++;
  }
  out.sort((a, b) => b.workouts - a.workouts);
  out.forEach((r, idx) => { r.rank = idx + 1; });
  return out;
}

export function daysIntoEvent(event: Event): { dayN: number; totalDays: number; isActive: boolean } {
  const today = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const dayN = Math.max(0, Math.min(totalDays, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1));
  const isActive = today >= start && today <= end;
  return { dayN, totalDays, isActive };
}
