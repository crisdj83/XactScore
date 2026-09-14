import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { siteUrl } from '@/lib/supabase';

function legalBase() {
  return siteUrl.replace(/\/$/, '').replace('://xactscore.app', '://www.xactscore.app');
}

const SECTIONS = [
  {
    title: 'Getting started',
    body: 'Create an account, choose a username, then open Leagues to join a league or create your own.',
  },
  {
    title: 'Making predictions',
    body: 'Open a league and go to Predictions to see the fixture calendar. Choose a score for both teams; you can change it until picks lock, 60 minutes before kickoff. Other players’ picks reveal 30 minutes before kickoff.',
  },
  {
    title: 'Scoring and rankings',
    body: 'You earn the most points for an exact score, with additional points for a close prediction or the correct result. Check Table to follow your progress against the rest of your league.',
  },
  {
    title: 'Contests and invites',
    body: 'League admins can choose full season, first half, or second half, customize scoring, and share an invite link with friends. You can belong to multiple leagues at once.',
  },
  {
    title: 'Your profile',
    body: 'Use Profile to update your username, favorite Premier League team, avatar, personal quote, and match reminder settings. Your profile helps your league recognize you.',
  },
  {
    title: 'Messages',
    body: 'Messages are discussions between members of your leagues. Open a title to read the thread and reply. Use them to talk about fixtures, banter, and league news.',
  },
  {
    title: 'Match reminders',
    body: 'In Profile, turn on Match reminders and pick 1h, 2h, 3h, or 4h before kickoff. You only get a ping if you still have open picks. Picks still lock 60 minutes before kickoff.',
  },
  {
    title: 'Safety',
    body: 'To report or block someone, open a message thread, tap the flag, then choose Report or Block user. Blocked content disappears from your feed immediately. Manage blocks in Profile.',
  },
] as const;

function HelpSection({
  title,
  body,
  defaultOpen = false,
}: {
  title: string;
  body: string;
  defaultOpen?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={styles.sectionHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.accent}
        />
      </Pressable>
      {open ? (
        <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>{body}</Text>
      ) : null}
    </View>
  );
}

export default function HelpScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five },
      ]}
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={[styles.backBtn, { borderColor: theme.border }]}>
        <Ionicons name="chevron-back" size={18} color={theme.text} />
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{t('Back')}</Text>
      </Pressable>

      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.accentMuted, borderColor: theme.border },
          ]}>
          <Ionicons name="help-circle" size={22} color={theme.accent} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.title, { color: theme.text }]}>{t('Help')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('Everything you need to get the most from XactScore.')}
          </Text>
        </View>
      </View>

      {SECTIONS.map((section, index) => (
        <HelpSection
          key={section.title}
          title={t(section.title)}
          body={t(section.body)}
          defaultOpen={index === 0}
        />
      ))}

      <View
        style={[
          styles.linksCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <Text style={[styles.linksTitle, { color: theme.text }]}>{t('Support & legal')}</Text>
        <Pressable
          onPress={() => void Linking.openURL(`${legalBase()}/help`)}
          style={[styles.linkRow, { borderColor: theme.border }]}>
          <Ionicons name="globe-outline" size={18} color={theme.accent} />
          <Text style={[styles.linkLabel, { color: theme.text }]}>xactscore.app/help</Text>
          <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(`${legalBase()}/privacy`)}
          style={[styles.linkRow, { borderColor: theme.border }]}>
          <Ionicons name="document-text-outline" size={18} color={theme.accent} />
          <Text style={[styles.linkLabel, { color: theme.text }]}>{t('Privacy Policy')}</Text>
          <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(`${legalBase()}/terms`)}
          style={[styles.linkRow, { borderColor: theme.border }]}>
          <Ionicons name="reader-outline" size={18} color={theme.accent} />
          <Text style={[styles.linkLabel, { color: theme.text }]}>{t('Terms of Use')}</Text>
          <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL('mailto:support@xactscore.app')}
          style={[styles.linkRow, { borderColor: theme.border }]}>
          <Ionicons name="mail-outline" size={18} color={theme.accent} />
          <Text style={[styles.linkLabel, { color: theme.text }]}>{t('Contact support')}</Text>
          <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
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
    marginBottom: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: Spacing.one,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionBody: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    fontSize: 14,
    lineHeight: 21,
  },
  linksCard: {
    marginTop: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  linksTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  linkRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});
