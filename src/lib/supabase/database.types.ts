// Tipos de la base. Regenerar con: pnpm db:types (requiere SUPABASE_PROJECT_ID y login en la CLI).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: { created_at: string; nombre: string; user_id: string };
        Insert: { created_at?: string; nombre?: string; user_id: string };
        Update: { created_at?: string; nombre?: string; user_id?: string };
        Relationships: [];
      };
      categorias: {
        Row: { activa: boolean; created_at: string; id: string; nombre: string; orden: number; slug: string };
        Insert: { activa?: boolean; created_at?: string; id?: string; nombre: string; orden?: number; slug: string };
        Update: { activa?: boolean; created_at?: string; id?: string; nombre?: string; orden?: number; slug?: string };
        Relationships: [];
      };
      configuracion: {
        Row: {
          banner: Json;
          envio_gratis_desde: number | null;
          envio_nacional_costo: number | null;
          envio_nacional_modo: Database["public"]["Enums"]["envio_nacional_modo"];
          id: number;
          politica_cambios: string;
          transferencia: Json;
          updated_at: string;
          whatsapp: string;
        };
        Insert: {
          banner?: Json;
          envio_gratis_desde?: number | null;
          envio_nacional_costo?: number | null;
          envio_nacional_modo?: Database["public"]["Enums"]["envio_nacional_modo"];
          id?: number;
          politica_cambios?: string;
          transferencia?: Json;
          updated_at?: string;
          whatsapp?: string;
        };
        Update: {
          banner?: Json;
          envio_gratis_desde?: number | null;
          envio_nacional_costo?: number | null;
          envio_nacional_modo?: Database["public"]["Enums"]["envio_nacional_modo"];
          id?: number;
          politica_cambios?: string;
          transferencia?: Json;
          updated_at?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      pedido_eventos: {
        Row: {
          autor_id: string | null;
          created_at: string;
          estado: Database["public"]["Enums"]["estado_pedido"];
          id: string;
          nota: string | null;
          pedido_id: string;
        };
        Insert: {
          autor_id?: string | null;
          created_at?: string;
          estado: Database["public"]["Enums"]["estado_pedido"];
          id?: string;
          nota?: string | null;
          pedido_id: string;
        };
        Update: {
          autor_id?: string | null;
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_pedido"];
          id?: string;
          nota?: string | null;
          pedido_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pedido_eventos_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedido_items: {
        Row: {
          cantidad: number;
          color: string;
          foto_path: string | null;
          id: string;
          nombre: string;
          pedido_id: string;
          precio_unitario: number;
          producto_id: string | null;
          talle: string;
          variante_id: string | null;
        };
        Insert: {
          cantidad: number;
          color: string;
          foto_path?: string | null;
          id?: string;
          nombre: string;
          pedido_id: string;
          precio_unitario: number;
          producto_id?: string | null;
          talle: string;
          variante_id?: string | null;
        };
        Update: {
          cantidad?: number;
          color?: string;
          foto_path?: string | null;
          id?: string;
          nombre?: string;
          pedido_id?: string;
          precio_unitario?: number;
          producto_id?: string | null;
          talle?: string;
          variante_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedido_items_variante_id_fkey";
            columns: ["variante_id"];
            isOneToOne: false;
            referencedRelation: "variantes";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos: {
        Row: {
          cliente_email: string;
          cliente_nombre: string;
          cliente_telefono: string;
          costo_envio: number;
          created_at: string;
          direccion: Json | null;
          estado: Database["public"]["Enums"]["estado_pedido"];
          id: string;
          metodo_entrega: Database["public"]["Enums"]["metodo_entrega"];
          metodo_pago: Database["public"]["Enums"]["metodo_pago"];
          mp_payment_id: string | null;
          mp_preference_id: string | null;
          numero: number;
          revision: string | null;
          seguimiento: string | null;
          stock_descontado: boolean;
          subtotal: number;
          token: string;
          total: number;
          updated_at: string;
          zona_envio: string | null;
        };
        Insert: {
          cliente_email: string;
          cliente_nombre: string;
          cliente_telefono: string;
          costo_envio?: number;
          created_at?: string;
          direccion?: Json | null;
          estado?: Database["public"]["Enums"]["estado_pedido"];
          id?: string;
          metodo_entrega: Database["public"]["Enums"]["metodo_entrega"];
          metodo_pago: Database["public"]["Enums"]["metodo_pago"];
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          revision?: string | null;
          seguimiento?: string | null;
          stock_descontado?: boolean;
          subtotal: number;
          token?: string;
          total: number;
          updated_at?: string;
          zona_envio?: string | null;
        };
        Update: {
          cliente_email?: string;
          cliente_nombre?: string;
          cliente_telefono?: string;
          costo_envio?: number;
          created_at?: string;
          direccion?: Json | null;
          estado?: Database["public"]["Enums"]["estado_pedido"];
          id?: string;
          metodo_entrega?: Database["public"]["Enums"]["metodo_entrega"];
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"];
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          revision?: string | null;
          seguimiento?: string | null;
          stock_descontado?: boolean;
          subtotal?: number;
          token?: string;
          total?: number;
          updated_at?: string;
          zona_envio?: string | null;
        };
        Relationships: [];
      };
      producto_fotos: {
        Row: { alt: string; created_at: string; id: string; orden: number; path: string; producto_id: string };
        Insert: { alt?: string; created_at?: string; id?: string; orden?: number; path: string; producto_id: string };
        Update: { alt?: string; created_at?: string; id?: string; orden?: number; path?: string; producto_id?: string };
        Relationships: [
          {
            foreignKeyName: "producto_fotos_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      productos: {
        Row: {
          activo: boolean;
          busqueda: string | null;
          categoria_id: string;
          created_at: string;
          descripcion: string;
          destacado: boolean;
          id: string;
          nombre: string;
          precio: number;
          precio_oferta: number | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          activo?: boolean;
          categoria_id: string;
          created_at?: string;
          descripcion?: string;
          destacado?: boolean;
          id?: string;
          nombre: string;
          precio: number;
          precio_oferta?: number | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          activo?: boolean;
          categoria_id?: string;
          created_at?: string;
          descripcion?: string;
          destacado?: boolean;
          id?: string;
          nombre?: string;
          precio?: number;
          precio_oferta?: number | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
      variantes: {
        Row: { color: string; id: string; producto_id: string; stock: number; talle: string };
        Insert: { color: string; id?: string; producto_id: string; stock?: number; talle: string };
        Update: { color?: string; id?: string; producto_id?: string; stock?: number; talle?: string };
        Relationships: [
          {
            foreignKeyName: "variantes_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      zonas_envio: {
        Row: { activa: boolean; costo: number; id: string; localidades: string[]; nombre: string; orden: number };
        Insert: { activa?: boolean; costo: number; id?: string; localidades?: string[]; nombre: string; orden?: number };
        Update: { activa?: boolean; costo?: number; id?: string; localidades?: string[]; nombre?: string; orden?: number };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      cancelar_pedido: {
        Args: { p_autor?: string | null; p_nota?: string | null; p_pedido_id: string };
        Returns: string;
      };
      confirmar_pago: {
        Args: { p_autor?: string | null; p_monto?: number | null; p_payment_id?: string | null; p_pedido_id: string };
        Returns: string;
      };
      es_admin: { Args: never; Returns: boolean };
      f_unaccent: { Args: { texto: string }; Returns: string };
      registrar_estado: {
        Args: {
          p_autor?: string | null;
          p_estado: Database["public"]["Enums"]["estado_pedido"];
          p_nota?: string | null;
          p_pedido_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      envio_nacional_modo: "a_cotizar" | "tarifa_fija" | "deshabilitado";
      estado_pedido:
        | "pendiente_pago"
        | "pagado"
        | "preparando"
        | "listo_para_retirar"
        | "enviado"
        | "entregado"
        | "cancelado";
      metodo_entrega: "retiro" | "envio_zona" | "envio_nacional";
      metodo_pago: "mercadopago" | "transferencia" | "whatsapp";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
