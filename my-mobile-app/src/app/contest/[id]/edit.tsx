import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useContest } from '@/contexts/contest';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function ContestEditScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { data, refresh } = useContest();
  const [name, setName] = useState(data?.contest.name || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!data) return null;

  if (data.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.textSecondary }}>{t('Only admins can edit this contest.')}</Text>
      </View>
    );
  }

  const saveName = async () => {
    const next = name.trim();
    if (!next) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase
      .from('contests')
      .update({ name: next })
      .eq('id', data.contest.id);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(t('Saved'));
    await refresh();
  };

  const regenerateKey = async () => {
    Alert.alert(t('Regenerate key?'), t('Old invite links will stop working.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Regenerate'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            const key = Math.random().toString(36).substring(2, 9).toLowerCase();
            const { error } = await supabase
              .from('contests')
              .update({ contest_key: key })
              .eq('id', data.contest.id);
            setBusy(false);
            if (error) {
              setMessage(error.message);
              return;
            }
            setMessage(`${t('New key:')} ${key}`);
            await refresh();
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: theme.text }]}>{t('Settings')}</Text>

      <Text style={[styles.label, { color: theme.text }]}>{t('Contest Name *')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.borderStrong,
            backgroundColor: theme.backgroundElement,
          },
        ]}
      />
      <Pressable
        disabled={busy}
        onPress={() => void saveName()}
        style={[styles.btn, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]}>
        {busy ? (
          <ActivityIndicator color={theme.isDark ? '#0f0f10' : '#ffffff'} />
        ) : (
          <Text style={[styles.btnText, { color: theme.isDark ? '#0f0f10' : '#ffffff' }]}>
            {t('Save name')}
          </Text>
        )}
      </Pressable>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
          {t('Key:')}
        </Text>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', letterSpacing: 2 }}>
          {data.contest.contestKey}
        </Text>
        <Pressable onPress={() => void regenerateKey()} style={{ marginTop: 8 }}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>{t('Regenerate key')}</Text>
        </Pressable>
      </View>

      {message ? (
        <Text style={{ color: theme.success, fontWeight: '600' }}>{message}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: 12,
  },
  heading: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  label: { fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  btn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
});
