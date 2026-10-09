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
  Smartphone,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { SEOHead } from '../components/shared/SEOHead'
import { ButtonLink } from '../components/ui/Button'
import { ProductRecording } from '../components/shared/ProductRecording'
import { LabDemo } from '../components/labs/LabDemos'
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
      {lab.recording ? (
        <ProductRecording src={lab.recording.src} title={lab.title} label={lab.recording.label} duration={lab.recording.duration} controls={false} />
      ) : (
        <div className="lab-card__status-visual">
          <span>{lab.index}</span><Icon /><p>{lab.status === 'planned' ? 'Planned product direction' : 'Source available for review'}</p>
        </div>
      )}
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
          {lab.recording ? (
            <ProductRecording src={lab.recording.src} title={lab.title} label={lab.recording.label} duration={lab.recording.duration} />
          ) : <aside className="lab-demo-teaser"><Icon /><span>{lab.statusLabel}</span><strong>Interactive concept demo below</strong><p>Explore the designed workflow using controlled browser-only sample data.</p></aside>}
        </div>
      </section>
      <section className="section-shell lab-demo-section">
        <div className="lab-demo-section__heading"><p className="eyebrow">Explore the workflow</p><h2>Try the core product interaction.</h2><p>All controls use sample data in this browser. Nothing is sent to a product backend or stored after a reset.</p></div>
        <LabDemo slug={lab.slug} />
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
      <section className="labs-hero section-shell"><p className="eyebrow">AuraFlow Labs · Ghana to global</p><h1>Engineering systems that hold up in the real world.</h1><p>Explore two active product codebases with recorded walkthroughs, alongside two clearly marked research directions in industrial intelligence, applied machine learning, and field operations.</p><div className="hero-actions"><ButtonLink to="/labs/cloud-erp">Explore flagship systems <ArrowRight /></ButtonLink><ButtonLink to="/about" variant="secondary">Meet the engineer</ButtonLink></div></section>
      <section className="section-shell labs-grid">{portfolioLabs.map((lab) => <LabCard key={lab.slug} lab={lab} />)}</section>
      <section className="labs-method"><div className="section-shell"><p className="eyebrow">How the work is presented</p><h2>Less marketing theatre. More evidence.</h2><div>{[['01', 'Source recordings', 'Watch real product walkthroughs where a released product recording is available.'], ['02', 'Architecture context', 'See the boundaries between the user interface, trusted services, data, and events.'], ['03', 'Technical case study', 'Understand the trade-offs, the stack, and the problem each system addresses.']].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    </main>
  )
}

export default function Labs() {
  const { slug } = useParams()
  const lab = getPortfolioLab(slug)
  if (slug && !lab) return <main className="section-shell py-24"><h1>Case study not found</h1><ButtonLink to="/labs" className="mt-6">See all flagship systems</ButtonLink></main>
  return lab ? <LabDetail lab={lab} /> : <LabIndex />
}
