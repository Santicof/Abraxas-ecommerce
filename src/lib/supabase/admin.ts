import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "./database.types";

/** Cliente con service role: saltea RLS. Solo para tareas del servidor (pedidos, webhooks). */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
