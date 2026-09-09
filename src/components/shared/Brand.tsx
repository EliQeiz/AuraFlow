import { Link } from 'react-router-dom'
import { Layers2 } from 'lucide-react'

export function Brand({
  to = '/',
  compact = false,
}: {
  to?: string
  compact?: boolean
}) {
  return (
    <Link to={to} className="brand" aria-label="AuraFlow home">
      <span className="brand-mark">
        <Layers2 strokeWidth={2} />
      </span>
      {!compact && (
        <span>
          AuraFlow<span className="brand-period">.</span>
        </span>
      )}
    </Link>
  )
}
