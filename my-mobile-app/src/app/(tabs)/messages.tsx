import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';
import { reportContent } from '@/lib/account-api';
import {
  createMessage,
  createReply,
  deleteMessageOrReply,
  fetchMessages,
  type MessageContest,
  type MessageThread,
} from '@/lib/messages-api';

export default function MessagesScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const bottomPad = useBottomTabPadding();
  const { user, profile } = useAuth();
  const onAccent = theme.isDark ? '#0f0f10' : '#ffffff';

  const [contests, setContests] = useState<MessageContest[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [contestId, setContestId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [contestPickerOpen, setContestPickerOpen] = useState(false);

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyBusyId, setReplyBusyId] = useState<string | null>(null);

  const selectedContest = useMemo(
    () => contests.find((c) => c.id === contestId) || null,
    [contests, contestId],
  );

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await fetchMessages();
      setContests(data.contests);
      setMessages(data.messages);
      setIsGlobalAdmin(data.isGlobalAdmin);
      setContestId((prev) => {
        if (prev && data.contests.some((c) => c.id === prev)) return prev;
        return data.contests[0]?.id || '';
      });
    } catch (err) {
      setContests([]);
      setMessages([]);
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onPost = async () => {
    if (busy) return;
    const nextTitle = title.trim();
    const nextBody = body.trim();
    if (!contestId || !nextTitle || !nextBody) {
      setError(t('Message title and text are required.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMessage(contestId, nextTitle, nextBody);
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setBusy(false);
    }
  };

  const onReply = async (messageId: string) => {
    if (replyBusyId) return;
    const text = (replyDrafts[messageId] || '').trim();
    if (!text) {
      setError(t('Reply text is required.'));
      return;
    }
    setReplyBusyId(messageId);
    setError(null);
    try {
      await createReply(messageId, text);
      setReplyDrafts((prev) => ({ ...prev, [messageId]: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setReplyBusyId(null);
    }
  };

  const canDelete = (authorId: string, contestIdForRow: string) => {
    if (!user) return false;
    if (isGlobalAdmin || profile?.is_global_admin) return true;
    if (authorId === user.id) return true;
    const membership = contests.find((c) => c.id === contestIdForRow);
    return membership?.role === 'admin';
  };

  const onDelete = async (kind: 'message' | 'reply', id: string) => {
    setError(null);
    try {
      await deleteMessageOrReply(kind, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Request failed'));
    }
  };

  const onReport = (kind: 'message' | 'reply', targetId: string, targetUserId: string) => {
    const submit = (reason: string) => {
      const text = reason.trim();
      if (text.length < 3) {
        setError(t('Report details are required.'));
        return;
      }
      void reportContent({ kind, targetId, targetUserId, reason: text })
        .then(() => Alert.alert(t('Report'), t('Thanks. We will review this report.')))
        .catch((err) => setError(err instanceof Error ? err.message : t('Request failed')));
    };

    if (typeof Alert.prompt === 'function') {
      Alert.prompt(
        t('Report'),
        t('Tell us what is wrong with this content.'),
        [
          { text: t('Cancel'), style: 'cancel' },
          { text: t('Submit report'), onPress: (reason?: string) => submit(reason || '') },
        ],
        'plain-text',
      );
      return;
    }

    Alert.alert(t('Report'), t('Report this content as inappropriate?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Submit report'),
        style: 'destructive',
        onPress: () => submit('Inappropriate or abusive content'),
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.iconTile, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="chatbubbles" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.title, { color: theme.text }]}>{t('Messages')}</Text>
            <Text style={[styles.sub, { color: theme.textSecondary }]}>
              {t('Discuss matches and contests with your fellow members.')}
            </Text>
          </View>
        </View>

        {error ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: 'rgba(248,113,113,0.12)',
                borderColor: 'rgba(248,113,113,0.35)',
              },
            ]}>
            <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        {contests.length > 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('Start a discussion')}
            </Text>

            <Pressable
              onPress={() => setContestPickerOpen(true)}
              style={[
                styles.select,
                { borderColor: theme.borderStrong, backgroundColor: theme.background },
              ]}>
              <Text style={{ color: selectedContest ? theme.text : theme.textSecondary, flex: 1 }}>
                {selectedContest?.name || t('Choose a contest')}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </Pressable>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('Title')}
              placeholderTextColor={theme.textSecondary}
              maxLength={120}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.borderStrong,
                  backgroundColor: theme.background,
                },
              ]}
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={t('Write your message…')}
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={5000}
              style={[
                styles.textarea,
                {
                  color: theme.text,
                  borderColor: theme.borderStrong,
                  backgroundColor: theme.background,
                },
              ]}
            />
            <Pressable
              onPress={() => void onPost()}
              disabled={busy}
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.accent, opacity: busy ? 0.65 : 1 },
              ]}>
              {busy ? (
                <ActivityIndicator color={onAccent} />
              ) : (
                <>
                  <Ionicons name="send" size={15} color={onAccent} />
                  <Text style={[styles.primaryBtnText, { color: onAccent }]}>{t('Post')}</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: Spacing.four }} />
        ) : contests.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('No contests yet')}</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              {t('Join a league to start discussions with other members.')}
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('No messages yet')}</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              {t('Be the first to start a discussion in one of your contests.')}
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={styles.threadHead}>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {message.contestName} · {message.authorName}
                </Text>
                <View style={styles.threadActions}>
                  {message.authorId !== user?.id ? (
                    <Pressable
                      onPress={() => onReport('message', message.id, message.authorId)}
                      hitSlop={8}>
                      <Ionicons name="flag-outline" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ) : null}
                  {canDelete(message.authorId, message.contestId) ? (
                    <Pressable onPress={() => void onDelete('message', message.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.threadTitle, { color: theme.text }]}>{message.title}</Text>
              <Text style={[styles.threadBody, { color: theme.textSecondary }]}>{message.body}</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {new Date(message.createdAt).toLocaleString()}
              </Text>

              {message.replies.length > 0 ? (
                <View style={styles.replies}>
                  {message.replies.map((reply) => (
                    <View
                      key={reply.id}
                      style={[
                        styles.reply,
                        {
                          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : '#f8fafc',
                          borderColor: theme.border,
                        },
                      ]}>
                      <View style={styles.threadHead}>
                        <Text style={[styles.meta, { color: theme.textSecondary }]}>
                          {reply.authorName}
                        </Text>
                        <View style={styles.threadActions}>
                          {reply.authorId !== user?.id ? (
                            <Pressable
                              onPress={() => onReport('reply', reply.id, reply.authorId)}
                              hitSlop={8}>
                              <Ionicons name="flag-outline" size={14} color={theme.textSecondary} />
                            </Pressable>
                          ) : null}
                          {canDelete(reply.authorId, message.contestId) ? (
                            <Pressable onPress={() => void onDelete('reply', reply.id)} hitSlop={8}>
                              <Ionicons name="trash-outline" size={14} color={theme.danger} />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                      <Text style={[styles.replyBody, { color: theme.text }]}>{reply.body}</Text>
                      <Text style={[styles.meta, { color: theme.textSecondary }]}>
                        {new Date(reply.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.replyComposer}>
                <TextInput
                  value={replyDrafts[message.id] || ''}
                  onChangeText={(value) =>
                    setReplyDrafts((prev) => ({ ...prev, [message.id]: value }))
                  }
                  placeholder={t('Write a reply…')}
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.replyInput,
                    {
                      color: theme.text,
                      borderColor: theme.borderStrong,
                      backgroundColor: theme.background,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => void onReply(message.id)}
                  disabled={replyBusyId === message.id}
                  style={[
                    styles.replyBtn,
                    {
                      backgroundColor: theme.accent,
                      opacity: replyBusyId === message.id ? 0.65 : 1,
                    },
                  ]}>
                  {replyBusyId === message.id ? (
                    <ActivityIndicator color={onAccent} size="small" />
                  ) : (
                    <Ionicons name="arrow-up" size={16} color={onAccent} />
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={contestPickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setContestPickerOpen(false)}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Choose a contest')}</Text>
            {contests.map((contest) => {
              const selected = contest.id === contestId;
              return (
                <Pressable
                  key={contest.id}
                  onPress={() => {
                    setContestId(contest.id);
                    setContestPickerOpen(false);
                  }}
                  style={[
                    styles.modalRow,
                    {
                      backgroundColor: selected ? theme.accentMuted : 'transparent',
                      borderColor: theme.border,
                    },
                  ]}>
                  <Text style={{ color: theme.text, fontWeight: selected ? '800' : '600', flex: 1 }}>
                    {contest.name}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={18} color={theme.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  sub: { fontSize: 13, lineHeight: 18 },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  select: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textarea: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '800' },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { fontSize: 13, lineHeight: 19 },
  threadHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  threadActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { fontSize: 12, fontWeight: '600' },
  threadTitle: { fontSize: 17, fontWeight: '800' },
  threadBody: { fontSize: 14, lineHeight: 20 },
  replies: { gap: 8, marginTop: 4 },
  reply: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 6 },
  replyBody: { fontSize: 13, lineHeight: 18 },
  replyComposer: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  replyInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  replyBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalSheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    maxHeight: '70%',
  },
  modalRow: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
