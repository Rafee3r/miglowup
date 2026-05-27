import { notFound } from "next/navigation";
import { getRoutine } from "@/lib/routines";
import { WorkoutPlayer } from "./WorkoutPlayer";

export default async function RoutineDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const routine = getRoutine(slug);
  if (!routine) notFound();
  return <WorkoutPlayer routine={routine} />;
}
