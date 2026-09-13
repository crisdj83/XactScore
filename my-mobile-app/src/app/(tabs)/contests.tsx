import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { APP_TOP_BAR_CONTENT_HEIGHT, AppTopBar } from '@/components/app-top-bar';
import { ContestIcon } from '@/components/contest-icon';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { getSeasonLengthLabelKey, type ContestSeasonLength } from '@/lib/contest-season';
import {
  createContest,
  fetchMyContests,
  fetchPublicContests,
  joinContestWithKey,
  joinPublicContest,
  type PublicContest,
} from '@/lib/contests-api';
import type { ContestMembership } from '@/lib/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'my_contests' | 'join' | 'create';

export default function ContestsScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const onAccentText = theme.isDark ? '#0f0f10' : '#ffffff';

  const [tab, setTab] = useState<Tab>('my_contests');
  const [contests, setContests] = useState<ContestMembership[]>([]);
  const [publicContests, setPublicContests] = useState<PublicContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [joinKey, setJoinKey] = useState('');
  const [createName, setCreateName] = useState('');
  const [seasonLength, setSeasonLength] = useState<ContestSeasonLength>('full');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const joinedIds = useMemo(
    () => new Set(contests.map((row) => row.contest_id)),
    [contests]
  );

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [mine, pub] = await Promise.all([
        fetchMyContests(user.id),
        fetchPublicContests().catch(() => [] as PublicContest[]),
      ]);
      setContests(mine);
      setPublicContests(pub);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
      setContests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const openContest = (contestId: string) => {
    router.push(`/contest/${contestId}/predictions` as Href);
  };

  const onJoinPrivate = async () => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const id = await joinContestWithKey(joinKey, user.id);
      setJoinKey('');
      setTab('my_contests');
      await load();
      openContest(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setBusy(false);
    }
  };

  const onJoinPublic = async (contestId: string) => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    try {
      const id = await joinPublicContest(contestId, user.id);
      setTab('my_contests');
      await load();
      openContest(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async () => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const id = await createContest({
        userId: user.id,
        name: createName,
        seasonLength,
        visibility,
      });
      setCreateName('');
      setTab('my_contests');
      await load();
      openContest(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setBusy(false);
    }
  };

  const topSpacer = insets.top + APP_TOP_BAR_CONTENT_HEIGHT;
  const panelBg = theme.backgroundElement;
  const selectedBg = theme.isDark ? 'rgba(255,138,43,0.15)' : '#e0e7ff';
  const selectedBorder = theme.isDark ? 'rgba(251,146,60,0.5)' : 'transparent';
  const idleBorder = theme.border;

  const tabs: { id: Tab; icon: keyof typeof Ionicons.glyphMap; label: string; short: string }[] = [
    { id: 'my_contests', icon: 'trophy', label: t('My Contests'), short: 'Mine' },
    { id: 'join', icon: 'search', label: t('Join Contest'), short: 'Join' },
    { id: 'create', icon: 'add', label: t('Create Contest'), short: 'New' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topSpacer }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={theme.accent}
            progressViewOffset={topSpacer}
          />
        }>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{t('Contest Hub')}</Text>
          </View>
          <View style={[styles.trophyBadge, { backgroundColor: theme.accent }]}>
            <Ionicons name="trophy" size={22} color={onAccentText} />
          </View>
        </View>

        {error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${theme.danger}18`, borderColor: theme.danger },
            ]}>
            <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}
        {message ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${theme.success}18`, borderColor: theme.success },
            ]}>
            <Text style={{ color: theme.success, fontWeight: '600', fontSize: 13 }}>{message}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.segment,
            {
              backgroundColor: theme.isDark ? 'rgba(9,9,11,0.7)' : panelBg,
              borderColor: theme.border,
            },
          ]}>
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setError(null);
                  setTab(item.id);
                }}
                style={[
                  styles.segmentBtn,
                  active && {
                    backgroundColor: theme.isDark ? 'rgba(255,138,43,0.22)' : '#ffffff',
                    borderColor: theme.isDark ? 'rgba(255,138,43,0.45)' : theme.borderStrong,
                  },
                ]}>
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={active ? theme.accent : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: active ? theme.text : theme.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {item.short}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: panelBg, borderColor: theme.border },
          ]}>
          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginVertical: Spacing.five }} />
          ) : null}

          {!loading && tab === 'my_contests' ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('Your Active Contests')}
              </Text>

              {contests.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    {t('No contests yet')}
                  </Text>
                  <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                    {t(
                      "You haven't joined any prediction leagues. Join an existing one or create your own!"
                    )}
                  </Text>
                  <Pressable onPress={() => setTab('join')}>
                    <Text style={{ color: theme.accent, fontWeight: '700', marginTop: 8 }}>
                      {t('Find a contest to join →')}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                contests.map((membership) => (
                  <Pressable
                    key={membership.contest_id}
                    onPress={() => openContest(membership.contest_id)}
                    style={({ pressed }) => [
                      styles.leagueCard,
                      {
                        backgroundColor: theme.isDark ? 'rgba(9,9,11,0.5)' : theme.background,
                        borderColor: theme.border,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}>
                    <View style={styles.leagueTop}>
                      <View style={styles.leagueIdentity}>
                        <ContestIcon contestId={membership.contest_id} size="sm" />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            numberOfLines={1}
                            style={[styles.leagueName, { color: theme.text }]}>
                            {membership.contests?.name || t('League')}
                          </Text>
                          <Text style={[styles.leagueSeason, { color: theme.textSecondary }]}>
                            {t('Season')}:{' '}
                            {t(getSeasonLengthLabelKey(membership.contests?.season_length))}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor:
                              membership.role === 'admin'
                                ? theme.accentMuted
                                : theme.isDark
                                  ? 'rgba(255,255,255,0.08)'
                                  : '#f1f5f9',
                          },
                        ]}>
                        <Text
                          style={{
                            color:
                              membership.role === 'admin' ? theme.accent : theme.textSecondary,
                            fontSize: 11,
                            fontWeight: '800',
                          }}>
                          {membership.role === 'admin' ? t('Admin') : t('Member')}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.leagueFooter, { borderTopColor: theme.border }]}>
                      {membership.contests?.is_public ? (
                        <View
                          style={[
                            styles.metaPill,
                            {
                              backgroundColor: theme.isDark ? '#18181b' : '#f1f5f9',
                              borderColor: theme.border,
                            },
                          ]}>
                          <Ionicons name="globe-outline" size={12} color={theme.textSecondary} />
                          <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
                            {t('Public')}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.metaPill,
                            {
                              backgroundColor: theme.isDark ? '#18181b' : '#ffffff',
                              borderColor: theme.border,
                            },
                          ]}>
                          <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
                            {t('Key:')}{' '}
                            <Text style={{ color: theme.text, fontWeight: '800' }}>
                              {membership.contests?.contest_key || '—'}
                            </Text>
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.dashboardCta, { color: theme.accent }]}>
                        {t('Dashboard')} ›
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {!loading && tab === 'join' ? (
            <View style={styles.formSection}>
              <Ionicons
                name="globe-outline"
                size={36}
                color={theme.isDark ? theme.accent : theme.textSecondary}
                style={{ alignSelf: 'center' }}
              />
              <Text style={[styles.formTitle, { color: theme.text }]}>{t('Join Public')}</Text>
              <Text style={[styles.formSub, { color: theme.textSecondary }]}>
                {t('Browse public contests that anyone can join without a key.')}
              </Text>

              {publicContests.length === 0 ? (
                <Text style={[styles.formSub, { color: theme.textSecondary, textAlign: 'center' }]}>
                  {t('No public contests yet.')}
                </Text>
              ) : (
                publicContests.slice(0, 8).map((contest) => {
                  const joined = joinedIds.has(contest.id);
                  return (
                    <Pressable
                      key={contest.id}
                      onPress={() =>
                        joined ? openContest(contest.id) : void onJoinPublic(contest.id)
                      }
                      style={[
                        styles.publicRow,
                        { borderColor: theme.border, backgroundColor: theme.background },
                      ]}>
                      <ContestIcon contestId={contest.id} size="xs" />
                      <Text numberOfLines={1} style={[styles.publicName, { color: theme.text }]}>
                        {contest.name}
                      </Text>
                      <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 11 }}>
                        {joined ? t('Open') : t('Join')}
                      </Text>
                    </Pressable>
                  );
                })
              )}

              <View style={styles.orRow}>
                <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.orText, { color: theme.textSecondary, backgroundColor: panelBg }]}>
                  {t('or')}
                </Text>
                <View style={[styles.orLine, { backgroundColor: theme.border }]} />
              </View>

              <Ionicons
                name="lock-closed"
                size={36}
                color={theme.isDark ? theme.accent : theme.textSecondary}
                style={{ alignSelf: 'center' }}
              />
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {t('Join a Private Contest')}
              </Text>
              <Text style={[styles.formSub, { color: theme.textSecondary }]}>
                {t('Enter the 7-character invitation key provided by the contest administrator.')}
              </Text>

              <Text style={[styles.label, { color: theme.text }]}>{t('Contest Key *')}</Text>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                value={joinKey}
                onChangeText={setJoinKey}
                placeholder="e.g. btyfwtx"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.borderStrong,
                    backgroundColor: theme.background,
                  },
                ]}
              />
              <Pressable
                disabled={busy || joinKey.trim().length < 3}
                onPress={() => void onJoinPrivate()}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: theme.isDark ? '#27272a' : theme.accent,
                    opacity: busy || joinKey.trim().length < 3 ? 0.5 : 1,
                  },
                ]}>
                {busy ? (
                  <ActivityIndicator color={theme.isDark ? theme.accent : onAccentText} />
                ) : (
                  <Text
                    style={[
                      styles.primaryBtnText,
                      { color: theme.isDark ? theme.text : onAccentText },
                    ]}>
                    {t('Join Private')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {!loading && tab === 'create' ? (
            <View style={styles.formSection}>
              <Ionicons
                name="add-circle-outline"
                size={36}
                color={theme.isDark ? theme.accent : theme.textSecondary}
                style={{ alignSelf: 'center' }}
              />
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {t('Create a New Contest')}
              </Text>
              <Text style={[styles.formSub, { color: theme.textSecondary }]}>
                {t('Create your own prediction league and invite your friends to compete.')}
              </Text>

              <Text style={[styles.label, { color: theme.text }]}>{t('Contest Name *')}</Text>
              <TextInput
                value={createName}
                onChangeText={setCreateName}
                placeholder="e.g. Office Premier League 24/25"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  styles.nameInput,
                  {
                    color: theme.text,
                    borderColor: theme.borderStrong,
                    backgroundColor: theme.background,
                  },
                ]}
              />

              <Text style={[styles.label, { color: theme.text }]}>{t('Season Length')}</Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                {t('Choose full season, first half, or second half of the Premier League.')}
              </Text>
              {(
                [
                  {
                    value: 'full' as const,
                    title: t('Full season'),
                    detail: t('All 38 Premier League matchdays.'),
                  },
                  {
                    value: 'first_half' as const,
                    title: t('First half'),
                    detail: t('The first 19 Premier League matchdays.'),
                  },
                  {
                    value: 'second_half' as const,
                    title: t('Second half'),
                    detail: t('Matchdays 20 through 38.'),
                  },
                ] as const
              ).map((option) => {
                const active = seasonLength === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setSeasonLength(option.value)}
                    style={[
                      styles.choiceCard,
                      {
                        backgroundColor: active ? selectedBg : theme.background,
                        borderColor: active ? selectedBorder : idleBorder,
                      },
                    ]}>
                    <Text style={[styles.choiceTitle, { color: theme.text }]}>{option.title}</Text>
                    <Text style={[styles.choiceDetail, { color: theme.textSecondary }]}>
                      {option.detail}
                    </Text>
                  </Pressable>
                );
              })}

              <View style={styles.visibilityRow}>
                {(
                  [
                    {
                      value: 'public' as const,
                      icon: 'globe-outline' as const,
                      title: t('Public'),
                      detail: t('Anyone can join this league. No invite key needed.'),
                    },
                    {
                      value: 'private' as const,
                      icon: 'lock-closed' as const,
                      title: t('Private'),
                      detail: t('Only people with the invite key can join.'),
                    },
                  ] as const
                ).map((option) => {
                  const active = visibility === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setVisibility(option.value)}
                      style={[
                        styles.visibilityCard,
                        {
                          backgroundColor: active ? selectedBg : theme.background,
                          borderColor: active ? selectedBorder : idleBorder,
                        },
                      ]}>
                      <Ionicons
                        name={option.icon}
                        size={16}
                        color={theme.isDark ? theme.accent : theme.textSecondary}
                      />
                      <Text style={[styles.choiceTitle, { color: theme.text }]}>{option.title}</Text>
                      <Text style={[styles.choiceDetail, { color: theme.textSecondary }]}>
                        {option.detail}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                disabled={busy || !createName.trim()}
                onPress={() => void onCreate()}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: theme.accent,
                    opacity: busy || !createName.trim() ? 0.5 : 1,
                  },
                ]}>
                {busy ? (
                  <ActivityIndicator color={onAccentText} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: onAccentText }]}>
                    {visibility === 'public'
                      ? t('Create Public Contest')
                      : t('Create & Generate Key')}
                  </Text>
                )}
              </Pressable>
              <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
                {t('You will automatically become the Admin. You can customize settings after creation.')}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.topOverlay} pointerEvents="box-none">
        <AppTopBar includeSafeArea />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trophyBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 6,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 200,
  },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  empty: { gap: 6, paddingVertical: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyBody: { fontSize: 14, lineHeight: 20 },
  leagueCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minHeight: 120,
    gap: 12,
  },
  leagueTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  leagueIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  leagueName: { fontSize: 17, fontWeight: '700' },
  leagueSeason: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  leagueFooter: {
    marginTop: 'auto',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dashboardCta: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formSection: { gap: 10 },
  formTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  formSub: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  publicRow: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  publicName: { flex: 1, fontSize: 14, fontWeight: '600' },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  hint: { fontSize: 12, lineHeight: 16, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  nameInput: {
    textAlign: 'left',
    fontWeight: '600',
    letterSpacing: 0,
    textTransform: 'none',
  },
  primaryBtn: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  choiceCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  choiceTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  choiceDetail: { fontSize: 11, lineHeight: 15 },
  visibilityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  visibilityCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
});
