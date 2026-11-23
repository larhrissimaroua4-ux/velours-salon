import { useEffect, useRef } from 'react'

/*
 * Coiffure, en photos réelles : les vrais ciseaux dorés arrivent par la
 * gauche en claquant (photos « ouverts » / « fermés » alternées), se ferment
 * sur la ligne de coupe ; le bas de la mèche (découpé dans la photo « avant »)
 * tombe en tournant pendant que la photo « après » (mèche coupée) reste.
 */

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const lerp = (a, b, k) => a + (b - a) * k

const PHOTO = { w: 848, h: 1247 }
const CUT = 739 // ligne de coupe dans la photo
const PIECE = { x: 261, y: 737 } // coin du morceau qui tombe (coiffure-meche.webp)
// ciseaux photographiés pointes vers le haut : position de la vis dans chaque image
const OPEN = { src: '/images/acts/ciseaux-ouverts.webp', px: 243, py: 295 }
const CLOSED = { src: '/images/acts/ciseaux-fermes.webp', px: 116, py: 307 }
const SCALE = 0.9
const SNAP_AT = 0.5

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export default function CutPhotoAct({ onReady, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const small = window.matchMedia('(max-width: 760px)').matches ? '-sm' : ''
    let assets = null
    let last = 0
    let cancelled = false

    const draw = (t) => {
      if (!assets) return
      const { before, after, piece, open, closed } = assets
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.min(Math.round(box.width * dpr), PHOTO.w)
      const height = Math.round(width * (box.height / Math.max(box.width, 1)))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      const k = Math.max(width / PHOTO.w, height / PHOTO.h)
      const ox = (width - PHOTO.w * k) / 2
      const oy = (height - PHOTO.h * k) / 2
      const X = (x) => ox + x * k
      const Y = (y) => oy + y * k

      const cut = t >= SNAP_AT
      ctx.drawImage(cut ? after : before, ox, oy, PHOTO.w * k, PHOTO.h * k)

      // ---- le bas de la mèche tombe
      if (cut) {
        const f = smooth(SNAP_AT, 1, t)
        const pw = piece.naturalWidth * k
        const ph = piece.naturalHeight * k
        ctx.save()
        ctx.globalAlpha = 1 - Math.pow(f, 1.6)
        ctx.translate(X(PIECE.x) + pw / 2, Y(PIECE.y) + 560 * k * f * f)
        ctx.rotate((10 * Math.PI) / 180 * f)
        ctx.drawImage(piece, -pw / 2, 0, pw, ph)
        ctx.restore()
      }

      // ---- éclat au moment de la coupe
      const flash = Math.max(0, 1 - Math.abs(t - SNAP_AT - 0.02) / 0.06)
      if (flash > 0) {
        ctx.globalCompositeOperation = 'screen'
        const g = ctx.createRadialGradient(X(450), Y(CUT), 0, X(450), Y(CUT), 120 * k)
        g.addColorStop(0, `rgba(255,236,190,${0.85 * flash})`)
        g.addColorStop(1, 'rgba(255,236,190,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, width, height)
        ctx.globalCompositeOperation = 'source-over'
      }

      // ---- les ciseaux (pointes vers la mèche) : arrivée en claquant, coupe, retrait
      const arrive = smooth(0.04, SNAP_AT, t)
      const retreat = smooth(0.6, 0.92, t)
      const px = lerp(-520, 335, arrive) - 860 * retreat
      const phase = arrive * Math.PI * 7
      const isClosed = t >= SNAP_AT - 0.01 || Math.sin(phase) > 0.55
      const img = isClosed ? closed : open
      const spec = isClosed ? CLOSED : OPEN
      const s = SCALE * k
      const alpha = 1 - smooth(0.8, 0.95, t)
      if (alpha > 0.01 && px > -600) {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(X(px), Y(CUT))
        ctx.rotate(Math.PI / 2)
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 18 * k
        ctx.shadowOffsetX = 10 * k
        ctx.drawImage(img, -spec.px * s, -spec.py * s, img.naturalWidth * s, img.naturalHeight * s)
        ctx.restore()
      }
    }

    Promise.all([
      loadImage(`/images/acts/coiffure-avant${small}.webp`),
      loadImage(`/images/acts/coiffure-apres${small}.webp`),
      loadImage('/images/acts/coiffure-meche.webp'),
      loadImage(OPEN.src),
      loadImage(CLOSED.src),
    ]).then(([before, after, piece, open, closed]) => {
      if (cancelled) return
      assets = { before, after, piece, open, closed }
      draw(last)
    })

    onReady((t) => {
      last = t
      draw(t)
    })
    return () => {
      cancelled = true
    }
  }, [onReady])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
