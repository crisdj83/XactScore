import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

export default function ContestIndex() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/contests/${id}/predictions` as Href} />;
}
