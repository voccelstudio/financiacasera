import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO } from "@/lib/demo/store";

export default async function Home() {
  // 🧪 Modo demo: entramos directo a la app, sin login
  if (DEMO) redirect("/app");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/app" : "/login");
}
