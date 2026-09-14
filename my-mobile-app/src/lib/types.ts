export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  pending_avatar_url: string | null;
  favorite_team: string | null;
  quote: string | null;
  is_global_admin: boolean;
  reminders_enabled?: boolean;
  reminder_lead_minutes?: number;
};

export type ContestMembership = {
  contest_id: string;
  role: 'admin' | 'member';
  joined_at?: string;
  contests: {
    name: string;
    contest_key: string;
    season_length: string;
    is_open: boolean;
    is_public?: boolean;
  } | null;
};

export type LeagueMessage = {
  id: string;
  contest_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  users?: { username?: string | null; email?: string | null } | null;
  contests?: { name?: string | null } | null;
};
