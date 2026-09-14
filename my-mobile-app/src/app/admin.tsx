import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Linking } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { Redirect } from 'expo-router';

export default function AdminScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { profile } = useAuth();

  if (!profile?.is_global_admin) {
    return <Redirect href="/" />;
  }

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
        <Text style={[styles.title, { color: theme.text }]}>{t('Admin')}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {t('Global admin tools live on the website for now.')}
        </Text>
        <Text
          style={[styles.link, { color: theme.accent }]}
          onPress={() => void Linking.openURL('https://www.xactscore.app/admin')}>
          xactscore.app/admin
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
