import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'ellipse',
  'football',
  'trophy',
  'medal',
];

function iconIndex(value: string) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % ICONS.length;
}

type Props = {
  contestId: string;
  size?: 'xs' | 'sm' | 'md';
};

/** Matches website ContestIcon: orange gradient tile + deterministic icon. */
export function ContestIcon({ contestId, size = 'md' }: Props) {
  const icon = ICONS[iconIndex(contestId || 'xactscore')];
  const box = size === 'xs' ? 20 : size === 'sm' ? 36 : 48;
  const iconSize = size === 'xs' ? 12 : size === 'sm' ? 20 : 24;
  const radius = size === 'xs' ? 6 : 12;

  return (
    <View
      style={[
        styles.mark,
        {
          width: box,
          height: box,
          borderRadius: radius,
        },
      ]}>
      <Ionicons name={icon} size={iconSize} color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.4)',
    backgroundColor: '#ea580c',
    shadowColor: '#9a3412',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
