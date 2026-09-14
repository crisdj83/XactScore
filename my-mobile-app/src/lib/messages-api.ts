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
        'Messages API is not on the website yet. Deploy the latest web app, then pull to refresh.',
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

export type MessageContest = {
  id: string;
  name: string;
  role: string;
};

export type MessageReply = {
  id: string;
  messageId: string;
  authorId: string;
  body: string;
  createdAt: string;
  authorName: string;
};

export type MessageThread = {
  id: string;
  contestId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
  contestName: string;
  replies: MessageReply[];
};

export type MessagesPayload = {
  contests: MessageContest[];
  messages: MessageThread[];
  isGlobalAdmin: boolean;
};

export async function fetchMessages(): Promise<MessagesPayload> {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/messages`, { headers });
  const data = await parseJson(response);
  return {
    contests: (data.contests as MessageContest[]) || [],
    messages: (data.messages as MessageThread[]) || [],
    isGlobalAdmin: Boolean(data.isGlobalAdmin),
  };
}

export async function createMessage(contestId: string, title: string, body: string) {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ kind: 'message', contestId, title, body }),
  });
  await parseJson(response);
}

export async function createReply(messageId: string, body: string) {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ kind: 'reply', messageId, body }),
  });
  await parseJson(response);
}

export async function deleteMessageOrReply(kind: 'message' | 'reply', id: string) {
  const headers = await authHeaders();
  const response = await fetch(`${apiBaseUrl()}/api/mobile/messages`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ kind, id }),
  });
  await parseJson(response);
}
