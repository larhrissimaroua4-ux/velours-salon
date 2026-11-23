import { useEffect, useId, useMemo, useState } from 'react'
import Split from '@/components/Split'
import { salon, services } from '@/data/salon'
import { useI18n } from '@/i18n/I18n'
import slides from '@/slides/Slides.module.css'
import { EMPTY, FIELDS, maxDateISO, timeSlots, todayISO, validate } from './rules'
import VanityMirror from './VanityMirror'
import styles from './Booking.module.css'

/**
 * Slide « Rendez-vous » : formulaire à gauche, miroir de loge à droite qui
 * s'allume et s'écrit au fil des choix. L'envoi signe le miroir d'un baiser et
 * prépare le message WhatsApp. `preset` : soin choisi depuis sa slide.
 */
export default function BookingSlide({ preset }) {
  const { t, localize, locale } = useI18n()
  const copy = t('booking')
  const id = useId()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [sent, setSent] = useState(false)
  const [limits] = useState(() => ({ min: todayISO(), max: maxDateISO() }))

  // « Réserver ce soin » depuis une slide : le soin est déjà choisi
  useEffect(() => {
    if (!preset) return
    setValues((v) => (v.service === preset.id ? v : { ...v, service: preset.id, item: '' }))
    setSent(false)
  }, [preset])

  const service = services.find((s) => s.id === values.service)
  const item = values.item === '' ? undefined : service?.items[Number(values.item)]
  const slots = useMemo(() => timeSlots(values.date), [values.date])

  const set = (field) => (event) => {
    const next = { ...values, [field]: event.target.value }
    if (field === 'service') next.item = ''
    if (field === 'date' && next.time && !timeSlots(next.date).includes(next.time)) next.time = ''
    setValues(next)
    if (touched) setErrors(validate(next))
  }

  const longDate = (value) =>
    new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00`))
  const time = values.time ? (locale === 'fr' ? values.time.replace(':', ' h ') : values.time) : ''
  // sur le miroir : « samedi 28 nov. · 15 h 30 » (tient sur une ligne)
  const shortDate = (value) => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00`))
  const lines = {
    name: values.name.trim(),
    when: [values.date ? shortDate(values.date) : '', time].filter(Boolean).join(' · '),
    item: item ? `${localize(item.name)} · ${item.time}` : service ? localize(service.label) : '',
  }
  const filled = FIELDS.filter((f) => (f === 'name' ? values.name.trim().length >= 2 : f === 'phone' ? values.phone.replace(/\D/g, '').length >= 8 : values[f] !== '')).length

  const submit = (event) => {
    event.preventDefault()
    const found = validate(values)
    setTouched(true)
    setErrors(found)
    if (Object.keys(found).length) {
      event.currentTarget.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    setSent(true)
  }

  const message = copy.message
    .replace('{item}', item ? `${localize(item.name)} (${item.time})` : '')
    .replace('{date}', values.date ? longDate(values.date) : '')
    .replace('{time}', values.time)
    .replace('{name}', values.name.trim())
    .replace('{phone}', values.phone.trim())
  const whatsapp = `https://wa.me/${salon.whatsapp ?? ''}?text=${encodeURIComponent(message)}`

  const field = (name) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
  })
  const error = (name) =>
    errors[name] ? (
      <p id={`${id}-${name}-error`} className={styles.error} role="alert">
        {copy.errors[errors[name]]}
      </p>
    ) : null

  return (
    <div className={styles.booking}>
      <span className={slides.giant} aria-hidden="true">
        <Split text="Velours" />
      </span>

      <div className={styles.copy}>
        <p data-fade className={styles.lead}>
          {copy.lead}
        </p>

        {sent ? (
          <div className={styles.success}>
            <p className={styles.successTitle}>{copy.successTitle}</p>
            <p className={styles.successText}>{copy.successText}</p>
            <div className={styles.actions}>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${slides.button} ${slides.buttonLight} ${styles.submit}`}>
                <span className={slides.buttonFill} aria-hidden="true" />
                <span className={slides.buttonLabel}>{copy.whatsapp}</span>
              </a>
              <button type="button" className={styles.textButton} onClick={() => setSent(false)}>
                {copy.again}
              </button>
            </div>
            <p className={styles.notice}>{copy.notice}</p>
          </div>
        ) : (
          <form data-fade className={styles.form} onSubmit={submit} noValidate>
            <div className={styles.field}>
              <label htmlFor={`${id}-service`}>{copy.service}</label>
              <select {...field('service')}>
                <option value="" disabled>
                  {copy.choose}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {localize(s.label)}
                  </option>
                ))}
              </select>
              {error('service')}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-item`}>{copy.item}</label>
              <select {...field('item')} disabled={!service}>
                <option value="" disabled>
                  {copy.choose}
                </option>
                {service?.items.map((it, i) => (
                  <option key={it.name.fr} value={i}>
                    {localize(it.name)} · {it.price} DH
                  </option>
                ))}
              </select>
              {error('item')}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-date`}>{copy.date}</label>
              <input type="date" min={limits.min} max={limits.max} {...field('date')} />
              {error('date')}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-time`}>{copy.time}</label>
              <select {...field('time')}>
                <option value="" disabled>
                  {copy.choose}
                </option>
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {error('time')}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-name`}>{copy.name}</label>
              <input type="text" autoComplete="given-name" maxLength={24} {...field('name')} />
              {error('name')}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-phone`}>{copy.phone}</label>
              <input type="tel" autoComplete="tel" inputMode="tel" {...field('phone')} />
              {error('phone')}
            </div>
            <button type="submit" className={`${slides.button} ${slides.buttonLight} ${styles.submit}`}>
              <span className={slides.buttonFill} aria-hidden="true" />
              <span className={slides.buttonLabel}>{copy.submit}</span>
            </button>
          </form>
        )}
      </div>

      <div data-fade className={styles.visual}>
        <VanityMirror service={values.service} lines={lines} filled={filled} sealed={sent} />
      </div>
    </div>
  )
}
