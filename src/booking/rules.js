import { booking } from '@/data/salon'

const pad = (n) => String(n).padStart(2, '0')
const toMinutes = (value) => {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

/**
 * Demande vide. `picks` : les soins choisis, dans l'ordre du choix
 * ({ id, item } ; item = index de la prestation, '' tant qu'elle n'est pas choisie).
 * Une cliente peut réserver plusieurs soins le même jour.
 */
export const EMPTY = { picks: [], date: '', time: '', name: '', phone: '' }

/** Nombre d'étapes remplies (6 au total) : allume les ampoules du miroir. */
export function filledSteps(values) {
  return [
    values.picks.length > 0,
    values.picks.length > 0 && values.picks.every((p) => p.item !== ''),
    values.date !== '',
    values.time !== '',
    values.name.trim().length >= 2,
    values.phone.replace(/\D/g, '').length >= 8,
  ].filter(Boolean).length
}

export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function maxDateISO(now = new Date()) {
  const limit = new Date(now)
  limit.setDate(limit.getDate() + booking.advanceDays)
  return todayISO(limit)
}

/** Créneaux du jour choisi (le dimanche ferme plus tôt). */
export function timeSlots(dateISO) {
  const sunday = dateISO ? new Date(`${dateISO}T12:00`).getDay() === 0 : false
  const last = toMinutes(sunday ? booking.lastSlotSunday : booking.lastSlot)
  const slots = []
  for (let t = toMinutes(booking.firstSlot); t <= last; t += booking.slotMinutes) slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`)
  return slots
}

/** { champ: clé d'erreur } ; vide si la demande est complète. */
export function validate(values, now = new Date()) {
  const errors = {}
  if (!values.picks.length) errors.service = 'service'
  else if (values.picks.some((p) => p.item === '')) errors.item = 'item'
  if (!values.date) errors.date = 'date'
  else {
    const day = new Date(`${values.date}T12:00`).getDay()
    if (values.date < todayISO(now)) errors.date = 'past'
    else if (values.date > maxDateISO(now)) errors.date = 'tooFar'
    else if (!booking.openDays.includes(day)) errors.date = 'closed'
  }
  if (!values.time) errors.time = 'time'
  else if (values.date && new Date(`${values.date}T12:00`).getDay() === 0 && toMinutes(values.time) > toMinutes(booking.lastSlotSunday)) errors.time = 'sunday'
  if (values.name.trim().length < 2) errors.name = 'name'
  if (values.phone.replace(/\D/g, '').length < 8) errors.phone = 'phone'
  return errors
}
