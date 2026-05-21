import type { PropsWithChildren } from 'react'

export function Tooltip({ children, text }: PropsWithChildren<{ text: string }>) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-aura-card px-2 py-1 text-xs text-white shadow-xl group-hover:block">
        {text}
      </span>
    </span>
  )
}
