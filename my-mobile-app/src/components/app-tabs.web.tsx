import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { GlassTabColors, glassTabPalette } from '@/constants/glass-tabs';
import { useTheme } from '@/hooks/use-theme';

/** Web fallback for native tabs (mirrors app-tabs.tsx). */
export default function AppTabs() {
  const theme = useTheme();
  const palette = glassTabPalette(theme.isDark);

  return (
    <NativeTabs
      backgroundColor="transparent"
      indicatorColor={palette.indicator}
      labelStyle={{
        default: { color: palette.inactive },
        selected: { color: GlassTabColors.active },
      }}
      iconColor={{
        default: palette.inactive,
        selected: GlassTabColors.active,
      }}
      tintColor={GlassTabColors.active}
      shadowColor="transparent">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="contests">
        <NativeTabs.Trigger.Label>Leagues</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="trophy.fill" md="emoji_events" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" md="chat" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
