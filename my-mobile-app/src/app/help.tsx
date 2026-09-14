import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Linking } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

export default function HelpScreen() {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}>
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
            'Predict the exact score of every Premier League match in your contest season. Picks lock 60 minutes before kickoff. Other players’ picks reveal 30 minutes before kickoff.'
          )}
        </Text>
        <Text
          style={[styles.link, { color: theme.accent }]}
          onPress={() => void Linking.openURL('https://www.xactscore.app/help')}>
          xactscore.app/help
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21 },
  link: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});
