import { useEffect, useRef } from 'react'

/*
 * Animation « avant → après » sur deux VRAIES photos (préparées par
 * tools/build_reveal.py). Zone par zone (ici : ongle par ongle), la photo
 * « après » apparaît sous un outil réel découpé (le pinceau du vernis) qui
 * suit l'axe de la zone. onReady(update) : update(t) avec t ∈ [0, 1].
 */

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const lerp = (a, b, k) => a + (b - a) * k

const START = 0.04
const END = 0.88
const EDGE = 0.07 // fondu du front de peinture (en fraction de la zone)

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

/**
 * @param {{ name: string, tool: { src: string, w: number, h: number, tipX: number, tipY: number, axis: number, tilt: number, size: number }, onReady: (fn) => void, className?: string }} props
 *   tool.axis : angle (rad) de la pointe vers le manche dans l'image de l'outil
 *   tool.tilt : inclinaison ajoutée par rapport à l'axe de la zone
 *   tool.size : hauteur de l'outil en multiples de la largeur de la zone
 */
export default function PhotoReveal({ name, tool, onReady, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const layer = document.createElement('canvas')
    const lctx = layer.getContext('2d')
    const mask = document.createElement('canvas')
    const mctx = mask.getContext('2d')
    const small = window.matchMedia('(max-width: 760px)').matches ? '-sm' : ''
    const base = `/images/acts/${name}`
    let assets = null
    let last = 0
    let cancelled = false

    const draw = (t) => {
      if (!assets) return
      const { before, after, brush, meta, pixels, ramp, image } = assets
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.min(Math.round(box.width * dpr), meta.width)
      const height = Math.round(width * (box.height / Math.max(box.width, 1)))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = layer.width = width
        canvas.height = layer.height = height
      }
      const scale = Math.max(width / meta.width, height / meta.height)
      const ox = (width - meta.width * scale) / 2
      const oy = (height - meta.height * scale) / 2
      const zones = meta.zones
      const n = zones.length
      const slot = (END - START) / n

      // progression de chaque zone (25 % du créneau pour rejoindre la zone)
      const progress = zones.map((_, i) => smooth(START + slot * (i + 0.25), START + slot * (i + 1), t))
      const data = image.data
      for (let j = 0; j < pixels.length; j++) {
        const p = pixels[j]
        const k = progress[ramp[p * 4 + 1] - 1]
        const s = ramp[p * 4] / 255
        const a = clamp01((k * (1 + EDGE) - s) / EDGE) * (ramp[p * 4 + 2] / 255)
        data[p * 4 + 3] = a * 255
      }
      mctx.putImageData(image, 0, 0)

      ctx.drawImage(before, ox, oy, meta.width * scale, meta.height * scale)
      lctx.globalCompositeOperation = 'source-over'
      lctx.clearRect(0, 0, width, height)
      lctx.drawImage(after, ox, oy, meta.width * scale, meta.height * scale)
      lctx.globalCompositeOperation = 'destination-in'
      lctx.imageSmoothingEnabled = true
      lctx.drawImage(mask, ox, oy, meta.width * scale, meta.height * scale)
      ctx.drawImage(layer, 0, 0)

      // l'outil : rejoint la zone, la parcourt, puis repart
      const active = Math.min(n - 1, Math.max(0, Math.floor((t - START) / slot)))
      const zone = zones[active]
      const within = clamp01((t - START - slot * active) / slot)
      const prev = active > 0 ? zones[active - 1].to : [meta.width * 1.15, meta.height * 0.25]
      let x
      let y
      if (within < 0.25) {
        const k = smooth(0, 0.25, within)
        x = lerp(prev[0], zone.from[0], k)
        y = lerp(prev[1], zone.from[1], k) - Math.sin(k * Math.PI) * 60
      } else {
        const k = progress[active]
        x = lerp(zone.from[0], zone.to[0], k)
        y = lerp(zone.from[1], zone.to[1], k)
      }
      const leave = smooth(END, 0.98, t)
      const enter = smooth(0, START + slot * 0.2, t)
      x = lerp(meta.width * 1.2, x, enter) + leave * 260
      y = lerp(-meta.height * 0.1, y, enter) - leave * 360
      const alpha = Math.min(enter, 1 - smooth(0.9, 0.99, t))
      if (alpha > 0.01) {
        const dir = Math.atan2(zone.to[1] - zone.from[1], zone.to[0] - zone.from[0])
        const h = zone.width * tool.size * scale
        const w = h * (tool.w / tool.h)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(ox + x * scale, oy + y * scale)
        ctx.rotate(dir - tool.axis + tool.tilt)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
        ctx.shadowBlur = 14 * scale
        ctx.shadowOffsetY = 8 * scale
        ctx.drawImage(brush, (-tool.tipX / tool.w) * w, (-tool.tipY / tool.h) * h, w, h)
        ctx.restore()
      }
    }

    Promise.all([
      loadImage(`${base}-avant${small}.webp`),
      loadImage(`${base}-apres${small}.webp`),
      loadImage(tool.src),
      loadImage(`${base}-ramp.png`),
      fetch(`${base}.json`).then((r) => r.json()),
    ]).then(([before, after, brush, rampImage, meta]) => {
      if (cancelled) return
      mask.width = rampImage.naturalWidth
      mask.height = rampImage.naturalHeight
      mctx.drawImage(rampImage, 0, 0)
      const ramp = mctx.getImageData(0, 0, mask.width, mask.height).data
      const pixels = []
      for (let p = 0; p < ramp.length / 4; p++) if (ramp[p * 4 + 1] > 0) pixels.push(p)
      const image = mctx.createImageData(mask.width, mask.height)
      for (let p = 0; p < image.data.length; p += 4) {
        image.data[p] = image.data[p + 1] = image.data[p + 2] = 255
      }
      assets = { before, after, brush, meta, pixels: Int32Array.from(pixels), ramp, image }
      draw(last)
    })

    onReady((t) => {
      last = t
      draw(t)
    })
    return () => {
      cancelled = true
    }
  }, [name, tool, onReady])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
