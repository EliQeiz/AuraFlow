import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  ExternalLink,
  FileWarning,
  MapPin,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SEOHead } from '../components/shared/SEOHead'
import { Button, ButtonLink } from '../components/ui/Button'
import { getPortfolioLab, portfolioLabs, type PortfolioLab } from '../data/labs'
import { getProductUrl } from '../lib/productLinks'

const icons = {
  'cloud-erp': Boxes,
  'buildproof-ai': FileWarning,
  'energymat-ml': Cpu,
  'fieldsync-mobile': Smartphone,
}

function LabCard({ lab }: { lab: PortfolioLab }) {
  const Icon = icons[lab.slug]
  return (
    <article className="lab-card">
      <div className={`lab-card__visual lab-card__visual--${lab.slug}`}>
        <span className="lab-card__index">{lab.index}</span>
        <Icon />
        <div className="lab-card__screen" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
      </div>
      <div className="lab-card__body">
        <span className={`lab-status lab-status--${lab.status}`}>{lab.statusLabel}</span>
        <p className="eyebrow">{lab.category}</p>
        <h2>{lab.title}</h2>
        <p>{lab.summary}</p>
        <div className="lab-card__footer">
          <span>{lab.metric}</span>
          <ButtonLink to={`/labs/${lab.slug}`} variant="secondary">
            Explore case study <ArrowRight />
          </ButtonLink>
        </div>
      </div>
    </article>
  )
}

function ErpSandbox() {
  const [stock, setStock] = useState(28)
  const [events, setEvents] = useState<string[]>(['Purchase order approved by Ama Mensah'])
  function dispatch() {
    if (stock <= 0) return
    setStock((current) => current - 1)
    setEvents((current) => [`Dispatch recorded · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, ...current].slice(0, 3))
  }
  return (
    <div className="lab-sandbox lab-erp" aria-label="Interactive ERP sandbox">
      <header><span><Boxes /> Operations control</span><small>Tenant demo · sandbox data</small></header>
      <div className="lab-erp__metrics">
        <div><span>Available stock</span><strong>{stock}</strong><small>Solar controllers · Accra</small></div>
        <div><span>Orders to fulfil</span><strong>06</strong><small>Two need approval</small></div>
        <div><span>Audit coverage</span><strong>100%</strong><small>All demo events captured</small></div>
      </div>
      <section className="lab-erp__action">
        <div><PackageCheck /><span><b>Warehouse dispatch</b><small>Record a sample inventory movement and audit event.</small></span></div>
        <Button onClick={dispatch} disabled={stock === 0}>Record dispatch</Button>
      </section>
      <ol className="lab-event-list">{events.map((event) => <li key={event}><CheckCircle2 /> {event}</li>)}</ol>
    </div>
  )
}

function BuildProofSandbox() {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="lab-sandbox lab-buildproof" aria-label="Interactive construction audit sandbox">
      <header><span><FileWarning /> Evidence review</span><small>Sample BoQ · demo data</small></header>
      {!loaded ? (
        <div className="lab-empty-action"><Upload /><h3>Review a sample materials audit</h3><p>Load a controlled BoQ, supplier receipts, and delivery confirmations.</p><Button onClick={() => setLoaded(true)}>Load audit</Button></div>
      ) : (
        <>
          <div className="lab-risk-grid">
            <div className="is-alert"><span>Price variance</span><strong>+18.4%</strong><small>Rebar · supplier comparison</small></div>
            <div className="is-alert"><span>Quantity drift</span><strong>+12 bags</strong><small>Cement · planned vs received</small></div>
            <div><span>Confirmed deliveries</span><strong>17/19</strong><small>Two require evidence</small></div>
          </div>
          <section className="lab-burn"><div><span>Material burn rate</span><b>Within review threshold</b></div><div className="lab-bars">{[44, 62, 51, 77, 66, 84, 71].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></section>
        </>
      )}
    </div>
  )
}

function EnergySandbox() {
  const [humidity, setHumidity] = useState(44)
  const [temperature, setTemperature] = useState(61)
  const result = useMemo(() => Math.max(48, Math.round(91 - humidity * 0.21 - temperature * 0.12)), [humidity, temperature])
  return (
    <div className="lab-sandbox lab-energy" aria-label="Interactive material stability predictor">
      <header><span><Sparkles /> Stability predictor</span><small>Illustrative inference sandbox</small></header>
      <div className="lab-energy__grid">
        <div className="lab-sliders">
          <label>Humidity stress <b>{humidity}%</b><input aria-label="Humidity stress" type="range" min="15" max="85" value={humidity} onChange={(event) => setHumidity(Number(event.target.value))} /></label>
          <label>Thermal stress <b>{temperature}°C</b><input aria-label="Thermal stress" type="range" min="25" max="95" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></label>
          <p><ShieldCheck /> Inputs remain local to this demonstration.</p>
        </div>
        <div className="lab-prediction"><span>Estimated T80 stability</span><strong>{result}<small>days</small></strong><p>Model consensus: <b>moderate confidence</b></p><div className="lab-model-lines"><i style={{ width: `${Math.min(94, result + 4)}%` }} /><i style={{ width: `${Math.min(94, result - 5)}%` }} /><i style={{ width: `${Math.min(94, result + 1)}%` }} /></div></div>
      </div>
    </div>
  )
}

function FieldSandbox() {
  const [online, setOnline] = useState(false)
  const [queued, setQueued] = useState(3)
  const [scanned, setScanned] = useState(false)
  function sync() { if (online) setQueued(0) }
  return (
    <div className="lab-sandbox lab-field" aria-label="Interactive offline field capture sandbox">
      <header><span><Smartphone /> Field capture</span><button className="lab-status-toggle" onClick={() => setOnline((value) => !value)}>{online ? <><Wifi /> Online</> : <><WifiOff /> Offline</>}</button></header>
      <div className="lab-field__phone">
        <div className="lab-field__status"><span>{online ? 'Connected to AuraFlow' : 'Working offline'}</span><small>{queued} queued record{queued === 1 ? '' : 's'}</small></div>
        <button className="lab-qr" onClick={() => { setScanned(true); if (!online) setQueued((value) => value + 1) }}><QrCode /><span>{scanned ? 'ASSET · AF-2048' : 'Scan a site asset'}</span></button>
        {scanned && <p className="lab-field__capture"><MapPin /> Site verified · 5.6037° N, 0.1870° W</p>}
      </div>
      <Button variant="secondary" onClick={sync} disabled={!online || queued === 0}>{queued ? 'Synchronise queued records' : 'Everything is synchronised'}</Button>
    </div>
  )
}

function Sandbox({ lab }: { lab: PortfolioLab }) {
  if (lab.slug === 'cloud-erp') return <ErpSandbox />
  if (lab.slug === 'buildproof-ai') return <BuildProofSandbox />
  if (lab.slug === 'energymat-ml') return <EnergySandbox />
  return <FieldSandbox />
}

function Architecture({ lab }: { lab: PortfolioLab }) {
  return (
    <section className="lab-architecture">
      <div><p className="eyebrow">System architecture</p><h2>Designed as a system, not a screen.</h2></div>
      <div className="lab-architecture__flow" aria-label={`${lab.title} architecture`}>
        {lab.architecture.map((part, index) => <div key={part}><span>{part}</span>{index < lab.architecture.length - 1 && <ChevronRight aria-hidden="true" />}</div>)}
      </div>
    </section>
  )
}

function LabDetail({ lab }: { lab: PortfolioLab }) {
  const Icon = icons[lab.slug]
  const productUrl = lab.productKey ? getProductUrl(lab.productKey) : undefined
  return (
    <main className="labs-page">
      <SEOHead title={`${lab.title} | AuraFlow Labs`} description={lab.summary} />
      <section className="labs-detail-hero section-shell">
        <Link to="/labs" className="labs-back"><ArrowLeft /> All flagship systems</Link>
        <div className="labs-detail-hero__grid">
          <div><p className="eyebrow">{lab.eyebrow}</p><h1>{lab.title}</h1><p className="labs-detail-hero__lede">{lab.summary}</p><div className="labs-detail-hero__facts"><span><Icon /> {lab.category}</span><span><BarChart3 /> {lab.metric}</span></div></div>
          <Sandbox lab={lab} />
        </div>
      </section>
      <Architecture lab={lab} />
      <section className="section-shell lab-product-module">
        <div>
          <p className="eyebrow">Product module status</p>
          <h2>{lab.status === 'verified' ? 'A buildable product, not a concept.' : lab.status === 'in-progress' ? 'A working product becoming a reusable core.' : 'A defined build, not a deployed claim.'}</h2>
          <p className={`lab-status lab-status--${lab.status}`}>{lab.statusLabel}</p>
          {productUrl ? (
            <a href={productUrl} target="_blank" rel="noreferrer" className="lab-external-link">Open the product <ExternalLink /></a>
          ) : lab.productKey ? (
            <p className="lab-product-note">A public product address can be connected securely through this deployment's environment configuration once the app is deployed.</p>
          ) : (
            <p className="lab-product-note">This direction is retained as a planned portfolio build until its source repository and deployment are available.</p>
          )}
        </div>
        <div className="lab-module-list">
          {lab.modules.map((module, index) => <span key={module}><b>{String(index + 1).padStart(2, '0')}</b>{module}</span>)}
        </div>
      </section>
      <section className="section-shell lab-case-grid">
        <article><p className="eyebrow">The problem</p><h2>What this system has to solve.</h2><p>{lab.problem}</p></article>
        <article><p className="eyebrow">The outcome</p><h2>What a usable answer looks like.</h2><p>{lab.outcome}</p></article>
        <article className="lab-capabilities"><p className="eyebrow">Core capabilities</p>{lab.capabilities.map((capability) => <span key={capability}><CheckCircle2 /> {capability}</span>)}</article>
      </section>
      <section className="section-shell lab-stack-section"><div><p className="eyebrow">Engineering stack</p><h2>Tools selected for the problem.</h2></div><div className="lab-stack-list">{lab.stack.map((item) => <span key={item}><Database /> {item}</span>)}</div></section>
      <section className="lab-contact-band"><div className="section-shell"><div><p className="eyebrow">Build the next proof point</p><h2>Have a problem worth modelling?</h2><p>Discuss a system, prototype, audit tool, or applied machine-learning product with AuraFlow.</p></div><ButtonLink to="/contact">Start a conversation <ArrowRight /></ButtonLink></div></section>
    </main>
  )
}

function LabIndex() {
  return (
    <main className="labs-page">
      <SEOHead title="AuraFlow Labs | Flagship Engineering Systems" description="Four portfolio systems spanning multi-tenant operations, industrial audit, applied machine learning, and offline-first mobile workflows." />
      <section className="labs-hero section-shell"><p className="eyebrow">AuraFlow Labs · Ghana to global</p><h1>Engineering systems that hold up in the real world.</h1><p>Explore four flagship builds that demonstrate secure multi-tenant workflows, industrial intelligence, applied machine learning, and resilient mobile operations.</p><div className="hero-actions"><ButtonLink to="/labs/cloud-erp">Explore flagship systems <ArrowRight /></ButtonLink><ButtonLink to="/about" variant="secondary">Meet the engineer</ButtonLink></div></section>
      <section className="section-shell labs-grid">{portfolioLabs.map((lab) => <LabCard key={lab.slug} lab={lab} />)}</section>
      <section className="labs-method"><div className="section-shell"><p className="eyebrow">How the work is presented</p><h2>Less marketing theatre. More evidence.</h2><div>{[['01', 'Interactive sandbox', 'Explore a controlled workflow without creating an account.'], ['02', 'Architecture context', 'See the boundaries between the user interface, trusted services, data, and events.'], ['03', 'Technical case study', 'Understand the trade-offs, the stack, and the problem each system addresses.']].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    </main>
  )
}

export default function Labs() {
  const { slug } = useParams()
  const lab = getPortfolioLab(slug)
  if (slug && !lab) return <main className="section-shell py-24"><h1>Case study not found</h1><ButtonLink to="/labs" className="mt-6">See all flagship systems</ButtonLink></main>
  return lab ? <LabDetail lab={lab} /> : <LabIndex />
}
