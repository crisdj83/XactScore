import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';
import { promptMessageSafety } from '@/lib/message-safety';
import {
  createReply,
  deleteMessageOrReply,
  fetchMessageThread,
  type MessageContest,
  type MessageThread,
} from '@/lib/messages-api';

const COMPOSER_HEIGHT = 68;

export default function MessageThreadScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = useBottomTabPadding();
  const { user, profile } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const messageId = String(id || '');
  const onAccent = theme.isDark ? '#0f0f10' : '#ffffff';

  const [message, setMessage] = useState<MessageThread | null>(null);
  const [contests, setContests] = useState<MessageContest[]>([]);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const load = useCallback(async () => {
    if (!user || !messageId) return;
    setError(null);
    try {
      const data = await fetchMessageThread(messageId);
      if (!data) {
        setMessage(null);
        setError(t('Message not found.'));
        return;
      }
      setMessage(data.message);
      setContests(data.contests);
      setIsGlobalAdmin(data.isGlobalAdmin);
    } catch (err) {
      setMessage(null);
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [messageId, t, user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const canDelete = (authorId: string, contestIdForRow: string) => {
    if (!user) return false;
    if (isGlobalAdmin || profile?.is_global_admin) return true;
    if (authorId === user.id) return true;
    const membership = contests.find((c) => c.id === contestIdForRow);
    return membership?.role === 'admin';
  };

  const onDelete = async (kind: 'message' | 'reply', targetId: string) => {
    setError(null);
    try {
      await deleteMessageOrReply(kind, targetId);
      if (kind === 'message') {
        router.back();
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Request failed'));
    }
  };

  const onReply = async () => {
    if (replyBusy || !message) return;
    const text = replyText.trim();
    if (!text) {
      setError(t('Reply text is required.'));
      return;
    }
    setReplyBusy(true);
    setError(null);
    try {
      await createReply(message.id, text);
      setReplyText('');
      Keyboard.dismiss();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setReplyBusy(false);
    }
  };

  const onSafety = (kind: 'message' | 'reply', targetId: string, targetUserId: string) => {
    promptMessageSafety({
      t,
      kind,
      targetId,
      targetUserId,
      onError: setError,
      onBlocked: () => {
        if (kind === 'message') router.back();
        else void load();
      },
    });
  };

  const keyboardOpen = keyboardHeight > 0;
  // When the keyboard is open it covers the tab dock — sit just above the keyboard.
  // When closed, clear the floating NativeTabs dock.
  const composerBottom = keyboardOpen ? keyboardHeight : 0;
  const composerPadBottom = keyboardOpen
    ? Math.max(insets.bottom > 0 ? 8 : 12, 8)
    : Math.max(bottomPad - 48, 12);
  const scrollBottomPad = COMPOSER_HEIGHT + composerPadBottom + composerBottom + Spacing.two;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.backBtn, { borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={18} color={theme.text} />
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{t('Back')}</Text>
        </Pressable>

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

        {loading && !message ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: Spacing.four }} />
        ) : null}

        {message ? (
          <View
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
                    onPress={() => onSafety('message', message.id, message.authorId)}
                    hitSlop={8}
                    accessibilityLabel={t('Safety')}>
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

            <View style={[styles.repliesHead, { borderTopColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Replies')}</Text>
            </View>

            {message.replies.length === 0 ? (
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                {t('No replies yet')}
              </Text>
            ) : (
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
                            onPress={() => onSafety('reply', reply.id, reply.authorId)}
                            hitSlop={8}
                            accessibilityLabel={t('Safety')}>
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
            )}
          </View>
        ) : null}
      </ScrollView>

      {message ? (
        <View
          style={[
            styles.composerBar,
            {
              backgroundColor: theme.backgroundElement,
              borderTopColor: theme.border,
              bottom: composerBottom,
              paddingBottom: composerPadBottom,
            },
          ]}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder={t('Write a reply…')}
            placeholderTextColor={theme.textSecondary}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => void onReply()}
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
            onPress={() => void onReply()}
            disabled={replyBusy}
            style={[
              styles.replyBtn,
              { backgroundColor: theme.accent, opacity: replyBusy ? 0.65 : 1 },
            ]}>
            {replyBusy ? (
              <ActivityIndicator color={onAccent} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={16} color={onAccent} />
            )}
          </Pressable>
        </View>
      ) : null}
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
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 44,
  },
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
  threadHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  threadActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { fontSize: 12, fontWeight: '600' },
  threadTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  threadBody: { fontSize: 15, lineHeight: 22 },
  repliesHead: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  replies: { gap: 8 },
  reply: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 6 },
  replyBody: { fontSize: 14, lineHeight: 20 },
  emptyBody: { fontSize: 13, lineHeight: 19 },
  composerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  replyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
