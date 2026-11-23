import { useEffect, useRef } from 'react'
import CutPhotoAct from './CutPhotoAct'
import DropPhotoAct from './DropPhotoAct'
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
  serum: { Component: DropPhotoAct, inPhoto: true },
  scissors: { Component: CutPhotoAct, inPhoto: true },
  polish: { Component: NailPhotoAct, inPhoto: true },
  lipstick: { Component: LipstickAct, tone: 'milk' },
}
