import { siteUrl, supabase } from '@/lib/supabase';
import type { ContestScoring } from '@/lib/scoring';

function apiBaseUrl() {
  return siteUrl.replace('://xactscore.app', '://www.xactscore.app');
}

function looksLikeHtml(body: string) {
  const trimmed = body.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

export type ContestMatch = {
  id: string;
  utcDate: string;
  status: string;
  matchday: number;
  venue: string | null;
  homeTeam: string;
  awayTeam: string;
  homeCrest: string | null;
  awayCrest: string | null;
  homeTla: string | null;
  awayTla: string | null;
  homeScore: number | null;
  awayScore: number | null;
  locked: boolean;
  revealable: boolean;
};

export type ContestMember = {
  userId: string;
  role: string;
  username: string | null;
  email: string | null;
  quote: string | null;
  avatarUrl: string | null;
  displayName: string;
};

export type ContestRankingRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  quote: string | null;
  totalPoints: number;
  exact: number;
  close: number;
  result: number;
  played: number;
  rank: number;
};

export type ContestStandingRow = {
  position: number;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  crest?: string | null;
};

export type ContestDetail = {
  contest: {
    id: string;
    name: string;
    contestKey: string;
    seasonLength: string;
    isOpen: boolean;
    isPublic: boolean;
    scoring: ContestScoring;
  };
  role: 'admin' | 'member' | string;
  userId: string;
  activeMatchday: number;
  matchdays: number[];
  matches: ContestMatch[];
  myPredictions: Record<string, { home: number; away: number }>;
  predictions: Array<{
    userId: string;
    matchId: string;
    home: number | null;
    away: number | null;
  }>;
  members: ContestMember[];
  ranking: ContestRankingRow[];
  standings: ContestStandingRow[];
};

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${session.access_token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function fetchContestDetail(contestId: string): Promise<ContestDetail> {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/contest/${contestId}`, {
    headers,
  });
  const body = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok || !contentType.includes('application/json') || looksLikeHtml(body)) {
    throw new Error(
      looksLikeHtml(body) || response.status === 404
        ? 'Contest API is not on the website yet. Deploy the latest web app, then pull to refresh.'
        : (() => {
            try {
              return (JSON.parse(body) as { error?: string }).error || 'Failed to load contest';
            } catch {
              return 'Failed to load contest';
            }
          })()
    );
  }

  return JSON.parse(body) as ContestDetail;
}

export async function saveContestPrediction(
  contestId: string,
  matchId: string,
  home: number,
  away: number
) {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/contest/${contestId}/predictions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ matchId, home, away }),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string; saved?: number };
  if (!response.ok) {
    throw new Error(json.error || 'Failed to save prediction');
  }
  return json;
}

export async function saveContestPredictionsBatch(
  contestId: string,
  predictions: Array<{ matchId: string; home: number; away: number }>
) {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/contest/${contestId}/predictions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ predictions }),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string; saved?: number };
  if (!response.ok) {
    throw new Error(json.error || 'Failed to save predictions');
  }
  return json;
}
