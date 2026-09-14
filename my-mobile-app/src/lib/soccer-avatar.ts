export type SoccerKit = {
  slug: string
  shirt: string
  trim: string
  number: string
  pattern: 'solid' | 'stripes' | 'hoops'
}

const KITS: SoccerKit[] = [
  { slug: 'arsenal', shirt: '#EF0107', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'aston-villa', shirt: '#95BFE5', trim: '#670E36', number: '#670E36', pattern: 'solid' },
  { slug: 'bournemouth', shirt: '#DA291C', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'brentford', shirt: '#E30613', trim: '#FBB800', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'brighton', shirt: '#0057B8', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'chelsea', shirt: '#034694', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'crystal-palace', shirt: '#1B458F', trim: '#C4122E', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'everton', shirt: '#003399', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'fulham', shirt: '#FFFFFF', trim: '#000000', number: '#000000', pattern: 'solid' },
  { slug: 'ipswich-town', shirt: '#0044A9', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'leicester-city', shirt: '#003090', trim: '#FDBE11', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'liverpool', shirt: '#C8102E', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'manchester-city', shirt: '#6CABDD', trim: '#FFFFFF', number: '#1C2C5B', pattern: 'solid' },
  { slug: 'manchester-united', shirt: '#DA291C', trim: '#FBE122', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'newcastle-united', shirt: '#000000', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'nottingham-forest', shirt: '#E53233', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'southampton', shirt: '#D71920', trim: '#FFFFFF', number: '#000000', pattern: 'stripes' },
  { slug: 'tottenham-hotspur', shirt: '#FFFFFF', trim: '#132257', number: '#132257', pattern: 'solid' },
  { slug: 'west-ham-united', shirt: '#7A263A', trim: '#1BB1E7', number: '#F3D459', pattern: 'solid' },
  { slug: 'wolverhampton-wanderers', shirt: '#FDB913', trim: '#000000', number: '#000000', pattern: 'solid' },
  { slug: 'real-madrid', shirt: '#FFFFFF', trim: '#FEBE10', number: '#00529F', pattern: 'solid' },
  { slug: 'barcelona', shirt: '#A50044', trim: '#004D98', number: '#FFED02', pattern: 'stripes' },
  { slug: 'bayern-munich', shirt: '#DC052D', trim: '#0066B2', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'paris-saint-germain', shirt: '#004170', trim: '#DA291C', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'internazionale', shirt: '#010E80', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'ac-milan', shirt: '#FB090B', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'juventus', shirt: '#000000', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'borussia-dortmund', shirt: '#FDE100', trim: '#000000', number: '#000000', pattern: 'solid' },
  { slug: 'atletico-madrid', shirt: '#CE3524', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'napoli', shirt: '#12A0C6', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'bayer-leverkusen', shirt: '#E32221', trim: '#000000', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'benfica', shirt: '#ED1C24', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'sporting-cp', shirt: '#008057', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'hoops' },
  { slug: 'porto', shirt: '#003087', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'ajax', shirt: '#FFFFFF', trim: '#D2122E', number: '#D2122E', pattern: 'solid' },
  { slug: 'rb-leipzig', shirt: '#FFFFFF', trim: '#DD0741', number: '#DD0741', pattern: 'solid' },
  { slug: 'atalanta', shirt: '#1E71B8', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'lille', shirt: '#E01A22', trim: '#1D1D1B', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'feyenoord', shirt: '#FFFFFF', trim: '#E03C31', number: '#E03C31', pattern: 'hoops' },
  { slug: 'marseille', shirt: '#2FAEE0', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
]

function kitSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hashSeed(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function rngFrom(seed: string) {
  let state = hashSeed(seed) || 1
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(items: T[], seed: string) {
  return items[hashSeed(seed) % items.length]
}

function pickRng<T>(rand: () => number, items: T[]) {
  return items[Math.floor(rand() * items.length)]
}

export function findKit(slug?: string | null) {
  if (!slug) return undefined
  return KITS.find(kit => kit.slug === kitSlug(slug))
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

function rgbHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map(channel => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0'))
    .join('')}`
}

function mix(a: string, b: string, t: number) {
  const from = hexToRgb(a)
  const to = hexToRgb(b)
  return rgbHex(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t)
}

export function soccerAvatarPath(seed: string, teamName?: string | null) {
  const safeSeed = seed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'xact'
  const kit = teamName ? kitSlug(teamName) : ''
  const params = new URLSearchParams({ s: safeSeed })
  if (kit) params.set('kit', kit)
  return `/api/avatar?${params.toString()}`
}

export function isUnoptimizedAvatar(src: string) {
  return src.includes('dicebear') || src.includes('supabase') || src.includes('/api/avatar')
}

const SHIRT =
  'M38 70 C34 62 22 64 12 74 C6 82 8 94 18 102 L30 94 L34 126 L94 126 L98 94 L110 102 C120 94 122 82 116 74 C106 64 94 62 90 70 C82 80 50 80 38 70 Z'

const SKIN = ['#FFE0BD', '#F4C48A', '#E0A56B', '#C68642', '#8D5524', '#5C3310']
const HAIR = ['#1C1917', '#44403C', '#78350F', '#B45309', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9']

function hairSvg(style: number, color: string) {
  if (style === 0) {
    return `<circle cx="46" cy="22" r="10" fill="${color}"/><circle cx="64" cy="14" r="12" fill="${color}"/><circle cx="84" cy="22" r="10" fill="${color}"/>`
  }
  if (style === 1) {
    return `<path d="M40 40c8-28 44-28 52 2-18-16-36-8-52-2z" fill="${color}"/><path d="M86 28c10-4 18 2 22 12" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`
  }
  if (style === 2) {
    return `<path d="M58 8c2-8 10-10 12 0 2 14 4 28 0 40H56c-4-12-2-26 2-40z" fill="${color}"/>`
  }
  if (style === 3) {
    return `<path d="M38 36c4-22 16-28 26-28s22 6 26 28c-8-12-16-16-26-16s-18 4-26 16z" fill="${color}"/>`
  }
  if (style === 4) {
    return `<path d="M42 38c2-16 12-24 22-24s20 8 22 24" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="40" cy="18" r="7" fill="${color}"/><circle cx="88" cy="18" r="7" fill="${color}"/>`
  }
  if (style === 5) {
    return `<ellipse cx="52" cy="26" rx="8" ry="5" fill="#fff" opacity=".28"/>`
  }
  if (style === 6) {
    return `<path d="M40 42 L52 8 L64 36 L76 6 L88 42" fill="none" stroke="${color}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`
  }
  return `<path d="M36 44c0-20 12-32 28-32s28 12 28 32c-8-14-18-18-28-18s-20 4-28 18z" fill="${color}"/>
    <circle cx="48" cy="24" r="8" fill="${color}"/><circle cx="80" cy="24" r="8" fill="${color}"/>`
}

function eyesSvg(style: number) {
  if (style === 0) {
    return `<ellipse cx="50" cy="48" rx="11" ry="12" fill="#fff" stroke="#111" stroke-width="2.2"/>
      <ellipse cx="78" cy="48" rx="11" ry="12" fill="#fff" stroke="#111" stroke-width="2.2"/>
      <circle cx="54" cy="50" r="4" fill="#111"/><circle cx="82" cy="50" r="4" fill="#111"/>
      <circle cx="52.5" cy="48.5" r="1.4" fill="#fff"/><circle cx="80.5" cy="48.5" r="1.4" fill="#fff"/>`
  }
  if (style === 1) {
    return `<ellipse cx="50" cy="48" rx="12" ry="13" fill="#fff" stroke="#111" stroke-width="2.2"/>
      <ellipse cx="80" cy="50" rx="7" ry="8" fill="#fff" stroke="#111" stroke-width="2"/>
      <circle cx="46" cy="50" r="4.2" fill="#111"/><circle cx="82" cy="52" r="3" fill="#111"/>`
  }
  if (style === 2) {
    return `<path d="M40 48c6-8 16-8 22 0" fill="none" stroke="#111" stroke-width="3.2" stroke-linecap="round"/>
      <ellipse cx="80" cy="48" rx="11" ry="12" fill="#fff" stroke="#111" stroke-width="2.2"/>
      <circle cx="83" cy="50" r="4" fill="#111"/><circle cx="81.4" cy="48.2" r="1.3" fill="#fff"/>`
  }
  if (style === 3) {
    return `<circle cx="50" cy="48" r="10" fill="#fff" stroke="#111" stroke-width="2"/>
      <circle cx="78" cy="48" r="10" fill="#fff" stroke="#111" stroke-width="2"/>
      <path d="M50 42c4 2 6 6 4 10-4 2-8 0-8-4 0-2 2-4 4-6z" fill="#111"/>
      <path d="M78 42c4 2 6 6 4 10-4 2-8 0-8-4 0-2 2-4 4-6z" fill="#111"/>`
  }
  if (style === 4) {
    return `<path d="M40 44c8 6 18 6 26 0" fill="none" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M62 44c8 6 18 6 26 0" fill="none" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M44 52h18M66 52h18" stroke="#111" stroke-width="2" stroke-linecap="round"/>`
  }
  return `<ellipse cx="50" cy="50" rx="10" ry="6" fill="#fff" stroke="#111" stroke-width="2"/>
    <ellipse cx="78" cy="50" rx="10" ry="6" fill="#fff" stroke="#111" stroke-width="2"/>
    <circle cx="50" cy="50" r="3.2" fill="#111"/><circle cx="78" cy="50" r="3.2" fill="#111"/>
    <path d="M40 44h20M68 44h20" stroke="#111" stroke-width="2.6" stroke-linecap="round"/>`
}

function mouthSvg(style: number) {
  if (style === 0) {
    return `<path d="M46 68c6 14 30 14 36 0" fill="#111"/>
      <path d="M50 68c5 8 23 8 28 0" fill="#fff"/>
      <path d="M57 68v6M64 68v7M71 68v6" stroke="#111" stroke-width="1.4"/>`
  }
  if (style === 1) {
    return `<path d="M48 66c6 10 26 10 32 0" fill="#111"/>
      <path d="M62 70c2 12 10 16 14 8-8 0-12-4-14-8z" fill="#ef4444"/>`
  }
  if (style === 2) {
    return `<circle cx="64" cy="70" r="7" fill="#111"/><circle cx="64" cy="70" r="4" fill="#fff"/>`
  }
  if (style === 3) {
    return `<rect x="52" y="66" width="24" height="10" rx="2" fill="#fff" stroke="#111" stroke-width="2"/>
      <path d="M60 66v10M68 66v10" stroke="#111" stroke-width="1.6"/>
      <rect x="58" y="76" width="6" height="7" rx="1" fill="#fff" stroke="#111" stroke-width="1.4"/>`
  }
  if (style === 4) {
    return `<path d="M50 72c8-8 20-8 28 0" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>`
  }
  return `<path d="M48 66c4 4 8 2 10 0 4 8 12 8 16 0 2 2 6 4 10 0" fill="none" stroke="#111" stroke-width="2.8" stroke-linecap="round"/>`
}

function funnyFace(rand: () => number, kit: SoccerKit) {
  const skin = pickRng(rand, SKIN)
  const hair = rand() > 0.72 ? kit.shirt : pickRng(rand, HAIR)
  const hairStyle = Math.floor(rand() * 8)
  const eyeStyle = Math.floor(rand() * 6)
  const mouthStyle = Math.floor(rand() * 6)
  const brow = Math.floor(rand() * 4)
  const blush = rand() > 0.55
  const sweat = rand() > 0.7
  const earWiggle = 2 + Math.floor(rand() * 4)

  const brows =
    brow === 0
      ? `<path d="M40 36c8-6 18-4 24 2M64 38c8-8 20-6 26 2" fill="none" stroke="#111" stroke-width="3.2" stroke-linecap="round"/>`
      : brow === 1
        ? `<path d="M40 40c10 6 20 6 28 0M64 40c10 6 20 6 26 0" fill="none" stroke="#111" stroke-width="3.2" stroke-linecap="round"/>`
        : brow === 2
          ? `<path d="M42 38h44" stroke="#111" stroke-width="4" stroke-linecap="round"/>`
          : `<path d="M42 40c6-8 14-4 18 2M68 36c8-2 16 2 20 8" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>`

  return `
    <rect x="56" y="72" width="16" height="14" rx="6" fill="${skin}"/>
    <ellipse cx="${40 - earWiggle}" cy="50" rx="7" ry="10" fill="${skin}" stroke="#111" stroke-width="2"/>
    <ellipse cx="${88 + earWiggle}" cy="50" rx="7" ry="10" fill="${skin}" stroke="#111" stroke-width="2"/>
    ${hairSvg(hairStyle, hair)}
    <ellipse cx="64" cy="50" rx="30" ry="32" fill="${skin}" stroke="#111" stroke-width="2.6"/>
    ${hairStyle === 5 ? hairSvg(5, hair) : ''}
    ${blush ? `<ellipse cx="46" cy="60" rx="6" ry="3.5" fill="#fb7185" opacity=".55"/><ellipse cx="82" cy="60" rx="6" ry="3.5" fill="#fb7185" opacity=".55"/>` : ''}
    ${brows}
    ${eyesSvg(eyeStyle)}
    ${mouthSvg(mouthStyle)}
    ${sweat ? `<path d="M94 28c8 8 4 16-2 16-4-6 0-12 2-16z" fill="#7dd3fc" stroke="#111" stroke-width="1.6"/>` : ''}
  `
}

export function renderSoccerAvatar(seed: string, kitQuery?: string | null) {
  const rand = rngFrom(seed)
  const kit = findKit(kitQuery) || pick(KITS, seed)
  const number = String(1 + Math.floor(rand() * 23))
  const patternId = `p${hashSeed(seed + kit.slug).toString(16)}`
  const shirtFill = kit.pattern === 'solid' ? kit.shirt : `url(#${patternId})`
  const bgTop = mix(kit.shirt, '#020617', 0.72)
  const bgBottom = mix(kit.shirt, '#020617', 0.88)
  const cuff = kit.trim
  const numberColor =
    kit.pattern === 'solid' ? kit.number : kit.shirt === '#000000' || kit.shirt === '#FFFFFF' ? kit.number : '#FFFFFF'
  const numberStroke = numberColor.toLowerCase() === '#ffffff' ? '#111111' : '#ffffff'

  const pattern =
    kit.pattern === 'stripes'
      ? `<pattern id="${patternId}" width="14" height="128" patternUnits="userSpaceOnUse">
           <rect width="7" height="128" fill="${kit.shirt}"/>
           <rect x="7" width="7" height="128" fill="${kit.trim}"/>
         </pattern>`
      : kit.pattern === 'hoops'
        ? `<pattern id="${patternId}" width="128" height="16" patternUnits="userSpaceOnUse">
             <rect width="128" height="8" fill="${kit.shirt}"/>
             <rect y="8" width="128" height="8" fill="${kit.trim}"/>
           </pattern>`
        : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bgTop}"/>
      <stop offset="1" stop-color="${bgBottom}"/>
    </linearGradient>
    ${pattern}
  </defs>
  <rect width="128" height="128" fill="url(#bg)"/>
  <path d="${SHIRT}" fill="${shirtFill}"/>
  <path d="${SHIRT}" fill="none" stroke="${kit.trim}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M50 70 Q64 82 78 70" fill="none" stroke="${cuff}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M12 74 L18 102" fill="none" stroke="${cuff}" stroke-width="3" stroke-linecap="round"/>
  <path d="M116 74 L110 102" fill="none" stroke="${cuff}" stroke-width="3" stroke-linecap="round"/>
  <text x="64" y="116" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="20" font-weight="900" fill="${numberColor}" stroke="${numberStroke}" stroke-width="2.2" paint-order="stroke">${number}</text>
  ${funnyFace(rand, kit)}
</svg>`
}
