// Hand-maintained DB types. When the schema grows you can replace these with
// `supabase gen types typescript` output without changing call sites.

export type FeedbackStatus = "pending" | "approved" | "hidden" | "rejected";

export type Relationship =
  | "colleague"
  | "manager"
  | "stakeholder"
  | "client"
  | "mentor"
  | "friend"
  | "other";

export type UserRole = "user" | "admin";

export interface ProfileRow {
  id: string;
  email: string | null;
  username: string | null;
  role: UserRole;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  profile_image_url: string | null;
  public_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackRow {
  id: string;
  profile_user_id: string;
  sentence: string;
  giver_name: string | null;
  giver_role: string | null;
  giver_company: string | null;
  relationship: Relationship | null;
  allow_name_public: boolean;
  status: FeedbackStatus;
  is_public: boolean;
  source: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

// Public-facing feedback shape — private metadata (ip_hash, user_agent) omitted.
export type PublicFeedback = Pick<
  FeedbackRow,
  | "id"
  | "sentence"
  | "giver_name"
  | "giver_role"
  | "giver_company"
  | "relationship"
  | "allow_name_public"
  | "created_at"
>;

export interface FeedbackLinkRow {
  id: string;
  profile_user_id: string;
  token: string;
  label: string | null;
  revoked: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface ProfileViewLinkRow {
  id: string;
  profile_user_id: string;
  token: string;
  label: string | null;
  revoked: boolean;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
}

export interface ProfileSummaryRow {
  id: string;
  profile_user_id: string;
  summary: string | null;
  top_traits: TopTrait[] | null;
  generated_at: string | null;
  created_at: string;
}

export interface TopTrait {
  trait: string;
  weight: number;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      feedback: {
        Row: FeedbackRow;
        Insert: Partial<FeedbackRow> & {
          profile_user_id: string;
          sentence: string;
        };
        Update: Partial<FeedbackRow>;
        Relationships: [];
      };
      feedback_tags: {
        Row: {
          id: string;
          feedback_id: string;
          tag: string;
          created_at: string;
        };
        Insert: { feedback_id: string; tag: string };
        Update: { tag?: string };
        Relationships: [];
      };
      profile_summaries: {
        Row: ProfileSummaryRow;
        Insert: Partial<ProfileSummaryRow> & { profile_user_id: string };
        Update: Partial<ProfileSummaryRow>;
        Relationships: [];
      };
      feedback_links: {
        Row: FeedbackLinkRow;
        Insert: Partial<FeedbackLinkRow> & {
          profile_user_id: string;
          token: string;
        };
        Update: Partial<FeedbackLinkRow>;
        Relationships: [];
      };
      profile_view_links: {
        Row: ProfileViewLinkRow;
        Insert: Partial<ProfileViewLinkRow> & {
          profile_user_id: string;
          token: string;
        };
        Update: Partial<ProfileViewLinkRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
