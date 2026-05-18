import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavTabs } from "./_components/NavTabs";

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
      <header className="px-5 py-4 flex items-center justify-between border-b border-ink/5 bg-cream/80 backdrop-blur sticky top-0 z-10">
        <Link href="/dashboard" className="font-serif text-xl font-bold">
          Mi<span className="italic text-glow-500">GlowUp</span>
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-ink/60 hover:text-glow-600">
            Salir
          </button>
        </form>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 py-6">
        {children}
      </main>

      <NavTabs onboarded={profile?.onboarded ?? false} />
    </div>
  );
}
