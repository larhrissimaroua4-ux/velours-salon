/**
 * Découpe un texte en mots puis en lettres masquées (animées par le deck via
 * [data-char]). Les mots ne se coupent jamais en fin de ligne.
 */
export default function Split({ text, className }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <span key={w} aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
          {[...word].map((char, c) => (
            <span key={c} data-char style={{ display: 'inline-block' }}>
              {char}
            </span>
          ))}
          {w < text.split(' ').length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  )
}
