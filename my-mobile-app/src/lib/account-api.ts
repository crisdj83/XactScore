import { Alert } from 'react-native';

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
        'Account API is not on the website yet. Deploy the latest web app, or email support@xactscore.app.',
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

/** Permanently delete the signed-in account (App Store 5.1.1(v)). */
export async function deleteAccount() {
  // Prefer DB RPC (works right after running fix_contests_admin_cascade.sql).
  const { error: rpcError } = await supabase.rpc('delete_own_account');
  if (!rpcError) {
    await supabase.auth.signOut();
    return;
  }

  const rpcMissing =
    rpcError.message.includes('delete_own_account') ||
    rpcError.code === 'PGRST202' ||
    rpcError.code === '42883';

  if (!rpcMissing) {
    throw new Error(rpcError.message);
  }

  // Fallback: website API (needs latest deploy + service role).
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/account/delete`, {
    method: 'POST',
    headers,
    body: '{}',
  });
  await parseJson(response);
  await supabase.auth.signOut();
}

export async function reportContent(input: {
  kind: 'message' | 'reply' | 'user';
  targetId: string;
  targetUserId?: string;
  reason: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  try {
    const headers = await authHeaders();
    const response = await fetch(`${apiBaseUrl()}/api/mobile/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json') && !looksLikeHtml(body)) {
      return;
    }
  } catch {
    // fall through to direct insert
  }

  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    kind: input.kind,
    target_id: input.targetId,
    target_user_id: input.targetUserId || null,
    reason: input.reason.trim().slice(0, 500),
  });
  if (error) {
    throw new Error(
      error.message.includes('content_reports') || error.code === '42P01'
        ? 'Reporting is not enabled yet. Email support@xactscore.app.'
        : error.message,
    );
  }
}

export function confirmDeleteAccount(onConfirm: () => void) {
  Alert.alert(
    'Delete account?',
    'This permanently deletes your XactScore account, profile, predictions, messages, and leagues you administer. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ],
  );
}
