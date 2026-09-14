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

export type PendingAvatar = {
  id: string;
  username: string | null;
  email: string | null;
  pendingAvatarUrl: string;
  avatarUrl: string | null;
};

async function requireGlobalAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await supabase
    .from('users')
    .select('is_global_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_global_admin) throw new Error('Unauthorized');
  return user;
}

/** Prefer web API when deployed; fall back to direct Supabase select. */
export async function fetchPendingAvatars(): Promise<PendingAvatar[]> {
  await requireGlobalAdmin();

  try {
    const headers = await authHeaders();
    const response = await fetch(`${apiBaseUrl()}/api/mobile/admin/avatars`, { headers });
    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json') && !looksLikeHtml(body)) {
      const data = JSON.parse(body) as { pending?: PendingAvatar[] };
      return data.pending || [];
    }
  } catch {
    // fall through to Supabase
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, pending_avatar_url, avatar_url')
    .not('pending_avatar_url', 'is', null)
    .order('username', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    id: row.id as string,
    username: row.username as string | null,
    email: row.email as string | null,
    pendingAvatarUrl: row.pending_avatar_url as string,
    avatarUrl: row.avatar_url as string | null,
  }));
}

/**
 * Approve/reject pending avatar.
 * Tries the deployed web API first; falls back to a Supabase RPC / direct update
 * when `is_global_admin` policies allow it.
 */
export async function moderateAvatar(
  action: 'approve' | 'reject',
  userId: string,
  pendingUrl?: string,
) {
  await requireGlobalAdmin();

  try {
    const headers = await authHeaders();
    const response = await fetch(`${apiBaseUrl()}/api/mobile/admin/avatars`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, userId, pendingUrl }),
    });
    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json') && !looksLikeHtml(body)) {
      return;
    }
  } catch {
    // fall through
  }

  const patch =
    action === 'approve'
      ? { avatar_url: pendingUrl, pending_avatar_url: null }
      : { pending_avatar_url: null };

  const { error } = await supabase.from('users').update(patch).eq('id', userId);
  if (error) {
    throw new Error(
      error.message.includes('policy') || error.code === '42501'
        ? 'Admin approve needs the website API (deploy latest web) or the global-admin update policy in Supabase.'
        : error.message,
    );
  }
}
