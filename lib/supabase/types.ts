export type AgencyCategory = 'sales' | 'lettings' | 'both';

export type Town = {
  id: string;
  slug: string;
  name: string;
  county: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type Agency = {
  id: string;
  google_place_id: string;
  name: string;
  town_id: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: AgencyCategory | null;
  google_profile_url: string | null;
  last_updated: string;
  created_at: string;
};

export type AgencySnapshot = {
  id: string;
  agency_id: string;
  snapshot_date: string;
  average_rating: number | null;
  review_count: number | null;
  recent_reviews_count: number | null;
  recency_score: number | null;
  volume_score: number | null;
  rating_score: number | null;
  composite_score: number | null;
  sales_rank: number | null;
  lettings_rank: number | null;
  created_at: string;
};

export type RefreshLog = {
  id: string;
  town_id: string | null;
  level: 'info' | 'warn' | 'error';
  stage: string;
  message: string;
  context: Record<string, unknown> | null;
  created_at: string;
};

export type AuthToken = {
  id: string;
  token: string;
  email: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
};

export type SubscriberCache = {
  email: string;
  beehiiv_subscription_id: string | null;
  referral_count: number;
  has_access: boolean;
  last_verified: string;
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type TownInsert = Optional<
  Town,
  'id' | 'created_at' | 'county' | 'latitude' | 'longitude'
>;
type AgencyInsert = Optional<
  Agency,
  | 'id'
  | 'created_at'
  | 'last_updated'
  | 'town_id'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'category'
  | 'google_profile_url'
>;
type AgencySnapshotInsert = Optional<
  AgencySnapshot,
  | 'id'
  | 'created_at'
  | 'average_rating'
  | 'review_count'
  | 'recent_reviews_count'
  | 'recency_score'
  | 'volume_score'
  | 'rating_score'
  | 'composite_score'
  | 'sales_rank'
  | 'lettings_rank'
>;
type RefreshLogInsert = Optional<
  RefreshLog,
  'id' | 'created_at' | 'town_id' | 'context'
>;
type AuthTokenInsert = Optional<
  AuthToken,
  'id' | 'created_at' | 'used' | 'used_at'
>;
type SubscriberCacheInsert = Optional<
  SubscriberCache,
  | 'beehiiv_subscription_id'
  | 'referral_count'
  | 'has_access'
  | 'last_verified'
>;

export type Database = {
  public: {
    Tables: {
      towns: {
        Row: Town;
        Insert: TownInsert;
        Update: Partial<Town>;
        Relationships: [];
      };
      agencies: {
        Row: Agency;
        Insert: AgencyInsert;
        Update: Partial<Agency>;
        Relationships: [];
      };
      agency_snapshots: {
        Row: AgencySnapshot;
        Insert: AgencySnapshotInsert;
        Update: Partial<AgencySnapshot>;
        Relationships: [];
      };
      refresh_log: {
        Row: RefreshLog;
        Insert: RefreshLogInsert;
        Update: Partial<RefreshLog>;
        Relationships: [];
      };
      auth_tokens: {
        Row: AuthToken;
        Insert: AuthTokenInsert;
        Update: Partial<AuthToken>;
        Relationships: [];
      };
      subscriber_cache: {
        Row: SubscriberCache;
        Insert: SubscriberCacheInsert;
        Update: Partial<SubscriberCache>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
