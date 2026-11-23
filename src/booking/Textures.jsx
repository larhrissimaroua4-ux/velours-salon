import styles from './Textures.module.css'

/**
 * Reflets du miroir : une texture dessinée par soin (pas de photo).
 *   visage     → gouttes de sérum nacrées
 *   cheveux    → mèches soyeuses qui ondulent
 *   ongles     → éventail d'ongles vernis, brillants
 *   maquillage → traits de rouge à lèvres et poudre
 * viewBox 300 × 400 (proportions de l'arche), recadré en « slice ».
 */

const VB = '0 0 300 400'

// pseudo-aléatoire stable
const rand = (i, k = 1) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function Serum() {
  const drops = Array.from({ length: 16 }, (_, i) => ({
    x: 20 + rand(i, 1) * 260,
    y: 30 + rand(i, 2) * 300,
    r: 5 + rand(i, 3) ** 2 * 26,
  }))
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className={styles.svg}>
      <defs>
        <radialGradient id="tx-pearl" cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fff8f3" />
          <stop offset="0.45" stopColor="#f1ddd5" />
          <stop offset="1" stopColor="#d9b8ae" />
        </radialGradient>
        <radialGradient id="tx-drop" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#fbefe9" stopOpacity="0.55" />
          <stop offset="0.8" stopColor="#e7c3b8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#b98b80" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id="tx-halo">
          <stop offset="0" stopColor="#fff3dc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff3dc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="400" fill="url(#tx-pearl)" />
      <circle cx="190" cy="120" r="120" fill="url(#tx-halo)" className={styles.breathe} />
      {/* grande goutte de sérum qui coule */}
      <g className={styles.float}>
        <path d="M150 70 C150 70 104 140 104 172 C104 198 125 218 150 218 C175 218 196 198 196 172 C196 140 150 70 150 70 Z" fill="url(#tx-drop)" stroke="rgb(185 139 128 / 0.4)" strokeWidth="1" />
        <ellipse cx="134" cy="160" rx="9" ry="20" fill="#fff" opacity="0.75" transform="rotate(18 134 160)" />
      </g>
      {drops.map((d, i) => (
        <g key={i} className={i % 3 ? styles.float : styles.floatSlow} style={{ animationDelay: `${-rand(i, 4) * 6}s` }}>
          <circle cx={d.x} cy={d.y} r={d.r} fill="url(#tx-drop)" stroke="rgb(185 139 128 / 0.3)" strokeWidth="0.6" />
          <circle cx={d.x - d.r * 0.35} cy={d.y - d.r * 0.4} r={Math.max(1.2, d.r * 0.22)} fill="#fff" opacity="0.85" />
        </g>
      ))}
    </svg>
  )
}

function Silk() {
  const strands = Array.from({ length: 34 }, (_, i) => {
    const x = -30 + i * 11
    const a = 18 + rand(i, 1) * 26
    const p = rand(i, 2) * 40
    return `M${x} -20 C${x + a} ${80 + p} ${x - a} ${180 + p} ${x + a * 0.6} ${280 + p} S${x - a * 0.4} ${380} ${x + 10} 430`
  })
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className={styles.svg}>
      <defs>
        <linearGradient id="tx-hair-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a2218" />
          <stop offset="0.5" stopColor="#7a4a2c" />
          <stop offset="1" stopColor="#2b1812" />
        </linearGradient>
        <linearGradient id="tx-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3420" />
          <stop offset="0.35" stopColor="#e2b77c" />
          <stop offset="0.55" stopColor="#a8693c" />
          <stop offset="0.8" stopColor="#f0cf98" />
          <stop offset="1" stopColor="#6b3d22" />
        </linearGradient>
        <linearGradient id="tx-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff2d8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#tx-hair-bg)" />
      <g className={styles.sway}>
        {strands.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="url(#tx-hair)" strokeWidth={4 + rand(i, 3) * 7} strokeLinecap="round" opacity={0.55 + rand(i, 5) * 0.45} />
        ))}
      </g>
      {/* reflet soyeux qui descend le long des mèches */}
      <rect x="-60" y="150" width="420" height="70" fill="url(#tx-shine)" transform="rotate(-12 150 185)" className={styles.shine} />
    </svg>
  )
}

const NAILS = ['#b0182f', '#d98a8c', '#6e1f2e', '#e9c2b4', '#c6a066']

function Polish() {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className={styles.svg}>
      <defs>
        <linearGradient id="tx-nude" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e6de" />
          <stop offset="1" stopColor="#e3c6bb" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#tx-nude)" />
      {/* traits de vernis au pinceau */}
      <path d="M-20 330 C60 300 120 318 200 290 S300 270 330 280" fill="none" stroke="#e7b7ad" strokeWidth="34" strokeLinecap="round" opacity="0.6" />
      <path d="M-20 70 C70 90 150 50 230 80 S300 90 330 70" fill="none" stroke="#f0cfc4" strokeWidth="26" strokeLinecap="round" opacity="0.7" />
      {/* éventail d'ongles en amande */}
      <g transform="translate(150 250)">
        {NAILS.map((color, i) => {
          const angle = -44 + i * 22
          return (
            <g key={color} transform={`rotate(${angle}) translate(0 -118)`} className={styles.nail} style={{ animationDelay: `${i * 0.18}s` }}>
              <path d="M0 -46 C17 -46 24 -24 24 4 C24 34 15 46 0 46 C-15 46 -24 34 -24 4 C-24 -24 -17 -46 0 -46 Z" fill={color} stroke="rgb(60 20 28 / 0.25)" strokeWidth="1" />
              <path d="M-11 -30 C-6 -38 4 -38 8 -32" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
              <path d="M-14 -14 C-15 2 -14 18 -10 30" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function Lipstick() {
  const dust = Array.from({ length: 60 }, (_, i) => ({ x: rand(i, 1) * 300, y: rand(i, 2) * 400, r: 0.6 + rand(i, 3) * 2 }))
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className={styles.svg}>
      <defs>
        <linearGradient id="tx-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5e3da" />
          <stop offset="1" stopColor="#e2c1b5" />
        </linearGradient>
        <radialGradient id="tx-blush">
          <stop offset="0" stopColor="#e39a9a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#e39a9a" stopOpacity="0" />
        </radialGradient>
        <filter id="tx-waxy" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
        </filter>
      </defs>
      <rect width="300" height="400" fill="url(#tx-skin)" />
      <circle cx="80" cy="110" r="90" fill="url(#tx-blush)" className={styles.breathe} />
      {/* trois traits de rouge à lèvres, du plus intense au nude */}
      <g filter="url(#tx-waxy)">
        <path d="M30 170 C90 150 170 158 270 130" fill="none" stroke="#a3162f" strokeWidth="30" strokeLinecap="round" />
        <path d="M40 235 C110 215 180 222 280 196" fill="none" stroke="#c94d5e" strokeWidth="28" strokeLinecap="round" />
        <path d="M30 300 C100 282 170 290 260 262" fill="none" stroke="#c98a7f" strokeWidth="26" strokeLinecap="round" />
      </g>
      {/* brillance du rouge */}
      <path d="M60 160 C110 148 170 152 240 134" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      <path d="M70 226 C120 212 180 216 250 200" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" />
      {/* poudre dorée */}
      {dust.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={i % 4 ? '#d9b98a' : '#fff'} opacity={0.35 + rand(i, 4) * 0.5} className={i % 5 ? undefined : styles.twinkle} style={{ animationDelay: `${-rand(i, 6) * 3}s` }} />
      ))}
    </svg>
  )
}

const TEXTURES = { visage: Serum, cheveux: Silk, ongles: Polish, maquillage: Lipstick }

export default function Textures({ service }) {
  return (
    <>
      {Object.entries(TEXTURES).map(([id, Texture]) => (
        <div key={id} className={styles.layer} data-on={id === service || undefined}>
          <Texture />
        </div>
      ))}
    </>
  )
}
