import { AlertCircle, FolderOpen, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function StatePanel({
  loading,
  error,
  title,
  description,
  action,
  retry,
}: {
  loading?: boolean
  error?: unknown
  title?: string
  description?: string
  action?: ReactNode
  retry?: () => void
}) {
  return (
    <div className="state-panel" role={error ? 'alert' : 'status'}>
      {loading ? (
        <LoaderCircle className="animate-spin" />
      ) : error ? (
        <AlertCircle />
      ) : (
        <FolderOpen />
      )}
      <h3>
        {loading
          ? 'Loading your workspace'
          : error
            ? 'Unable to load this data'
            : title}
      </h3>
      <p>
        {error
          ? 'Check your connection and try again. Your saved data has not changed.'
          : description}
      </p>
      {error && retry ? (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      ) : (
        action
      )}
    </div>
  )
}
