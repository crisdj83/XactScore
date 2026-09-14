import { Redirect, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

/** Legacy `/contest/:id` → nested Leagues stack (keeps glass tab bar). */
export default function LegacyContestRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/contests/${id}/predictions` as Href} />;
}
