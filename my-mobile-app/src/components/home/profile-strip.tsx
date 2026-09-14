import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { UserAvatar } from '@/components/user-avatar';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  favoriteTeam: string | null;
  favoriteCrest: string | null;
  isGlobalAdmin: boolean;
  bestRank: number | null;
  onEditPress: () => void;
};

export function HomeProfileStrip({
  username,
  email,
  avatarUrl,
  favoriteTeam,
  favoriteCrest,
  isGlobalAdmin,
  bestRank,
  onEditPress,
}: Props) {
  const theme = useTheme();
  const t = useTranslations();
  const { isDark } = theme;
  const initial = (username || email || '?').charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: isDark ? '#27272a' : theme.border,
        },
      ]}>
      {isDark ? <View pointerEvents="none" style={styles.darkGlow} /> : null}

      {avatarUrl ? (
        <UserAvatar uri={avatarUrl} size={40} preferExpoImage style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: theme.accent }]}>
          <Text style={[styles.avatarLetter, { color: isDark ? '#050506' : '#ffffff' }]}>
            {initial}
          </Text>
        </View>
      )}

      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[styles.username, { color: theme.text }]}>
            {username || t('No username set')}
          </Text>
          {isGlobalAdmin ? (
            <Ionicons name="shield-checkmark" size={14} color={theme.accent} />
          ) : null}
        </View>

        <View style={styles.detailRow}>
          {favoriteCrest ? (
            <Image source={{ uri: favoriteCrest }} style={styles.teamCrest} contentFit="contain" />
          ) : null}
          <Text numberOfLines={1} style={[styles.detailText, { color: isDark ? '#e4e4e7' : '#64748b' }]}>
            {favoriteTeam || t('Not selected')}
          </Text>
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1' }]} />
          <Text style={[styles.detailMuted, { color: isDark ? '#a1a1aa' : '#64748b' }]}>
            {t('Best rank')}
          </Text>
          <Text style={[styles.rank, { color: theme.text }]}>
            {bestRank ? `#${bestRank}` : '—'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onEditPress}
        style={({ pressed }) => [
          styles.editBtn,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : '#f1f5f9',
            borderColor: isDark ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Text style={[styles.editText, { color: isDark ? '#ffedd5' : '#334155' }]}>
          {t('Edit')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  darkGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(234,88,12,0.22)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 14, fontWeight: '700' },
  meta: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  username: { flexShrink: 1, fontSize: 14, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  teamCrest: { width: 16, height: 16 },
  detailText: { flexShrink: 1, fontSize: 13, fontWeight: '600' },
  detailMuted: { fontSize: 13, fontWeight: '500' },
  rank: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  divider: { width: 1, height: 12, marginHorizontal: 2 },
  editBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editText: { fontSize: 12, fontWeight: '700' },
});
