export type UserRole = "volunteer" | "org";

export type OrgStatus = "pending" | "approved" | "rejected";

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
  username: string;
  full_name: string;
  org_name: string | null;
  bio: string | null;
  age: number | null;
  neighborhood: string | null;
  avatar_url: string | null;
  is_private: boolean;
  org_status: OrgStatus | null;
  is_admin: boolean;
  created_at: string;
};

export type Opportunity = {
  id: string;
  org_id: string | null;
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
  source: string | null;
  source_name: string | null;
  source_url: string | null;
  external_id: string | null;
  image_credit: string | null;
  image_credit_url: string | null;
};

export type Signup = {
  id: string;
  opportunity_id: string;
  volunteer_id: string;
  status: SignupStatus;
  note: string | null;
  photo_url: string | null;
  hours_override: number | null;
  created_at: string;
};

export type LoggedActivity = {
  id: string;
  volunteer_id: string;
  category: OpportunityCategory;
  title: string;
  org_name: string | null;
  occurred_at: string;
  hours: number;
  note: string | null;
  photo_url: string | null;
  location: string | null;
  created_at: string;
};

export type ActivityKudos = {
  id: string;
  giver_id: string;
  activity_key: string;
  created_at: string;
};

export type ActivityComment = {
  id: string;
  activity_key: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type CommentLike = {
  comment_id: string;
  liker_id: string;
  created_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type SavedOpportunity = {
  volunteer_id: string;
  opportunity_id: string;
  note: string | null;
  photo_url: string | null;
  hours_override: number | null;
  created_at: string;
};

export type VolunteerHours = {
  volunteer_id: string;
  full_name: string;
  avatar_url: string | null;
  total_hours: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; role: UserRole; full_name: string; username?: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      opportunities: {
        Row: Opportunity;
        Insert: Partial<Opportunity> & {
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
      logged_activities: {
        Row: LoggedActivity;
        Insert: Partial<LoggedActivity> & {
          volunteer_id: string;
          category: OpportunityCategory;
          title: string;
          occurred_at: string;
          hours: number;
        };
        Update: Partial<LoggedActivity>;
        Relationships: [
          {
            foreignKeyName: "logged_activities_volunteer_id_fkey";
            columns: ["volunteer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_kudos: {
        Row: ActivityKudos;
        Insert: Partial<ActivityKudos> & { giver_id: string; activity_key: string };
        Update: Partial<ActivityKudos>;
        Relationships: [
          {
            foreignKeyName: "activity_kudos_giver_id_fkey";
            columns: ["giver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_comments: {
        Row: ActivityComment;
        Insert: Partial<ActivityComment> & { activity_key: string; author_id: string; body: string };
        Update: Partial<ActivityComment>;
        Relationships: [
          {
            foreignKeyName: "activity_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      comment_likes: {
        Row: CommentLike;
        Insert: Partial<CommentLike> & { comment_id: string; liker_id: string };
        Update: Partial<CommentLike>;
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "activity_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_likes_liker_id_fkey";
            columns: ["liker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: Follow;
        Insert: Partial<Follow> & { follower_id: string; following_id: string };
        Update: Partial<Follow>;
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_opportunities: {
        Row: SavedOpportunity;
        Insert: Partial<SavedOpportunity> & { volunteer_id: string; opportunity_id: string };
        Update: Partial<SavedOpportunity>;
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_volunteer_id_fkey";
            columns: ["volunteer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      volunteer_hours_alltime: {
        Row: VolunteerHours;
        Relationships: [];
      };
      volunteer_hours_weekly: {
        Row: VolunteerHours;
        Relationships: [];
      };
    };
    Functions: {
      get_org_contact_email: {
        Args: { target_id: string };
        Returns: string | null;
      };
    };
    Enums: {
      user_role: UserRole;
      opportunity_category: OpportunityCategory;
      signup_status: SignupStatus;
      org_status: OrgStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
