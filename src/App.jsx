import { useMemo } from 'react'
import { services } from '@/data/salon'
import Deck from '@/deck/Deck'
import { useI18n } from '@/i18n/I18n'
import ContactSlide from '@/slides/ContactSlide'
import HeroSlide from '@/slides/HeroSlide'
import PricesSlide from '@/slides/PricesSlide'
import ServiceSlide from '@/slides/ServiceSlide'

export default function App() {
  const { t, localize } = useI18n()

  const slides = useMemo(() => {
    const list = [{ id: 'accueil', label: t('nav.home'), theme: 'video', scrub: true, content: ({ active, scrub }) => <HeroSlide active={active} scrub={scrub} /> }]
    services.forEach((service, i) => list.push({ id: service.id, label: localize(service.label), content: ({ go }) => <ServiceSlide service={service} index={i} onBook={() => go(services.length + 2)} /> }))
    list.push({ id: 'tarifs', label: t('nav.prices'), content: () => <PricesSlide /> })
    list.push({ id: 'contact', label: t('nav.contact'), theme: 'dark', content: () => <ContactSlide /> })
    return list
  }, [t, localize])

  return <Deck slides={slides} />
}
