import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

export function FloatingCard({ children, className, delay = 0 }: PropsWithChildren<{ className?: string; delay?: number }>) {
  return (
    <motion.div
      animate={{ y: [0, -14, 0], rotate: [-2, 1, -2] }}
      transition={{ duration: 6.4, delay, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      className={cn('glass rounded-lg px-4 py-3 text-sm font-bold text-white shadow-aura', className)}
    >
      {children}
    </motion.div>
  )
}
