import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SvgXml } from 'react-native-svg';

import { renderSoccerAvatar } from '@/lib/soccer-avatar';
import { siteUrl } from '@/lib/supabase';

function resolveMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = siteUrl.replace('://xactscore.app', '://www.xactscore.app');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function soccerAvatarXml(path: string | null | undefined) {
  if (!path || !path.includes('/api/avatar')) return null;
  try {
    const url = new URL(path, 'https://xactscore.app');
    const svg = renderSoccerAvatar(url.searchParams.get('s') || 'xact', url.searchParams.get('kit'));
    return svg.replace(/^<\?xml[^>]*>\s*/i, '');
  } catch {
    return null;
  }
}

type Props = {
  uri: string | null | undefined;
  size: number;
  style?: StyleProp<ViewStyle>;
  preferExpoImage?: boolean;
};

/** Renders profile photos and local soccer SVG avatars (RN Image cannot show remote SVG). */
export function UserAvatar({ uri, size, style, preferExpoImage }: Props) {
  const xml = soccerAvatarXml(uri);
  const resolved = xml ? null : resolveMediaUrl(uri);
  const radius = size / 2;
  const box = [{ width: size, height: size, borderRadius: radius, overflow: 'hidden' as const }, style];
  const imgStyle: StyleProp<ImageStyle> = {
    width: size,
    height: size,
    borderRadius: radius,
  };

  if (xml) {
    return (
      <View style={box}>
        <SvgXml xml={xml} width={size} height={size} />
      </View>
    );
  }

  if (!resolved) return null;

  if (preferExpoImage) {
    return <ExpoImage source={{ uri: resolved }} style={[imgStyle, style as ImageStyle]} contentFit="cover" />;
  }

  return <Image source={{ uri: resolved }} style={imgStyle} />;
}

export { soccerAvatarXml, resolveMediaUrl };
