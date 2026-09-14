import { usePathname, useRouter, type Href } from 'expo-router';

import { GlassSegmented, type GlassSegmentItem } from '@/components/glass-segmented';
import { useTranslations } from '@/contexts/locale';
import { StyleSheet } from 'react-native';

/**
 * Contest hub tabs — glass track + sliding selection pill (NativeTabs look).
 */
export function ContestNavPill({
  contestId,
  isAdmin,
}: {
  contestId: string;
  isAdmin: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const items: (GlassSegmentItem & { href: string })[] = [
    {
      key: 'predictions',
      href: `/contests/${contestId}/predictions`,
      label: t('Predictions'),
      icon: 'locate',
    },
    {
      key: 'ranking',
      href: `/contests/${contestId}/ranking`,
      label: t('Table'),
      icon: 'stats-chart',
    },
    {
      key: 'fixtures',
      href: `/contests/${contestId}/fixtures`,
      label: t('Fixtures'),
      icon: 'calendar',
    },
    {
      key: 'rules',
      href: `/contests/${contestId}/rules`,
      label: t('Rules'),
      icon: 'book',
      iconOnly: true,
    },
    ...(isAdmin
      ? [
          {
            key: 'edit',
            href: `/contests/${contestId}/edit`,
            label: t('Settings'),
            icon: 'settings' as const,
            iconOnly: true,
          },
        ]
      : []),
  ];

  const active =
    items.find((item) => pathname.includes(`/${item.key}`))?.key || items[0]?.key || 'predictions';

  return (
    <GlassSegmented
      style={styles.wrap}
      items={items}
      value={active}
      itemHeight={52}
      distribution="split"
      onChange={(key) => {
        const target = items.find((item) => item.key === key);
        if (target) router.push(target.href as Href);
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 6,
  },
});
