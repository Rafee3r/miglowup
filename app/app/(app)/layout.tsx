import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavTabs } from "./_components/NavTabs";
import { Header } from "./_components/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Header />

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 py-6">
        {children}
      </main>

      <NavTabs onboarded={profile?.onboarded ?? false} />
    </div>
  );
}
