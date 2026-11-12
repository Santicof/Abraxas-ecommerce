"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/util";

export async function salirAccion() {
  if (supabaseConfigurado()) {
    const db = await createClient();
    await db.auth.signOut();
  }
  redirect("/admin/login");
}
