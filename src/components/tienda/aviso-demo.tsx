import { supabaseConfigurado } from "@/lib/supabase/util";

export function AvisoDemo() {
  if (supabaseConfigurado()) return null;
  return (
    <div className="bg-marca px-4 py-1.5 text-center text-xs font-semibold text-marca-foreground">
      Vista previa: productos de ejemplo con precios inventados. Las compras no se procesan.
    </div>
  );
}
