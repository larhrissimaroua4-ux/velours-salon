import Split from '@/components/Split'
import { useI18n } from '@/i18n/I18n'
import styles from './Slides.module.css'

export default function HeroSlide() {
  const { t } = useI18n()
  const hero = t('hero')
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
            <span className={styles.monogram} aria-hidden="true">
              V
            </span>
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
