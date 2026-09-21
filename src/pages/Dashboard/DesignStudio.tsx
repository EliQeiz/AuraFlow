import {
  AlignCenter,
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FilePlus2,
  Grid3X3,
  ImagePlus,
  Layers3,
  Monitor,
  MousePointer2,
  Palette,
  PanelLeft,
  PanelRight,
  Play,
  Plus,
  Redo2,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Type,
  Undo2,
  Upload,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { DesignArtboard } from '../../components/shared/DesignArtboard'
import {
  LayerInspector,
  LayerList,
  VisualInspector,
} from '../../components/shared/DesignInspector'
import { StudioHistory } from '../../components/shared/StudioHistory'
import { SuiteCanvas } from '../../components/shared/SuiteCanvas'
import { useAuth } from '../../context/AuthContext'
import {
  defaultVisual,
  newLayer,
  starterLayers,
  type DesignLayer,
} from '../../domain/composition'
import { defaultDraft, type StudioDraft } from '../../domain/studio'
import { getSuiteBlueprint, suiteBlueprints } from '../../data/suiteBlueprints'
import { saveDraft } from '../../lib/studio'

type StudioView = 'design' | 'prototype' | 'preview'
type LibraryTab = 'pages' | 'layers' | 'components' | 'assets'
type InspectorTab = 'design' | 'prototype' | 'content'

const componentPresets: Array<{ kind: DesignLayer['kind']; label: string; icon: typeof Type }> = [
  { kind: 'text', label: 'Text', icon: Type },
  { kind: 'button', label: 'Button', icon: MousePointer2 },
  { kind: 'rectangle', label: 'Frame', icon: Layers3 },
  { kind: 'image', label: 'Image', icon: ImagePlus },
  { kind: 'metric', label: 'Metric', icon: Sparkles },
  { kind: 'chart', label: 'Chart', icon: Grid3X3 },
  { kind: 'silo', label: 'Process', icon: PanelRight },
]

function download(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function DesignStudio() {
  const { user } = useAuth()
  const artboard = useRef<HTMLDivElement>(null)
  const [draftId] = useState(() => `studio-${crypto.randomUUID()}`)
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState<StudioDraft>(() => {
    const suite = suiteBlueprints[0]
    return {
      ...defaultDraft(
        suite.slug,
        'Untitled experience',
        suite.modules.slice(0, 4).map((module) => module.title),
        suite.roles.slice(0, 2).map((role) => role.title),
      ),
      layers: starterLayers('Home', 'landing'),
      visual: defaultVisual,
    }
  })
  const [past, setPast] = useState<StudioDraft[]>([])
  const [future, setFuture] = useState<StudioDraft[]>([])
  const [view, setView] = useState<StudioView>('design')
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('pages')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('design')
  const [selectedLayer, setSelectedLayer] = useState('')
  const [page, setPage] = useState('Home')
  const [newPage, setNewPage] = useState('')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [zoom, setZoom] = useState(1)
  const [grid, setGrid] = useState(true)
  const [saving, setSaving] = useState(false)
  const selected = draft.layers?.find((layer) => layer.id === selectedLayer)
  const suite = getSuiteBlueprint(draft.suiteSlug) ?? suiteBlueprints[0]
  const pages = draft.pages
  const pageLayers = useMemo(
    () => (draft.layers || []).filter((layer) => layer.page === page),
    [draft.layers, page],
  )

  function commit(next: StudioDraft) {
    setPast((items) => [...items.slice(-29), draft])
    setFuture([])
    setDraft(next)
  }
  function update(change: Partial<StudioDraft>) {
    commit({ ...draft, ...change })
  }
  function updateLayers(layers: DesignLayer[]) {
    commit({ ...draft, layers })
  }
  function undo() {
    const previous = past.at(-1)
    if (!previous) return
    setFuture((items) => [draft, ...items])
    setPast((items) => items.slice(0, -1))
    setDraft(previous)
  }
  function redo() {
    const next = future[0]
    if (!next) return
    setPast((items) => [...items, draft])
    setFuture((items) => items.slice(1))
    setDraft(next)
  }
  function addComponent(kind: DesignLayer['kind']) {
    if ((draft.layers?.length || 0) >= 12) {
      toast.error('This prototype is at the 12-layer limit. Remove a layer before adding another.')
      return
    }
    const layer = newLayer(kind, page, draft.primaryColor)
    updateLayers([...(draft.layers || []), layer])
    setSelectedLayer(layer.id)
    setLibraryTab('layers')
  }
  function addPage() {
    const name = newPage.trim()
    if (!name || pages.includes(name)) return
    update({ pages: [...pages, name] })
    setPage(name)
    setNewPage('')
  }
  function removePage(name: string) {
    if (pages.length === 1) return
    const nextPages = pages.filter((item) => item !== name)
    update({ pages: nextPages, layers: (draft.layers || []).filter((layer) => layer.page !== name) })
    if (page === name) setPage(nextPages[0])
  }
  function chooseSuite(slug: string) {
    const next = getSuiteBlueprint(slug)
    if (!next) return
    const nextDraft = {
      ...defaultDraft(next.slug, next.title, next.modules.slice(0, 4).map((module) => module.title), next.roles.slice(0, 2).map((role) => role.title)),
      layers: starterLayers('Home', next.category === 'Education' ? 'dashboard' : next.category === 'Operations' ? 'industrial' : 'landing'),
      visual: defaultVisual,
    }
    commit(nextDraft)
    setPage('Home')
    setSelectedLayer('')
  }
  async function save() {
    if (!user || saving) return
    setSaving(true)
    try {
      const nextRevision = await saveDraft(draftId, draft, revision)
      setRevision(nextRevision)
      toast.success('Studio draft saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save this draft.')
    } finally {
      setSaving(false)
    }
  }
  async function exportPng() {
    const node = artboard.current?.querySelector('#design-artboard') as HTMLElement | null
    if (!node) return
    const { toPng } = await import('html-to-image')
    const url = await toPng(node, { pixelRatio: 2 })
    const link = document.createElement('a')
    link.href = url
    link.download = `${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'auraflow-design'}.png`
    link.click()
  }
  return (
    <div className="studio-lab">
      <header className="studio-lab-topbar">
        <div className="studio-lab-title">
          <a href="/dashboard" className="studio-lab-back" aria-label="Back to workspace"><ArrowLeft /></a>
          <div>
            <div className="studio-lab-eyebrow"><Sparkles size={12} /> AuraFlow Studio Lab</div>
            <input aria-label="Studio project name" value={draft.name} onChange={(event) => update({ name: event.target.value })} />
          </div>
          <span className="studio-lab-status"><Check size={13} /> Local draft</span>
        </div>
        <div className="studio-lab-actions">
          <button className="icon-button" title="Undo" aria-label="Undo" disabled={!past.length} onClick={undo}><Undo2 /></button>
          <button className="icon-button" title="Redo" aria-label="Redo" disabled={!future.length} onClick={redo}><Redo2 /></button>
          <span className="studio-lab-divider" />
          <StudioHistory id={draftId} disabled={!user} onRestore={(restored) => { setDraft(restored); toast.success('Checkpoint restored.') }} />
          <Button variant="secondary" onClick={() => download(`${draft.name || 'auraflow-design'}.json`, JSON.stringify(draft, null, 2))}><Download /> Export</Button>
          <Button loading={saving} onClick={() => void save()}><Save /> Save</Button>
        </div>
      </header>

      <div className="studio-lab-main">
        <aside className="studio-lab-left">
          <div className="studio-lab-rail" role="tablist" aria-label="Studio library">
            {([
              ['pages', FilePlus2, 'Pages'],
              ['layers', Layers3, 'Layers'],
              ['components', Sparkles, 'Components'],
              ['assets', ImagePlus, 'Assets'],
            ] as const).map(([tab, Icon, label]) => (
              <button key={tab} role="tab" aria-selected={libraryTab === tab} title={label} onClick={() => setLibraryTab(tab)}><Icon /></button>
            ))}
          </div>
          <div className="studio-lab-panel">
            {libraryTab === 'pages' && <>
              <div className="studio-lab-panel-heading"><span>Pages</span><button className="icon-button" title="Add page" aria-label="Add page" onClick={addPage}><Plus /></button></div>
              <div className="studio-lab-pages">
                {pages.map((item) => <button key={item} className="studio-lab-page" aria-pressed={page === item} onClick={() => { setPage(item); setView('design') }}><span><span className="studio-page-dot" />{item}</span>{pages.length > 1 && <X size={13} onClick={(event) => { event.stopPropagation(); removePage(item) }} />}</button>)}
              </div>
              <div className="studio-lab-add-page"><Input aria-label="New page" placeholder="New page" value={newPage} onChange={(event) => setNewPage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addPage()} /><button className="icon-button" onClick={addPage} aria-label="Add page"><Plus /></button></div>
              <Field label="Business system"><Select value={draft.suiteSlug} onChange={(event) => chooseSuite(event.target.value)}>{suiteBlueprints.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</Select></Field>
            </>}
            {libraryTab === 'layers' && <><div className="studio-lab-panel-heading"><span>{page} layers</span><span className="studio-lab-count">{pageLayers.length}/12</span></div><LayerList layers={pageLayers} selected={selectedLayer} selectedIds={selectedLayer ? [selectedLayer] : []} onSelect={setSelectedLayer} onChange={(next) => updateLayers([...(draft.layers || []).filter((layer) => layer.page !== page), ...next])} /></>}
            {libraryTab === 'components' && <><div className="studio-lab-panel-heading"><span>Components</span><span className="studio-lab-count">Reusable</span></div><p className="studio-lab-help">Add a component to the active page, then tune it from the inspector.</p><div className="studio-component-grid">{componentPresets.map(({ kind, label, icon: Icon }) => <button key={kind} onClick={() => addComponent(kind)}><Icon /><span>{label}</span></button>)}</div><div className="studio-lab-note"><Sparkles size={15} /><span>Next: save any layer as a reusable component across pages.</span></div></>}
            {libraryTab === 'assets' && <><div className="studio-lab-panel-heading"><span>Assets</span><button className="icon-button" title="Upload asset" aria-label="Upload asset"><Upload /></button></div><label className="studio-upload"><Upload /><strong>Drop brand assets here</strong><small>Images, logos, banners, video, and references</small><input type="file" accept="image/*,video/*" multiple onChange={(event) => toast.success(`${event.target.files?.length || 0} asset(s) selected for this draft.`)} /></label><p className="studio-lab-help">Uploaded media stays private to your project and can be attached to a layer from the existing content workflow.</p></>}
          </div>
        </aside>

        <section className="studio-lab-canvas" ref={artboard}>
          <div className="studio-lab-toolbar">
            <div className="studio-lab-mode" role="tablist" aria-label="Studio mode">
              {([['design', 'Design'], ['prototype', 'Prototype'], ['preview', 'Preview']] as const).map(([mode, label]) => <button key={mode} role="tab" aria-selected={view === mode} onClick={() => setView(mode)}>{mode === 'preview' && <Play size={13} />}{label}</button>)}
            </div>
            <div className="studio-lab-toolbar-group"><button className="icon-button" title="Select" aria-label="Select tool" aria-pressed><MousePointer2 /></button><button className="icon-button" title="Add text" aria-label="Add text" onClick={() => addComponent('text')}><Type /></button><button className="icon-button" title="Add frame" aria-label="Add frame" onClick={() => addComponent('rectangle')}><PanelLeft /></button><span className="studio-lab-divider" /><button className="icon-button" title="Toggle grid" aria-label="Toggle grid" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid3X3 /></button><Select aria-label="Zoom" value={zoom} onChange={(event) => setZoom(Number(event.target.value))}><option value={0.5}>50%</option><option value={0.75}>75%</option><option value={1}>Fit</option><option value={1.5}>150%</option></Select></div>
            <div className="studio-lab-toolbar-group"><span className="studio-lab-label">Viewport</span>{([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([name, Icon]) => <button key={name} className="icon-button" title={`${name} viewport`} aria-label={`${name} viewport`} aria-pressed={device === name} onClick={() => setDevice(name)}><Icon /></button>)}</div>
          </div>
          <div className="studio-lab-canvas-stage">
            {view === 'preview' ? <div className="studio-preview-device" style={{ maxWidth: device === 'mobile' ? 370 : device === 'tablet' ? 680 : 1180 }}><SuiteCanvas draft={draft} page={page} website /></div> : view === 'prototype' ? <div className="studio-prototype-empty"><Play size={28} /><h2>Prototype flow</h2><p>Select a button layer to connect it to another page. Then use Preview to test the flow.</p>{selected?.kind === 'button' ? <div className="studio-prototype-card"><strong>{selected.text || 'Selected button'}</strong><span>Links to {selected.targetPage || 'No destination'}</span></div> : <span className="studio-lab-help">Choose a button from the Layers panel to edit its interaction.</span>}</div> : <DesignArtboard draft={draft} page={page} selected={selectedLayer} selectedIds={selectedLayer ? [selectedLayer] : []} onSelect={(id) => setSelectedLayer(id)} onChange={updateLayers} zoom={zoom} grid={grid} preview={false} />}
          </div>
          <footer className="studio-lab-canvas-footer"><span>{suite.title} · {page}</span><span>{device} · {Math.round(zoom * 100)}%</span><Button variant="ghost" onClick={() => void exportPng()}><Download /> PNG</Button></footer>
        </section>

        <aside className="studio-lab-right">
          <div className="studio-lab-inspector-tabs" role="tablist" aria-label="Inspector"><button aria-selected={inspectorTab === 'design'} onClick={() => setInspectorTab('design')}><Palette /> Design</button><button aria-selected={inspectorTab === 'prototype'} onClick={() => setInspectorTab('prototype')}><Play /> Prototype</button><button aria-selected={inspectorTab === 'content'} onClick={() => setInspectorTab('content')}><AlignCenter /> Content</button></div>
          <div className="studio-lab-inspector">
            {inspectorTab === 'design' && (selected ? <LayerInspector layer={selected} draft={draft} onChange={(next) => updateLayers((draft.layers || []).map((layer) => layer.id === next.id ? next : layer))} /> : <VisualInspector draft={draft} update={update} />)}
            {inspectorTab === 'prototype' && <div className="studio-inspector-content"><h3>Interaction flow</h3><p className="studio-lab-help">Create a clickable flow between your pages and validate it in Preview.</p><Field label="Active page"><Select value={page} onChange={(event) => setPage(event.target.value)}>{pages.map((item) => <option key={item}>{item}</option>)}</Select></Field><div className="studio-flow-list">{(draft.layers || []).filter((layer) => layer.kind === 'button').map((button) => <button key={button.id} aria-pressed={selectedLayer === button.id} onClick={() => { setSelectedLayer(button.id); setInspectorTab('design') }}><span>{button.text || 'Button'}</span><ChevronDown size={14} /><small>{button.targetPage || 'No destination'}</small></button>)}</div></div>}
            {inspectorTab === 'content' && <div className="studio-inspector-content"><h3>Project brief</h3><p className="studio-lab-help">Keep the intent beside the design so AuraFlow can build from a clear source of truth.</p><Field label="Headline"><Input value={draft.headline} maxLength={160} onChange={(event) => update({ headline: event.target.value })} /></Field><Field label="Description"><Textarea value={draft.description} maxLength={6000} onChange={(event) => update({ description: event.target.value })} /></Field><Field label="Build notes"><Textarea value={draft.notes} maxLength={6000} onChange={(event) => update({ notes: event.target.value })} placeholder="Integrations, roles, data, payments, launch requirements..." /></Field></div>}
          </div>
        </aside>
      </div>
    </div>
  )
}
