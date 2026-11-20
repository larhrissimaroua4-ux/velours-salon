import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

gsap.registerPlugin(useGSAP)
gsap.defaults({ ease: 'expo.out', duration: 1.2 })
// certaines slides n'ont pas d'arche ou de tracé : cibles vides normales
gsap.config({ nullTargetWarn: false })

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export { gsap, useGSAP }
