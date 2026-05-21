import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export function CustomCursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 260, damping: 28 })
  const ringY = useSpring(y, { stiffness: 260, damping: 28 })
  const [hovered, setHovered] = useState(false)
  const [imageHovered, setImageHovered] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)')
    const sync = () => setEnabled(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.body.classList.add('has-aura-cursor')
    const move = (event: MouseEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      const target = event.target as HTMLElement
      setHovered(Boolean(target.closest('a,button,input,textarea,select')))
      setImageHovered(Boolean(target.closest('img')))
    }
    window.addEventListener('mousemove', move)
    return () => {
      document.body.classList.remove('has-aura-cursor')
      window.removeEventListener('mousemove', move)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.span
        style={{ x, y }}
        className="pointer-events-none fixed left-0 top-0 z-[90] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference"
      />
      <motion.span
        animate={{ scale: hovered ? 1.5 : 1, borderRadius: imageHovered ? '2px' : '999px' }}
        style={{ x: ringX, y: ringY }}
        className="pointer-events-none fixed left-0 top-0 z-[89] h-9 w-9 -translate-x-1/2 -translate-y-1/2 border border-cyan-100/75 mix-blend-difference"
      />
    </>
  )
}
