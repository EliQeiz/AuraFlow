import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  File,
  FolderOpen,
  ImagePlus,
  Monitor,
  Plus,
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
} from 'lucide-react'
import { collection, doc, getDoc, orderBy, query } from 'firebase/firestore'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { StatePanel } from '../../components/ui/StatePanel'
import { SuiteCanvas } from '../../components/shared/SuiteCanvas'
import { StudioHistory } from '../../components/shared/StudioHistory'
import { useAuth } from '../../context/AuthContext'
import { getSuiteBlueprint, suiteBlueprints } from '../../data/suiteBlueprints'
import {
  defaultDraft,
  draftSchema,
  type SavedDraft,
  type StudioDraft,
} from '../../domain/studio'
import { displayDate } from '../../domain/projects'
import { getFirebaseDb } from '../../lib/firebase'
import { asErrorMessage } from '../../lib/utils'
import { saveDraft } from '../../lib/studio'
import { rasterTypes, uploadPrivateMedia, validateMedia } from '../../lib/media'
import { useLiveRows } from '../../hooks/useFirebase'
import { usePrivateMedia } from '../../hooks/usePrivateMedia'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'

export default function PrototypeStudio() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const draftId = params.get('draft')
  const saved = useQuery({
    queryKey: ['draft', user?.uid, draftId],
    enabled: Boolean(user && draftId),
    queryFn: async () => {
      const document = await getDoc(
        doc(getFirebaseDb(), 'users', user!.uid, 'drafts', draftId!),
      )
      if (!document.exists())
        throw new Error('This design is no longer available.')
      return {
        ...draftSchema.parse(document.data()),
        id: document.id,
        revision: document.data().revision as number,
      } as SavedDraft
    },
  })
  if (draftId && saved.isPending) return <StatePanel loading />
  if (draftId && saved.error)
    return <StatePanel error={saved.error} retry={() => void saved.refetch()} />
  return (
    <StudioEditor
      key={draftId || params.get('suite') || 'new'}
      saved={saved.data}
      requestedSuite={params.get('suite') ?? params.get('solution')}
    />
  )
}
function StudioEditor({
  saved,
  requestedSuite,
}: {
  saved?: SavedDraft
  requestedSuite: string | null
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initialSuite =
    getSuiteBlueprint(saved?.suiteSlug ?? requestedSuite) ?? suiteBlueprints[0]
  const [id] = useState(saved?.id || crypto.randomUUID())
  const [revision, setRevision] = useState(saved?.revision || 0)
  const [draft, setDraft] = useState<StudioDraft>(() =>
    saved
      ? draftSchema.parse(saved)
      : defaultDraft(
          initialSuite.slug,
          'Untitled project',
          initialSuite.modules.slice(0, 4).map((m) => m.title),
          initialSuite.roles.slice(0, 2).map((r) => r.title),
        ),
  )
  const [baseline, setBaseline] = useState(JSON.stringify(draft))
  const [past, setPast] = useState<StudioDraft[]>([])
  const [future, setFuture] = useState<StudioDraft[]>([])
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState('Home')
  const [newPage, setNewPage] = useState('')
  const [device, setDevice] = useState('desktop')
  const [view, setView] = useState<'system' | 'website'>('system')
  const [panel, setPanel] = useState<'brand' | 'workflows' | 'content'>('brand')
  const dirty = JSON.stringify(draft) !== baseline
  useUnsavedChanges(dirty)
  const suite = getSuiteBlueprint(draft.suiteSlug) ?? initialSuite
  const drafts = useLiveRows<SavedDraft>(['drafts', user!.uid], () =>
    query(
      collection(getFirebaseDb(), 'users', user!.uid, 'drafts'),
      orderBy('updatedAt', 'desc'),
    ),
  )
  const logoUrl = usePrivateMedia(draft.logoPath)
  const bannerUrl = usePrivateMedia(draft.bannerPath)
  function update(change: Partial<StudioDraft>) {
    setPast((items) => [...items.slice(-39), draft])
    setFuture([])
    setDraft((current) => ({ ...current, ...change }))
  }
  function toggle(field: 'modules' | 'roles' | 'workflows', value: string) {
    const current = draft[field]
    if (
      field === 'modules' &&
      current.includes(value) &&
      current.length === 1
    ) {
      toast.error('Keep at least one module.')
      return
    }
    update({
      [field]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    })
  }
  function undo() {
    const previous = past.at(-1)
    if (previous) {
      setFuture((items) => [draft, ...items])
      setDraft(previous)
      setPast((items) => items.slice(0, -1))
    }
  }
  function redo() {
    const next = future[0]
    if (next) {
      setPast((items) => [...items, draft])
      setDraft(next)
      setFuture((items) => items.slice(1))
    }
  }
  async function save(submit = false) {
    setPending(true)
    try {
      const nextRevision = await saveDraft(id, draft, revision)
      setRevision(nextRevision)
      setBaseline(JSON.stringify(draft))
      toast.success('Design saved.')
      if (submit) navigate(`/dashboard/requests/new?draft=${id}`)
      else if (!saved)
        navigate(`/dashboard/studio?draft=${id}`, { replace: true })
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setPending(false)
    }
  }
  function chooseSuite(slug: string) {
    if (dirty && !window.confirm('Switch suites and discard unsaved changes?'))
      return
    navigate(`/dashboard/studio?suite=${slug}`)
  }
  function movePage(index: number, direction: number) {
    const pages = [...draft.pages]
    const other = index + direction
    if (other < 0 || other >= pages.length) return
    ;[pages[index], pages[other]] = [pages[other], pages[index]]
    update({ pages })
  }
  function addPage() {
    const name = newPage.trim()
    if (!name) return
    if (draft.pages.includes(name) || draft.pages.length >= 15) {
      toast.error(
        'Choose a unique page name. A design supports up to 15 pages.',
      )
      return
    }
    update({ pages: [...draft.pages, name] })
    setPage(name)
    setNewPage('')
  }
  async function upload(
    file: File | undefined,
    kind: 'logoPath' | 'bannerPath' | 'mediaPaths',
  ) {
    if (!file || !user) return
    if (kind === 'mediaPaths' && draft.mediaPaths.length >= 20) {
      toast.error('A design supports up to 20 reference files.')
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      validateMedia(file, kind !== 'mediaPaths')
      const path = `drafts/${user.uid}/${id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-100)}`
      await uploadPrivateMedia(path, file, setProgress)
      update(
        kind === 'mediaPaths'
          ? { mediaPaths: [...draft.mediaPaths, path] }
          : { [kind]: path },
      )
      toast.success('File uploaded. Save your design to keep this reference.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }
  async function duplicate() {
    setPending(true)
    try {
      const newId = crypto.randomUUID()
      await saveDraft(
        newId,
        { ...draft, name: `${draft.name.slice(0, 110)} copy` },
        0,
      )
      navigate(`/dashboard/studio?draft=${newId}`)
      toast.success('Design duplicated.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <h1>Design studio</h1>
          <p>
            Shape your business platform. Share it with our team when you're
            ready.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <FolderOpen />
          Saved designs
        </Button>
      </div>
      <div className="studio-toolbar">
        <div className="page-actions">
          <button
            className="icon-button"
            aria-label="Undo"
            title="Undo"
            disabled={!past.length || pending}
            onClick={undo}
          >
            <Undo2 />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            title="Redo"
            disabled={!future.length || pending}
            onClick={redo}
          >
            <Redo2 />
          </button>
          <span className="studio-save-state">
            {dirty ? (
              'Unsaved changes'
            ) : revision ? (
              <>
                <Check size={13} />
                Saved · Version {revision}
              </>
            ) : (
              'New design'
            )}
          </span>
        </div>
        <div className="page-actions">
          <Button
            variant="ghost"
            onClick={duplicate}
            disabled={pending || uploading}
          >
            <Copy />
            Duplicate
          </Button>
          <StudioHistory
            id={id}
            disabled={!revision || pending || uploading}
            onRestore={(snapshot) => {
              update(snapshot)
              setPage(snapshot.pages[0])
              toast.success(
                'Checkpoint restored. Save to create a new version.',
              )
            }}
          />
          <Button
            variant="secondary"
            onClick={() => void save()}
            loading={pending}
            disabled={uploading}
          >
            <Save />
            Save design
          </Button>
          <Button
            onClick={() => void save(true)}
            disabled={pending || uploading}
          >
            Create project brief
          </Button>
        </div>
      </div>
      <div className="studio-workspace">
        <aside className="studio-explorer">
          <Field label="Business suite">
            <Select
              value={draft.suiteSlug}
              onChange={(e) => chooseSuite(e.target.value)}
            >
              {suiteBlueprints.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="studio-panel-heading mt-7">
            Pages <span>{draft.pages.length}/15</span>
          </div>
          {draft.pages.map((item, index) => (
            <div className="studio-page" data-active={page === item} key={item}>
              <button
                onClick={() => {
                  setPage(item)
                  setView('website')
                }}
              >
                <File size={13} />
                <span>{item}</span>
              </button>
              <button
                className="icon-button"
                title={`Move ${item} up`}
                aria-label={`Move ${item} up`}
                disabled={index === 0}
                onClick={() => movePage(index, -1)}
              >
                <ArrowUp />
              </button>
              <button
                className="icon-button"
                title={`Move ${item} down`}
                aria-label={`Move ${item} down`}
                disabled={index === draft.pages.length - 1}
                onClick={() => movePage(index, 1)}
              >
                <ArrowDown />
              </button>
              <button
                className="icon-button"
                aria-label={`Remove ${item}`}
                title={`Remove ${item}`}
                disabled={draft.pages.length === 1}
                onClick={() => {
                  const pages = draft.pages.filter((p) => p !== item)
                  update({ pages })
                  if (page === item) setPage(pages[0])
                }}
              >
                <Trash2 />
              </button>
            </div>
          ))}
          <div className="studio-add-page mt-3">
            <Input
              aria-label="New page name"
              value={newPage}
              maxLength={80}
              onChange={(e) => setNewPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addPage()
                }
              }}
              placeholder="New page"
            />
            <button
              className="icon-button"
              title="Add page"
              aria-label="Add page"
              onClick={addPage}
            >
              <Plus />
            </button>
          </div>
          <p className="studio-panel-heading mt-7">System modules</p>
          {suite.modules.map((module) => (
            <label className="studio-module" key={module.id}>
              <input
                type="checkbox"
                checked={draft.modules.includes(module.title)}
                onChange={() => toggle('modules', module.title)}
              />
              {module.title}
            </label>
          ))}
        </aside>
        <div className="studio-canvas-area">
          <div className="studio-canvas-toolbar">
            <div className="studio-choice">
              <button
                aria-pressed={view === 'system'}
                onClick={() => setView('system')}
              >
                System
              </button>
              <button
                aria-pressed={view === 'website'}
                onClick={() => setView('website')}
              >
                Website
              </button>
            </div>
            <div className="device-controls">
              {[
                { name: 'desktop', Icon: Monitor },
                { name: 'tablet', Icon: Tablet },
                { name: 'mobile', Icon: Smartphone },
              ].map(({ name, Icon }) => (
                <button
                  className="icon-button"
                  key={name}
                  aria-label={`${name} preview`}
                  title={`${name} preview`}
                  aria-pressed={device === name}
                  onClick={() => setDevice(name)}
                >
                  <Icon />
                </button>
              ))}
            </div>
          </div>
          <div
            className="studio-preview-frame"
            style={{
              maxWidth:
                device === 'mobile' ? 320 : device === 'tablet' ? 540 : '100%',
            }}
          >
            <SuiteCanvas
              key={draft.suiteSlug}
              draft={draft}
              website={view === 'website'}
              page={view === 'website' ? page : 'Overview'}
              bannerUrl={bannerUrl}
              logoUrl={logoUrl}
              onPageChange={setPage}
            />
          </div>
          <p className="product-caption">
            Interactive design preview · Sample content
          </p>
        </div>
        <aside className="studio-inspector">
          <div
            className="tab-bar col-span-full"
            role="tablist"
            aria-label="Design properties"
          >
            {(['brand', 'workflows', 'content'] as const).map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={panel === item}
                onClick={() => setPanel(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          {panel === 'brand' ? (
            <>
              <Field label="Business name">
                <Input
                  value={draft.name}
                  maxLength={120}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>
              <Field label="Website headline">
                <Input
                  value={draft.headline}
                  maxLength={160}
                  onChange={(e) => update({ headline: e.target.value })}
                />
              </Field>
              <div>
                <label className="studio-swatch">
                  Primary color
                  <input
                    type="color"
                    value={draft.primaryColor}
                    onChange={(e) => update({ primaryColor: e.target.value })}
                  />
                </label>
                <label className="studio-swatch">
                  Accent color
                  <input
                    type="color"
                    value={draft.accentColor}
                    onChange={(e) => update({ accentColor: e.target.value })}
                  />
                </label>
              </div>
              <Field label="Typography">
                <Select
                  value={draft.font}
                  onChange={(e) =>
                    update({ font: e.target.value as StudioDraft['font'] })
                  }
                >
                  <option value="modern">Modern sans serif</option>
                  <option value="classic">Classic serif</option>
                </Select>
              </Field>
              <div>
                <p className="studio-panel-heading">Appearance</p>
                <div className="studio-choice">
                  {(['light', 'dark'] as const).map((theme) => (
                    <button
                      key={theme}
                      aria-pressed={draft.theme === theme}
                      onClick={() => update({ theme })}
                    >
                      {theme === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Business description">
                <Textarea
                  value={draft.description}
                  maxLength={6000}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="What makes your business different?"
                />
              </Field>
            </>
          ) : panel === 'workflows' ? (
            <>
              <div>
                <p className="studio-panel-heading">Portals & roles</p>
                {suite.roles.map((role) => (
                  <label key={role.id} className="studio-module">
                    <input
                      type="checkbox"
                      checked={draft.roles.includes(role.title)}
                      onChange={() => toggle('roles', role.title)}
                    />
                    {role.title}
                  </label>
                ))}
              </div>
              <div>
                <p className="studio-panel-heading">Requested automations</p>
                {suite.workflows.map((workflow) => (
                  <label className="studio-module" key={workflow.id}>
                    <input
                      type="checkbox"
                      checked={draft.workflows.includes(workflow.title)}
                      onChange={() => toggle('workflows', workflow.title)}
                    />
                    {workflow.title}
                  </label>
                ))}
              </div>
              <Field label="Workflow details">
                <Textarea
                  value={draft.notes}
                  maxLength={6000}
                  onChange={(e) => update({ notes: e.target.value })}
                  placeholder="Approval steps, data imports, payments, roles, and any custom requirements."
                />
              </Field>
            </>
          ) : (
            <>
              <p className="field-hint col-span-full">
                Use content you own or have permission to share.
              </p>
              {(['logoPath', 'bannerPath', 'mediaPaths'] as const).map(
                (kind) => (
                  <label className="af-field" key={kind}>
                    <span className="studio-panel-heading">
                      <ImagePlus size={14} />
                      {kind === 'logoPath'
                        ? 'Logo'
                        : kind === 'bannerPath'
                          ? 'Website banner'
                          : 'Photos, video & documents'}
                    </span>
                    <Input
                      type="file"
                      accept={
                        kind === 'mediaPaths'
                          ? '.jpg,.jpeg,.png,.webp,.avif,.gif,.mp4,.webm,.pdf,.docx,.xlsx,.pptx,.csv,.txt,.zip'
                          : rasterTypes.join(',')
                      }
                      disabled={
                        uploading ||
                        (kind === 'mediaPaths' && draft.mediaPaths.length >= 20)
                      }
                      onChange={(event) =>
                        void upload(event.target.files?.[0], kind)
                      }
                    />
                  </label>
                ),
              )}
              {uploading && (
                <p className="field-hint" role="status">
                  Uploading {progress}%
                </p>
              )}
              {draft.mediaPaths.map((path) => (
                <div className="file-row" key={path}>
                  <File size={14} />
                  <span>{path.split('/').at(-1)?.slice(37)}</span>
                  <button
                    className="icon-button"
                    title="Remove file from design"
                    aria-label="Remove file from design"
                    onClick={() =>
                      update({
                        mediaPaths: draft.mediaPaths.filter((p) => p !== path),
                      })
                    }
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Your saved designs"
        description="Continue a design or make a copy for your next project."
        className="max-w-2xl"
      >
        {drafts.isPending ? (
          <StatePanel loading />
        ) : drafts.error ? (
          <StatePanel
            error={drafts.error}
            retry={() => void drafts.refetch()}
          />
        ) : drafts.data.length ? (
          <div className="studio-drafts">
            {drafts.data.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (
                    dirty &&
                    !window.confirm(
                      'Open this design and discard unsaved changes?',
                    )
                  )
                    return
                  setOpen(false)
                  navigate(`/dashboard/studio?draft=${item.id}`)
                }}
              >
                <span>{item.name}</span>
                <span className="text-aura-muted text-xs">
                  v{item.revision} · {displayDate(item.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <StatePanel
            title="No saved designs yet"
            description="Your saved designs will appear here."
          />
        )}
      </Modal>
    </>
  )
}
