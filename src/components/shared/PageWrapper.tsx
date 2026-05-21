import { motion, type Variants } from 'framer-motion'
import type { PropsWithChildren } from 'react'

const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.61, 1, 0.88, 1] as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

export function PageWrapper({ children }: PropsWithChildren) {
  return (
    <motion.main initial="initial" animate="enter" exit="exit" variants={pageVariants} className="min-h-screen overflow-clip pt-20">
      {children}
    </motion.main>
  )
}
