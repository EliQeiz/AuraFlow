import type { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

export function Badge({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cn('inline-flex items-center rounded-md border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-cyan-100', className)}>
      {children}
    </span>
  )
}
