import { useEffect, useId, useMemo, useState } from 'react'
import Split from '@/components/Split'
import { salon, services } from '@/data/salon'
import { useI18n } from '@/i18n/I18n'
import slides from '@/slides/Slides.module.css'
import { EMPTY, filledSteps, maxDateISO, timeSlots, todayISO, validate } from './rules'
import VanityMirror from './VanityMirror'
import styles from './Booking.module.css'

/**
 * Slide « Rendez-vous » : formulaire à gauche, miroir de loge à droite qui
 * s'allume et s'écrit au fil des choix. L'envoi signe le miroir d'un baiser et
 * prépare le message WhatsApp. Plusieurs soins peuvent être réservés ensemble.
 * `preset` : soin choisi depuis sa slide (ajouté à la sélection).
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
    setValues((v) => (v.picks.some((p) => p.id === preset.id) ? v : { ...v, picks: [...v.picks, { id: preset.id, item: '' }] }))
    setSent(false)
  }, [preset])

  // soins choisis, avec leur prestation (si elle est choisie)
  const chosen = values.picks.map((p) => {
    const service = services.find((s) => s.id === p.id)
    return { ...p, service, item: p.item === '' ? undefined : service.items[Number(p.item)] }
  })
  const items = chosen.filter((c) => c.item)
  const total = items.reduce((sum, c) => sum + c.item.price, 0)
  const slots = useMemo(() => timeSlots(values.date), [values.date])

  const update = (next) => {
    setValues(next)
    if (touched) setErrors(validate(next))
  }
  const set = (field) => (event) => {
    const next = { ...values, [field]: event.target.value }
    if (field === 'date' && next.time && !timeSlots(next.date).includes(next.time)) next.time = ''
    update(next)
  }
  // un soin de plus, ou de moins
  const toggle = (serviceId) => {
    const has = values.picks.some((p) => p.id === serviceId)
    update({ ...values, picks: has ? values.picks.filter((p) => p.id !== serviceId) : [...values.picks, { id: serviceId, item: '' }] })
  }
  const setItem = (serviceId) => (event) => update({ ...values, picks: values.picks.map((p) => (p.id === serviceId ? { ...p, item: event.target.value } : p)) })

  const longDate = (value) =>
    new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00`))
  const time = values.time ? (locale === 'fr' ? values.time.replace(':', ' h ') : values.time) : ''
  // sur le miroir : « samedi 28 nov. · 15 h 30 » (tient sur une ligne)
  const shortDate = (value) => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00`))
  const lines = {
    name: values.name.trim(),
    when: [values.date ? shortDate(values.date) : '', time].filter(Boolean).join(' · '),
    item: items.length ? `${items.map((c) => localize(c.item.name)).join(' + ')} · ${total} DH` : chosen.map((c) => localize(c.service.label)).join(' + '),
  }
  const filled = filledSteps(values)

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
    .replace('{item}', items.map((c) => `${localize(c.item.name)} (${c.item.time})`).join(' + '))
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
            {/* le soin : de vrais objets, plusieurs possibles */}
            <fieldset className={styles.services} aria-invalid={errors.service ? 'true' : undefined} aria-describedby={errors.service ? `${id}-service-error` : undefined}>
              <legend>{copy.service}</legend>
              <div className={styles.tiles}>
                {services.map((s) => {
                  const on = values.picks.some((p) => p.id === s.id)
                  return (
                    <label key={s.id} className={styles.tile} data-on={on || undefined}>
                      <input type="checkbox" name="service" value={s.id} checked={on} onChange={() => toggle(s.id)} className={styles.radio} />
                      <span className={styles.check} aria-hidden="true" />
                      <span className={styles.icon}>
                        <img src={`/images/booking/icon-${s.id}.webp`} alt="" decoding="async" />
                      </span>
                      <span className={styles.tileLabel}>{localize(s.label)}</span>
                    </label>
                  )
                })}
              </div>
              <p className={styles.hint}>{copy.serviceHint}</p>
              {error('service')}
            </fieldset>

            {/* une prestation par soin choisi */}
            {chosen.map((c) => (
              <div key={c.id} className={`${styles.field} ${styles.wide}`}>
                <label htmlFor={`${id}-item-${c.id}`}>
                  {copy.item} · {localize(c.service.label)}
                </label>
                <select id={`${id}-item-${c.id}`} value={c.item ? String(values.picks.find((p) => p.id === c.id).item) : ''} onChange={setItem(c.id)} aria-invalid={errors.item && !c.item ? 'true' : undefined}>
                  <option value="" disabled>
                    {copy.choose}
                  </option>
                  {c.service.items.map((it, i) => (
                    <option key={it.name.fr} value={i}>
                      {localize(it.name)} · {it.time} · {it.price} DH
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {errors.item ? (
              <p className={`${styles.error} ${styles.wide}`} role="alert">
                {copy.errors.item}
              </p>
            ) : null}
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
        <VanityMirror lines={lines} filled={filled} sealed={sent} />
      </div>
    </div>
  )
}
