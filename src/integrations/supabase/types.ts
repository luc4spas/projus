export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categorias_financeiras: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          criado_por: string | null
          documento: string
          email: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          telefone: string | null
          telefones: Json
          tipo: string
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          criado_por?: string | null
          documento: string
          email?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          telefone?: string | null
          telefones?: Json
          tipo?: string
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          criado_por?: string | null
          documento?: string
          email?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          telefone?: string | null
          telefones?: Json
          tipo?: string
          uf?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          id: boolean
          nome_sistema: string
          subtitulo: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          nome_sistema?: string
          subtitulo?: string
          updated_at?: string
        }
        Update: {
          id?: boolean
          nome_sistema?: string
          subtitulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      pastas_digitais: {
        Row: {
          arquivo_url: string
          data_upload: string
          id: string
          nome_documento: string
          processo_id: string
          tamanho_bytes: number | null
          uploader_id: string | null
        }
        Insert: {
          arquivo_url: string
          data_upload?: string
          id?: string
          nome_documento: string
          processo_id: string
          tamanho_bytes?: number | null
          uploader_id?: string | null
        }
        Update: {
          arquivo_url?: string
          data_upload?: string
          id?: string
          nome_documento?: string
          processo_id?: string
          tamanho_bytes?: number | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pastas_digitais_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      prazos_e_tarefas: {
        Row: {
          created_at: string
          criado_por: string | null
          data_fatal: string
          descricao: string | null
          id: string
          processo_id: string | null
          responsavel_id: string | null
          status: string
          titulo: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data_fatal: string
          descricao?: string | null
          id?: string
          processo_id?: string | null
          responsavel_id?: string | null
          status?: string
          titulo: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data_fatal?: string
          descricao?: string | null
          id?: string
          processo_id?: string | null
          responsavel_id?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prazos_e_tarefas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processo_movimentacoes: {
        Row: {
          autor_id: string | null
          created_at: string
          data_movimentacao: string
          descricao: string
          id: string
          processo_id: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          data_movimentacao?: string
          descricao: string
          id?: string
          processo_id: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          data_movimentacao?: string
          descricao?: string
          id?: string
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processo_movimentacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          advogado_responsavel: string | null
          andamento: string | null
          cliente_id: string | null
          comarca: string | null
          created_at: string
          descricao_acao: string | null
          fase_atual: string
          id: string
          numero_cnj: string | null
          sistema: string | null
          titulo: string | null
          tribunal: string | null
          valor_causa: number | null
          vara: string | null
        }
        Insert: {
          advogado_responsavel?: string | null
          andamento?: string | null
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string
          descricao_acao?: string | null
          fase_atual?: string
          id?: string
          numero_cnj?: string | null
          sistema?: string | null
          titulo?: string | null
          tribunal?: string | null
          valor_causa?: number | null
          vara?: string | null
        }
        Update: {
          advogado_responsavel?: string | null
          andamento?: string | null
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string
          descricao_acao?: string | null
          fase_atual?: string
          id?: string
          numero_cnj?: string | null
          sistema?: string | null
          titulo?: string | null
          tribunal?: string | null
          valor_causa?: number | null
          vara?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          categoria_id: string
          cliente_id: string | null
          comprovante_url: string | null
          created_at: string
          criado_por: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          id: string
          processo_id: string | null
          status: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria_id: string
          cliente_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          criado_por?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          processo_id?: string | null
          status?: string
          tipo: string
          valor: number
        }
        Update: {
          categoria_id?: string
          cliente_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          criado_por?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          processo_id?: string | null
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_comprovante: {
        Args: { _path: string; _user_id: string }
        Returns: boolean
      }
      can_access_processo: {
        Args: { _processo_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_processo_path: {
        Args: { _folder: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "advogado" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "advogado", "cliente"],
    },
  },
} as const
