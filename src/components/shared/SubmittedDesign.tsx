import { useState } from 'react'
import type { StudioDraft } from '../../domain/studio'
import { DesignArtboard } from './DesignArtboard'
import { SuiteCanvas } from './SuiteCanvas'
import { Button } from '../ui/Button'
export function SubmittedDesign({ draft }: { draft: StudioDraft }) {
  const [page, setPage] = useState(draft.pages[0])
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'submitted-design.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <section>
      <div className="studio-canvas-toolbar">
        <select
          aria-label="Submitted design page"
          className="af-input"
          value={page}
          onChange={(e) => setPage(e.target.value)}
        >
          {draft.pages.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <Button variant="secondary" onClick={download}>
          Download design
        </Button>
      </div>
      {draft.layers?.length ? (
        <DesignArtboard
          draft={draft}
          page={page}
          selected=""
          onSelect={(id) => {
            if (id.startsWith('page:')) setPage(id.slice(5))
          }}
          onChange={() => undefined}
          grid={false}
          preview
        />
      ) : (
        <SuiteCanvas draft={draft} page={page} />
      )}
    </section>
  )
}
