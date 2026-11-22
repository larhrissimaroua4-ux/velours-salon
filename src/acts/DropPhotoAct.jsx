import { useEffect, useRef } from 'react'

/*
 * Soins du visage, en photos réelles : la vraie pipette descend au-dessus de
 * la joue, la goutte de sérum gonfle, se détache et tombe ; au contact, la
 * peau lumineuse (photo « après ») se répand en cercle depuis le point
 * d'impact, avec un anneau de lumière dorée.
 * La goutte est photographiée sur fond noir : elle est dessinée en « screen »
 * (le noir disparaît, le verre et le sérum restent translucides).
 */

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const lerp = (a, b, k) => a + (b - a) * k

// repère de la photo du visage (848 × 1247)
const PHOTO = { w: 848, h: 1247 }
const IMPACT = { x: 455, y: 555 } // pommette
// goutte.webp (310 × 545) : col de la goutte à y = 215, centre de la goutte à (151, 400)
const DROP = { w: 310, h: 545, neck: 215, cx: 151, cy: 400, scale: 0.42 }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export default function DropPhotoAct({ onReady, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const layer = document.createElement('canvas')
    const lctx = layer.getContext('2d')
    const small = window.matchMedia('(max-width: 760px)').matches ? '-sm' : ''
    let assets = null
    let last = 0
    let cancelled = false

    const draw = (t) => {
      if (!assets) return
      const { before, after, drop } = assets
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.min(Math.round(box.width * dpr), PHOTO.w)
      const height = Math.round(width * (box.height / Math.max(box.width, 1)))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = layer.width = width
        canvas.height = layer.height = height
      }
      const k = Math.max(width / PHOTO.w, height / PHOTO.h)
      const ox = (width - PHOTO.w * k) / 2
      const oy = (height - PHOTO.h * k) / 2
      const X = (x) => ox + x * k
      const Y = (y) => oy + y * k

      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(before, ox, oy, PHOTO.w * k, PHOTO.h * k)

      // ---- la peau s'illumine depuis le point d'impact
      const splash = smooth(0.6, 1, t)
      if (splash > 0) {
        const r = splash * Math.hypot(width, height) * 1.05
        const soft = 140 * k
        lctx.globalCompositeOperation = 'source-over'
        lctx.clearRect(0, 0, width, height)
        lctx.drawImage(after, ox, oy, PHOTO.w * k, PHOTO.h * k)
        lctx.globalCompositeOperation = 'destination-in'
        const g = lctx.createRadialGradient(X(IMPACT.x), Y(IMPACT.y), Math.max(0, r - soft), X(IMPACT.x), Y(IMPACT.y), r)
        g.addColorStop(0, 'rgba(0,0,0,1)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        lctx.fillStyle = g
        lctx.fillRect(0, 0, width, height)
        ctx.drawImage(layer, 0, 0)

        // anneau de lumière dorée qui s'éloigne
        const ring = 1 - splash
        if (ring > 0.01) {
          ctx.globalCompositeOperation = 'screen'
          const w = 46 * k
          const rg = ctx.createRadialGradient(X(IMPACT.x), Y(IMPACT.y), Math.max(0, r * 0.55 - w), X(IMPACT.x), Y(IMPACT.y), r * 0.55 + w)
          rg.addColorStop(0, 'rgba(255,214,150,0)')
          rg.addColorStop(0.5, `rgba(255,214,150,${0.42 * ring})`)
          rg.addColorStop(1, 'rgba(255,214,150,0)')
          ctx.fillStyle = rg
          ctx.fillRect(0, 0, width, height)
        }
      }

      // ---- la pipette et la goutte (fond noir → mode « screen »)
      ctx.globalCompositeOperation = 'screen'
      const s = DROP.scale * k
      const neckY = lerp(-220, 250, smooth(0, 0.16, t)) - 520 * smooth(0.46, 0.78, t)
      const nx = X(IMPACT.x)
      const ny = Y(neckY)
      ctx.drawImage(drop, 0, 0, DROP.w, DROP.neck, nx - DROP.cx * s, ny - DROP.neck * s, DROP.w * s, DROP.neck * s)

      const grow = smooth(0.14, 0.4, t)
      const fall = clamp01((t - 0.4) / 0.2)
      const gone = smooth(0.6, 0.66, t)
      if (gone < 1) {
        const g = lerp(0.55, 1, grow)
        const stretch = 1 + 0.18 * grow + 0.12 * fall - 0.45 * gone
        const squash = 1 + 0.5 * gone
        // accrochée au col, puis chute libre jusqu'à la pommette
        const attachedTop = ny - 15 * s
        const fallTop = attachedTop + (Y(IMPACT.y) - (attachedTop + (DROP.cy - DROP.neck) * s)) * fall * fall
        const dw = DROP.w * s * g * squash
        const dh = (DROP.h - DROP.neck + 15) * s * g * stretch
        ctx.globalAlpha = 1 - gone
        ctx.drawImage(drop, 0, DROP.neck - 15, DROP.w, DROP.h - DROP.neck + 15, nx - dw / 2, fall > 0 ? fallTop : attachedTop, dw, dh)
        ctx.globalAlpha = 1
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    Promise.all([loadImage(`/images/acts/visage-avant${small}.webp`), loadImage(`/images/acts/visage-apres${small}.webp`), loadImage('/images/acts/goutte.webp')]).then(([before, after, drop]) => {
      if (cancelled) return
      assets = { before, after, drop }
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
