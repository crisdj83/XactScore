import { Stack } from 'expo-router';

/** Leagues hub + contest stack — keeps NativeTabs glass dock visible. */
export default function ContestsStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
