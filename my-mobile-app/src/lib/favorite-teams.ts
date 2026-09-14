export type FavoriteTeam = {
  name: string
  crest: string
}

const espnCrest = (id: number) => `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`
const fdCrest = (id: number) => `https://crests.football-data.org/${id}.png`

export const PREMIER_LEAGUE_TEAMS: FavoriteTeam[] = [
  { name: 'Arsenal', crest: espnCrest(359) },
  { name: 'Aston Villa', crest: espnCrest(362) },
  { name: 'Bournemouth', crest: espnCrest(349) },
  { name: 'Brentford', crest: espnCrest(337) },
  { name: 'Brighton', crest: espnCrest(331) },
  { name: 'Chelsea', crest: espnCrest(363) },
  { name: 'Crystal Palace', crest: espnCrest(384) },
  { name: 'Everton', crest: espnCrest(368) },
  { name: 'Fulham', crest: espnCrest(370) },
  { name: 'Ipswich Town', crest: espnCrest(379) },
  { name: 'Leicester City', crest: espnCrest(375) },
  { name: 'Liverpool', crest: espnCrest(364) },
  { name: 'Manchester City', crest: espnCrest(382) },
  { name: 'Manchester United', crest: espnCrest(360) },
  { name: 'Newcastle United', crest: espnCrest(361) },
  { name: 'Nottingham Forest', crest: espnCrest(393) },
  { name: 'Southampton', crest: espnCrest(376) },
  { name: 'Tottenham Hotspur', crest: espnCrest(367) },
  { name: 'West Ham United', crest: espnCrest(371) },
  { name: 'Wolverhampton Wanderers', crest: espnCrest(380) },
]

/** Top world clubs outside the Premier League, with crests. */
export const WORLD_TEAMS: FavoriteTeam[] = [
  { name: 'Real Madrid', crest: fdCrest(86) },
  { name: 'Barcelona', crest: fdCrest(81) },
  { name: 'Bayern Munich', crest: fdCrest(5) },
  { name: 'Paris Saint-Germain', crest: fdCrest(524) },
  { name: 'Internazionale', crest: fdCrest(108) },
  { name: 'AC Milan', crest: fdCrest(98) },
  { name: 'Juventus', crest: fdCrest(109) },
  { name: 'Borussia Dortmund', crest: fdCrest(4) },
  { name: 'Atlético Madrid', crest: fdCrest(78) },
  { name: 'Napoli', crest: fdCrest(113) },
  { name: 'Bayer Leverkusen', crest: fdCrest(3) },
  { name: 'Benfica', crest: fdCrest(1903) },
  { name: 'Sporting CP', crest: fdCrest(498) },
  { name: 'Porto', crest: fdCrest(503) },
  { name: 'Ajax', crest: fdCrest(678) },
  { name: 'RB Leipzig', crest: fdCrest(721) },
  { name: 'Atalanta', crest: fdCrest(102) },
  { name: 'Lille', crest: fdCrest(521) },
  { name: 'Feyenoord', crest: fdCrest(675) },
  { name: 'Marseille', crest: fdCrest(516) },
]

export const FAVORITE_TEAMS: FavoriteTeam[] = [...PREMIER_LEAGUE_TEAMS, ...WORLD_TEAMS]

export function findFavoriteTeam(name: string | null | undefined) {
  if (!name) return undefined
  return FAVORITE_TEAMS.find(team => team.name === name)
}
