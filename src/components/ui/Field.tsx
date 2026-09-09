import { useId, type ReactElement, cloneElement } from 'react'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactElement<{
    id?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
  }>
}) {
  const id = useId()
  return (
    <div className="af-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        'aria-describedby': hint || error ? `${id}-hint` : undefined,
        'aria-invalid': Boolean(error),
      })}
      {(hint || error) && (
        <p id={`${id}-hint`} className={error ? 'field-error' : 'field-hint'}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
