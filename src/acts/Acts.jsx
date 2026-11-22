import { useEffect, useRef } from 'react'
import PhotoReveal from './PhotoReveal'

/*
 * Animations « métier » jouées dans l'arche au scroll (une par prestation).
 * Chaque composant reçoit onReady(update) : update(t, veil) est appelé à
 * chaque image avec t ∈ [0, 1] (progression de l'animation) et le voile posé
 * sur la photo. Repère SVG commun : 204 × 300 (proportions de l'arche).
 */

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const lerp = (a, b, k) => a + (b - a) * k
const set = (el, attrs) => {
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
}

function GoldDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6e1a8" />
        <stop offset="0.45" stopColor="#c6a066" />
        <stop offset="1" stopColor="#7e5a22" />
      </linearGradient>
      <linearGradient id={`${id}-wine`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3d0f19" />
        <stop offset="0.45" stopColor="#8d2a3d" />
        <stop offset="1" stopColor="#4a1420" />
      </linearGradient>
    </defs>
  )
}

/* ---------- Soins du visage : la goutte de sérum ---------- */
export function DropAct({ onReady }) {
  const ref = useRef(null)
  useEffect(() => {
    const svg = ref.current
    const q = (s) => svg.querySelector(s)
    const pipette = q('[data-pipette]')
    const drop = q('[data-drop]')
    const ripples = [...svg.querySelectorAll('[data-ripple]')]
    const beads = [...svg.querySelectorAll('[data-bead]')]
    onReady((t, veil) => {
      set(pipette, { transform: `translate(0 ${lerp(-70, 0, smooth(0, 0.12, t))})` })
      const grow = smooth(0.08, 0.36, t)
      const fall = clamp01((t - 0.38) / 0.24)
      let x = 102
      let y = 50 + 6 * grow
      let s = 0.25 + 0.75 * grow
      let sy = 1 + 0.25 * grow
      if (t >= 0.38) {
        y = 56 + (206 - 56) * fall * fall
        s = 1
        sy = 1.3 - 0.15 * fall
      }
      set(drop, { transform: `translate(${x} ${y}) scale(${s} ${s * sy})`, opacity: t < 0.62 ? smooth(0.08, 0.13, t) : 0 })
      const splash = clamp01((t - 0.62) / 0.38)
      ripples.forEach((el, i) => {
        const k = clamp01(splash * 1.25 - i * 0.18)
        const rx = 6 + 120 * k
        set(el, { rx, ry: rx * 0.26, opacity: k > 0 ? (1 - k) * 0.9 : 0 })
      })
      beads.forEach((el, i) => {
        const dir = (i - 2) * 0.55
        set(el, { cx: 102 + dir * 46 * splash, cy: 206 - 46 * splash + 60 * splash * splash, opacity: splash > 0 ? 1 - splash : 0 })
      })
      // la lumière se répand depuis le point d'impact
      if (veil) {
        const r = splash * veil.clientWidth * 1.7
        veil.style.webkitMaskImage = veil.style.maskImage = splash > 0 ? `radial-gradient(circle at 50% 69%, transparent ${r}px, #000 ${r + 40}px)` : ''
      }
    })
  }, [onReady])

  return (
    <svg ref={ref} viewBox="0 0 204 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <GoldDefs id="drop" />
      <defs>
        <radialGradient id="drop-serum" cx="0.4" cy="0.6" r="0.7">
          <stop offset="0" stopColor="#ffeab8" />
          <stop offset="0.55" stopColor="#d9a44c" />
          <stop offset="1" stopColor="#8a5a1c" />
        </radialGradient>
      </defs>
      <g data-pipette>
        <rect x="88" y="-40" width="28" height="22" rx="3" fill="url(#drop-gold)" />
        <path d="M93 -18 H111 V30 L104 50 H100 L93 30 Z" fill="rgba(255,240,220,0.12)" stroke="rgba(255,236,210,0.6)" strokeWidth="1" />
        <path d="M96 -10 V28" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M95 6 H109 V30 L104 48 H100 L95 30 Z" fill="#c98a2e" opacity="0.75" />
      </g>
      {[0, 1, 2].map((i) => (
        <ellipse key={i} data-ripple cx="102" cy="206" rx="0" ry="0" fill="none" stroke="#e9cc8e" strokeWidth={1.6 - i * 0.4} opacity="0" />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} data-bead cx="102" cy="206" r={i === 2 ? 3.2 : 2.2} fill="url(#drop-serum)" opacity="0" />
      ))}
      <g data-drop>
        <path d="M0 -15 C5 -7 9 -1 9 5 A9 9 0 0 1 -9 5 C-9 -1 -5 -7 0 -15 Z" fill="url(#drop-serum)" />
        <ellipse cx="-3.2" cy="3" rx="2" ry="3.4" fill="#fff" opacity="0.75" />
      </g>
    </svg>
  )
}

/* ---------- Coiffure : les ciseaux coupent une mèche ---------- */
const CUT = 168
// mèche : une masse sombre (volume) + de fines mèches qui suivent la même ondulation
const LOCK = 'M84 22 C70 70 64 110 72 150 C78 196 70 230 82 272 L128 272 C138 232 130 196 136 150 C142 110 136 70 122 22 Z'
const STRANDS = Array.from({ length: 30 }, (_, i) => {
  const k = i / 29
  const x = 84 + k * 38 + Math.sin(i * 2.3) * 2
  const spread = (k - 0.5) * 16
  const j = Math.sin(i * 1.7) * 3
  return {
    d: `M${x} 20 C${x - 14 + spread * 0.4 + j} 70, ${x - 6 + spread} 112, ${x + spread * 0.8} ${CUT - 18} S${x - 10 + spread + j} 230, ${x + spread * 0.6 + 4} ${266 + j * 2}`,
    width: 0.7 + ((i * 7) % 5) * 0.35,
    tone: (i * 5) % 4,
  }
})
const HAIR = ['#2a1810', '#4a2e1d', '#6b452c', '#9a6a45']

function Blade({ flip }) {
  return (
    <g transform={flip ? 'scale(1 -1)' : undefined}>
      <path d="M-8 -3.5 C20 -6.5 52 -4.5 80 0.5 C52 2.5 20 3.5 -8 3.5 Z" fill="url(#cut-gold)" />
      <path d="M-6 3 C-14 6 -20 9 -24 12" stroke="url(#cut-gold)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="-36" cy="16" r="12" fill="none" stroke="url(#cut-gold)" strokeWidth="5" />
    </g>
  )
}

export function ScissorsAct({ onReady }) {
  const ref = useRef(null)
  useEffect(() => {
    const svg = ref.current
    const scissors = svg.querySelector('[data-scissors]')
    const bladeA = svg.querySelector('[data-blade-a]')
    const bladeB = svg.querySelector('[data-blade-b]')
    const fallen = svg.querySelector('[data-fallen]')
    const spark = svg.querySelector('[data-spark]')
    onReady((t, veil) => {
      const travel = smooth(0, 0.5, t)
      const exit = smooth(0.6, 0.92, t)
      const open = 30 * Math.abs(Math.sin(t * Math.PI * 5)) * (1 - smooth(0.42, 0.5, t))
      set(scissors, { transform: `translate(${-70 + 150 * travel + 170 * exit} ${CUT})`, opacity: 1 - smooth(0.75, 0.95, t) })
      set(bladeA, { transform: `rotate(${-open / 2})` })
      set(bladeB, { transform: `rotate(${open / 2})` })
      const drop = smooth(0.5, 1, t)
      set(fallen, { transform: `translate(0 ${170 * drop * drop}) rotate(${12 * drop} 102 ${CUT})`, opacity: 1 - drop })
      const flash = t > 0.47 && t < 0.62 ? 1 - Math.abs(t - 0.52) / 0.1 : 0
      set(spark, { opacity: Math.max(0, flash), transform: `translate(128 ${CUT}) scale(${0.6 + flash * 0.6})` })
      if (veil) veil.style.webkitMaskImage = veil.style.maskImage = ''
    })
  }, [onReady])

  const strands = (key) => (
    <>
      <path d={LOCK} fill="url(#cut-lock)" />
      {STRANDS.map((s, i) => (
        <path key={`${key}${i}`} d={s.d} fill="none" stroke={HAIR[s.tone]} strokeWidth={s.width} strokeLinecap="round" opacity={s.tone === 3 ? 0.7 : 0.95} />
      ))}
    </>
  )

  return (
    <svg ref={ref} viewBox="0 0 204 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cut-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e1a8" />
          <stop offset="0.5" stopColor="#c6a066" />
          <stop offset="1" stopColor="#7e5a22" />
        </linearGradient>
        <linearGradient id="cut-lock" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#24140d" />
          <stop offset="0.45" stopColor="#4d301e" />
          <stop offset="0.6" stopColor="#5e3b25" />
          <stop offset="1" stopColor="#24140d" />
        </linearGradient>
        <clipPath id="cut-top">
          <rect x="0" y="-20" width="204" height={CUT + 20.6} />
        </clipPath>
        <clipPath id="cut-bottom">
          <rect x="0" y={CUT - 0.6} width="204" height="200" />
        </clipPath>
      </defs>
      <g data-sway>
        <g clipPath="url(#cut-top)">{strands('a')}</g>
        <g data-fallen>
          <g clipPath="url(#cut-bottom)">{strands('b')}</g>
        </g>
        <rect x="82" y="14" width="42" height="10" rx="5" fill="url(#cut-gold)" />
      </g>
      <g data-spark opacity="0">
        <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#fff4d6" />
      </g>
      <g data-scissors>
        <g data-blade-a>
          <Blade />
        </g>
        <g data-blade-b>
          <Blade flip />
        </g>
        <circle r="3.4" fill="#f6e1a8" stroke="#7e5a22" strokeWidth="1" />
      </g>
    </svg>
  )
}

/* ---------- Maquillage : le rouge à lèvres écrit ---------- */
const TIP = { x: 114, y: 96 }

export function LipstickAct({ onReady, word }) {
  const ref = useRef(null)
  useEffect(() => {
    const svg = ref.current
    const bullet = svg.querySelector('[data-bullet]')
    const stick = svg.querySelector('[data-stick]')
    const reveal = svg.querySelector('[data-reveal]')
    const swash = svg.querySelector('[data-swash]')
    const text = svg.querySelector('[data-word]')
    let box = null
    onReady((t, veil) => {
      if (!box) {
        const b = text.getBBox()
        if (b.width) box = b
      }
      const left = box ? box.x - 4 : 24
      const right = box ? box.x + box.width + 6 : 180
      set(bullet, { transform: `translate(0 ${44 * (1 - smooth(0.02, 0.24, t))})` })
      const write = smooth(0.34, 0.86, t)
      const frontX = lerp(left, right, write)
      set(reveal, { width: Math.max(0, frontX - left), x: left })
      const pose = smooth(0.24, 0.36, t)
      const fx = lerp(TIP.x, frontX, pose)
      const fy = lerp(TIP.y, 140 + 9 * Math.sin(write * Math.PI * 6), pose)
      const exit = smooth(0.86, 1, t)
      set(stick, {
        transform: `translate(${fx + 50 * exit} ${fy - 60 * exit}) rotate(${-38 * pose}) scale(${1 - 0.22 * pose}) translate(${-TIP.x} ${-TIP.y})`,
        opacity: 1 - exit,
      })
      const flourish = smooth(0.84, 0.98, t)
      set(swash, { 'stroke-dashoffset': 1 - flourish, opacity: flourish > 0 ? 1 : 0 })
      if (veil) veil.style.webkitMaskImage = veil.style.maskImage = ''
    })
  }, [onReady])

  return (
    <svg ref={ref} viewBox="0 0 204 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <GoldDefs id="lip" />
      <defs>
        <linearGradient id="lip-bullet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a1420" />
          <stop offset="0.4" stopColor="#9b3a4e" />
          <stop offset="1" stopColor="#5a1726" />
        </linearGradient>
        <clipPath id="lip-sleeve">
          <rect x="0" y="-200" width="204" height="350" />
        </clipPath>
        <mask id="lip-mask">
          <rect data-reveal x="24" y="60" width="0" height="140" fill="#fff" />
        </mask>
      </defs>
      <text data-word x="102" y="152" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontWeight="400" fontSize="44" fill="#7a1f33" mask="url(#lip-mask)">
        {word}
      </text>
      <path data-swash d="M40 172 C80 160 124 184 168 166" fill="none" stroke="#7a1f33" strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
      <g data-stick>
        <g clipPath="url(#lip-sleeve)">
          <path data-bullet d="M90 150 V108 L114 94 V150 Z" fill="url(#lip-bullet)" />
        </g>
        <rect x="86" y="148" width="32" height="24" rx="2" fill="url(#lip-gold)" />
        <rect x="82" y="172" width="40" height="84" rx="3" fill="url(#lip-gold)" />
        <path d="M86 178 V250" stroke="#fff6dc" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/* ---------- Ongles, en photos réelles : le vrai pinceau vernit les ongles ---------- */
// pinceau découpé dans la photo du vernis (240 × 310) : pointe en bas à gauche, bouchon en haut à droite
const POLISH_BRUSH = { src: '/images/acts/polish-brush.webp', w: 240, h: 310, tipX: 14, tipY: 309, axis: Math.atan2(25 - 309, 192 - 14), tilt: -1.55, size: 7.4 }

export function NailPhotoAct({ onReady, className }) {
  return <PhotoReveal name="ongles" tool={POLISH_BRUSH} onReady={onReady} className={className} />
}

// inPhoto : l'animation remplace la photo dans l'arche (pas de voile)
export const ACTS = {
  serum: { Component: DropAct, tone: 'night' },
  scissors: { Component: ScissorsAct, tone: 'milk' },
  polish: { Component: NailPhotoAct, inPhoto: true },
  lipstick: { Component: LipstickAct, tone: 'milk' },
}
