import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** Leagues hub + contest stack — keeps NativeTabs glass dock visible. */
export default function ContestsStackLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
