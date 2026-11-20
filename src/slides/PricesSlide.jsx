import Split from '@/components/Split'
import { services } from '@/data/salon'
import { useI18n } from '@/i18n/I18n'
import styles from './Slides.module.css'

export default function PricesSlide() {
  const { t, localize } = useI18n()
  const copy = t('prices')
  return (
    <div className={styles.prices}>
      <header className={styles.pricesHead}>
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
        <p data-fade className={styles.note}>
          {copy.note}
        </p>
      </header>
      <div className={styles.columns}>
        {services.map((service) => (
          <section key={service.id} data-fade className={styles.column} aria-label={localize(service.label)}>
            <h3 className={styles.columnTitle}>{localize(service.label)}</h3>
            <ul className={styles.priceList}>
              {service.items.map((item) => (
                <li key={item.name.fr}>
                  <span data-line className={styles.itemRule} />
                  <span>{localize(item.name)}</span>
                  <span className={styles.dots} aria-hidden="true" />
                  <span className={styles.itemPrice}>{item.price}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
