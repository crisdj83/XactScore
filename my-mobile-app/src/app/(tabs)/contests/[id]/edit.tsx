import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { useContest } from '@/contexts/contest';
import { Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';
import {
  normalizeSeasonLength,
  type ContestSeasonLength,
} from '@/lib/contest-season';
import { siteUrl, supabase } from '@/lib/supabase';

function inviteUrl(key: string) {
  const base = siteUrl.replace(/\/$/, '').replace('://xactscore.app', '://www.xactscore.app');
  return `${base}/join/${encodeURIComponent(key.trim().toLowerCase())}`;
}

function randomInviteKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 8; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

function parseWholePoints(raw: string) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 5) return null;
  return n;
}

function parseClosePoints(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 5) return null;
  if ((n * 2) % 1 !== 0) return null;
  return n;
}

export default function ContestEditScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const bottomPad = useBottomTabPadding();
  const { data, refresh } = useContest();

  const [name, setName] = useState(data?.contest.name || '');
  const [seasonLength, setSeasonLength] = useState<ContestSeasonLength>(
    normalizeSeasonLength(data?.contest.seasonLength)
  );
  const [pointsExact, setPointsExact] = useState(String(data?.contest.scoring.exact ?? 3));
  const [pointsClose, setPointsClose] = useState(String(data?.contest.scoring.close ?? 1.5));
  const [pointsResult, setPointsResult] = useState(String(data?.contest.scoring.result ?? 1));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setName(data.contest.name);
    setSeasonLength(normalizeSeasonLength(data.contest.seasonLength));
    setPointsExact(String(data.contest.scoring.exact));
    setPointsClose(String(data.contest.scoring.close));
    setPointsResult(String(data.contest.scoring.result));
  }, [data]);

  if (!data) return null;

  if (data.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.textSecondary }}>{t('Only admins can edit this contest.')}</Text>
      </View>
    );
  }

  const contestId = data.contest.id;
  const isPublic = data.contest.isPublic;
  const onAccent = theme.isDark ? '#0f0f10' : '#ffffff';

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  const saveName = () =>
    void run(async () => {
      const next = name.trim();
      if (!next) throw new Error(t('Please enter a contest name.'));

      if (isPublic) {
        const escaped = next.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
        const { data: existing } = await supabase
          .from('contests')
          .select('id')
          .eq('is_public', true)
          .ilike('name', escaped)
          .neq('id', contestId)
          .limit(1)
          .maybeSingle();
        if (existing) {
          throw new Error(t('A public league with this name already exists. Please choose another name.'));
        }
      }

      const { error: updateError } = await supabase
        .from('contests')
        .update({ name: next })
        .eq('id', contestId);
      if (updateError) throw new Error(updateError.message);
      setMessage(t('Contest name updated successfully.'));
    });

  const saveSeason = () =>
    void run(async () => {
      const { error: updateError } = await supabase
        .from('contests')
        .update({ season_length: seasonLength })
        .eq('id', contestId);
      if (updateError) throw new Error(updateError.message);
      setMessage(t('Season length updated successfully.'));
    });

  const saveScoring = () =>
    void run(async () => {
      const exact = parseWholePoints(pointsExact);
      const close = parseClosePoints(pointsClose);
      const result = parseWholePoints(pointsResult);
      if (exact === null) throw new Error(t('Exact Score points must be a whole number.'));
      if (result === null) throw new Error(t('Correct Result points must be a whole number.'));
      if (close === null) {
        throw new Error(t('Close Prediction points must be in increments of 0.5.'));
      }

      const { error: updateError } = await supabase
        .from('contests')
        .update({
          points_exact: exact,
          points_close: close,
          points_result: result,
        })
        .eq('id', contestId);
      if (updateError) throw new Error(updateError.message);
      setMessage(t('Scoring system updated successfully.'));
    });

  const regenerateKey = () => {
    Alert.alert(t('Regenerate key?'), t('Old invite links will stop working.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Generate New Key'),
        style: 'destructive',
        onPress: () =>
          void run(async () => {
            const key = randomInviteKey();
            const { error: updateError } = await supabase
              .from('contests')
              .update({ contest_key: key })
              .eq('id', contestId);
            if (updateError) throw new Error(updateError.message);
            setMessage(`${t('New key:')} ${key}`);
          }),
      },
    ]);
  };

  const shareInvite = async () => {
    const url = inviteUrl(data.contest.contestKey);
    await Share.share({ message: url, url });
  };

  const deleteLeague = () => {
    Alert.alert(
      t('Delete League'),
      t('Delete this league permanently? All members, predictions, and settings will be removed.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: () =>
            void run(async () => {
              const { error: deleteError } = await supabase
                .from('contests')
                .delete()
                .eq('id', contestId);
              if (deleteError) throw new Error(deleteError.message);
              router.replace('/contests' as Href);
            }),
        },
      ]
    );
  };

  const seasonOptions: {
    value: ContestSeasonLength;
    title: string;
    subtitle: string;
  }[] = [
    {
      value: 'full',
      title: t('Full season'),
      subtitle: t('All 38 Premier League matchdays.'),
    },
    {
      value: 'first_half',
      title: t('First half'),
      subtitle: t('The first 19 Premier League matchdays.'),
    },
    {
      value: 'second_half',
      title: t('Second half'),
      subtitle: t('Matchdays 20 through 38.'),
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled">
      <Text style={[styles.heading, { color: theme.text }]}>{t('Contest Settings')}</Text>
      <Text style={[styles.subhead, { color: theme.textSecondary }]}>
        {t('Manage your league details, rules, and invites.')}
      </Text>

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

      {/* League Details */}
      <Section title={t('League Details')} theme={theme}>
        <Text style={[styles.label, { color: theme.text }]}>{t('Contest Name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: theme.borderStrong,
              backgroundColor: theme.background,
            },
          ]}
        />
        <PrimaryButton
          label={t('Save Name')}
          busy={busy}
          onPress={saveName}
          backgroundColor={theme.accent}
          textColor={onAccent}
        />
      </Section>

      {/* Season Length */}
      <Section title={t('Season Length')} icon="shield-checkmark-outline" theme={theme}>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {t('Choose full season, first half, or second half of the Premier League.')}
        </Text>
        {seasonOptions.map((opt) => {
          const selected = seasonLength === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSeasonLength(opt.value)}
              style={[
                styles.radioCard,
                {
                  borderColor: selected ? theme.accent : theme.border,
                  backgroundColor: theme.background,
                },
              ]}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: selected ? theme.accent : theme.textSecondary },
                ]}>
                {selected ? (
                  <View style={[styles.radioInner, { backgroundColor: theme.accent }]} />
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioTitle, { color: theme.text }]}>{opt.title}</Text>
                <Text style={[styles.radioSub, { color: theme.textSecondary }]}>{opt.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
        <PrimaryButton
          label={t('Save Season Length')}
          busy={busy}
          onPress={saveSeason}
          backgroundColor={theme.accent}
          textColor={onAccent}
        />
      </Section>

      {/* Scoring */}
      <Section title={t('Scoring System')} icon="locate-outline" theme={theme}>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {t('Customize the points awarded. Exact and Result must be whole numbers. Close can use 0.5 increments.')}{' '}
          <Text style={{ fontWeight: '700', color: theme.text }}>
            {t('Maximum 5 points per category.')}
          </Text>
        </Text>
        <View style={styles.scoreGrid}>
          <ScoreField
            label={t('Exact Score')}
            value={pointsExact}
            onChangeText={setPointsExact}
            theme={theme}
          />
          <ScoreField
            label={t('Close Prediction')}
            value={pointsClose}
            onChangeText={setPointsClose}
            theme={theme}
          />
          <ScoreField
            label={t('Correct Result')}
            value={pointsResult}
            onChangeText={setPointsResult}
            theme={theme}
          />
        </View>
        <PrimaryButton
          label={t('Save Scoring Rules')}
          busy={busy}
          onPress={saveScoring}
          backgroundColor={theme.accent}
          textColor={onAccent}
        />
      </Section>

      {/* Invite / Public */}
      {isPublic ? (
        <Section title={t('Public')} icon="globe-outline" theme={theme} accentBorder>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            {t('This league is public. Anyone can join from Join Public — no invite key.')}
          </Text>
        </Section>
      ) : (
        <Section title={t('Secret Invite Key')} icon="key-outline" theme={theme} accentBorder>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            {t('Share this key with friends. If the key leaks, you can generate a new secure code below.')}
          </Text>
          <View
            style={[
              styles.keyBox,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}>
            <Text style={[styles.keyLabel, { color: theme.textSecondary }]}>
              {t('Current Active Key')}
            </Text>
            <Text style={[styles.keyValue, { color: theme.accent }]}>
              {data.contest.contestKey}
            </Text>
            <Pressable onPress={() => void shareInvite()} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={16} color={theme.accent} />
              <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 13 }}>
                {t('Share invite link')}
              </Text>
            </Pressable>
          </View>
          <Pressable
            disabled={busy}
            onPress={regenerateKey}
            style={[
              styles.secondaryBtn,
              {
                borderColor: theme.borderStrong,
                opacity: busy ? 0.6 : 1,
              },
            ]}>
            <Ionicons name="refresh" size={16} color={theme.text} />
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>
              {t('Generate New Key')}
            </Text>
          </Pressable>
        </Section>
      )}

      {/* Danger Zone */}
      <Section title={t('Danger Zone')} icon="trash-outline" theme={theme} danger>
        <Text style={[styles.hint, { color: theme.isDark ? 'rgba(252,165,165,0.85)' : '#b91c1c' }]}>
          {t(
            'Permanently delete this league and all of its members, predictions, and settings. This cannot be undone.'
          )}
        </Text>
        <Pressable
          disabled={busy}
          onPress={deleteLeague}
          style={[styles.dangerBtn, { opacity: busy ? 0.6 : 1 }]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.dangerBtnText}>{t('Delete League')}</Text>
          )}
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  icon,
  theme,
  children,
  accentBorder,
  danger,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  theme: ReturnType<typeof useTheme>;
  children: ReactNode;
  accentBorder?: boolean;
  danger?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: danger
            ? 'rgba(248,113,113,0.35)'
            : accentBorder
              ? theme.accent
              : theme.border,
          borderLeftWidth: accentBorder || danger ? 4 : 1,
          backgroundColor: danger
            ? theme.isDark
              ? 'rgba(248,113,113,0.06)'
              : 'rgba(254,226,226,0.45)'
            : theme.backgroundElement,
        },
      ]}>
      <View style={styles.sectionHead}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={danger ? '#f87171' : theme.accent}
          />
        ) : null}
        <Text
          style={[
            styles.sectionTitle,
            { color: danger ? (theme.isDark ? '#fca5a5' : '#b91c1c') : theme.text },
          ]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function ScoreField({
  label,
  value,
  onChangeText,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.scoreField}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          styles.scoreInput,
          {
            color: theme.text,
            borderColor: theme.borderStrong,
            backgroundColor: theme.background,
          },
        ]}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  busy,
  onPress,
  backgroundColor,
  textColor,
}: {
  label: string;
  busy: boolean;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={[styles.btn, { backgroundColor, opacity: busy ? 0.6 : 1 }]}>
      {busy ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: {
    padding: Spacing.three,
    gap: 14,
  },
  heading: { fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  subhead: { fontSize: 13, lineHeight: 18, marginTop: -6 },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  label: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  btn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 12 },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 999 },
  radioTitle: { fontSize: 14, fontWeight: '700' },
  radioSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  scoreGrid: { gap: 10 },
  scoreField: { gap: 6 },
  scoreInput: { fontVariant: ['tabular-nums'], fontWeight: '700' },
  keyBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  keyLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  keyValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  dangerBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    marginTop: 4,
  },
  dangerBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
});
