import { getFamilyContext } from "@/lib/session";
import { signOut } from "@/app/login/actions";
import { BottomNav, Sidebar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Verifica sesión y familia; redirige si hace falta
  await getFamilyContext();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              🏡
            </span>
            <span className="text-sm font-bold">Financia Casera</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-zinc-700">Tu hogar, tus números 💚</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              Salir
            </button>
          </form>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
