import Split from '@/components/Split'
import { salon } from '@/data/salon'
import { useI18n } from '@/i18n/I18n'
import styles from './Slides.module.css'

export default function ContactSlide() {
  const { t, localize } = useI18n()
  const copy = t('contact')
  const whatsapp = `https://wa.me/${salon.whatsapp ?? ''}?text=${encodeURIComponent(copy.message)}`
  return (
    <div className={styles.contact}>
      <span className={styles.giant} aria-hidden="true">
        <Split text="Velours" />
      </span>
      <div className={styles.contactMain}>
        <p data-fade className={styles.eyebrow}>
          <span data-line className={styles.rule} />
          {copy.eyebrow}
        </p>
        <h2 className={styles.title}>
          {copy.title.map((line, i) => (
            <span key={i} className={i === 1 ? `${styles.titleLine} ${styles.italic}` : styles.titleLine}>
              <Split text={line} />
            </span>
          ))}
        </h2>
        <p data-fade className={styles.lead}>
          {copy.lead}
        </p>
        <div data-fade className={styles.actions}>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${styles.button} ${styles.buttonLight}`}>
            <span className={styles.buttonFill} aria-hidden="true" />
            <span className={styles.buttonLabel}>{copy.whatsapp}</span>
          </a>
          <a href={salon.instagram} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
            {copy.instagram}
          </a>
          <a href={salon.maps} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
            {copy.maps}
          </a>
        </div>
      </div>
      <dl className={styles.infos}>
        <div data-fade>
          <dt>{copy.hoursLabel}</dt>
          {salon.hours.map((slot) => (
            <dd key={slot.days.fr}>
              {localize(slot.days)} <span>{localize(slot.time)}</span>
            </dd>
          ))}
        </div>
        <div data-fade>
          <dt>{copy.addressLabel}</dt>
          <dd>{localize(salon.address)}</dd>
        </div>
      </dl>
      <p data-fade className={styles.footer}>
        VELOURS · {copy.footer} · © {new Date().getFullYear()}
      </p>
    </div>
  )
}
