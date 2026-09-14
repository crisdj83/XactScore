import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/user-avatar';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import {
  fetchPendingAvatars,
  moderateAvatar,
  type PendingAvatar,
} from '@/lib/admin-api';

export default function AdminScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const onAccent = theme.isDark ? '#0f0f10' : '#ffffff';

  const [pending, setPending] = useState<PendingAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchPendingAvatars();
      setPending(rows);
    } catch (err) {
      setPending([]);
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (!profile?.is_global_admin) {
    return <Redirect href="/" />;
  }

  const onModerate = async (action: 'approve' | 'reject', row: PendingAvatar) => {
    if (busyId) return;
    setBusyId(row.id);
    setError(null);
    setMessage(null);
    try {
      await moderateAvatar(action, row.id, row.pendingAvatarUrl);
      setMessage(
        action === 'approve' ? t('Avatar approved') : t('Avatar rejected'),
      );
      setPending((prev) => prev.filter((item) => item.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Request failed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five },
      ]}
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

      <View style={styles.header}>
        <View style={[styles.iconTile, { backgroundColor: theme.accentMuted }]}>
          <Ionicons name="shield-checkmark" size={22} color={theme.accent} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.title, { color: theme.text }]}>{t('Global Admin Portal')}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {t('Review and moderate pending user profile images.')}
          </Text>
        </View>
      </View>

      {message ? (
        <View style={[styles.banner, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' }]}>
          <Text style={{ color: theme.success, fontWeight: '600', fontSize: 13 }}>{message}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={[styles.banner, { backgroundColor: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.35)' }]}>
          <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.panel,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={styles.panelHead}>
          <Ionicons name="time-outline" size={16} color={theme.accent} />
          <Text style={[styles.panelTitle, { color: theme.text }]}>
            {t('Pending Image Approvals')} ({pending.length})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginVertical: 28 }} />
        ) : pending.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={36} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('Queue is empty')}</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              {t('All user images have been reviewed successfully.')}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pending.map((row) => (
              <View
                key={row.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                    borderColor: theme.border,
                  },
                ]}>
                <View style={styles.cardMeta}>
                  <Text numberOfLines={1} style={[styles.cardName, { color: theme.text }]}>
                    {row.username || t('No username set')}
                  </Text>
                  <Text numberOfLines={1} style={[styles.cardEmail, { color: theme.textSecondary }]}>
                    {row.email || '—'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.avatarStage,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}>
                  <UserAvatar uri={row.pendingAvatarUrl} size={112} />
                </View>

                <View style={styles.actions}>
                  <Pressable
                    disabled={busyId === row.id}
                    onPress={() => void onModerate('approve', row)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.accent, opacity: busyId === row.id ? 0.6 : 1 },
                    ]}>
                    {busyId === row.id ? (
                      <ActivityIndicator color={onAccent} size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color={onAccent} />
                        <Text style={[styles.actionText, { color: onAccent }]}>{t('Approve')}</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={busyId === row.id}
                    onPress={() => void onModerate('reject', row)}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: theme.isDark ? 'rgba(255,90,95,0.18)' : '#fff1f2',
                        borderWidth: 1,
                        borderColor: theme.danger,
                        opacity: busyId === row.id ? 0.6 : 1,
                      },
                    ]}>
                    <Ionicons name="close" size={16} color={theme.danger} />
                    <Text style={[styles.actionText, { color: theme.danger }]}>{t('Reject')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
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
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  sub: { fontSize: 13, lineHeight: 18 },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(127,127,127,0.25)',
  },
  panelTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  list: { padding: 14, gap: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  cardMeta: { gap: 2 },
  cardName: { fontSize: 16, fontWeight: '800' },
  cardEmail: { fontSize: 12 },
  avatarStage: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
});
