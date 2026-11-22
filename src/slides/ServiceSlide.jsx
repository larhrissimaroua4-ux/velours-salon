import { useEffect, useRef } from 'react'
import LineArt from '@/art/LineArt'
import Split from '@/components/Split'
import { useI18n } from '@/i18n/I18n'
import { gsap } from '@/lib/gsap'
import styles from './Slides.module.css'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const lerp = (a, b, k) => a + (b - a) * k

/**
 * Slide d'une prestation, animée AU SCROLL (le deck fait avancer scrub.target) :
 *   0 → 0,6  les prestations s'allument une à une, la photo se resserre,
 *            le grand chiffre monte, la pastille tourne ;
 *   0,6 → 1  l'arche s'agrandit jusqu'au plein écran, le nom du soin apparaît.
 * Le calque plein écran part exactement du cadre de l'arche (même photo, même
 * recadrage) : le passage de l'un à l'autre est invisible.
 */
export default function ServiceSlide({ service, index, onBook, active, scrub }) {
  const { t, localize } = useI18n()
  const copy = t('service')
  const title = localize(service.title)
  const rootRef = useRef(null)
  const archRef = useRef(null)
  const expandRef = useRef(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const root = rootRef.current
    const arch = archRef.current
    const expand = expandRef.current
    const items = [...root.querySelectorAll('[data-item]')]
    if (!scrub) return undefined
    let current = scrub.target
    let shown = -1
    let flagged = false
    const deck = root.closest('[data-deck]')
    // en-tête en blanc lait quand la photo occupe l'écran
    const flag = (on) => {
      if (on === flagged || !deck) return
      flagged = on
      deck.toggleAttribute('data-photo', on)
    }

    const tick = (_, deltaMs) => {
      if (scrub.snap) {
        current = scrub.target
        scrub.snap = false
        shown = -1
      }
      if (!activeRef.current) flag(false)
      if (!activeRef.current && shown >= 0) return
      const dt = Math.min(deltaMs / 1000, 0.1)
      current += (scrub.target - current) * (1 - Math.exp(-dt * 6))
      if (Math.abs(scrub.target - current) < 0.0005) current = scrub.target
      if (Math.abs(current - shown) < 0.0002) return
      shown = current

      const e = smooth(0.6, 1, current)
      flag(activeRef.current && e > 0.45)
      root.style.setProperty('--p', current.toFixed(4))
      root.style.setProperty('--e', e.toFixed(4))

      // prestation « en lumière »
      const step = current < 0.03 ? -1 : Math.min(items.length - 1, Math.floor(((current - 0.03) / 0.52) * items.length))
      items.forEach((item, i) => item.toggleAttribute('data-on', i === step))
      root.toggleAttribute('data-reading', step >= 0 && e < 0.5)

      // l'arche devient plein écran
      if (!expand) return
      if (e <= 0) {
        expand.style.visibility = 'hidden'
        arch.style.visibility = ''
        return
      }
      const box = root.getBoundingClientRect()
      const a = arch.getBoundingClientRect()
      const scroller = root.closest('[data-scroll]')
      const top = scroller ? scroller.scrollTop : 0
      const height = scroller ? scroller.clientHeight : box.height
      const left = lerp(a.left - box.left, 0, e)
      const y = lerp(a.top - box.top, top, e)
      const w = lerp(a.width, box.width, e)
      const h = lerp(a.height, height, e)
      const r = lerp(a.width / 2, 0, e)
      Object.assign(expand.style, {
        visibility: 'visible',
        left: `${left}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        borderRadius: `${r}px ${r}px 0 0`,
      })
      arch.style.visibility = 'hidden'
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      flag(false)
    }
  }, [scrub])

  const photo = service.image ? (
    <img src={`${service.image}.webp`} srcSet={`${service.image}-sm.webp 560w, ${service.image}.webp 900w`} sizes="(max-width: 760px) 100vw, 60vw" alt="" className={styles.photo} decoding="async" />
  ) : null

  return (
    <div ref={rootRef} className={`${styles.layout} ${styles.service}`} data-flip={index % 2 ? '' : undefined}>
      <span className={styles.number} aria-hidden="true">
        <Split text={String(index + 1).padStart(2, '0')} />
      </span>
      <div className={styles.copy}>
        <p data-fade className={styles.eyebrow}>
          <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
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
        <div ref={archRef} data-arch className={styles.arch}>
          <div data-zoom className={styles.archInner}>
            {photo ?? <LineArt name={service.art} className={styles.art} />}
          </div>
        </div>
        <div data-badge className={styles.badge}>
          <span>{copy.from}</span>
          <strong>{service.from}</strong>
          <span>{copy.currency}</span>
        </div>
      </div>
      {photo ? (
        <div ref={expandRef} className={styles.expand} aria-hidden="true">
          {photo}
          <p className={styles.expandCaption}>
            <span className={styles.expandIndex}>{String(index + 1).padStart(2, '0')}</span>
            {localize(service.label)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
