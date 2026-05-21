import { motion, useMotionValue, useTransform } from 'framer-motion'
import type { MouseEvent, PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends PropsWithChildren {
  className?: string
  tilt?: boolean
}

export function Card({ children, className, tilt }: CardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-0.5, 0.5], [9, -9])
  const rotateY = useTransform(x, [-0.5, 0.5], [-9, 9])

  const onMove = (event: MouseEvent<HTMLElement>) => {
    if (!tilt) return
    const bounds = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - bounds.left) / bounds.width - 0.5)
    y.set((event.clientY - bounds.top) / bounds.height - 0.5)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.article
      layout
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={tilt ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
      className={cn('aura-border glass rounded-lg bg-card-gradient', className)}
    >
      {children}
    </motion.article>
  )
}
