import { useEffect, useRef } from 'react'
import Split from '@/components/Split'
import { reducedMotion } from '@/lib/gsap'
import { useI18n } from '@/i18n/I18n'
import styles from './Slides.module.css'

const VIDEO = '/videos/hero-satin.mp4'
const POSTER = '/videos/hero-satin.webp'

/**
 * Accueil. Dans l'arche : le satin bordeaux qui dévoile le visage. La vidéo
 * repart du début à chaque arrivée sur la slide, puis reste sur la dernière
 * image (le visage). Mouvement réduit : seulement l'image finale.
 */
export default function HeroSlide({ active }) {
  const { t } = useI18n()
  const hero = t('hero')
  const videoRef = useRef(null)
  const firstRef = useRef(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video || reducedMotion()) return undefined
    if (!active) {
      video.pause()
      return undefined
    }
    // au premier chargement on attend la fin de l'intro, sinon la fin du rideau
    const delay = firstRef.current ? 2900 : 1200
    firstRef.current = false
    const timer = window.setTimeout(() => {
      video.currentTime = 0
      video.play().catch(() => {})
    }, delay)
    return () => window.clearTimeout(timer)
  }, [active])

  return (
    <div className={`${styles.layout} ${styles.hero}`}>
      <span className={styles.giant} aria-hidden="true">
        <Split text="Velours" />
      </span>
      <div className={styles.copy}>
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
        <p data-fade className={styles.hint}>
          <span className={styles.hintMouse} aria-hidden="true" />
          {hero.hint}
        </p>
      </div>
      <div className={styles.visual}>
        <div data-arch className={styles.arch}>
          <div data-zoom className={styles.archInner}>
            <video ref={videoRef} className={styles.video} src={VIDEO} poster={reducedMotion() ? POSTER : undefined} muted playsInline preload="auto" aria-hidden="true" />
          </div>
        </div>
        <svg data-badge className={styles.ring} viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <path id="hero-ring" d="M100 100m-80 0a80 80 0 1 1 160 0a80 80 0 1 1-160 0" />
          </defs>
          <text>
            <textPath href="#hero-ring" textLength="498" lengthAdjust="spacing">{hero.ring}</textPath>
          </text>
        </svg>
      </div>
    </div>
  )
}
