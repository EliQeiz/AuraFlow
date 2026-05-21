import { useState } from 'react'
import { cn, getInitials } from '../../lib/utils'

export function UserAvatar({
  className,
  imageClassName,
  name,
  src,
}: {
  className?: string
  imageClassName?: string
  name?: string | null
  src?: string | null
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const label = name?.trim() || 'AuraFlow Client'
  const useImage = Boolean(src && src !== failedSrc)

  return (
    <span
      aria-label={`${label} avatar`}
      className={cn('grid shrink-0 place-items-center overflow-hidden bg-aura-gradient font-bold text-white', className)}
      role="img"
    >
      {useImage ? (
        <img src={src ?? ''} alt="" onError={() => setFailedSrc(src ?? null)} className={cn('h-full w-full object-cover', imageClassName)} />
      ) : (
        <span aria-hidden>{getInitials(label)}</span>
      )}
    </span>
  )
}
