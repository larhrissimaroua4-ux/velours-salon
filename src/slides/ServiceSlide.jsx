import { useCallback, useEffect, useRef } from 'react'
import { ACTS } from '@/acts/Acts'
import LineArt from '@/art/LineArt'
import Split from '@/components/Split'
import { useI18n } from '@/i18n/I18n'
import { gsap, reducedMotion } from '@/lib/gsap'
import styles from './Slides.module.css'

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/**
 * Slide d'une prestation, animée AU SCROLL (le deck fait avancer scrub.target
 * de 0 à 1) : dans l'arche, le geste du métier sur de vraies photos (goutte,
 * ciseaux, vernis, rouge à lèvres : src/acts) ; en parallèle les prestations
 * s'allument une à une et la pastille tourne. Sur téléphone, le contenu qui
 * dépasse défile une fois le geste terminé (scrubPause dans App).
 */
export default function ServiceSlide({ service, index, onBook, active, scrub }) {
  const { t, localize } = useI18n()
  const copy = t('service')
  const title = localize(service.title)
  const rootRef = useRef(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const actRef = useRef(null)
  const act = ACTS[service.art]
  const onActReady = useCallback((update) => {
    actRef.current = update
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const items = [...root.querySelectorAll('[data-item]')]
    if (!scrub) return undefined
    const still = reducedMotion()
    let current = scrub.target
    let shown = -1

    const tick = (_, deltaMs) => {
      if (scrub.snap) {
        current = scrub.target
        scrub.snap = false
        shown = -1
      }
      if (!activeRef.current && shown >= 0) return
      const dt = Math.min(deltaMs / 1000, 0.1)
      current += (scrub.target - current) * (1 - Math.exp(-dt * 6))
      if (Math.abs(scrub.target - current) < 0.0005) current = scrub.target
      if (Math.abs(current - shown) < 0.0002) return
      shown = current

      // geste du métier dans l'arche (vraies photos)
      actRef.current?.(still ? 1 : clamp01(current / 0.94))
      root.style.setProperty('--p', current.toFixed(4))

      // prestation « en lumière »
      const step = current < 0.03 || current > 0.97 ? -1 : Math.min(items.length - 1, Math.floor(((current - 0.03) / 0.9) * items.length))
      items.forEach((item, i) => item.toggleAttribute('data-on', i === step))
      root.toggleAttribute('data-reading', step >= 0)
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [scrub])

  const photo = service.image ? (
    <img src={`${service.image}.webp`} srcSet={`${service.image}-sm.webp 560w, ${service.image}.webp 900w`} sizes="(max-width: 760px) 100vw, 60vw" alt="" className={styles.photo} decoding="async" />
  ) : null

  return (
    <div ref={rootRef} className={`${styles.layout} ${styles.service}`} data-flip={index % 2 ? '' : undefined}>
      <div className={styles.copy}>
        <p data-fade className={styles.eyebrow}>
          <span data-line className={styles.rule} />
          {localize(service.label)}
        </p>
        <h2 className={styles.title}>
          {title.map((line, i) => (
            <span key={i} className={i === 1 ? `${styles.titleLine} ${styles.italic}` : styles.titleLine}>
              <Split text={line} />
            </span>
          ))}
        </h2>
        <p data-fade className={styles.lead}>
          {localize(service.text)}
        </p>
        <ul className={styles.items}>
          {service.items.map((item) => (
            <li key={item.name.fr} data-fade data-item className={styles.item}>
              <span data-line className={styles.itemRule} />
              <span className={styles.itemMark} aria-hidden="true" />
              <span className={styles.itemName}>{localize(item.name)}</span>
              <span className={styles.itemTime}>{item.time}</span>
              <span className={styles.itemPrice}>
                {item.price} <small>{copy.currency}</small>
              </span>
            </li>
          ))}
        </ul>
        <button data-fade type="button" className={styles.button} onClick={onBook}>
          <span className={styles.buttonFill} aria-hidden="true" />
          <span className={styles.buttonLabel}>{copy.book}</span>
        </button>
      </div>
      <div className={styles.visual}>
        <div data-arch className={styles.arch}>
          <div data-zoom className={styles.archInner}>
            {photo ?? <LineArt name={service.art} className={styles.art} />}
            {photo && act?.inPhoto ? <act.Component onReady={onActReady} className={styles.photo} /> : null}
          </div>
        </div>
        <div data-badge className={styles.badge}>
          <span>{copy.from}</span>
          <strong>{service.from}</strong>
          <span>{copy.currency}</span>
        </div>
      </div>
    </div>
  )
}
