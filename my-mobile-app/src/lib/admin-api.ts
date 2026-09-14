import { siteUrl, supabase } from '@/lib/supabase';

function apiBaseUrl() {
  return siteUrl.replace('://xactscore.app', '://www.xactscore.app');
}

function looksLikeHtml(body: string) {
  const trimmed = body.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

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

async function parseJson(response: Response) {
  const body = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('application/json') || looksLikeHtml(body)) {
    if (looksLikeHtml(body) || response.status === 404) {
      throw new Error(
        'Admin API is not on the website yet. Deploy the latest web app, then pull to refresh.',
      );
    }
    try {
      throw new Error((JSON.parse(body) as { error?: string }).error || 'Request failed');
    } catch (error) {
      if (error instanceof Error && error.message !== 'Request failed') throw error;
      throw new Error('Request failed');
    }
  }
  return JSON.parse(body) as Record<string, unknown>;
}

export type PendingAvatar = {
  id: string;
  username: string | null;
  email: string | null;
  pendingAvatarUrl: string;
  avatarUrl: string | null;
};

export async function fetchPendingAvatars(): Promise<PendingAvatar[]> {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/admin/avatars`, { headers });
  const data = await parseJson(response);
  return (data.pending as PendingAvatar[]) || [];
}

export async function moderateAvatar(
  action: 'approve' | 'reject',
  userId: string,
  pendingUrl?: string,
) {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/admin/avatars`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, userId, pendingUrl }),
  });
  await parseJson(response);
}
