import { History, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listDraftVersions } from '../../lib/studio'
import {
  draftSchema,
  type SavedDraft,
  type StudioDraft,
} from '../../domain/studio'
import { displayDate } from '../../domain/projects'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { StatePanel } from '../ui/StatePanel'

export function StudioHistory({
  id,
  disabled,
  onRestore,
}: {
  id: string
  disabled: boolean
  onRestore: (draft: StudioDraft) => void
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const versions = useQuery({
    queryKey: ['design-versions', user?.uid ?? 'signed-out', id],
    queryFn: () => listDraftVersions(id) as Promise<SavedDraft[]>,
    enabled: open && Boolean(user),
  })
  return (
    <>
      <Button variant="ghost" disabled={disabled} onClick={() => setOpen(true)}>
        <History />
        History
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="Design history">
        <p className="field-hint mb-5">
          Restore a checkpoint into the editor, then save it as a new version.
          Submitted project designs stay unchanged.
        </p>
        {versions.isPending ? (
          <StatePanel loading />
        ) : versions.error ? (
          <StatePanel
            error={versions.error}
            retry={() => void versions.refetch()}
          />
        ) : !(versions.data ?? []).length ? (
          <StatePanel
            title="No checkpoints yet"
            description="Your next save will create the first checkpoint."
          />
        ) : (
          <div className="history-list">
            {(versions.data ?? []).map((version) => (
              <article key={version.id}>
                <div>
                  <strong>
                    Version {version.revision} · {version.name}
                  </strong>
                  <p>
                    {displayDate(version.updatedAt)} · {version.pages.length}{' '}
                    pages · {version.modules.length} modules
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Load this checkpoint into the editor? Current unsaved edits can be recovered with Undo.',
                      )
                    ) {
                      onRestore(draftSchema.parse(version))
                      setOpen(false)
                    }
                  }}
                >
                  <RotateCcw />
                  Restore
                </Button>
              </article>
            ))}
          </div>
        )}
        {(versions.data ?? []).length === 50 && (
          <p className="field-hint">Latest 50 checkpoints shown.</p>
        )}
      </Modal>
    </>
  )
}
