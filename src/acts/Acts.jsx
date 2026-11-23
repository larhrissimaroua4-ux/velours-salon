import CutPhotoAct from './CutPhotoAct'
import DropPhotoAct from './DropPhotoAct'
import PhotoReveal from './PhotoReveal'

/*
 * Animations « métier » jouées dans l'arche au scroll, une par prestation,
 * sur de VRAIES photos (paires avant / après préparées par tools/build_reveal.py).
 * Chaque composant reçoit onReady(update) : update(t) est appelé à chaque
 * image avec t ∈ [0, 1] (progression de l'animation).
 */

/* Ongles : le vrai pinceau vernit chaque ongle */
// pinceau découpé dans la photo du vernis (240 × 310) : pointe en bas à gauche, bouchon en haut à droite
const POLISH_BRUSH = { src: '/images/acts/polish-brush.webp', w: 240, h: 310, tipX: 14, tipY: 309, axis: Math.atan2(25 - 309, 192 - 14), tilt: -1.55, size: 7.4 }

export function NailPhotoAct({ onReady, className }) {
  return <PhotoReveal name="ongles" tool={POLISH_BRUSH} onReady={onReady} className={className} />
}

/* Maquillage : le vrai rouge à lèvres colore la lèvre du haut puis celle du bas */
// rouge à lèvres découpé dans la photo du maquillage (98 × 343) : pointe en haut, étui en bas
const LIPSTICK = { src: '/images/acts/lipstick.webp', w: 98, h: 343, tipX: 45, tipY: 2, axis: Math.atan2(342, 4), tilt: 1.95, size: 3.6 }

export function LipPhotoAct({ onReady, className }) {
  return <PhotoReveal name="levres" tool={LIPSTICK} onReady={onReady} className={className} />
}

// inPhoto : l'animation remplace la photo dans l'arche
export const ACTS = {
  serum: { Component: DropPhotoAct, inPhoto: true },
  scissors: { Component: CutPhotoAct, inPhoto: true },
  polish: { Component: NailPhotoAct, inPhoto: true },
  lipstick: { Component: LipPhotoAct, inPhoto: true },
}
