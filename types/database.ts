/**
 * Database type definitions for BidTranslate
 * These types match the Supabase schema defined in migrations
 */

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled";
export type PlanType = "starter" | "professional" | "unlimited" | "lifetime";
export type AuctionStatus = "draft" | "pending_start" | "in_progress" | "completed" | "failed" | "cancelled";
export type BidDecision = "accept" | "decline" | "timeout";

export interface Database {
  public: {
    Tables: {
      bid_translate_agencies: {
        Row: {
          id: string;
          owner_id: string;
          company_name: string;
          nip: string;
          address: string;
          logo_url: string | null;
          subscription_status: SubscriptionStatus;
          plan_type: PlanType;
          trial_ends_at: string;
          max_auctions_per_month: number;
          max_translators: number;
          auctions_used_this_month: number;
          billing_anniversary: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          company_name: string;
          nip: string;
          address: string;
          logo_url?: string | null;
          subscription_status?: SubscriptionStatus;
          plan_type?: PlanType;
          trial_ends_at?: string;
          max_auctions_per_month?: number;
          max_translators?: number;
          auctions_used_this_month?: number;
          billing_anniversary?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          company_name?: string;
          nip?: string;
          address?: string;
          logo_url?: string | null;
          subscription_status?: SubscriptionStatus;
          plan_type?: PlanType;
          trial_ends_at?: string;
          max_auctions_per_month?: number;
          max_translators?: number;
          auctions_used_this_month?: number;
          billing_anniversary?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bid_translate_translators: {
        Row: {
          id: string;
          agency_id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          language_pairs: { source: string; target: string }[];
          specializations: string[];
          is_sworn: boolean;
          gdpr_consent: boolean;
          gdpr_consent_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          language_pairs: { source: string; target: string }[];
          specializations?: string[];
          is_sworn?: boolean;
          gdpr_consent?: boolean;
          gdpr_consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          language_pairs?: { source: string; target: string }[];
          specializations?: string[];
          is_sworn?: boolean;
          gdpr_consent?: boolean;
          gdpr_consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bid_translate_auctions: {
        Row: {
          id: string;
          agency_id: string;
          language_pair: { source: string; target: string };
          specialization: string | null;
          is_sworn: boolean;
          word_count: number;
          deadline: string;
          starting_price: number;
          description: string;
          file_url: string | null;
          num_participants: number;
          status: AuctionStatus;
          current_round: number;
          current_price: number;
          winner_id: string | null;
          final_price: number | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          language_pair: { source: string; target: string };
          specialization?: string | null;
          is_sworn?: boolean;
          word_count: number;
          deadline: string;
          starting_price: number;
          description: string;
          file_url?: string | null;
          num_participants: number;
          status?: AuctionStatus;
          current_round?: number;
          current_price?: number;
          winner_id?: string | null;
          final_price?: number | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          language_pair?: { source: string; target: string };
          specialization?: string | null;
          is_sworn?: boolean;
          word_count?: number;
          deadline?: string;
          starting_price?: number;
          description?: string;
          file_url?: string | null;
          num_participants?: number;
          status?: AuctionStatus;
          current_round?: number;
          current_price?: number;
          winner_id?: string | null;
          final_price?: number | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      bid_translate_auction_participants: {
        Row: {
          id: string;
          auction_id: string;
          translator_id: string;
          position: number;
          magic_link_token: string;
          confirmed_at: string | null;
          eliminated_at: string | null;
          eliminated_round: number | null;
          is_winner: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          translator_id: string;
          position: number;
          magic_link_token: string;
          confirmed_at?: string | null;
          eliminated_at?: string | null;
          eliminated_round?: number | null;
          is_winner?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auction_id?: string;
          translator_id?: string;
          position?: number;
          magic_link_token?: string;
          confirmed_at?: string | null;
          eliminated_at?: string | null;
          eliminated_round?: number | null;
          is_winner?: boolean;
          created_at?: string;
        };
      };
      bid_translate_auction_bids: {
        Row: {
          id: string;
          auction_id: string;
          participant_id: string;
          round_number: number;
          offered_price: number;
          decision: BidDecision;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          participant_id: string;
          round_number: number;
          offered_price: number;
          decision: BidDecision;
          decided_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          auction_id?: string;
          participant_id?: string;
          round_number?: number;
          offered_price?: number;
          decision?: BidDecision;
          decided_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_status: SubscriptionStatus;
      plan_type: PlanType;
      auction_status: AuctionStatus;
      bid_decision: BidDecision;
    };
  };
}
