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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          country_code: string | null
          created_at: string
          id: string
          input_data: Json | null
          llm_model_used: string | null
          processing_time_ms: number | null
          project_id: string
          results: Json | null
        }
        Insert: {
          analysis_type?: string
          confidence_score?: number | null
          country_code?: string | null
          created_at?: string
          id?: string
          input_data?: Json | null
          llm_model_used?: string | null
          processing_time_ms?: number | null
          project_id: string
          results?: Json | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          country_code?: string | null
          created_at?: string
          id?: string
          input_data?: Json | null
          llm_model_used?: string | null
          processing_time_ms?: number | null
          project_id?: string
          results?: Json | null
        }
        Relationships: []
      }
      attack_patterns: {
        Row: {
          action_type: string
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          pattern_type: string
          threshold_config: Json
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          pattern_type: string
          threshold_config: Json
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          pattern_type?: string
          threshold_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          economic_data: Json | null
          id: string
          name: string
          region: string | null
          regulatory_info: Json | null
          sub_region: string | null
          updated_at: string
          wine_market_data: Json | null
        }
        Insert: {
          code: string
          created_at?: string
          economic_data?: Json | null
          id?: string
          name: string
          region?: string | null
          regulatory_info?: Json | null
          sub_region?: string | null
          updated_at?: string
          wine_market_data?: Json | null
        }
        Update: {
          code?: string
          created_at?: string
          economic_data?: Json | null
          id?: string
          name?: string
          region?: string | null
          regulatory_info?: Json | null
          sub_region?: string | null
          updated_at?: string
          wine_market_data?: Json | null
        }
        Relationships: []
      }
      geographic_security_rules: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          metadata: Json | null
          organization_id: string
          priority: number
          rule_type: string
          rule_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          organization_id: string
          priority?: number
          rule_type: string
          rule_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          organization_id?: string
          priority?: number
          rule_type?: string
          rule_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          annual_volume: number | null
          business_focus: string[] | null
          company_name: string
          contact_person: string | null
          contact_status: string | null
          country_code: string
          created_at: string
          current_suppliers: string[] | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          price_range: string | null
          project_id: string
          qualification_score: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          annual_volume?: number | null
          business_focus?: string[] | null
          company_name: string
          contact_person?: string | null
          contact_status?: string | null
          country_code: string
          created_at?: string
          current_suppliers?: string[] | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          price_range?: string | null
          project_id: string
          qualification_score?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          annual_volume?: number | null
          business_focus?: string[] | null
          company_name?: string
          contact_person?: string | null
          contact_status?: string | null
          country_code?: string
          created_at?: string
          current_suppliers?: string[] | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          price_range?: string | null
          project_id?: string
          qualification_score?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      llm_runs: {
        Row: {
          completion_tokens: number | null
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          model_name: string
          organization_id: string
          output_data: Json | null
          project_id: string | null
          prompt_tokens: number | null
          total_tokens: number | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          model_name: string
          organization_id: string
          output_data?: Json | null
          project_id?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
        }
        Update: {
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          model_name?: string
          organization_id?: string
          output_data?: Json | null
          project_id?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_studies: {
        Row: {
          analysis_id: string
          competitor_analysis: Json | null
          consumer_preferences: Json | null
          created_at: string
          distribution_channels: Json | null
          growth_trends: Json | null
          id: string
          market_size: Json | null
          price_analysis: Json | null
        }
        Insert: {
          analysis_id: string
          competitor_analysis?: Json | null
          consumer_preferences?: Json | null
          created_at?: string
          distribution_channels?: Json | null
          growth_trends?: Json | null
          id?: string
          market_size?: Json | null
          price_analysis?: Json | null
        }
        Update: {
          analysis_id?: string
          competitor_analysis?: Json | null
          consumer_preferences?: Json | null
          created_at?: string
          distribution_channels?: Json | null
          growth_trends?: Json | null
          id?: string
          market_size?: Json | null
          price_analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "market_studies_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_intelligence: {
        Row: {
          analysis_id: string
          created_at: string
          cultural_considerations: Json | null
          id: string
          marketing_channels: Json | null
          positioning_recommendations: Json | null
          pricing_strategy: Json | null
          seasonal_trends: Json | null
          success_factors: Json | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          cultural_considerations?: Json | null
          id?: string
          marketing_channels?: Json | null
          positioning_recommendations?: Json | null
          pricing_strategy?: Json | null
          seasonal_trends?: Json | null
          success_factors?: Json | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          cultural_considerations?: Json | null
          id?: string
          marketing_channels?: Json | null
          positioning_recommendations?: Json | null
          pricing_strategy?: Json | null
          seasonal_trends?: Json | null
          success_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_intelligence_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      product_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attachments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specs: {
        Row: {
          created_at: string
          filename: string
          id: number
          organization_id: string
          providers: Json | null
          quality_score: number | null
          spec_json: Json
        }
        Insert: {
          created_at?: string
          filename: string
          id?: number
          organization_id: string
          providers?: Json | null
          quality_score?: number | null
          spec_json: Json
        }
        Update: {
          created_at?: string
          filename?: string
          id?: number
          organization_id?: string
          providers?: Json | null
          quality_score?: number | null
          spec_json?: Json
        }
        Relationships: []
      }
      product_versions: {
        Row: {
          created_at: string
          extracted_data: Json | null
          id: string
          product_id: string
          source_pdf_url: string | null
          validated_by: string | null
          validation_status: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          extracted_data?: Json | null
          id?: string
          product_id: string
          source_pdf_url?: string | null
          validated_by?: string | null
          validation_status?: string | null
          version_number?: number
        }
        Update: {
          created_at?: string
          extracted_data?: Json | null
          id?: string
          product_id?: string
          source_pdf_url?: string | null
          validated_by?: string | null
          validation_status?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          alcohol_percentage: number | null
          appellation: string | null
          awards: string[] | null
          category: Database["public"]["Enums"]["product_category"]
          certifications: string[] | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          tasting_notes: string | null
          technical_specs: Json | null
          updated_at: string
          vintage: number | null
          volume_ml: number | null
        }
        Insert: {
          alcohol_percentage?: number | null
          appellation?: string | null
          awards?: string[] | null
          category: Database["public"]["Enums"]["product_category"]
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          tasting_notes?: string | null
          technical_specs?: Json | null
          updated_at?: string
          vintage?: number | null
          volume_ml?: number | null
        }
        Update: {
          alcohol_percentage?: number | null
          appellation?: string | null
          awards?: string[] | null
          category?: Database["public"]["Enums"]["product_category"]
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          tasting_notes?: string | null
          technical_specs?: Json | null
          updated_at?: string
          vintage?: number | null
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget_range: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          products: string[] | null
          project_type: Database["public"]["Enums"]["project_type"]
          status: Database["public"]["Enums"]["project_status"]
          target_countries: string[] | null
          timeline: string | null
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          products?: string[] | null
          project_type: Database["public"]["Enums"]["project_type"]
          status?: Database["public"]["Enums"]["project_status"]
          target_countries?: string[] | null
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          products?: string[] | null
          project_type?: Database["public"]["Enums"]["project_type"]
          status?: Database["public"]["Enums"]["project_status"]
          target_countries?: string[] | null
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regulatory_analyses: {
        Row: {
          analysis_id: string
          certifications_needed: Json | null
          compliance_checklist: Json | null
          created_at: string
          id: string
          import_requirements: Json | null
          labeling_requirements: Json | null
          restrictions: Json | null
          taxes_duties: Json | null
        }
        Insert: {
          analysis_id: string
          certifications_needed?: Json | null
          compliance_checklist?: Json | null
          created_at?: string
          id?: string
          import_requirements?: Json | null
          labeling_requirements?: Json | null
          restrictions?: Json | null
          taxes_duties?: Json | null
        }
        Update: {
          analysis_id?: string
          certifications_needed?: Json | null
          compliance_checklist?: Json | null
          created_at?: string
          id?: string
          import_requirements?: Json | null
          labeling_requirements?: Json | null
          restrictions?: Json | null
          taxes_duties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_analyses_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          access_token: string | null
          content: Json | null
          created_at: string
          expires_at: string | null
          generated_by: string
          html_content: string | null
          id: string
          pdf_url: string | null
          project_id: string
          report_type: string
          shared_with: string[] | null
          title: string
        }
        Insert: {
          access_token?: string | null
          content?: Json | null
          created_at?: string
          expires_at?: string | null
          generated_by: string
          html_content?: string | null
          id?: string
          pdf_url?: string | null
          project_id: string
          report_type: string
          shared_with?: string[] | null
          title: string
        }
        Update: {
          access_token?: string | null
          content?: Json | null
          created_at?: string
          expires_at?: string | null
          generated_by?: string
          html_content?: string | null
          id?: string
          pdf_url?: string | null
          project_id?: string
          report_type?: string
          shared_with?: string[] | null
          title?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          details: Json
          device_info: Json | null
          id: string
          incident_type: string
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_ip: unknown | null
          status: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          details: Json
          device_info?: Json | null
          id?: string
          incident_type: string
          organization_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source_ip?: unknown | null
          status?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          details?: Json
          device_info?: Json | null
          id?: string
          incident_type?: string
          organization_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_ip?: unknown | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      threat_intelligence: {
        Row: {
          confidence_score: number
          details: Json | null
          expires_at: string | null
          first_seen: string
          id: string
          ip_address: unknown
          last_updated: string
          source: string
          threat_type: string
        }
        Insert: {
          confidence_score: number
          details?: Json | null
          expires_at?: string | null
          first_seen?: string
          id?: string
          ip_address: unknown
          last_updated?: string
          source: string
          threat_type: string
        }
        Update: {
          confidence_score?: number
          details?: Json | null
          expires_at?: string | null
          first_seen?: string
          id?: string
          ip_address?: unknown
          last_updated?: string
          source?: string
          threat_type?: string
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          browser: string | null
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          first_seen: string
          id: string
          is_trusted: boolean
          last_seen: string
          metadata: Json | null
          os_details: string | null
          screen_resolution: string | null
          timezone: string | null
          trust_score: number
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          first_seen?: string
          id?: string
          is_trusted?: boolean
          last_seen?: string
          metadata?: Json | null
          os_details?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          trust_score?: number
          user_id: string
        }
        Update: {
          browser?: string | null
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          first_seen?: string
          id?: string
          is_trusted?: boolean
          last_seen?: string
          metadata?: Json | null
          os_details?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          trust_score?: number
          user_id?: string
        }
        Relationships: []
      }
      user_organization_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_save: boolean
          created_at: string
          data_retention: string
          deletion_expires_at: string | null
          deletion_requested_at: string | null
          deletion_token: string | null
          email_notifications: boolean
          id: string
          language: string
          marketing_emails: boolean
          push_notifications: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save?: boolean
          created_at?: string
          data_retention?: string
          deletion_expires_at?: string | null
          deletion_requested_at?: string | null
          deletion_token?: string | null
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          push_notifications?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save?: boolean
          created_at?: string
          data_retention?: string
          deletion_expires_at?: string | null
          deletion_requested_at?: string | null
          deletion_token?: string | null
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          push_notifications?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          connection_type: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: unknown | null
          is_current: boolean
          is_suspicious: boolean | null
          last_active: string
          location: Json | null
          os_details: string | null
          previous_ips: Json | null
          region: string | null
          risk_score: number | null
          screen_resolution: string | null
          session_token: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          connection_type?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_current?: boolean
          is_suspicious?: boolean | null
          last_active?: string
          location?: Json | null
          os_details?: string | null
          previous_ips?: Json | null
          region?: string | null
          risk_score?: number | null
          screen_resolution?: string | null
          session_token: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          connection_type?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_current?: boolean
          is_suspicious?: boolean | null
          last_active?: string
          location?: Json | null
          os_details?: string | null
          previous_ips?: Json | null
          region?: string | null
          risk_score?: number | null
          screen_resolution?: string | null
          session_token?: string
          timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vectors: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vectors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_security_configuration: {
        Args: Record<PropertyKey, never>
        Returns: {
          recommendation: string
          security_check: string
          status: string
        }[]
      }
      get_user_organizations: {
        Args: { user_uuid?: string }
        Returns: {
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_organization_role: {
        Args: {
          org_id: string
          required_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_sensitive_data_access: {
        Args: {
          action_type?: string
          resource_id?: string
          resource_type: string
        }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_organization_access: {
        Args: {
          org_id: string
          required_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      analysis_type:
        | "market_study"
        | "regulatory_analysis"
        | "lead_generation"
        | "marketing_intelligence"
      app_role: "owner" | "admin" | "member"
      lead_type:
        | "importer"
        | "distributor"
        | "retailer"
        | "restaurant"
        | "hotel"
      product_category: "wine" | "spirits" | "champagne" | "beer"
      project_status: "draft" | "running" | "completed" | "failed"
      project_type:
        | "market_study"
        | "regulatory_analysis"
        | "lead_generation"
        | "marketing_intelligence"
        | "full_analysis"
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
  public: {
    Enums: {
      analysis_type: [
        "market_study",
        "regulatory_analysis",
        "lead_generation",
        "marketing_intelligence",
      ],
      app_role: ["owner", "admin", "member"],
      lead_type: ["importer", "distributor", "retailer", "restaurant", "hotel"],
      product_category: ["wine", "spirits", "champagne", "beer"],
      project_status: ["draft", "running", "completed", "failed"],
      project_type: [
        "market_study",
        "regulatory_analysis",
        "lead_generation",
        "marketing_intelligence",
        "full_analysis",
      ],
    },
  },
} as const
