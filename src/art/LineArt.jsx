// Illustrations au trait (une par prestation). Chaque tracé a pathLength=1 :
// le deck le « dessine » à l'entrée de la slide (stroke-dashoffset 1 → 0).
const ART = {
  serum: [
    'M100 52c0 0-13 18-13 28a13 13 0 0 0 26 0c0-10-13-28-13-28z',
    'M86 118v-30a14 14 0 0 1 28 0v30',
    'M80 118h40v26H80z',
    'M70 144h60a14 14 0 0 1 14 14v104a16 16 0 0 1-16 16H72a16 16 0 0 1-16-16V158a14 14 0 0 1 14-14z',
    'M76 196h48M76 212h30',
    'M70 170v80',
    'M152 92c0 0-7 10-7 15a7 7 0 0 0 14 0c0-5-7-15-7-15z',
  ],
  scissors: [
    'M52 248a22 22 0 1 0 44 0a22 22 0 1 0 -44 0',
    'M104 248a22 22 0 1 0 44 0a22 22 0 1 0 -44 0',
    'M86 229L128 58M114 229L72 58',
    'M96 166a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    'M150 40c-20 40 18 70-2 112s14 70-6 110',
    'M164 52c-16 36 14 64-2 100s12 62-4 98',
  ],
  polish: [
    'M84 54h32v76H84z',
    'M78 130h44v16H78z',
    'M66 146h68a16 16 0 0 1 16 16v84a24 24 0 0 1-24 24H74a24 24 0 0 1-24-24v-84a16 16 0 0 1 16-16z',
    'M68 172c0 20 0 50 4 70',
    'M100 196c-8 10-8 24 0 34c8-10 8-24 0-34z',
    'M160 70c10-12 26-6 26 8c0 16-26 30-26 30s-26-14-26-30c0-14 16-20 26-8z',
  ],
  lipstick: [
    'M74 178h52v98H74z',
    'M80 144h40v34H80z',
    'M86 144V84l28-24v84',
    'M74 206h52',
    'M140 96c10-8 22-8 30 0c-6 4-10 10-15 10s-9-6-15-10z',
    'M140 96c6 12 24 12 30 0',
  ],
}

export default function LineArt({ name, className }) {
  return (
    <svg viewBox="0 0 200 300" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {(ART[name] ?? []).map((d) => (
        <path key={d} d={d} pathLength="1" data-draw />
      ))}
    </svg>
  )
}
