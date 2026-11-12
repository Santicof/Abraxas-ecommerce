"use client";

import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { BotonGrande, Campo, claseEntrada } from "@/components/admin/ui";
import { LogoTexto } from "@/components/marca/logo-texto";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { entrarConUsuario } from "@/app/admin/login/acciones";

export function FormularioLogin({ errorInicial }: { errorInicial?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState(errorInicial ?? "");
  const [aviso, setAviso] = useState("");
  const [pendiente, start] = useTransition();

  function entrar() {
    setError("");
    start(async () => {
      if (!email.includes("@")) {
        const r = await entrarConUsuario(email, clave);
        if (r?.error) setError(r.error);
        return;
      }
      const { error: e } = await createClient().auth.signInWithPassword({ email: email.trim(), password: clave });
      if (e) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    });
  }

  function enlace() {
    setError("");
    if (!email.includes("@")) {
      setError("Escribí tu email para mandarte el enlace.");
      return;
    }
    start(async () => {
      await createClient().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
      });
      setAviso("Si el email está habilitado, te llegó un enlace para entrar. Revisá tu correo (y la carpeta de spam).");
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl bg-background p-6 text-lg shadow-sm">
      <div className="text-center">
        <LogoTexto className="text-5xl" />
        <h1 className="mt-3 text-2xl">Entrar al panel</h1>
      </div>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          entrar();
        }}
      >
        <Campo id="email" etiqueta="Usuario o email">
          <input id="email" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" value={email} onChange={(e) => setEmail(e.target.value)} className={claseEntrada()} required />
        </Campo>
        <Campo id="clave" etiqueta="Contraseña">
          <div className="relative">
            <input
              id="clave"
              type={ver ? "text" : "password"}
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className={cn(claseEntrada(), "pr-28")}
              required
            />
            <button
              type="button"
              onClick={() => setVer(!ver)}
              className="absolute top-1/2 right-2 flex min-h-11 -translate-y-1/2 items-center gap-1 rounded-lg px-2 text-base font-bold"
            >
              {ver ? <EyeOff className="size-5" /> : <Eye className="size-5" />} {ver ? "Ocultar" : "Ver"}
            </button>
          </div>
        </Campo>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-bold text-destructive">
            {error}
          </p>
        )}
        {aviso && <p className="rounded-xl bg-accent p-3 font-bold">{aviso}</p>}
        <BotonGrande type="submit" icono={LogIn} cargando={pendiente} textoCargando="Entrando…" ancho>
          Entrar
        </BotonGrande>
      </form>
      <div className="border-t pt-5 text-center">
        <p className="mb-3 text-base text-muted-foreground">¿Te olvidaste la contraseña?</p>
        <BotonGrande variante="secundario" icono={Mail} onClick={enlace} disabled={pendiente} ancho className="px-3 text-base">
          Recibir un enlace por email
        </BotonGrande>
      </div>
    </div>
  );
}
