import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ContestNavPill } from '@/components/contest/contest-nav-pill';
import { ContestProvider, useContest } from '@/contexts/contest';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

function ContestShell() {
  const theme = useTheme();
  const t = useTranslations();
  const { contestId, data, loading, error, refresh } = useContest();
  const isAdmin = data?.role === 'admin';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {data ? <ContestNavPill contestId={contestId} isAdmin={isAdmin} /> : null}

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : error && !data ? (
        <View style={styles.center}>
          <Text style={{ color: theme.danger, textAlign: 'center', paddingHorizontal: 24 }}>
            {error}
          </Text>
          <Pressable onPress={() => void refresh()} style={{ marginTop: 12 }}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>{t('Retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
              animation: 'fade',
            }}
          />
        </View>
      )}
    </View>
  );
}

export default function ContestLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contestId = String(id || '');

  return (
    <ContestProvider contestId={contestId}>
      <ContestShell />
    </ContestProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
