import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export function GlowOrb({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      animate={{ y: [0, -24, 0], scale: [1, 1.08, 1], filter: ['hue-rotate(0deg)', 'hue-rotate(22deg)', 'hue-rotate(0deg)'] }}
      transition={{ duration: 12, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      className={cn('pointer-events-none absolute h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.36),transparent_68%)] blur-3xl', className)}
    />
  )
}
