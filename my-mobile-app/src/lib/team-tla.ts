export type TeamNameParts = {
  name: string;
  shortName?: string;
  tla?: string | null;
};

const TLA_BY_KEY: Record<string, string> = {
  arsenal: 'ARS',
  'aston villa': 'AVL',
  bournemouth: 'BOU',
  'afc bournemouth': 'BOU',
  brentford: 'BRE',
  brighton: 'BHA',
  'brighton and hove albion': 'BHA',
  burnley: 'BUR',
  chelsea: 'CHE',
  'crystal palace': 'CRY',
  everton: 'EVE',
  fulham: 'FUL',
  ipswich: 'IPS',
  'ipswich town': 'IPS',
  leeds: 'LEE',
  'leeds united': 'LEE',
  leicester: 'LEI',
  'leicester city': 'LEI',
  liverpool: 'LIV',
  'manchester city': 'MCI',
  'man city': 'MCI',
  'manchester united': 'MUN',
  'man united': 'MUN',
  'man utd': 'MUN',
  newcastle: 'NEW',
  'newcastle united': 'NEW',
  'nottingham forest': 'NFO',
  'nottm forest': 'NFO',
  southampton: 'SOU',
  sunderland: 'SUN',
  sunderlandafc: 'SUN',
  tottenham: 'TOT',
  'tottenham hotspur': 'TOT',
  spurs: 'TOT',
  'west ham': 'WHU',
  'west ham united': 'WHU',
  wolves: 'WOL',
  wolverhampton: 'WOL',
  'wolverhampton wanderers': 'WOL',
};

function clubKey(value: string | undefined) {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(afc|fc)\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function teamTla(team: TeamNameParts) {
  const fromApi = team.tla?.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  if (fromApi?.length === 3) return fromApi;

  for (const raw of [team.shortName, team.name]) {
    const mapped = TLA_BY_KEY[clubKey(raw)];
    if (mapped) return mapped;
  }

  const letters = (team.shortName || team.name).replace(/[^A-Za-z]/g, '');
  return letters.slice(0, 3).toUpperCase();
}
