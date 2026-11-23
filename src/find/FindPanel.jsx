import { useEffect, useRef } from 'react'
import { salon } from '@/data/salon'
import { useI18n } from '@/i18n/I18n'
import { gsap, reducedMotion } from '@/lib/gsap'
import Compact from './Compact'
import styles from './FindPanel.module.css'

// 33.5862 → « 33°35′10″ N »
function dms(value, positive, negative) {
  const abs = Math.abs(value)
  const d = Math.floor(abs)
  const m = Math.floor((abs - d) * 60)
  const s = Math.round(((abs - d) * 60 - m) * 60)
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″ ${value >= 0 ? positive : negative}`
}

/**
 * Contenu du menu « Nous trouver » : liens des slides (téléphone seulement),
 * l'adresse, les horaires, et le poudrier qui s'ouvre sur le plan.
 * La chorégraphie démarre à chaque ouverture (open), après le rideau du Deck.
 */
export default function FindPanel({ open, slides, current, onPick, onBook }) {
  const rootRef = useRef(null)
  const { t, localize } = useI18n()
  const copy = t('find')

  useEffect(() => {
    const root = rootRef.current
    const q = gsap.utils.selector(root)
    const coords = q('[data-find-coords]')[0]
    const final = `${dms(salon.lat, 'N', 'S')} · ${dms(salon.lng, 'E', 'W')}`
    if (!open) {
      root.removeAttribute('data-find-open')
      return undefined
    }
    root.setAttribute('data-find-open', '')

    if (reducedMotion()) {
      gsap.set(q('[data-compact-lid]'), { rotationX: -180 })
      gsap.set(q('[data-map-street], [data-map-avenue], [data-map-route]'), { strokeDashoffset: 0 })
      coords.textContent = final
      return undefined
    }

    const counter = { p: 0 }
    const tl = gsap
      .timeline({ delay: 0.35 })
      // le texte
      .fromTo(q('[data-find-link]'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.04 }, 0.1)
      .fromTo(q('[data-find-rule]'), { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1.2, ease: 'expo.inOut' }, 0.2)
      .fromTo(q('[data-find-line]'), { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.3)
      .fromTo(q('[data-find-fade]'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.9)
      // le poudrier arrive fermé, puis s'ouvre lentement sur sa charnière
      .fromTo(q('[data-compact]'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 0.2)
      .fromTo(q('[data-compact-lid]'), { rotationX: 0 }, { rotationX: -180, duration: 2.2, ease: 'power3.inOut' }, 1.1)
      // le plan apparaît dans le miroir
      .fromTo(q('[data-map-sheen]'), { opacity: 0.9, x: 0 }, { opacity: 0, x: 560, duration: 1.8, ease: 'power2.inOut' }, 2.6)
      .fromTo(q('[data-map-street]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: { each: 0.025, from: 'random' }, ease: 'power2.inOut' }, 2.5)
      .fromTo(q('[data-map-avenue]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.15, ease: 'power2.inOut' }, 2.9)
      .fromTo(q('[data-map-label]'), { opacity: 0 }, { opacity: 1, duration: 1, stagger: 0.08, ease: 'none' }, 3.4)
      // le trait d'eye-liner, d'un seul geste, puis sa virgule
      .fromTo(q('[data-map-route]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, 3.7)
      .fromTo(q('[data-map-flick]'), { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'none' }, 4.95)
      .fromTo(q('[data-map-pearl]'), { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.9, ease: 'bounce.out' }, 4.9)
      .fromTo(
        counter,
        { p: 0 },
        {
          p: 1,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: () => {
            const k = counter.p
            coords.textContent = `${dms(salon.lat * k, 'N', 'S')} · ${dms(salon.lng * k, 'E', 'W')}`
          },
        },
        2.8,
      )
    return () => tl.kill()
  }, [open])

  return (
    <div ref={rootRef} className={styles.panel}>
      {/* sur téléphone, le menu reste aussi la navigation */}
      <ol className={styles.links}>
        {slides.map((slide, i) => (
          <li key={slide.id} className={styles.linkMask}>
            <button type="button" data-find-link className={styles.link} data-active={i === current || undefined} onClick={() => onPick(i)}>
              {slide.label}
            </button>
          </li>
        ))}
      </ol>

      <div className={styles.find}>
        <div className={styles.address}>
          <p className={styles.eyebrow}>
            <span data-find-rule className={styles.rule} />
            {copy.eyebrow}
          </p>
          <address className={styles.street}>
            <span className={styles.lineMask}>
              <span data-find-line className={styles.line}>
                {localize(salon.street)}
              </span>
            </span>
            <span className={styles.lineMask}>
              <span data-find-line className={`${styles.line} ${styles.italic}`}>
                {localize(salon.district)}
              </span>
            </span>
          </address>
          <p data-find-coords className={styles.coords} aria-hidden="true" />

          <dl data-find-fade className={styles.hours}>
            <dt>{copy.hours}</dt>
            {salon.hours.map((slot) => (
              <dd key={slot.days.fr}>
                {localize(slot.days)} <span>{localize(slot.time)}</span>
              </dd>
            ))}
            <dd>
              <span>{copy.closed}</span>
            </dd>
          </dl>

          <div data-find-fade className={styles.actions}>
            <button type="button" className={styles.book} onClick={onBook}>
              <span className={styles.bookFill} aria-hidden="true" />
              <span className={styles.bookLabel}>{copy.book}</span>
            </button>
            <a href={salon.maps} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
              {copy.directions}
            </a>
            <a href={salon.instagram} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
              {copy.instagram}
            </a>
          </div>
        </div>

        <div className={styles.compactWrap}>
          <Compact />
        </div>
      </div>
    </div>
  )
}
