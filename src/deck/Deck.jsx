import { useCallback, useEffect, useRef, useState } from 'react'
import Split from '@/components/Split'
import { useI18n } from '@/i18n/I18n'
import { gsap, reducedMotion } from '@/lib/gsap'
import styles from './Deck.module.css'

// ---- Formes de transition (le rideau puis la slide suivent la même forme)
const SHAPES = {
  arch: (dir) =>
    dir > 0
      ? ['inset(100% 14% 0% 14% round 50% 50% 0% 0%)', 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)']
      : ['inset(0% 14% 100% 14% round 0% 0% 50% 50%)', 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)'],
  side: (dir) => (dir > 0 ? ['inset(0% 0% 0% 100%)', 'inset(0% 0% 0% 0%)'] : ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)']),
  circle: () => ['circle(0% at 50% 50%)', 'circle(75% at 50% 50%)'],
  diagonal: (dir) =>
    dir > 0
      ? ['polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', 'polygon(0% -40%, 100% 0%, 100% 100%, 0% 100%)']
      : ['polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', 'polygon(0% 0%, 100% 0%, 100% 140%, 0% 100%)'],
}
const ORDER = ['arch', 'side', 'circle', 'diagonal']

/** Entrée d'une slide : lettres, filets, textes, arche, trait dessiné, badge. */
function enterTimeline(el) {
  const q = gsap.utils.selector(el)
  return gsap
    .timeline()
    .fromTo(q('[data-char]'), { yPercent: 115, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.016 }, 0)
    .fromTo(q('[data-line]'), { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1.4, stagger: 0.04, ease: 'expo.inOut' }, 0.05)
    .fromTo(q('[data-fade]'), { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.055 }, 0.25)
    .fromTo(q('[data-arch]'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0)
    .fromTo(q('[data-zoom]'), { scale: 1.4 }, { scale: 1, duration: 2.2 }, 0.15)
    .fromTo(q('[data-draw]'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, stagger: 0.14, ease: 'power2.inOut' }, 0.7)
    .fromTo(q('[data-badge]'), { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, duration: 1.5, ease: 'back.out(1.5)' }, 0.9)
}

/** Sortie : les lettres s'envolent, les textes s'effacent. */
function leaveTimeline(el, dir) {
  const q = gsap.utils.selector(el)
  return gsap
    .timeline({ defaults: { ease: 'power3.in' } })
    .to(q('[data-char]'), { yPercent: -110 * dir, duration: 0.55, stagger: 0.006 }, 0)
    .to(q('[data-fade]'), { opacity: 0, y: -24 * dir, duration: 0.5, stagger: 0.02 }, 0)
    .to(q('[data-zoom]'), { scale: 1.15, duration: 1.2, ease: 'power2.in' }, 0)
}

const canScroll = (el, dir) => (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2)

/**
 * Diaporama plein écran : molette, glissé, clavier, menu et flèches.
 * Une slide dont le contenu dépasse défile d'abord en interne ([data-scroll]).
 *
 * @param {{ slides: { id: string, label: string, theme?: 'dark', content: (ctx: { go: (i: number) => void, active: boolean }) => React.ReactNode }[] }} props
 */
export default function Deck({ slides }) {
  const { t, toggle } = useI18n()
  const slideRefs = useRef([])
  const curtainRef = useRef(null)
  const introRef = useRef(null)
  const menuRef = useRef(null)
  const busyRef = useRef(false)
  const unlockRef = useRef(0)
  const enterRef = useRef(new Map())
  const [index, setIndex] = useState(() => Math.max(0, slides.findIndex((s) => `#${s.id}` === window.location.hash)))
  const indexRef = useRef(index)
  const [menuOpen, setMenuOpen] = useState(false)
  const count = slides.length

  const go = useCallback(
    (target) => {
      const from = indexRef.current
      const next = Math.min(count - 1, Math.max(0, target))
      if (busyRef.current || next === from) return
      busyRef.current = true
      const dir = next > from ? 1 : -1
      const fromEl = slideRefs.current[from]
      const toEl = slideRefs.current[next]
      const curtain = curtainRef.current
      indexRef.current = next
      setIndex(next)
      window.history.replaceState(null, '', `#${slides[next].id}`)

      enterRef.current.get(from)?.kill()
      const finish = () => {
        gsap.set(fromEl, { visibility: 'hidden', clearProps: 'transform,clipPath,zIndex' })
        gsap.set(gsap.utils.selector(fromEl)('[data-char],[data-fade],[data-zoom]'), { clearProps: 'all' })
        gsap.set(toEl, { clearProps: 'clipPath,zIndex' })
        gsap.set(curtain, { visibility: 'hidden' })
        busyRef.current = false
        unlockRef.current = performance.now()
      }

      if (reducedMotion()) {
        gsap.set(toEl, { visibility: 'visible', opacity: 0 })
        gsap.to(toEl, { opacity: 1, duration: 0.4, ease: 'none', onComplete: finish })
        return
      }

      // états de départ posés tout de suite (rien ne « saute » pendant le rideau)
      const enter = enterTimeline(toEl).pause(0)
      enterRef.current.set(next, enter)
      const [start, end] = SHAPES[ORDER[next % ORDER.length]](dir)
      curtain.dataset.tone = slides[next].theme === 'dark' ? 'blush' : 'wine'
      gsap.set(fromEl, { zIndex: 1 })
      gsap.set(curtain, { visibility: 'visible', zIndex: 2, clipPath: start })
      gsap.set(toEl, { visibility: 'visible', zIndex: 3, clipPath: start })
      gsap
        .timeline({ onComplete: finish })
        .add(leaveTimeline(fromEl, dir), 0)
        .to(fromEl, { scale: 0.9, yPercent: -5 * dir, duration: 1.4, ease: 'expo.inOut' }, 0)
        .fromTo(curtain, { clipPath: start }, { clipPath: end, duration: 1.15, ease: 'expo.inOut' }, 0.08)
        .fromTo(toEl, { clipPath: start }, { clipPath: end, duration: 1.15, ease: 'expo.inOut' }, 0.3)
        .call(() => enter.play(), null, 0.62)
    },
    [count, slides],
  )

  // ---- Intro : le nom se dessine sur le bordeaux, puis le rideau se lève en arche
  useEffect(() => {
    const first = slideRefs.current[indexRef.current]
    const intro = introRef.current
    if (reducedMotion()) {
      gsap.set(intro, { display: 'none' })
      return undefined
    }
    const q = gsap.utils.selector(intro)
    const enter = enterTimeline(first).pause(0)
    enterRef.current.set(indexRef.current, enter)
    const tl = gsap
      .timeline({ delay: 0.15 })
      .fromTo(q('[data-char]'), { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.06 })
      .fromTo(q('[data-intro-line]'), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, 0.3)
      .to(q('[data-char]'), { yPercent: -115, duration: 0.7, stagger: 0.03, ease: 'power3.in' }, 1.5)
      .to(q('[data-intro-line]'), { scaleX: 0, transformOrigin: 'right', duration: 0.7, ease: 'power3.in' }, 1.5)
      .fromTo(intro, { clipPath: 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0% round 0% 0% 50% 50%)', duration: 1.3, ease: 'expo.inOut' }, 2)
      .call(() => enter.play(), null, 2.25)
      .set(intro, { display: 'none' })
    return () => {
      tl.kill()
      enter.kill()
    }
  }, [])

  // ---- Molette, glissé, clavier
  useEffect(() => {
    let lastWheel = 0
    let acc = 0
    const onWheel = (event) => {
      if (menuRef.current?.dataset.open) return
      const scroller = event.target.closest?.('[data-scroll]')
      if (scroller && canScroll(scroller, Math.sign(event.deltaY))) return
      event.preventDefault()
      const now = performance.now()
      const quiet = now - lastWheel
      lastWheel = now
      // l'inertie des pavés tactiles ne doit pas enchaîner plusieurs slides
      if (busyRef.current || (now - unlockRef.current < 900 && quiet < 160)) {
        acc = 0
        return
      }
      if (quiet > 300) acc = 0
      acc += event.deltaY
      if (Math.abs(acc) > 28) {
        go(indexRef.current + Math.sign(acc))
        acc = 0
      }
    }

    let touch = null
    const onTouchStart = (event) => {
      const scroller = event.target.closest?.('[data-scroll]')
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, down: scroller && canScroll(scroller, 1), up: scroller && canScroll(scroller, -1) }
    }
    const onTouchEnd = (event) => {
      if (!touch || menuRef.current?.dataset.open) return
      const dx = event.changedTouches[0].clientX - touch.x
      const dy = touch.y - event.changedTouches[0].clientY
      const dir = Math.sign(dy)
      if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx) && !(dir > 0 ? touch.down : touch.up)) go(indexRef.current + dir)
      touch = null
    }

    const onKey = (event) => {
      if (event.target.closest?.('input, textarea, select')) return
      if (menuRef.current?.dataset.open) {
        if (event.key === 'Escape') setMenuOpen(false)
        return
      }
      const map = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowRight: 1, ArrowUp: -1, PageUp: -1, ArrowLeft: -1 }
      if (event.key === 'Home') go(0)
      else if (event.key === 'End') go(count - 1)
      else if (map[event.key]) {
        if (event.key === ' ' && event.target.closest?.('button, a')) return
        event.preventDefault()
        go(indexRef.current + map[event.key])
      }
    }

    const onHash = () => {
      const target = slides.findIndex((s) => `#${s.id}` === window.location.hash)
      if (target >= 0) go(target)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
    }
  }, [go, count, slides])

  // ---- Menu plein écran
  useEffect(() => {
    const menu = menuRef.current
    const q = gsap.utils.selector(menu)
    if (menuOpen) {
      menu.dataset.open = 'true'
      gsap
        .timeline()
        .set(menu, { visibility: 'visible' })
        .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0% round 0% 0% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)', duration: reducedMotion() ? 0 : 1, ease: 'expo.inOut' })
        .fromTo(q('[data-menu-item]'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.05 }, 0.45)
      menu.querySelector('a, button')?.focus()
    } else if (menu.dataset.open) {
      delete menu.dataset.open
      gsap
        .timeline()
        .to(menu, { clipPath: 'inset(100% 0% 0% 0% round 50% 50% 0% 0%)', duration: reducedMotion() ? 0 : 0.9, ease: 'expo.inOut' })
        .set(menu, { visibility: 'hidden' })
    }
  }, [menuOpen])

  const dark = slides[index].theme === 'dark'
  const pick = (i) => {
    setMenuOpen(false)
    window.setTimeout(() => go(i), menuOpen ? 450 : 0)
  }

  return (
    <div className={styles.deck} data-dark={dark || undefined}>
      <header className={styles.header}>
        <button type="button" className={styles.logo} onClick={() => go(0)}>
          VELOURS
        </button>
        <div className={styles.headerActions}>
          <button type="button" className={styles.lang} onClick={toggle} aria-label={t('nav.switch')}>
            {t('nav.switchShort')}
          </button>
          <button type="button" className={styles.book} onClick={() => go(count - 1)}>
            {t('nav.book')}
          </button>
          <button type="button" className={styles.burger} onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="deck-menu">
            <span className={styles.burgerLines} data-open={menuOpen || undefined} aria-hidden="true" />
            <span className={styles.burgerLabel}>{menuOpen ? t('nav.close') : t('nav.menu')}</span>
          </button>
        </div>
      </header>

      <main className={styles.slides}>
        {slides.map((slide, i) => (
          <section
            key={slide.id}
            id={slide.id}
            ref={(el) => {
              slideRefs.current[i] = el
            }}
            className={styles.slide}
            data-theme={slide.theme}
            style={{ visibility: i === index ? 'visible' : 'hidden' }}
            aria-label={slide.label}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            <div data-scroll className={styles.scroll}>
              {slide.content({ go, active: i === index })}
            </div>
          </section>
        ))}
        <div ref={curtainRef} className={styles.curtain} aria-hidden="true" />
      </main>

      {/* ---- Index latéral, compteur, flèches (fond dégradé sur mobile) */}
      <div className={styles.bottomFade} aria-hidden="true" />
      <nav className={styles.dots} aria-label="Slides">
        {slides.map((slide, i) => (
          <button key={slide.id} type="button" className={styles.dot} data-active={i === index || undefined} onClick={() => go(i)} aria-label={`${t('deck.goTo')} ${slide.label}`} aria-current={i === index ? 'step' : undefined}>
            <span className={styles.dotLabel}>{slide.label}</span>
          </button>
        ))}
      </nav>
      <div className={styles.counter} aria-hidden="true">
        <span className={styles.counterNow}>
          <span key={index} className={styles.counterDigit}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </span>
        <span className={styles.counterBar}>
          <span style={{ transform: `scaleX(${(index + 1) / count})` }} />
        </span>
        <span>{String(count).padStart(2, '0')}</span>
      </div>
      <div className={styles.arrows}>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t('deck.prev')}>
          ↑
        </button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === count - 1} aria-label={t('deck.next')}>
          ↓
        </button>
      </div>

      {/* ---- Menu */}
      <div ref={menuRef} id="deck-menu" className={styles.menu} role="dialog" aria-modal="true" aria-label={t('nav.menu')} inert={!menuOpen}>
        <ol className={styles.menuList}>
          {slides.map((slide, i) => (
            <li key={slide.id} className={styles.menuRow}>
              <button type="button" data-menu-item className={styles.menuLink} data-active={i === index || undefined} onClick={() => pick(i)}>
                <span className={styles.menuIndex}>{String(i + 1).padStart(2, '0')}</span>
                {slide.label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* ---- Intro */}
      <div ref={introRef} className={styles.intro} aria-hidden="true">
        <span className={styles.introName}>
          <Split text="Velours" />
        </span>
        <span data-intro-line className={styles.introLine} />
      </div>
    </div>
  )
}
