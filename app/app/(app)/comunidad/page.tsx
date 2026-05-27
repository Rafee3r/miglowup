import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ComunidadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");

  // Link del grupo WhatsApp — hardcodeado para poder cambiarlo solo editando este archivo
  const invite = "https://chat.whatsapp.com/CKmozDPbrtYKJN7GFOmFXn?mode=gi_t";

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Comunidad</h1>
        <p className="text-ink/60 mt-1">No estás sola en esto. Acá nos motivamos juntas.</p>
      </div>

      <a
        href={invite}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#25D366] text-white rounded-3xl p-6 hover:bg-[#1da851] transition"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.575-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg">Grupo de WhatsApp</div>
            <div className="text-sm opacity-90">Únete a tu cohorte. Toca para entrar →</div>
          </div>
        </div>
      </a>

      <section className="bg-white rounded-2xl p-5 border border-ink/10">
        <h2 className="font-serif text-xl font-bold mb-3">Cómo funciona la comunidad</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="text-glow-500 font-bold">1.</span>
            <span>Marciana modera el grupo y te orienta cuando lo necesites.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-glow-500 font-bold">2.</span>
            <span>Compartimos avances, fotos, recetas y dudas — todas juntas.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-glow-500 font-bold">3.</span>
            <span>Reto mensual con apoyo grupal. Si fallas un día, te levantamos.</span>
          </li>
        </ul>
      </section>

      <section className="bg-glow-50 border border-glow-200 rounded-2xl p-5 text-sm">
        <p className="font-semibold mb-1">📜 Reglas básicas</p>
        <p className="text-ink/70">Respeto siempre. No spam. No vender cosas. Si lo dudas, pregúntale a Marciana 💛</p>
      </section>
    </div>
  );
}
