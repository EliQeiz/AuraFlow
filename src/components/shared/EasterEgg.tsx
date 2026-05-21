import confetti from 'canvas-confetti'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { ParticleBackground } from '../animations/ParticleBackground'

export function EasterEgg() {
  const buffer = useRef('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.length !== 1) return
      buffer.current = `${buffer.current}${event.key.toLowerCase()}`.slice(-8)
      if (buffer.current === 'auraflow') {
        setOpen(true)
        toast.success('You found the AuraFlow secret!')
        void confetti({ particleCount: 180, spread: 110, scalar: 1.1, colors: ['#6C63FF', '#00D4FF', '#FFFFFF'] })
        window.setTimeout(() => setOpen(false), 2200)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[75] overflow-hidden bg-aura-dark/50"
        >
          <ParticleBackground burst />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
