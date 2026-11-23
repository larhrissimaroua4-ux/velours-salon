import { useMemo, useState } from 'react'
import BookingSlide from '@/booking/BookingSlide'
import { services } from '@/data/salon'
import Deck from '@/deck/Deck'
import { useI18n } from '@/i18n/I18n'
import HeroSlide from '@/slides/HeroSlide'
import ServiceSlide from '@/slides/ServiceSlide'

export default function App() {
  const { t, localize } = useI18n()
  // soin choisi depuis sa slide (« Réserver ce soin ») : pré-rempli dans le rendez-vous
  const [preset, setPreset] = useState(null)

  const slides = useMemo(() => {
    const list = [{ id: 'accueil', label: t('nav.home'), theme: 'video', scrub: true, content: ({ active, scrub }) => <HeroSlide active={active} scrub={scrub} /> }]
    services.forEach((service, i) => list.push({ id: service.id, label: localize(service.label), scrub: 0.45, scrubPause: 1, content: ({ go, active, scrub }) => <ServiceSlide service={service} index={i} active={active} scrub={scrub} onBook={() => {
            setPreset({ id: service.id, at: Date.now() })
            go(services.length + 1)
          }} /> }))
    list.push({ id: 'contact', label: t('nav.contact'), theme: 'dark', content: () => <BookingSlide preset={preset} /> })
    return list
  }, [t, localize, preset])

  return <Deck slides={slides} />
}
