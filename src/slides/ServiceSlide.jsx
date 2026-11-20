import LineArt from '@/art/LineArt'
import Split from '@/components/Split'
import { useI18n } from '@/i18n/I18n'
import styles from './Slides.module.css'

export default function ServiceSlide({ service, index, onBook }) {
  const { t, localize } = useI18n()
  const copy = t('service')
  const title = localize(service.title)
  return (
    <div className={styles.layout} data-flip={index % 2 ? '' : undefined}>
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
            <li key={item.name.fr} data-fade className={styles.item}>
              <span data-line className={styles.itemRule} />
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
            {service.image ? <img src={service.image} alt="" className={styles.photo} /> : <LineArt name={service.art} className={styles.art} />}
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
