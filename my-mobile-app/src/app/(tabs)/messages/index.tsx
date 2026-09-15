import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { type Href, router, useFocusEffect } from 'expo-router';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';
import {
  createMessage,
  fetchMessages,
  type MessageContest,
  type MessageThread,
} from '@/lib/messages-api';

export default function MessagesListScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const bottomPad = useBottomTabPadding();
  const { user } = useAuth();
  const onAccent = theme.isDark ? '#0f0f10' : '#ffffff';

  const [contests, setContests] = useState<MessageContest[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [contestId, setContestId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [contestPickerOpen, setContestPickerOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

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
      setComposeOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setBusy(false);
    }
  };

  const replyLabel = (count: number) => {
    if (count === 0) return t('No replies yet');
    if (count === 1) return t('1 reply');
    return t('{n} replies').replace('{n}', String(count));
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
              {t('Tap a discussion to open the thread and reply.')}
            </Text>
          </View>
          {contests.length > 0 ? (
            <Pressable
              onPress={() => setComposeOpen(true)}
              hitSlop={8}
              style={[styles.newBtn, { backgroundColor: theme.accent }]}
              accessibilityLabel={t('Start a discussion')}>
              <Ionicons name="add" size={22} color={onAccent} />
            </Pressable>
          ) : null}
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
            <Pressable
              onPress={() => setComposeOpen(true)}
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
              <Ionicons name="create-outline" size={16} color={onAccent} />
              <Text style={[styles.primaryBtnText, { color: onAccent }]}>
                {t('Start a discussion')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.listCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            {messages.map((message, index) => (
              <Pressable
                key={message.id}
                onPress={() => router.push(`/messages/${message.id}` as Href)}
                style={({ pressed }) => [
                  styles.threadRow,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border,
                  },
                  pressed && {
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                  },
                ]}>
                <View style={styles.threadMain}>
                  <Text numberOfLines={2} style={[styles.threadTitle, { color: theme.text }]}>
                    {message.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.meta, { color: theme.textSecondary }]}>
                    {message.contestName} · {message.authorName}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {replyLabel(message.replies.length)} ·{' '}
                    {new Date(message.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={composeOpen} transparent animationType="slide">
        <View style={styles.composeBackdrop}>
          <View
            style={[
              styles.composeSheet,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: bottomPad > 24 ? bottomPad - 40 : 24,
              },
            ]}>
            <View style={styles.composeHead}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('Start a discussion')}
              </Text>
              <Pressable onPress={() => setComposeOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

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
        </View>
      </Modal>

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
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  threadRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  threadMain: { flex: 1, minWidth: 0, gap: 4 },
  threadTitle: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, fontWeight: '600' },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { fontSize: 13, lineHeight: 19 },
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
  composeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  composeSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  composeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
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
