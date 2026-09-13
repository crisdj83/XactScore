export type ContestSeasonLength = 'full' | 'first_half' | 'second_half';

export function normalizeSeasonLength(
  seasonLength: string | null | undefined
): ContestSeasonLength {
  if (seasonLength === 'half' || seasonLength === 'first_half') return 'first_half';
  if (seasonLength === 'second_half') return 'second_half';
  return 'full';
}

export function isValidSeasonLength(value: string | null | undefined): value is ContestSeasonLength {
  return value === 'full' || value === 'first_half' || value === 'second_half';
}

export function getSeasonLengthLabelKey(
  seasonLength: string | null | undefined
): 'Full season' | 'First half' | 'Second half' {
  const normalized = normalizeSeasonLength(seasonLength);
  if (normalized === 'first_half') return 'First half';
  if (normalized === 'second_half') return 'Second half';
  return 'Full season';
}
