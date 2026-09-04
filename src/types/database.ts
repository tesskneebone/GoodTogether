export type UserRole = "volunteer" | "org";

export type OpportunityCategory =
  | "environment"
  | "education"
  | "food_security"
  | "homelessness"
  | "animal_welfare"
  | "health"
  | "seniors"
  | "youth"
  | "disaster_relief"
  | "arts_culture"
  | "other";

export type SignupStatus = "confirmed" | "cancelled";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  org_name: string | null;
  bio: string | null;
  created_at: string;
};

export type Opportunity = {
  id: string;
  org_id: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  neighborhood: string;
  address: string | null;
  starts_at: string;
  ends_at: string;
  spots_total: number;
  spots_filled: number;
  image_url: string | null;
  created_at: string;
};

export type Signup = {
  id: string;
  opportunity_id: string;
  volunteer_id: string;
  status: SignupStatus;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; role: UserRole; full_name: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      opportunities: {
        Row: Opportunity;
        Insert: Partial<Opportunity> & {
          org_id: string;
          title: string;
          description: string;
          category: OpportunityCategory;
          neighborhood: string;
          starts_at: string;
          ends_at: string;
          spots_total: number;
        };
        Update: Partial<Opportunity>;
        Relationships: [
          {
            foreignKeyName: "opportunities_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      signups: {
        Row: Signup;
        Insert: Partial<Signup> & { opportunity_id: string; volunteer_id: string };
        Update: Partial<Signup>;
        Relationships: [
          {
            foreignKeyName: "signups_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "signups_volunteer_id_fkey";
            columns: ["volunteer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      opportunity_category: OpportunityCategory;
      signup_status: SignupStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
