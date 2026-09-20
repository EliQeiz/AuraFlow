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
  Download,
  Upload,
  Type,
  Square,
  Circle,
  MousePointer2,
  BarChart3,
  Gauge,
  Grid2X2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
} from 'lucide-react'
import { collection, doc, getDoc, orderBy, query } from 'firebase/firestore'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DesignArtboard } from '../../components/shared/DesignArtboard'
import {
  LayerInspector,
  LayerList,
  VisualInspector,
} from '../../components/shared/DesignInspector'
import {
  defaultVisual,
  fontFamilies,
  newLayer,
  starterLayers,
  type DesignLayer,
} from '../../domain/composition'
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
import {
  alignLayers,
  duplicatePage,
  type Alignment,
} from '../../domain/studioEditing'

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
      : {
          ...defaultDraft(
            initialSuite.slug,
            'Untitled project',
            initialSuite.modules.slice(0, 4).map((m) => m.title),
            initialSuite.roles.slice(0, 2).map((r) => r.title),
          ),
          layers: starterLayers(
            'Home',
            initialSuite.slug.includes('industrial')
              ? 'industrial'
              : initialSuite.category === 'Education'
                ? 'dashboard'
                : 'landing',
          ),
          visual: defaultVisual,
        },
  )
  const [baseline, setBaseline] = useState(JSON.stringify(draft))
  const [past, setPast] = useState<StudioDraft[]>([])
  const [future, setFuture] = useState<StudioDraft[]>([])
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(draft.pages[0])
  const [newPage, setNewPage] = useState('')
  const [device, setDevice] = useState('desktop')
  const [view, setView] = useState<'system' | 'website' | 'design'>('design')
  const [panel, setPanel] = useState<
    'brand' | 'workflows' | 'content' | 'layer'
  >('brand')
  const [selectedLayer, setSelectedLayer] = useState('')
  const [selection, setSelection] = useState<string[]>([])
  const [zoom, setZoom] = useState(1)
  const [grid, setGrid] = useState(true)
  const [preview, setPreview] = useState(false)
  const layer = draft.layers?.find((item) => item.id === selectedLayer)
  const selectedIds = selection.filter((id) =>
    draft.layers?.some((l) => l.id === id && l.page === page),
  )
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
    if (change.visual && draft.layers && !change.layers) {
      const before = draft.visual || defaultVisual
      const after = change.visual
      change.layers = draft.layers.map((layer) => ({
        ...layer,
        color: layer.color === before.ink ? after.ink : layer.color,
        fill: layer.fill === before.surface ? after.surface : layer.fill,
        radius: layer.radius === before.radius ? after.radius : layer.radius,
        ...(layer.kind === 'image'
          ? {
              brightness:
                layer.brightness === before.brightness
                  ? after.brightness
                  : layer.brightness,
              saturation:
                layer.saturation === before.saturation
                  ? after.saturation
                  : layer.saturation,
              opacity:
                layer.opacity === before.imageOpacity
                  ? after.imageOpacity
                  : layer.opacity,
            }
          : {}),
      }))
    }
    if (
      !change.layers &&
      draft.layers &&
      (change.primaryColor || change.font)
    ) {
      change.layers = draft.layers.map((layer) => ({
        ...layer,
        ...(change.primaryColor && layer.fill === draft.primaryColor
          ? { fill: change.primaryColor, stroke: change.primaryColor }
          : {}),
        ...(change.font && layer.font === draft.font
          ? { font: change.font }
          : {}),
      }))
    }
    if (JSON.stringify({ ...draft, ...change }) === JSON.stringify(draft))
      return
    setPast((items) => [...items.slice(-39), draft])
    setFuture([])
    setDraft((current) => ({ ...current, ...change }))
  }
  function selectLayer(id: string, additive = false) {
    if (id.startsWith('page:')) {
      setPage(id.slice(5))
      return
    }
    setSelectedLayer(id)
    setSelection((current) =>
      additive
        ? current.includes(id)
          ? current.filter((value) => value !== id)
          : [
              ...current.filter(
                (value) =>
                  draft.layers?.find((l) => l.id === value)?.page ===
                  draft.layers?.find((l) => l.id === id)?.page,
              ),
              id,
            ]
        : id
          ? [id]
          : [],
    )
    if (id) {
      const target = draft.layers?.find((item) => item.id === id)
      if (target) setPage(target.page)
      setPanel('layer')
    }
  }
  function addLayer(kind: DesignLayer['kind']) {
    if ((draft.layers?.length || 0) >= 12) {
      toast.error('A design supports up to 12 layers.')
      return
    }
    const added = newLayer(kind, page, draft.primaryColor)
    if (kind === 'text') added.color = (draft.visual || defaultVisual).ink
    update({ layers: [...(draft.layers || []), added] })
    selectLayer(added.id)
    setView('design')
  }
  function preset(kind: 'landing' | 'dashboard' | 'industrial') {
    const otherPages = draft.layers?.filter((l) => l.page !== page) || []
    const additions = starterLayers(page, kind, draft.primaryColor)
    if (otherPages.length + additions.length > 12) {
      toast.error('This layout exceeds the current 12-layer design limit.')
      return
    }
    if (
      draft.layers?.length &&
      !window.confirm(
        'Replace canvas layers with this layout? You can undo this change.',
      )
    )
      return
    update({ layers: [...otherPages, ...additions] })
    selectLayer('')
  }
  function duplicateSelection() {
    const selected =
      draft.layers?.filter((l) => selectedIds.includes(l.id)) || []
    if (!selected.length) return
    if ((draft.layers?.length || 0) + selected.length > 12) {
      toast.error('This copy exceeds the current 12-layer design limit.')
      return
    }
    const copies = selected.map((l) => ({
      ...l,
      id: crypto.randomUUID(),
      x: Math.min(1200 - l.width, l.x + 16),
      y: Math.min(900 - l.height, l.y + 16),
      locked: false,
    }))
    update({ layers: [...(draft.layers || []), ...copies] })
    setSelection(copies.map((l) => l.id))
    setSelectedLayer(copies[0].id)
  }
  function copyPage() {
    try {
      const copy = duplicatePage(draft, page)
      update(copy.draft)
      setPage(copy.name)
      selectLayer('')
    } catch (error) {
      toast.error(asErrorMessage(error))
    }
  }
  async function exportDesign(format: 'json' | 'png') {
    setPending(true)
    try {
      let url: string
      if (format === 'json')
        url = URL.createObjectURL(
          new Blob([JSON.stringify(draftSchema.parse(draft), null, 2)], {
            type: 'application/json',
          }),
        )
      else {
        const node = document.getElementById('design-artboard')
        if (!node)
          throw new Error('Open the Canvas view before exporting an image.')
        const { toPng } = await import('html-to-image')
        node.dataset.exporting = 'true'
        try {
          url = await toPng(node, {
            width: 1200,
            height: 900,
            pixelRatio: 1,
            skipFonts: true,
            style: { transform: 'none', backgroundImage: 'none' },
            filter: (item) =>
              !(
                item instanceof HTMLElement &&
                item.dataset.exportIgnore === 'true'
              ),
          })
        } finally {
          delete node.dataset.exporting
        }
      }
      const link = document.createElement('a')
      link.href = url
      link.download = `${draft.name.replace(/[^a-z0-9-]/gi, '-').slice(0, 80)}.${format}`
      link.click()
      if (format === 'json') setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setPending(false)
    }
  }
  async function importDesign(file?: File) {
    if (!file) return
    try {
      if (file.size > 250_000)
        throw new Error('Design files must be under 250KB.')
      const imported = draftSchema.parse(JSON.parse(await file.text()))
      if (!getSuiteBlueprint(imported.suiteSlug))
        throw new Error('This business suite is not available.')
      if (
        dirty &&
        !window.confirm('Replace the current design with this file?')
      )
        return
      update({ ...imported, logoPath: '', bannerPath: '', mediaPaths: [] })
      setPage(imported.pages[0])
      setSelectedLayer('')
      setView('design')
      toast.success(
        'Design imported. Reattach private media and save to your workspace.',
      )
    } catch (error) {
      toast.error(asErrorMessage(error))
    }
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
    <div
      onKeyDown={(event) => {
        const command = event.ctrlKey || event.metaKey
        if (command && event.key.toLowerCase() === 's') {
          event.preventDefault()
          if (!pending) void save()
          return
        }
        if (
          (event.target as HTMLElement).closest(
            'input,textarea,select,[contenteditable="true"]',
          ) ||
          pending ||
          preview
        )
          return
        if (command && event.key.toLowerCase() === 'z') {
          event.preventDefault()
          if (event.shiftKey) redo()
          else undo()
        }
        if (command && event.key.toLowerCase() === 'y') {
          event.preventDefault()
          redo()
        }
        if (command && event.key.toLowerCase() === 'd') {
          event.preventDefault()
          duplicateSelection()
        }
        if (command && event.key.toLowerCase() === 'a') {
          event.preventDefault()
          setSelection(
            draft.layers
              ?.filter((l) => l.page === page && !l.hidden && !l.locked)
              .map((l) => l.id) || [],
          )
        }
        if (event.key === 'Escape') selectLayer('')
        if (['Delete', 'Backspace'].includes(event.key) && selectedIds.length) {
          event.preventDefault()
          update({
            layers: draft.layers?.filter(
              (l) => !selectedIds.includes(l.id) || l.locked,
            ),
          })
          selectLayer('')
        }
      }}
    >
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
          <button
            className="icon-button"
            title="Download design JSON"
            aria-label="Download design JSON"
            disabled={pending}
            onClick={() => void exportDesign('json')}
          >
            <Download />
          </button>
          <label className="icon-button" title="Import design JSON">
            <Upload />
            <span className="sr-only">Import design JSON</span>
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                void importDesign(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
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
                  if (view !== 'design') setView('website')
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
                  update({
                    pages,
                    ...(draft.layers
                      ? {
                          layers: draft.layers
                            .filter((layer) => layer.page !== item)
                            .map((layer) =>
                              layer.targetPage === item
                                ? { ...layer, targetPage: '' }
                                : layer,
                            ),
                        }
                      : {}),
                  })
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
          <p className="studio-panel-heading mt-7">
            Layers <span>{draft.layers?.length || 0}/12</span>
          </p>
          <LayerList
            layers={draft.layers || []}
            selected={selectedLayer}
            selectedIds={selectedIds}
            onSelect={selectLayer}
            onChange={(layers) => update({ layers })}
          />
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
                aria-pressed={view === 'design'}
                onClick={() => setView('design')}
              >
                Canvas
              </button>
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
                  onClick={() => {
                    setDevice(name)
                    if (view === 'design') setView('website')
                  }}
                >
                  <Icon />
                </button>
              ))}
            </div>
          </div>
          {view === 'design' ? (
            <>
              <div className="design-tools">
                <button
                  className="icon-button"
                  title="Duplicate current page"
                  aria-label="Duplicate current page"
                  onClick={copyPage}
                >
                  <Copy />
                </button>
                {(
                  [
                    { kind: 'text', Icon: Type },
                    { kind: 'rectangle', Icon: Square },
                    { kind: 'ellipse', Icon: Circle },
                    { kind: 'button', Icon: MousePointer2 },
                    { kind: 'image', Icon: ImagePlus },
                    { kind: 'metric', Icon: Gauge },
                    { kind: 'chart', Icon: BarChart3 },
                    { kind: 'silo', Icon: Grid2X2 },
                  ] as const
                ).map(({ kind, Icon }) => (
                  <button
                    className="icon-button"
                    key={kind}
                    title={`Add ${kind}`}
                    aria-label={`Add ${kind}`}
                    disabled={(draft.layers?.length || 0) >= 12}
                    onClick={() => addLayer(kind)}
                  >
                    <Icon />
                  </button>
                ))}
                <Select
                  aria-label="Canvas zoom"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                >
                  <option value={0.5}>50%</option>
                  <option value={0.75}>75%</option>
                  <option value={1}>Fit</option>
                  <option value={1.5}>150%</option>
                </Select>
                <Select
                  aria-label="Apply canvas layout"
                  value=""
                  onChange={(e) => {
                    if (e.target.value)
                      preset(
                        e.target.value as
                          'landing' | 'dashboard' | 'industrial',
                      )
                  }}
                >
                  <option value="">Layout</option>
                  <option value="landing">Landing page</option>
                  <option value="dashboard">Dashboard</option>
                  <option value="industrial">Industrial</option>
                </Select>
                <button
                  className="icon-button"
                  title="Snap to grid"
                  aria-label="Snap to grid"
                  aria-pressed={grid}
                  onClick={() => setGrid(!grid)}
                >
                  <Grid2X2 />
                </button>
                <button
                  className="af-button af-button--secondary"
                  aria-pressed={preview}
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? 'Edit' : 'Preview'}
                </button>
                <button
                  className="icon-button"
                  title="Download canvas PNG"
                  aria-label="Download canvas PNG"
                  disabled={pending}
                  onClick={() => void exportDesign('png')}
                >
                  <Download />
                </button>
              </div>
              {selectedIds.length > 0 && (
                <div className="design-selection-toolbar">
                  <span>{selectedIds.length} selected</span>
                  {(
                    [
                      ['left', AlignLeft],
                      ['center', AlignCenter],
                      ['right', AlignRight],
                      ['top', AlignStartHorizontal],
                      ['middle', AlignCenterHorizontal],
                      ['bottom', AlignEndHorizontal],
                      ['horizontal', AlignHorizontalDistributeCenter],
                      ['vertical', AlignVerticalDistributeCenter],
                    ] as const
                  ).map(([alignment, Icon]) => (
                    <button
                      key={alignment}
                      className="icon-button"
                      title={`Align ${alignment}`}
                      aria-label={`Align ${alignment}`}
                      disabled={
                        selectedIds.length <
                        (['horizontal', 'vertical'].includes(alignment) ? 3 : 2)
                      }
                      onClick={() =>
                        update({
                          layers: alignLayers(
                            draft.layers || [],
                            selectedIds,
                            alignment as Alignment,
                          ),
                        })
                      }
                    >
                      <Icon />
                    </button>
                  ))}
                  <button
                    className="icon-button"
                    title="Duplicate selection"
                    aria-label="Duplicate selection"
                    onClick={duplicateSelection}
                  >
                    <Copy />
                  </button>
                </div>
              )}
              {!draft.layers?.length && (
                <div className="design-presets">
                  <strong>Start with a layout</strong>
                  <button onClick={() => preset('landing')}>
                    Landing page
                  </button>
                  <button onClick={() => preset('dashboard')}>Dashboard</button>
                  <button onClick={() => preset('industrial')}>
                    Industrial process
                  </button>
                </div>
              )}
              <DesignArtboard
                draft={draft}
                page={page}
                selected={selectedLayer}
                selectedIds={selectedIds}
                onSelect={selectLayer}
                onChange={(layers) => update({ layers })}
                zoom={zoom}
                grid={grid}
                preview={preview}
              />
            </>
          ) : (
            <div
              className="studio-preview-frame"
              style={{
                maxWidth:
                  device === 'mobile'
                    ? 320
                    : device === 'tablet'
                      ? 540
                      : '100%',
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
          )}
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
            {(['brand', 'layer', 'workflows', 'content'] as const).map(
              (item) => (
                <button
                  key={item}
                  role="tab"
                  aria-selected={panel === item}
                  onClick={() => setPanel(item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ),
            )}
          </div>
          {panel === 'layer' ? (
            layer ? (
              <LayerInspector
                layer={layer}
                draft={draft}
                onChange={(next) =>
                  update({
                    layers: draft.layers!.map((item) =>
                      item.id === next.id ? next : item,
                    ),
                  })
                }
              />
            ) : (
              <p className="field-hint">Select a canvas layer.</p>
            )
          ) : panel === 'brand' ? (
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
                  {Object.keys(fontFamilies).map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </Select>
              </Field>
              <div>
                <p className="studio-panel-heading">Appearance</p>
                <div className="studio-choice">
                  {(['light', 'dark'] as const).map((theme) => (
                    <button
                      key={theme}
                      aria-pressed={draft.theme === theme}
                      onClick={() =>
                        update({
                          theme,
                          visual: {
                            ...(draft.visual || defaultVisual),
                            ...(theme === 'dark'
                              ? {
                                  background: '#12151a',
                                  surface: '#20252d',
                                  ink: '#f1f5f9',
                                }
                              : {
                                  background: defaultVisual.background,
                                  surface: defaultVisual.surface,
                                  ink: defaultVisual.ink,
                                }),
                          },
                        })
                      }
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
              <VisualInspector draft={draft} update={update} />
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
    </div>
  )
}
