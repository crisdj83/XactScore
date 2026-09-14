import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeModeControl } from '@/components/theme-mode-control';
import { UserAvatar } from '@/components/user-avatar';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';
import {
  PREMIER_LEAGUE_TEAMS,
  WORLD_TEAMS,
  findFavoriteTeam,
  type FavoriteTeam,
} from '@/lib/favorite-teams';
import { confirmDeleteAccount, deleteAccount } from '@/lib/account-api';
import { soccerAvatarPath } from '@/lib/soccer-avatar';
import { siteUrl, supabase } from '@/lib/supabase';

const MOTTOS = ['Play to win', 'Trust the process', 'Never stop scoring', 'Own the table'];
const QUOTE_MAX = 18;
const AVATAR_SIZE = 108;

function legalBase() {
  return siteUrl.replace(/\/$/, '').replace('://xactscore.app', '://www.xactscore.app');
}

export default function ProfileScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = useBottomTabPadding();
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [username, setUsername] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [motto, setMotto] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setFavoriteTeam(profile.favorite_team || '');
    setMotto(profile.quote || '');
    if (profile.pending_avatar_url) {
      setAvatarUrl(profile.pending_avatar_url);
      setIsPending(true);
    } else {
      setAvatarUrl(profile.avatar_url || '');
      setIsPending(false);
    }
  }, [profile]);

  const selectedTeam = useMemo(() => findFavoriteTeam(favoriteTeam), [favoriteTeam]);
  const onAccent = theme.isDark ? '#0f0f10' : '#ffffff';
  const email = profile?.email || user?.email || '—';

  const appearanceLabel =
    theme.preference === 'system'
      ? t('Follow phone')
      : theme.preference === 'dark'
        ? t('Dark mode')
        : t('Light mode');

  const generateAvatar = () => {
    const seed = Math.random().toString(36).slice(2, 10);
    setAvatarUrl(soccerAvatarPath(seed, favoriteTeam || undefined));
    setIsPending(false);
  };

  const saveProfile = async () => {
    if (!user || busy) return;
    const nextUsername = username.trim();
    if (!nextUsername) {
      setError(t('Username is required.'));
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const quote = motto.trim().slice(0, QUOTE_MAX);
      const payload: {
        username: string;
        favorite_team: string;
        quote: string;
        pending_avatar_url?: string | null;
        avatar_url?: string | null;
      } = {
        username: nextUsername,
        favorite_team: favoriteTeam,
        quote,
      };

      let success = t('Profile updated successfully!');

      if (avatarUrl && avatarUrl !== profile?.avatar_url) {
        payload.pending_avatar_url = avatarUrl;
        success = t('Profile updated! Your new picture is pending admin approval.');
      } else if (!avatarUrl) {
        payload.avatar_url = null;
        payload.pending_avatar_url = null;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(payload)
        .eq('id', user.id);

      if (updateError) throw new Error(updateError.message);

      await refreshProfile();
      setMessage(success);
      if (payload.pending_avatar_url) setIsPending(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async () => {
    if (!user?.email || passwordBusy) return;
    setPasswordBusy(true);
    setMessage(null);
    setError(null);

    try {
      if (!currentPassword) throw new Error(t('Current password is incorrect'));
      if (newPassword.length < 6) throw new Error(t('Password must be at least 6 characters.'));
      if (newPassword !== confirmPassword) throw new Error(t('New passwords do not match'));
      if (currentPassword === newPassword) {
        throw new Error(t('New password must be different from your current password'));
      }

      const { error: currentError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (currentError) throw new Error(t('Current password is incorrect'));

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw new Error(updateError.message);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(t('Password updated successfully!'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{t('Your Profile')}</Text>
          <Text style={[styles.subhead, { color: theme.textSecondary }]}>
            {t('Your XactScore account')}
          </Text>
          <Text style={[styles.emailLine, { color: theme.textSecondary }]}>{email}</Text>
          {profile?.is_global_admin ? (
            <View style={[styles.adminPill, { backgroundColor: theme.accentMuted }]}>
              <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 11 }}>
                {t('Global admin')}
              </Text>
            </View>
          ) : null}
          {profile?.is_global_admin ? (
            <Pressable
              onPress={() => router.push('/admin')}
              style={[
                styles.adminEntry,
                {
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  borderColor: theme.border,
                },
              ]}>
              <Ionicons name="shield-checkmark" size={16} color={theme.accent} />
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                {t('Admin panel')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {message ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: 'rgba(16,185,129,0.12)',
                borderColor: 'rgba(16,185,129,0.35)',
              },
            ]}>
            <Text style={{ color: theme.success, fontWeight: '600', fontSize: 13 }}>{message}</Text>
          </View>
        ) : null}
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

        {/* Profile picture + identity */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={styles.sectionHead}>
            <Ionicons name="image-outline" size={18} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('Profile Picture / Logo')}
            </Text>
          </View>

          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <View
                style={[
                  styles.avatarBox,
                  {
                    borderColor: isPending
                      ? 'rgba(251,191,36,0.7)'
                      : theme.borderStrong,
                    opacity: isPending ? 0.8 : 1,
                  },
                ]}>
                {avatarUrl ? (
                  <UserAvatar uri={avatarUrl} size={AVATAR_SIZE} />
                ) : (
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{t('No Image')}</Text>
                )}
              </View>
              {isPending ? (
                <View style={[styles.pendingBadge, { backgroundColor: theme.accent }]}>
                  <Ionicons name="time-outline" size={12} color={onAccent} />
                  <Text style={[styles.pendingText, { color: onAccent }]}>{t('Pending')}</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={generateAvatar}
              style={[
                styles.secondaryBtn,
                { borderColor: theme.borderStrong, backgroundColor: theme.background },
              ]}>
              <Ionicons name="refresh" size={16} color={theme.text} />
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
                {t('Auto-Generate Avatar')}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>{t('Username')}</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="ScoreMaster99"
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

          <Text style={[styles.label, { color: theme.text }]}>{t('Favorite Team')}</Text>
          <Pressable
            onPress={() => setTeamOpen(true)}
            style={[
              styles.teamBtn,
              {
                borderColor: theme.borderStrong,
                backgroundColor: theme.background,
              },
            ]}>
            <View style={styles.teamBtnLeft}>
              {selectedTeam ? (
                <Image source={{ uri: selectedTeam.crest }} style={styles.teamCrest} />
              ) : (
                <View style={[styles.teamCrestFallback, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={{ fontSize: 10 }}>⚽</Text>
                </View>
              )}
              <Text
                numberOfLines={1}
                style={{
                  color: favoriteTeam ? theme.text : theme.textSecondary,
                  fontWeight: '600',
                  flex: 1,
                }}>
                {favoriteTeam || t('Select a team...')}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
          </Pressable>

          <Text style={[styles.label, { color: theme.text }]}>{t('Player motto')}</Text>
          <View style={styles.mottoRow}>
            <TextInput
              value={motto}
              onChangeText={(v) => setMotto(v.slice(0, QUOTE_MAX))}
              maxLength={QUOTE_MAX}
              placeholder={t('Enter a short motto')}
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                styles.mottoInput,
                {
                  color: theme.text,
                  borderColor: theme.borderStrong,
                  backgroundColor: theme.background,
                },
              ]}
            />
            <Pressable
              onPress={() =>
                setMotto(MOTTOS[Math.floor(Math.random() * MOTTOS.length)])
              }
              style={[
                styles.mottoBtn,
                { borderColor: theme.borderStrong, backgroundColor: theme.background },
              ]}>
              <Text style={[styles.mottoBtnText, { color: theme.text }]}>
                {t('Generate motto')}
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.counter, { color: theme.textSecondary }]}>
            {motto.length}/{QUOTE_MAX}
          </Text>

          <Pressable
            disabled={busy}
            onPress={() => void saveProfile()}
            style={[styles.primaryBtn, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]}>
            {busy ? (
              <ActivityIndicator color={onAccent} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: onAccent }]}>
                {t('Save Profile')}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Appearance + language */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Appearance')}</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{appearanceLabel}</Text>
          <ThemeModeControl compact={false} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Language')}</Text>
          <View style={styles.langRow}>
            <LanguageSwitcher />
          </View>
        </View>

        {/* Password */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={styles.sectionHead}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('Change Password')}
            </Text>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>{t('Current password')}</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.borderStrong,
                backgroundColor: theme.background,
              },
            ]}
          />
          <Text style={[styles.label, { color: theme.text }]}>{t('New password')}</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.borderStrong,
                backgroundColor: theme.background,
              },
            ]}
          />
          <Text style={[styles.label, { color: theme.text }]}>{t('Confirm new password')}</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
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
            disabled={passwordBusy}
            onPress={() => void updatePassword()}
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.accent, opacity: passwordBusy ? 0.6 : 1 },
            ]}>
            {passwordBusy ? (
              <ActivityIndicator color={onAccent} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: onAccent }]}>
                {t('Update Password')}
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Support & legal')}</Text>
          <Pressable
            onPress={() => router.push('/help')}
            style={[styles.linkRow, { borderColor: theme.border }]}>
            <Ionicons name="help-circle-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{t('Help')}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL(`${legalBase()}/privacy`)}
            style={[styles.linkRow, { borderColor: theme.border }]}>
            <Ionicons name="document-text-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{t('Privacy Policy')}</Text>
            <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL(`${legalBase()}/terms`)}
            style={[styles.linkRow, { borderColor: theme.border }]}>
            <Ionicons name="reader-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{t('Terms of Use')}</Text>
            <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL('mailto:support@xactscore.app')}
            style={[styles.linkRow, { borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{t('Contact support')}</Text>
            <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={[styles.signOut, { backgroundColor: theme.danger }]}>
          <Text style={styles.signOutText}>{t('Sign out')}</Text>
        </Pressable>

        <Pressable
          disabled={deleteBusy}
          onPress={() =>
            confirmDeleteAccount(() => {
              setDeleteBusy(true);
              setError(null);
              void deleteAccount()
                .catch((err) => {
                  setError(err instanceof Error ? err.message : t('Request failed'));
                  Alert.alert(t('Delete account'), err instanceof Error ? err.message : t('Request failed'));
                })
                .finally(() => setDeleteBusy(false));
            })
          }
          style={[
            styles.deleteAccount,
            {
              borderColor: theme.danger,
              opacity: deleteBusy ? 0.6 : 1,
            },
          ]}>
          {deleteBusy ? (
            <ActivityIndicator color={theme.danger} />
          ) : (
            <Text style={[styles.deleteAccountText, { color: theme.danger }]}>
              {t('Delete account')}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal
        visible={teamOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTeamOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTeamOpen(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.backgroundElement,
                paddingBottom: insets.bottom + 16,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('Favorite Team')}</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              <TeamOption
                label={t('None')}
                onPress={() => {
                  setFavoriteTeam('');
                  setTeamOpen(false);
                }}
                theme={theme}
              />
              <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>
                {t('Premier League')}
              </Text>
              {PREMIER_LEAGUE_TEAMS.map((team) => (
                <TeamOption
                  key={team.name}
                  team={team}
                  selected={favoriteTeam === team.name}
                  onPress={() => {
                    setFavoriteTeam(team.name);
                    setTeamOpen(false);
                  }}
                  theme={theme}
                />
              ))}
              <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>
                {t('World clubs')}
              </Text>
              {WORLD_TEAMS.map((team) => (
                <TeamOption
                  key={team.name}
                  team={team}
                  selected={favoriteTeam === team.name}
                  onPress={() => {
                    setFavoriteTeam(team.name);
                    setTeamOpen(false);
                  }}
                  theme={theme}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function TeamOption({
  team,
  label,
  selected,
  onPress,
  theme,
}: {
  team?: FavoriteTeam;
  label?: string;
  selected?: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.teamOption,
        selected ? { backgroundColor: `${theme.accent}18` } : null,
      ]}>
      {team ? (
        <Image source={{ uri: team.crest }} style={styles.teamCrest} />
      ) : (
        <View style={[styles.teamCrestFallback, { backgroundColor: theme.background }]}>
          <Text style={{ fontSize: 10 }}>⚽</Text>
        </View>
      )}
      <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>
        {team?.name || label}
      </Text>
      {selected ? <Ionicons name="checkmark" size={18} color={theme.accent} /> : null}
    </Pressable>
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
    gap: 14,
  },
  header: { gap: 4 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  subhead: { fontSize: 14 },
  emailLine: { fontSize: 13, marginTop: 2 },
  adminPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adminEntry: {
    marginTop: 10,
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  banner: { borderWidth: 1, borderRadius: 12, padding: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  avatarRow: { gap: 12, alignItems: 'flex-start' },
  avatarWrap: { position: 'relative' },
  avatarBox: {
    width: 112,
    height: 112,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  avatarImg: { width: '100%', height: '100%' },
  pendingBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingText: { fontSize: 10, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  teamBtn: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  teamBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  teamCrest: { width: 22, height: 22 },
  teamCrestFallback: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mottoRow: { gap: 8 },
  mottoInput: { flexGrow: 1 },
  mottoBtn: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  mottoBtnText: { fontSize: 13, fontWeight: '700' },
  counter: { fontSize: 11, fontWeight: '700', marginTop: -4 },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 6 },
  langRow: { alignItems: 'flex-start' },
  signOut: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  deleteAccount: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  deleteAccountText: { fontWeight: '800', fontSize: 15 },
  linkRow: {
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
});
