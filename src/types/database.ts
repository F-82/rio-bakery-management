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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          name: string
          timezone: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name: string
          timezone?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string
          id: string
          name: string
          scope: Database["public"]["Enums"]["category_scope"]
          sort_order: number
        }
        Insert: {
          business_id: string
          id?: string
          name: string
          scope: Database["public"]["Enums"]["category_scope"]
          sort_order?: number
        }
        Update: {
          business_id?: string
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["category_scope"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      counters: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["counter_kind"]
          name: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["counter_kind"]
          name: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["counter_kind"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_counters: {
        Row: {
          business_id: string
          day: string
          last_seq: number
        }
        Insert: {
          business_id: string
          day: string
          last_seq?: number
        }
        Update: {
          business_id?: string
          day?: string
          last_seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string
          created_by: string | null
          date: string
          id: string
          is_tax_deductible: boolean
          note: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          business_id: string
          category: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          is_tax_deductible?: boolean
          note?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          is_tax_deductible?: boolean
          note?: string | null
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          active: boolean
          barcode: string | null
          base_unit: string
          business_id: string
          category_id: string | null
          created_at: string
          id: string
          low_stock_threshold: number
          name: string
          qty_on_hand: number
          stock_type: Database["public"]["Enums"]["stock_type"]
          unit_cost: number
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          base_unit: string
          business_id: string
          category_id?: string | null
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name: string
          qty_on_hand?: number
          stock_type: Database["public"]["Enums"]["stock_type"]
          unit_cost?: number
        }
        Update: {
          active?: boolean
          barcode?: string | null
          base_unit?: string
          business_id?: string
          category_id?: string | null
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          qty_on_hand?: number
          stock_type?: Database["public"]["Enums"]["stock_type"]
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_business_id_category_id_fkey"
            columns: ["business_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "inventory_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean
          business_id: string
          category_id: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          requires_kitchen_prep: boolean
          sort_order: number
          tax_category: Database["public"]["Enums"]["tax_category"]
        }
        Insert: {
          available?: boolean
          business_id: string
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price: number
          requires_kitchen_prep?: boolean
          sort_order?: number
          tax_category?: Database["public"]["Enums"]["tax_category"]
        }
        Update: {
          available?: boolean
          business_id?: string
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          requires_kitchen_prep?: boolean
          sort_order?: number
          tax_category?: Database["public"]["Enums"]["tax_category"]
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_business_id_category_id_fkey"
            columns: ["business_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          menu_item_id: string | null
          name_snapshot: string
          notes: string | null
          order_id: string
          qty: number
          requires_kitchen_prep: boolean
          tax_category: Database["public"]["Enums"]["tax_category"]
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          menu_item_id?: string | null
          name_snapshot: string
          notes?: string | null
          order_id: string
          qty: number
          requires_kitchen_prep: boolean
          tax_category: Database["public"]["Enums"]["tax_category"]
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          menu_item_id?: string | null
          name_snapshot?: string
          notes?: string | null
          order_id?: string
          qty?: number
          requires_kitchen_prep?: boolean
          tax_category?: Database["public"]["Enums"]["tax_category"]
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          completed_at: string | null
          counter_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          daily_seq: number
          discount_amount: number
          discount_reason: string | null
          id: string
          order_day: string
          order_number: string
          payment_method: string | null
          source: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number
          total: number
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          counter_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          daily_seq: number
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          order_day: string
          order_number: string
          payment_method?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          counter_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          daily_seq?: number
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          order_day?: string
          order_number?: string
          payment_method?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_counter_id_fkey"
            columns: ["business_id", "counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          attempts: number
          business_id: string
          created_at: string
          id: string
          last_error: string | null
          order_id: string
          payload: Json
          status: Database["public"]["Enums"]["print_status"]
          target: Database["public"]["Enums"]["print_target"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          business_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          order_id: string
          payload: Json
          status?: Database["public"]["Enums"]["print_status"]
          target: Database["public"]["Enums"]["print_target"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          business_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          order_id?: string
          payload?: Json
          status?: Database["public"]["Enums"]["print_status"]
          target?: Database["public"]["Enums"]["print_target"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          business_id: string
          counter_id: string | null
          created_at: string
          id: string
          language_pref: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          active?: boolean
          business_id: string
          counter_id?: string | null
          created_at?: string
          id: string
          language_pref?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          active?: boolean
          business_id?: string
          counter_id?: string | null
          created_at?: string
          id?: string
          language_pref?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_counter_id_fkey"
            columns: ["business_id", "counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          business_id: string
          id: string
          inventory_item_id: string
          menu_item_id: string
          qty: number
        }
        Insert: {
          business_id: string
          id?: string
          inventory_item_id: string
          menu_item_id: string
          qty: number
        }
        Update: {
          business_id?: string
          id?: string
          inventory_item_id?: string
          menu_item_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_business_id_inventory_item_id_fkey"
            columns: ["business_id", "inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "recipe_items_business_id_menu_item_id_fkey"
            columns: ["business_id", "menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      settings: {
        Row: {
          business_id: string
          is_public: boolean
          key: string
          value: Json
        }
        Insert: {
          business_id: string
          is_public?: boolean
          key: string
          value: Json
        }
        Update: {
          business_id?: string
          is_public?: boolean
          key?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          business_id: string
          created_at: string
          delta: number
          id: string
          inventory_item_id: string
          note: string | null
          reason: Database["public"]["Enums"]["stock_reason"]
          ref_order_id: string | null
          ref_user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          delta: number
          id?: string
          inventory_item_id: string
          note?: string | null
          reason: Database["public"]["Enums"]["stock_reason"]
          ref_order_id?: string | null
          ref_user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          delta?: number
          id?: string
          inventory_item_id?: string
          note?: string | null
          reason?: Database["public"]["Enums"]["stock_reason"]
          ref_order_id?: string | null
          ref_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_business_id_inventory_item_id_fkey"
            columns: ["business_id", "inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "stock_movements_ref_order_id_fkey"
            columns: ["ref_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: { Args: { payload: Json }; Returns: Json }
      current_business_id: { Args: never; Returns: string }
      current_counter_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_owner: { Args: never; Returns: boolean }
      is_owner_or_manager: { Args: never; Returns: boolean }
      void_order: {
        Args: { p_order_id: string; p_reason: string }
        Returns: Json
      }
    }
    Enums: {
      category_scope: "menu" | "inventory"
      counter_kind: "bakery" | "hot_plate"
      order_status: "open" | "completed" | "voided"
      print_status: "queued" | "printing" | "done" | "failed"
      print_target: "customer_receipt" | "kitchen_ticket"
      stock_reason:
        | "order_deduction"
        | "order_void"
        | "purchase"
        | "wastage"
        | "manual_adjustment"
        | "stocktake"
      stock_type: "ingredient" | "finished_good" | "merchandise"
      tax_category: "standard" | "zero_rated" | "exempt"
      user_role: "owner" | "manager" | "staff"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      category_scope: ["menu", "inventory"],
      counter_kind: ["bakery", "hot_plate"],
      order_status: ["open", "completed", "voided"],
      print_status: ["queued", "printing", "done", "failed"],
      print_target: ["customer_receipt", "kitchen_ticket"],
      stock_reason: [
        "order_deduction",
        "order_void",
        "purchase",
        "wastage",
        "manual_adjustment",
        "stocktake",
      ],
      stock_type: ["ingredient", "finished_good", "merchandise"],
      tax_category: ["standard", "zero_rated", "exempt"],
      user_role: ["owner", "manager", "staff"],
    },
  },
} as const
