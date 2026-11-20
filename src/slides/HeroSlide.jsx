import { useEffect, useRef } from 'react'
import Split from '@/components/Split'
import { gsap } from '@/lib/gsap'
import { useI18n } from '@/i18n/I18n'
import styles from './Slides.module.css'

const DIR = '/images/hero-satin'

/** Ordre de chargement : première, dernière, puis par dichotomie (aperçu vite complet). */
function loadOrder(count) {
  const order = [0, count - 1]
  const seen = new Set(order)
  for (let step = count >> 1; step >= 1; step >>= 1) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i)
        order.push(i)
      }
    }
  }
  return order
}

/**
 * Accueil plein écran. Le satin bordeaux dévoile le visage AU RYTHME DU
 * SCROLL : le deck fait avancer `scrub.target` (0 → 1) tant que la vidéo n'est
 * pas finie, puis passe à la slide suivante. Les images sont dessinées dans
 * un canvas (plus précis et plus fluide qu'une vidéo, y compris sur iPhone).
 */
export default function HeroSlide({ active, scrub }) {
  const { t } = useI18n()
  const hero = t('hero')
  const canvasRef = useRef(null)
  const hintRef = useRef(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const mobile = window.matchMedia('(max-width: 760px)').matches
    const images = []
    let meta = null
    let current = scrub?.target ?? 0
    let drawn = -1
    let cancelled = false

    const resize = () => {
      if (!meta) return
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.min(Math.round(box.width * dpr), Math.round(meta.width * 1.5))
      canvas.height = Math.round((canvas.width * box.height) / Math.max(box.width, 1))
      drawn = -1
    }

    const draw = (frame) => {
      // image chargée la plus proche (le chargement est progressif)
      let image = null
      for (let d = 0; d < images.length && !image; d++) image = images[frame - d]?.complete && images[frame - d].naturalWidth ? images[frame - d] : images[frame + d]?.complete && images[frame + d].naturalWidth ? images[frame + d] : null
      if (!image) return
      const { width, height } = canvas
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const w = image.naturalWidth * scale
      const h = image.naturalHeight * scale
      ctx.drawImage(image, (width - w) / 2, (height - h) * 0.35, w, h)
      drawn = frame
    }

    fetch(`${DIR}/frames.json`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return
        const set = mobile ? 'mobile' : 'desktop'
        meta = data[set]
        const count = meta.count
        images.length = count
        resize()
        loadOrder(count).forEach((i, rank) => {
          const image = new Image()
          image.decoding = 'async'
          if (rank < 2) image.fetchPriority = 'high'
          image.onload = () => {
            if (Math.abs(i - Math.round(current * (count - 1))) <= 2) drawn = -1
          }
          image.src = `${DIR}/${set}/${String(i).padStart(3, '0')}.webp`
          images[i] = image
        })
      })

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const tick = (_, deltaMs) => {
      if (!meta || !scrub) return
      if (scrub.snap) {
        current = scrub.target
        scrub.snap = false
      }
      if (!activeRef.current && drawn >= 0) return
      const dt = Math.min(deltaMs / 1000, 0.1)
      current += (scrub.target - current) * (1 - Math.exp(-dt * 5))
      if (Math.abs(scrub.target - current) < 0.0005) current = scrub.target
      const frame = Math.round(current * (images.length - 1))
      if (frame !== drawn) draw(frame)
      hintRef.current?.closest('[data-hero]')?.style.setProperty('--p', current.toFixed(3))
    }
    gsap.ticker.add(tick)

    return () => {
      cancelled = true
      gsap.ticker.remove(tick)
      observer.disconnect()
    }
  }, [scrub])

  return (
    <div data-hero className={styles.heroFull}>
      <div data-zoom className={styles.heroMedia}>
        <canvas ref={canvasRef} className={styles.heroCanvas} aria-hidden="true" />
      </div>
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroCopy}>
        <p data-fade className={styles.eyebrow}>
          <span data-line className={styles.rule} />
          {hero.eyebrow}
        </p>
        <h1 className={styles.title}>
          {hero.title.map((line, i) => (
            <span key={i} className={i === 2 ? `${styles.titleLine} ${styles.italic}` : styles.titleLine}>
              <Split text={line} />
            </span>
          ))}
        </h1>
        <p data-fade className={styles.lead}>
          {hero.lead}
        </p>
        <p ref={hintRef} data-fade className={styles.hint}>
          <span className={styles.hintMouse} aria-hidden="true" />
          {hero.hint}
          <span className={styles.hintBar} aria-hidden="true">
            <span />
          </span>
        </p>
      </div>
    </div>
  )
}
