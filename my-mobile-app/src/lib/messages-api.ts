import { fetchBlockedUserIds } from '@/lib/account-api';
import { supabase } from '@/lib/supabase';

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
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

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not signed in');
  return user;
}

/** Load messages via Supabase RLS — works without the web mobile API. */
export async function fetchMessages(): Promise<MessagesPayload> {
  const user = await requireUser();

  const [{ data: memberships, error: memberError }, { data: profile }] = await Promise.all([
    supabase
      .from('contest_members')
      .select('contest_id, role, contests(name)')
      .eq('user_id', user.id),
    supabase.from('users').select('is_global_admin').eq('id', user.id).maybeSingle(),
  ]);

  if (memberError) throw new Error(memberError.message);

  const contests: MessageContest[] = (memberships || []).map((row) => {
    const contest = firstRelation(
      row.contests as { name?: string | null } | { name?: string | null }[] | null,
    );
    return {
      id: row.contest_id as string,
      name: contest?.name || 'Contest',
      role: row.role as string,
    };
  });

  const contestIds = contests.map((c) => c.id);
  const isGlobalAdmin = profile?.is_global_admin === true;

  if (contestIds.length === 0) {
    return { contests, messages: [], isGlobalAdmin };
  }

  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .select(
      'id, contest_id, author_id, title, body, created_at, users(username, email), contests(name)',
    )
    .in('contest_id', contestIds)
    .order('created_at', { ascending: false })
    .limit(60);

  if (messageError) throw new Error(messageError.message);

  const threads: Omit<MessageThread, 'replies'>[] = (messageData || []).map((row) => {
    const author = firstRelation(
      row.users as
        | { username?: string | null; email?: string | null }
        | { username?: string | null; email?: string | null }[]
        | null,
    );
    const contest = firstRelation(
      row.contests as { name?: string | null } | { name?: string | null }[] | null,
    );
    return {
      id: row.id as string,
      contestId: row.contest_id as string,
      authorId: row.author_id as string,
      title: row.title as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      authorName: author?.username || author?.email || 'Member',
      contestName: contest?.name || 'League',
    };
  });

  const messageIds = threads.map((m) => m.id);
  const { data: replyData, error: replyError } = messageIds.length
    ? await supabase
        .from('message_replies')
        .select('id, message_id, author_id, body, created_at, users(username, email)')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true })
    : { data: [] as never[], error: null };

  if (replyError) throw new Error(replyError.message);

  const repliesByMessage = new Map<string, MessageReply[]>();
  for (const row of replyData || []) {
    const author = firstRelation(
      row.users as
        | { username?: string | null; email?: string | null }
        | { username?: string | null; email?: string | null }[]
        | null,
    );
    const reply: MessageReply = {
      id: row.id as string,
      messageId: row.message_id as string,
      authorId: row.author_id as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      authorName: author?.username || author?.email || 'Member',
    };
    const list = repliesByMessage.get(reply.messageId) || [];
    list.push(reply);
    repliesByMessage.set(reply.messageId, list);
  }

  void supabase
    .from('message_reads')
    .upsert({ user_id: user.id, last_read_at: new Date().toISOString() })
    .then(() => undefined);

  const blocked = new Set(await fetchBlockedUserIds());

  return {
    contests,
    isGlobalAdmin,
    // Guideline 1.2: blocked users' posts/replies disappear from the feed immediately.
    messages: threads
      .filter((message) => !blocked.has(message.authorId))
      .map((message) => ({
        ...message,
        replies: (repliesByMessage.get(message.id) || []).filter(
          (reply) => !blocked.has(reply.authorId),
        ),
      })),
  };
}

/** Load one thread (message + replies), applying block filters. */
export async function fetchMessageThread(messageId: string): Promise<{
  message: MessageThread;
  contests: MessageContest[];
  isGlobalAdmin: boolean;
} | null> {
  const user = await requireUser();
  if (!messageId) return null;

  const [{ data: memberships, error: memberError }, { data: profile }] = await Promise.all([
    supabase
      .from('contest_members')
      .select('contest_id, role, contests(name)')
      .eq('user_id', user.id),
    supabase.from('users').select('is_global_admin').eq('id', user.id).maybeSingle(),
  ]);
  if (memberError) throw new Error(memberError.message);

  const contests: MessageContest[] = (memberships || []).map((row) => {
    const contest = firstRelation(
      row.contests as { name?: string | null } | { name?: string | null }[] | null,
    );
    return {
      id: row.contest_id as string,
      name: contest?.name || 'Contest',
      role: row.role as string,
    };
  });
  const contestIds = new Set(contests.map((c) => c.id));
  const isGlobalAdmin = profile?.is_global_admin === true;

  const { data: row, error: messageError } = await supabase
    .from('messages')
    .select(
      'id, contest_id, author_id, title, body, created_at, users(username, email), contests(name)',
    )
    .eq('id', messageId)
    .maybeSingle();
  if (messageError) throw new Error(messageError.message);
  if (!row) return null;
  if (!contestIds.has(row.contest_id as string) && !isGlobalAdmin) {
    throw new Error('You can only view messages in contests you belong to.');
  }

  const author = firstRelation(
    row.users as
      | { username?: string | null; email?: string | null }
      | { username?: string | null; email?: string | null }[]
      | null,
  );
  const contest = firstRelation(
    row.contests as { name?: string | null } | { name?: string | null }[] | null,
  );

  const { data: replyData, error: replyError } = await supabase
    .from('message_replies')
    .select('id, message_id, author_id, body, created_at, users(username, email)')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });
  if (replyError) throw new Error(replyError.message);

  const blocked = new Set(await fetchBlockedUserIds());
  if (blocked.has(row.author_id as string)) return null;

  const replies: MessageReply[] = (replyData || [])
    .filter((r) => !blocked.has(r.author_id as string))
    .map((r) => {
      const replyAuthor = firstRelation(
        r.users as
          | { username?: string | null; email?: string | null }
          | { username?: string | null; email?: string | null }[]
          | null,
      );
      return {
        id: r.id as string,
        messageId: r.message_id as string,
        authorId: r.author_id as string,
        body: r.body as string,
        createdAt: r.created_at as string,
        authorName: replyAuthor?.username || replyAuthor?.email || 'Member',
      };
    });

  return {
    contests,
    isGlobalAdmin,
    message: {
      id: row.id as string,
      contestId: row.contest_id as string,
      authorId: row.author_id as string,
      title: row.title as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      authorName: author?.username || author?.email || 'Member',
      contestName: contest?.name || 'League',
      replies,
    },
  };
}

export async function createMessage(contestId: string, title: string, body: string) {
  const user = await requireUser();
  const nextTitle = title.trim();
  const nextBody = body.trim();
  if (!contestId || !nextTitle || !nextBody) {
    throw new Error('Message title and text are required.');
  }

  const { data: membership } = await supabase
    .from('contest_members')
    .select('role')
    .eq('contest_id', contestId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) throw new Error('You can only post in contests you belong to.');

  const { error } = await supabase.from('messages').insert({
    contest_id: contestId,
    author_id: user.id,
    title: nextTitle,
    body: nextBody,
  });
  if (error) throw new Error(error.message);
}

export async function createReply(messageId: string, body: string) {
  const user = await requireUser();
  const nextBody = body.trim();
  if (!messageId || !nextBody) throw new Error('Reply text is required.');

  const { data: message } = await supabase
    .from('messages')
    .select('contest_id')
    .eq('id', messageId)
    .maybeSingle();
  if (!message) throw new Error('Message not found.');

  const { data: membership } = await supabase
    .from('contest_members')
    .select('role')
    .eq('contest_id', message.contest_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) throw new Error('You can only reply in contests you belong to.');

  const { error } = await supabase.from('message_replies').insert({
    message_id: messageId,
    author_id: user.id,
    body: nextBody,
  });
  if (error) throw new Error(error.message);
}

export async function deleteMessageOrReply(kind: 'message' | 'reply', id: string) {
  const user = await requireUser();
  const { data: profile } = await supabase
    .from('users')
    .select('is_global_admin')
    .eq('id', user.id)
    .maybeSingle();
  const isGlobalAdmin = profile?.is_global_admin === true;

  if (kind === 'message') {
    const { data: message } = await supabase
      .from('messages')
      .select('contest_id, author_id')
      .eq('id', id)
      .maybeSingle();
    if (!message) throw new Error('Message not found.');

    const { data: membership } = await supabase
      .from('contest_members')
      .select('role')
      .eq('contest_id', message.contest_id)
      .eq('user_id', user.id)
      .maybeSingle();

    const canDelete =
      isGlobalAdmin || membership?.role === 'admin' || message.author_id === user.id;
    if (!membership || !canDelete) throw new Error('Not allowed to delete this message.');

    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const { data: reply } = await supabase
    .from('message_replies')
    .select('message_id, author_id')
    .eq('id', id)
    .maybeSingle();
  if (!reply) throw new Error('Reply not found.');

  const { data: message } = await supabase
    .from('messages')
    .select('contest_id')
    .eq('id', reply.message_id)
    .maybeSingle();
  if (!message) throw new Error('Message not found.');

  const { data: membership } = await supabase
    .from('contest_members')
    .select('role')
    .eq('contest_id', message.contest_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const canDelete = isGlobalAdmin || membership?.role === 'admin' || reply.author_id === user.id;
  if (!membership || !canDelete) throw new Error('Not allowed to delete this reply.');

  const { error } = await supabase.from('message_replies').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
