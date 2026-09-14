function kitSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Relative path the website serves as SVG avatar. */
export function soccerAvatarPath(seed: string, teamName?: string | null) {
  const safeSeed = seed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'xact';
  const kit = teamName ? kitSlug(teamName) : '';
  const params = new URLSearchParams({ s: safeSeed });
  if (kit) params.set('kit', kit);
  return `/api/avatar?${params.toString()}`;
}
