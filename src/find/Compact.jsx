import { useI18n } from '@/i18n/I18n'
import styles from './Compact.module.css'

/**
 * Poudrier vu de face. Fermé : le couvercle doré gravé VELOURS couvre le
 * fard. Ouvert (FindPanel fait pivoter [data-compact-lid] sur sa charnière) :
 * le miroir du couvercle se retrouve au-dessus et reflète le plan du Maârif.
 *   [data-map-street] rues · [data-map-avenue] boulevards · [data-map-label] noms
 *   [data-map-route]  chemin tracé à l'eye-liner · [data-map-flick] son trait final
 *   [data-map-pearl]  perle qui marque le salon · [data-map-sheen] reflet du miroir
 * Toutes les lignes ont pathLength=1 (tracé par strokeDashoffset).
 */

const S = 400
const C = S / 2
const PEARL = [236, 214]

function family(angle, spacing, offset, jitter) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const lines = []
  for (let d = -C + offset, i = 0; d < C; d += spacing, i++) {
    const shift = d + Math.sin(i * 1.7) * jitter
    const ox = C - dy * shift
    const oy = C + dx * shift
    lines.push(`M${(ox - dx * S).toFixed(1)} ${(oy - dy * S).toFixed(1)}L${(ox + dx * S).toFixed(1)} ${(oy + dy * S).toFixed(1)}`)
  }
  return lines
}

const STREETS = [...family(0.18, 30, 6, 4), ...family(1.75, 34, 14, 5)]

const AVENUES = [
  // boulevard Zerktouni
  'M-10 330 C90 300 160 262 214 236 S330 170 420 118',
  // boulevard Bir Anzarane
  'M60 -10 C96 90 150 170 214 236 S300 350 330 420',
  // boulevard Brahim Roudani
  'M-10 120 C80 136 180 150 280 160 S380 176 420 182',
]

// le chemin, comme un trait d'eye-liner : il part du Twin Center et finit
// par une petite virgule relevée près de la perle
const ROUTE = 'M118 284 C150 270 180 252 206 240 C222 232 226 222 232 214'
const FLICK = 'M232 214 C238 206 246 200 258 194 C248 204 242 212 236 220 Z'

const TICK_TEXT = 'VELOURS · SALON DE BEAUTÉ · CASABLANCA · '

export default function Compact() {
  const { t } = useI18n()

  return (
    <div className={styles.compact} data-compact>
      {/* ---- Fond : le boîtier et son fard pressé */}
      <div className={styles.base} data-compact-base>
        <div className={styles.powder}>
          <span className={styles.powderMark}>V</span>
        </div>
      </div>
      <span className={styles.hinge} aria-hidden="true" />

      {/* ---- Couvercle : face dorée / miroir */}
      <div className={styles.lid} data-compact-lid>
        <div className={styles.lidFront} aria-hidden="true">
          <svg viewBox="0 0 200 200" className={styles.engrave}>
            <defs>
              <path id="compact-ring" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
            </defs>
            <circle cx="100" cy="100" r="88" className={styles.engraveLine} />
            <circle cx="100" cy="100" r="60" className={styles.engraveLine} />
            <text className={styles.engraveText}>
              <textPath href="#compact-ring">{TICK_TEXT.repeat(2)}</textPath>
            </text>
            <text x="100" y="118" className={styles.monogram}>
              V
            </text>
          </svg>
        </div>

        <div className={styles.lidBack}>
          <svg viewBox={`0 0 ${S} ${S}`} className={styles.map} role="img" aria-label={t('find.mapLabel')}>
            <defs>
              <clipPath id="compact-glass">
                <circle cx={C} cy={C} r={C - 14} />
              </clipPath>
              <radialGradient id="compact-mirror" cx="0.4" cy="0.35" r="0.75">
                <stop offset="0" stopColor="#fbf6f2" />
                <stop offset="0.55" stopColor="#eadbd5" />
                <stop offset="1" stopColor="#cdb2aa" />
              </radialGradient>
              <radialGradient id="compact-pearl" cx="0.36" cy="0.32" r="0.7">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.45" stopColor="#f4e8e3" />
                <stop offset="1" stopColor="#b89a92" />
              </radialGradient>
              <linearGradient id="compact-sheen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>

            <circle cx={C} cy={C} r={C - 14} fill="url(#compact-mirror)" />

            <g clipPath="url(#compact-glass)">
              {STREETS.map((d, i) => (
                <path key={i} d={d} pathLength="1" className={styles.street} data-map-street />
              ))}
              {AVENUES.map((d, i) => (
                <path key={i} d={d} pathLength="1" className={styles.avenue} data-map-avenue />
              ))}

              {/* rond-point du Twin Center */}
              <circle cx="118" cy="284" r="13" pathLength="1" className={styles.avenue} data-map-avenue />

              <g className={styles.labels}>
                <text data-map-label transform="translate(262 186) rotate(-30)">BD ZERKTOUNI</text>
                <text data-map-label transform="translate(112 52) rotate(64)">BD BIR ANZARANE</text>
                <text data-map-label x="70" y="320" className={styles.twin}>
                  {t('find.twin')}
                </text>
                <text data-map-label x={PEARL[0] + 20} y={PEARL[1] + 34} className={styles.district}>
                  MAÂRIF
                </text>
              </g>

              <path d={ROUTE} pathLength="1" className={styles.route} data-map-route />
              <path d={FLICK} className={styles.flick} data-map-flick />

              {/* reflet qui balaie le miroir à l'ouverture */}
              <rect x="-160" y="-40" width="120" height="480" fill="url(#compact-sheen)" transform="rotate(24 200 200)" className={styles.sheen} data-map-sheen />
            </g>

            {/* la perle du salon */}
            <g data-map-pearl>
              <circle cx={PEARL[0]} cy={PEARL[1]} r="13" className={styles.pulse} />
              <circle cx={PEARL[0]} cy={PEARL[1]} r="13" className={`${styles.pulse} ${styles.pulseLate}`} />
              <circle cx={PEARL[0]} cy={PEARL[1] + 2} r="13" className={styles.pearlShadow} />
              <circle cx={PEARL[0]} cy={PEARL[1]} r="12" fill="url(#compact-pearl)" />
              <circle cx={PEARL[0] - 4} cy={PEARL[1] - 4.5} r="3.2" className={styles.pearlLight} />
            </g>

            {/* biseau du miroir */}
            <circle cx={C} cy={C} r={C - 14} className={styles.bevel} />
            <circle cx={C} cy={C} r={C - 19} className={styles.bevelInner} />
          </svg>
        </div>
      </div>
    </div>
  )
}
