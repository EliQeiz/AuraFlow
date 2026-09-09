import type { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string; tilt?: boolean }>) {
  return <article className={cn('af-card', className)}>{children}</article>
}
