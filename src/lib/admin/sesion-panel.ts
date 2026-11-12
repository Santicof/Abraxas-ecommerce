import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Abre una sesión real de Supabase para la cuenta de PANEL_EMAIL sin conocer su contraseña. */
export async function abrirSesionPanel(): Promise<boolean> {
  const email = process.env.PANEL_EMAIL;
  if (!email) return false;

  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) {
    console.error("[panel] generateLink", error?.message);
    return false;
  }
  const db = await createClient();
  const { error: e2 } = await db.auth.verifyOtp({ type: "email", token_hash: data.properties.hashed_token });
  if (e2) {
    console.error("[panel] verifyOtp", e2.message);
    return false;
  }
  return true;
}
