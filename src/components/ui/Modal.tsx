import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

interface ModalProps extends PropsWithChildren {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  className?: string
}

export function Modal({ children, className = '', description, onOpenChange, open, title }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-aura-dark/85 backdrop-blur-md" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(92vw,72rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-white/15 bg-aura-surface p-5 shadow-2xl outline-none ${className}`}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-white">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-aura-muted">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close className="rounded-md border border-white/10 p-2 text-aura-muted transition hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
