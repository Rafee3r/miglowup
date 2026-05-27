import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanClient } from "./PlanClient";

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("first_name, subscription_status, subscription_expires_at, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // Determinar estado actual desde subscriptions o fallback a profile
  const planRaw = sub?.plan ?? "MONTHLY";
  const status = sub?.status ?? profile?.subscription_status ?? "trialing";
  const trialEndsAt = sub?.trial_ends_at ?? null;
  const nextBillingAt = sub?.next_billing_at ?? null;
  const amount = sub?.amount ?? (planRaw === "ANNUAL" ? 89990 : 12990);

  return (
    <PlanClient
      firstName={profile?.first_name ?? "fundadora"}
      plan={planRaw}
      status={status}
      trialEndsAt={trialEndsAt}
      nextBillingAt={nextBillingAt}
      amount={amount}
    />
  );
}
