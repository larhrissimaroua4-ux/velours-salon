import { useEffect, useRef } from 'react'
import { useI18n } from '@/i18n/I18n'
import { gsap, reducedMotion } from '@/lib/gsap'
import { services } from '@/data/salon'
import styles from './VanityMirror.module.css'

const BULBS = 14
const RATIO = 1.38 // hauteur / largeur de l'arche
const OUT = 0.075 // écart des ampoules au bord de la glace (en largeurs)

// ampoules réparties le long de l'arche (côté gauche ↑, cintre, côté droit ↓)
const BULB_POS = (() => {
  const side = RATIO - 0.5
  const arc = Math.PI * 0.5
  const total = side * 2 + arc
  const margin = 0.16
  return Array.from({ length: BULBS }, (_, i) => {
    const s = margin + (i / (BULBS - 1)) * (total - margin * 2)
    let x
    let y
    let nx
    let ny
    if (s < side) {
      ;[x, y, nx, ny] = [0, RATIO - s, -1, 0]
    } else if (s < side + arc) {
      const a = Math.PI + (s - side) / 0.5
      ;[nx, ny] = [Math.cos(a), Math.sin(a)]
      ;[x, y] = [0.5 + nx * 0.5, 0.5 + ny * 0.5]
    } else {
      ;[x, y, nx, ny] = [1, 0.5 + (s - side - arc), 1, 0]
    }
    return { left: `${((x + nx * OUT) * 100).toFixed(2)}%`, top: `${(((y + ny * OUT) / RATIO) * 100).toFixed(2)}%` }
  })
})()

/**
 * Miroir de loge en arche (la forme de VELOURS), sans cadre, bordé d'ampoules.
 *  - chaque champ rempli allume deux ampoules ; tout rempli → le miroir rayonne ;
 *  - dès qu'un soin est choisi, sa photo apparaît dans la glace (images/booking) ;
 *  - le prénom, le jour et la prestation s'écrivent au rouge à lèvres ;
 *  - à l'envoi, une empreinte de baiser signe le miroir.
 *
 * @param {{ service: string, lines: { name: string, when: string, item: string }, filled: number, sealed: boolean }} props
 */
export default function VanityMirror({ service, lines, filled, sealed }) {
  const rootRef = useRef(null)
  const prevRef = useRef({ name: '', when: '', item: '', sealed: false })
  const { t } = useI18n()
  const lit = Math.round((filled / 6) * BULBS)

  // une ligne s'écrit d'un geste quand elle apparaît (ou change, sauf la saisie du prénom)
  useEffect(() => {
    const q = gsap.utils.selector(rootRef.current)
    const prev = prevRef.current
    const still = reducedMotion()
    ;['name', 'when', 'item'].forEach((key, i) => {
      const value = lines[key]
      const before = prev[key]
      prev[key] = value
      if (!value || still) return
      const appeared = !before
      const changed = key !== 'name' && before !== value
      if (!appeared && !changed) return
      gsap.fromTo(q(`[data-write='${key}']`), { clipPath: 'inset(-30% 100% -30% -5%)' }, { clipPath: 'inset(-30% -5% -30% -5%)', duration: key === 'name' ? 1.2 : 0.9, ease: 'power2.inOut', delay: i * 0.05 })
      if (key === 'name' && appeared) {
        gsap.fromTo(q('[data-swash]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', delay: 0.8 })
      }
    })
  }, [lines])

  // le baiser
  useEffect(() => {
    const prev = prevRef.current
    if (prev.sealed === sealed) return
    prev.sealed = sealed
    const kiss = rootRef.current.querySelector('[data-kiss]')
    if (!sealed) {
      gsap.to(kiss, { opacity: 0, duration: 0.5 })
      return
    }
    if (reducedMotion()) {
      gsap.set(kiss, { opacity: 1, y: 0, rotation: -14 })
      return
    }
    gsap.fromTo(kiss, { opacity: 0, y: -40, rotation: -34 }, { opacity: 1, y: 0, rotation: -14, duration: 0.9, ease: 'back.out(1.8)', delay: 0.2 })
  }, [sealed])

  return (
    <div ref={rootRef} className={styles.mirror} data-full={lit === BULBS || undefined} role="img" aria-label={t('booking.mirrorLabel')}>
      <div className={styles.glass}>
          {services.map((s) => (
            <img
              key={s.id}
              src={`/images/booking/${s.id}.webp`}
              srcSet={`/images/booking/${s.id}-sm.webp 420w, /images/booking/${s.id}.webp 640w`}
              sizes="(max-width: 760px) 60vw, 25rem"
              alt=""
              className={styles.photo}
              data-on={s.id === service || undefined}
              decoding="async"
            />
          ))}
          <span className={styles.fog} />
          <span className={styles.sheen} />

          <div className={styles.writing}>
            <p data-write="name" className={styles.name}>
              {lines.name}
            </p>
            <svg viewBox="0 0 200 20" className={styles.swashSvg} aria-hidden="true">
              <path data-swash d="M8 12 C50 4 100 18 150 9 C168 6 182 6 194 10" pathLength="1" className={styles.swash} style={{ opacity: lines.name ? 1 : 0 }} />
            </svg>
            <p data-write="when" className={styles.when}>
              {lines.when}
            </p>
            <p data-write="item" className={styles.item}>
              {lines.item}
            </p>
          </div>

          {/* empreinte de baiser */}
          <svg viewBox="0 0 120 64" className={styles.kiss} data-kiss aria-hidden="true">
            <defs>
              <filter id="kiss-print" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
                <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="holes" />
                <feComposite in="SourceGraphic" in2="holes" operator="in" />
              </filter>
            </defs>
            <g filter="url(#kiss-print)">
              <path d="M4 32 C18 22 34 8 48 10 C54 11 58 15 60 18 C62 15 66 11 72 10 C86 8 102 22 116 32 C100 34 84 33 60 34 C36 33 20 34 4 32 Z" className={styles.lipTop} />
              <path d="M6 35 C22 37 38 37 60 37 C82 37 98 37 114 35 C102 48 84 60 60 60 C36 60 18 48 6 35 Z" className={styles.lipBottom} />
              <path d="M30 18 L32 30 M42 13 L43 30 M54 15 L54 31 M66 15 L66 31 M78 13 L77 30 M90 18 L88 30 M26 40 L30 50 M40 39 L42 55 M54 39 L54 57 M66 39 L66 57 M80 39 L78 55 M94 40 L90 50" className={styles.creases} />
            </g>
          </svg>
      </div>

      {BULB_POS.map((pos, i) => (
        <span key={i} className={styles.bulb} data-on={i < lit || undefined} style={{ ...pos, '--k': i % 2 }} />
      ))}
    </div>
  )
}
