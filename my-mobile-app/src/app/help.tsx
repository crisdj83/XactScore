import { ScrollView, StyleSheet, Text, View, Linking, Pressable } from 'react-native';
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

      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('Help')}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {t(
            'Predict the exact score of every Premier League match in your contest season. Picks lock 60 minutes before kickoff. Other players’ picks reveal 30 minutes before kickoff.',
          )}
        </Text>
        <Text
          style={[styles.link, { color: theme.accent }]}
          onPress={() => void Linking.openURL(`${legalBase()}/help`)}>
          xactscore.app/help
        </Text>
        <Text
          style={[styles.link, { color: theme.accent }]}
          onPress={() => void Linking.openURL(`${legalBase()}/privacy`)}>
          {t('Privacy Policy')}
        </Text>
        <Text
          style={[styles.link, { color: theme.accent }]}
          onPress={() => void Linking.openURL('mailto:support@xactscore.app')}>
          support@xactscore.app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
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
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21 },
  link: { fontSize: 14, fontWeight: '700', marginTop: 4, minHeight: 44, paddingTop: 10 },
});
