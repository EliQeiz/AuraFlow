import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'
import { scrollRevealVariants } from '../../hooks/useScrollReveal'

export function RevealText({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.24 }}
      variants={scrollRevealVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
