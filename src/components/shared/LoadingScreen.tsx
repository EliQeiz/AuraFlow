import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1950)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="loading-screen pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-aura-dark"
    >
      <div className="text-center">
        <svg viewBox="0 0 280 88" className="h-24 w-72" aria-label="AuraFlow loading">
          <motion.path
            d="M24 62 48 22l24 40m-39-16h30M93 22v40c0 12 33 12 33 0V22m25 40V22h20c26 0 26 34 0 34h-20m0-17h17l22 23m25 0V22h39"
            fill="none"
            stroke="url(#auraStroke)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.15, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="auraStroke">
              <stop stopColor="#6C63FF" />
              <stop offset="1" stopColor="#00D4FF" />
            </linearGradient>
          </defs>
        </svg>
        <p className="font-orbitron text-sm tracking-normal text-cyan-100">AuraFlow</p>
      </div>
    </motion.div>
  )
}
