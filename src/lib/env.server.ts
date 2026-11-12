import "server-only";

function requerida(nombre: string, alternativa?: string): string {
  const valor = process.env[nombre] || (alternativa ? process.env[alternativa] : undefined);
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisá .env.local (ver .env.example).`);
  }
  return valor;
}

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return requerida("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  },
  get mpAccessToken() {
    return requerida("MP_ACCESS_TOKEN");
  },
  get mpWebhookSecret() {
    return requerida("MP_WEBHOOK_SECRET");
  },
};
