import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTheme } from '@/hooks/use-theme';
import { normalizeMessages } from '@/lib/normalize';
import { supabase } from '@/lib/supabase';
import type { LeagueMessage } from '@/lib/types';

export default function MessagesScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<LeagueMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);

    const { data: memberships, error: memberError } = await supabase
      .from('contest_members')
      .select('contest_id')
      .eq('user_id', user.id);

    if (memberError) {
      setError(memberError.message);
      setMessages([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const contestIds = (memberships || []).map((m) => m.contest_id);
    if (!contestIds.length) {
      setMessages([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error: messageError } = await supabase
      .from('messages')
      .select(
        'id, contest_id, author_id, title, body, created_at, users(username, email), contests(name)'
      )
      .in('contest_id', contestIds)
      .order('created_at', { ascending: false })
      .limit(40);

    if (messageError) {
      setError(messageError.message);
      setMessages([]);
    } else {
      setMessages(normalizeMessages(data));
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={theme.accent}
            />
          }>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Messages
            </ThemedText>
            <ThemedText themeColor="textSecondary">League chat from your contests.</ThemedText>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: Spacing.five }} />
          ) : error ? (
            <ThemedText themeColor="danger">{error}</ThemedText>
          ) : messages.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="default">No messages yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                When someone posts in a league you are in, it will show up here.
              </ThemedText>
            </View>
          ) : (
            messages.map((message) => {
              const author = message.users?.username || message.users?.email || 'Member';
              const league = message.contests?.name || 'League';
              return (
                <View
                  key={message.id}
                  style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {league} · {author}
                  </ThemedText>
                  <ThemedText type="default">{message.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" numberOfLines={4}>
                    {message.body}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {new Date(message.created_at).toLocaleString()}
                  </ThemedText>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: { gap: Spacing.one, paddingTop: Spacing.three, marginBottom: Spacing.two },
  title: { fontSize: 28, lineHeight: 34 },
  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.one },
  empty: { borderRadius: 16, padding: Spacing.four, gap: Spacing.two },
});
