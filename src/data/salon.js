// Informations du salon : à remplacer par celles de la cliente.
export const salon = {
  name: 'VELOURS',
  address: { fr: 'Casablanca, Maroc', en: 'Casablanca, Morocco' },
  hours: [
    { days: { fr: 'Du mardi au samedi', en: 'Tuesday to Saturday' }, time: { fr: '10 h à 20 h', en: '10 am to 8 pm' } },
    { days: { fr: 'Dimanche', en: 'Sunday' }, time: { fr: '10 h à 16 h', en: '10 am to 4 pm' } },
  ],
  // Démonstration : numéro au format 2126XXXXXXXX, vrai compte Instagram, adresse exacte
  whatsapp: null,
  instagram: 'https://www.instagram.com/',
  maps: 'https://www.google.com/maps/search/?api=1&query=Casablanca',
}

/**
 * Les prestations. `image` (facultatif) : base du chemin d'une photo préparée par
 * tools/build_service_image.py (sans « .webp ») ; sans photo, l'arche affiche
 * l'illustration au trait `art`.
 */
export const services = [
  {
    id: 'visage',
    art: 'serum',
    image: '/images/services/visage',
    label: { fr: 'Soins du visage', en: 'Facials' },
    title: { fr: ['Une peau', 'de velours.'], en: ['Skin like', 'velvet.'] },
    text: {
      fr: 'Diagnostic, nettoyage profond, actifs choisis pour votre peau. Vous repartez reposée, le teint lumineux.',
      en: 'Skin diagnosis, deep cleansing and actives chosen for your skin. You leave rested, with a glowing complexion.',
    },
    from: 300,
    items: [
      { name: { fr: 'Soin éclat', en: 'Glow facial' }, time: '45 min', price: 300 },
      { name: { fr: 'Hydrafacial', en: 'Hydrafacial' }, time: '60 min', price: 650 },
      { name: { fr: 'Massage kobido', en: 'Kobido massage' }, time: '50 min', price: 450 },
      { name: { fr: 'Soin anti-âge', en: 'Anti-ageing facial' }, time: '75 min', price: 750 },
    ],
  },
  {
    id: 'cheveux',
    art: 'scissors',
    image: '/images/services/cheveux',
    label: { fr: 'Coiffure', en: 'Hair' },
    title: { fr: ['Le geste', 'juste.'], en: ['The right', 'touch.'] },
    text: {
      fr: 'Coupe sur mesure, couleur lumineuse, soins profonds. Nos coiffeuses écoutent avant de couper.',
      en: 'Tailored cuts, luminous colour, deep treatments. Our stylists listen before they cut.',
    },
    from: 150,
    items: [
      { name: { fr: 'Coupe et brushing', en: 'Cut and blow-dry' }, time: '60 min', price: 250 },
      { name: { fr: 'Brushing', en: 'Blow-dry' }, time: '40 min', price: 150 },
      { name: { fr: 'Balayage', en: 'Balayage' }, time: '3 h', price: 900 },
      { name: { fr: 'Lissage kératine', en: 'Keratin treatment' }, time: '2 h 30', price: 1200 },
    ],
  },
  {
    id: 'ongles',
    art: 'polish',
    image: '/images/services/ongles',
    label: { fr: 'Ongles', en: 'Nails' },
    title: { fr: ['Le détail', 'qui signe.'], en: ['The detail', 'that signs.'] },
    text: {
      fr: 'Manucure soignée, pose semi-permanente qui tient trois semaines, pédicure spa en fauteuil massant.',
      en: 'Careful manicures, gel polish that lasts three weeks, spa pedicures in a massage chair.',
    },
    from: 120,
    items: [
      { name: { fr: 'Manucure', en: 'Manicure' }, time: '30 min', price: 120 },
      { name: { fr: 'Semi-permanent', en: 'Gel polish' }, time: '45 min', price: 200 },
      { name: { fr: 'Gel sur ongles naturels', en: 'Builder gel' }, time: '75 min', price: 350 },
      { name: { fr: 'Pédicure spa', en: 'Spa pedicure' }, time: '60 min', price: 280 },
    ],
  },
  {
    id: 'maquillage',
    art: 'lipstick',
    image: '/images/services/maquillage',
    label: { fr: 'Maquillage', en: 'Make-up' },
    title: { fr: ['Votre jour,', 'sublimé.'], en: ['Your day,', 'elevated.'] },
    text: {
      fr: 'Maquillage de soirée, mariée et henné, essais compris. Nous venons aussi chez vous pour les grands jours.',
      en: 'Evening, bridal and henna looks, trials included. We also come to you for the big days.',
    },
    from: 350,
    items: [
      { name: { fr: 'Maquillage jour', en: 'Day make-up' }, time: '40 min', price: 350 },
      { name: { fr: 'Maquillage soirée', en: 'Evening make-up' }, time: '60 min', price: 500 },
      { name: { fr: 'Mariée, essai compris', en: 'Bridal, trial included' }, time: '2 × 90 min', price: 2500 },
      { name: { fr: 'Cours d’automaquillage', en: 'Self make-up lesson' }, time: '90 min', price: 600 },
    ],
  },
]
