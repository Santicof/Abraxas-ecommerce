import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormularioLogin } from "@/components/admin/formulario-login";
import { supabaseConfigurado } from "@/lib/supabase/util";

async function Contenido({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  if (!supabaseConfigurado()) redirect("/admin");
  const sp = await searchParams;
  return <FormularioLogin errorInicial={sp.error === "permiso" ? "No tenés permiso para acceder. Pedile acceso a la dueña." : undefined} />;
}

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <div className="flex min-h-dvh items-center bg-arena px-4 py-10">
      <Suspense>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
