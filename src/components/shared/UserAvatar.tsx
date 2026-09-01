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
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const label = name?.trim() || 'AuraFlow Client'
  const usableSrc = Boolean(src && src !== failedSrc)
  const showImage = usableSrc && loadedSrc === src

  return (
    <span
      aria-label={`${label} avatar`}
      className={cn('relative grid shrink-0 place-items-center overflow-hidden bg-aura-gradient font-bold text-white', className)}
      role="img"
    >
      <span aria-hidden className={showImage ? 'opacity-0' : 'opacity-100'}>
        {getInitials(label)}
      </span>
      {usableSrc ? (
        <img
          src={src ?? ''}
          alt=""
          onError={() => setFailedSrc(src ?? null)}
          onLoad={() => setLoadedSrc(src ?? null)}
          className={cn('absolute inset-0 h-full w-full object-cover transition-opacity', showImage ? 'opacity-100' : 'opacity-0', imageClassName)}
        />
      ) : null}
    </span>
  )
}
