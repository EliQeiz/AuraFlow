import {
  Activity,
  BarChart3,
  Bell,
  Box,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  CloudUpload,
  Download,
  FileCheck2,
  FileWarning,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  MapPin,
  PackageCheck,
  Play,
  QrCode,
  Radio,
  RefreshCcw,
  ScanLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  UsersRound,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import type { LabSlug } from '../../data/labs'

type DemoProps = { slug: LabSlug }

const formatGhs = (value: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(value)

function DemoFrame({
  title,
  label,
  children,
  onReset,
}: {
  title: string
  label: string
  children: ReactNode
  onReset?: () => void
}) {
  return (
    <section className="lab-demo" aria-label={`${title} interactive demonstration`}>
      <header className="lab-demo__header">
        <div><span className="lab-demo__eyebrow">Interactive product demo</span><strong>{title}</strong><small>{label}</small></div>
        {onReset && <button className="lab-demo__reset" type="button" onClick={onReset}><RefreshCcw /> Reset demo</button>}
      </header>
      {children}
    </section>
  )
}

type ErpSection = 'overview' | 'students' | 'finance' | 'inventory' | 'workflows'

const erpSections: Array<{ id: ErpSection; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'students', label: 'Students', icon: UsersRound },
  { id: 'finance', label: 'Finance', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'workflows', label: 'Workflows', icon: ClipboardCheck },
]

function CloudErpDemo() {
  const [section, setSection] = useState<ErpSection>('overview')
  const [stock, setStock] = useState(48)
  const [invoiceCount, setInvoiceCount] = useState(12)
  const [admissions, setAdmissions] = useState(3)
  const [events, setEvents] = useState<string[]>(['Fee review assigned to B. Owusu', 'New parent profile verified', 'Purchase order PO-1042 approved'])
  const reset = () => { setSection('overview'); setStock(48); setInvoiceCount(12); setAdmissions(3); setEvents(['Fee review assigned to B. Owusu', 'New parent profile verified', 'Purchase order PO-1042 approved']) }
  const addEvent = (event: string) => setEvents((current) => [`${event} · just now`, ...current].slice(0, 4))

  return (
    <DemoFrame title="Crestview Cloud ERP" label="Tenant-safe sample workspace · no data is saved" onReset={reset}>
      <div className="erp-demo">
        <aside className="erp-demo__nav" aria-label="ERP demo sections">
          <div className="erp-demo__mark"><GraduationCap /><span>Crestview<br /><small>Operations</small></span></div>
          {erpSections.map((item) => {
            const Icon = item.icon
            return <button key={item.id} type="button" aria-pressed={section === item.id} onClick={() => setSection(item.id)}><Icon />{item.label}</button>
          })}
          <p><ShieldCheck /> Role-aware sample data</p>
        </aside>
        <div className="erp-demo__main">
          <div className="demo-toolbar"><div><span>Workspace</span><b>Accra Campus / Administration</b></div><button type="button" aria-label="Demo notifications"><Bell /></button></div>
          {section === 'overview' && <>
            <div className="demo-heading"><div><p>Operations snapshot</p><h3>Today’s work, in one place.</h3></div><span className="demo-live"><i />Live sample</span></div>
            <div className="erp-metrics">
              <article><UsersRound /><span>Active learners</span><strong>1,284</strong><small>+24 this term</small></article>
              <article><BarChart3 /><span>Fees collected</span><strong>{formatGhs(284_600)}</strong><small>78% of term target</small></article>
              <article><ClipboardCheck /><span>Open approvals</span><strong>{admissions + 4}</strong><small>{admissions} admissions awaiting review</small></article>
              <article><PackageCheck /><span>Inventory health</span><strong>{stock}</strong><small>Controllers available</small></article>
            </div>
            <div className="erp-demo__split">
              <section className="demo-panel"><div className="demo-panel__title"><span>Priority queue</span><small>Owner</small></div>{['Review admissions', 'Confirm fee waiver', 'Approve supplier request'].map((task, index) => <button className="demo-list-row" key={task} type="button" onClick={() => { if (index === 0 && admissions > 0) setAdmissions((value) => value - 1); addEvent(`${task} opened`) }}><span><b>{task}</b><small>{index === 0 ? 'Admissions' : index === 1 ? 'Finance' : 'Procurement'}</small></span><i>{index === 0 ? admissions : index + 1}</i></button>)}</section>
              <section className="demo-panel"><div className="demo-panel__title"><span>Audit trail</span><small>Immutable sample events</small></div><ol className="demo-audit-list">{events.map((event) => <li key={event}><CheckCircle2 />{event}</li>)}</ol></section>
            </div>
          </>}
          {section === 'students' && <section className="demo-panel demo-table-panel"><div className="demo-panel__title"><span>Learner directory</span><button type="button" onClick={() => addEvent('Student directory exported')}>Export</button></div><table><thead><tr><th>Learner</th><th>Class</th><th>Guardian status</th><th></th></tr></thead><tbody>{[['Ama Mensah', 'Primary 6', 'Verified'], ['Kojo Asante', 'JHS 2', 'Verified'], ['Esi Agyeman', 'Primary 4', 'Review']].map(([name, level, guardian]) => <tr key={name}><td><b>{name}</b><small>CV-2026-{name.slice(0, 2).toUpperCase()}</small></td><td>{level}</td><td><span className={guardian === 'Verified' ? 'demo-tag demo-tag--good' : 'demo-tag'}>{guardian}</span></td><td><button type="button" onClick={() => addEvent(`${name} profile opened`)}>View</button></td></tr>)}</tbody></table></section>}
          {section === 'finance' && <section className="demo-panel demo-finance"><div><p>Current collection</p><strong>{formatGhs(284_600)}</strong><span>+9.4% vs last week</span></div><div className="demo-bars" aria-label="Weekly collection chart">{[42, 57, 49, 78, 67, 88, 73].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><Button onClick={() => { setInvoiceCount((value) => value + 1); addEvent(`Invoice INV-${1040 + invoiceCount} issued`) }}>Issue sample invoice</Button><small>{invoiceCount} invoices currently open in this sample.</small></section>}
          {section === 'inventory' && <section className="demo-panel demo-inventory"><div><Box /><div><p>Solar controllers · Accra warehouse</p><strong>{stock} available</strong><small>Reorder point: 20 units</small></div></div><div className="demo-actions"><Button variant="secondary" onClick={() => { setStock((value) => value + 12); addEvent('Purchase receipt recorded · 12 controllers') }}>Receive stock</Button><Button onClick={() => { if (stock > 0) { setStock((value) => value - 1); addEvent('Dispatch recorded · 1 controller') } }} disabled={stock === 0}>Record dispatch</Button></div></section>}
          {section === 'workflows' && <section className="demo-panel demo-workflows">{['Admission review', 'Supplier onboarding', 'Fee exception'].map((workflow, index) => <article key={workflow}><span>0{index + 1}</span><div><b>{workflow}</b><small>{index === 0 ? `${admissions} records awaiting a decision` : 'Awaiting assigned reviewer'}</small></div><button type="button" onClick={() => { if (index === 0 && admissions > 0) setAdmissions((value) => value - 1); addEvent(`${workflow} advanced`) }}>Advance</button></article>)}</section>}
        </div>
      </div>
    </DemoFrame>
  )
}

type EvidenceState = 'Needs review' | 'Verified' | 'Flagged'
const evidenceSeed: Array<{ id: string; name: string; type: string; variance: string; state: EvidenceState }> = [
  { id: 'EVD-204', name: 'Steel delivery note', type: 'Delivery evidence', variance: '+12.0%', state: 'Needs review' },
  { id: 'EVD-205', name: 'Cement supplier invoice', type: 'Invoice', variance: '+3.4%', state: 'Verified' },
  { id: 'EVD-206', name: 'Rebar quotation revision', type: 'Quote', variance: '+18.4%', state: 'Flagged' },
  { id: 'EVD-207', name: 'Site receipt bundle', type: 'Receipt', variance: '+0.8%', state: 'Needs review' },
]

function BuildProofDemo() {
  const [evidence, setEvidence] = useState(evidenceSeed)
  const [filter, setFilter] = useState<'All' | EvidenceState>('All')
  const [selected, setSelected] = useState(evidenceSeed[0].id)
  const selectedEvidence = evidence.find((item) => item.id === selected) ?? evidence[0]
  const shownEvidence = evidence.filter((item) => filter === 'All' || item.state === filter)
  const updateState = (state: EvidenceState) => setEvidence((items) => items.map((item) => item.id === selected ? { ...item, state } : item))

  return (
    <DemoFrame title="BuildProof AI" label="Construction evidence review · controlled sample records" onReset={() => { setEvidence(evidenceSeed); setFilter('All'); setSelected(evidenceSeed[0].id) }}>
      <div className="buildproof-demo">
        <aside className="buildproof-demo__side"><div className="buildproof-demo__brand"><FileWarning /><span>BuildProof<br /><small>Evidence console</small></span></div><button type="button" className="is-active"><FolderOpen /> Review queue <b>{evidence.filter((item) => item.state === 'Needs review' || item.state === 'Flagged').length}</b></button><button type="button"><BarChart3 /> Variance map</button><button type="button"><ShieldCheck /> Audit log</button><small>Sample project<br /><b>North Ridge Retail Shell</b></small></aside>
        <div className="buildproof-demo__main">
          <div className="demo-toolbar"><div><span>Evidence review</span><b>Material controls</b></div><button type="button"><Search /> Search records</button></div>
          <div className="risk-summary"><article><span>Documents received</span><strong>36</strong><small>4 in review queue</small></article><article><span>Variance exposure</span><strong>{formatGhs(38_400)}</strong><small>Across 3 materials</small></article><article><span>Evidence coverage</span><strong>91%</strong><small>2 delivery records missing</small></article></div>
          <div className="evidence-toolbar"><div role="group" aria-label="Filter evidence">{(['All', 'Needs review', 'Flagged', 'Verified'] as const).map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)}>{option}</button>)}</div><button type="button" className="evidence-upload"><Upload /> Add sample evidence</button></div>
          <div className="evidence-layout"><div className="evidence-list">{shownEvidence.map((item) => <button key={item.id} type="button" aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}><span className={`evidence-state evidence-state--${item.state.replaceAll(' ', '-').toLowerCase()}`} /><div><b>{item.name}</b><small>{item.id} · {item.type}</small></div><strong>{item.variance}</strong></button>)}</div>
            <section className="evidence-detail"><div className="evidence-detail__title"><div><span>{selectedEvidence.type}</span><h3>{selectedEvidence.name}</h3><small>{selectedEvidence.id} · Supplied 12 Sep 2026</small></div><span className={`demo-tag ${selectedEvidence.state === 'Verified' ? 'demo-tag--good' : selectedEvidence.state === 'Flagged' ? 'demo-tag--alert' : ''}`}>{selectedEvidence.state}</span></div><div className="evidence-detail__comparison"><div><span>Planned unit rate</span><b>{formatGhs(245)}</b></div><div><span>Submitted unit rate</span><b>{formatGhs(selectedEvidence.state === 'Flagged' ? 290 : 253)}</b></div><div><span>Supporting files</span><b>3 verified</b></div></div><p><FileCheck2 /> Reconciliation compares the submitted evidence against the controlled BoQ revision and receipt chain.</p><div className="evidence-detail__actions"><Button variant="secondary" onClick={() => updateState('Verified')}>Verify evidence</Button><Button onClick={() => updateState('Flagged')}>Flag for review</Button></div></section></div>
        </div>
      </div>
    </DemoFrame>
  )
}

const materials = {
  perovskite: { label: 'Perovskite absorber', base: 78, hue: 'violet' },
  silicon: { label: 'Silicon cell', base: 91, hue: 'blue' },
  organic: { label: 'Organic photovoltaic', base: 64, hue: 'orange' },
} as const

function downloadDemoResult(payload: object) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'energymat-sample-result.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

function EnergyMatDemo() {
  const [material, setMaterial] = useState<keyof typeof materials>('perovskite')
  const [humidity, setHumidity] = useState(42)
  const [temperature, setTemperature] = useState(58)
  const [uv, setUv] = useState(6)
  const [runs, setRuns] = useState(1)
  const selectedMaterial = materials[material]
  const predicted = useMemo(() => Math.max(31, Math.min(96, Math.round(selectedMaterial.base - humidity * 0.16 - temperature * 0.12 - uv * 1.5))), [humidity, selectedMaterial.base, temperature, uv])
  const confidence = Math.max(64, Math.round(94 - Math.abs(humidity - 45) * 0.12 - Math.abs(temperature - 55) * 0.18))
  const reset = () => { setMaterial('perovskite'); setHumidity(42); setTemperature(58); setUv(6); setRuns(1) }

  return (
    <DemoFrame title="EnergyMat ML Studio" label="Illustrative browser-side prediction · no research claim" onReset={reset}>
      <div className="energy-demo">
        <aside className="energy-demo__controls"><div><FlaskConical /><span>Experiment setup</span></div><label>Material system<select value={material} onChange={(event) => setMaterial(event.target.value as keyof typeof materials)}>{Object.entries(materials).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><label>Humidity stress <b>{humidity}%</b><input aria-label="Humidity stress" type="range" min="10" max="90" value={humidity} onChange={(event) => setHumidity(Number(event.target.value))} /></label><label>Thermal stress <b>{temperature}°C</b><input aria-label="Thermal stress" type="range" min="20" max="100" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></label><label>UV intensity <b>{uv}/10</b><input aria-label="UV intensity" type="range" min="1" max="10" value={uv} onChange={(event) => setUv(Number(event.target.value))} /></label><Button onClick={() => setRuns((value) => value + 1)}><Play /> Run sample model</Button><p><ShieldCheck /> The model is illustrative. Inputs remain in this browser.</p></aside>
        <div className="energy-demo__main"><div className="demo-toolbar"><div><span>Experiment {String(runs).padStart(3, '0')}</span><b>Stability forecast</b></div><span className="demo-live"><i /> Local inference</span></div><div className="energy-result"><div><span>Predicted retained efficiency</span><strong>{predicted}<small>%</small></strong><p>after 500 accelerated ageing hours</p></div><div className="energy-gauge" style={{ '--score': `${predicted}%` } as CSSProperties}><span>{predicted}%</span></div></div><div className="energy-grid"><section><div className="demo-panel__title"><span>Feature influence</span><small>Relative contribution</small></div>{[['Thermal stress', temperature], ['Humidity', humidity], ['UV intensity', uv * 10], ['Material class', 66]].map(([name, value]) => <div className="feature-row" key={String(name)}><span>{name}</span><i><b style={{ width: `${Math.min(96, Number(value))}%` }} /></i><small>{Math.min(96, Number(value))}%</small></div>)}</section><section><div className="demo-panel__title"><span>Model agreement</span><small>{confidence}% confidence</small></div><div className="agreement-chart">{[predicted - 4, predicted + 2, predicted - 1, predicted + 3, predicted].map((value, index) => <i key={index} style={{ height: `${Math.max(28, value)}%` }}><small>{['RF', 'XGB', 'NN', 'SVR', 'ENS'][index]}</small></i>)}</div></section></div><div className="energy-actions"><span><SlidersHorizontal /> Adjust parameters then rerun to compare the result.</span><button type="button" onClick={() => downloadDemoResult({ material: selectedMaterial.label, humidity, temperature, uvIntensity: uv, predictedRetainedEfficiency: predicted, confidence, notice: 'Illustrative AuraFlow EnergyMat ML demo.' })}><Download /> Download sample result</button></div></div>
      </div>
    </DemoFrame>
  )
}

function FieldSyncDemo() {
  const [online, setOnline] = useState(false)
  const [asset, setAsset] = useState('')
  const [captured, setCaptured] = useState<Array<{ id: string; note: string; attachment?: string }>>([])
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)
  const queue = online ? 0 : captured.length
  const capture = () => {
    const id = asset.trim().toUpperCase() || `AF-${2048 + captured.length}`
    setCaptured((current) => [{ id, note: note.trim() || 'Routine asset verification', attachment }, ...current])
    setAsset(''); setNote(''); setAttachment(undefined)
  }
  const reset = () => { setOnline(false); setAsset(''); setCaptured([]); setNote(''); setAttachment(undefined) }

  return (
    <DemoFrame title="FieldSync Mobile" label="Offline-first capture simulation · device data stays local" onReset={reset}>
      <div className="field-demo">
        <section className="field-phone"><header><span><Radio /> FieldSync</span><button type="button" onClick={() => setOnline((value) => !value)}>{online ? <><Wifi /> Online</> : <><WifiOff /> Offline</>}</button></header><div className="field-phone__signal"><MapPin /><div><b>Takoradi plant perimeter</b><small>5.0158° N, 1.7248° W · demo location</small></div></div><label className="field-scan"><QrCode /><span>Asset or QR reference</span><input value={asset} onChange={(event) => setAsset(event.target.value)} placeholder="e.g. AF-2048" /></label><label className="field-note">Inspection note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe the observation..." maxLength={180} /></label><input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => setAttachment(event.target.files?.[0]?.name)} /><button type="button" className="field-attachment" onClick={() => fileInput.current?.click()}><Upload />{attachment ?? 'Attach an inspection photo'}</button><Button onClick={capture}><ScanLine /> Capture verification</Button></section>
        <section className="field-demo__queue"><div className="demo-toolbar"><div><span>Synchronisation queue</span><b>{online ? 'Connected to operations' : 'Working offline'}</b></div><button type="button" onClick={() => setOnline((value) => !value)}>{online ? <CloudOff /> : <CloudUpload />}</button></div><div className="field-sync-state"><div><span>{online ? 'Cloud connection ready' : 'Changes stored on device'}</span><strong>{queue}</strong><small>{online ? 'queued records cleared' : 'records waiting for a connection'}</small></div><button type="button" disabled={!online || captured.length === 0} onClick={() => setCaptured([])}><CloudUpload /> Sync now</button></div><div className="field-capture-list">{captured.length === 0 ? <div className="field-empty"><QrCode /><b>No captured records yet</b><span>Use the mobile capture panel to create a local sample record.</span></div> : captured.map((item, index) => <article key={`${item.id}-${index}`}><span><CheckCircle2 /></span><div><b>{item.id}</b><small>{item.note}</small>{item.attachment && <em>{item.attachment}</em>}</div><i>{online ? 'Ready' : 'Queued'}</i></article>)}</div></section>
      </div>
    </DemoFrame>
  )
}

export function LabDemo({ slug }: DemoProps) {
  if (slug === 'cloud-erp') return <CloudErpDemo />
  if (slug === 'buildproof-ai') return <BuildProofDemo />
  if (slug === 'energymat-ml') return <EnergyMatDemo />
  return <FieldSyncDemo />
}
